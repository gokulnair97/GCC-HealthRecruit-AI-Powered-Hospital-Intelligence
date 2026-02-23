from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import io
import csv
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'gcc-healthrecruit-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str

class Hospital(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str = ""
    phone: str = ""
    location: str = ""
    region: str = ""
    country: str = ""
    hr_contact: str = ""
    hr_email: str = ""
    department: str = ""
    website: str = ""
    specialties: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = "ai_generated"

class HospitalCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    location: str = ""
    region: str = ""
    country: str = ""
    hr_contact: str = ""
    hr_email: str = ""
    department: str = ""
    website: str = ""
    specialties: str = ""

class RegionStats(BaseModel):
    region: str
    country: str
    count: int

class RefreshRequest(BaseModel):
    region: str

# --- Auth ---
ADMIN_EMAIL = "gokulnair.manoj@gmail.com"
ADMIN_PASSWORD_HASH = bcrypt.hashpw("admin1236".encode(), bcrypt.gensalt()).decode()

async def ensure_admin_user():
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": ADMIN_PASSWORD_HASH,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    return verify_token(token)

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"email": user["email"], "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    return LoginResponse(token=token, email=user["email"])

# --- GCC Regions ---
GCC_REGIONS = {
    "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah"],
    "UAE": ["Dubai", "Abu Dhabi", "Sharjah"],
    "Qatar": ["Doha"],
    "Kuwait": ["Kuwait City"],
    "Bahrain": ["Manama"],
    "Oman": ["Muscat"]
}

# --- AI Data Collection ---
async def collect_hospital_data(region: str, country: str):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"hospital-collect-{region}-{uuid.uuid4()}",
        system_message="""You are an expert healthcare industry researcher specializing in GCC private hospitals. 
You must return ONLY valid JSON array with no extra text. Each object must have these exact fields:
name, email, phone, location, hr_contact, hr_email, department, website, specialties.
Generate realistic and plausible data for private hospitals in the specified region. Include actual well-known hospitals when possible and supplement with realistic entries. Generate 8-12 hospitals per request."""
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Generate a JSON array of private hospitals with recruitment/HR details in {region}, {country}.

Include real well-known private hospitals in this region where possible, and supplement with realistic entries.
For each hospital provide:
- name: Full hospital name
- email: General or HR email address
- phone: Phone number with country code
- location: Full address or area in {region}
- hr_contact: Name of HR Director/Manager
- hr_email: Direct HR email
- department: HR/Recruitment department name
- website: Hospital website URL
- specialties: Key medical specialties (comma separated)

Return ONLY a JSON array, no markdown, no explanation."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        # Parse the JSON from response
        response_text = response.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        hospitals_data = json.loads(response_text)
        return hospitals_data
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error for {region}: {e}")
        logger.error(f"Response was: {response[:500] if response else 'empty'}")
        return []
    except Exception as e:
        logger.error(f"AI collection error for {region}: {e}")
        return []

# --- Hospital Endpoints ---
@api_router.get("/hospitals")
async def get_hospitals(region: Optional[str] = None, country: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if region and region != "all":
        query["region"] = {"$regex": region, "$options": "i"}
    if country and country != "all":
        query["country"] = {"$regex": country, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"hr_contact": {"$regex": search, "$options": "i"}},
            {"specialties": {"$regex": search, "$options": "i"}}
        ]
    
    hospitals = await db.hospitals.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return {"hospitals": hospitals, "total": len(hospitals)}

@api_router.post("/hospitals", response_model=Hospital)
async def create_hospital(hospital: HospitalCreate):
    hospital_obj = Hospital(**hospital.model_dump())
    doc = hospital_obj.model_dump()
    await db.hospitals.insert_one(doc)
    return hospital_obj

@api_router.delete("/hospitals/{hospital_id}")
async def delete_hospital(hospital_id: str):
    result = await db.hospitals.delete_one({"id": hospital_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return {"message": "Hospital deleted"}

@api_router.post("/hospitals/refresh")
async def refresh_hospital_data(req: RefreshRequest):
    region = req.region
    
    # Find the country for this region
    target_country = None
    target_region = None
    for country, regions in GCC_REGIONS.items():
        for r in regions:
            if r.lower() == region.lower():
                target_country = country
                target_region = r
                break
        if target_country:
            break
    
    if not target_country:
        # Maybe it's "all" - refresh all regions
        if region.lower() == "all":
            total_added = 0
            for country, regions in GCC_REGIONS.items():
                for r in regions:
                    hospitals_data = await collect_hospital_data(r, country)
                    count = await _save_hospitals(hospitals_data, r, country)
                    total_added += count
            await _update_refresh_log("all", "All GCC")
            return {"message": f"Refreshed all regions. Added {total_added} hospitals.", "count": total_added}
        raise HTTPException(status_code=400, detail=f"Unknown region: {region}")
    
    # Collect data via AI
    hospitals_data = await collect_hospital_data(target_region, target_country)
    count = await _save_hospitals(hospitals_data, target_region, target_country)
    await _update_refresh_log(target_region, target_country)
    
    return {"message": f"Refreshed {target_region}. Added {count} new hospitals.", "count": count}

async def _save_hospitals(hospitals_data, region, country):
    count = 0
    for h in hospitals_data:
        # Check if hospital already exists by name and region
        existing = await db.hospitals.find_one(
            {"name": h.get("name", ""), "region": region},
            {"_id": 0}
        )
        if not existing:
            hospital = Hospital(
                name=h.get("name", "Unknown"),
                email=h.get("email", ""),
                phone=h.get("phone", ""),
                location=h.get("location", ""),
                region=region,
                country=country,
                hr_contact=h.get("hr_contact", ""),
                hr_email=h.get("hr_email", ""),
                department=h.get("department", "HR Department"),
                website=h.get("website", ""),
                specialties=h.get("specialties", ""),
                source="ai_generated"
            )
            await db.hospitals.insert_one(hospital.model_dump())
            count += 1
        else:
            # Update existing
            await db.hospitals.update_one(
                {"name": h.get("name", ""), "region": region},
                {"$set": {
                    "email": h.get("email", existing.get("email", "")),
                    "phone": h.get("phone", existing.get("phone", "")),
                    "hr_contact": h.get("hr_contact", existing.get("hr_contact", "")),
                    "hr_email": h.get("hr_email", existing.get("hr_email", "")),
                    "website": h.get("website", existing.get("website", "")),
                    "specialties": h.get("specialties", existing.get("specialties", "")),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    return count

async def _update_refresh_log(region, country):
    await db.refresh_logs.insert_one({
        "id": str(uuid.uuid4()),
        "region": region,
        "country": country,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed"
    })

# --- Stats ---
@api_router.get("/stats")
async def get_stats():
    total = await db.hospitals.count_documents({})
    
    # Aggregate by region
    pipeline = [
        {"$group": {"_id": {"region": "$region", "country": "$country"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    region_stats = []
    async for doc in db.hospitals.aggregate(pipeline):
        region_stats.append({
            "region": doc["_id"]["region"],
            "country": doc["_id"]["country"],
            "count": doc["count"]
        })
    
    # Country stats
    country_pipeline = [
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    country_stats = []
    async for doc in db.hospitals.aggregate(country_pipeline):
        country_stats.append({
            "country": doc["_id"],
            "count": doc["count"]
        })
    
    # Last refresh
    last_refresh = await db.refresh_logs.find_one(
        {}, {"_id": 0}, sort=[("refreshed_at", -1)]
    )
    
    return {
        "total_hospitals": total,
        "region_stats": region_stats,
        "country_stats": country_stats,
        "last_refresh": last_refresh
    }

@api_router.get("/regions")
async def get_regions():
    return {"regions": GCC_REGIONS}

# --- Export ---
@api_router.get("/hospitals/export/csv")
async def export_hospitals_csv(region: Optional[str] = None, country: Optional[str] = None):
    query = {}
    if region and region != "all":
        query["region"] = {"$regex": region, "$options": "i"}
    if country and country != "all":
        query["country"] = {"$regex": country, "$options": "i"}
    
    hospitals = await db.hospitals.find(query, {"_id": 0}).sort("name", 1).to_list(5000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Location", "Region", "Country", "HR Contact", "HR Email", "Department", "Website", "Specialties"])
    
    for h in hospitals:
        writer.writerow([
            h.get("name", ""), h.get("email", ""), h.get("phone", ""),
            h.get("location", ""), h.get("region", ""), h.get("country", ""),
            h.get("hr_contact", ""), h.get("hr_email", ""), h.get("department", ""),
            h.get("website", ""), h.get("specialties", "")
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gcc_hospitals.csv"}
    )

# --- Hourly Auto-Refresh Scheduler ---
auto_refresh_task = None
scheduler_status = {"running": False, "last_run": None, "next_run": None, "interval_seconds": 3600}

async def hourly_refresh_loop():
    """Background task that refreshes all GCC regions every hour."""
    global scheduler_status
    scheduler_status["running"] = True
    logger.info("Hourly auto-refresh scheduler started (every 1 hour)")
    
    while True:
        try:
            scheduler_status["last_run"] = datetime.now(timezone.utc).isoformat()
            scheduler_status["next_run"] = (
                datetime.now(timezone.utc).replace(microsecond=0)
            ).isoformat()
            
            logger.info("Auto-refresh: Starting hourly GCC hospital data refresh...")
            total_added = 0
            for country, regions in GCC_REGIONS.items():
                for region in regions:
                    try:
                        hospitals_data = await collect_hospital_data(region, country)
                        count = await _save_hospitals(hospitals_data, region, country)
                        total_added += count
                        logger.info(f"Auto-refresh: {region} ({country}) - {count} new hospitals")
                    except Exception as e:
                        logger.error(f"Auto-refresh error for {region}: {e}")
            
            await _update_refresh_log("all", "Auto-Refresh (Hourly)")
            logger.info(f"Auto-refresh complete. Added {total_added} new hospitals total.")
            scheduler_status["last_run"] = datetime.now(timezone.utc).isoformat()
            
            # Calculate next run
            next_run = datetime.now(timezone.utc).timestamp() + 3600
            scheduler_status["next_run"] = datetime.fromtimestamp(next_run, tz=timezone.utc).isoformat()
            
        except Exception as e:
            logger.error(f"Auto-refresh loop error: {e}")
        
        # Wait 1 hour
        await asyncio.sleep(3600)

@api_router.get("/scheduler/status")
async def get_scheduler_status():
    return {
        "running": scheduler_status["running"],
        "interval": "Every 1 hour",
        "interval_seconds": scheduler_status["interval_seconds"],
        "last_run": scheduler_status["last_run"],
        "next_run": scheduler_status["next_run"],
    }

# --- Refresh Logs ---
@api_router.get("/refresh-logs")
async def get_refresh_logs():
    logs = await db.refresh_logs.find({}, {"_id": 0}).sort("refreshed_at", -1).to_list(50)
    return {"logs": logs}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await ensure_admin_user()
    logger.info("GCC HealthRecruit AI Backend started (auto-refresh disabled)")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
