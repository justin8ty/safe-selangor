from dotenv import load_dotenv
from supabase import create_client
import os
import runpy



def process_next_job() -> bool:
    jobs = (
        supabase.table("stats_jobs")
        .select("id, report_id")
        .eq("status", "pending")
        .limit(1)
        .execute()
    )

    if not jobs.data:
        return False

    job = jobs.data[0]
    job_id = job["id"]

    supabase.table("stats_jobs").update({"status": "running"}).eq(
        "id", job_id
    ).execute()

    try:
        runpy.run_module("calculate_live", run_name="__main__", alter_sys=True)
        supabase.table("stats_jobs").update({"status": "done"}).eq(
            "id", job_id
        ).execute()
        print(f"Job {job_id} done.")
    except Exception as exc:
        job_row = (
            supabase.table("stats_jobs")
            .select("attempts")
            .eq("id", job_id)
            .execute()
        )
        current_attempts = job_row.data[0].get("attempts") or 0
        supabase.table("stats_jobs").update(
            {
                "status": "failed",
                "attempts": current_attempts + 1,
                "error": str(exc),
            }
        ).eq("id", job_id).execute()
        print(f"Job {job_id} failed: {exc}")

    return True


def main():
    print("Stats job started...")
    processed = 0
    while process_next_job():
        processed += 1
    print(f"Stats job finished. Processed {processed} queued job(s).")

if __name__ == "__main__":
    load_dotenv()
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    main()