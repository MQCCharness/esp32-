# ESP32-S3 串口 AI 对话 · Anthropic Messages 协议版（mimo-v2.5）
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
    "api_base": "https://token-plan-cn.xiaomimimo.com/anthropic",
    "api_key": "你的APIkey（占位）",
    "model": "mimo-v2.5",
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


def ask(messages):
    """调用 Anthropic Messages API，跳过 thinking 块只取正文"""
    gc.collect()
    body = json.dumps({
        "model": CONFIG["model"],
        "max_tokens": 1024,
        "system": CONFIG["system"],
        "messages": messages,
    })
    r = urequests.post(
        CONFIG["api_base"] + "/v1/messages",
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key": CONFIG["api_key"],
            "anthropic-version": "2023-06-01",
        },
    )
    try:
        obj = r.json()
    finally:
        r.close()
    if "content" not in obj:
        return "[API错误] " + json.dumps(obj)[:200]
    parts = []
    for blk in obj["content"]:
        if blk.get("type") == "text":
            parts.append(blk.get("text", ""))
    return "".join(parts) or "(模型只输出了思考没有正文)"


def ask_b64(b64_text):
    """中文经串口 REPL 会被吞，用 base64 传输：电脑端编码、板端解码"""
    import ubinascii
    q = ubinascii.a2b_base64(b64_text).decode()
    return ask([{"role": "user", "content": q}])


def run():
    connect_wifi()
    history = []
    print("\n=== ESP32 AI 终端已启动 (mimo-v2.5) ===")
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
