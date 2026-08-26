# 视频转 ASCII 帧数据包：ffmpeg 抽帧 -> 亮度映射字符 -> 定长记录 frames.bin
# 板端以固定记录长度 seek 读取流式播放
import subprocess
import sys

SRC = "cxk_source.mp4"
W, H = 80, 22          # 字符网格（2:1 字元宽高比下近似 16:9）
FPS = 10
SS, T = "1", "56"      # 取片段时间窗（秒）
RAMP = " .:-=+*#%@"    # 暗 -> 亮
FOOTER_MAX = 242       # 页脚行 UTF-8 最大字节数（80 字符全 CJK）

REC = H * (W + 2) + FOOTER_MAX

cmd = [
    "ffmpeg", "-v", "error", "-ss", SS, "-t", T, "-i", SRC,
    "-vf", f"fps={FPS},scale={W}:{H}:flags=lanczos",
    "-pix_fmt", "gray", "-f", "rawvideo", "pipe:1",
]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)

n = 0
with open("frames.bin", "wb") as out:
    while True:
        raw = p.stdout.read(W * H)
        if len(raw) < W * H:
            break
        rows = []
        for r in range(H):
            row = raw[r * W:(r + 1) * W]
            rows.append("".join(RAMP[min(v * len(RAMP) // 256, len(RAMP) - 1)] for v in row) + "\r\n")
        footer = ("JNTM ASCII Theater - ESP32-S3 - Frame %05d" % n).ljust(W)[:W] + "\r\n"
        rec = ("".join(rows) + footer).encode("utf-8")
        out.write(rec.ljust(REC, b" "))
        n += 1

p.wait()
size = n * REC
print(f"帧数 N={n}  记录长度 REC={REC}  总大小={size} 字节 ({size/1024:.0f} KB)")
if n == 0:
    sys.exit("没有抽到帧，检查 ffmpeg")
