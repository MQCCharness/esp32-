package com.zcode.foldtilt

import kotlin.math.acos
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * 单位四元数 (w, x, y, z)。
 *
 * 约定：q 表示「设备坐标系 → 世界坐标系」的旋转，
 * 即 v_world = q ⊗ v_device。
 */
data class Quat(val w: Float, val x: Float, val y: Float, val z: Float) {

    fun normalized(): Quat {
        val n = sqrt(w * w + x * x + y * y + z * z)
        return if (n < 1e-8f) IDENTITY else Quat(w / n, x / n, y / n, z / n)
    }

    fun conj(): Quat = Quat(w, -x, -y, -z)

    /** 同一旋转的相反半球表示（用于点积半球对齐） */
    fun negated(): Quat = Quat(-w, -x, -y, -z)

    operator fun times(o: Quat): Quat = Quat(
        w * o.w - x * o.x - y * o.y - z * o.z,
        w * o.x + x * o.w + y * o.z - z * o.y,
        w * o.y - x * o.z + y * o.w + z * o.x,
        w * o.z + x * o.y - y * o.x + z * o.w,
    )

    fun dot(o: Quat): Float = w * o.w + x * o.x + y * o.y + z * o.z

    /** 轴角分解，返回 [TiltDelta]（角度为弧度，axis 为单位向量） */
    fun toTiltDelta(): TiltDelta {
        val wc = w.coerceIn(-1f, 1f)
        val angle = 2f * acos(wc)
        val s = sqrt((1f - wc * wc).coerceAtLeast(0f))
        return if (s < 1e-5f) TiltDelta(0f, 0f, 1f, 0f)
        else TiltDelta(angle, x / s, y / s, z / s)
    }

    companion object {
        val IDENTITY = Quat(1f, 0f, 0f, 0f)

        /** 绕 Y 轴旋转 [deg] 度的四元数（用于手动模拟） */
        fun aroundY(deg: Float): Quat {
            val h = Math.toRadians(deg.toDouble()) / 2.0
            return Quat(cos(h).toFloat(), 0f, sin(h).toFloat(), 0f)
        }

        /** 绕 X 轴旋转 [deg] 度的四元数 */
        fun aroundX(deg: Float): Quat {
            val h = Math.toRadians(deg.toDouble()) / 2.0
            return Quat(cos(h).toFloat(), sin(h).toFloat(), 0f, 0f)
        }
    }
}

/**
 * 虚拟平面与物理屏幕的「不平行量」，在设备坐标系下表达。
 *
 * @param angle 总不平行角（弧度）
 * @param axisX/axisY/axisZ 旋转轴（设备坐标系单位向量）
 */
data class TiltDelta(
    val angle: Float,
    val axisX: Float,
    val axisY: Float,
    val axisZ: Float,
) {
    /** 绕设备 Y 轴的分量（弧度）：左倾/右倾，折叠屏铰链开合轴 */
    val yawComponent: Float get() = angle * axisY

    /** 绕设备 X 轴的分量（弧度）：前后俯仰 */
    val pitchComponent: Float get() = angle * axisX

    /** 绕设备 Z 轴的分量（弧度）：屏幕平面内旋转 */
    val rollComponent: Float get() = angle * axisZ

    companion object {
        val ZERO = TiltDelta(0f, 0f, 1f, 0f)
    }
}

/** 参与透视变换的轴 */
enum class AxisMode(val label: String) {
    Y("Y轴 左右倾"),
    X("X轴 前后仰"),
    Z("Z轴 平面旋"),
    ALL("全轴"),
}

/**
 * 虚拟平面跟踪器：对真实设备姿态做指数滞后，得到「不平行量」。
 *
 * 静止时 qVirtual 收敛到 qDevice → 不平行量 → 0 → 画面回到完全清晰。
 */
class TiltTracker {

    /** 滞后时间常数（毫秒），越大越"重"、收敛越慢 */
    var tauMs: Float = 450f

    /** 是否反转 Y 轴方向（不同设备/握持习惯） */
    var invertY: Boolean = false

    private var qVirtual: Quat = Quat.IDENTITY
    private var lastNs: Long = 0L

    /** 最近一次计算出的不平行量 */
    var delta: TiltDelta = TiltDelta.ZERO
        private set

    /** 虚拟平面相对初始姿态的累计角（仅用于调试显示） */
    var virtualRollDeg: Float = 0f
        private set

    fun reset(qDevice: Quat) {
        qVirtual = qDevice
        lastNs = 0L
        delta = TiltDelta.ZERO
        virtualRollDeg = 0f
    }

    fun update(qDevice: Quat, nowNs: Long) {
        if (lastNs == 0L) {
            // 首帧只对齐基准并记录时间戳；下一帧才进入跟踪（否则永远停留在重置分支）
            qVirtual = qDevice
            delta = TiltDelta.ZERO
            virtualRollDeg = 0f
            lastNs = nowNs
            return
        }
        val dtSec = ((nowNs - lastNs) / 1_000_000_000.0).toFloat().coerceIn(0f, 0.25f)
        lastNs = nowNs

        val tau = tauMs / 1000f
        val alpha = if (tau <= 1e-4f) 1f else
            (1f - exp(-dtSec / tau)).coerceIn(0f, 1f)

        // 半球对齐后线性插值（nlerp，小步长下近似 slerp）
        var target = qDevice
        if (qVirtual.dot(target) < 0f) {
            target = Quat(-target.w, -target.x, -target.y, -target.z)
        }
        qVirtual = Quat(
            qVirtual.w + (target.w - qVirtual.w) * alpha,
            qVirtual.x + (target.x - qVirtual.x) * alpha,
            qVirtual.y + (target.y - qVirtual.y) * alpha,
            qVirtual.z + (target.z - qVirtual.z) * alpha,
        ).normalized()

        // 误差旋转：把设备坐标系转到虚拟平面坐标系，仍以设备轴表达
        val err = (qDevice.conj() * qVirtual).toTiltDelta()
        delta = if (invertY) {
            TiltDelta(err.angle, err.axisX, -err.axisY, err.axisZ)
        } else {
            err
        }

        // 调试显示：虚拟平面相对当前设备的 Y 轴偏离角度
        virtualRollDeg = Math.toDegrees((qVirtual.conj() * qDevice).toTiltDelta().yawComponent.toDouble()).toFloat()
    }
}
