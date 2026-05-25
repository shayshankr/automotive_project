"""
Generate PNG launcher icons at every required Android density
and place them directly into the mipmap-* resource folders.
Also writes updated adaptive icon XMLs.
"""
from PIL import Image, ImageDraw, ImageFont
import math, os, shutil

RES_DIR = r"C:\Users\shays\Desktop\interview\psychrochart-android\app\src\main\res"

# Adaptive icon foreground is drawn on a 108dp canvas; the safe zone is 66dp centre.
# For PNGs we just need: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
DENSITIES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Palette
BG_DARK  = (44,  62,  80)   # #2C3E50
TEAL     = (26, 188, 156)   # #1ABC9C
ORANGE   = (230,126,  34)   # #E67E22
WHITE    = (255,255,255)
BLUE     = (16,  85, 168)

def get_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else \
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    """Draw a square launcher icon of `size` × `size` pixels."""
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # ── Background circle (fills the square) ──────────────────────────────
    draw.ellipse([0, 0, size - 1, size - 1], fill=BG_DARK)

    # ── Margin for chart area ──────────────────────────────────────────────
    m   = int(size * 0.14)        # outer margin
    cw  = size - 2 * m            # chart width
    ch  = int(cw * 0.75)          # chart height (4:3)
    cx0 = m
    cy0 = (size - ch) // 2

    # Chart background
    draw.rectangle([cx0, cy0, cx0 + cw, cy0 + ch], fill=(*WHITE, 18))

    # ── Simplified saturation curve ────────────────────────────────────────
    DBT_MIN, DBT_MAX = -10, 50
    W_MIN,   W_MAX   =   0, 0.030

    def tx(dbt):
        return cx0 + (dbt - DBT_MIN) / (DBT_MAX - DBT_MIN) * cw

    def ty(ww):
        return cy0 + ch - (ww - W_MIN) / (W_MAX - W_MIN) * ch

    # Saturation curve points
    sat_pts = []
    for t in range(-10, 51, 3):
        pws = 610.78 * math.exp(17.27 * t / (t + 237.3))
        ws  = min(0.622 * pws / (101325 - pws), W_MAX)
        sat_pts.append((tx(t), ty(ws)))

    lw = max(1, size // 48)
    if len(sat_pts) > 1:
        draw.line(sat_pts, fill=(*WHITE,), width=lw + 1)

    # Two RH curves (40 %, 70 %)
    for rh in [0.40, 0.70]:
        pts = []
        for t in range(-10, 51, 3):
            pws = 610.78 * math.exp(17.27 * t / (t + 237.3))
            ws  = min(0.622 * rh * pws / (101325 - rh * pws), W_MAX)
            if ws < 0:
                continue
            pts.append((tx(t), ty(ws)))
        if len(pts) > 1:
            draw.line(pts, fill=(*TEAL, 180), width=lw)

    # Chart border
    draw.rectangle([cx0, cy0, cx0 + cw, cy0 + ch],
                   outline=(*WHITE, 80), width=lw)

    # ── State-point dot ────────────────────────────────────────────────────
    dot_dbt, dot_w = 28, 0.012
    dx = tx(dot_dbt)
    dy = ty(dot_w)
    r  = max(3, size // 20)
    draw.ellipse([dx - r, dy - r, dx + r, dy + r], fill=ORANGE)
    ri = max(1, r // 2)
    draw.ellipse([dx - ri, dy - ri, dx + ri, dy + ri], fill=WHITE)

    # ── "P" letter watermark (very faint) ─────────────────────────────────
    fsize = max(8, int(size * 0.40))
    font  = get_font(fsize, bold=True)
    bbox  = draw.textbbox((0, 0), "P", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((size - tw) // 2 - bbox[0], (size - th) // 2 - bbox[1]),
        "P", font=font, fill=(*TEAL, 35)
    )

    return img


def main():
    for folder, px in DENSITIES.items():
        mipmap_dir = os.path.join(RES_DIR, folder)
        os.makedirs(mipmap_dir, exist_ok=True)

        # Remove old XML adaptive icon files (they'd conflict with our PNGs)
        for xml_name in ("ic_launcher.xml", "ic_launcher_round.xml"):
            xml_path = os.path.join(mipmap_dir, xml_name)
            if os.path.exists(xml_path):
                os.remove(xml_path)
                print(f"  Removed {xml_path}")

        # Write PNG launcher icons
        icon = draw_icon(px)
        for png_name in ("ic_launcher.png", "ic_launcher_round.png"):
            out_path = os.path.join(mipmap_dir, png_name)
            icon.save(out_path)
            print(f"  Saved  {out_path}  ({px}×{px})")

    # ── mipmap-anydpi-v26  (adaptive icon for API 26+) ─────────────────────
    anydpi_dir = os.path.join(RES_DIR, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)

    adaptive_xml = """\
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
"""
    for xml_name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        xml_path = os.path.join(anydpi_dir, xml_name)
        with open(xml_path, "w") as f:
            f.write(adaptive_xml)
        print(f"  Wrote  {xml_path}")

    # ── drawable: background = solid dark colour ────────────────────────────
    drawable_dir = os.path.join(RES_DIR, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)

    bg_xml = """\
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#FF2C3E50"/>
</shape>
"""
    bg_path = os.path.join(drawable_dir, "ic_launcher_background.xml")
    with open(bg_path, "w") as f:
        f.write(bg_xml)
    print(f"  Wrote  {bg_path}")

    # ── drawable: foreground = vector chart icon ────────────────────────────
    fg_xml = """\
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- Chart background rect (safe zone 21..87) -->
    <path
        android:fillColor="#14FFFFFF"
        android:pathData="M20,30 L88,30 L88,82 L20,82 Z"/>

    <!-- Saturation curve (approximate arc) -->
    <path
        android:strokeColor="#FFFFFF"
        android:strokeWidth="3"
        android:fillColor="#00000000"
        android:pathData="M20,82 Q40,78 55,60 Q70,42 88,30"/>

    <!-- 70% RH curve -->
    <path
        android:strokeColor="#1ABC9C"
        android:strokeWidth="2"
        android:fillColor="#00000000"
        android:pathData="M20,82 Q42,80 58,68 Q74,56 88,42"/>

    <!-- 40% RH curve -->
    <path
        android:strokeColor="#1ABC9C"
        android:strokeWidth="2"
        android:fillColor="#00000000"
        android:pathData="M20,82 Q45,81 62,74 Q78,68 88,58"/>

    <!-- Chart border -->
    <path
        android:strokeColor="#44FFFFFF"
        android:strokeWidth="2"
        android:fillColor="#00000000"
        android:pathData="M20,30 L88,30 L88,82 L20,82 Z"/>

    <!-- State-point dot (orange) -->
    <path
        android:fillColor="#E67E22"
        android:pathData="M65,52 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0"/>
    <!-- White centre -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M65,52 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0"/>
</vector>
"""
    fg_path = os.path.join(drawable_dir, "ic_launcher_foreground.xml")
    with open(fg_path, "w") as f:
        f.write(fg_xml)
    print(f"  Wrote  {fg_path}")

    print("\nAll launcher icon assets written successfully.")


if __name__ == "__main__":
    main()
