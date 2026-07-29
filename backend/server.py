from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import re

from models import (
    UserCreate, UserResponse, Token, LoginRequest,
    DailyEnergy, DailyEnergyCreate,
    MoonEnergy, MoonEnergyCreate,
    Category, CategoryCreate,
    Article, ArticleCreate,
    Course, CourseCreate, Chapter, ChapterCreate, Lesson, LessonCreate,
    Favorite, FavoriteCreate,
    CourseProgress, CourseProgressUpdate,
    CustomService, CustomServiceCreate,
    ServiceRequest, ServiceRequestCreate, ServiceRequestUpdate, ServiceRequestStatus,
    PremiumAgenda, PremiumAgendaCreate,
    Payment, PaymentCreate, PaymentUpdate, PaymentStatus,
    Subscription, SubscriptionStatus,
    InfoPage, InfoPageCreate,
    Settings, SettingsUpdate,
    UserRole,
    MonthEnergy, MonthEnergyCreate,
    YearEnergy, YearEnergyCreate,
    NewbornVocation, NewbornVocationCreate,
    Concept, ConceptCreate,
    AgendaMonth, AgendaMonthCreate,
    FAQCategory, FAQCategoryCreate, FAQItem, FAQItemCreate,
    AppConfig, AppConfigUpdate,
    Purchase, PurchaseCreate, PurchaseUpdate,
)
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    get_current_admin_user
)
from translation_service import translate_dict, translate_list_of_dicts

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="MetaQi Academy API")

# Create API router
api_router = APIRouter(prefix="/api")

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["hashed_password"] = get_password_hash(user_data.password)
    user_dict["has_active_subscription"] = False
    user_dict["created_at"] = datetime.utcnow()
    user_dict["last_login"] = None
    del user_dict["password"]
    
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# ============= DAILY ENERGY ENDPOINTS =============

@api_router.get("/energy/daily", response_model=DailyEnergy)
async def get_daily_energy(date: Optional[str] = None, lang: str = "es"):
    """
    Get daily energy for today only.
    Auto-cleanup: Old daily energy records are automatically deleted.
    User can ONLY see current day's content - no history.
    """
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Auto-cleanup old records before fetching
    await auto_cleanup_old_daily_energy()
    
    energy = await db.daily_energy.find_one({"date": date})
    if not energy:
        raise HTTPException(status_code=404, detail="No energy data for this date")
    
    # Translate if not Spanish
    if lang != "es":
        fields_to_translate = ["title", "content", "animal", "bazi_relationships"]
        energy = await translate_dict(energy, lang, fields_to_translate)
        # Translate lists
        if "recommendations" in energy and energy["recommendations"]:
            energy["recommendations"] = [await translate_dict({"text": r}, lang, ["text"]) for r in energy["recommendations"]]
            energy["recommendations"] = [r["text"] for r in energy["recommendations"]]
        if "avoid" in energy and energy["avoid"]:
            energy["avoid"] = [await translate_dict({"text": a}, lang, ["text"]) for a in energy["avoid"]]
            energy["avoid"] = [a["text"] for a in energy["avoid"]]
        if "feng_shui_sectors" in energy and energy["feng_shui_sectors"]:
            energy["feng_shui_sectors"] = [await translate_dict({"text": f}, lang, ["text"]) for f in energy["feng_shui_sectors"]]
            energy["feng_shui_sectors"] = [f["text"] for f in energy["feng_shui_sectors"]]
        if "qimen_directions" in energy and energy["qimen_directions"]:
            energy["qimen_directions"] = [await translate_dict({"text": q}, lang, ["text"]) for q in energy["qimen_directions"]]
            energy["qimen_directions"] = [q["text"] for q in energy["qimen_directions"]]
        if "favorable_hours" in energy and energy["favorable_hours"]:
            energy["favorable_hours"] = [await translate_dict({"text": h}, lang, ["text"]) for h in energy["favorable_hours"]]
            energy["favorable_hours"] = [h["text"] for h in energy["favorable_hours"]]
    
    return DailyEnergy(**energy)

@api_router.post("/energy/daily", response_model=DailyEnergy)
async def create_daily_energy(
    energy_data: DailyEnergyCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    energy_dict = energy_data.model_dump()
    
    # Check if already exists
    existing = await db.daily_energy.find_one({"date": energy_data.date})
    
    if existing:
        # Update existing entry
        energy_dict["id"] = existing["id"]
        energy_dict["created_at"] = existing.get("created_at", datetime.utcnow())
        await db.daily_energy.update_one(
            {"date": energy_data.date},
            {"$set": energy_dict}
        )
    else:
        # Create new entry
        energy_dict["id"] = str(uuid.uuid4())
        energy_dict["created_at"] = datetime.utcnow()
        await db.daily_energy.insert_one(energy_dict)
    
    return DailyEnergy(**energy_dict)

@api_router.delete("/admin/cleanup/old-daily-energy")
async def cleanup_old_daily_energy(
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete all daily energy records with dates older than today (manual trigger)"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    result = await db.daily_energy.delete_many({"date": {"$lt": today}})
    
    return {
        "message": f"Deleted {result.deleted_count} old daily energy records",
        "deleted_count": result.deleted_count
    }

async def auto_cleanup_old_daily_energy():
    """
    Automatic cleanup: Delete daily energy records from yesterday and before.
    Called at midnight (00:00) - user only sees current day's content.
    No history is kept for Daily Energy.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    result = await db.daily_energy.delete_many({"date": {"$lt": today}})
    if result.deleted_count > 0:
        logger.info(f"Auto-cleanup: Deleted {result.deleted_count} old daily energy records")

@api_router.delete("/admin/cleanup/old-month-energy")
async def cleanup_old_month_energy(
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete all month energy records except the current month"""
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    
    result = await db.month_energy.delete_many({
        "$or": [
            {"year": {"$lt": current_year}},
            {"year": current_year, "month": {"$lt": current_month}}
        ]
    })
    
    return {
        "message": f"Deleted {result.deleted_count} old month energy records",
        "deleted_count": result.deleted_count
    }

@api_router.delete("/admin/cleanup/old-year-energy")
async def cleanup_old_year_energy(
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete all year energy records except the current year"""
    current_year = datetime.utcnow().year
    
    result = await db.year_energy.delete_many({"year": {"$lt": current_year}})
    
    return {
        "message": f"Deleted {result.deleted_count} old year energy records",
        "deleted_count": result.deleted_count
    }

# ============= MOON ENERGY ENDPOINTS =============

@api_router.get("/energy/moon/current", response_model=MoonEnergy)
async def get_current_moon_energy():
    now = datetime.utcnow()
    energy = await db.moon_energy.find_one({"month": now.month, "year": now.year})
    if not energy:
        raise HTTPException(status_code=404, detail="No moon energy data for current month")
    return MoonEnergy(**energy)

@api_router.get("/energy/moon", response_model=List[MoonEnergy])
async def get_moon_energies(year: Optional[int] = None):
    query = {}
    if year:
        query["year"] = year
    
    energies = await db.moon_energy.find(query).sort("year", -1).sort("month", -1).to_list(100)
    return [MoonEnergy(**e) for e in energies]

@api_router.post("/energy/moon", response_model=MoonEnergy)
async def create_moon_energy(
    energy_data: MoonEnergyCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    energy_dict = energy_data.model_dump()
    energy_dict["id"] = str(uuid.uuid4())
    energy_dict["created_at"] = datetime.utcnow()
    
    await db.moon_energy.insert_one(energy_dict)
    return MoonEnergy(**energy_dict)

# ============= CATEGORY ENDPOINTS =============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().sort("order", 1).to_list(100)
    return [Category(**c) for c in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    category_dict = category_data.model_dump()
    category_dict["id"] = str(uuid.uuid4())
    
    await db.categories.insert_one(category_dict)
    return Category(**category_dict)

# ============= ARTICLE ENDPOINTS =============

@api_router.get("/articles", response_model=List[Article])
async def get_articles(
    category_id: Optional[str] = None,
    is_premium: Optional[bool] = None,
    limit: int = 50
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if is_premium is not None:
        query["is_premium"] = is_premium
    
    articles = await db.articles.find(query).sort("published_at", -1).limit(limit).to_list(limit)
    return [Article(**a) for a in articles]

@api_router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment views
    await db.articles.update_one(
        {"id": article_id},
        {"$inc": {"views": 1}}
    )
    
    return Article(**article)

@api_router.post("/articles", response_model=Article)
async def create_article(
    article_data: ArticleCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    article_dict = article_data.model_dump()
    article_dict["id"] = str(uuid.uuid4())
    article_dict["author_id"] = current_user["id"]
    article_dict["published_at"] = datetime.utcnow()
    article_dict["views"] = 0
    
    await db.articles.insert_one(article_dict)
    return Article(**article_dict)

# ============= COURSE ENDPOINTS =============

@api_router.get("/courses", response_model=List[Course])
async def get_courses(is_published: bool = True):
    query = {"is_published": is_published}
    courses = await db.courses.find(query).sort("created_at", -1).to_list(100)
    
    # Get chapters and lessons for each course
    for course in courses:
        chapters = await db.chapters.find({"course_id": course["id"]}).sort("order", 1).to_list(100)
        for chapter in chapters:
            lessons = await db.lessons.find({"chapter_id": chapter["id"]}).sort("order", 1).to_list(100)
            chapter["lessons"] = [Lesson(**l) for l in lessons]
        course["chapters"] = [Chapter(**c) for c in chapters]
    
    return [Course(**c) for c in courses]

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get chapters and lessons
    chapters = await db.chapters.find({"course_id": course_id}).sort("order", 1).to_list(100)
    for chapter in chapters:
        lessons = await db.lessons.find({"chapter_id": chapter["id"]}).sort("order", 1).to_list(100)
        chapter["lessons"] = [Lesson(**l) for l in lessons]
    course["chapters"] = [Chapter(**c) for c in chapters]
    
    return Course(**course)

@api_router.post("/courses", response_model=Course)
async def create_course(
    course_data: CourseCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    course_dict = course_data.model_dump()
    course_dict["id"] = str(uuid.uuid4())
    course_dict["instructor_id"] = current_user["id"]
    course_dict["created_at"] = datetime.utcnow()
    course_dict["chapters"] = []
    
    await db.courses.insert_one(course_dict)
    return Course(**course_dict)

@api_router.post("/chapters", response_model=Chapter)
async def create_chapter(
    chapter_data: ChapterCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    chapter_dict = chapter_data.model_dump()
    chapter_dict["id"] = str(uuid.uuid4())
    chapter_dict["lessons"] = []
    
    await db.chapters.insert_one(chapter_dict)
    return Chapter(**chapter_dict)

@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(
    lesson_data: LessonCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    lesson_dict = lesson_data.model_dump()
    lesson_dict["id"] = str(uuid.uuid4())
    
    await db.lessons.insert_one(lesson_dict)
    return Lesson(**lesson_dict)

# ============= FAVORITES ENDPOINTS =============

@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [Favorite(**f) for f in favorites]

@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": current_user["id"],
        "item_type": favorite_data.item_type,
        "item_id": favorite_data.item_id
    })
    
    if existing:
        return Favorite(**existing)
    
    favorite_dict = favorite_data.model_dump()
    favorite_dict["id"] = str(uuid.uuid4())
    favorite_dict["user_id"] = current_user["id"]
    favorite_dict["created_at"] = datetime.utcnow()
    
    await db.favorites.insert_one(favorite_dict)
    return Favorite(**favorite_dict)

@api_router.delete("/favorites/{item_type}/{item_id}")
async def remove_favorite(
    item_type: str,
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.favorites.delete_one({
        "user_id": current_user["id"],
        "item_type": item_type,
        "item_id": item_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Favorite removed"}

# ============= COURSE PROGRESS ENDPOINTS =============

@api_router.get("/progress", response_model=List[CourseProgress])
async def get_progress(current_user: dict = Depends(get_current_user)):
    progress = await db.course_progress.find({"user_id": current_user["id"]}).to_list(1000)
    return [CourseProgress(**p) for p in progress]

@api_router.post("/progress", response_model=CourseProgress)
async def update_progress(
    progress_data: CourseProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    existing = await db.course_progress.find_one({
        "user_id": current_user["id"],
        "lesson_id": progress_data.lesson_id
    })
    
    if existing:
        await db.course_progress.update_one(
            {"id": existing["id"]},
            {"$set": {
                "completed": progress_data.completed,
                "progress_percent": progress_data.progress_percent,
                "last_accessed": datetime.utcnow()
            }}
        )
        existing.update({
            "completed": progress_data.completed,
            "progress_percent": progress_data.progress_percent,
            "last_accessed": datetime.utcnow()
        })
        return CourseProgress(**existing)
    
    progress_dict = progress_data.model_dump()
    progress_dict["id"] = str(uuid.uuid4())
    progress_dict["user_id"] = current_user["id"]
    progress_dict["last_accessed"] = datetime.utcnow()
    
    await db.course_progress.insert_one(progress_dict)
    return CourseProgress(**progress_dict)

# ============= CUSTOM SERVICES ENDPOINTS =============

@api_router.get("/services", response_model=List[CustomService])
async def get_services():
    services = await db.custom_services.find({"is_active": True}).to_list(100)
    return [CustomService(**s) for s in services]

@api_router.post("/services", response_model=CustomService)
async def create_service(
    service_data: CustomServiceCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    service_dict = service_data.model_dump()
    service_dict["id"] = str(uuid.uuid4())
    
    await db.custom_services.insert_one(service_dict)
    return CustomService(**service_dict)

# ============= SERVICE REQUESTS ENDPOINTS =============

@api_router.get("/service-requests", response_model=List[ServiceRequest])
async def get_service_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] in ["admin", "editor"]:
        requests = await db.service_requests.find().sort("created_at", -1).to_list(100)
    else:
        requests = await db.service_requests.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    
    return [ServiceRequest(**r) for r in requests]

@api_router.post("/service-requests", response_model=ServiceRequest)
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    request_dict = request_data.model_dump()
    request_dict["id"] = str(uuid.uuid4())
    request_dict["user_id"] = current_user["id"]
    request_dict["status"] = ServiceRequestStatus.PENDING
    request_dict["created_at"] = datetime.utcnow()
    request_dict["updated_at"] = datetime.utcnow()
    
    await db.service_requests.insert_one(request_dict)
    return ServiceRequest(**request_dict)

@api_router.patch("/service-requests/{request_id}")
async def update_service_request(
    request_id: str,
    update_data: ServiceRequestUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": update_data.status,
            "admin_notes": update_data.admin_notes,
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated = await db.service_requests.find_one({"id": request_id})
    return ServiceRequest(**updated)

# ============= PREMIUM AGENDAS ENDPOINTS =============

@api_router.get("/agendas", response_model=List[PremiumAgenda])
async def get_agendas():
    agendas = await db.premium_agendas.find({"is_active": True}).to_list(100)
    return [PremiumAgenda(**a) for a in agendas]

@api_router.post("/agendas", response_model=PremiumAgenda)
async def create_agenda(
    agenda_data: PremiumAgendaCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    agenda_dict = agenda_data.model_dump()
    agenda_dict["id"] = str(uuid.uuid4())
    agenda_dict["created_at"] = datetime.utcnow()
    
    await db.premium_agendas.insert_one(agenda_dict)
    return PremiumAgenda(**agenda_dict)

# ============= PAYMENTS ENDPOINTS =============

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] in ["admin", "editor"]:
        payments = await db.payments.find().sort("created_at", -1).to_list(100)
    else:
        payments = await db.payments.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    
    return [Payment(**p) for p in payments]

@api_router.post("/payments", response_model=Payment)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    payment_dict = payment_data.model_dump()
    payment_dict["id"] = str(uuid.uuid4())
    payment_dict["user_id"] = current_user["id"]
    payment_dict["status"] = PaymentStatus.PENDING
    payment_dict["created_at"] = datetime.utcnow()
    payment_dict["updated_at"] = datetime.utcnow()
    
    await db.payments.insert_one(payment_dict)
    return Payment(**payment_dict)

@api_router.patch("/payments/{payment_id}")
async def update_payment(
    payment_id: str,
    update_data: PaymentUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment status
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": update_data.status,
            "admin_notes": update_data.admin_notes,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # If payment approved, handle subscription or purchase
    if update_data.status == PaymentStatus.APPROVED:
        if payment["product_type"] == "subscription":
            # Create or extend subscription
            subscription_type = payment["product_id"]  # monthly or annual
            duration_days = 30 if subscription_type == "monthly" else 365
            
            existing_sub = await db.subscriptions.find_one({
                "user_id": payment["user_id"],
                "status": SubscriptionStatus.ACTIVE
            })
            
            if existing_sub:
                # Extend existing subscription
                end_date = existing_sub["end_date"] + timedelta(days=duration_days)
                await db.subscriptions.update_one(
                    {"id": existing_sub["id"]},
                    {"$set": {"end_date": end_date}}
                )
            else:
                # Create new subscription
                sub_dict = {
                    "id": str(uuid.uuid4()),
                    "user_id": payment["user_id"],
                    "type": subscription_type,
                    "start_date": datetime.utcnow(),
                    "end_date": datetime.utcnow() + timedelta(days=duration_days),
                    "status": SubscriptionStatus.ACTIVE,
                    "payment_id": payment_id,
                    "created_at": datetime.utcnow()
                }
                await db.subscriptions.insert_one(sub_dict)
            
            # Update user subscription status
            await db.users.update_one(
                {"id": payment["user_id"]},
                {"$set": {"has_active_subscription": True, "role": UserRole.PREMIUM_MEMBER}}
            )
    
    updated = await db.payments.find_one({"id": payment_id})
    return Payment(**updated)

# ============= INFO PAGES ENDPOINTS =============

@api_router.get("/pages", response_model=List[InfoPage])
async def get_pages():
    pages = await db.info_pages.find().to_list(100)
    return [InfoPage(**p) for p in pages]

@api_router.get("/pages/{slug}", response_model=InfoPage)
async def get_page(slug: str):
    page = await db.info_pages.find_one({"slug": slug})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return InfoPage(**page)

@api_router.post("/pages", response_model=InfoPage)
async def create_page(
    page_data: InfoPageCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    page_dict = page_data.model_dump()
    page_dict["id"] = str(uuid.uuid4())
    page_dict["updated_at"] = datetime.utcnow()
    
    await db.info_pages.insert_one(page_dict)
    return InfoPage(**page_dict)

# ============= SETTINGS ENDPOINTS =============

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one()
    if not settings:
        # Create default settings
        settings = {
            "id": str(uuid.uuid4()),
            "primary_color": "#0B1F3A",
            "accent_color": "#C8A24A",
            "social_media": {},
            "updated_at": datetime.utcnow()
        }
        await db.settings.insert_one(settings)
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(
    settings_data: SettingsUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    existing = await db.settings.find_one()
    if not existing:
        # Create new
        settings_dict = settings_data.model_dump(exclude_unset=True)
        settings_dict["id"] = str(uuid.uuid4())
        settings_dict["updated_at"] = datetime.utcnow()
        await db.settings.insert_one(settings_dict)
        return Settings(**settings_dict)
    
    # Update existing
    update_data = settings_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.settings.update_one(
        {"id": existing["id"]},
        {"$set": update_data}
    )
    
    updated = await db.settings.find_one({"id": existing["id"]})
    return Settings(**updated)

# ============= CONCEPTS (Home Intro Cards) =============

@api_router.get("/concepts", response_model=List[Concept])
async def get_concepts():
    concepts = await db.concepts.find().sort("order", 1).to_list(100)
    return [Concept(**c) for c in concepts]

@api_router.get("/concepts/{slug}", response_model=Concept)
async def get_concept(slug: str):
    concept = await db.concepts.find_one({"slug": slug})
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    return Concept(**concept)

@api_router.post("/concepts", response_model=Concept)
async def create_concept(
    concept_data: ConceptCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    concept_dict = concept_data.model_dump()
    concept_dict["id"] = str(uuid.uuid4())
    await db.concepts.insert_one(concept_dict)
    return Concept(**concept_dict)

@api_router.put("/concepts/{concept_id}", response_model=Concept)
async def update_concept(
    concept_id: str,
    concept_data: ConceptCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update an existing concept (BaZi, Qi Men, TongShu, etc.)"""
    # Find the existing concept
    existing = await db.concepts.find_one({"id": concept_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Concept not found")
    
    # Update the concept
    concept_dict = concept_data.model_dump()
    concept_dict["id"] = concept_id  # Keep the same ID
    
    result = await db.concepts.update_one(
        {"id": concept_id},
        {"$set": concept_dict}
    )
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Concept not found")
    
    # Return the updated concept
    updated_concept = await db.concepts.find_one({"id": concept_id})
    return Concept(**updated_concept)

@api_router.delete("/concepts/{concept_id}")
async def delete_concept(
    concept_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a concept"""
    result = await db.concepts.delete_one({"id": concept_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Concept not found")
    return {"message": "Concept deleted successfully"}

# ============= MONTH ENERGY =============

def normalize_month_key(raw: str) -> str:
    """Canonicalize a month key to YYYY-MM so formatting drift (e.g. "2026 - 08"
    vs "2026-08") can never defeat the upsert match in create_month_energy and
    silently create a duplicate row instead of updating the existing one."""
    m = re.match(r'\s*(\d{4})\s*-\s*(\d{1,2})\s*$', raw)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    return raw.strip()


@api_router.get("/energy/month", response_model=MonthEnergy)
async def get_month_energy(lang: str = "es"):
    now = datetime.utcnow()
    month_str = now.strftime("%Y-%m")
    energy = await db.month_energy.find_one({"month": month_str})
    if not energy:
        raise HTTPException(status_code=404, detail="No month energy data")
    
    # Translate if not Spanish
    if lang != "es":
        energy = await translate_dict(energy, lang, ["title", "content"])
    
    return MonthEnergy(**energy)

@api_router.post("/admin/month-energy", response_model=MonthEnergy)
async def create_month_energy(
    energy_data: MonthEnergyCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    energy_dict = energy_data.model_dump()
    normalized_month = normalize_month_key(energy_data.month)
    energy_dict["month"] = normalized_month
    
    # Check if already exists for this month (normalized key)
    existing = await db.month_energy.find_one({"month": normalized_month})
    
    if existing:
        # Update existing entry
        energy_dict["id"] = existing["id"]
        energy_dict["created_at"] = existing.get("created_at", datetime.utcnow())
        await db.month_energy.update_one(
            {"month": normalized_month},
            {"$set": energy_dict}
        )
    else:
        # Create new entry
        energy_dict["id"] = str(uuid.uuid4())
        energy_dict["created_at"] = datetime.utcnow()
        await db.month_energy.insert_one(energy_dict)
    
    # NO AUTO-CLEANUP - Month energy is permanent
    
    return MonthEnergy(**energy_dict)

@api_router.delete("/admin/month-energy/{month}")
async def delete_month_energy(
    month: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a specific month energy entry. Admin only."""
    result = await db.month_energy.delete_one({"month": normalize_month_key(month)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Month energy not found")
    return {"message": f"Month energy for {month} deleted successfully"}

# ============= YEAR ENERGY =============

@api_router.get("/energy/year/current", response_model=YearEnergy)
async def get_current_year_energy(lang: str = "es"):
    now = datetime.utcnow()
    energy = await db.year_energy.find_one({"year": now.year})
    if not energy:
        raise HTTPException(status_code=404, detail="No year energy data")
    
    # Translate if not Spanish
    if lang != "es":
        energy = await translate_dict(energy, lang, ["title", "content"])
    
    return YearEnergy(**energy)

@api_router.get("/energy/year", response_model=List[YearEnergy])
async def get_year_energies(lang: str = "es"):
    energies = await db.year_energy.find().sort("year", -1).to_list(50)
    
    # Translate if not Spanish
    if lang != "es":
        energies = await translate_list_of_dicts(energies, lang, ["title", "content"])
    
    return [YearEnergy(**e) for e in energies]

@api_router.post("/admin/year-energy", response_model=YearEnergy)
async def create_year_energy(
    energy_data: YearEnergyCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    energy_dict = energy_data.model_dump()
    
    # Check if already exists for this year
    existing = await db.year_energy.find_one({"year": energy_data.year})
    
    if existing:
        # Update existing entry
        energy_dict["id"] = existing["id"]
        energy_dict["created_at"] = existing.get("created_at", datetime.utcnow())
        await db.year_energy.update_one(
            {"year": energy_data.year},
            {"$set": energy_dict}
        )
    else:
        # Create new entry
        energy_dict["id"] = str(uuid.uuid4())
        energy_dict["created_at"] = datetime.utcnow()
        await db.year_energy.insert_one(energy_dict)
    
    # NO AUTO-CLEANUP - Year energy is permanent
    
    return YearEnergy(**energy_dict)

@api_router.delete("/admin/year-energy/{year}")
async def delete_year_energy(
    year: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a specific year energy entry. Admin only."""
    result = await db.year_energy.delete_one({"year": year})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Year energy not found")
    return {"message": f"Year energy for {year} deleted successfully"}

# ============= NEWBORN VOCATION (Daily general) =============

@api_router.get("/newborn-vocation/today", response_model=NewbornVocation)
async def get_today_newborn_vocation(lang: str = "es", client_date: Optional[str] = None):
    """
    Get newborn vocation for today (based on client's date).
    User visibility rules:
    - Can see: Client's today + 2 previous days
    - Cannot see: Future dates (hidden even if admin scheduled them)
    
    Args:
        lang: Language code for translation
        client_date: Optional client-side date (YYYY-MM-DD) to handle timezone differences
    """
    # Use client's date if provided, otherwise use server UTC date
    if client_date:
        try:
            # Validate the date format
            datetime.strptime(client_date, "%Y-%m-%d")
            today = client_date
        except ValueError:
            today = datetime.utcnow().strftime("%Y-%m-%d")
    else:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calculate 2 days before the client's "today"
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    two_days_ago = (today_dt - timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Query for today or up to 2 days ago (NOT future dates relative to client)
    # First try to get today's vocation
    vocation = await db.newborn_vocation.find_one({"date": today})
    
    if not vocation:
        # Fallback: get the most recent vocation within the allowed range (today - 2 days)
        # But NEVER show future dates
        vocation = await db.newborn_vocation.find_one(
            {"date": {"$gte": two_days_ago, "$lte": today}},
            sort=[("date", -1)]  # Most recent first
        )
    
    if not vocation:
        raise HTTPException(status_code=404, detail="No newborn vocation available")
    
    # Translate if not Spanish
    if lang != "es":
        vocation = await translate_dict(vocation, lang, ["title", "content", "element", "personality", "career_paths"])
    
    return NewbornVocation(**vocation)

@api_router.get("/newborn-vocation/by-date", response_model=NewbornVocation)
async def get_newborn_vocation_by_date(date: str, lang: str = "es", client_date: Optional[str] = None):
    """
    Get newborn vocation for a specific date.
    Only allows access to dates within the 3-day window (client's today + 2 previous days).
    
    Args:
        date: The date to fetch (YYYY-MM-DD)
        lang: Language code for translation
        client_date: Client's current date for validation (YYYY-MM-DD)
    """
    # Determine the client's "today" for validation
    if client_date:
        try:
            datetime.strptime(client_date, "%Y-%m-%d")
            today = client_date
        except ValueError:
            today = datetime.utcnow().strftime("%Y-%m-%d")
    else:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    two_days_ago = (today_dt - timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Validate requested date is within allowed range
    if date > today or date < two_days_ago:
        raise HTTPException(
            status_code=403, 
            detail=f"Date {date} is outside the allowed range ({two_days_ago} to {today})"
        )
    
    vocation = await db.newborn_vocation.find_one({"date": date})
    
    if not vocation:
        raise HTTPException(status_code=404, detail=f"No newborn vocation for date {date}")
    
    # Translate if not Spanish
    if lang != "es":
        vocation = await translate_dict(vocation, lang, ["title", "content", "element", "personality", "career_paths"])
    
    return NewbornVocation(**vocation)

@api_router.get("/newborn-vocation/available-dates")
async def get_available_newborn_vocation_dates(client_date: Optional[str] = None):
    """
    Get list of available dates within the 3-day window that have content.
    Useful for frontend navigation arrows.
    
    Returns:
        - available_dates: List of dates with content
        - today: The client's today date
        - range_start: First allowed date (2 days ago)
        - range_end: Last allowed date (today)
    """
    # Determine the client's "today"
    if client_date:
        try:
            datetime.strptime(client_date, "%Y-%m-%d")
            today = client_date
        except ValueError:
            today = datetime.utcnow().strftime("%Y-%m-%d")
    else:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    two_days_ago = (today_dt - timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Get all vocations within allowed range
    vocations = await db.newborn_vocation.find(
        {"date": {"$gte": two_days_ago, "$lte": today}}
    ).sort("date", -1).to_list(10)
    
    available_dates = [v["date"] for v in vocations]
    
    return {
        "available_dates": available_dates,
        "today": today,
        "range_start": two_days_ago,
        "range_end": today
    }

@api_router.get("/newborn-vocation/recent", response_model=List[NewbornVocation])
async def get_recent_newborn_vocations(lang: str = "es", client_date: Optional[str] = None):
    """
    Get newborn vocations for today and the 2 previous days.
    Useful for displaying recent history to users.
    """
    # Determine the client's "today"
    if client_date:
        try:
            datetime.strptime(client_date, "%Y-%m-%d")
            today = client_date
        except ValueError:
            today = datetime.utcnow().strftime("%Y-%m-%d")
    else:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    two_days_ago = (today_dt - timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Get vocations within allowed range (today - 2 days), excluding future
    vocations = await db.newborn_vocation.find(
        {"date": {"$gte": two_days_ago, "$lte": today}}
    ).sort("date", -1).to_list(3)
    
    # Translate if not Spanish
    if lang != "es":
        vocations = await translate_list_of_dicts(vocations, lang, ["title", "content", "element", "personality", "career_paths"])
    
    return [NewbornVocation(**v) for v in vocations]

@api_router.post("/admin/newborn-vocation", response_model=NewbornVocation)
async def create_newborn_vocation(
    vocation_data: NewbornVocationCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin can create/update vocations for any date (including future dates for scheduling).
    However, users will only see today + 2 previous days.
    """
    vocation_dict = vocation_data.model_dump()
    
    # Check if already exists for this date
    existing = await db.newborn_vocation.find_one({"date": vocation_data.date})
    
    if existing:
        # Update existing entry
        vocation_dict["id"] = existing["id"]
        vocation_dict["created_at"] = existing.get("created_at", datetime.utcnow())
        await db.newborn_vocation.update_one(
            {"date": vocation_data.date},
            {"$set": vocation_dict}
        )
    else:
        # Create new entry
        vocation_dict["id"] = str(uuid.uuid4())
        vocation_dict["created_at"] = datetime.utcnow()
        await db.newborn_vocation.insert_one(vocation_dict)
    
    return NewbornVocation(**vocation_dict)

# ============= AGENDA MONTHS (Content sections per month) =============

@api_router.get("/agendas/{agenda_id}/months", response_model=List[AgendaMonth])
async def get_agenda_months(agenda_id: str, lang: str = "es"):
    months = await db.agenda_months.find({"agenda_id": agenda_id}).sort("order", 1).to_list(100)
    
    # Translate if not Spanish
    if lang != "es":
        months = await translate_list_of_dicts(months, lang, ["title", "content"])
    
    return [AgendaMonth(**m) for m in months]

@api_router.post("/agenda-months", response_model=AgendaMonth)
async def create_agenda_month(
    month_data: AgendaMonthCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    month_dict = month_data.model_dump()
    month_dict["id"] = str(uuid.uuid4())
    await db.agenda_months.insert_one(month_dict)
    return AgendaMonth(**month_dict)

@api_router.post("/admin/wedding-agenda", response_model=AgendaMonth)
async def create_wedding_agenda(
    month_data: AgendaMonthCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    month_dict = month_data.model_dump()
    
    # Check if already exists for this agenda_id and month
    existing = await db.agenda_months.find_one({
        "agenda_id": month_data.agenda_id,
        "month": month_data.month
    })
    
    if existing:
        # Update existing entry
        month_dict["id"] = existing["id"]
        await db.agenda_months.update_one(
            {"agenda_id": month_data.agenda_id, "month": month_data.month},
            {"$set": month_dict}
        )
    else:
        # Create new entry
        month_dict["id"] = str(uuid.uuid4())
        await db.agenda_months.insert_one(month_dict)
    
    return AgendaMonth(**month_dict)

@api_router.delete("/admin/wedding-agenda/{agenda_id}/{month}")
async def delete_wedding_agenda(
    agenda_id: str,
    month: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a specific wedding agenda entry. Admin only."""
    result = await db.agenda_months.delete_one({
        "agenda_id": agenda_id,
        "month": month
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wedding agenda entry not found")
    return {"message": f"Wedding agenda for {month} deleted successfully"}

# ============= FAQ =============

@api_router.get("/faq", response_model=List[FAQCategory])
async def get_faq():
    categories = await db.faq_categories.find().sort("order", 1).to_list(100)
    for cat in categories:
        items = await db.faq_items.find({"category_id": cat["id"]}).sort("order", 1).to_list(100)
        cat["items"] = [FAQItem(**i) for i in items]
    return [FAQCategory(**c) for c in categories]

@api_router.post("/faq/categories", response_model=FAQCategory)
async def create_faq_category(
    data: FAQCategoryCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    cat_dict = data.model_dump()
    cat_dict["id"] = str(uuid.uuid4())
    cat_dict["items"] = []
    await db.faq_categories.insert_one(cat_dict)
    return FAQCategory(**cat_dict)

@api_router.post("/faq/items", response_model=FAQItem)
async def create_faq_item(
    data: FAQItemCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    item_dict = data.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    await db.faq_items.insert_one(item_dict)
    return FAQItem(**item_dict)

# ============= PURCHASES / MIS COMPRAS =============

@api_router.get("/purchases/my-purchases", response_model=List[Purchase])
async def get_my_purchases(
    current_user: dict = Depends(get_current_user)
):
    """Get all purchases for the authenticated user (activated courses with video links)"""
    purchases = await db.purchases.find({
        "user_id": current_user["id"],
        "status": "activated"  # Only show activated purchases
    }).sort("purchased_at", -1).to_list(100)
    
    return [Purchase(**p) for p in purchases]

@api_router.get("/admin/purchases", response_model=List[Purchase])
async def get_all_purchases(
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Get all purchases (pending and activated)"""
    purchases = await db.purchases.find().sort("purchased_at", -1).to_list(1000)
    return [Purchase(**p) for p in purchases]

@api_router.put("/admin/purchases/{purchase_id}", response_model=Purchase)
async def update_purchase(
    purchase_id: str,
    update_data: PurchaseUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Update purchase (activate and add video URL)"""
    existing = await db.purchases.find_one({"id": purchase_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # If activating, set activated_at and activated_by
    if update_data.status == "activated":
        update_dict["activated_at"] = datetime.utcnow()
        update_dict["activated_by"] = current_user["id"]
    
    await db.purchases.update_one(
        {"id": purchase_id},
        {"$set": update_dict}
    )
    
    updated_purchase = await db.purchases.find_one({"id": purchase_id})
    return Purchase(**updated_purchase)

# ============= APP CONFIGURATION =============

@api_router.get("/app-config", response_model=AppConfig)
async def get_app_config():
    """Get app configuration (public endpoint for contact info and promotional texts)"""
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        # Return default config if not found
        default_config = AppConfig()
        await db.app_config.insert_one(default_config.model_dump())
        return default_config
    return AppConfig(**config)

@api_router.put("/admin/app-config", response_model=AppConfig)
async def update_app_config(
    config_data: AppConfigUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update app configuration (admin only)"""
    # Get existing config or create default
    existing = await db.app_config.find_one({"id": "app_config"})
    if not existing:
        # Create default config
        default_config = AppConfig()
        await db.app_config.insert_one(default_config.model_dump())
        existing = default_config.model_dump()
    
    # Update only provided fields
    update_dict = {k: v for k, v in config_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    if update_dict:
        await db.app_config.update_one(
            {"id": "app_config"},
            {"$set": update_dict}
        )
    
    # Return updated config
    updated_config = await db.app_config.find_one({"id": "app_config"})
    return AppConfig(**updated_config)

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
