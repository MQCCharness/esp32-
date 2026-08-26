# ESP32-S3 MOC 套件引脚表

> 来源：韩国中学教育机构开源课程 [esp32-edu](https://github.com/parkdongbae-afk/esp32-edu) 的数据文件
> [sensors.ts](https://raw.githubusercontent.com/parkdongbae-afk/esp32-edu/master/src/data/sensors.ts)，
> 该课程使用的板卡与 HELLO STEM/嘉年创奇 ESP32-S3 MOC 为同一产品线。
> 使用前请与板上丝印核对一次。

## 板载硬件（来源：课程仓库标注图 `third_party/esp32-edu/public/photos/ESP32-S3-MOC-설명.png` + 实测）

| 部件 | 说明 |
|------|------|
| **板载 RGB LED** | WS2812 微型封装（2020），**丝印 RGB(48) → GPIO48**（实拍照片确认）。⚠️ 软件侧已穷尽验证（标准/慢速/反相时序、高低电平、寻址实证）均未点亮，疑似供电轨未通或器件问题，待硬件侧排查 |
| BOOT 按键 | GPIO0（**已电气实证**：按下时 GPIO0 读数 1→0，与丝印 IO0 一致，证明本板丝印号=GPIO 号） |
| RESET 按键 | EN 复位 |
| USB1 口（丝印 USUART） | CH340K USB 转串口 → 电脑枚举 COM4（烧录/REPL 救命通道） |
| USB2 口（丝印 OTG） | ESP32-S3 原生 USB → 枚举 COM3/COM5（MicroPython REPL/OTG） |
| 供电 | USB / 3.3V 排针 / 外部 6–9V / 3.7V 2.5A / 5V 1A / **7.4V 锂电池接口** |
| 模组 | ESP32-S3 **N16R8**（16MB Flash + 8MB PSRAM，与 eFuse/flash-id 实测一致） |
| 双排扩展接口 | 上排 GPIO0–16，下排 GPIO17/18/21/38/39/40/41/42/45/47/48 + 电源排 |

## 传感器 / 执行器标准接线

| 外设 | 信号 | GPIO | 接口类型 |
|------|------|------|----------|
| DHT11 温湿度 | DATA | GPIO4 | Digital |
| 超声波 HC-SR04 | TRIG | GPIO5 | Digital |
| 超声波 HC-SR04 | ECHO | GPIO18 | Digital |
| 土壤湿度 | SIG | GPIO2 | ADC |
| 气体传感器 | SIG | GPIO3 | ADC |
| 光敏电阻 | SIG | GPIO7 | ADC |
| 电位器 | SIG | GPIO6 | ADC |
| DS18B20 防水温度 | DATA | GPIO15 | 1-Wire |
| 倾斜传感器 | SIG | GPIO10 | Digital |
| 按键 | SIG | GPIO11 | Digital |
| 触摸传感器 | SIG | GPIO16 | Digital |
| 蜂鸣器 | SIG | GPIO12 | Digital/PWM |
| 舵机 SG90 | SIG | GPIO14 | PWM |
| OLED (SSD1306) | SDA | GPIO8 | I2C |
| OLED (SSD1306) | SCL | GPIO9 | I2C |
| NeoPixel 彩灯 | DIN | GPIO13 | RMT |
| DC 电机（经驱动） | SIG | GPIO1 | Digital |
| 风扇电机 (L9110) | SIG | GPIO17 | Digital |

## 芯片级硬约束（ESP32-S3 通用）

- GPIO19 / GPIO20：USB D-/D+，勿占用
- GPIO26–GPIO32：连接板载 Flash
- **GPIO35–GPIO37：本板芯片封装 8MB PSRAM（R8 类），不可用**
- GPIO0 / GPIO3 / GPIO45 / GPIO46：启动 strapping 引脚，避免外部上拉/下拉
