# -*- coding: utf-8 -*-
"""MOC-Motor 扩展板网表生成器
输出:
  1. connections.csv  功能连接表（权威设计依据，人可读）
  2. motor_shield.net KiCad 5 网表（立创EDA/KiCad 可导入）

注意: U1(TB6612FNG)/U3(A4988) 的封装引脚号以数据表为准,
网表中已标注 PROVISIONAL, 导入布局前必须核对。
"""
import csv
import io

# ---------------------------------------------------------------
# 连接表: (网络名, [(器件, 功能脚)])
# 功能脚为逻辑连接关系, 是设计的权威定义
# ---------------------------------------------------------------
NETS = [
    # 电源输入与保护
    ("VIN",        [("J1", "DC005+"), ("J2", "XT30+"), ("Q1", "DRAIN")]),
    ("GND",        [("J1", "DC005-"), ("J2", "XT30-"), ("J5", "GND"),
                    ("U1", "GND"), ("U2", "GND"), ("U3", "GND"),
                    ("J3", "P2"), ("J4", "P2"), ("J6", "P3"), ("J7", "P3"),
                    ("J8", "P3"), ("C1", "P2"), ("C2", "P2"), ("C3", "P2"),
                    ("C4", "P2"), ("C5", "P2"), ("C6", "P2")]),
    ("VM",         [("Q1", "SOURCE"), ("F2", "P1"), ("R10", "P1")]),   # 反接保护后电机轨
    ("VM_FUSED",   [("F2", "P2"), ("U1", "VM"), ("U3", "VM"),
                    ("C1", "P1"), ("U2", "VIN")]),
    ("5V",         [("U2", "VOUT"), ("F1", "P1"), ("C5", "P1"), ("C6", "P1"),
                    ("C2", "P1"), ("R11", "P1")]),
    ("5V_FUSED",   [("F1", "P2"), ("J6", "P2"), ("J7", "P2"), ("J8", "P2")]),
    ("3V3",        [("J5", "3V3"), ("U1", "VCC"), ("U3", "VDD"), ("R5", "P1")]),
    # 反接保护栅极网络
    ("VGATE",      [("Q1", "GATE"), ("R1", "P1"), ("R2", "P1")]),
    ("VIN_S",      [("R2", "P2"), ("C3", "P1")]),           # 栅极采样(接VIN侧) - R2接VIN
    # TB6612 控制 (来自主板排针 J5)
    ("M_AIN1",     [("J5", "GPIO42"), ("U1", "AIN1"), ("R6", "P1")]),
    ("M_AIN2",     [("J5", "GPIO41"), ("U1", "AIN2"), ("R7", "P1")]),
    ("M_PWMA",     [("J5", "GPIO40"), ("U1", "PWMA")]),
    ("M_BIN1",     [("J5", "GPIO39"), ("U1", "BIN1"), ("R8", "P1")]),
    ("M_BIN2",     [("J5", "GPIO38"), ("U1", "BIN2"), ("R9", "P1")]),
    ("M_PWMB",     [("J5", "GPIO21"), ("U1", "PWMB")]),
    ("M_STBY",     [("J5", "GPIO47"), ("U1", "STBY"), ("R5", "P2")]),
    # 电机输出
    ("MOTA+",      [("U1", "AO1"), ("J3", "P1")]),
    ("MOTA-",      [("U1", "AO2"), ("J3", "P1B")]),
    ("MOTB+",      [("U1", "BO1"), ("J4", "P1")]),
    ("MOTB-",      [("U1", "BO2"), ("J4", "P1B")]),
    # 舵机
    ("SRV1_SIG",   [("J5", "GPIO14"), ("J6", "P1")]),
    ("SRV2_SIG",   [("J5", "GPIO15"), ("J7", "P1")]),
    ("SRV3_SIG",   [("J5", "GPIO17"), ("J8", "P1")]),
    # 步进 (A4988 模块插座)
    ("STP_STEP",   [("J5", "GPIO45"), ("U3", "STEP"), ("R3", "P1")]),
    ("STP_DIR",    [("J5", "GPIO46"), ("U3", "DIR"), ("R4", "P1")]),
    # 下拉/上拉电阻落位
    ("GND_PULL",   [("R3", "P2"), ("R4", "P2"), ("R6", "P2"),
                    ("R7", "P2"), ("R8", "P2"), ("R9", "P2")]),
    # 指示灯
    ("LED_VM",     [("R10", "P2"), ("D1", "A")]),
    ("LED_5V",     [("R11", "P2"), ("D2", "A")]),
    ("D1_K",       [("D1", "K")]),
    ("D2_K",       [("D2", "K")]),
]

COMPONENTS = [
    # (位号, 值, 封装, 备注)
    ("U1", "TB6612FNG", "SOP-24", "双路DC驱动 PIN# PROVISIONAL"),
    ("U2", "MP1584EN", "SOT-23-8", "5V/3A降压 含外围"),
    ("U3", "A4988_SOCKET", "PinHeader_2x08", "步进模块插座"),
    ("Q1", "AO3401A", "SOT-23", "反接保护P-MOS"),
    ("F1", "FUSE_3A", "R1206", "5V轨自恢复"),
    ("F2", "FUSE_5A", "R1206", "VM轨自恢复"),
    ("J1", "DC005", "DC005", "电源输入"),
    ("J2", "XT30", "XT30", "电池焊盘"),
    ("J3", "KF301-2P", "KF301-2P", "电机A"),
    ("J4", "KF301-2P", "KF301-2P", "电机B"),
    ("J5", "HDR_2x17", "PinSocket_2x17", "主板对接"),
    ("J6", "SRV_HDR", "PinHeader_1x03", "舵机1"),
    ("J7", "SRV_HDR", "PinHeader_1x03", "舵机2"),
    ("J8", "SRV_HDR", "PinHeader_1x03", "舵机3"),
    ("R1", "100K", "R0805", "Q1栅下拉"),
    ("R2", "10K", "R0805", "Q1栅串联"),
    ("R3", "10K", "R0805", "STEP下拉"),
    ("R4", "10K", "R0805", "DIR下拉"),
    ("R5", "100K", "R0805", "STBY上拉"),
    ("R6", "100K", "R0805", "AIN1下拉"),
    ("R7", "100K", "R0805", "AIN2下拉"),
    ("R8", "100K", "R0805", "BIN1下拉"),
    ("R9", "100K", "R0805", "BIN2下拉"),
    ("R10", "1K", "R0805", "LED_VM限流"),
    ("R11", "1K", "R0805", "LED_5V限流"),
    ("D1", "LED_RED", "LED_0805", "VM指示"),
    ("D2", "LED_GREEN", "LED_0805", "5V指示"),
    ("C1", "100uF_25V", "CP_Tantal", "VM储能"),
    ("C2", "1000uF_16V", "CP_Radial_D8", "舵机浪涌"),
    ("C3", "100nF", "C0805", "U2输入"),
    ("C4", "22uF", "C0805", "U2输入大容量"),
    ("C5", "22uF", "C0805", "U2输出"),
    ("C6", "100nF", "C0805", "U2输出"),
    ("L1", "22uH", "CD54", "MP1584功率电感"),
]

# KiCad 引脚号映射（PROVISIONAL，导入前按数据表核对）
PINNUM = {
    # TB6612FNG SSOP-24（按东芝数据表最终核对）
    "U1": {"AO1": "1", "AO2": "2", "VM": "14", "VCC": "20",
           "GND": "18", "STBY": "19", "AIN1": "21", "AIN2": "22",
           "PWMA": "23", "BIN1": "17", "BIN2": "16", "PWMB": "15",
           "BO1": "11", "BO2": "12"},
    "U3": {"STEP": "7", "DIR": "8", "VM": "16", "VDD": "10",
           "GND": "9", "EN": "1"},
    "Q1": {"GATE": "1", "SOURCE": "2", "DRAIN": "3"},
}

PASSIVE_PINS = 2  # R/C/L/Led 两脚器件 P1/P2 或 A/K


def main():
    # 1) 功能连接表 CSV
    with open("connections.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["网络", "器件", "功能脚", "KiCad引脚号(待核对)"])
        for net, nodes in NETS:
            for ref, pin in nodes:
                num = PINNUM.get(ref, {}).get(pin, "")
                w.writerow([net, ref, pin, num])
    print("connections.csv:", sum(len(n) for _, n in NETS), "个连接点")

    # 2) KiCad 网表
    out = io.StringIO()
    out.write("(export (version D)\n")
    out.write("  (design\n    (source \"MOC-Motor Shield v1.0\")\n")
    out.write("    (comment \"PIN NUMBERS OF U1/U3 ARE PROVISIONAL - VERIFY VS DATASHEET\"))\n")
    out.write("  (components\n")
    for ref, val, fp, note in COMPONENTS:
        out.write(f'    (comp (ref {ref})\n')
        out.write(f'      (value "{val}")\n')
        out.write(f'      (footprint "{fp}")\n')
        out.write(f'      (property "Note" "{note}"))\n')
    out.write("  )\n  (nets\n")
    for i, (net, nodes) in enumerate(NETS, 1):
        out.write(f'    (net (code {i}) (name "{net}")\n')
        for ref, pin in nodes:
            if ref in PINNUM and pin in PINNUM[ref]:
                num = PINNUM[ref][pin]
                fmt = f'(pin {num})'
            elif pin in ("A",):
                fmt = "(pin 1)"
            elif pin in ("K",):
                fmt = "(pin 2)"
            elif pin.startswith("P1") or pin == "P1":
                fmt = "(pin 1)"
            elif pin.startswith("P2") or pin == "P2":
                fmt = "(pin 2)"
            else:
                fmt = '(pin "0")'  # 排针功能位 → 布局时映射实际针号
            out.write(f"      (node (ref {ref}) {fmt} (pinfunction {pin}))\n")
        out.write("    )\n")
    out.write("  )\n)\n")
    with open("motor_shield.net", "w", encoding="utf-8") as f:
        f.write(out.getvalue())
    print("motor_shield.net:", len(NETS), "个网络,", len(COMPONENTS), "个器件")


if __name__ == "__main__":
    main()
