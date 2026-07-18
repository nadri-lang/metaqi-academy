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
)
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    get_current_admin_user
)

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
async def get_daily_energy(date: Optional[str] = None):
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")
    
    energy = await db.daily_energy.find_one({"date": date})
    if not energy:
        raise HTTPException(status_code=404, detail="No energy data for this date")
    return DailyEnergy(**energy)

@api_router.post("/energy/daily", response_model=DailyEnergy)
async def create_daily_energy(
    energy_data: DailyEnergyCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    energy_dict = energy_data.model_dump()
    energy_dict["id"] = str(uuid.uuid4())
    energy_dict["created_at"] = datetime.utcnow()
    
    await db.daily_energy.insert_one(energy_dict)
    return DailyEnergy(**energy_dict)

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
