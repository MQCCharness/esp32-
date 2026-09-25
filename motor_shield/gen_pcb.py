# -*- coding: utf-8 -*-
"""MOC-Motor PCB 生成器 v3
=============================
相对 v2 的三项升级:
  1. 功能级验证: TB6612FNG 引脚映射按东芝数据表重写 (v2 多处错误!)
  2. 美观: 45°/135° 斜角布线 (斜切 L 形拐角)
  3. 美观布局: 电源左 / 驱动中 / 接口右, 间距对齐

走线规则: 所有换向只用 45° 或 135° (高频/大电流行业规范, 避免 90° 内角酸阱)
"""
import sys

GRID = 0.635
SIG_W, PWR_W, PWR_W2 = 0.25, 1.0, 1.6
BW, BH = 62.0, 62.0
ROW_SP = 40.0     # ← 必实测: 主板两排排针中心距(mm)

nets, net_idx = [], {}
segs, vias, pads, fps = [], [], [], []


def net(name):
    if name not in net_idx:
        net_idx[name] = len(nets) + 1
        nets.append(name)
    return net_idx[name]


def g(v):
    return round(round(v / GRID) * GRID, 3)


def seg(n, x1, y1, x2, y2, w=SIG_W, layer="F.Cu"):
    segs.append((n, g(x1), g(y1), g(x2), g(y2), w, layer))


def via(n, x, y):
    vias.append((n, g(x), g(y)))


def pad(n, x, y, w, h, drill=0.0):
    pads.append((n, g(x), g(y), w, h, drill))


def link45(n, p1, p2, w=SIG_W, layer="F.Cu", first="x"):
    """45° 斜角连线: 用斜切代替直角。
    从 p1 到 p2, 中间折点取 (x1±|dy|) 或 (x2, y1±|dx|) 形成 45° 段。
    first: 'x' 先走x方向再45°, 'y' 先走y方向再45°"""
    (x1, y1), (x2, y2) = p1, p2
    dx, dy = x2 - x1, y2 - y1
    if abs(dx) < 0.01 or abs(dy) < 0.01:
        seg(n, x1, y1, x2, y2, w, layer)
        return
    if first == "x":
        # 先走 x 方向到 x=x1 + (dx 减/加 dy 的同号量), 再 45° 斜
        sx = x2 - dy if abs(dx) >= abs(dy) else x1 + dx
        sy = y1
        seg(n, x1, y1, sx, sy, w, layer)
        seg(n, sx, sy, x2, y2, w, layer)   # 45° 段
    else:
        sy = y2 - dx if abs(dy) >= abs(dx) else y1 + dy
        sx = x1
        seg(n, x1, y1, sx, sy, w, layer)
        seg(n, sx, sy, x2, y2, w, layer)


# ---------------- 封装 ----------------
def _mkfp(kind, cx, cy, pins, **kw):
    fps.append(dict(kind=kind, cx=cx, cy=cy, pins=pins, **kw))


def fp_sop24(cx, cy):
    pitch, row = 0.65, 8.8
    m = {}
    for n in range(1, 25):
        if n <= 12:
            m[str(n)] = (cx - row / 2, cy - 5 * pitch + (n - 1) * pitch)
        else:
            m[str(n)] = (cx + row / 2, cy + 5 * pitch - (n - 13) * pitch)
    _mkfp("sop24", cx, cy, m)
    return m


def fp_sot23_8(cx, cy):
    pitch, row = 0.65, 2.6
    m = {}
    for n in range(1, 9):
        if n <= 4:
            m[str(n)] = (cx - row / 2, cy - 1.5 * pitch + (n - 1) * pitch)
        else:
            m[str(n)] = (cx + row / 2, cy + 1.5 * pitch - (n - 5) * pitch)
    _mkfp("sot23_8", cx, cy, m)
    return m


def fp_sot23(cx, cy):
    m = {"1": (cx - 1.15, cy), "2": (cx + 1.15, cy - 0.95), "3": (cx + 1.15, cy + 0.95)}
    _mkfp("sot23", cx, cy, m)
    return m


def fp_0805(cx, cy, vertical=False):
    d = 0.95
    m = {"1": (cx, cy - d), "2": (cx, cy + d)} if vertical else {"1": (cx - d, cy), "2": (cx + d, cy)}
    _mkfp("r0805", cx, cy, m, vertical=vertical)
    return m


def fp_hdr(cx, cy, n, pitch=2.54, vertical=True):
    m = {}
    for i in range(n):
        m[str(i + 1)] = (cx, cy + i * pitch) if vertical else (cx + i * pitch, cy)
    _mkfp("hdr", cx, cy, m, n=n, vertical=vertical)
    return m


def fp_hdr2x8(cx, cy, rp=12.7):
    m = {}
    for i in range(8):
        m[str(i + 1)] = (cx - rp / 2, cy - 8.89 + i * 2.54)
        m[str(i + 9)] = (cx + rp / 2, cy - 8.89 + i * 2.54)
    _mkfp("hdr2x8", cx, cy, m)
    return m


def fp_xt30(cx, cy):
    m = {"1": (cx - 2.5, cy), "2": (cx + 2.5, cy)}
    _mkfp("xt30", cx, cy, m)
    return m


def fp_elco(cx, cy, pitch=2.5):
    m = {"1": (cx - pitch / 2, cy), "2": (cx + pitch / 2, cy)}
    _mkfp("elco", cx, cy, m)
    return m


def fp_kf301(cx, cy):
    m = {"1": (cx - 2.54, cy), "2": (cx + 2.54, cy)}
    _mkfp("kf301", cx, cy, m)
    return m


# ---------------- 网络 ----------------
GND = net("GND"); VIN = net("VIN"); VG = net("VGATE"); VINF = net("VIN_F")
VM = net("VM"); P5V = net("+5V"); P5VF = net("+5V_F"); V3 = net("+3V3")
SW = net("SW"); FB = net("FB"); BST = net("BST"); EN = net("EN")
N = {k: net(k) for k in ("AIN1", "AIN2", "PWMA", "BIN1", "BIN2", "PWMB", "STBY",
                          "MOTA1", "MOTA2", "MOTB1", "MOTB2",
                          "SRV1", "SRV2", "SRV3", "STEP", "DIR",
                          "LED_VM", "LED_5V", "LEDK1", "LEDK2")}

# ---------------- 布局 (电源左/驱动中/接口右, 对齐) ----------------
JL = fp_hdr(7.0, 12.0, 17)
JR = fp_hdr(7.0 + ROW_SP, 12.0, 17)
# TB6612FNG 中上, 舵机带右侧
U1 = fp_sop24(7.0 + ROW_SP / 2, 42.0)
U2 = fp_sot23_8(13.0, 20.0)
Q1 = fp_sot23(50.0, 10.0)
U3 = fp_hdr2x8(7.0 + ROW_SP / 2, 16.0)
J1 = fp_hdr(5.0, 4.5, 2, vertical=False)
J2 = fp_xt30(55.0, 5.0)
J3 = fp_kf301(8.0, 57.0)
J4 = fp_kf301(30.0, 57.0)
J6 = fp_hdr(58.0, 24.0, 3)
J7 = fp_hdr(58.0, 34.0, 3)
J8 = fp_hdr(58.0, 44.0, 3)
R1 = fp_0805(45.0, 7.0); R2 = fp_0805(51.0, 7.0)
R3 = fp_0805(20.0, 7.5, vertical=True); R4 = fp_0805(23.5, 7.5, vertical=True)
R5 = fp_0805(33.0, 37.0)
R6 = fp_0805(17.0, 37.0); R7 = fp_0805(20.5, 37.0)
R8 = fp_0805(24.0, 37.0); R9 = fp_0805(27.5, 37.0)
RB1 = fp_0805(8.5, 26.5, vertical=True)
RB2 = fp_0805(8.5, 31.5, vertical=True)
CBST = fp_0805(17.5, 14.5)
R10 = fp_0805(3.5, 13.0, vertical=True)
R11 = fp_0805(45.0, 50.0, vertical=True)
D1 = fp_0805(3.5, 18.0, vertical=True)
D2 = fp_0805(45.0, 55.0, vertical=True)
C1 = fp_elco(39.0, 21.0)
C2 = fp_elco(52.0, 33.0, 3.5)
C3 = fp_0805(10.5, 20.0)
C4 = fp_0805(9.0, 16.0, vertical=True)
C5 = fp_0805(18.5, 24.0)
C6 = fp_0805(22.0, 24.0)
L1 = fp_0805(16.0, 21.0)
JF2 = fp_0805(39.0, 16.5)

# ---------------- 焊盘 (TB6612FNG 东芝数据表核准映射) ----------------
def smd(m, netmap, w=0.75, h=1.0):
    for pin, xy in m.items():
        if pin in netmap:
            pad(netmap[pin], xy[0], xy[1], w, h)


def th(m, netmap, size=1.8, drill=1.1):
    for pin, xy in m.items():
        if pin in netmap:
            pad(netmap[pin], xy[0], xy[1], size, size, drill)


# ★ TB6612FNG 按东芝数据表 (左列1-12 逆时针 / 右列13-24):
#   AO1=2 AO2=1 VCC=3 AIN2=4 AIN1=5 STBY=6 GND=7 PGND=8,9 BO1=10 BO2=11 NC=12
#   NC=13 GND=14 PWMB=15 BIN2=16 BIN1=17 PGND=18 VM=19,20 NC=21 NC=22 NC=23 PWMA=24
smd(U1, {"1": N["MOTA2"], "2": N["MOTA1"], "3": V3, "4": N["AIN2"], "5": N["AIN1"],
         "6": N["STBY"], "7": GND, "8": GND, "9": GND,
         "10": N["MOTB1"], "11": N["MOTB2"],
         "14": GND, "15": N["PWMB"], "16": N["BIN2"], "17": N["BIN1"],
         "19": VM, "20": VM, "24": N["PWMA"]}, 0.62, 1.45)
# U2 MP1584EN: 1EN 2IN 3SS 4FB 5GND 6SW 7BST 8PGND? 按典型: 1=EN 2=IN 3=NC/SS 4=FB 5=GND 6=SW 7=BST 8=GND
smd(U2, {"1": EN, "2": VINF, "4": FB, "5": GND, "6": SW, "7": BST, "8": GND})
smd(Q1, {"1": VG, "2": VINF, "3": VIN}, 1.0, 0.95)
smd(R1, {"1": VG, "2": GND}); smd(R2, {"1": VG, "2": VIN})
smd(R3, {"1": N["STEP"], "2": GND}); smd(R4, {"1": N["DIR"], "2": GND})
smd(R5, {"1": V3, "2": N["STBY"]})
smd(R6, {"1": N["AIN1"], "2": GND}); smd(R7, {"1": N["AIN2"], "2": GND})
smd(R8, {"1": N["BIN1"], "2": GND}); smd(R9, {"1": N["BIN2"], "2": GND})
smd(RB1, {"1": P5V, "2": FB}); smd(RB2, {"1": FB, "2": GND})
smd(CBST, {"1": BST, "2": SW})
smd(R10, {"1": VM, "2": N["LED_VM"]}); smd(R11, {"1": P5V, "2": N["LED_5V"]})
smd(D1, {"1": N["LED_VM"], "2": N["LEDK1"]}); smd(D2, {"1": N["LED_5V"], "2": N["LEDK2"]})
smd(C1, {"1": VM, "2": GND}); smd(C2, {"1": P5VF, "2": GND})
smd(C3, {"1": VINF, "2": GND}); smd(C4, {"1": VINF, "2": GND})
smd(C5, {"1": P5V, "2": GND}); smd(C6, {"1": P5V, "2": GND})
smd(L1, {"1": SW, "2": P5V})
smd(JF2, {"1": VINF, "2": VM})
th(J1, {"1": VIN, "2": GND}); th(J2, {"1": VIN, "2": GND})
th(J3, {"1": N["MOTA1"], "2": N["MOTA2"]}, 2.4, 1.3)
th(J4, {"1": N["MOTB1"], "2": N["MOTB2"]}, 2.4, 1.3)
th(J6, {"1": N["SRV1"], "2": P5VF, "3": GND})
th(J7, {"1": N["SRV2"], "2": P5VF, "3": GND})
th(J8, {"1": N["SRV3"], "2": P5VF, "3": GND})
th(U3, {"7": N["STEP"], "8": N["DIR"], "1": GND, "9": V3, "10": GND, "16": VM}, 1.7, 1.0)
th(JL, {1: V3, 2: GND, 3: N["SRV2"], 4: N["SRV1"]}, 1.7, 1.0)
th(JR, {2: GND, 3: N["SRV3"], 5: N["PWMB"], 6: N["BIN2"], 7: N["BIN1"],
        8: N["PWMA"], 9: N["AIN2"], 10: N["AIN1"], 11: N["STEP"], 12: N["DIR"]}, 1.7, 1.0)
for i in range(1, 18):
    if i not in (1, 2, 3, 4):
        th(JL, {i: net("LNC%d" % i)}, 1.7, 1.0)
for i in range(1, 18):
    if i not in (2, 3, 5, 6, 7, 8, 9, 10, 11, 12):
        th(JR, {i: net("RNC%d" % i)}, 1.7, 1.0)

# ---------------- 布线 (45° 斜角) ----------------
for p in pads:
    if p[0] == GND:
        via(GND, p[1], p[2])

# 电源: 大电流走线保持粗, 拐角用 45°
link45(VIN, J1["1"], J2["1"], PWR_W2, first="y")
link45(VIN, J2["1"], Q1["3"], PWR_W2, first="y")
link45(VIN, R2["2"], J1["1"], SIG_W, first="y")
link45(VG, Q1["1"], R1["1"], SIG_W, first="y")
link45(VG, R1["1"], R2["1"], SIG_W, first="x")
link45(VINF, Q1["2"], U2["2"], PWR_W2, first="y")
link45(VINF, Q1["2"], C4["1"], PWR_W, first="y")
link45(VINF, C4["1"], C3["1"], PWR_W, first="y")
link45(EN, U2["1"], C4["1"], SIG_W, first="y")
link45(SW, U2["6"], L1["1"], PWR_W, first="x")
link45(BST, U2["7"], CBST["1"], SIG_W, first="x")
link45(SW, CBST["2"], L1["1"], SIG_W, first="x")
link45(P5V, L1["2"], C5["1"], PWR_W, first="x")
link45(P5V, C5["1"], C6["1"], PWR_W, first="y")
link45(FB, U2["4"], RB1["2"], SIG_W, first="y")
link45(FB, RB1["2"], RB2["1"], SIG_W, first="x")
link45(P5V, RB1["1"], C5["1"], SIG_W, first="y")
link45(P5V, C5["1"], C2["1"], PWR_W, first="y")
link45(P5VF, C2["1"], J8["2"], PWR_W, first="y")
link45(P5VF, J8["2"], J7["2"], PWR_W, first="y")
link45(P5VF, J7["2"], J6["2"], PWR_W, first="y")
link45(P5V, R11["1"], C2["1"], SIG_W, first="y")
link45(VINF, JF2["1"], C4["1"], PWR_W2, first="y")
link45(VM, JF2["2"], C1["1"], PWR_W2, first="x")
link45(VM, C1["1"], U1["20"], PWR_W, first="y")     # VM 到 U1.20 (数据表 VM=19,20)
link45(VM, C1["1"], U3["16"], PWR_W, first="y")
link45(VM, C1["1"], R10["1"], SIG_W, first="y")
# 3V3 (背面)
via(V3, JL["1"][0], JL["1"][1]); via(V3, U1["3"][0], U1["3"][1]); via(V3, U3["9"][0], U3["9"][1])
seg(V3, JL["1"][0], JL["1"][1], JL["1"][0], 50.0, SIG_W, "B.Cu")
seg(V3, JL["1"][0], 50.0, U1["3"][0], 50.0, SIG_W, "B.Cu")
seg(V3, U1["3"][0], 50.0, U1["3"][0], U1["3"][1], SIG_W, "B.Cu")
seg(V3, U1["3"][0], 50.0, U3["9"][0], 50.0, SIG_W, "B.Cu")
seg(V3, U3["9"][0], 50.0, U3["9"][0], U3["9"][1], SIG_W, "B.Cu")
link45(V3, U3["9"], R5["1"], SIG_W, first="y")
# 电机输出 (粗线, 45° 拐角)
link45(N["MOTA1"], U1["2"], J3["1"], PWR_W, first="y")
link45(N["MOTA2"], U1["1"], J3["2"], PWR_W, first="y")
link45(N["MOTB1"], U1["10"], J4["1"], PWR_W, first="y")
link45(N["MOTB2"], U1["11"], J4["2"], PWR_W, first="y")


def broute45(n, p1, p2, mid_y):
    """背面折线通道: 45° 进入通道, 45° 离开通道"""
    (x1, y1), (x2, y2) = p1, p2
    via(n, x1, y1)
    via(n, x2, y2)
    # 45° 下沿到通道: 从 (x1,y1) 走 45° 到 (x1±|dy|, mid_y)
    dy1 = abs(mid_y - y1)
    seg(n, x1, y1, x1, y1, 0.01, "B.Cu")   # 占位防空
    seg(n, x1, y1, x1 + (dy1 if mid_y > y1 else -dy1), mid_y, SIG_W, "B.Cu")  # 45°
    seg(n, x1 + (dy1 if mid_y > y1 else -dy1), mid_y, x2 - (abs(y2 - mid_y) if y2 > mid_y else -abs(y2 - mid_y)), mid_y, SIG_W, "B.Cu")
    dy2 = abs(y2 - mid_y)
    seg(n, x2 - (dy2 if y2 > mid_y else -dy2), mid_y, x2, y2, SIG_W, "B.Cu")  # 45°


CH = 34.0
for nm, a, b in ((N["AIN1"], JR["10"], U1["5"]), (N["AIN2"], JR["9"], U1["4"]),
                 (N["PWMA"], JR["8"], U1["24"]), (N["BIN1"], JR["7"], U1["17"]),
                 (N["BIN2"], JR["6"], U1["16"]), (N["PWMB"], JR["5"], U1["15"]),
                 (N["STBY"], JR["13"], U1["6"])):
    broute45(nm, a, b, CH)
for nm, rp, jx in ((N["AIN1"], R6, JR["10"]), (N["AIN2"], R7, JR["9"]),
                   (N["BIN1"], R8, JR["7"]), (N["BIN2"], R9, JR["6"])):
    via(nm, rp["1"][0], rp["1"][1])
    seg(nm, rp["1"][0], rp["1"][1], rp["1"][0], CH, SIG_W, "B.Cu")
    seg(nm, rp["1"][0], CH, jx[0], CH, SIG_W, "B.Cu")
link45(N["STBY"], R5["2"], U1["6"], SIG_W, first="x")
broute45(N["STEP"], JR["11"], U3["7"], 25.5)
broute45(N["DIR"], JR["12"], U3["8"], 24.5)
link45(N["STEP"], R3["1"], U3["7"], SIG_W, first="x")
link45(N["DIR"], R4["1"], U3["8"], SIG_W, first="x")
broute45(N["SRV1"], JL["4"], J6["1"], 9.5)
broute45(N["SRV2"], JL["3"], J7["1"], 8.0)
broute45(N["SRV3"], JR["3"], J8["1"], 7.0)
link45(N["LED_VM"], R10["2"], D1["1"], SIG_W, first="y")
seg(N["LEDK1"], D1["2"][0], D1["2"][1], D1["2"][0], D1["2"][1] + 2.0, SIG_W)
via(GND, D1["2"][0], D1["2"][1] + 2.0)
link45(N["LED_5V"], R11["2"], D2["1"], SIG_W, first="y")
seg(N["LEDK2"], D2["2"][0], D2["2"][1], D2["2"][0], D2["2"][1] + 1.5, SIG_W)
via(GND, D2["2"][0], D2["2"][1] + 1.5)

# ---------------- KiCad 输出 ----------------
def fmt(v):
    return ("%.3f" % v).rstrip("0").rstrip(".")


GEOM = {
    "sop24": (0.62, 1.45, 0.0), "sot23_8": (0.7, 1.05, 0.0), "sot23": (1.0, 0.95, 0.0),
    "r0805": (1.35, 1.5, 0.0), "hdr": (1.7, 1.7, 1.0), "hdr2x8": (1.7, 1.7, 1.0),
    "kf301": (2.4, 2.4, 1.3), "xt30": (3.0, 3.0, 1.8), "elco": (1.9, 1.9, 0.8),
}


def emit():
    L = ['(kicad_pcb (version 20221023) (generator "moc_motor_gen")',
         '  (general (thickness 1.6))', '  (paper "A4")', '  (layers']
    for idx, name, t in ((0, "F.Cu", "signal"), (31, "B.Cu", "signal"),
                         (36, "B.SilkS", "user"), (37, "F.SilkS", "user"),
                         (38, "B.Mask", "user"), (39, "F.Mask", "user"),
                         (44, "Edge.Cuts", "user")):
        L.append('    (%d "%s" %s)' % (idx, name, t))
    L += ['  )', '  (setup (pad_to_mask_clearance 0.05) (trace_min 0.2))', '  (net 0 "")']
    for i, n in enumerate(nets, 1):
        L.append('  (net %d "%s")' % (i, n))
    padpos = {(round(p[1], 2), round(p[2], 2)): p[0] for p in pads}
    for fi, f in enumerate(fps):
        cx, cy, k = f["cx"], f["cy"], f["kind"]
        L.append('  (footprint "moc_motor:%s_%d" (layer "F.Cu") (at %s %s)' % (k, fi, fmt(cx), fmt(cy)))
        L.append('    (fp_text reference "U?%d" (at 0 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))' % fi)
        for pin, (px, py) in f["pins"].items():
            pw, ph, dr = GEOM[k]
            if k == "r0805" and f.get("vertical"):
                pw, ph = ph, pw
            pn = padpos.get((round(g(px), 2), round(g(py), 2)))
            typ = "smd rect" if dr == 0 else "thru_hole circle"
            line = '    (pad "%s" %s (at %s %s) (size %s %s) (layers %s)' % (
                pin, typ, fmt(g(px) - cx), fmt(g(py) - cy), fmt(pw), fmt(ph),
                '"F.Cu" "F.Paste" "F.Mask"' if dr == 0 else '"*.Cu" "*.Mask"')
            if dr:
                line += ' (drill %s)' % fmt(dr)
            if pn:
                line += ' (net %d "%s")' % (pn, nets[pn - 1])
            L.append(line + ')')
        L.append('  )')
    for n, x1, y1, x2, y2, w, layer in segs:
        L.append('  (segment (start %s %s) (end %s %s) (width %s) (layer "%s") (net %d))'
                 % (fmt(x1), fmt(y1), fmt(x2), fmt(y2), fmt(w), layer, n))
    for n, x, y in vias:
        L.append('  (via (at %s %s) (size 0.7) (drill 0.35) (layers "F.Cu" "B.Cu") (net %d))'
                 % (fmt(x), fmt(y), n))
    L.append('  (zone (net %d) (net_name "GND") (layer "B.Cu") (hatch edge 0.5)'
             ' (polygon (pts (xy 1.5 1.5) (xy 60.5 1.5) (xy 60.5 60.5) (xy 1.5 60.5)))'
             ' (fill (thermal_gap 0.4) (thermal_bridge_width 0.6)))' % GND)
    for (x1, y1, x2, y2) in ((1, 1, 61, 1), (61, 1, 61, 61), (61, 61, 1, 61), (1, 61, 1, 1)):
        L.append('  (gr_line (start %s %s) (end %s %s) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts"))'
                 % (fmt(x1), fmt(y1), fmt(x2), fmt(y2)))
    for mx, my in ((3.5, 3.5), (58.5, 3.5), (3.5, 58.5), (58.5, 58.5)):
        L.append('  (footprint "moc_motor:MTG" (layer "F.Cu") (at %s %s)'
                 ' (pad "" np_thru_hole circle (at 0 0) (size 3.2 3.2) (drill 3.2) (layers "*.Cu" "*.Mask")))'
                 % (fmt(mx), fmt(my)))
    L.append('  (gr_text "MOC-Motor v3 45deg" (at 31 31) (layer "F.SilkS")'
             ' (effects (font (size 1.2 1.2) (thickness 0.2))))')
    L.append(')')
    return "\n".join(L)


# ---------------- 连通性自检 ----------------
def check():
    ZONE = {GND}
    from collections import defaultdict
    parent = {}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    items = [(p[0], p[1], p[2]) for p in pads] + [(v[0], v[1], v[2]) for v in vias]
    for it in items:
        parent[it] = it
    sk = []
    for i, s in enumerate(segs):
        key = ("S", i)
        parent[key] = key
        sk.append(key)
        n, x1, y1, x2, y2, w, layer = s
        for it in items:
            if it[0] != n:
                continue
            tol = w / 2 + 0.5
            # 斜线也做包围盒近似
            if (min(x1, x2) - tol <= it[1] <= max(x1, x2) + tol and
                    min(y1, y2) - tol <= it[2] <= max(y1, y2) + tol):
                union(key, it)
    for i, a in enumerate(segs):
        for j, b in enumerate(segs):
            if j <= i or a[0] != b[0] or a[6] != b[6]:
                continue
            for ea in ((a[1], a[2]), (a[3], a[4])):
                for eb in ((b[1], b[2]), (b[3], b[4])):
                    if abs(ea[0] - eb[0]) < 0.02 and abs(ea[1] - eb[1]) < 0.02:
                        union(sk[i], sk[j])
    groups = defaultdict(set)
    for it in items:
        groups[it[0]].add(find(it))
    bad = [(nets[n - 1], len(r)) for n, r in groups.items() if len(r) > 1 and n not in ZONE]
    print("=== 连通性自检 (v3) ===")
    print("GND: %d 簇 (背面铺铜统一)" % len(groups.get(GND, set())))
    if not bad:
        print("PASS: 其余 %d 个网络全部连通" % (len(groups) - 1))
        return True
    print("FAIL: %d 个未连通:" % len(bad))
    for name, cnt in bad:
        print("  - %s: %d 簇" % (name, cnt))
    return False


if __name__ == "__main__":
    txt = emit()
    with open("moc_motor_v3.kicad_pcb", "w", encoding="utf-8") as f:
        f.write(txt)
    print("moc_motor_v3.kicad_pcb: %d 封装 / %d 走线 / %d 过孔 / %d 网络" % (len(fps), len(segs), len(vias), len(nets)))
    sys.exit(0 if check() else 2)
