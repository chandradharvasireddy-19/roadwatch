from fastapi import FastAPI, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
from ai_service import detect
from db import db
from datetime import datetime
import requests
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import polyline
import math
import random

# ✅ LOAD ENV ONCE
load_dotenv()

class RouteRequest(BaseModel):
    start: str
    end: str

app = FastAPI()

# ---------------- HOME ---------------- #
@app.get("/")
def home():
    return {"message": "RoadWatch API running"}

# ---------------- DETECT ---------------- #
@app.post("/detect")
async def detect_pothole(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...)
):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = detect(file_path)
    except Exception as e:
        return {"error": str(e)}

    db.collection("reports").add({
        "type": result.get("types", {}),
        "severity": result.get("severity", "low"),
        "risk_score": result.get("risk_score", 0),
        "status": "pending",
        "location": {"lat": lat, "lng": lng},
        "timestamp": datetime.now().isoformat()
    })

    return result

# ---------------- STATIC ---------------- #
app.mount("/output", StaticFiles(directory="runs/detect/predict"), name="output")

# ---------------- GET REPORTS ---------------- #
@app.get("/reports")
def get_reports():
    docs = db.collection("reports").stream()
    data = []

    for doc in docs:
        item = doc.to_dict()
        item["severity"] = item.get("severity", "unknown")
        item["risk_score"] = item.get("risk_score", 0)
        item["status"] = item.get("status", "pending")
        item["id"] = doc.id
        data.append(item)

    return data

# ---------------- DISTANCE ---------------- #
def distance_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

# ---------------- ROUTES ---------------- #
@app.post("/routes/analyze")
def analyze_routes(data: RouteRequest):

    API_KEY = os.getenv("ORS_API_KEY")

    if not API_KEY:
        return {"error": "Missing ORS API key"}

    # -------- GEOCODE -------- #
    def geocode(place):
        url = "https://api.openrouteservice.org/geocode/search"
        headers = {"Authorization": API_KEY}
        params = {"text": place}

        res = requests.get(url, headers=headers, params=params).json()

        if not res.get("features"):
            raise Exception(f"Could not geocode: {place}")

        coords = res["features"][0]["geometry"]["coordinates"]
        return coords[1], coords[0]

    # -------- PARSE INPUT -------- #
    def parse_location(value):
        try:
            lat, lng = map(float, value.split(","))
            return lat, lng
        except:
            return geocode(value)

    try:
        start_lat, start_lng = parse_location(data.start)
        end_lat, end_lng = parse_location(data.end)
    except Exception as e:
        return {"error": str(e)}

    # -------- ROUTE API -------- #
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [
            [start_lng, start_lat],
            [end_lng, end_lat]
        ],
        "alternative_routes": {
            "target_count": 3
        }
    }

    res = requests.post(url, json=body, headers=headers).json()

    if "routes" not in res:
        return {"error": res}

    routes = res["routes"]

    # -------- FETCH REPORTS -------- #
    docs = db.collection("reports").stream()
    reports = [doc.to_dict() for doc in docs]

    final_routes = []

    for i, r in enumerate(routes):

        geometry = r.get("geometry")

        # ✅ FIX: handle polyline string OR coordinates
        if isinstance(geometry, str):
            decoded = polyline.decode(geometry)
            coords = [(lng, lat) for lat, lng in decoded]
        else:
            coords = geometry.get("coordinates", [])

        if not coords:
            continue

        risk_score = 0
        issues = 0

        for lng, lat in coords[::10]:

            for rep in reports:
                loc = rep.get("location")
                if not loc:
                    continue

                r_lat = loc.get("lat")
                r_lng = loc.get("lng")

                if r_lat is None or r_lng is None:
                    continue

                # ✅ REAL DISTANCE CHECK
                dist = distance_km(lat, lng, r_lat, r_lng)

                if dist < 1.5:   # 🔥 tighter = more accurate
                    severity = rep.get("severity", "low")

                    if severity == "high":
                        risk_score += 10
                    elif severity == "medium":
                        risk_score += 5
                    else:
                        risk_score += 2

                    issues += 1

        final_routes.append({
            "id": i,
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 30 else "medium" if risk_score > 15 else "low",
            "distance": round(r["summary"]["distance"] / 1000, 2),
            "duration": round(r["summary"]["duration"] / 60, 1),
            "issues": issues
        })

    if not final_routes:
        return {"error": "No routes found"}

    best = min(final_routes, key=lambda x: x["risk_score"])

    for r in final_routes:
        r["recommended"] = (r["id"] == best["id"])

    return {"routes": final_routes}
@app.post("/routes/generate-demo")
def generate_demo(data: RouteRequest):

    API_KEY = os.getenv("ORS_API_KEY")

    if not API_KEY:
        return {"error": "Missing ORS API key"}

    # -------- GEOCODE -------- #
    def geocode(place):
        url = "https://api.openrouteservice.org/geocode/search"
        headers = {"Authorization": API_KEY}
        params = {"text": place}

        res = requests.get(url, headers=headers, params=params).json()

        if not res.get("features"):
            raise Exception(f"Could not geocode: {place}")

        coords = res["features"][0]["geometry"]["coordinates"]
        return coords[1], coords[0]

    def parse_location(value):
        try:
            lat, lng = map(float, value.split(","))
            return lat, lng
        except:
            return geocode(value)

    start_lat, start_lng = parse_location(data.start)
    end_lat, end_lng = parse_location(data.end)

    # -------- GET ROUTE -------- #
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [
            [start_lng, start_lat],
            [end_lng, end_lat]
        ]
    }

    res = requests.post(url, json=body, headers=headers).json()

    if "routes" not in res:
        return {"error": res}

    route = res["routes"][0]

    geometry = route.get("geometry")

    # decode route
    if isinstance(geometry, str):
        decoded = polyline.decode(geometry)
        coords = [(lng, lat) for lat, lng in decoded]
    else:
        coords = geometry.get("coordinates", [])

    if not coords:
        return {"error": "No route geometry"}

    # -------- GENERATE FAKE POTHOLES -------- #
    created = []

    for i in range(5):  # 🔥 generate 5 potholes

        lng, lat = random.choice(coords)

        # slight variation (so not exact same point)
        lat += random.uniform(-0.002, 0.002)
        lng += random.uniform(-0.002, 0.002)

        severity = random.choice(["low", "medium", "high"])

        db.collection("reports").add({
            "type": {"pothole": 1},
            "severity": severity,
            "risk_score": 10 if severity == "high" else 5,
            "status": "pending",
            "location": {"lat": lat, "lng": lng},
            "timestamp": datetime.now().isoformat()
        })

        created.append({
            "lat": lat,
            "lng": lng,
            "severity": severity
        })

    return {
        "message": "Demo potholes generated",
        "count": len(created),
        "data": created
    }
