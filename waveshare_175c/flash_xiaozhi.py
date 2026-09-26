# -*- coding: utf-8 -*-
"""烧录小智 v2.5.0 (waveshare 1.75C) 到 COM8，重试最多 3 次。"""
import subprocess, sys, os, time

IMG = r'G:\G_cursor\esp32_probe\xiaozhi_175c\merged-binary.bin'
assert os.path.exists(IMG) and os.path.getsize(IMG) > 1 << 20

for attempt in range(1, 4):
    print('flash try %d ...' % attempt, flush=True)
    r = subprocess.run([sys.executable, '-m', 'esptool', '--chip', 'esp32s3',
                        '--port', 'COM8', '--baud', '921600',
                        '--before', 'usb-reset', '--after', 'hard-reset',
                        'write-flash', '--verify', '0x0', IMG],
                       timeout=900)
    if r.returncode == 0:
        print('FLASH OK'); sys.exit(0)
    time.sleep(3)
print('FLASH FAILED x3'); sys.exit(1)
