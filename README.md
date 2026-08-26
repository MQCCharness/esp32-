# ESP32-S3 MOC 2.0 开发板资料库

HELLO STEM/嘉年创奇 **ESP32-S3 MOC 2.0** 开发板（生产商：惠州市百育科技有限公司，执行标准 Q/BYKJ 001-2023）的逆向调研、出厂备份与恢复工具合集。

## 板卡档案

| 项目 | 内容 |
|------|------|
| 主控 | ESP32-S3，QFN56，revision v0.2（乐鑫） |
| 内核 | 双核 Xtensa LX7 @ 240 MHz |
| 无线 | Wi-Fi + 蓝牙 5 (LE) |
| 片内 PSRAM | 8 MB（封装内嵌入式，AP 厂商） |
| 板载 Flash | 16 MB，四线 SPI |
| USB | 芯片内置 USB-Serial/JTAG（无外置串口桥），Windows 免驱 |
| 出厂固件 | Arduino 框架测试程序（esp-idf v4.4.4，2023-02-08 编译） |
| 出厂分区 | Arduino OTA 布局：app0/app1 各 1.25MB + SPIFFS 1.375MB |

实测芯片 MAC：`14:c1:9f:46:78:4c`

## 目录说明

```
├── factory_backup/          出厂 Flash 完整备份（4MB 镜像 + 校验与档案说明）
├── one_click_restore/       一键恢复包（免安装，拷到 U 盘即可在任意 Windows 电脑使用）
│   ├── 一键恢复.bat          双击即可恢复出厂（自动识别 COM 口）
│   ├── esptool.exe          乐鑫官方烧录工具独立版 v5.3.1
│   ├── factory_full_4M.bin  出厂固件镜像
│   └── 使用说明.txt
└── docs/                    板卡引脚表与调研结论
```

## 一键恢复出厂

1. USB 连接开发板
2. 双击 `one_click_restore/一键恢复.bat`
3. 等待约 20 秒，看到「★ 恢复成功」即可

或手动执行：

```bash
esptool.exe --port COMx --baud 921600 write-flash 0x0 factory_full_4M.bin
```

## 引脚速查

详见 [docs/ESP32-S3-MOC-套件引脚表.md](docs/ESP32-S3-MOC-套件引脚表.md)。常用：DHT11→GPIO4，超声波→GPIO5/18，OLED→GPIO8/9，舵机→GPIO14，蜂鸣器→GPIO12，NeoPixel→GPIO13。

**硬约束**：GPIO19/20=USB，GPIO26-32=Flash，GPIO35-37 因 8MB PSRAM 不可用，GPIO0/3/45/46 为 strapping 脚。

## 调研结论（2026-08）

- 该厂商无公开的原理图/引脚图/恢复镜像，公网无索引
- 同型号板卡用于韩国中学编程教育：配套课程软件 [esp32-edu](https://github.com/parkdongbae-afk/esp32-edu)，其数据文件给出了套件标准接线（已整理为上方引脚表）
- ESP32-S3 的 ROM 下载模式无法被软件破坏，**这块板软件层面刷不死**，任何情况下都可用 esptool 重刷

## 备份完整性

`factory_full_4M.bin` SHA256：`ac49514050ef4841609e4c4b86767b0878150f8ae4bd8d039c1a32f8657c1f6b`（4,194,304 字节；4MB 之后至 16MB 为出厂空白 0xFF，已抽样验证）
