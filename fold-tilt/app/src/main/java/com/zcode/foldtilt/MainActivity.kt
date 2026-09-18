package com.zcode.foldtilt

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.math.sqrt

class MainActivity : ComponentActivity() {

    private val tracker = TiltTracker()
    private val ui = TiltUiState()
    private val mainHandler = Handler(Looper.getMainLooper())

    private var sensorManager: SensorManager? = null
    private var rotationSensor: Sensor? = null
    private var sensorName = "无"

    private var lastReadoutMs = 0L
    private var forceDeltaDeg: Float? = null
    private var forceAxisX = false

    /** 清晰基准面：启动时（或点"校准"时）的设备姿态——回到此朝向即完全清晰 */
    private var refQuat: Quat = Quat.IDENTITY
    private var lastQuat: Quat = Quat.IDENTITY
    private var flatSinceNs = 0L

    /** 首个传感器事件到达时，以用户当下持机姿势为清晰基准（而非芯片默认姿态） */
    private var needRefCapture = true

    private val listener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
            // 模拟/摆动演示期间丢弃真实传感器事件，避免双输入打架
            if (ui.simulate || ui.swing) return
            val v = event.values
            if (v.size < 3) return
            val x = v[0]
            val y = v[1]
            val z = v[2]
            val w = if (v.size >= 4) v[3]
            else sqrt((1f - x * x - y * y - z * z).coerceAtLeast(0f))
            applyPose(Quat(w, x, y, z).normalized(), event.timestamp)
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 调试/自动化入口：
        //   --ez simulate true --ef simulate_deg 25   模拟姿态（会经惯性滞后）
        //   --ef force_delta_deg 25                   直接注入不平行量（跳过传感器与滞后，
        //                                             用于确定性验证渲染效果）
        if (intent?.getBooleanExtra("simulate", false) == true) {
            ui.simulateDeg = intent.getFloatExtra("simulate_deg", 0f)
            ui.simulate = true
        }
        if (intent?.hasExtra("force_delta_deg") == true) {
            forceDeltaDeg = intent.getFloatExtra("force_delta_deg", 0f)
            forceAxisX = intent.getStringExtra("force_axis") == "x"
        }
        // --ez swing true: 启动即开启摆动演示
        if (intent?.getBooleanExtra("swing", false) == true) {
            ui.swing = true
        }

        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        // 优先 Game Rotation Vector：不含磁力计，不受周围磁场干扰，更适合做稳定姿态
        rotationSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR)
        if (rotationSensor == null) {
            rotationSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        }
        sensorName = rotationSensor?.name ?: "无（将使用手动模拟）"

        setContent {
            // 手动模拟：滑块直接注入不平行量（静态，所见即所得）
            LaunchedEffect(ui.simulate) {
                if (ui.simulate) {
                    while (true) {
                        val rad = Math.toRadians(ui.simulateDeg.toDouble()).toFloat()
                        val d = TiltDelta(rad, 0f, 1f, 0f)
                        ui.delta = d
                        ui.blurDelta = d
                        val t = computeFoldTransform(ui)
                        ui.liveAngleDeg = ui.simulateDeg
                        ui.liveRotationYDeg = t.rotationY
                        ui.liveBlurPx = t.blurPx
                        delay(16)
                    }
                }
            }

            // 摆动演示：合成正弦姿态走真实管线（滞后平面 + 持续倾角模糊）
            LaunchedEffect(ui.swing) {
                if (ui.swing) {
                    refQuat = Quat.IDENTITY
                    var phase = 0f
                    while (true) {
                        phase += 0.024f
                        val deg = 22f * kotlin.math.sin(phase)
                        applyPose(Quat.aroundY(deg), System.nanoTime())
                        delay(16)
                    }
                } else {
                    tracker.reset(Quat.IDENTITY)
                    refQuat = Quat.IDENTITY
                }
            }

            Box(Modifier.fillMaxSize().background(Color(0xFF0E1116))) {
                FoldTiltContainer(state = ui) {
                    DemoPage()
                }
                ControlPanel(
                    ui = ui,
                    sensorName = sensorName,
                    onCalibrate = {
                        refQuat = lastQuat
                        flatSinceNs = 0L
                    },
                    modifier = Modifier.align(Alignment.BottomCenter),
                )
            }
        }
    }

    /**
     * 统一姿态入口（真实传感器与摆动演示共用）：
     *   透视 = 滞后平面（TiltTracker）
     *   模糊 = 设备相对 refQuat 的持续倾角（握住倾斜姿势 → 模糊持续）
     */
    private fun applyPose(qIn: Quat, nowNs: Long) {
        mainHandler.post {
            // 调试注入模式：跳过传感器与滞后，直接给定不平行量
            forceDeltaDeg?.let { deg ->                val rad = Math.toRadians(deg.toDouble()).toFloat()
                val d = if (forceAxisX) TiltDelta(rad, 1f, 0f, 0f)
                else TiltDelta(rad, 0f, 1f, 0f)
                ui.delta = d
                ui.blurDelta = d
                val t = computeFoldTransform(ui)
                ui.liveAngleDeg = deg
                ui.liveRotationYDeg = t.rotationY
                ui.liveBlurPx = t.blurPx
                return@post
            }

            // 手动模拟由其循环直接注入；摆动演示通过 applyPose 走本管线
            lastQuat = qIn
            if (needRefCapture) {
                refQuat = qIn          // 以打开应用时的持机姿势为"清晰平面"
                needRefCapture = false
                flatSinceNs = 0L
            }
            tracker.tauMs = ui.tauMs
            tracker.invertY = ui.invertY
            tracker.update(qIn, nowNs)
            ui.delta = tracker.delta

            // 持续倾角：相对 refQuat（半球对齐后取相对旋转，轴变换到设备坐标系）
            var q = qIn
            if (refQuat.dot(q) < 0f) q = q.negated()
            val rel = (refQuat.conj() * q).toTiltDelta()
            ui.blurDelta = rel

            // 自动回正：回到基准面附近（<6°）持续 1.5 秒则重设基准（防漂移余雾）
            val deg = Math.toDegrees(rel.angle.toDouble()).toFloat()
            if (deg < 6f) {
                if (flatSinceNs == 0L) flatSinceNs = nowNs
                else if (nowNs - flatSinceNs > 1_500_000_000L) {
                    refQuat = q
                    flatSinceNs = 0L
                }
            } else {
                flatSinceNs = 0L
            }

            val now = System.currentTimeMillis()
            if (now - lastReadoutMs > 100) {
                lastReadoutMs = now
                val t = computeFoldTransform(ui)
                ui.liveRotationYDeg = t.rotationY
                ui.liveBlurPx = t.blurPx
                ui.liveAngleDeg = deg
                android.util.Log.d(
                    "FoldTilt",
                    "sensor tilt=%.1f d=%.1f ry=%.1f rx=%.1f rz=%.1f blur=%.1f".format(
                        deg, ui.liveAngleDeg, t.rotationY, t.rotationX, t.rotationZ, t.blurPx
                    )
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        rotationSensor?.let {
            sensorManager?.registerListener(listener, it, SensorManager.SENSOR_DELAY_GAME)
        }
        tracker.reset(Quat.IDENTITY)
        needRefCapture = true   // 回前台后以当下姿势重新取基准
        flatSinceNs = 0L
    }

    override fun onPause() {
        super.onPause()
        sensorManager?.unregisterListener(listener)
    }
}

@Composable
private fun ControlPanel(
    ui: TiltUiState,
    sensorName: String,
    onCalibrate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
            .background(Color(0xFF101419))
            .padding(horizontal = 16.dp, vertical = 10.dp),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (expanded) "参数调节" else "参数调节  ▸",
                color = Color(0xFFE6ECF5),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            TextButton(onClick = { expanded = !expanded }) {
                Text(if (expanded) "收起" else "展开", color = Color(0xFF7EA6FF), fontSize = 13.sp)
            }
        }

        if (expanded) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .heightIn(max = 330.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                // ---- 实时读数 ----
                ReadoutRow("倾角（驱动模糊）", "%.1f°".format(
                    Math.toDegrees(ui.blurDelta.angle.toDouble()).toFloat()))
                ReadoutRow("滞后不平行角", "%.1f°".format(ui.liveAngleDeg))
                ReadoutRow("透视旋转 rotationY", "%.1f°".format(ui.liveRotationYDeg))
                ReadoutRow("模糊半径", "%.1f px".format(ui.liveBlurPx))
                ReadoutRow("姿态来源", sensorName)

                Divider()

                TextButton(onClick = onCalibrate) {
                    Text("校准清晰平面（以当前朝向为基准）", color = Color(0xFF9CC0FF), fontSize = 12.sp)
                }

                // ---- 手动模拟 / 摆动演示 ----
                SwitchRow(
                    "摆动演示（自动 ±22° 摆动，看动态跟随）",
                    ui.swing,
                ) { on ->
                    if (on) ui.simulate = false
                    ui.swing = on
                }
                SwitchRow(
                    "手动模拟（滑块直接定角度）",
                    ui.simulate,
                ) { on ->
                    if (on) ui.swing = false
                    ui.simulate = on
                }
                if (ui.simulate) {
                    SliderRow("模拟倾斜角", ui.simulateDeg, -40f..40f) { ui.simulateDeg = it }
                }

                Divider()

                // ---- 轴模式 ----
                Text("参与变换的轴", color = Color(0xFF9FB0C6), fontSize = 12.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    AxisMode.entries.forEach { mode ->
                        FilterChip(
                            selected = ui.axisMode == mode,
                            onClick = { ui.axisMode = mode },
                            label = { Text(mode.label, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF2A3A55),
                                selectedLabelColor = Color(0xFF9CC0FF),
                                labelColor = Color(0xFF8A94A6),
                            ),
                        )
                    }
                }

                Spacer(Modifier.height(6.dp))

                // ---- 参数滑块 ----
                SliderRow("滞后时间 τ", ui.tauMs, 50f..2000f) { ui.tauMs = it }
                SliderRow("倾斜增益", ui.gain, 0.2f..3f) { ui.gain = it }
                SliderRow("最大模糊", ui.blurStrengthPx, 0f..60f) { ui.blurStrengthPx = it }
                SliderRow("起雾曲线（小=早起雾）", ui.blurExp, 0.3f..1f) { ui.blurExp = it }
                SliderRow("整体雾量", ui.baseFog, 0f..0.6f) { ui.baseFog = it }
                SliderRow("最大旋转角", ui.maxAngleDeg, 5f..45f) { ui.maxAngleDeg = it }
                SliderRow("透视强度", ui.cameraDistanceFactor, 3f..20f) { ui.cameraDistanceFactor = it }

                SwitchRow("液态玻璃感（压暗+冷调）", ui.glass) { ui.glass = it }
                SwitchRow("反转 Y 轴方向", ui.invertY) { ui.invertY = it }
            }
        }
    }
}

@Composable
private fun ReadoutRow(label: String, value: String) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = Color(0xFF8A94A6), fontSize = 12.sp)
        Text(value, color = Color(0xFFCFE0FF), fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun Divider() {
    Spacer(
        Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Color(0xFF232B36))
            .padding(vertical = 6.dp)
    )
}

@Composable
private fun SwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = Color(0xFFB6C0D0), fontSize = 12.sp)
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun SliderRow(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    onChange: (Float) -> Unit,
) {
    Column(Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(label, color = Color(0xFFB6C0D0), fontSize = 12.sp)
            Text("%.0f".format(value), color = Color(0xFF9CC0FF), fontSize = 12.sp)
        }
        Slider(
            value = value.coerceIn(range.start, range.endInclusive),
            onValueChange = onChange,
            valueRange = range,
            modifier = Modifier.fillMaxWidth().height(30.dp),
        )
    }
}
