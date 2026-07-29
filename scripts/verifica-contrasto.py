"""Verifica WCAG delle coppie testo/sfondo definite in src/index.css."""
import math, re, sys

def oklch_to_srgb(L, C, h_deg):
    h = math.radians(h_deg)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    def enc(u):
        u = max(0.0, min(1.0, u))
        return 12.92 * u if u <= 0.0031308 else 1.055 * u ** (1 / 2.4) - 0.055
    return enc(r), enc(g), enc(bb)

def lum(rgb):
    def lin(u):
        return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(c1, c2):
    a, b = lum(c1), lum(c2)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)

def blend(fg, alpha, bg):
    return tuple(fg[i] * alpha + bg[i] * (1 - alpha) for i in range(3))

# --- estrae i blocchi di palette da index.css --------------------------------
css = open(sys.argv[1]).read()
OKLCH = re.compile(r'(--t-[a-z-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*/\s*([\d.]+))?\)')

def palette(block):
    out = {}
    for name, L, C, h, alpha in OKLCH.findall(block):
        out[name] = (oklch_to_srgb(float(L), float(C), float(h)),
                     float(alpha) if alpha else 1.0)
    return out

blocks = css.split(':root')
chiaro = palette(blocks[1])
scuro = palette(css[css.index("data-tema='scuro'"):])

PAIRS = [
    # (testo, sfondo, soglia, nota)
    ('--t-testo', '--t-superficie', 4.5, 'testo su card'),
    ('--t-testo', '--t-sfondo', 4.5, 'testo su pagina'),
    ('--t-testo-debole', '--t-superficie', 4.5, 'testo debole su card'),
    ('--t-testo-debole', '--t-sfondo', 4.5, 'testo debole su pagina'),
    ('--t-testo-tenue', '--t-superficie', 3.0, 'testo tenue (solo decorativo)'),
    ('--t-primario-testo', '--t-primario', 4.5, 'label bottone primario'),
    ('--t-danger-soft-text', '--t-danger-soft', 4.5, 'tinta danger'),
    ('--t-success-soft-text', '--t-success-soft', 4.5, 'tinta success'),
    ('--t-info-soft-text', '--t-info-soft', 4.5, 'tinta info'),
    ('--t-warning-soft-text', '--t-warning-soft', 4.5, 'tinta warning'),
    ('--t-neutral-soft-text', '--t-neutral-soft', 4.5, 'tinta neutral'),
    ('--t-danger-fill-text', '--t-danger-fill', 4.5, 'bottone registrazione'),
    ('--t-danger-soft-text', '--t-superficie', 4.5, 'errore su card'),
    ('--t-info-soft-text', '--t-superficie', 4.5, 'link su card'),
    ('--t-success-soft-text', '--t-superficie', 4.5, 'positivo su card'),
    ('--t-primario', '--t-superficie', 4.5, 'primario come testo/link'),
    # Segmentato: il segmento scelto usa il token "-text" come RIEMPIMENTO e
    # la superficie come testo. E' la stessa coppia letta al contrario, quindi
    # lo stesso rapporto — ma va verificata per ogni tinta, non solo per quelle
    # che compaiono come testo su card.
    ('--t-neutral-soft-text', '--t-superficie', 4.5, 'segmento scelto neutro'),
    ('--t-warning-soft-text', '--t-superficie', 4.5, 'segmento scelto avviso'),
    # non-testo: 3:1 basta (WCAG 1.4.11 componenti UI)
    ('--t-bordo', '--t-superficie', 1.3, 'bordo su card (solo visibile)'),
    ('--t-bordo-forte', '--t-superficie', 3.0, 'bordo forte / divisore'),
    ('--t-focus', '--t-sfondo', 3.0, 'anello di focus su pagina'),
    ('--t-focus', '--t-superficie', 3.0, 'anello di focus su card'),
    ('--t-info-soft-border', '--t-superficie', 1.3, 'bordo tinta info'),
]

bad = 0
for nome, pal in (('CHIARO', chiaro), ('SCURO', scuro)):
    print(f'\n===== TEMA {nome} =====')
    bg_base = pal['--t-superficie'][0]
    for fg_k, bg_k, soglia, nota in PAIRS:
        if fg_k not in pal or bg_k not in pal:
            print(f'  ?  {nota}: variabile mancante')
            continue
        fg, fa = pal[fg_k]
        bg, ba = pal[bg_k]
        if ba < 1:
            bg = blend(bg, ba, bg_base)
        if fa < 1:
            fg = blend(fg, fa, bg)
        r = contrast(fg, bg)
        ok = r >= soglia
        if not ok:
            bad += 1
        print(f'  {"OK " if ok else "!! "} {r:5.2f}:1  (min {soglia})  {nota}')

print(f'\n{"TUTTE LE COPPIE PASSANO" if bad == 0 else f"{bad} COPPIE SOTTO SOGLIA"}')
sys.exit(1 if bad else 0)
