# LED 扫描模式：逐个 GPIO 点亮 0.5s，循环播放，用于人工目检板载 LED
# 串口同步打印当前引脚号。确认映射后换回动画 main.py 即可。
import time
from machine import Pin

PINS = [1, 2, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 38, 39, 40, 41, 42, 47, 48]

# WS2812 全彩灯候选：GPIO38 / GPIO48（乐鑫官方 DevKitC 传统位置）
def rainbow_probe():
    try:
        from neopixel import NeoPixel
        np = NeoPixel(Pin(38, Pin.OUT), 1)
        np[0] = (50, 0, 0)
        np.write()
        np2 = NeoPixel(Pin(48, Pin.OUT), 1)
        np2[0] = (0, 50, 0)
        np2.write()
        print("WS2812 probe: GPIO38=红 GPIO48=绿 (若板上有全彩灯此时应发光)", flush=True)
        time.sleep(3)
        np[0] = (0, 0, 0); np.write()
        np2[0] = (0, 0, 0); np2.write()
    except Exception as e:
        print("WS2812 probe skip:", e, flush=True)

print("=== LED 扫描开始：每个引脚亮 0.5s，注意看板上哪盏灯同步亮 ===", flush=True)
while True:
    rainbow_probe()
    for p in PINS:
        io = Pin(p, Pin.OUT)
        io.value(1)
        print("GPIO %d 亮" % p, flush=True)
        time.sleep(0.5)
        io.value(0)
        time.sleep(0.3)
