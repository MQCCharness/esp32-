# ESP32-S3 串口 AI 对话 · 多协议客户端
# 支持 OpenAI 兼容协议（DeepSeek/智谱/OpenAI…）与 Anthropic Messages 协议（mimo）
# 换模型只需改 CONFIG：protocol / api_base / model / api_key
# 用法：配好 CONFIG 后 import chat; chat.run()
import gc
import json
import network
import sys
import time
import urequests

CONFIG = {
    "wifi_ssid": "你的WiFi名（占位）",
    "wifi_pass": "你的WiFi密码（占位）",

    # ---- 协议二选一： "openai" 或 "anthropic" ----
    "protocol": "openai",
    "api_base": "https://api.deepseek.com",
    "api_key": "你的APIkey（占位）",
    "model": "deepseek-flash",

    "system": "你是运行在ESP32开发板上的AI助手，回答简洁，不超过150字。",
}

HISTORY_MAX = 6  # 保留最近几轮对话


def connect_wifi(timeout=25):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if wlan.isconnected():
        print("Wi-Fi 已连接:", wlan.config("essid"), wlan.ifconfig()[0])
        return wlan
    print("连接 Wi-Fi:", CONFIG["wifi_ssid"])
    wlan.connect(CONFIG["wifi_ssid"], CONFIG["wifi_pass"])
    t0 = time.time()
    while not wlan.isconnected():
        if time.time() - t0 > timeout:
            raise RuntimeError("Wi-Fi 连接超时")
        time.sleep(0.5)
    print("已连接! IP:", wlan.ifconfig()[0])
    return wlan


def scan_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    nets = wlan.scan()
    print("周围 Wi-Fi (%d 个):" % len(nets))
    for net in nets[:10]:
        print("  %-24s 信号%3d dBm  %s" % (net[0].decode(), net[3],
              "开放" if net[4] == 0 else "加密"))


def _post(url, body, headers):
    r = urequests.post(url, data=body, headers=headers)
    try:
        return r.json()
    finally:
        r.close()


def ask(messages):
    """按 CONFIG['protocol'] 调用对应协议，返回纯文本回复"""
    gc.collect()
    proto = CONFIG.get("protocol", "openai")

    if proto == "anthropic":
        url = CONFIG["api_base"] + "/v1/messages"
        body = json.dumps({
            "model": CONFIG["model"],
            "max_tokens": 1024,
            "system": CONFIG["system"],
            "messages": messages,
        })
        headers = {
            "Content-Type": "application/json",
            "x-api-key": CONFIG["api_key"],
            "anthropic-version": "2023-06-01",
        }
        obj = _post(url, body, headers)
        if "content" not in obj:
            return "[API错误] " + json.dumps(obj)[:200]
        parts = [b.get("text", "") for b in obj["content"] if b.get("type") == "text"]
        return "".join(parts) or "(模型只输出了思考没有正文)"

    # 默认 openai 兼容
    url = CONFIG["api_base"] + "/chat/completions"
    msgs = [{"role": "system", "content": CONFIG["system"]}] + messages
    body = json.dumps({
        "model": CONFIG["model"],
        "messages": msgs,
        "max_tokens": 1024,
    })
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG["api_key"],
    }
    obj = _post(url, body, headers)
    if "choices" not in obj:
        return "[API错误] " + json.dumps(obj)[:200]
    msg = obj["choices"][0]["message"]
    # 推理模型会额外返回 reasoning_content，只取正文
    return msg.get("content") or "(模型只输出了思考没有正文)"


def ask_b64(b64_text):
    """中文经串口 REPL 会被吞，用 base64 传输：电脑端编码、板端解码"""
    import ubinascii
    q = ubinascii.a2b_base64(b64_text).decode()
    return ask([{"role": "user", "content": q}])


def run():
    connect_wifi()
    history = []
    print("\n=== ESP32 AI 终端已启动 (%s / %s) ===" % (CONFIG["protocol"], CONFIG["model"]))
    print("=== 输入 /quit 退出 /new 清空历史 ===\n")
    while True:
        try:
            sys.stdout.write("你: ")
            line = sys.stdin.readline()
            if line is None:
                break
            q = line.strip()
            if not q:
                continue
            if q == "/quit":
                break
            if q == "/new":
                history = []
                print("（历史已清空）")
                continue
            history.append({"role": "user", "content": q})
            print("AI: ", end="")
            try:
                ans = ask(history[-(HISTORY_MAX * 2):])
            except Exception as e:
                ans = "[请求失败] " + str(e)[:150]
            print(ans)
            history.append({"role": "assistant", "content": ans})
            history = history[-(HISTORY_MAX * 2):]
        except KeyboardInterrupt:
            print("\n（已退出对话）")
            break
        except Exception as e:
            print("[错误]", e)


if __name__ == "__main__":
    scan_wifi()
