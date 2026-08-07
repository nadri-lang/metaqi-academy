"""
Script to add translations to existing services in the database.
Run this once to migrate the data structure.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def migrate_services():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.metaqi_db
    
    services = await db.custom_services.find().to_list(1000)
    
    print(f"Found {len(services)} services to migrate")
    
    for service in services:
        service_id = service.get('id')
        title = service.get('title', '')
        description = service.get('description', '')
        includes = service.get('includes', [])
        
        # Create translations object with English translations
        translations = {
            'en': {
                'title': service.get('title_en', title),  # Use existing if available
                'description': service.get('description_en', description),
                'includes': includes  # TODO: Translate includes to English
            },
            'fr': {
                'title': title,  # Will be translated later
                'description': description,
                'includes': includes
            },
            'de': {
                'title': title,  # Will be translated later
                'description': description,
                'includes': includes
            },
            'ro': {
                'title': title,  # Will be translated later
                'description': description,
                'includes': includes
            }
        }
        
        # Update service with translations
        update_result = await db.custom_services.update_one(
            {'id': service_id},
            {
                '$set': {'translations': translations},
                '$unset': {
                    'title_en': '',
                    'title_zh': '',
                    'description_en': '',
                    'description_zh': ''
                }
            }
        )
        
        print(f"✅ Migrated service: {title} (ID: {service_id})")
    
    print(f"\n✅ Migration complete! {len(services)} services updated.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_services())
