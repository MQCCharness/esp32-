# Waveshare ESP32-S3-Touch-AMOLED-1.75C 刷机记录

> 2026-09-26 · 板子：微雪 ESP32-S3-Touch-AMOLED-1.75C（圆屏 410×502 AMOLED）
> 本目录：出厂备份、小智固件刷写与 WiFi 注入工具链

## 板卡硬件

| 部件 | 型号 |
|------|------|
| 主控 | ESP32-S3 N16R8（RISC-V LP core, 240MHz） |
| 屏幕 | CO5300 410×502 AMOLED（QSPI）+ 触摸 |
| 音频输出 | ES8311 DAC（喇叭） |
| 音频输入 | ES7210 ADC（双麦克风 MIC1/MIC2） |
| 电源管理 | AXP2101 |
| Flash | **实测 GD 32MB**（固件按 16MB 使用，比标称大） |

出厂固件为 esp-brookesia LVGL 演示（分区：factory 9MB @0x110000 + assets 9MB @0x11F0000…）。

## 出厂备份与恢复

- `waveshare_175c_factory_16M.bin`（16MB 全片，SHA256 见 `.sha256`）
- 恢复命令：

```bash
python -m esptool --chip esp32s3 --port COM8 --baud 921600 \
    --before default-reset --after hard-reset write-flash 0x0 waveshare_175c_factory_16M.bin
```

### ⚠️ 本板特殊坑：USB-JTAG stub 读会掉线

**现象**：esptool 走 stub 读 flash 时，读到特定扇区（出厂镜像里有 7 个，如 0x3A9000、0x3E5000…）
**必然** USB 掉线（`No more data to read from the serial port`），且与读取起点无关、地址精确复现。

**结论**：flash 芯片没坏——用 `--no-stub`（ROM 直读）能正常读这些扇区，只是慢（~119kbit/s）。
推测是 stub 高速回传路径上，特定数据模式触发 USB-Serial/JTAG 硬件外设挂死。

**对策**：`dump_v2.py` —— 1MB 块 stub 快读为主，失败自动二分，切到 4KB 仍失败则 ROM 兜底，
缓存断点续跑，最后无缝拼接校验。写入方向不受影响（11MB 一次写完，片上校验通过）。

## 刷小智官方固件（v2.5.0）

官方 release（该板型官方支持）：

```
https://github.com/78/xiaozhi-esp32/releases/download/v2.5.0/v2.5.0_waveshare-esp32-s3-touch-amoled-1.75c.zip
```

注意是 **1.75c** 不是 1.75（两个包都有，别下错）。解压得 `merged-binary.bin`（~11MB）：

```bash
python -m esptool --chip esp32s3 --port COM8 erase-flash
python -m esptool --chip esp32s3 --port COM8 --before default-reset --after hard-reset \
    write-flash 0x0 merged-binary.bin
```

## WiFi 直写 NVS（跳过配网）

小智 WiFi 凭据存于 NVS 命名空间 `wifi`，键 `ssid` / `password`（string），源码依据：
[78/esp-wifi-connect/ssid_manager.cc](https://github.com/78/esp-wifi-connect)。小智分区表 nvs @ `0x9000`，大小 `0x4000`。

`gen_nvs_wifi.py`（本目录副本已脱敏）：`pip install esp-idf-nvs-partition-gen` 后生成镜像写入：

```bash
python nvs_partition_gen.py generate wifi_nvs.csv wifi_nvs.bin 0x4000
python -m esptool --chip esp32s3 --port COM8 write-flash 0x9000 wifi_nvs.bin
```

实测效果：复位后 2.5 秒完成 STA 关联，拿到 DHCP，直连 `api.tenclass.net`。

## 激活（唯一手动步骤）

设备联网后会语音播报 + 串口日志打印 **6 位激活码**（`Application: Alert [link] 激活设备: xiaozhi.me ******`）。
手机访问 [xiaozhi.me](https://xiaozhi.me) → 注册/登录 → 设备管理 → 添加新设备 → 输入激活码。
之后对设备喊「**你好小智**」即可对话。

## 备选：esp-claw 自编译

`G:\esp\esp-claw` 下已克隆板配置 `boards/waveshare/waveshare_ESP32_S3_Touch_AMOLED_1_75C`
（自 2.16 板派生，分辨率 410×502），2026-09-26 编译通过（edge_agent.bin 3.2MB）。
刷法见 `motor_shield`/`esp32_chat` 各目录的既有说明；随时可换回小智（见上）。

## 本目录文件

| 文件 | 说明 |
|------|------|
| `waveshare_175c_factory_16M.bin` | 出厂全片备份（16MB） |
| `dump_v2.py` | 自适应分块备份（二分 + ROM 兜底） |
| `gen_nvs_wifi.py` | WiFi 凭据 NVS 镜像生成 + 写入（**已脱敏，用前填入真实 SSID/密码**） |
| `flash_xiaozhi.py` | 小智固件刷写（重试 3 次） |
