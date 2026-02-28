from supabase import create_client
from dotenv import load_dotenv
import os
import sqlite3

load_dotenv()


def print_report_types():
    rows = supabase.table("reports").select("*").execute()
    print(rows.data[0]["type"])

def read_sqlite_db():
    conn = sqlite3.connect("crime_data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Baseline")
    rows = cursor.fetchall()
    
    for row in rows:
        print(row[1])
        data = {
            "state": row[1],
            "district": row[2],
            "weighted_violent": round(row[3], 2),
            "weighted_property": round(row[4], 2),
            "multiplier_property": round(row[5], 2),
            "multiplier_violent": round(row[6], 2),
            "estimated_population": row[7],
            "avg_violent": row[8],
            "avg_property": row[9],
        }

        insert_report(data)

    conn.close()

def insert_report(data):
    response = (
        supabase
        .table("baseline")
        .insert(data)
        .execute())
    
    print(response)

if __name__ == "__main__":
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    read_sqlite_db()
    #insert_report()