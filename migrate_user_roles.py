#!/usr/bin/env python3
"""
Migrate users with old role='free' to new role='free_member'
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment
load_dotenv('/app/backend/.env')

async def migrate_roles():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Find users with old role='free'
    old_role_users = await db.users.find({"role": "free"}).to_list(100)
    
    print(f"Found {len(old_role_users)} users with old role='free'")
    
    if not old_role_users:
        print("No users to migrate")
        return
    
    # Update each user
    for user in old_role_users:
        print(f"Migrating user: {user['email']} (ID: {user['id']})")
        result = await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"role": "free_member"}}
        )
        if result.modified_count > 0:
            print(f"  ✅ Updated successfully")
        else:
            print(f"  ⚠️  No changes made")
    
    # Verify migration
    remaining = await db.users.count_documents({"role": "free"})
    print(f"\nMigration complete. Remaining users with role='free': {remaining}")
    
    # Show updated counts
    free_member_count = await db.users.count_documents({"role": "free_member"})
    print(f"Users with role='free_member': {free_member_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_roles())
