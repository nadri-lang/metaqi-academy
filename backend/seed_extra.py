import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_extra():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding extra content...")
    
    # Create concepts (home intro cards)
    concepts_exist = await db.concepts.count_documents({})
    if concepts_exist == 0:
        concepts = [
            {
                "id": str(uuid.uuid4()),
                "slug": "bazi",
                "title": "¿Qué es BaZi?",
                "title_en": "What is BaZi?",
                "title_zh": "什么是八字？",
                "short_description": "El arte de los 4 Pilares del Destino. Analiza tu carta natal china para revelar tu personalidad, talentos y ciclos de vida.",
                "full_description": "BaZi (八字), literalmente 'Ocho Caracteres', es un sistema milenario de análisis del destino basado en el año, mes, día y hora de nacimiento. Cada pilar contiene información sobre tu personalidad, relaciones, salud, carrera y ciclos de suerte.",
                "icon": "person",
                "color": "#C8A24A",
                "order": 1
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "qi-men",
                "title": "¿Qué es Qi Men Dun Jia?",
                "title_en": "What is Qi Men Dun Jia?",
                "title_zh": "什么是奇门遁甲？",
                "short_description": "El arte estratégico usado por generales chinos. Toma decisiones importantes con la máxima precisión energética.",
                "full_description": "Qi Men Dun Jia (奇门遁甲) es el sistema chino de estrategia y predicción más sofisticado. Utilizado por generales y emperadores, permite conocer el momento óptimo y la dirección favorable para cualquier acción importante.",
                "icon": "compass",
                "color": "#C8A24A",
                "order": 2
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "feng-shui",
                "title": "¿Qué es Feng Shui?",
                "title_en": "What is Feng Shui?",
                "title_zh": "什么是风水？",
                "short_description": "El arte de armonizar los espacios con la energía Chi. Transforma tu hogar y oficina en fuentes de prosperidad.",
                "full_description": "Feng Shui (风水), 'Viento y Agua', es la ciencia milenaria de crear armonía entre las personas y su entorno. Optimiza la circulación del Chi en tu espacio para atraer salud, prosperidad y bienestar.",
                "icon": "home",
                "color": "#4F7A5A",
                "order": 3
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "tongshu",
                "title": "¿Qué es Tongshu?",
                "title_en": "What is Tongshu?",
                "title_zh": "什么是通书？",
                "short_description": "El almanaque chino tradicional. Indica los días auspiciosos para cada actividad: bodas, mudanzas, negocios.",
                "full_description": "Tongshu (通书), 'Libro del Conocimiento', es el almanaque chino ancestral que indica los días propicios y las horas favorables para cada tipo de actividad, desde firmar contratos hasta comenzar un viaje.",
                "icon": "calendar",
                "color": "#C8A24A",
                "order": 4
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "activaciones",
                "title": "¿Qué son las Activaciones?",
                "title_en": "What are Activations?",
                "title_zh": "什么是激活？",
                "short_description": "Técnicas específicas para potenciar áreas de tu vida: amor, dinero, salud, éxito profesional.",
                "full_description": "Las activaciones son técnicas de Feng Shui y Qi Men que potencian sectores energéticos específicos de tu espacio en momentos precisos, para atraer resultados concretos en áreas como amor, riqueza o carrera.",
                "icon": "flash",
                "color": "#C8A24A",
                "order": 5
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "remedios",
                "title": "¿Qué son los Remedios?",
                "title_en": "What are Remedies?",
                "title_zh": "什么是补救？",
                "short_description": "Soluciones energéticas para neutralizar influencias negativas y equilibrar tu entorno.",
                "full_description": "Los remedios son herramientas energéticas (cristales, colores, objetos, plantas) que neutralizan influencias negativas como el Star 5 Yellow o el 2 Black, y restauran el equilibrio armónico.",
                "icon": "shield-checkmark",
                "color": "#4F7A5A",
                "order": 6
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "deghizarile",
                "title": "¿Qué son los Disfraces?",
                "title_en": "What are Disguises?",
                "title_zh": "什么是伪装？",
                "short_description": "Técnicas avanzadas para 'ocultar' o transformar energías desfavorables en tu carta o espacio.",
                "full_description": "Los disfraces (deghizări) son técnicas avanzadas de la metafísica china para transformar energías desfavorables. Se usan cuando no es posible eliminar completamente una influencia negativa.",
                "icon": "color-palette",
                "color": "#C8A24A",
                "order": 7
            },
        ]
        await db.concepts.insert_many(concepts)
        print(f"✅ {len(concepts)} concepts created")
    
    # Create year energy
    now = datetime.utcnow()
    year_exists = await db.year_energy.find_one({"year": now.year})
    if not year_exists:
        year_energy = {
            "id": str(uuid.uuid4()),
            "year": now.year,
            "title": f"Energía del Año {now.year} - Año del Fuego",
            "title_en": f"Year {now.year} Energy - Year of Fire",
            "title_zh": f"{now.year}年能量",
            "content": f"El año {now.year} trae energía transformadora del Fuego. Es tiempo de acción, creatividad y expansión. Las oportunidades favorecen a quienes se atreven a innovar y comunicar sus ideas con pasión. Precaución con impulsividad en decisiones financieras.",
            "content_en": f"The year {now.year} brings transformative Fire energy. It's time for action, creativity and expansion.",
            "content_zh": f"{now.year}年带来火的转化能量。是时候采取行动、发挥创造力和扩展了。",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "created_at": datetime.utcnow()
        }
        await db.year_energy.insert_one(year_energy)
        print("✅ Year energy created")
    
    # Create newborn vocation for today
    today = datetime.utcnow().strftime("%Y-%m-%d")
    vocation_exists = await db.newborn_vocation.find_one({"date": today})
    if not vocation_exists:
        vocation = {
            "id": str(uuid.uuid4()),
            "date": today,
            "title": "Vocación del Bebé Nacido Hoy",
            "title_en": "Vocation of Baby Born Today",
            "title_zh": "今日出生宝宝的天赋",
            "content": "Los bebés nacidos hoy traen una energía especial de comunicación y sensibilidad. Son almas comunicativas con talento natural para conectar con los demás. Tienen intuición desarrollada y capacidad para aprender rápidamente.",
            "content_en": "Babies born today bring special energy of communication and sensitivity.",
            "content_zh": "今天出生的宝宝带来特殊的沟通和感知能量。",
            "talents": [
                "Comunicación excepcional",
                "Sensibilidad artística",
                "Empatía profunda",
                "Facilidad para idiomas"
            ],
            "vocations": [
                "Escritor o periodista",
                "Terapeuta o psicólogo",
                "Diplomático o mediador",
                "Artista o músico"
            ],
            "challenges": [
                "Tendencia a la timidez inicial",
                "Necesita entorno tranquilo",
                "Puede ser hipersensible"
            ],
            "created_at": datetime.utcnow()
        }
        await db.newborn_vocation.insert_one(vocation)
        print("✅ Newborn vocation created")
    
    # Create sample premium agenda - Wedding Agenda 2027
    agenda_exists = await db.premium_agendas.count_documents({})
    if agenda_exists == 0:
        wedding_agenda = {
            "id": str(uuid.uuid4()),
            "title": "Agenda de Bodas 2027",
            "title_en": "Wedding Agenda 2027",
            "title_zh": "2027年婚礼日历",
            "type": "annual",
            "price": 89.0,
            "description": "Guía completa con las mejores fechas para tu boda en 2027. Análisis de cada sábado según Tongshu y compatibilidad de parejas.",
            "description_en": "Complete guide with the best wedding dates for 2027.",
            "description_zh": "2027年最佳婚礼日期完整指南。",
            "materials": [
                "12 meses de análisis detallado",
                "Fechas óptimas por mes",
                "Horas favorables",
                "Direcciones auspiciosas",
                "Colores y elementos recomendados",
                "PDF descargable"
            ],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        result = await db.premium_agendas.insert_one(wedding_agenda)
        agenda_id = wedding_agenda["id"]
        
        # Create sample months for the wedding agenda
        sample_months = [
            {
                "id": str(uuid.uuid4()),
                "agenda_id": agenda_id,
                "month": 1,
                "year": 2027,
                "title": "Enero 2027",
                "content": "Enero es un mes de nuevos comienzos. La energía del año favorece bodas íntimas y elegantes.",
                "events": [
                    {"date": "2027-01-02", "day": "Sábado", "auspicious": True, "notes": "Excelente para bodas de tarde. Colores recomendados: rojo y dorado. Horario óptimo: 15:00-17:00"},
                    {"date": "2027-01-09", "day": "Sábado", "auspicious": True, "notes": "Muy favorable. Ideal para parejas de elementos Agua y Metal. Evitar dirección Sur."},
                    {"date": "2027-01-16", "day": "Sábado", "auspicious": False, "notes": "Día conflictivo con estrella 5 Yellow. Mejor postponer o usar remedios específicos."},
                    {"date": "2027-01-23", "day": "Sábado", "auspicious": True, "notes": "Excelente energía para ceremonias íntimas. Horario ideal: 11:00-13:00"},
                    {"date": "2027-01-30", "day": "Sábado", "auspicious": True, "notes": "Muy auspicioso. Compatible con la mayoría de signos zodiacales chinos."}
                ],
                "order": 1
            },
            {
                "id": str(uuid.uuid4()),
                "agenda_id": agenda_id,
                "month": 2,
                "year": 2027,
                "title": "Febrero 2027",
                "content": "Febrero trae energía romántica, ideal para bodas con toque tradicional.",
                "events": [
                    {"date": "2027-02-06", "day": "Sábado", "auspicious": True, "notes": "Perfecto para bodas grandes. Colores: rosa y rojo."},
                    {"date": "2027-02-13", "day": "Sábado", "auspicious": True, "notes": "Día de San Valentín próximo. Muy romántico y auspicioso."},
                    {"date": "2027-02-20", "day": "Sábado", "auspicious": False, "notes": "Precaución: día de conflicto con Tigre. Consultar carta específica."},
                    {"date": "2027-02-27", "day": "Sábado", "auspicious": True, "notes": "Excelente para bodas al aire libre. Horario: 12:00-14:00"}
                ],
                "order": 2
            },
            {
                "id": str(uuid.uuid4()),
                "agenda_id": agenda_id,
                "month": 3,
                "year": 2027,
                "title": "Marzo 2027",
                "content": "Marzo es un mes muy auspicioso, con la energía del renacer primaveral.",
                "events": [
                    {"date": "2027-03-06", "day": "Sábado", "auspicious": True, "notes": "Muy favorable. Ideal para bodas grandes con muchos invitados."},
                    {"date": "2027-03-13", "day": "Sábado", "auspicious": True, "notes": "Excelente energía Yang. Horario óptimo: 10:00-12:00"},
                    {"date": "2027-03-20", "day": "Sábado", "auspicious": True, "notes": "Equinoccio de primavera. Muy auspicioso para nuevos comienzos."},
                    {"date": "2027-03-27", "day": "Sábado", "auspicious": True, "notes": "Perfecto para todas las combinaciones de pareja."}
                ],
                "order": 3
            }
        ]
        await db.agenda_months.insert_many(sample_months)
        print(f"✅ Wedding agenda with {len(sample_months)} months created")
    
    print("\n✅ Extra seeding completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_extra())
