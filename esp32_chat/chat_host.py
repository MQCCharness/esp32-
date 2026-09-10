# ESP32 AI 终端 · 电脑端聊天入口
# 用法：python chat_host.py [COM口]
# 在电脑键盘上输入（中英文均可），经 base64 通道发给板子上的 chat.py，回复实时显示
import base64
import sys
import time

import serial
import serial.tools.list_ports


def find_port():
    for p in serial.tools.list_ports.comports():
        hwid = (p.hwid or "").upper()
        if "303A:4001" in hwid or "303A:1001" in hwid:
            return p.device
    for p in serial.tools.list_ports.comports():
        if "1A86" in (p.hwid or ""):
            return p.device
    return "COM5"


PORT = sys.argv[1] if len(sys.argv) > 1 else find_port()

ser = serial.Serial(PORT, 115200, timeout=0.2)
ser.dtr = False
ser.rts = False
time.sleep(0.3)


def drain(t=0.3):
    time.sleep(t)
    d = b""
    while ser.in_waiting:
        d += ser.read(ser.in_waiting)
    return d


def cmd(line, wait=0.25):
    ser.write(line.encode() + b"\r\n")
    return drain(wait)


def ensure_repl():
    ser.reset_input_buffer()
    ser.write(b"\r\n")
    if b">>>" in drain(0.5):
        return True
    for _ in range(6):
        ser.write(b"\x03\x03\r\n")
        if b">>>" in drain(0.4):
            return True
    return False


def ask_on_board(question):
    b64 = base64.b64encode(question.encode()).decode()
    ser.write(("print(chat.ask_b64('%s'))\r\n" % b64).encode())
    t0 = time.time()
    acc = b""
    while time.time() - t0 < 60:
        acc += drain(0.4)
        if b">>>" in acc and time.time() - t0 > 3:
            break
    txt = acc.decode(errors="replace")
    lines = txt.split("\r\n")
    started = False
    out = []
    for l in lines:
        if "ask_b64" in l:
            started = True
            continue
        if started and l.strip() and l.strip() != ">>>":
            out.append(l)
    return "\n".join(out).strip(), time.time() - t0


print("=" * 52)
print("  ESP32-S3 AI 终端  ·  %s @115200" % PORT)
print("  输入任意问题回车发送  /new 清空上下文")
print("  /w 重连Wi-Fi  /q 退出")
print("=" * 52)

if not ensure_repl():
    print("[!] 板子 REPL 未响应，请确认板子已开机")
    sys.exit(1)

cmd("import chat, network")
r = cmd("print(chat.CONFIG['model'], network.WLAN(network.STA_IF).isconnected())", 0.6)
print("[i] 模型:", r.decode(errors="replace").strip().split("\r\n")[0].strip()[:40])
if b"False" in r:
    print("[i] 重新连接 Wi-Fi ...")
    cmd("network.WLAN(network.STA_IF).active(True)", 0.3)
    cmd("chat.connect_wifi()", 0.5)
    t0 = time.time()
    while time.time() - t0 < 25:
        if b"True" in cmd("print(network.WLAN(network.STA_IF).isconnected())", 0.8):
            break

while True:
    try:
        q = input("\n你: ").strip()
    except (EOFError, KeyboardInterrupt):
        break
    if not q:
        continue
    if q == "/q":
        break
    if q == "/new":
        cmd("print(chat.reset_history())", 0.5)
        print("[i] 上下文已清空")
        continue
    if q == "/w":
        cmd("network.WLAN(network.STA_IF).disconnect(); chat.connect_wifi()", 0.5)
        t0 = time.time()
        while time.time() - t0 < 20:
            if b"True" in cmd("print(network.WLAN(network.STA_IF).isconnected())", 0.8):
                print("[i] Wi-Fi 已重连")
                break
        continue
    print("AI: ", end="", flush=True)
    ans, dt = ask_on_board(q)
    print(ans or "(无回复)")
    print("   [%.1fs]" % dt)

ser.close()
print("\n已退出。")
