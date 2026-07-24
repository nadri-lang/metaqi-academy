"""
Maintenance script to clean up old data from the database.
This script should be run daily via cron job.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def cleanup_old_data():
    """Clean up old data from the database"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print(f"🧹 Starting maintenance cleanup at {datetime.utcnow()}")
    
    # 1. Delete daily energy records older than yesterday
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    result_daily = await db.daily_energy.delete_many({"date": {"$lt": yesterday}})
    print(f"   ✅ Deleted {result_daily.deleted_count} old daily energy records (before {yesterday})")
    
    # 2. Delete month energy records except current month
    now = datetime.utcnow()
    result_month = await db.month_energy.delete_many({
        "$or": [
            {"year": {"$lt": now.year}},
            {"year": now.year, "month": {"$lt": now.month}}
        ]
    })
    print(f"   ✅ Deleted {result_month.deleted_count} old month energy records")
    
    # 3. Delete year energy records except current year
    result_year = await db.year_energy.delete_many({"year": {"$lt": now.year}})
    print(f"   ✅ Deleted {result_year.deleted_count} old year energy records")
    
    # 4. Delete old newborn vocation records (older than yesterday)
    result_vocation = await db.newborn_vocation.delete_many({"date": {"$lt": yesterday}})
    print(f"   ✅ Deleted {result_vocation.deleted_count} old newborn vocation records")
    
    print(f"\n✅ Maintenance cleanup completed!")
    print(f"   Total records deleted: {result_daily.deleted_count + result_month.deleted_count + result_year.deleted_count + result_vocation.deleted_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_old_data())
