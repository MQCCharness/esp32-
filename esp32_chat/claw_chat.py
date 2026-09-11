"""ESP-Claw 网页聊天客户端

用法: python claw_chat.py "你的问题" [设备IP]

机制:
  - 接收: WebSocket  ws://<ip>/ws/webim
  - 发送: HTTP POST http://<ip>/api/webim/send  {"chat_id": ..., "text": ...}
"""
import json
import sys
import threading
import time
import urllib.request

import websocket

IP = sys.argv[2] if len(sys.argv) > 2 else "10.41.199.126"
QUESTION = sys.argv[1] if len(sys.argv) > 1 else "你好，请介绍一下你自己"
CHAT_ID = "local-test"

received = []
done = threading.Event()


def on_message(ws, message):
    try:
        obj = json.loads(message)
    except Exception:
        print("[原始]", message[:300])
        return
    # 打印事件类型，便于了解协议
    kind = obj.get("type") or obj.get("event") or "?"
    text = obj.get("text") or obj.get("content") or obj.get("message") or ""
    role = obj.get("role") or obj.get("from") or ""
    if text:
        print(f"[{kind}|{role}] {str(text)[:800]}")
        received.append(text)
        if kind in ("message", "assistant", "reply", "chat"):
            done.set()
    else:
        print(f"[事件] {json.dumps(obj, ensure_ascii=False)[:250]}")


def on_error(ws, err):
    print("[WS错误]", err)


def on_open(ws):
    print("[WS] 已连接 /ws/webim")


def start_ws():
    ws = websocket.WebSocketApp(
        f"ws://{IP}/ws/webim",
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
    )
    t = threading.Thread(target=ws.run_forever, daemon=True)
    t.start()
    return ws


def send(text):
    body = json.dumps({"chat_id": CHAT_ID, "text": text}).encode()
    req = urllib.request.Request(
        f"http://{IP}/api/webim/send",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.read().decode(errors="replace")[:300]


if __name__ == "__main__":
    ws = start_ws()
    time.sleep(3)  # 等 WS 建立

    print(f"\n[发送] {QUESTION}")
    try:
        code, resp = send(QUESTION)
        print(f"[HTTP {code}] {resp}")
    except Exception as e:
        print("[发送失败]", e)

    # 等待回复（最长 90 秒，DeepSeek v4-pro 是推理模型可能较慢）
    t0 = time.time()
    while time.time() - t0 < 90:
        if done.is_set():
            break
        time.sleep(0.5)
    print("\n=== 本轮结束，共收到 %d 条消息 ===" % len(received))
    try:
        ws.close()
    except Exception:
        pass
