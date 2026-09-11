# ESP-Claw 移植实录：把官方 AI Agent 框架跑上杂牌开发板

> 目标板：HELLO STEM/嘉年创奇 **ESP32-S3 MOC 2.0**（N16R8，非官方支持列表内）
> 成果：**乐鑫官方 ESP-Claw「聊天造物」框架在本板完整运行**——AI 通过对话写 Lua 代码、控制设备、创建持久化定时任务
> 日期：2026-09-11

## 一、最终效果（实测）

| 能力 | 实测结果 |
|------|----------|
| 对话 | ✅「我是 ESP-Claw，一个运行在 ESP32-S3 设备上的端侧 AI 助手。」 |
| 工具调用 | ✅ 自主调用 `get_system_info`，汇报真实数据：运行 209.6s / 内部RAM 138KB剩余 / PSRAM 3.13MB剩余 / Wi-Fi -44dBm |
| **Lua 自编程** | ✅ 让它写星号金字塔 → 它生成 `pyramid.lua`（140B）→ 在设备上执行 → 返回真实输出 |
| **持久化行为改造** | ✅ 让它建定时提醒 → 生成 `drink_water_reminder.lua` + 写入 `schedules.json`（间隔 300000ms） |

设备文件系统（AI 可读写的"创作空间"）：`skills/`(19个技能) `scripts/` `memory/` `scheduler/` `router_rules/` `sessions/`

## 二、技术栈与版本

| 组件 | 版本/说明 |
|------|-----------|
| ESP-Claw | 官方仓库 espressif/esp-claw，2104★，Apache 2.0，git 74b1870 |
| ESP-IDF | **v5.5.4**（官方指定版本） |
| 工具链 | xtensa-esp-elf-gcc 14.2.0 |
| 板管理器 | esp-bmgr-assist 0.8.3（`idf.py bmgr`） |
| 模型 | DeepSeek **deepseek-v4-pro**（官方推荐名单内） |
| 工作目录 | `G:\esp\`（IDF 源码 390MB + SDK 工具链，装入 G 盘避开 C 盘紧张） |

## 三、踩坑与解决（本次移植的全部障碍）

### 坑 1：Git Bash 环境被 ESP-IDF 全面拒绝 ★最硬核

**现象**：`install.bat`、`export.bat`、`idf_tools.py`、`idf.py` 全部报
`MSys/Mingw is not supported`，即使 `unset MSYSTEM` 或 `MSYSTEM=`（赋空值）也无效。

**根因**：`idf_tools.py` 的判定是 **`if 'MSYSTEM' in os.environ`——只检查键是否存在**，
赋空值仍然"存在"，所以无效；而 Git Bash 的 profile 会在每条命令前重新注入 `MSYSTEM=MINGW64`，
所以 `unset` 和 `env -u` 都被覆盖。export.bat 用 `if defined MSYSTEM`，同理（defined 只看定义与否）。

**解法**：写 [run_idf_tool.py](file:///G:/esp/run_idf_tool.py) 启动器，在 **Python 进程内部**
`os.environ.pop("MSYSTEM")` 后以 `__main__` 身份执行目标脚本；再写
[idf.bat](file:///G:/esp/idf.bat) 提供原生 CMD 环境（Windows 格式 PATH）+ 调用该启动器。

### 坑 2：Gitee 镜像导致 git 登录弹窗

Gitee 把 IDF 的**子模块地址**改写成 `gitee.com/espressif/*`（该组织不存在），
触发凭据弹窗且无法匿名克隆。**解法**：全局 URL 重写
`git config --global url."https://github.com/".insteadOf "https://gitee.com/"`，
同时 `credential.helper ""` 关闭弹窗。

### 坑 3：浅克隆导致 16 个子模块是空目录

`git clone --depth 1 --shallow-submodules` 让子模块只签出**分支头**而非**固定提交**，
`git submodule status` 显示"已初始化"但目录里只有 `.git`（我最初的检查因此误判为完成）。

**解法**：逐个 `git submodule update --init --force <path>`；对用**相对 URL** 的
`esp_ble_mesh/lib/lib` 需改绝对地址。GitHub 时通时断，用**多轮持久重试**（成功 15/16，
剩余 1 个 BLE Mesh 库不影响 S3 构建）。

### 坑 4：非官方板需要自建板级配置

官方按厂商分组（espressif/m5stack/waveshare…）+ `community/` 目录。我们的板不在其中。

**解法**：以官方 `esp32_S3_DevKitC_1_breadboard` 为模板，在
`application/edge_agent/boards/community/esp32_s3_moc_2_0/` 建配置，**最小改动三处**：

| 文件 | 改动 | 原因 |
|------|------|------|
| `board_info.yaml` | 板名/芯片/厂商 | 声明身份 |
| `board_peripherals.yaml` | `rmt_tx.gpio_num: 38 → 48` | 我们板 WS2812 丝印是 RGB(48) |
| `sdkconfig.defaults.board` | Flash 8MB→**16MB**、分区表→`partitions_16MB.csv` | 本板 N16R8 |

保留 `SPIRAM_MODE_OCT=y`（八线 PSRAM）——正好匹配 N16R8。
`idf.py bmgr -c ./boards -b esp32_s3_moc_2_0` 即被识别为 `[30]`，5 外设 + 7 设备全部校验通过。

### 坑 5：配置不在 menuconfig，走 Web/NVS

ESP-Claw 配置优先级：**NVS 有则用 NVS，否则用编译默认值**。推荐走 Web 控制台。
无网络时可用**串口控制台**（`app>` 提示符）：`wifi --set --ssid X --password Y --apply`。

### 坑 6：电脑与板子不在同一网段

板子连手机热点（10.41.199.x），电脑在家用 Wi-Fi（192.168.1.x）→ 互不可达。
且 Windows 会自动切回高优先级网络，手动连设备热点后会被抢回。

**解法**：把家用 Wi-Fi 配置设 `connectionmode=manual`，再连热点；
或用设备自带的配网热点 `esp-claw-XXXXXX`（192.168.4.1）。
注意**电脑不能连板子的 SoftAP 又同时保证外网**——ESP32 不做 NAT。

## 四、配置步骤（复现指南）

```bash
# 1. 环境（绕过 MSYSTEM）
G:\esp\idf.bat bmgr -c ./boards -b esp32_s3_moc_2_0
G:\esp\idf.bat build
G:\esp\idf.bat -p COM6 -b 460800 flash

# 2. 串口配 Wi-Fi
wifi --set --ssid <SSID> --password <PWD> --apply

# 3. 网页/HTTP 配 LLM（关键字段）
POST http://<设备IP>/api/config
{
  "llm_backend_type": "openai_compatible",
  "llm_base_url": "https://api.deepseek.com",
  "llm_auth_type": "bearer",
  "llm_model": "deepseek-v4-pro",
  "llm_api_key": "sk-...",
  "llm_max_tokens_field": "max_tokens",
  "llm_supports_tools": "true",
  "llm_supports_vision": "false",
  "time_timezone": "CST-8"
}
# 4. POST /api/restart 生效
```

## 五、常用接口速查

| 接口 | 用途 |
|------|------|
| `GET /api/status` | 设备状态（IP、Wi-Fi、存储路径） |
| `GET/POST /api/config` | 读写配置 |
| `POST /api/restart` | 重启设备（**必须 POST**） |
| `GET /api/files?path=/` | 列目录（注意：**存储根是 `/` 而非 /fatfs**） |
| `GET /files/<path>` | 下载文件 |
| `WS /ws/webim` + `POST /api/webim/send` | 网页聊天（收 WebSocket / 发 HTTP） |

## 六、安全提醒（官方文档明确）

- Web 控制台**假定可信环境**，会返回几乎所有信息，**不要暴露到公网**，局域网内也是明文 HTTP
- NVS 与配置文件存有 API Key 等机密，**不要公开导出配置或 NVS 转储**
- SoftAP 默认开放（我们的 `esp-claw-46784D` 无密码），建议设置密码或启用"连上 STA 后自动关闭"

## 七、产物与备份

| 项目 | 位置 |
|------|------|
| ESP-Claw 源码 | `G:\esp\esp-claw`（自建板配置已在内） |
| 固件构建产物 | `G:\esp\esp-claw\application\edge_agent\build\` |
| 自建板级配置 | 仓库 `esp-claw-board/` 目录（已拷贝留档） |
| 环境启动器 | [run_idf_tool.py](file:///G:/esp/run_idf_tool.py) · [idf.bat](file:///G:/esp/idf.bat) |
| 出厂固件恢复包 | 仓库 `one_click_restore/`（刷 esp-claw 前的原厂状态） |
| MicroPython 时代备份 | 仓库 `board_backup_micropython/` + `caixukun_ascii/` |
