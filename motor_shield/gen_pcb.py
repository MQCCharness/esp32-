# -*- coding: utf-8 -*-
"""MOC-Motor PCB 生成器 v2
全部走线端点锚定焊盘坐标 + L形连线器, MP1584 周边补全(FB分压/BST/EN上拉)。
打样前必改: ROW_SP (主板两排排针中心距, 卡尺实测!)
"""
import sys

GRID = 0.635
SIG_W, PWR_W, PWR_W2 = 0.25, 1.0, 1.6
BW, BH = 62.0, 62.0
ROW_SP = 40.0     # ← 必实测: 主板两排排针中心距

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


def link(n, p1, p2, w=SIG_W, layer="F.Cu", vfirst=True):
    (x1, y1), (x2, y2) = p1, p2
    if abs(x1 - x2) < 0.01 or abs(y1 - y2) < 0.01:
        seg(n, x1, y1, x2, y2, w, layer)
        return
    if vfirst:
        seg(n, x1, y1, x1, y2, w, layer)
        seg(n, x1, y2, x2, y2, w, layer)
    else:
        seg(n, x1, y1, x2, y1, w, layer)
        seg(n, x2, y1, x2, y2, w, layer)


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

# ---------------- 布局 ----------------
JL = fp_hdr(7.0, 12.0, 17)
JR = fp_hdr(7.0 + ROW_SP, 12.0, 17)
U1 = fp_sop24(7.0 + ROW_SP / 2, 42.0)
U2 = fp_sot23_8(14.0, 20.0)
Q1 = fp_sot23(50.0, 12.0)
U3 = fp_hdr2x8(7.0 + ROW_SP / 2, 16.0)
J1 = fp_hdr(6.0, 4.5, 2, vertical=False)
J2 = fp_xt30(54.0, 5.0)
J3 = fp_kf301(9.0, 57.0)
J4 = fp_kf301(31.0, 57.0)
J6 = fp_hdr(58.0, 22.0, 3)
J7 = fp_hdr(58.0, 32.0, 3)
J8 = fp_hdr(58.0, 42.0, 3)
R1 = fp_0805(45.5, 8.0); R2 = fp_0805(51.0, 8.0)
R3 = fp_0805(21.0, 8.0, vertical=True); R4 = fp_0805(24.0, 8.0, vertical=True)
R5 = fp_0805(33.0, 37.5)
R6 = fp_0805(18.0, 37.5); R7 = fp_0805(21.5, 37.5)
R8 = fp_0805(25.0, 37.5); R9 = fp_0805(28.5, 37.5)
RB1 = fp_0805(9.5, 26.5, vertical=True)
RB2 = fp_0805(9.5, 31.5, vertical=True)
CBST = fp_0805(18.0, 15.5)
R10 = fp_0805(4.0, 14.0, vertical=True)
R11 = fp_0805(44.0, 51.0, vertical=True)
D1 = fp_0805(4.0, 19.0, vertical=True)
D2 = fp_0805(44.0, 56.0, vertical=True)
C1 = fp_elco(39.0, 22.0)
C2 = fp_elco(52.0, 33.0, 3.5)
C3 = fp_0805(10.5, 20.5)
C4 = fp_0805(9.0, 16.5, vertical=True)
C5 = fp_0805(19.0, 24.5)
C6 = fp_0805(22.5, 24.5)
L1 = fp_0805(16.5, 21.5)
JF2 = fp_0805(39.0, 17.0)     # VM 保险丝位

# ---------------- 焊盘 ----------------
def smd(m, netmap, w=0.75, h=1.0):
    for pin, xy in m.items():
        if pin in netmap:
            pad(netmap[pin], xy[0], xy[1], w, h)


def th(m, netmap, size=1.8, drill=1.1):
    for pin, xy in m.items():
        if pin in netmap:
            pad(netmap[pin], xy[0], xy[1], size, size, drill)


smd(U1, {"1": N["MOTA1"], "2": N["MOTA2"], "14": VM, "15": N["PWMB"], "16": N["BIN2"],
         "17": N["BIN1"], "18": GND, "19": N["STBY"], "20": V3, "21": N["AIN1"],
         "22": N["AIN2"], "23": N["PWMA"], "11": N["MOTB2"], "12": N["MOTB1"]}, 0.62, 1.45)
smd(U2, {"1": EN, "2": VINF, "5": GND, "6": SW, "4": FB, "7": BST})
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

# ---------------- 布线 ----------------
for p in pads:
    if p[0] == GND:
        via(GND, p[1], p[2])

link(VIN, J1["1"], J2["1"], PWR_W2, vfirst=False)
link(VIN, J2["1"], Q1["3"], PWR_W2, vfirst=False)
link(VIN, R2["2"], J1["1"], SIG_W, vfirst=False)
link(VG, Q1["1"], R1["1"], SIG_W, vfirst=True)
link(VG, R1["1"], R2["1"], SIG_W, vfirst=False)
link(VINF, Q1["2"], U2["2"], PWR_W2, vfirst=True)
link(VINF, Q1["2"], C4["1"], PWR_W, vfirst=False)
link(VINF, C4["1"], C3["1"], PWR_W, vfirst=False)
link(EN, U2["1"], C4["1"], SIG_W, vfirst=True)          # EN 拉到 VINF 节点
link(SW, U2["6"], L1["1"], PWR_W, vfirst=False)
link(BST, U2["7"], CBST["1"], SIG_W, vfirst=False)
link(SW, CBST["2"], L1["1"], SIG_W, vfirst=False)
link(P5V, L1["2"], C5["1"], PWR_W, vfirst=False)
link(P5V, C5["1"], C6["1"], PWR_W, vfirst=False)
link(FB, U2["4"], RB1["2"], SIG_W, vfirst=True)
link(FB, RB1["2"], RB2["1"], SIG_W, vfirst=False)
link(P5V, RB1["1"], C5["1"], SIG_W, vfirst=True)
link(P5V, C5["1"], C2["1"], PWR_W, vfirst=False)
link(P5VF, C2["1"], J8["2"], PWR_W, vfirst=True)
link(P5VF, J8["2"], J7["2"], PWR_W, vfirst=True)
link(P5VF, J7["2"], J6["2"], PWR_W, vfirst=True)
link(P5V, R11["1"], C2["1"], SIG_W, vfirst=False)
link(VINF, JF2["1"], C4["1"], PWR_W2, vfirst=True)
link(VM, JF2["2"], C1["1"], PWR_W2, vfirst=False)
link(VM, C1["1"], U1["14"], PWR_W, vfirst=True)
link(VM, C1["1"], U3["16"], PWR_W, vfirst=False)
link(VM, C1["1"], R10["1"], SIG_W, vfirst=False)
via(V3, JL["1"][0], JL["1"][1])
via(V3, U1["20"][0], U1["20"][1])
via(V3, U3["9"][0], U3["9"][1])
seg(V3, JL["1"][0], JL["1"][1], JL["1"][0], 50.0, SIG_W, "B.Cu")
seg(V3, JL["1"][0], 50.0, U1["20"][0], 50.0, SIG_W, "B.Cu")
seg(V3, U1["20"][0], 50.0, U1["20"][0], U1["20"][1], SIG_W, "B.Cu")
seg(V3, U1["20"][0], 50.0, U3["9"][0], 50.0, SIG_W, "B.Cu")
seg(V3, U3["9"][0], 50.0, U3["9"][0], U3["9"][1], SIG_W, "B.Cu")
link(V3, U3["9"], R5["1"], SIG_W, vfirst=False)
link(N["MOTA1"], U1["1"], J3["1"], PWR_W, vfirst=True)
link(N["MOTA2"], U1["2"], J3["2"], PWR_W, vfirst=True)
link(N["MOTB1"], U1["12"], J4["1"], PWR_W, vfirst=True)
link(N["MOTB2"], U1["11"], J4["2"], PWR_W, vfirst=True)


def broute(n, p1, p2, mid_y):
    (x1, y1), (x2, y2) = p1, p2
    via(n, x1, y1)
    via(n, x2, y2)
    seg(n, x1, y1, x1, mid_y, SIG_W, "B.Cu")
    seg(n, x1, mid_y, x2, mid_y, SIG_W, "B.Cu")
    seg(n, x2, mid_y, x2, y2, SIG_W, "B.Cu")


CH = 34.0
for nm, a, b in ((N["AIN1"], JR["10"], U1["21"]), (N["AIN2"], JR["9"], U1["22"]),
                 (N["PWMA"], JR["8"], U1["23"]), (N["BIN1"], JR["7"], U1["17"]),
                 (N["BIN2"], JR["6"], U1["16"]), (N["PWMB"], JR["5"], U1["15"]),
                 (N["STBY"], JR["13"], U1["19"])):
    broute(nm, a, b, CH)
for nm, rp, jx in ((N["AIN1"], R6, JR["10"]), (N["AIN2"], R7, JR["9"]),
                   (N["BIN1"], R8, JR["7"]), (N["BIN2"], R9, JR["6"])):
    via(nm, rp["1"][0], rp["1"][1])
    seg(nm, rp["1"][0], rp["1"][1], rp["1"][0], CH, SIG_W, "B.Cu")
    seg(nm, rp["1"][0], CH, jx[0], CH, SIG_W, "B.Cu")
link(N["STBY"], R5["2"], U1["19"], SIG_W, vfirst=False)
broute(N["STEP"], JR["11"], U3["7"], 25.5)
broute(N["DIR"], JR["12"], U3["8"], 24.5)
link(N["STEP"], R3["1"], U3["7"], SIG_W, vfirst=False)
link(N["DIR"], R4["1"], U3["8"], SIG_W, vfirst=False)
broute(N["SRV1"], JL["4"], J6["1"], 9.5)
broute(N["SRV2"], JL["3"], J7["1"], 8.0)
broute(N["SRV3"], JR["3"], J8["1"], 7.0)
link(N["LED_VM"], R10["2"], D1["1"], SIG_W, vfirst=True)
seg(N["LEDK1"], D1["2"][0], D1["2"][1], D1["2"][0], D1["2"][1] + 2.0, SIG_W)
via(GND, D1["2"][0], D1["2"][1] + 2.0)
link(N["LED_5V"], R11["2"], D2["1"], SIG_W, vfirst=True)
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
    L.append('  (gr_text "MOC-Motor v1.0 ROW_SP=%smm" (at 31 31) (layer "F.SilkS")'
             ' (effects (font (size 1.2 1.2) (thickness 0.2))))' % fmt(ROW_SP))
    L.append(')')
    return "\n".join(L)


# ---------------- 连通性自检 ----------------
def check():
    ZONE_NETS = {GND}          # 铺铜网络: KiCad 填充后自动连通
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

    items = []
    for p in pads:
        items.append((p[0], p[1], p[2]))
    for v in vias:
        items.append((v[0], v[1], v[2]))
    for it in items:
        parent[it] = it
    seg_keys = []
    for i, s in enumerate(segs):
        key = ("S", i)
        parent[key] = key
        seg_keys.append(key)
        n, x1, y1, x2, y2, w, layer = s
        for it in items:
            if it[0] != n:
                continue
            tol = w / 2 + 0.5
            if abs(x1 - x2) < 1e-6:
                if abs(it[1] - x1) <= tol and min(y1, y2) - tol <= it[2] <= max(y1, y2) + tol:
                    union(key, it)
            else:
                if abs(it[2] - y1) <= tol and min(x1, x2) - tol <= it[1] <= max(x1, x2) + tol:
                    union(key, it)
    for i, a in enumerate(segs):
        for j, b in enumerate(segs):
            if j <= i or a[0] != b[0] or a[6] != b[6]:
                continue
            for ea in ((a[1], a[2]), (a[3], a[4])):
                for eb in ((b[1], b[2]), (b[3], b[4])):
                    if abs(ea[0] - eb[0]) < 0.02 and abs(ea[1] - eb[1]) < 0.02:
                        union(seg_keys[i], seg_keys[j])
    groups = defaultdict(set)
    for it in items:
        groups[it[0]].add(find(it))
    bad = [(nets[n - 1], len(r)) for n, r in groups.items() if len(r) > 1 and n not in ZONE_NETS]
    gnd_roots = len(groups.get(GND, set()))
    print("=== 连通性自检 ===")
    print("GND: %d 簇 (背面铺铜统一, KiCad 填充后连通)" % gnd_roots)
    if not bad:
        print("PASS: 除 GND 外 %d 个网络全部连通" % (len(groups) - 1))
        return True
    print("FAIL: %d 个网络未连通:" % len(bad))
    for name, cnt in bad:
        print("  - %s: %d 簇" % (name, cnt))
    return False


if __name__ == "__main__":
    txt = emit()
    with open("moc_motor_v1.kicad_pcb", "w", encoding="utf-8") as f:
        f.write(txt)
    print("moc_motor_v1.kicad_pcb: %d 封装 / %d 走线 / %d 过孔 / %d 网络" % (len(fps), len(segs), len(vias), len(nets)))
    sys.exit(0 if check() else 2)
