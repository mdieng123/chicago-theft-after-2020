# prepare_data.py
# Cleans the raw theft data and makes the small files our website loads.
#
# Input:  data/raw/thefts_2016_2025.csv  (download it first with scripts/download_raw.sh)
# Output: data/theft_monthly.csv, data/theft_hourly.csv, data/lookups.json
#
# Run from the main project folder:  python scripts/prepare_data.py

import json
import pandas as pd

df = pd.read_csv("data/raw/thefts_2016_2025.csv")
df = df[(df["year"] >= 2016) & (df["year"] <= 2025)]
print("Rows loaded:", len(df))

# Fill in missing values and make everything uppercase so the matching works
df["description"] = df["description"].fillna("").str.upper()
df["location_description"] = df["location_description"].fillna("").str.upper()


# ---- Theft type ----
def get_type_group(row):
    desc = row["description"]
    if row["primary_type"] == "MOTOR VEHICLE THEFT":
        if "AUTOMOBILE" in desc:
            return "Automobile"
        return "Other vehicle"
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


# ---- Location type ----
# The same place is spelled different ways in different years
# (ex. "RESIDENCE-GARAGE" and "RESIDENCE - GARAGE"), so we look for keywords.
# We split into words for BAR, BUS and CTA so "BARBERSHOP" and "BUSINESS" don't match.
def get_loc_group(loc):
    words = loc.replace("/", " ").replace("-", " ").replace("(", " ").split()

    if any(k in loc for k in ["RESIDENCE", "APARTMENT", "PORCH", "YARD", "DRIVEWAY"]):
        return "Residence"
    if "CTA" in words or "BUS" in words or "TRAIN" in loc or "PLATFORM" in loc:
        return "Transit"
    if "RESTAURANT" in loc or "BAR" in words or "TAVERN" in loc:
        return "Restaurant/bar"
    if any(k in loc for k in ["STORE", "RETAIL", "GROCERY", "DEPARTMENT", "CONVENIENCE"]):
        return "Retail store"
    if "PARKING" in loc or "GARAGE" in loc:
        return "Parking"
    if "STREET" in loc or "SIDEWALK" in loc or loc == "ALLEY":
        return "Street/alley"
    if not loc.startswith("VEHICLE") and any(k in loc for k in ["OFFICE", "COMMERCIAL", "BUSINESS"]):
        return "Commercial/office"
    return "Other"


# ---- Side of the city ----
# Chicago's 77 community areas grouped into 9 "sides"
# Source: Wikipedia, "Community areas in Chicago"
sides = {
    "Far North": [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 76, 77],
    "Northwest": [15, 16, 17, 18, 19, 20],
    "North": [5, 6, 7, 21, 22],
    "West": [23, 24, 25, 26, 27, 28, 29, 30, 31],
    "Central": [8, 32, 33],
    "South": [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 60, 69],
    "Southwest": [56, 57, 58, 59, 61, 62, 63, 64, 65, 66, 67, 68],
    "Far Southwest": [70, 71, 72, 73, 74, 75],
    "Far Southeast": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
}
area_to_side = {}
for side, areas in sides.items():
    for area in areas:
        area_to_side[area] = side


# ---- Add the new columns ----
print("Grouping rows (this takes a few seconds)...")
df["type_group"] = df.apply(get_type_group, axis=1)
df["loc_group"] = df["location_description"].apply(get_loc_group)
df["side"] = df["community_area"].map(area_to_side).fillna("Unknown")

dates = pd.to_datetime(df["date"])
df["month"] = dates.dt.month
df["hour"] = dates.dt.hour
df["arrest"] = df["arrest"].astype(str).str.lower() == "true"


# ---- Count thefts by month and by hour ----
monthly = df.groupby(["year", "month", "type_group", "loc_group", "side"]).agg(
    arrests=("arrest", "sum"), count=("arrest", "size")
).reset_index()
monthly["arrests"] = monthly["arrests"].astype(int)

hourly = df.groupby(["year", "hour", "type_group", "loc_group", "side"]).size().reset_index(name="count")

monthly.to_csv("data/theft_monthly.csv", index=False)
hourly.to_csv("data/theft_hourly.csv", index=False)


# ---- Lists the website uses for dropdowns ----
type_groups = ["Retail", "From building", "Pickpocket/purse", "Over $500",
               "$500 & under", "Other theft", "Automobile", "Other vehicle"]
lookups = {
    "type_groups": type_groups,
    "loc_groups": ["Street/alley", "Residence", "Retail store", "Restaurant/bar",
                   "Transit", "Parking", "Commercial/office", "Other"],
    "sides": list(sides.keys()) + ["Unknown"],
    "periods": {"pre": [2016, 2019], "covid": [2020, 2020], "post": [2021, 2025]},
    "type_primary": {},
}
for group in type_groups:
    if group in ["Automobile", "Other vehicle"]:
        lookups["type_primary"][group] = "MOTOR VEHICLE THEFT"
    else:
        lookups["type_primary"][group] = "THEFT"

with open("data/lookups.json", "w") as f:
    json.dump(lookups, f, indent=2)


# ---- Check the results ----
print("Monthly rows:", len(monthly), " Hourly rows:", len(hourly))
print("Total thefts in monthly file:", monthly["count"].sum())
print(df["type_group"].value_counts())
print(df["loc_group"].value_counts())
print(df["side"].value_counts())
midnight = ((dates.dt.hour == 0) & (dates.dt.minute == 0)).mean()
print("Share recorded at exactly 12:00 AM:", round(midnight * 100, 1), "%")
