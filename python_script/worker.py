from dotenv import load_dotenv
from supabase import create_client
import os
import calculate_live
import runpy
import time


def main():
    print("Stats worker started...")

    while True:
        # Fetch one pending job
        jobs = supabase.table("stats_jobs")\
            .select("id, report_id")\
            .eq("status", "pending")\
            .limit(1)\
            .execute()

        if not jobs.data:
            time.sleep(POLL_INTERVAL)
            continue

        job = jobs.data[0]
        job_id = job["id"]
        report_id = job["report_id"]

        # Atomically mark as running
        supabase.table("stats_jobs")\
            .update({"status": "running"})\
            .eq("id", job_id)\
            .execute()

        try:
            runpy.run_module("calculate_live", run_name="__main__", alter_sys=True)

            # Mark job done
            supabase.table("stats_jobs")\
                .update({"status": "done"})\
                .eq("id", job_id)\
                .execute()

            print(f"Job {job_id} done.")

        except Exception as e:
            # Fetch current attempts
            job_row = supabase.table("stats_jobs").select("attempts").eq("id", job_id).execute()
            current_attempts = job_row.data[0].get("attempts") or 0

            # Update job as failed
            supabase.table("stats_jobs").update({
                "status": "failed",
                "attempts": current_attempts + 1,
                "error": str(e)
            }).eq("id", job_id).execute()

            print(f"Job {job_id} failed: {e}")

        time.sleep(0.1)

if __name__ == "__main__":
    load_dotenv()
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")  # for server-side full access

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    POLL_INTERVAL = 1  # seconds
    main()