# ESP32-S3 MOC 2.0 出厂状态恢复包

> 备份日期：2026-08-27 · 工具：esptool v5.3.1 · 状态：板卡未做过任何修改时的原样备份

## 板卡档案

| 项目 | 内容 |
|------|------|
| 产品 | HELLO STEM/嘉年创奇 ESP32-S3 MOC 2.0 开发板（惠州市百育科技） |
| 主控 | ESP32-S3，QFN56，revision v0.2 |
| 无线 | Wi-Fi + BLE5，双核 LX7 @240MHz |
| 片内 PSRAM | 8 MB（AP 厂商，eFuse 记录） |
| Flash | 16 MB，四线 SPI |
| MAC | 14:c1:9f:46:78:4c |
| USB | 芯片内置 USB-Serial/JTAG，Windows 内置驱动，枚举为 COM3 |

## 备份范围与完整性

- 文件：`factory_full_4M.bin`（4,194,304 字节 = 地址 0x000000–0x3FFFFF）
- 覆盖：bootloader(0x1000) + 分区表(0x8000) + nvs + otadata + app0 + app1 + spiffs + coredump
- 4 MB 之后到 16 MB 的区域经抽样验证**全部为出厂空白 0xFF**，无需备份
- SHA256：`ac49514050ef4841609e4c4b86767b0878150f8ae4bd8d039c1a32f8657c1f6b`
- 随机抽查 4 处与实机重读逐字节一致（0x1000 / 0x5C000 / 0x200000 / 0x3FF000）

## 原厂固件身份

- 工程：`arduino-lib-builder`（Arduino 框架出厂测试固件）
- 框架基线：esp-idf v4.4.4 · 编译时间：2023-02-08 18:07:54
- ELF SHA256 前缀：`a514480c`

## 分区表（4MB 布局）

| 名称 | 类型 | 偏移 | 大小 |
|------|------|------|------|
| nvs | data/wifi | 0x009000 | 20 KB |
| otadata | data/ota | 0x00E000 | 8 KB |
| app0 | app/ota_0 | 0x010000 | 1.25 MB |
| app1 | app/ota_1 | 0x150000 | 1.25 MB |
| spiffs | data/spiffs | 0x290000 | 1.375 MB |
| coredump | data/coredump | 0x3F0000 | 64 KB |

## 一键恢复

```bash
python -m esptool --port COM3 --baud 921600 write-flash 0x0 factory_full_4M.bin
```

恢复后 `esptool --port COM3 flash-id` / 重新上电即回到出厂状态。

## 注意事项

- COM3 为该板内置 USB 口；若提示找不到端口，重新插拔 USB 线即可
- 即使固件刷坏，ESP32-S3 的 ROM 下载模式无法被软件破坏，本恢复命令始终可用
- 大块读写偶发 `Packet content transfer stopped`（USB 缓冲停滞），重试或分小块即可
