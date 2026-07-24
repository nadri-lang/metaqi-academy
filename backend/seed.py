import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv
from pathlib import Path
import os
from auth import get_password_hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding database...")
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "nnikholk@gmail.com"})
    if not admin_exists:
        admin = {
            "id": str(uuid.uuid4()),
            "name": "Nikhol Admin",
            "email": "nnikholk@gmail.com",
            "hashed_password": get_password_hash("admin123"),
            "language": "es",
            "role": "admin",
            "has_active_subscription": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        await db.users.insert_one(admin)
        print("✅ Admin user created: nnikholk@gmail.com / admin123")
    
    # Create categories
    categories_exist = await db.categories.count_documents({})
    if categories_exist == 0:
        categories = [
            {
                "id": str(uuid.uuid4()),
                "name": "Qi Men Dun Jia",
                "name_en": "Qi Men Dun Jia",
                "name_zh": "奇门遁甲",
                "slug": "qi-men",
                "color": "#C8A24A",
                "order": 1
            },
            {
                "id": str(uuid.uuid4()),
                "name": "BaZi",
                "name_en": "BaZi",
                "name_zh": "八字",
                "slug": "bazi",
                "color": "#C8A24A",
                "order": 2
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Feng Shui",
                "name_en": "Feng Shui",
                "name_zh": "风水",
                "slug": "feng-shui",
                "color": "#4F7A5A",
                "order": 3
            },
            {
                "id": str(uuid.uuid4()),
                "name": "I Ching",
                "name_en": "I Ching",
                "name_zh": "易经",
                "slug": "i-ching",
                "color": "#C8A24A",
                "order": 4
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Activaciones",
                "name_en": "Activations",
                "name_zh": "激活",
                "slug": "activaciones",
                "color": "#C8A24A",
                "order": 5
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Rituales",
                "name_en": "Rituals",
                "name_zh": "仪式",
                "slug": "rituales",
                "color": "#C8A24A",
                "order": 6
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Remedios",
                "name_en": "Remedies",
                "name_zh": "补救",
                "slug": "remedios",
                "color": "#4F7A5A",
                "order": 7
            }
        ]
        await db.categories.insert_many(categories)
        print("✅ Categories created")
    
    # Create daily energy for today
    today = datetime.utcnow().strftime("%Y-%m-%d")
    daily_exists = await db.daily_energy.find_one({"date": today})
    if not daily_exists:
        daily_energy = {
            "id": str(uuid.uuid4()),
            "date": today,
            "title": "Energía del Día - Armonía y Equilibrio",
            "title_en": "Daily Energy - Harmony and Balance",
            "title_zh": "今日能量 - 和谐与平衡",
            "content": "Hoy el Chi fluye con suavidad, favoreciendo la comunicación y las relaciones armoniosas. Es un día ideal para resolver conflictos y establecer nuevas conexiones.",
            "content_en": "Today the Chi flows smoothly, favoring communication and harmonious relationships. It's an ideal day to resolve conflicts and establish new connections.",
            "content_zh": "今天气流畅通，有利于沟通和和谐关系。这是解决冲突和建立新联系的理想日子。",
            "recommendations": [
                "Viste de blanco o dorado",
                "Medita al amanecer",
                "Bebe té verde",
                "Coloca flores frescas en el este"
            ],
            "avoid": [
                "Discusiones innecesarias",
                "Tomar decisiones financieras importantes",
                "Renovaciones en el hogar"
            ],
            "created_at": datetime.utcnow()
        }
        await db.daily_energy.insert_one(daily_energy)
        print("✅ Daily energy created")
    
    # Create moon energy for current month
    now = datetime.utcnow()
    moon_exists = await db.moon_energy.find_one({"month": now.month, "year": now.year})
    if not moon_exists:
        moon_energy = {
            "id": str(uuid.uuid4()),
            "month": now.month,
            "year": now.year,
            "title": "Luna de la Transformación",
            "title_en": "Moon of Transformation",
            "title_zh": "转型之月",
            "content": "Este mes la energía lunar nos invita a transformar aspectos profundos de nuestra vida. Es tiempo de soltar lo viejo y dar la bienvenida a lo nuevo.",
            "content_en": "This month the lunar energy invites us to transform deep aspects of our life. It's time to let go of the old and welcome the new.",
            "content_zh": "本月月球能量邀请我们改变生活的深层方面。是时候放下旧的，欢迎新的了。",
            "recommendations": [
                "Practica meditación diaria",
                "Limpia tu espacio con salvia",
                "Usa cristales de cuarzo"
            ],
            "activations": [
                "Activación del sector Norte para la carrera",
                "Activación del sector Suroeste para las relaciones"
            ],
            "rituals": [
                "Ritual de luna llena: Escribe tus intenciones en papel dorado",
                "Baño de purificación con sal marina"
            ],
            "remedies": [
                "Coloca un tazón de agua en el Norte",
                "Enciende velas rojas en el Sur"
            ],
            "avoid": [
                "Mudanzas importantes",
                "Iniciar proyectos sin planificación"
            ],
            "is_premium": False,
            "created_at": datetime.utcnow()
        }
        await db.moon_energy.insert_one(moon_energy)
        print("✅ Moon energy created")
    
    # Create custom services
    services_exist = await db.custom_services.count_documents({})
    if services_exist == 0:
        services = [
            {
                "id": str(uuid.uuid4()),
                "title": "Análisis Carta Natal BaZi",
                "title_en": "BaZi Birth Chart Analysis",
                "title_zh": "八字命理分析",
                "description": "Análisis completo de tu carta BaZi para conocer tu destino, talentos y oportunidades.",
                "description_en": "Complete analysis of your BaZi chart to understand your destiny, talents and opportunities.",
                "description_zh": "全面分析您的八字命盘，了解您的命运、才能和机会。",
                "includes": [
                    "Análisis de los 4 pilares",
                    "Ciclos de suerte de 10 años",
                    "Recomendaciones personalizadas",
                    "Informe PDF de 20 páginas"
                ],
                "price": 99.99,
                "original_price": 150.0,
                "is_offer": True,
                "form_fields": [
                    {"name": "birth_date", "type": "date", "label": "Fecha de nacimiento", "required": True},
                    {"name": "birth_time", "type": "time", "label": "Hora de nacimiento", "required": True},
                    {"name": "birth_place", "type": "text", "label": "Lugar de nacimiento", "required": True},
                    {"name": "questions", "type": "textarea", "label": "Preguntas específicas", "required": False}
                ],
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Lectura Qi Men - Palacio de Vida",
                "title_en": "Qi Men - Life Palace Reading",
                "title_zh": "奇门遁甲命宫预测",
                "description": "Consulta estratégica usando Qi Men Dun Jia para analizar tu Palacio de Vida y tomar decisiones importantes.",
                "description_en": "Strategic consultation using Qi Men Dun Jia to analyze your Life Palace and make important decisions.",
                "description_zh": "使用奇门遁甲分析命宫并进行重要决策的战略咨询。",
                "includes": [
                    "Análisis del Palacio de Vida",
                    "Mejor momento para actuar",
                    "Direcciones favorables",
                    "Estrategias recomendadas"
                ],
                "price": 200.0,
                "form_fields": [
                    {"name": "question", "type": "textarea", "label": "Tu pregunta o situación", "required": True},
                    {"name": "birth_date", "type": "date", "label": "Tu fecha de nacimiento", "required": True}
                ],
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Ritual Personalizado",
                "title_en": "Personalized Ritual",
                "title_zh": "个性化仪式",
                "description": "Ritual diseñado específicamente para tus necesidades y objetivos.",
                "description_en": "Ritual designed specifically for your needs and goals.",
                "description_zh": "专门为您的需求和目标设计的仪式。",
                "includes": [
                    "Ritual personalizado",
                    "Lista de materiales necesarios",
                    "Instrucciones detalladas",
                    "Fecha y hora óptimas"
                ],
                "price": 100.0,
                "form_fields": [
                    {"name": "goal", "type": "textarea", "label": "¿Qué deseas lograr?", "required": True},
                    {"name": "birth_date", "type": "date", "label": "Fecha de nacimiento", "required": True}
                ],
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Análisis del Talento del Bebé",
                "title_en": "Baby Talent Analysis",
                "title_zh": "婴儿天赋分析",
                "description": "Descubre los talentos y potencial único de tu bebé a través de su carta BaZi.",
                "description_en": "Discover your baby's unique talents and potential through their BaZi chart.",
                "description_zh": "通过八字命盘发现您宝宝的独特才能和潜力。",
                "includes": [
                    "Análisis BaZi del bebé",
                    "Talentos naturales",
                    "Áreas vocacionales favorables",
                    "Recomendaciones educativas",
                    "Informe PDF"
                ],
                "price": 120.0,
                "form_fields": [
                    {"name": "baby_name", "type": "text", "label": "Nombre del bebé", "required": True},
                    {"name": "birth_date", "type": "date", "label": "Fecha de nacimiento", "required": True},
                    {"name": "birth_time", "type": "time", "label": "Hora de nacimiento", "required": True},
                    {"name": "birth_place", "type": "text", "label": "Lugar de nacimiento", "required": True}
                ],
                "is_active": True
            }
        ]
        await db.custom_services.insert_many(services)
        print("✅ Custom services created")
    
    # Create info pages
    pages_exist = await db.info_pages.count_documents({})
    if pages_exist == 0:
        pages = [
            {
                "id": str(uuid.uuid4()),
                "slug": "about",
                "title": "Sobre Nosotros",
                "title_en": "About Us",
                "title_zh": "关于我们",
                "content": "MetaQi Academy es la plataforma líder en educación de metafísica china. Ofrecemos contenido de alta calidad sobre Qi Men Dun Jia, BaZi, Feng Shui e I Ching.",
                "content_en": "MetaQi Academy is the leading platform for Chinese metaphysics education. We offer high-quality content on Qi Men Dun Jia, BaZi, Feng Shui and I Ching.",
                "content_zh": "MetaQi Academy是中国形而上学教育的领先平台。我们提供关于奇门遁甲、八字、风水和易经的高质量内容。",
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "contact",
                "title": "Contacto",
                "title_en": "Contact",
                "title_zh": "联系我们",
                "content": "Email: hola@metaqi.com\\nWhatsApp: +34 XXX XXX XXX",
                "content_en": "Email: hello@metaqi.com\\nWhatsApp: +34 XXX XXX XXX",
                "content_zh": "电子邮件：hello@metaqi.com\\nWhatsApp：+34 XXX XXX XXX",
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "terms",
                "title": "Términos y Condiciones",
                "title_en": "Terms and Conditions",
                "title_zh": "条款和条件",
                "content": "Términos y condiciones de uso de MetaQi Academy...",
                "content_en": "Terms and conditions of use of MetaQi Academy...",
                "content_zh": "MetaQi Academy使用条款和条件...",
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "privacy",
                "title": "Política de Privacidad",
                "title_en": "Privacy Policy",
                "title_zh": "隐私政策",
                "content": "Política de privacidad de MetaQi Academy...",
                "content_en": "Privacy policy of MetaQi Academy...",
                "content_zh": "MetaQi Academy隐私政策...",
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "faq",
                "title": "Preguntas Frecuentes",
                "title_en": "FAQ",
                "title_zh": "常见问题",
                "content": "**¿Qué es MetaQi Academy?**\\nSomos una plataforma educativa...\\n\\n**¿Cómo funciona la suscripción?**\\nLa suscripción te da acceso...",
                "content_en": "**What is MetaQi Academy?**\\nWe are an educational platform...\\n\\n**How does subscription work?**\\nSubscription gives you access...",
                "content_zh": "**什么是MetaQi Academy？**\\n我们是一个教育平台...\\n\\n**订阅如何运作？**\\n订阅让您可以访问...",
                "updated_at": datetime.utcnow()
            }
        ]
        await db.info_pages.insert_many(pages)
        print("✅ Info pages created")
    
    print("\\n✅ Database seeding completed!")
    print("\\n📝 Admin credentials:")
    print("   Email: nnikholk@gmail.com")
    print("   Password: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
