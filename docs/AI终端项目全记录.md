# 把 ESP32 变成最便宜的 AI 终端 · 项目全记录

> 硬件成本：**0 元**（手头闲置的教育开发板）｜门槛：一根 USB 线 + 手机热点
> 成果：ESP32-S3 直连大模型 API，串口实时中英文对话，单轮 3-6 秒
> 已跑通两家：mimo-v2.5（Anthropic 协议）与 DeepSeek deepseek-flash / deepseek-v4-pro（OpenAI 协议）
> 客户端已重构为**协议可切换**：换模型只改 CONFIG 里 protocol/api_base/model/api_key 四行

## 一、故事线（短视频叙事版）

1. **开场钩子**：手里这块板子是某教育套件的主控，厂商资料全网查不到、板载 LED 都点不亮——但今天，它要变成一台 AI 终端
2. **反转**：谁说 AI 终端要花几百块？闲置的 ESP32 + 手机热点 + 一个 API key = 0 元 AI 对话机
3. **高潮**：串口里敲下问题，5 秒后屏幕上打出 AI 的中文回复——就这块板，接的是带思考能力的推理模型
4. **收尾**：开源地址、成本清单、你自己也能 10 分钟复刻

## 二、时间线（实际开发过程）

| 阶段 | 内容 | 结果 |
|------|------|------|
| 1. 识别板子 | esptool 读芯片 → ESP32-S3 N16R8，16MB Flash + 8MB PSRAM | 硬件档案建立 |
| 2. 备份保命 | 全量 dump 出厂固件 4MB，做成一键恢复包 | 后顾无忧 |
| 3. 刷 MicroPython | 官方 v1.29.0 固件 | 板子变成 Python 机 |
| 4. 调研路线 | 小智(29.7k★，需麦克风喇叭) vs MicroPython 串口方案 | 选后者：0 附加硬件 |
| 5. 写客户端 | chat.py：Wi-Fi + HTTPS + Anthropic Messages 协议 | 骨架完成 |
| 6. 踩坑 marathon | 详见下方坑表 | 全部解决 |
| 7. 见证时刻 | 板子发出第一条消息，AI 回复 "Hello! I'm your AI assistant on ESP32." | 6.5 秒 |
| 8. 中文打通 | base64 通道绕过 REPL 中文限制 | 5 秒 |

## 三、踩坑表（视频"技术含量"担当）

| # | 坑 | 一句话解法 |
|---|----|-----------|
| 1 | USB CDC 串口反复挂死 | 改走板载 CH340K 硬件串口（永远在线的救命通道） |
| 2 | 打开串口后芯片"假死" | pyserial 默认 DTR 电平把芯片摁在复位态；一律 `dtr=False, rts=false` |
| 3 | 空闲 REPL 探活无响应 | 空回车探活，Ctrl-C 只用于打断脚本 |
| 4 | `wlan.scan()` 返回 6 元组 | 固件差异，改索引访问 |
| 5 | `sorted(key=)` / `decode(errors=)` 不支持 | MicroPython 裁剪版，去关键字参数 |
| 6 | 5GHz Wi-Fi 完全不可见 | ESP32 只支持 2.4GHz——物理盲区，扫描列表里连名字都没有 |
| 7 | 热点名拼写陷阱 | 凭印象拼的热点名连不上，一切以 `wlan.scan()` 扫描结果为准（口述名与实际 SSID 常有出入） |
| 8 | Response 没有 `.read()` | 这固件用 `r.json()` |
| 9 | 中文经串口 REPL 被吞成空串 | base64 编码传输，板端 `ubinascii` 解码 |
| 10 | 推理模型响应慢的错觉 | thinking 模型先思考后输出，6 秒属正常，不是网络问题 |

## 四、成本与性能账单

| 项 | 数值 |
|----|------|
| 硬件成本 | 0 元（闲置板）；全新同规格板约 30-50 元 |
| 软件成本 | MicroPython 开源 + mimo API key |
| 单轮对话延迟 | 5-6.5 秒（含 Wi-Fi + TLS + 模型思考） |
| 功耗 | USB 供电即可 |
| 内存 | 板子无 PSRAM 状态下跑通（512KB RAM 足够） |

## 五、复刻指南（观众 10 分钟版）

1. 手里任何 ESP32（S2/S3/C3 带 USB 的都行）刷 MicroPython：`esptool write-flash 0x0 firmware.bin`
2. 把 `esp32_chat/chat.py` 传上板子，填好 CONFIG（Wi-Fi + API key）
3. 串口终端连上，`import chat; chat.run()`，开聊
4. 中文输入：`chat.ask_b64('<base64>')`（或配 PuTTY 的 UTF-8 输入）

## 六、文件清单

- `esp32_chat/chat.py` —— 仓库版（凭据占位）
- `esp32_chat/chat_local.py` —— 真实凭据版（.gitignore 排除，不入库）
- 板端 `/chat.py` + `/dance.py`（串口 ASCII 动画，彩蛋）
