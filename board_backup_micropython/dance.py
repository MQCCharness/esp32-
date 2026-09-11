# 鸡你太美 · 真视频转 ASCII · print 版
# 帧经 MicroPython REPL 双终端输出：USB CDC + UART0 镜像(板载 CH340K -> 电脑 COM4)
# 115200bps 带宽上限 ≈5.6fps，print 阻塞自动节流，效果为慢动作播放
import time

REC = 2046   # 每帧字节数：22 行画面 + 1 行页脚
N = 560      # 总帧数（56 秒 @ 10fps 采样）

f = open("frames.bin", "rb")
print("\x1b[2J", end="")
i = 0
while True:
    f.seek((i % N) * REC)
    print("\x1b[H" + f.read(REC).decode(), end="")
    i += 1
