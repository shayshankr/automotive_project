from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

# ── colour palette ──────────────────────────────────────────────────────────
BG        = (245, 248, 252)
DARK      = (44,  62,  80)
BLUE      = (16,  85, 168)
GREEN     = (0,  122,  56)
RED       = (181,  0,   9)
PURPLE    = (122, 29, 184)
ORANGE    = (230, 126,  34)
TEAL      = (26, 188, 156)
SAT_COLOR = (44,  62,  80)

def get_font(size, bold=False):
    """Try to load a real font; fall back to default."""
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# ─────────────────────────────────────────────────────────────────────────────
#  Helpers: draw a tiny psychrometric chart inside any ImageDraw context
# ─────────────────────────────────────────────────────────────────────────────
def draw_psychro_chart(draw, x0, y0, w, h, line_width=2):
    """Draw a simplified psychrometric chart in the rect (x0,y0)→(x0+w, y0+h)."""
    DBT_MIN, DBT_MAX = -10, 50
    W_MIN,   W_MAX   =   0, 0.030

    def tx(dbt):
        return x0 + (dbt - DBT_MIN) / (DBT_MAX - DBT_MIN) * w

    def ty(ww):
        return y0 + h - (ww - W_MIN) / (W_MAX - W_MIN) * h

    # Background fill
    draw.rectangle([x0, y0, x0 + w, y0 + h], fill=BG)

    # Grid
    for t in range(-10, 55, 10):
        x = tx(t)
        draw.line([(x, y0), (x, y0 + h)], fill=(180, 180, 180), width=1)
    for i in range(7):
        wv = i * 0.005
        y = ty(wv)
        draw.line([(x0, y), (x0 + w, y)], fill=(180, 180, 180), width=1)

    # Saturation curve (100 % RH ≈ exponential rise)
    sat_pts = []
    for t in range(-10, 51, 2):
        # simplified saturation humidity ratio
        pws = 610.78 * math.exp(17.27 * t / (t + 237.3))  # Pa
        p   = 101325
        ws  = 0.622 * pws / (p - pws)
        ws  = min(ws, W_MAX)
        sat_pts.append((tx(t), ty(ws)))
    if len(sat_pts) > 1:
        draw.line(sat_pts, fill=SAT_COLOR, width=line_width + 1)

    # Constant-RH curves (20 %, 40 %, 60 %, 80 %)
    rh_colors = [BLUE, BLUE, BLUE, BLUE]
    for rh, col in zip([0.2, 0.4, 0.6, 0.8], rh_colors):
        pts = []
        for t in range(-10, 51, 2):
            pws = 610.78 * math.exp(17.27 * t / (t + 237.3))
            p   = 101325
            ws  = 0.622 * rh * pws / (p - rh * pws)
            ws  = min(ws, W_MAX)
            if ws < 0:
                continue
            pts.append((tx(t), ty(ws)))
        if len(pts) > 1:
            draw.line(pts, fill=(*col, 140), width=1)

    # Border
    draw.rectangle([x0, y0, x0 + w, y0 + h], outline=DARK, width=line_width)

# ─────────────────────────────────────────────────────────────────────────────
#  1. APP ICON  512 × 512
# ─────────────────────────────────────────────────────────────────────────────
def make_icon():
    S = 512
    img  = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Rounded-square background
    r = 80
    draw.rounded_rectangle([0, 0, S, S], radius=r, fill=DARK)

    # Mini chart area
    pad = 55
    cw, ch = S - 2 * pad, S - 2 * pad
    draw_psychro_chart(draw, pad, pad, cw, ch, line_width=3)

    # Bold "P" watermark / logo letter centred
    font_big = get_font(200, bold=True)
    txt  = "P"
    bbox = draw.textbbox((0, 0), txt, font=font_big)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((S - tw) // 2 - bbox[0], (S - th) // 2 - bbox[1]),
              txt, font=font_big, fill=(*TEAL, 60))

    # Accent dot (state point)
    cx, cy = int(S * 0.65), int(S * 0.38)
    draw.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=ORANGE)
    draw.ellipse([cx -  7, cy -  7, cx +  7, cy +  7], fill="white")

    path = os.path.join(OUT, "icon_512.png")
    img.save(path)
    print(f"Saved {path}")

# ─────────────────────────────────────────────────────────────────────────────
#  2. FEATURE GRAPHIC  1024 × 500
# ─────────────────────────────────────────────────────────────────────────────
def make_feature():
    W, H = 1024, 500
    img  = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Chart on right half
    chart_x, chart_y = 480, 40
    chart_w, chart_h = 510, 420
    draw_psychro_chart(draw, chart_x, chart_y, chart_w, chart_h, line_width=2)

    # State-point dots on chart
    for dbt, ww, col in [(25, 0.010, ORANGE), (35, 0.018, RED), (20, 0.008, TEAL)]:
        DBT_MIN, DBT_MAX, W_MIN, W_MAX = -10, 50, 0, 0.030
        cx = chart_x + (dbt - DBT_MIN) / (DBT_MAX - DBT_MIN) * chart_w
        cy = chart_y + chart_h - (ww - W_MIN) / (W_MAX - W_MIN) * chart_h
        draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=col)
        draw.ellipse([cx -  4, cy -  4, cx +  4, cy +  4], fill="white")

    # Left side text
    f_big   = get_font(52, bold=True)
    f_med   = get_font(28)
    f_small = get_font(22)

    draw.text((40, 60),  "Psychro Chart",      font=f_big,   fill="white")
    draw.text((40, 130), "HVAC Engineering Tool", font=f_med, fill=(*TEAL[:3],))

    features = [
        "Psychrometric Chart Viewer",
        "8 HVAC Process Types",
        "State Point Calculator",
        "Zoom & Pan Chart",
        "SI Units",
    ]
    y = 190
    for feat in features:
        draw.text((56, y), f"• {feat}", font=f_small, fill=(200, 220, 240))
        y += 38

    path = os.path.join(OUT, "feature_1024x500.png")
    img.save(path)
    print(f"Saved {path}")

# ─────────────────────────────────────────────────────────────────────────────
#  3. SCREENSHOT helpers
# ─────────────────────────────────────────────────────────────────────────────
SW, SH = 1080, 1920
STATUS_H   = 80
NAV_H      = 100
BAR_H      = 110   # bottom-nav bar height

def draw_status_bar(draw, dark=True):
    fg = "white" if dark else DARK
    f  = get_font(26, bold=True)
    draw.text((44, 24), "9:41", font=f, fill=fg)
    # battery / signal icons (simplified rectangles)
    for i in range(4):
        draw.rectangle([SW - 180 + i * 28, 30, SW - 160 + i * 28, 52], fill=fg)
    draw.rectangle([SW - 80, 26, SW - 44, 54], outline=fg, width=3)
    draw.rectangle([SW - 78, 29, SW - 56, 51], fill=fg)

def draw_bottom_nav(draw, active_tab, bg):
    tabs = [("Calculator", 0), ("Processes", 1), ("Chart", 2)]
    tab_w = SW // 3
    for label, idx in tabs:
        x0 = idx * tab_w
        is_active = idx == active_tab
        col = TEAL if is_active else (120, 120, 140)
        f   = get_font(28, bold=is_active)
        # icon placeholder circle
        cx = x0 + tab_w // 2
        cy = SH - NAV_H + 28
        r  = 18
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     fill=col if is_active else None,
                     outline=col, width=2)
        tw = draw.textlength(label, font=f)
        draw.text((cx - tw // 2, SH - NAV_H + 58), label, font=f, fill=col)

def make_screenshot_calculator():
    img  = Image.new("RGB", (SW, SH), (30, 30, 46))
    draw = ImageDraw.Draw(img)

    # Status bar
    draw_status_bar(draw)

    # App bar
    draw.rectangle([0, STATUS_H, SW, STATUS_H + BAR_H], fill=DARK)
    f_title = get_font(44, bold=True)
    draw.text((44, STATUS_H + 28), "State Calculator", font=f_title, fill="white")

    # Card background
    card_y = STATUS_H + BAR_H + 30
    card_h = SH - card_y - NAV_H - 40
    draw.rounded_rectangle([30, card_y, SW - 30, card_y + card_h],
                            radius=24, fill=(42, 47, 65))

    # Input fields
    f_label = get_font(30, bold=True)
    f_value = get_font(34)
    f_result = get_font(28)

    fields = [
        ("Dry Bulb Temperature (DBT)", "25.0 °C"),
        ("Relative Humidity (RH)",     "60 %"),
        ("Atmospheric Pressure",       "101.325 kPa"),
    ]
    fy = card_y + 50
    for label, val in fields:
        draw.text((70, fy), label, font=f_label, fill=(160, 170, 200))
        fy += 42
        draw.rounded_rectangle([60, fy, SW - 60, fy + 72],
                                radius=12, fill=(55, 62, 85), outline=(80, 90, 120), width=2)
        draw.text((84, fy + 18), val, font=f_value, fill="white")
        fy += 90

    # Divider
    draw.line([(60, fy + 10), (SW - 60, fy + 10)], fill=(70, 80, 100), width=2)
    fy += 30

    # Results
    results = [
        ("Wet Bulb Temperature",  "19.0 °C",  TEAL),
        ("Dew Point Temperature", "16.7 °C",  BLUE),
        ("Humidity Ratio (W)",    "0.01189",   GREEN),
        ("Enthalpy (h)",          "55.5 kJ/kg", RED),
        ("Specific Volume (v)",   "0.861 m3/kg", PURPLE),
        ("Vapour Pressure (Pv)",  "1.903 kPa",  ORANGE),
    ]
    for name, val, col in results:
        draw.text((70, fy), name, font=f_result, fill=(140, 150, 180))
        tw = draw.textlength(val, font=get_font(32, bold=True))
        draw.text((SW - 70 - tw, fy), val, font=get_font(32, bold=True), fill=col)
        fy += 58

    # Calculate button
    btn_y = card_y + card_h - 110
    draw.rounded_rectangle([60, btn_y, SW - 60, btn_y + 80],
                            radius=16, fill=TEAL)
    f_btn = get_font(38, bold=True)
    btxt  = "Calculate"
    btw   = draw.textlength(btxt, font=f_btn)
    draw.text(((SW - btw) // 2, btn_y + 18), btxt, font=f_btn, fill="white")

    # Bottom nav
    draw.rectangle([0, SH - NAV_H, SW, SH], fill=DARK)
    draw_bottom_nav(draw, active_tab=0, bg=DARK)

    path = os.path.join(OUT, "screenshot_1_calculator.png")
    img.save(path)
    print(f"Saved {path}")

def make_screenshot_processes():
    img  = Image.new("RGB", (SW, SH), (30, 30, 46))
    draw = ImageDraw.Draw(img)

    draw_status_bar(draw)
    draw.rectangle([0, STATUS_H, SW, STATUS_H + BAR_H], fill=DARK)
    f_title = get_font(44, bold=True)
    draw.text((44, STATUS_H + 28), "HVAC Processes", font=f_title, fill="white")

    f_head  = get_font(32, bold=True)
    f_body  = get_font(27)
    f_badge = get_font(24, bold=True)

    processes = [
        ("Sensible Heating",         "DBT rises, W constant",       RED),
        ("Sensible Cooling",         "DBT falls, W constant",       BLUE),
        ("Humidification",           "W rises, DBT constant",       GREEN),
        ("Dehumidification",         "W falls, DBT constant",       ORANGE),
        ("Cooling & Dehumidification","DBT and W both fall",        PURPLE),
        ("Heating & Humidification", "DBT and W both rise",         RED),
        ("Evaporative Cooling",      "DBT falls, W rises (WBT const)", TEAL),
        ("Adiabatic Mixing",         "Mix two air streams",         (140, 100, 200)),
    ]

    cy = STATUS_H + BAR_H + 30
    card_pad = 30
    card_h   = (SH - cy - NAV_H - 20) // len(processes) - 10

    for name, desc, col in processes:
        draw.rounded_rectangle([card_pad, cy, SW - card_pad, cy + card_h],
                                radius=14, fill=(42, 47, 65))
        # colour stripe
        draw.rounded_rectangle([card_pad, cy, card_pad + 12, cy + card_h],
                                radius=6, fill=col)
        draw.text((card_pad + 28, cy + 14), name, font=f_head, fill="white")
        draw.text((card_pad + 28, cy + 52), desc, font=f_body,  fill=(160, 170, 200))
        cy += card_h + 10

    draw.rectangle([0, SH - NAV_H, SW, SH], fill=DARK)
    draw_bottom_nav(draw, active_tab=1, bg=DARK)

    path = os.path.join(OUT, "screenshot_2_processes.png")
    img.save(path)
    print(f"Saved {path}")

def make_screenshot_chart():
    img  = Image.new("RGB", (SW, SH), (30, 30, 46))
    draw = ImageDraw.Draw(img, "RGBA")

    draw_status_bar(draw)
    draw.rectangle([0, STATUS_H, SW, STATUS_H + BAR_H], fill=DARK)
    f_title = get_font(44, bold=True)
    draw.text((44, STATUS_H + 28), "Psychrometric Chart", font=f_title, fill="white")

    # Full chart canvas
    cx0 = 30
    cy0 = STATUS_H + BAR_H + 20
    cw  = SW - 60
    ch  = SH - cy0 - NAV_H - 20
    draw_psychro_chart(draw, cx0, cy0, cw, ch, line_width=2)

    # Re-draw saturation + label
    DBT_MIN, DBT_MAX = -10, 50
    W_MIN, W_MAX     =   0, 0.030

    def tx(dbt):
        return cx0 + (dbt - DBT_MIN) / (DBT_MAX - DBT_MIN) * cw

    def ty(ww):
        return cy0 + ch - (ww - W_MIN) / (W_MAX - W_MIN) * ch

    f_lbl = get_font(22)

    # RH labels
    for rh_int in [20, 40, 60, 80]:
        rh  = rh_int / 100
        pws = 610.78 * math.exp(17.27 * 45 / (45 + 237.3))
        p   = 101325
        ws  = min(0.622 * rh * pws / (p - rh * pws), W_MAX)
        lx  = tx(45)
        ly  = ty(ws)
        draw.text((lx + 4, ly - 18), f"{rh_int}%", font=f_lbl, fill=(*BLUE,))

    # Three state points
    pts = [(25, 0.010, ORANGE, "A"), (35, 0.018, RED, "B"), (18, 0.007, TEAL, "C")]
    for dbt, ww, col, lbl in pts:
        px = tx(dbt)
        py = ty(ww)
        r  = 18
        draw.ellipse([px - r, py - r, px + r, py + r], fill=(*col, 200))
        draw.ellipse([px - 7, py - 7, px + 7, py + 7], fill="white")
        f_pt = get_font(28, bold=True)
        draw.text((px + 22, py - 22), lbl, font=f_pt, fill=col)

    # Process arrow A→B
    x1, y1 = tx(25), ty(0.010)
    x2, y2 = tx(35), ty(0.018)
    draw.line([(x1, y1), (x2, y2)], fill=DARK, width=4)
    # Arrowhead
    dx, dy = x2 - x1, y2 - y1
    length = math.sqrt(dx * dx + dy * dy)
    ux, uy = dx / length, dy / length
    px2, py2 = -uy, ux
    hl, hw = 28, 14
    hx, hy = x2 - ux * hl, y2 - uy * hl
    draw.polygon([(x2, y2),
                  (hx + px2 * hw, hy + py2 * hw),
                  (hx - px2 * hw, hy - py2 * hw)], fill=DARK)

    # Legend box (top-right)
    lx0, ly0, lw, lh = SW - 320, cy0 + 20, 280, 200
    draw.rounded_rectangle([lx0, ly0, lx0 + lw, ly0 + lh],
                            radius=12, fill=(255, 255, 255, 210))
    f_leg = get_font(24)
    legend_items = [
        (SAT_COLOR, "Saturation (100%)"),
        (BLUE,      "Const. RH"),
        (GREEN,     "Const. WBT"),
        (RED,       "Const. Enthalpy"),
        (PURPLE,    "Const. Sp. Volume"),
    ]
    ly_cur = ly0 + 14
    for col, lbl in legend_items:
        draw.rounded_rectangle([lx0 + 12, ly_cur + 4, lx0 + 28, ly_cur + 20],
                                radius=3, fill=col)
        draw.text((lx0 + 36, ly_cur), lbl, font=f_leg, fill=DARK)
        ly_cur += 34

    draw.rectangle([0, SH - NAV_H, SW, SH], fill=DARK)
    draw_bottom_nav(draw, active_tab=2, bg=DARK)

    path = os.path.join(OUT, "screenshot_3_chart.png")
    img.save(path)
    print(f"Saved {path}")

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    make_icon()
    make_feature()
    make_screenshot_calculator()
    make_screenshot_processes()
    make_screenshot_chart()
    print("All assets generated successfully.")
