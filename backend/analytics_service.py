"""
Analytics Service for MetaQi Academy
Tracks user visits, registrations, and activity
"""
from datetime import datetime, timedelta
from typing import Set, Dict
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase

class AnalyticsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    async def track_visit(self, user_id: str = None, session_id: str = None):
        """
        Track a visitor (with or without account).
        Called when app opens or user makes a request.
        """
        today = datetime.utcnow().date().isoformat()
        
        # Create visitor log
        visitor_log = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_id": session_id or str(uuid.uuid4()),
            "timestamp": datetime.utcnow(),
            "date": today
        }
        
        await self.db.visitor_logs.insert_one(visitor_log)
        
        # Update analytics counters
        await self._update_analytics(user_id, today)
    
    async def _update_analytics(self, user_id: str, today: str):
        """Update analytics counters"""
        analytics = await self.db.analytics.find_one({"type": "global"})
        
        if not analytics:
            # Initialize analytics
            analytics = {
                "type": "global",
                "total_visitors": 0,
                "daily_active_users": [],
                "monthly_active_users": [],
                "daily_registrations": 0,
                "last_reset_date": today,
                "last_month_reset": datetime.utcnow().strftime("%Y-%m"),
                "created_at": datetime.utcnow()
            }
            await self.db.analytics.insert_one(analytics)
        
        # Check if we need to reset daily counters
        if analytics.get("last_reset_date") != today:
            await self._reset_daily_counters(today)
            analytics = await self.db.analytics.find_one({"type": "global"})
        
        # Check if we need to reset monthly counters
        current_month = datetime.utcnow().strftime("%Y-%m")
        if analytics.get("last_month_reset") != current_month:
            await self._reset_monthly_counters(current_month)
            analytics = await self.db.analytics.find_one({"type": "global"})
        
        # Increment total visitors
        await self.db.analytics.update_one(
            {"type": "global"},
            {"$inc": {"total_visitors": 1}}
        )
        
        # Add user to daily active users (if logged in)
        if user_id:
            daily_active = set(analytics.get("daily_active_users", []))
            monthly_active = set(analytics.get("monthly_active_users", []))
            
            if user_id not in daily_active:
                await self.db.analytics.update_one(
                    {"type": "global"},
                    {"$addToSet": {"daily_active_users": user_id}}
                )
            
            if user_id not in monthly_active:
                await self.db.analytics.update_one(
                    {"type": "global"},
                    {"$addToSet": {"monthly_active_users": user_id}}
                )
    
    async def track_registration(self, user_id: str):
        """Track a new user registration"""
        today = datetime.utcnow().date().isoformat()
        
        # Increment daily registrations
        await self.db.analytics.update_one(
            {"type": "global"},
            {"$inc": {"daily_registrations": 1}}
        )
        
        # Also track as visitor
        await self.track_visit(user_id=user_id)
    
    async def _reset_daily_counters(self, today: str):
        """Reset daily counters at midnight"""
        await self.db.analytics.update_one(
            {"type": "global"},
            {
                "$set": {
                    "daily_active_users": [],
                    "daily_registrations": 0,
                    "last_reset_date": today
                }
            }
        )
    
    async def _reset_monthly_counters(self, current_month: str):
        """Reset monthly counters on the 1st of each month"""
        await self.db.analytics.update_one(
            {"type": "global"},
            {
                "$set": {
                    "monthly_active_users": [],
                    "last_month_reset": current_month
                }
            }
        )
    
    async def get_summary(self) -> Dict:
        """Get analytics summary for admin dashboard"""
        today = datetime.utcnow().date().isoformat()
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # Get analytics data
        analytics = await self.db.analytics.find_one({"type": "global"})
        
        if not analytics:
            # Initialize if doesn't exist
            await self.track_visit()
            analytics = await self.db.analytics.find_one({"type": "global"})
        
        # Check for resets
        if analytics.get("last_reset_date") != today:
            await self._reset_daily_counters(today)
            analytics = await self.db.analytics.find_one({"type": "global"})
        
        if analytics.get("last_month_reset") != current_month:
            await self._reset_monthly_counters(current_month)
            analytics = await self.db.analytics.find_one({"type": "global"})
        
        # Get total registered users
        total_registered = await self.db.users.count_documents({})
        
        return {
            "total_visitors": analytics.get("total_visitors", 0),
            "total_registered": total_registered,
            "active_today": len(analytics.get("daily_active_users", [])),
            "registered_today": analytics.get("daily_registrations", 0),
            "active_this_month": len(analytics.get("monthly_active_users", [])),
            "last_updated": datetime.utcnow()
        }
