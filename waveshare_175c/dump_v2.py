# -*- coding: utf-8 -*-
"""出厂固件备份 v2：stub 快读为主，失败自动二分，4KB 仍败转 ROM 读。
已有的缓存直接复用，最后拼接成完整 16MB。"""
import subprocess, os, sys, time

TOTAL = 0x1000000
BASE = r'G:\G_cursor\esp32_probe\wsparts2'
FULL = r'G:\G_cursor\esp32_probe\waveshare_175c_factory_16M.bin'
os.makedirs(BASE, exist_ok=True)

def run_esptool(addr, size, out, stub=True, tries=2):
    cmd = [sys.executable, '-m', 'esptool', '--chip', 'esp32s3', '--port', 'COM8',
           '--before', 'default-reset', '--after', 'no-reset']
    if not stub:
        cmd.append('--no-stub')
    cmd += ['read-flash', hex(addr), hex(size), out]
    for t in range(1, tries + 1):
        r = subprocess.run(cmd, capture_output=True, timeout=600)
        if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) == size:
            return True
        time.sleep(1.5)
    return False

def dump(addr, size):
    """递归：先 stub 整块，失败对半分，4KB 兜底 ROM。"""
    out = os.path.join(BASE, '%08x_%x.bin' % (addr, size))
    if os.path.exists(out) and os.path.getsize(out) == size:
        return out
    if run_esptool(addr, size, out, stub=True):
        print('  stub OK   0x%08X +0x%X' % (addr, size), flush=True)
        return out
    if size > 0x1000:
        h = size // 2
        print('  bisect    0x%08X +0x%X' % (addr, size), flush=True)
        return dump(addr, h) and dump(addr + h, size - h)
    if run_esptool(addr, size, out, stub=False, tries=3):
        print('  ROM OK    0x%08X +0x%X' % (addr, size), flush=True)
        return out
    print('  !! DEAD   0x%08X +0x%X (ROM 也失败, 填 FF)' % (addr, size))
    open(out, 'wb').write(b'\xff' * size)
    return out

# 主区间：0x0 - 0x1000000（内部死点会自动二分+ROM 兜底）
step = 0x100000
for addr in range(0, TOTAL, step):
    print('MAIN 0x%08X' % addr, flush=True)
    dump(addr, step)

# 拼接（块文件命名 addr_size，按 addr 排序即可覆盖全区间——递归产生的碎片也带地址）
pieces = []
for fn in os.listdir(BASE):
    a, s = fn[:-4].split('_')
    pieces.append((int(a, 16), int(s, 16), os.path.join(BASE, fn)))
pieces.sort()
# 校验无缝覆盖
expect = 0
for a, s, _ in pieces:
    assert a == expect, 'gap/overlap at 0x%X' % a
    expect += s
assert expect == TOTAL, 'total 0x%X != 0x%X' % (expect, TOTAL)
with open(FULL, 'wb') as w:
    for a, s, p in pieces:
        w.write(open(p, 'rb').read())
print('MERGED:', FULL, os.path.getsize(FULL), 'bytes')
