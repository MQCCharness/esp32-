# Fold Tilt — 把「折叠开合」的视觉特效搬到直板机

用手机自带陀螺仪模拟折叠屏开合时的**惯性平面 + 景深模糊**效果。
不开传感器也能用滑块直观验证效果，参数全部可实时调节。

## 效果是什么

| 输入 | 表现 |
|------|------|
| 手机**左右倾斜**（绕长轴 roll，即折叠屏铰链的开合轴） | 界面内容像一块**有惯性的平面**，滞后于手机 |
| 滞后造成的**不平行** | 内容产生 3D 透视倾斜；**后退的一侧越来越模糊**，前倾的一侧保持锐利 |
| 停止倾斜 | 虚拟平面缓慢追上，画面回到**完全清晰** |
| 平放手机 | 完全清晰，零模糊 |

关键设计：**只有偏离屏幕平面更远的那一侧会糊**（按 3D 深度加权），
而不是整屏均匀糊——这是「开折叠」观感的核心。

## 技术实现

```
Game Rotation Vector (type 15，无磁力计干扰)
        ↓ 四元数 q_device
虚拟平面指数滞后   q_virtual ← nlerp(q_virtual, q_device, 1 − e^(−dt/τ))
        ↓
不平行量（设备坐标系）  q_err = conj(q_device) · q_virtual
        ↓ 轴角分解
rotationY/X/Z ← 各轴分量 × 增益（限幅）      blur ← |θ|，按深度加权
        ↓
Modifier.graphicsLayer + RenderEffect(RuntimeShader)
```

- **3D 透视**：`graphicsLayer { rotationY/rotationX/rotationZ; cameraDistance }`
- **梯度模糊**：AGSL `RuntimeShader`，采样权重 `t = clamp(nx · tilt, 0, 1)`
  - `nx` 是归一化横向位置，`tilt` 是有符号倾斜量 → 只有后退侧变糊
  - 需要 **Android 13 (API 33)+**；低版本自动退回整体模糊
- **零重绘死循环**：绘制阶段只读状态、只写着色器 uniform，不写 Compose 状态

## 目录结构

```
app/src/main/java/com/zcode/foldtilt/
├── TiltMath.kt      四元数、不平行量模型、虚拟平面跟踪器（TiltTracker）
├── FoldTilt.kt      特效状态 + AGSL 着色器 + FoldTiltContainer（对外接口）
├── DemoPage.kt      演示页（普通 UI，不含任何特效代码）
└── MainActivity.kt  传感器接线 + 参数调节面板
docs/需求梳理.md      需求拆解与技术决策
```

## 集成到你自己的 App

只需两步：

```kotlin
// 1. 建状态
val ui = remember { TiltUiState() }

// 2. 把你的页面包进去
FoldTiltContainer(state = ui) {
    YourScreen()
}
```

传感器数据由 `TiltTracker` 提供，参考 `MainActivity.kt` 的接线（约 30 行）：

```kotlin
private val tracker = TiltTracker()
// 传感器回调里：
val q = Quat(w, x, y, z).normalized()
tracker.tauMs = ui.tauMs
tracker.update(q, event.timestamp)
ui.delta = tracker.delta
```

## 参数说明（App 内可实时调）

| 参数 | 默认 | 作用 |
|------|------|------|
| 滞后时间 τ | 450 ms | 越大越"重"，收敛越慢，惯性感越强 |
| 倾斜增益 | 1.2 | 视觉放大倍数（不平行角 → 旋转角） |
| 最大模糊 | 18 px | 远端最大模糊半径 |
| 最大旋转角 | 25° | 限幅，防止快速甩动时画面破坏 |
| 透视强度 | 8 | cameraDistance 倍数，越小透视越夸张 |
| 轴模式 | Y轴 | Y=左右倾（默认）/ X=前后仰 / Z=平面旋 / 全轴 |
| 反转 Y 轴 | 关 | 方向反了就打开 |

## 构建

需要 JDK 17 + Android SDK（platform 34 / build-tools 34）+ Gradle 8.9。
工程内已配好阿里云 Maven 镜像加速。

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
