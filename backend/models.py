from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import re

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    FREE_MEMBER = "free_member"
    PREMIUM_MEMBER = "premium_member"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ServiceRequestStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

# User Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    language: str = "es"
    role: UserRole = UserRole.FREE_MEMBER

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    hashed_password: str
    has_active_subscription: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: str
    has_active_subscription: bool
    created_at: datetime
    last_login: Optional[datetime]

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Google Auth Models
class GoogleAuthSession(BaseModel):
    session_id: str

class GoogleAuthResponse(BaseModel):
    session_token: str
    user: UserResponse

class UserSession(BaseModel):
    id: str
    session_token: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime


# Category Model
class Category(BaseModel):
    id: str
    name: str
    name_en: Optional[str] = None
    name_zh: Optional[str] = None
    slug: str
    icon: Optional[str] = None
    color: str = "#C8A24A"
    order: int = 0

class CategoryCreate(BaseModel):
    name: str
    name_en: Optional[str] = None
    name_zh: Optional[str] = None
    slug: str
    icon: Optional[str] = None
    color: str = "#C8A24A"
    order: int = 0

# Energy Models
class DailyEnergy(BaseModel):
    id: str
    date: str  # YYYY-MM-DD
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    animal: Optional[str] = None  # e.g. "Tigre de Madera"
    bazi_relationships: Optional[str] = None  # BaZi element relationships text
    recommendations: List[str] = []  # Sustained activities
    avoid: List[str] = []
    feng_shui_sectors: List[str] = []  # e.g. ["Norte: Prosperidad"]
    qimen_directions: List[str] = []  # e.g. ["Sur: Fama"]
    favorable_hours: List[str] = []  # e.g. ["07:00-09:00: Energía Yang"]
    travel_hours: List[str] = []  # Hours NOT recommended for travel (Viajes)
    activations: Optional[str] = None  # Daily activations text
    activations_en: Optional[str] = None
    activations_fr: Optional[str] = None
    activations_de: Optional[str] = None
    activations_ro: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyEnergyCreate(BaseModel):
    date: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    animal: Optional[str] = None
    bazi_relationships: Optional[str] = None
    recommendations: List[str] = []
    avoid: List[str] = []
    feng_shui_sectors: List[str] = []
    qimen_directions: List[str] = []
    favorable_hours: List[str] = []
    travel_hours: List[str] = []  # Hours NOT recommended for travel (Viajes)
    activations: Optional[str] = None  # Daily activations text

class MoonEnergy(BaseModel):
    id: str
    month: int
    year: int
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    recommendations: List[str] = []
    activations: List[str] = []
    rituals: List[str] = []
    remedies: List[str] = []
    avoid: List[str] = []
    is_premium: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoonEnergyCreate(BaseModel):
    month: int
    year: int
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    recommendations: List[str] = []
    activations: List[str] = []
    rituals: List[str] = []
    remedies: List[str] = []
    avoid: List[str] = []
    is_premium: bool = False

# Article Models
class Article(BaseModel):
    id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    category_id: str
    image: Optional[str] = None  # base64
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    is_premium: bool = False
    author_id: str
    published_at: datetime = Field(default_factory=datetime.utcnow)
    views: int = 0

class ArticleCreate(BaseModel):
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    category_id: str
    image: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    is_premium: bool = False

# Course Models
class Lesson(BaseModel):
    id: str
    chapter_id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration_minutes: int = 0
    is_free: bool = True
    order: int = 0

class LessonCreate(BaseModel):
    chapter_id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration_minutes: int = 0
    is_free: bool = True
    order: int = 0

class Chapter(BaseModel):
    id: str
    course_id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    order: int = 0
    lessons: List[Lesson] = []

class ChapterCreate(BaseModel):
    course_id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    order: int = 0

class Course(BaseModel):
    id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    image: Optional[str] = None  # base64
    price: float = 0.0
    is_premium: bool = False
    level: str = "beginner"  # beginner, intermediate, advanced
    instructor_id: str
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    chapters: List[Chapter] = []

class CourseCreate(BaseModel):
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    image: Optional[str] = None
    price: float = 0.0
    is_premium: bool = False
    level: str = "beginner"
    is_published: bool = False

# Favorites
class Favorite(BaseModel):
    id: str
    user_id: str
    item_type: str  # article, course, lesson
    item_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteCreate(BaseModel):
    item_type: str
    item_id: str

# Course Progress
class CourseProgress(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    completed: bool = False
    progress_percent: int = 0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

class CourseProgressUpdate(BaseModel):
    lesson_id: str
    completed: bool = False
    progress_percent: int = 0

# Custom Services
class CustomService(BaseModel):
    id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    includes: List[str] = []
    price: float
    original_price: Optional[float] = None  # For displaying discounts
    is_offer: bool = False
    form_fields: List[Dict[str, Any]] = []  # Dynamic form configuration
    is_active: bool = True

class CustomServiceCreate(BaseModel):
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    includes: List[str] = []
    price: float
    original_price: Optional[float] = None
    is_offer: bool = False
    form_fields: List[Dict[str, Any]] = []
    is_active: bool = True

# Service Requests
class ServiceRequest(BaseModel):
    id: str
    user_id: str
    service_id: str
    form_data: Dict[str, Any]
    files: List[str] = []  # base64 encoded files
    status: ServiceRequestStatus = ServiceRequestStatus.PENDING
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequestCreate(BaseModel):
    service_id: str
    form_data: Dict[str, Any]
    files: List[str] = []

class ServiceRequestUpdate(BaseModel):
    status: ServiceRequestStatus
    admin_notes: Optional[str] = None

# Premium Agendas
class PremiumAgenda(BaseModel):
    id: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    type: str  # monthly, annual
    price: float
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    materials: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PremiumAgendaCreate(BaseModel):
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    type: str
    price: float
    description: str
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    materials: List[str] = []
    is_active: bool = True

# Payments
class Payment(BaseModel):
    id: str
    user_id: str
    product_type: str  # course, service, subscription, agenda
    product_id: str
    amount: float
    currency: str = "EUR"
    payment_method: str  # revolut, bizum, bank_transfer
    payment_proof: Optional[str] = None  # base64 image
    payment_details: Dict[str, Any] = {}  # phone number, account, etc
    status: PaymentStatus = PaymentStatus.PENDING
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentCreate(BaseModel):
    product_type: str
    product_id: str
    amount: float
    currency: str = "EUR"
    payment_method: str
    payment_proof: Optional[str] = None
    payment_details: Dict[str, Any] = {}

class PaymentUpdate(BaseModel):
    status: PaymentStatus
    admin_notes: Optional[str] = None

# Subscriptions
class Subscription(BaseModel):
    id: str
    user_id: str
    type: str  # monthly, annual
    start_date: datetime
    end_date: datetime
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    payment_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionCreate(BaseModel):
    type: str
    payment_id: str

# Info Pages
class InfoPage(BaseModel):
    id: str
    slug: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InfoPageCreate(BaseModel):
    slug: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None

# Month Energy
class MonthEnergy(BaseModel):
    id: str
    month: str  # Format: YYYY-MM
    title: str
    title_en: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    is_free: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MonthEnergyCreate(BaseModel):
    month: str
    title: str
    title_en: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    is_free: bool = True

# Year Energy - Simple concept with YouTube link
class YearEnergy(BaseModel):
    id: str
    year: int
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str  # Short description of year trends
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None  # YouTube link
    created_at: datetime = Field(default_factory=datetime.utcnow)

class YearEnergyCreate(BaseModel):
    year: int
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    video_url: Optional[str] = None

# Newborn Vocation Daily (Free general content)
class NewbornVocation(BaseModel):
    id: str
    date: str  # YYYY-MM-DD
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str  # General analysis for babies born today
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    talents: List[str] = []
    vocations: List[str] = []
    challenges: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NewbornVocationCreate(BaseModel):
    date: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    talents: List[str] = []
    vocations: List[str] = []
    challenges: List[str] = []
    
    @validator('date')
    def validate_date_format(cls, v):
        """Validate date format is YYYY-MM-DD with leading zeros"""
        if not re.match(r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$', v):
            raise ValueError(
                'Formato de fecha inválido. Usa YYYY-MM-DD con ceros delante. '
                'Ejemplo: 2026-08-05 (no 2026-08-5)'
            )
        return v

# Concept Cards (Home intro - What is BaZi, Qi Men, etc)
class Concept(BaseModel):
    id: str
    slug: str  # bazi, qi-men, feng-shui, tongshu, activations, remedies
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    short_description: str
    full_description: Optional[str] = None
    icon: str = "sparkles"  # Ionicons name
    color: str = "#C8A24A"
    order: int = 0

class ConceptCreate(BaseModel):
    slug: str
    title: str
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    short_description: str
    full_description: Optional[str] = None
    icon: str = "sparkles"
    color: str = "#C8A24A"
    order: int = 0

# Premium Agenda Content - Monthly sections (scrollable content)
class AgendaMonth(BaseModel):
    id: str
    agenda_id: str
    month: int  # 1-12
    year: int
    title: str  # e.g. "Enero 2027"
    content: str  # Main content for the month
    events: List[Dict[str, Any]] = []  # List of events/dates with details
    order: int = 0
    is_free: bool = True  # True = gratis (HOME), False = pago (SERVICIOS)

class AgendaMonthCreate(BaseModel):
    agenda_id: str
    month: int
    year: int
    title: str
    content: str
    events: List[Dict[str, Any]] = []
    order: int = 0
    is_free: bool = True  # True = gratis, False = pago

# FAQ - Frequently Asked Questions
class FAQItem(BaseModel):
    id: str
    category_id: str
    question: str
    answer: str
    order: int = 0

class FAQItemCreate(BaseModel):
    category_id: str
    question: str
    answer: str
    order: int = 0

class FAQCategory(BaseModel):
    id: str
    title: str
    icon: str = "help-circle"
    order: int = 0
    items: List[FAQItem] = []

class FAQCategoryCreate(BaseModel):
    title: str
    icon: str = "help-circle"
    order: int = 0

# Settings
class Settings(BaseModel):
    id: str
    logo: Optional[str] = None  # base64
    primary_color: str = "#0B1F3A"
    accent_color: str = "#C8A24A"
    social_media: Dict[str, str] = {}
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsUpdate(BaseModel):
    logo: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None

# User Extended Models (Teléfono, Apodo)
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    nickname: Optional[str] = None
    language: Optional[str] = None

class UserExtended(UserResponse):
    phone: Optional[str] = None
    nickname: Optional[str] = None

# Productos y Compras
class ProductType(str, Enum):
    AGENDA_TRIMESTER = "agenda_trimester"
    COURSE = "course"
    SERVICE = "service"

class Product(BaseModel):
    id: str
    product_type: ProductType
    name: str
    description: str
    price: float
    metadata: Dict[str, Any] = {}  # e.g., {"trimester": "Q1", "year": 2027}
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    product_type: ProductType
    name: str
    description: str
    price: float
    metadata: Dict[str, Any] = {}

class Purchase(BaseModel):
    id: str
    user_id: str
    product_id: str
    product_name: str
    product_type: ProductType
    price: float
    payment_method: str  # "bizum", "revolut", "paypal"
    payment_proof: Optional[str] = None  # URL o base64 del comprobante
    status: PaymentStatus = PaymentStatus.PENDING
    video_url: Optional[str] = None  # URL del vídeo del curso (admin lo añade)
    metadata: Dict[str, Any] = {}
    purchased_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None
    activated_by: Optional[str] = None  # admin_id

class PurchaseCreate(BaseModel):
    product_id: str
    payment_method: str
    payment_proof: Optional[str] = None

class PurchaseUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    video_url: Optional[str] = None
    activated_at: Optional[datetime] = None
    activated_by: Optional[str] = None

# App Configuration Models
class AppConfig(BaseModel):
    """
    Global app configuration for editable content like contact info, 
    promotional texts, etc.
    """
    id: str = "app_config"  # Singleton - only one config document
    # Contact Information
    contact_email: str = "nnikholk@gmail.com"
    contact_whatsapp: str = "34640510085"
    
    # Wedding Agenda 2027 - Promotional Texts
    agenda_2027_title_es: str = "AGENDA DE BODAS 2027"
    agenda_2027_title_en: str = "WEDDING AGENDA 2027"
    agenda_2027_description_es: str = "Se muestran solo los mejores días para bodas, ceremonias y pedidas de mano, evaluados según Feng Shui, BaZi y Qi Men Dun Jia."
    agenda_2027_description_en: str = "Only the best days for weddings, ceremonies and marriage proposals are shown, evaluated according to Feng Shui, BaZi and Qi Men Dun Jia."
    
    # Other configurable texts can be added here
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppConfigUpdate(BaseModel):
    """Fields that can be updated in app configuration"""
    contact_email: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    agenda_2027_title_es: Optional[str] = None
    agenda_2027_title_en: Optional[str] = None
    agenda_2027_description_es: Optional[str] = None
    agenda_2027_description_en: Optional[str] = None

# BaZi Service Configuration
class BaziServiceConfig(BaseModel):
    """
    Configuration for the BaZi Natal Chart Analysis service.
    Editable by admin.
    """
    id: str = "bazi_service_config"
    title: str = "Análisis Carta Natal BaZi"
    description: str = "Análisis completo de tus pilares del destino, ciclos de suerte y elementos personales."
    price: float = 197.0
    features: List[str] = [
        "Análisis de los 4 Pilares del Destino",
        "Ciclos de Suerte de 10 años",
        "Elementos favorables y desfavorables",
        "Recomendaciones personalizadas"
    ]
    is_active: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BaziServiceConfigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Personalized BaZi Report for Users
class BaziReport(BaseModel):
    """
    Personalized BaZi natal chart analysis report for a specific user.
    Written by admin and published for the user to read.
    """
    id: str
    user_id: str
    user_email: str
    report_content: str  # The full personalized analysis text
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BaziReportCreate(BaseModel):
    user_email: str
    report_content: str
    is_published: bool = False

class BaziReportUpdate(BaseModel):
    report_content: Optional[str] = None
    is_published: Optional[bool] = None



# Password Reset Token
class PasswordResetToken(BaseModel):
    """
    Token for password reset requests.
    Each token is valid for 1 hour.
    """
    id: str
    user_id: str
    user_email: str
    token: str  # Unique random token
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# Analytics Models
class AnalyticsSummary(BaseModel):
    total_visitors: int
    total_registered: int
    active_today: int
    registered_today: int
    active_this_month: int
    last_updated: datetime

class VisitorLog(BaseModel):
    id: str
    user_id: Optional[str] = None
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    date: str  # YYYY-MM-DD for grouping


# User Content Models
class UserContentType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    PDF = "pdf"
    WEB = "web"

class UserContent(BaseModel):
    """User-uploaded or user-associated content"""
    id: str
    user_id: str
    type: UserContentType
    title: str
    url: str
    created_by: str  # User ID of who created/uploaded this
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserContentCreate(BaseModel):
    """Create user content (admin only)"""
    user_email: str
    type: UserContentType
    title: str
    url: Optional[str] = None  # If not uploading file, provide URL directly
