"""
Maintenance script to prune genuinely old data from the database.

Safety rules (this script used to delete everything older than yesterday,
which permanently destroyed content the admin had just published):
  * nothing inside the retention window is ever touched
  * it is a dry run unless you pass --yes
  * it never deletes daily energy or newborn vocation content that is still
    recent enough for a reader to be looking at it
"""
import argparse
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DEFAULT_RETENTION_DAYS = 365


async def cleanup_old_data(retention_days: int, apply_changes: bool):
    """Prune records older than the retention window."""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

    cutoff_dt = datetime.utcnow() - timedelta(days=retention_days)
    cutoff = cutoff_dt.strftime("%Y-%m-%d")

    mode = "DELETING" if apply_changes else "DRY RUN (pass --yes to apply)"
    print(f"Maintenance cleanup - {mode}")
    print(f"Retention: {retention_days} days. Nothing dated on or after {cutoff} will be touched.\n")

    date_targets = [
        ("daily_energy", {"date": {"$lt": cutoff}}),
        ("newborn_vocation", {"date": {"$lt": cutoff}}),
    ]

    year_cutoff = cutoff_dt.year
    other_targets = [
        ("month_energy", {"$or": [
            {"year": {"$lt": year_cutoff}},
            {"year": year_cutoff, "month": {"$lt": cutoff_dt.month}},
        ]}),
        ("year_energy", {"year": {"$lt": year_cutoff}}),
    ]

    total = 0
    for name, query in date_targets + other_targets:
        matched = await db[name].count_documents(query)
        total += matched
        if apply_changes and matched:
            result = await db[name].delete_many(query)
            print(f"   {name}: deleted {result.deleted_count}")
        else:
            print(f"   {name}: {matched} would be deleted")

    verb = "Deleted" if apply_changes else "Would delete"
    print(f"\n{verb} {total} records in total.")

    client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prune old records past the retention window.")
    parser.add_argument("--retention-days", type=int, default=DEFAULT_RETENTION_DAYS,
                        help=f"keep everything newer than this many days (default {DEFAULT_RETENTION_DAYS})")
    parser.add_argument("--yes", action="store_true",
                        help="actually delete; without it the script only reports")
    args = parser.parse_args()

    if args.retention_days < 30:
        parser.error("--retention-days below 30 is almost certainly a mistake; refusing.")

    asyncio.run(cleanup_old_data(args.retention_days, args.yes))
