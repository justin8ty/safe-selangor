from supabase import create_client
import os
from calculate_live import calculate_current
import time

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # for server-side full access

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

POLL_INTERVAL = 5  # seconds

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
            calculate_current(report_id)

            # Mark job done
            supabase.table("stats_jobs")\
                .update({"status": "done"})\
                .eq("id", job_id)\
                .execute()

            print(f"Job {job_id} done.")

        except Exception as e:
            # Mark failed and increment attempts
            supabase.table("stats_jobs")\
                .update({
                    "status": "failed",
                    "attempts": supabase.table("stats_jobs").increment("attempts", 1),
                    "error": str(e)
                })\
                .eq("id", job_id)\
                .execute()
            print(f"Job {job_id} failed: {e}")

        time.sleep(0.1)

if __name__ == "__main__":
    main()