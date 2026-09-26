# -*- coding: utf-8 -*-
"""生成含 WiFi 凭据的 NVS 镜像并写入小智 nvs 分区（0x9000/0x4000）。
依赖: pip install esp-idf-nvs-partition-gen
⚠️ 本仓库版已脱敏：把下面两行换成你家 WiFi 后再运行。"""
import struct, subprocess, sys, os

SSID = '你的WiFi名称'
PASSWORD = '你的WiFi密码'
PORT = 'COM8'
NVS_OFFSET = 0x9000
NVS_SIZE = 0x4000

# 从已刷的 merged-binary.bin 解析分区表（也可直接信任上面的常量）
IMG = r'G:\G_cursor\esp32_probe\xiaozhi_175c\merged-binary.bin'
if os.path.exists(IMG):
    d = open(IMG, 'rb').read()
    for i in range(95):
        e = d[0x8000 + i * 32: 0x8000 + (i + 1) * 32]
        if e[:2] == b'\xaa\x50' and e[12:15] == b'nvs':
            NVS_OFFSET, NVS_SIZE = struct.unpack('<II', e[4 + 8:12 + 8])[0], None
            NVS_OFFSET = struct.unpack('<I', e[8:12])[0]
            NVS_SIZE = struct.unpack('<I', e[12:16])[0]
            break

csv = 'wifi_nvs.csv'
open(csv, 'w', encoding='utf-8').write(
    'key,type,encoding,value\n'
    'wifi,namespace,,\n'
    'ssid,data,string,%s\n'
    'password,data,string,%s\n' % (SSID, PASSWORD))

outbin = 'wifi_nvs.bin'
subprocess.run([sys.executable, '-m', 'esp_idf_nvs_partition_gen', 'generate', csv, outbin,
                hex(NVS_SIZE)], check=True, timeout=120)
r = subprocess.run([sys.executable, '-m', 'esptool', '--chip', 'esp32s3', '--port', PORT,
                    '--before', 'default-reset', '--after', 'hard-reset',
                    'write-flash', hex(NVS_OFFSET), outbin], timeout=300)
sys.exit(r.returncode)
