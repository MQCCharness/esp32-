# 串口 ASCII 动画播放器：把开发板发来的字符帧实时打到本终端
# 用法: python viewer.py [COM口]   （不带参数则自动探测 ESP32-S3）
import os
import sys

import serial
import serial.tools.list_ports


def find_port():
    for p in serial.tools.list_ports.comports():
        hwid = (p.hwid or "").upper()
        if "1A86:7522" in hwid or "303A" in hwid:
            return p.device, 115200
    return "COM4", 115200


os.system("")  # 在旧版控制台启用 ANSI 转义支持
port, baud = (sys.argv[1], int(sys.argv[2])) if len(sys.argv) > 2 else find_port()
sys.stdout.write("\x1b[2J\x1b[?25l连接 " + port + " @ " + str(baud) + " 中，按 Ctrl+C 退出...\n")
sys.stdout.flush()

try:
    with serial.Serial(port, baud, timeout=0.2) as ser:
        while True:
            data = ser.read(8192)
            if data:
                data = data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
except KeyboardInterrupt:
    pass
finally:
    sys.stdout.write("\x1b[?25h\n已退出。\n")
