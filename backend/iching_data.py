# I Ching (Yijing) reference data and coin-oracle computation.
#
# Trigram line patterns and the King Wen sequence composition table were
# verified against external references (Wikipedia's hexagram list, and
# independent trigram-structure descriptions) rather than reproduced purely
# from memory - a transposition error here would silently give wrong
# divination results, which matters for an app selling metaphysics content.
# Hexagram Spanish titles follow the standard Wilhelm/Baynes tradition
# (the same one used in "El Libro de las Mutaciones", the standard Spanish
# edition) - confirmed against the two examples in the rork/iching.jpg
# mockup ("29 Kan -> Lo abismal (repetido)", "40 Xie -> La liberacion").

from typing import List, Dict, Tuple

# Each trigram's 3 lines, bottom to top. 1 = yang (solid), 0 = yin (broken).
TRIGRAM_LINES: Dict[str, Tuple[int, int, int]] = {
    "Heaven": (1, 1, 1),    # Qian
    "Earth": (0, 0, 0),     # Kun
    "Thunder": (1, 0, 0),   # Zhen - yang at bottom
    "Water": (0, 1, 0),     # Kan - yang in middle
    "Mountain": (0, 0, 1),  # Gen - yang at top
    "Wind": (0, 1, 1),      # Xun - yin at bottom
    "Fire": (1, 0, 1),      # Li - yin in middle
    "Lake": (1, 1, 0),      # Dui - yin at top
}
TRIGRAM_BY_LINES: Dict[Tuple[int, int, int], str] = {v: k for k, v in TRIGRAM_LINES.items()}

# (number, lower trigram, upper trigram, Chinese name, pinyin, Spanish title)
HEXAGRAMS: List[Tuple[int, str, str, str, str, str]] = [
    (1, "Heaven", "Heaven", "乾", "qián", "Lo Creativo"),
    (2, "Earth", "Earth", "坤", "kūn", "Lo Receptivo"),
    (3, "Thunder", "Water", "屯", "zhūn", "La Dificultad Inicial"),
    (4, "Water", "Mountain", "蒙", "méng", "La Necedad Juvenil"),
    (5, "Heaven", "Water", "需", "xū", "La Espera"),
    (6, "Water", "Heaven", "訟", "sòng", "El Conflicto"),
    (7, "Water", "Earth", "師", "shī", "El Ejército"),
    (8, "Earth", "Water", "比", "bǐ", "La Solidaridad"),
    (9, "Heaven", "Wind", "小畜", "xiǎo chù", "La Fuerza Domesticadora de lo Pequeño"),
    (10, "Lake", "Heaven", "履", "lǚ", "La Conducta"),
    (11, "Heaven", "Earth", "泰", "tài", "La Paz"),
    (12, "Earth", "Heaven", "否", "pǐ", "El Estancamiento"),
    (13, "Fire", "Heaven", "同人", "tóng rén", "La Comunidad con los Hombres"),
    (14, "Heaven", "Fire", "大有", "dà yǒu", "La Posesión de lo Grande"),
    (15, "Mountain", "Earth", "謙", "qiān", "La Modestia"),
    (16, "Earth", "Thunder", "豫", "yù", "El Entusiasmo"),
    (17, "Thunder", "Lake", "隨", "suí", "El Seguimiento"),
    (18, "Wind", "Mountain", "蠱", "gǔ", "El Trabajo en lo Corrompido"),
    (19, "Lake", "Earth", "臨", "lín", "El Acercamiento"),
    (20, "Earth", "Wind", "觀", "guān", "La Contemplación"),
    (21, "Thunder", "Fire", "噬嗑", "shì kè", "Morder Atravesando"),
    (22, "Fire", "Mountain", "賁", "bì", "La Gracia"),
    (23, "Earth", "Mountain", "剝", "bō", "La Fragmentación"),
    (24, "Thunder", "Earth", "復", "fù", "El Retorno"),
    (25, "Thunder", "Heaven", "无妄", "wú wàng", "La Inocencia"),
    (26, "Heaven", "Mountain", "大畜", "dà chù", "La Fuerza Domesticadora de lo Grande"),
    (27, "Thunder", "Mountain", "頤", "yí", "Las Comisuras de la Boca (La Nutrición)"),
    (28, "Wind", "Lake", "大過", "dà guò", "La Preponderancia de lo Grande"),
    (29, "Water", "Water", "坎", "kǎn", "Lo Abismal (repetido)"),
    (30, "Fire", "Fire", "離", "lí", "Lo Adherente (repetido)"),
    (31, "Mountain", "Lake", "咸", "xián", "El Influjo"),
    (32, "Wind", "Thunder", "恆", "héng", "La Duración"),
    (33, "Mountain", "Heaven", "遯", "dùn", "La Retirada"),
    (34, "Heaven", "Thunder", "大壯", "dà zhuàng", "El Poder de lo Grande"),
    (35, "Earth", "Fire", "晉", "jìn", "El Progreso"),
    (36, "Fire", "Earth", "明夷", "míng yí", "El Oscurecimiento de la Luz"),
    (37, "Fire", "Wind", "家人", "jiā rén", "La Familia"),
    (38, "Lake", "Fire", "睽", "kuí", "El Antagonismo"),
    (39, "Mountain", "Water", "蹇", "jiǎn", "El Obstáculo"),
    (40, "Water", "Thunder", "解", "xiè", "La Liberación"),
    (41, "Lake", "Mountain", "損", "sǔn", "La Disminución"),
    (42, "Thunder", "Wind", "益", "yì", "El Aumento"),
    (43, "Heaven", "Lake", "夬", "guài", "La Resolución"),
    (44, "Wind", "Heaven", "姤", "gòu", "El Ir al Encuentro"),
    (45, "Earth", "Lake", "萃", "cuì", "La Reunión"),
    (46, "Wind", "Earth", "升", "shēng", "El Empuje Hacia Arriba"),
    (47, "Water", "Lake", "困", "kùn", "La Adversidad"),
    (48, "Wind", "Water", "井", "jǐng", "El Pozo"),
    (49, "Fire", "Lake", "革", "gé", "La Revolución"),
    (50, "Wind", "Fire", "鼎", "dǐng", "El Caldero"),
    (51, "Thunder", "Thunder", "震", "zhèn", "Lo Suscitativo (repetido)"),
    (52, "Mountain", "Mountain", "艮", "gèn", "El Aquietamiento (repetido)"),
    (53, "Mountain", "Wind", "漸", "jiàn", "El Desarrollo"),
    (54, "Lake", "Thunder", "歸妹", "guī mèi", "La Muchacha que se Casa"),
    (55, "Fire", "Thunder", "豐", "fēng", "La Abundancia"),
    (56, "Mountain", "Fire", "旅", "lǚ", "El Viajero"),
    (57, "Wind", "Wind", "巽", "xùn", "Lo Suave (repetido)"),
    (58, "Lake", "Lake", "兌", "duì", "Lo Sereno (repetido)"),
    (59, "Water", "Wind", "渙", "huàn", "La Disolución"),
    (60, "Lake", "Water", "節", "jié", "La Restricción"),
    (61, "Lake", "Wind", "中孚", "zhōng fú", "La Verdad Interior"),
    (62, "Mountain", "Thunder", "小過", "xiǎo guò", "La Preponderancia de lo Pequeño"),
    (63, "Fire", "Water", "既濟", "jì jì", "Después de la Consumación"),
    (64, "Water", "Fire", "未濟", "wèi jì", "Antes de la Consumación"),
]

HEXAGRAM_BY_NUMBER = {h[0]: h for h in HEXAGRAMS}
HEXAGRAM_BY_COMPOSITION = {(h[1], h[2]): h[0] for h in HEXAGRAMS}


TRIGRAM_NAME_ES = {
    "Heaven": "Cielo",
    "Earth": "Tierra",
    "Water": "Agua",
    "Fire": "Fuego",
    "Thunder": "Trueno",
    "Wind": "Viento",
    "Mountain": "Montaña",
    "Lake": "Lago",
}


def _hexagram_dict(number: int) -> dict:
    n, lower, upper, name_zh, pinyin, name_es = HEXAGRAM_BY_NUMBER[number]
    return {
        "number": n,
        "name_zh": name_zh,
        "pinyin": pinyin,
        "name_es": name_es,
        "lower_trigram_es": TRIGRAM_NAME_ES[lower],
        "upper_trigram_es": TRIGRAM_NAME_ES[upper],
        "lines": list(TRIGRAM_LINES[lower] + TRIGRAM_LINES[upper]),
    }


def hexagram_lookup(number: int) -> dict:
    """Look up a hexagram directly by its King Wen number (1-64)."""
    if number not in HEXAGRAM_BY_NUMBER:
        raise ValueError("El hexagrama debe ser un número entre 1 y 64")
    return _hexagram_dict(number)


def cast_iching(values: List[int]) -> dict:
    """
    values: 6 coin-toss sums, bottom line first, each 6/7/8/9
    (6 = old yin/changing, 7 = young yang, 8 = young yin, 9 = old yang/changing).
    Returns the primary hexagram, its moving lines (1-indexed, bottom to top),
    and the resulting (transformed) hexagram if any lines are moving.
    """
    if len(values) != 6 or any(v not in (6, 7, 8, 9) for v in values):
        raise ValueError("Se necesitan exactamente 6 valores, cada uno 6, 7, 8 o 9")

    bits = tuple(1 if v in (7, 9) else 0 for v in values)
    lower = TRIGRAM_BY_LINES[bits[0:3]]
    upper = TRIGRAM_BY_LINES[bits[3:6]]
    number = HEXAGRAM_BY_COMPOSITION[(lower, upper)]

    moving_lines = [i + 1 for i, v in enumerate(values) if v in (6, 9)]

    result = None
    if moving_lines:
        changed_bits = tuple(
            (1 - b) if (i + 1) in moving_lines else b for i, b in enumerate(bits)
        )
        changed_lower = TRIGRAM_BY_LINES[changed_bits[0:3]]
        changed_upper = TRIGRAM_BY_LINES[changed_bits[3:6]]
        result_number = HEXAGRAM_BY_COMPOSITION[(changed_lower, changed_upper)]
        result = _hexagram_dict(result_number)

    return {
        **_hexagram_dict(number),
        "lines": list(bits),  # bottom to top, 1=yang 0=yin, for rendering the hexagram bars
        "moving_lines": moving_lines,
        "result": result,
    }
