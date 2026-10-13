"""
Aggregates the raw theft pull into the small files the site loads.

Input:  data/raw/thefts_2016_2025.csv   (from scripts/download_raw.sh, gitignored)
Output: data/theft_monthly.csv          year,month,type_group,loc_group,side,arrests,count
        data/theft_hourly.csv           year,hour,type_group,loc_group,side,count
        data/lookups.json               group lists, periods, type_group -> primary type

Run from the repo root:  python scripts/prepare_data.py

Community area -> side mapping follows the City of Chicago's 9 "sides"
(see Wikipedia, "Community areas in Chicago"). Cite it in the write-up.
"""
import json
import re
from pathlib import Path

import pandas as pd

RAW = Path("data/raw/thefts_2016_2025.csv")
OUT = Path("data")

YEARS = (2016, 2025)
PERIODS = {"pre": [2016, 2019], "covid": [2020, 2020], "post": [2021, 2025]}

TYPE_GROUPS = ["Retail", "From building", "Pickpocket/purse", "Over $500",
               "$500 & under", "Other theft", "Automobile", "Other vehicle"]
LOC_GROUPS = ["Street/alley", "Residence", "Retail store", "Restaurant/bar",
              "Transit", "Parking", "Commercial/office", "Other"]

SIDES = {
    "Far North":     [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 76, 77],
    "Northwest":     [15, 16, 17, 18, 19, 20],
    "North":         [5, 6, 7, 21, 22],
    "West":          [23, 24, 25, 26, 27, 28, 29, 30, 31],
    "Central":       [8, 32, 33],
    "South":         [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 60, 69],
    "Southwest":     [56, 57, 58, 59, 61, 62, 63, 64, 65, 66, 67, 68],
    "Far Southwest": [70, 71, 72, 73, 74, 75],
    "Far Southeast": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
}
AREA_TO_SIDE = {a: side for side, areas in SIDES.items() for a in areas}


def type_group(primary, desc):
    if primary == "MOTOR VEHICLE THEFT":
        return "Automobile" if "AUTOMOBILE" in desc else "Other vehicle"
    if "RETAIL" in desc:
        return "Retail"
    if "FROM BUILDING" in desc:
        return "From building"
    if "POCKET" in desc or "PURSE" in desc:
        return "Pickpocket/purse"
    if "OVER $500" in desc:
        return "Over $500"
    if "$500 AND UNDER" in desc:
        return "$500 & under"
    return "Other theft"


# Checked in order; first match wins. Word boundaries avoid false hits like
# BARBERSHOP (bar), BOWLING ALLEY (alley), MOVIE HOUSE (residence), BUSINESS (bus).
LOC_RULES = [
    ("Residence",      r"RESIDENCE|APARTMENT|PORCH|YARD|DRIVEWAY"),
    ("Transit",        r"\bCTA\b|TRAIN|\bBUS\b|PLATFORM"),
    ("Restaurant/bar", r"RESTAURANT|\bBAR\b|TAVERN"),
    ("Retail store",   r"STORE|RETAIL|GROCERY|DEPARTMENT|CONVENIENCE"),
    ("Parking",        r"PARKING|GARAGE"),
    ("Street/alley",   r"STREET|SIDEWALK|^ALLEY$"),
    ("Commercial/office", r"^(?!VEHICLE).*(OFFICE|COMMERCIAL|BUSINESS)"),
]
LOC_RULES = [(g, re.compile(p)) for g, p in LOC_RULES]


def loc_group(loc):
    for group, pattern in LOC_RULES:
        if pattern.search(loc):
            return group
    return "Other"


def main():
    df = pd.read_csv(RAW)
    df = df[df["year"].between(*YEARS)]

    desc = df["description"].fillna("").str.upper().str.strip()
    loc = df["location_description"].fillna("").str.upper().str.strip()
    when = pd.to_datetime(df["date"])

    # Map each distinct string once instead of once per row.
    type_map = {k: type_group(*k) for k in set(zip(df["primary_type"], desc))}
    loc_map = {k: loc_group(k) for k in loc.unique()}

    tidy = pd.DataFrame({
        "year": df["year"].astype(int),
        "month": when.dt.month,
        "hour": when.dt.hour,
        "type_group": [type_map[k] for k in zip(df["primary_type"], desc)],
        "loc_group": loc.map(loc_map),
        "side": df["community_area"].map(AREA_TO_SIDE).fillna("Unknown"),
        "arrest": df["arrest"].astype(str).str.lower().eq("true").astype(int),
    })

    keys = ["type_group", "loc_group", "side"]
    monthly = (tidy.groupby(["year", "month", *keys])
                   .agg(arrests=("arrest", "sum"), count=("arrest", "size"))
                   .reset_index())
    hourly = (tidy.groupby(["year", "hour", *keys])
                  .size().rename("count").reset_index())

    monthly.to_csv(OUT / "theft_monthly.csv", index=False)
    hourly.to_csv(OUT / "theft_hourly.csv", index=False)

    lookups = {
        "type_groups": TYPE_GROUPS,
        "loc_groups": LOC_GROUPS,
        "sides": list(SIDES) + ["Unknown"],
        "periods": PERIODS,
        "type_primary": {g: ("MOTOR VEHICLE THEFT" if g in ("Automobile", "Other vehicle") else "THEFT")
                         for g in TYPE_GROUPS},
    }
    (OUT / "lookups.json").write_text(json.dumps(lookups, indent=2))

    # Sanity checks: every row is accounted for, and no unexpected group names.
    assert monthly["count"].sum() == hourly["count"].sum() == len(df)
    assert set(tidy["type_group"]) <= set(TYPE_GROUPS)
    assert set(tidy["loc_group"]) <= set(LOC_GROUPS)

    print(f"{len(df):,} thefts -> {len(monthly):,} monthly rows, {len(hourly):,} hourly rows")
    for col in keys:
        print(tidy[col].value_counts().to_string(), "\n")
    midnight = (when.dt.hour.eq(0) & when.dt.minute.eq(0)).mean()
    print(f"Recorded at exactly 12:00 AM: {midnight:.1%}")


if __name__ == "__main__":
    main()
