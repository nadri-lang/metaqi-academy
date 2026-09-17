# BaZi (Four Pillars of Destiny) chart calculation.
#
# The Heavenly Stem / Earthly Branch pillars themselves are computed by
# `cnlunar` (https://pypi.org/project/cnlunar/), a maintained port of the
# 寿星天文历 (Shou Xing) astronomical Chinese-calendar tables also used by
# most Chinese-language BaZi software - solar terms and the day/month/year
# sexagenary cycle are notoriously easy to get subtly wrong by
# reimplementing the astronomy from scratch, so we lean on a tested library
# for that part rather than hand-rolling it.
#
# What this module adds on top: element/yin-yang/zodiac lookup tables (in
# English keys, matching the app's existing `zodiac.animals`/`zodiac.elements`
# i18n namespace so the frontend can localize them), the five-element tally,
# and the Da Yun (10-year luck pillar) sequence - none of which cnlunar
# exposes directly.

from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any

import cnlunar
from cnlunar.config import (
    the10HeavenlyStems,
    the10HeavenlyStems5ElementsList,
    the12EarthlyBranches,
    the12EarthlyBranches5ElementsList,
    the60HeavenlyEarth,
    SOLAR_TERMS_NAME_LIST,
)
from cnlunar.solar24 import getTheYearAllSolarTermsList

from models import validate_iso_date, validate_hhmm_time, validate_sex

# cnlunar's precomputed solar-term table covers 1901-2100. Keep a 1-year
# margin on both ends so the Da Yun lookup (which may need the adjacent
# year's solar terms) never falls outside the table.
MIN_YEAR = 1902
MAX_YEAR = 2099

_ELEMENT_BY_CN = {"木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water"}
_ANIMAL_BY_BRANCH_INDEX = [
    "rat", "ox", "tiger", "rabbit", "dragon", "snake",
    "horse", "goat", "monkey", "rooster", "dog", "pig",
]
_STEM_PINYIN = ["jiǎ", "yǐ", "bǐng", "dīng", "wù", "jǐ", "gēng", "xīn", "rén", "guǐ"]
_BRANCH_PINYIN = ["zǐ", "chǒu", "yín", "mǎo", "chén", "sì", "wǔ", "wèi", "shēn", "yǒu", "xū", "hài"]

# 地支藏干 (hidden/"buried" stems within each branch) - every branch carries
# 1-3 extra stems beyond its own surface element, and a five-element tally
# that skips these is incomplete (e.g. 丑/Ox reads as pure Earth on the
# surface but also hides Water and Metal). Indexed the same way as
# the12EarthlyBranches (子丑寅卯辰巳午未申酉戌亥). Each hidden stem counts
# equally toward the tally, same weight as a visible stem/branch.
_HIDDEN_STEMS_BY_BRANCH_INDEX = [
    ["癸"],              # 子 rat
    ["己", "癸", "辛"],   # 丑 ox
    ["甲", "丙", "戊"],   # 寅 tiger
    ["乙"],              # 卯 rabbit
    ["戊", "乙", "癸"],   # 辰 dragon
    ["丙", "戊", "庚"],   # 巳 snake
    ["丁", "己"],         # 午 horse
    ["己", "丁", "乙"],   # 未 goat
    ["庚", "壬", "戊"],   # 申 monkey
    ["辛"],              # 酉 rooster
    ["戊", "辛", "丁"],   # 戌 dog
    ["壬", "甲"],         # 亥 pig
]

# The 60-entry sexagenary (Jiazi) cycle, generated the same way the
# stem/branch pairing itself is defined: position i pairs stem (i % 10)
# with branch (i % 12), repeating every lcm(10, 12) = 60 steps.
_JIAZI_60 = [(the10HeavenlyStems[i % 10], the12EarthlyBranches[i % 12]) for i in range(60)]


def _stem_info(stem: str) -> Dict[str, Any]:
    i = the10HeavenlyStems.index(stem)
    return {
        "char": stem,
        "pinyin": _STEM_PINYIN[i],
        "element": _ELEMENT_BY_CN[the10HeavenlyStems5ElementsList[i]],
        "yin_yang": "yang" if i % 2 == 0 else "yin",
    }


def _branch_info(branch: str) -> Dict[str, Any]:
    i = the12EarthlyBranches.index(branch)
    return {
        "char": branch,
        "pinyin": _BRANCH_PINYIN[i],
        "element": _ELEMENT_BY_CN[the12EarthlyBranches5ElementsList[i]],
        "yin_yang": "yang" if i % 2 == 0 else "yin",
        "animal": _ANIMAL_BY_BRANCH_INDEX[i],
    }


def _pillar_info(two_char: str) -> Dict[str, Any]:
    """`two_char` is one of cnlunar's `*8Char` strings, e.g. '丙寅' (stem+branch)."""
    stem, branch = two_char[0], two_char[1]
    return {"stem": _stem_info(stem), "branch": _branch_info(branch)}


def _hidden_stem_elements(branch: str) -> List[str]:
    """The element of each 藏干 (hidden stem) buried inside this branch."""
    i = the12EarthlyBranches.index(branch)
    return [_stem_info(stem)["element"] for stem in _HIDDEN_STEMS_BY_BRANCH_INDEX[i]]


def _day_and_hour_pillars(lunar: "cnlunar.Lunar", dt: datetime) -> tuple:
    """
    cnlunar's day8Char/twohour8Char roll over to the next day for any birth
    at 23:00-23:59 ("early Zi" convention: baseNum += 1 in its get_day8Char
    when twohourNum == 12). Confirmed against joeyyap.com and a certified
    Master Paola (Joey Yap school) calculation for 1970-12-31 23:54: that
    school's Day Pillar only changes at 00:00, never at 23:00 - so cnlunar's
    built-in shift must be neutralized here for the hour==23 case.

    Returns (day8Char, twohour8Char) using the midnight-only boundary.
    """
    if dt.hour != 23:
        return lunar.day8Char, lunar.twohour8Char

    # Recompute day8Char with a same-calendar-day hour that doesn't trigger
    # cnlunar's early-Zi shift (year8Char/month8Char never depend on hour,
    # so only day8Char needs redoing).
    unshifted = cnlunar.Lunar(dt.replace(hour=22, minute=0), godType="8char", year8Char="beginningOfSpring")
    day8char = unshifted.day8Char

    # The Zi-hour stem is a fixed function of the day stem (五鼠遁, "Five
    # Rats Escape"): hour-cycle-index = (day-cycle-index * 12) mod 60, which
    # always lands on the Zi branch. Tie it to the unshifted day above,
    # not to cnlunar's (also shifted) twohour8Char.
    day_index = the60HeavenlyEarth.index(day8char)
    hour8char = the60HeavenlyEarth[(day_index * 12) % 60]
    return day8char, hour8char


def _apply_true_solar_time(dt: datetime, longitude: float) -> datetime:
    """
    Shift a civil-clock birth time to local mean solar time based on
    longitude alone (rounding to the nearest 15 degrees standard meridian).
    This does not correct for the equation of time (which shifts the result
    by at most ~16 minutes through the year) - that refinement would rarely
    change which 2-hour branch a birth falls into, so it's skipped as
    unnecessary complexity for this optional field.
    """
    standard_meridian = round(longitude / 15) * 15
    offset_minutes = (longitude - standard_meridian) * 4
    return dt + timedelta(minutes=offset_minutes)


def _year_jie_terms(year: int) -> List[Dict[str, Any]]:
    """
    The 12 'Jie' (节, month-starting) solar terms for a Gregorian year, as
    {'date': date, 'name': str}. cnlunar's SOLAR_TERMS_NAME_LIST is ordered
    starting at 小寒 (Xiaohan) with Jie/Qi (mid-point) terms alternating, Jie
    first - so the 12 Jie terms are exactly the even indices.
    """
    day_of_month_list = getTheYearAllSolarTermsList(year)  # 24 ints, index i -> month (i//2 + 1)
    terms = []
    for i, day in enumerate(day_of_month_list):
        if i % 2 == 0:
            month = i // 2 + 1
            terms.append({"date": date(year, month, day), "name": SOLAR_TERMS_NAME_LIST[i]})
    return terms


def _compute_da_yun(birth_dt: datetime, sex: str, year_stem_yin_yang: str, month_pillar: str) -> Dict[str, Any]:
    """
    The Da Yun (大运, 10-year luck pillar) sequence: 8 pillars of 10 years
    each, stepping forward or backward through the 60-cycle from the month
    pillar, one step per period.

    Direction ("阳男阴女顺排，阴男阳女逆排"): a Yang-year male or Yin-year
    female counts forward through the cycle; a Yin-year male or Yang-year
    female counts backward.

    Starting age: days between birth and the next (forward) or previous
    (backward) 'Jie' solar term, converted at 3 days = 1 year (so 1 day = 4
    months) - the standard rule, precise to the day (cnlunar's solar-term
    table gives calendar days, not times, which is the precision this
    3-days-per-year rule itself works at).
    """
    forward = (sex == "M") == (year_stem_yin_yang == "yang")

    birth_date = birth_dt.date()
    candidate_years = [birth_date.year - 1, birth_date.year, birth_date.year + 1]
    all_jie = [t for y in candidate_years for t in _year_jie_terms(y)]
    all_jie.sort(key=lambda t: t["date"])

    if forward:
        reference = next((t for t in all_jie if t["date"] > birth_date), None)
        diff_days = (reference["date"] - birth_date).days
    else:
        reference = next((t for t in reversed(all_jie) if t["date"] < birth_date), None)
        diff_days = (birth_date - reference["date"]).days

    total_months = diff_days * 4
    start_age_years = total_months // 12
    start_age_months = total_months % 12

    month_index = _JIAZI_60.index((month_pillar[0], month_pillar[1]))
    step = 1 if forward else -1

    periods = []
    for k in range(1, 9):
        stem, branch = _JIAZI_60[(month_index + step * k) % 60]
        periods.append({
            "start_age": start_age_years + (k - 1) * 10,
            "end_age": start_age_years + k * 10 - 1,
            "pillar": {"stem": _stem_info(stem), "branch": _branch_info(branch)},
        })

    return {
        "direction": "forward" if forward else "backward",
        "start_age_years": start_age_years,
        "start_age_months": start_age_months,
        "periods": periods,
    }


def compute_bazi_chart(
    birth_date: str,
    birth_time: str,
    sex: str,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    """Compute the Four Pillars chart. Raises ValueError on invalid input."""
    validate_iso_date(birth_date)
    validate_hhmm_time(birth_time)
    validate_sex(sex)

    year = int(birth_date[:4])
    if year < MIN_YEAR or year > MAX_YEAR:
        raise ValueError(f"El calculador solo admite fechas de nacimiento entre {MIN_YEAR} y {MAX_YEAR}.")

    if longitude is not None and (longitude < -180 or longitude > 180):
        raise ValueError("La longitud debe estar entre -180 y 180.")

    hour, minute = (int(p) for p in birth_time.split(":"))
    birth_dt = datetime(year, int(birth_date[5:7]), int(birth_date[8:10]), hour, minute)

    solar_time_adjusted = False
    adjusted_dt = birth_dt
    if longitude is not None:
        adjusted_dt = _apply_true_solar_time(birth_dt, longitude)
        solar_time_adjusted = adjusted_dt != birth_dt

    # year8Char="beginningOfSpring": BaZi's year pillar rolls over at Li Chun
    # (立春, the "start of spring" solar term), not at Chinese New Year (the
    # lunar calendar's civil year boundary, which cnlunar defaults to). The
    # two disagree for the ~2-5 week window between Li Chun and the
    # following lunar new year - e.g. births in early/mid February can fall
    # on either side of Li Chun while still being in the "old" lunar year.
    lunar = cnlunar.Lunar(adjusted_dt, godType="8char", year8Char="beginningOfSpring")

    day8char, hour8char = _day_and_hour_pillars(lunar, adjusted_dt)

    year_pillar = _pillar_info(lunar.year8Char)
    month_pillar = _pillar_info(lunar.month8Char)
    day_pillar = _pillar_info(day8char)
    hour_pillar = _pillar_info(hour8char)

    element_count = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}
    for pillar in (year_pillar, month_pillar, day_pillar, hour_pillar):
        element_count[pillar["stem"]["element"]] += 1
        element_count[pillar["branch"]["element"]] += 1
        for hidden_element in _hidden_stem_elements(pillar["branch"]["char"]):
            element_count[hidden_element] += 1

    da_yun = _compute_da_yun(
        adjusted_dt, sex,
        year_stem_yin_yang=year_pillar["stem"]["yin_yang"],
        month_pillar=lunar.month8Char,
    )

    return {
        "day_master": day_pillar["stem"],
        "pillars": {
            "year": year_pillar,
            "month": month_pillar,
            "day": day_pillar,
            "hour": hour_pillar,
        },
        "five_elements": element_count,
        "da_yun": da_yun,
        "solar_time_adjusted": solar_time_adjusted,
        "adjusted_birth_datetime": adjusted_dt.isoformat() if solar_time_adjusted else None,
    }
