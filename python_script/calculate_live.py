
from pydoc import html
import sys
from typing import List
import sqlite3
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

def get_current_previous_next_month():
    now = datetime.utcnow()

    current_year = now.year
    current_month = now.month

    # Previous month
    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1
    else:
        previous_month = current_month - 1
        previous_year = current_year

    # Next month
    if current_month == 12:
        next_month = 1
        next_year = current_year + 1
    else:
        next_month = current_month + 1
        next_year = current_year

    return {
        "current": (current_year, current_month),
        "previous": (previous_year, previous_month),
        "next": (next_year, next_month)
    }

def load_reports(type:str, district:str, now:str, after:str) -> int:


    after_str = f"{after[0]}-{after[1]:02d}"
    now_str = f"{now[0]}-{now[1]:02d}"

    print("after_str", after_str)
    print("now_str", now_str)

    rows = (supabase.table("reports").
            select("*")
            .eq("type", type)
            .eq("status", "approved")
            .eq("district", district)
            .filter("date", "gte", f"{now_str}-01T00:00:00+00")
            .filter("date", "lt",  f"{after_str}-01T00:00:00+00")
            .execute())
    print(f"\nLoaded {len(rows.data)} reports for type: {type} in district: {district}\n")
    return len(rows.data)

def load_baseline(district:str) -> int:
    rows = (supabase.table("baseline").
            select("*")
            .eq("district", district)
            .execute())
    return rows.data[0]["avg_violent"], rows.data[0]["avg_property"], rows.data[0]["state"]


def calculate_weight(avg:float, count:int) -> float:
    calc = count / avg
    return calc

def store_district_score(state, district, year, month, weight_violent, weight_property, and_score, score):
    weight_property = round(weight_property, 2)
    weight_violent = round(weight_violent, 2)
    and_score = round(and_score, 2)
    score = round(score, 2)

    existing = (
        supabase
        .table("current_live_statistics")
        .select("id")
        .eq("district", district)
        .eq("year", year)
        .eq("month", month)
        .execute()
    )

    data = {
        "state": state,
        "district": district,
        "year": year,
        "month": month,
        "violent_weight": weight_violent,
        "property_weight": weight_property,
        "combined_weight": and_score,
        "score": score
    }

    if existing.data:
        # 2A. UPDATE existing row
        (
            supabase
            .table("current_live_statistics")
            .update(data)
            .eq("district", district)
            .eq("year", year)
            .eq("month", month)
            .execute()
        )
        print("Updated existing row")
     
    else:
        # 2B. INSERT new row
        (
            supabase
            .table("current_live_statistics")
            .insert(data)
            .execute()
        )
        print("Inserted new row")

def calculate_current(district:str) -> int:

    dates = get_current_previous_next_month()

    avg_violent, avg_property, state = load_baseline(district)
    count_violent = load_reports("violent", district, dates["current"], dates["next"])
    count_property = load_reports("property", district, dates["current"], dates["next"])
    weight_violent = calculate_weight(avg_violent, count_violent)
    weight_property = calculate_weight(avg_property, count_property)

    and_score = (weight_violent-1) + (weight_property-1)/3
    score = 70-(and_score * 100)

    print("-------------------------------------------")
    print(f"Current score for {district}: {score}")
    print("-------------------------------------------")


    store_district_score(state, district, dates["current"][0], dates["current"][1], weight_violent, weight_property, and_score, score)
    return int(weight_violent + weight_property)

if __name__ == "__main__":
    load_dotenv()
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    districts = ["Ampang Jaya"  , "Gombak"     , "Kajang",
                  "Klang Selatan", "Klang Utara", "Petaling Jaya",
                   "Sepang"      , "Serdang"    ,     "Shah Alam", 
                   "Subang Jaya","Brickfields", "Cheras", "Dang Wangi",
                   "Sentul", "W.P. Putrajaya","Wangsa Maju"]

    for district in districts:
        calculate_current(district)