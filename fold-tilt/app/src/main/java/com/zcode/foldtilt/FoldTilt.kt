package com.zcode.foldtilt

import android.graphics.RenderEffect
import android.graphics.RuntimeShader
import android.os.Build
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asComposeRenderEffect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.sqrt

/**
 * 特效的可调参数与实时读数（全部为 Compose 状态，供绘制阶段读取）。
 */
class TiltUiState {
    /** 当前不平行量（由 TiltTracker 写入）——驱动透视跟随 */
    var delta by mutableStateOf(TiltDelta.ZERO)

    /** 持续倾角（设备相对「清晰基准面」的角度）——驱动模糊，握住倾斜姿势时持续存在 */
    var blurDelta by mutableStateOf(TiltDelta.ZERO)

    /** 视觉放大倍数：把不平行角放大后再做透视 */
    var gain by mutableFloatStateOf(2.0f)

    /** 虚拟平面的滞后时间常数（毫秒）：越大越"重"，收敛越慢 */
    var tauMs by mutableFloatStateOf(450f)

    /** 反转 Y 轴方向（不同设备姿态约定 / 握持习惯差异） */
    var invertY by mutableStateOf(false)

    /** 最大透视旋转角（度） */
    var maxAngleDeg by mutableFloatStateOf(25f)

    /** 最大模糊半径（像素） */
    var blurStrengthPx by mutableFloatStateOf(42f)

    /** 起雾曲线指数：越小越早起雾（0.55 ≈ 开合全程有明显雾感） */
    var blurExp by mutableFloatStateOf(0.55f)

    /** 整体雾基底：倾斜时全屏先起一层轻雾，远端再按景深加深（更接近苹果 blend 观感） */
    var baseFog by mutableFloatStateOf(0.3f)

    /** 液态玻璃感：远端压暗 + 冷色调（对标 iPhone Duo 的玻璃融化观感） */
    var glass by mutableStateOf(true)

    /** 参与变换的轴 */
    var axisMode by mutableStateOf(AxisMode.ALL)

    /** 是否使用手动模拟角度代替真实传感器 */
    var simulate by mutableStateOf(false)

    /** 手动模拟角度（度） */
    var simulateDeg by mutableFloatStateOf(0f)

    /** 摆动演示：自动正弦摆动并经真实滞后管线（完整展示动态跟随与模糊换边） */
    var swing by mutableStateOf(false)

    /** 透视强度：相机距离越小透视越强（相对屏幕密度的倍数） */
    var cameraDistanceFactor by mutableFloatStateOf(8f)

    // ---- 调试读数 ----
    var liveAngleDeg by mutableFloatStateOf(0f)
    var liveBlurPx by mutableFloatStateOf(0f)
    var liveRotationYDeg by mutableFloatStateOf(0f)
}

/**
 * 液态玻璃景深模糊（AGSL，API 33+），对标 iPhone Duo 开合观感：
 * 大半径高斯雾化 + 梯度方向感 + 远端压暗冷调（玻璃融化感）。
 */
private const val AGSL_GRADIENT_BLUR = """
uniform shader content;
uniform float maxRadius;
uniform float2 center;
uniform float2 halfSize;
uniform float2 grad;
uniform float baseFog;
uniform float glass;

half4 main(float2 coord) {
    float2 n = (coord - center) / max(halfSize, float2(1.0));
    float amp = length(grad);
    // 整体雾基底（跟随倾斜幅度）+ 方向性景深梯度：近端也有雾、远端更深
    float t = clamp(dot(n, grad / max(amp, 1e-4)) * amp + baseFog * amp, 0.0, 1.0);
    float r = maxRadius * t;
    float2 dir = grad / max(amp, 1e-4);
    float4 acc = float4(content.eval(coord));
    float wsum = 1.0;
    for (int i = 1; i <= 8; i++) {
        float fi = float(i) / 8.0;
        float w = exp(-fi * fi * 2.0) * t;
        float2 off = dir * (fi * r);
        acc += float4(content.eval(coord + off)) * w;
        acc += float4(content.eval(coord - off)) * w;
        wsum += 2.0 * w;
    }
    half4 c = half4(acc / wsum);
    if (glass > 0.5) {
        c.rgb *= (1.0 - 0.14 * t);
        c.rgb = mix(c.rgb, c.rgb * half3(0.90, 0.97, 1.10), 0.35 * t);
    }
    return c;
}
"""

/** 由不平行量算出的最终视觉参数 */
data class FoldTransform(
    val rotationY: Float,
    val rotationX: Float,
    val rotationZ: Float,
    val blurPx: Float,
    /** 模糊梯度向量（x=左右倾, y=前后仰），幅值即模糊强度归一值 */
    val gradX: Float,
    val gradY: Float,
)

/** 纯函数：不平行量 → 透视旋转角与模糊量（绘制阶段与读数面板共用）
 *
 * 透视 rotation：由 delta（滞后平面 vs 设备）驱动——瞬态跟随动画；
 * 模糊 blur：由 blurDelta（设备相对清晰基准面的持续倾角）驱动——
 * 握住倾斜姿势时持续存在，回到基准面（校准时的正面朝向）才消失。
 */
fun computeFoldTransform(state: TiltUiState): FoldTransform {
    val d = state.delta
    val b = state.blurDelta
    val gain = state.gain
    val maxAngle = state.maxAngleDeg.coerceAtLeast(1f)

    fun deg(rad: Float) = Math.toDegrees(rad.toDouble()).toFloat() * gain

    val ryRaw = when (state.axisMode) {
        AxisMode.Y, AxisMode.ALL -> deg(d.yawComponent)
        else -> 0f
    }
    val rxRaw = when (state.axisMode) {
        AxisMode.X, AxisMode.ALL -> deg(d.pitchComponent)
        else -> 0f
    }
    val rzRaw = when (state.axisMode) {
        AxisMode.Z, AxisMode.ALL -> deg(d.rollComponent)
        else -> 0f
    }

    val ry = ryRaw.coerceIn(-maxAngle, maxAngle)
    val rx = rxRaw.coerceIn(-maxAngle, maxAngle)
    val rz = rzRaw.coerceIn(-maxAngle, maxAngle)

    // 模糊：持续倾角（度）归一化后经起雾曲线；<4° 静音区（手抖/微噪声不产生雾）
    val bDeg = Math.toDegrees(b.angle.toDouble()).toFloat()
    val effective = (bDeg - 4f).coerceAtLeast(0f)
    val ampLin = (effective / maxAngle).coerceIn(0f, 1f)
    val amp = ampLin.pow(state.blurExp)
    val blurPx = state.blurStrengthPx * amp

    // 渐糊方向 = 倾斜轴在屏幕坐标系的投影（axisY→横向, axisX→纵向）
    val ax = b.axisX
    val ay = b.axisY
    val len = sqrt(ax * ax + ay * ay)
    val gradX = if (len < 1e-4f) 0f else ay / len * amp
    val gradY = if (len < 1e-4f) 0f else -ax / len * amp

    return FoldTransform(ry, rx, rz, blurPx, gradX, gradY)
}

/**
 * 把内容包进「虚拟平面」：跟随设备倾斜但滞后，滞后造成的不平行
 * 产生 3D 透视与越远越模糊的效果。
 *
 * 用法：`FoldTiltContainer(state) { 你的页面内容() }`
 */
@Composable
fun FoldTiltContainer(
    state: TiltUiState,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val shader = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            runCatching { RuntimeShader(AGSL_GRADIENT_BLUR) }
                .onFailure { android.util.Log.e("FoldTilt", "AGSL shader compile FAILED — blur disabled", it) }
                .getOrNull()
        } else {
            android.util.Log.w("FoldTilt", "API < 33, RuntimeShader unavailable — blur disabled")
            null
        }
    }
    val shaderEffect = remember(shader) {
        shader?.let {
            runCatching {
                RenderEffect.createRuntimeShaderEffect(it, "content").asComposeRenderEffect()
            }.getOrNull()
        }
    }
    var layerWidth by remember { mutableFloatStateOf(1f) }
    var layerHeight by remember { mutableFloatStateOf(1f) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .onSizeChanged {
                layerWidth = it.width.toFloat().coerceAtLeast(1f)
                layerHeight = it.height.toFloat().coerceAtLeast(1f)
            }
            .graphicsLayer {
                // 绘制阶段只读状态、只写着色器 uniform（不写 Compose 状态，避免重绘死循环）
                val t = computeFoldTransform(state)
                rotationY = t.rotationY
                rotationX = t.rotationX
                rotationZ = t.rotationZ
                cameraDistance = state.cameraDistanceFactor * density

                if (shader != null && shaderEffect != null) {
                    shader.setFloatUniform("maxRadius", t.blurPx)
                    shader.setFloatUniform("center", layerWidth / 2f, layerHeight / 2f)
                    shader.setFloatUniform("halfSize", layerWidth / 2f, layerHeight / 2f)
                    shader.setFloatUniform("grad", t.gradX, t.gradY)
                    shader.setFloatUniform("baseFog", state.baseFog)
                    shader.setFloatUniform("glass", if (state.glass) 1f else 0f)
                    renderEffect = shaderEffect
                }
            }
    ) {
        content()
    }
}
