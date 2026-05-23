from fastapi import FastAPI, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
from ai_service import detect
from db import db
from datetime import datetime
import requests
from pydantic import BaseModel
import polyline
import os
from dotenv import load_dotenv
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

    # 🔥 SAVE TO FIREBASE (NO CHANGE TO RESULT STRUCTURE)
    db.collection("reports").add({
    "type": result["types"],
    "severity": result["severity"],
    "risk_score": result["risk_score"],
    "status": "pending",   # ✅ ADD THIS HERE
    "location": {"lat": lat, "lng": lng},
    "timestamp": datetime.now().isoformat()
})

    # ✅ IMPORTANT: return SAME result (frontend safe)
    return result

# ---------------- STATIC FILES ---------------- #

app.mount("/output", StaticFiles(directory="runs/detect/predict"), name="output")

# ---------------- GET ALL REPORTS ---------------- #

@app.get("/reports")
def get_reports():
    docs = db.collection("reports").stream()

    data = []
    for doc in docs:
        item = doc.to_dict()

        # safe defaults (won’t break frontend)
        item["severity"] = item.get("severity", "unknown")
        item["risk_score"] = item.get("risk_score", 0)
        item["status"] = item.get("status", "pending")

        item["id"] = doc.id
        data.append(item)

    return data

# ---------------- HIGH RISK ---------------- #

@app.get("/reports/high-risk")
def high_risk():
    docs = db.collection("reports").stream()
    data = [doc.to_dict() for doc in docs]

    return sorted(data, key=lambda x: x.get("risk_score", 0), reverse=True)

# ---------------- FILTER ---------------- #

@app.get("/reports/severity/{level}")
def by_severity(level: str):
    docs = db.collection("reports").stream()

    return [
        doc.to_dict()
        for doc in docs
        if doc.to_dict().get("severity") == level
    ]

# ---------------- STATS ---------------- #

@app.get("/stats")
def stats():
    docs = db.collection("reports").stream()
    data = [doc.to_dict() for doc in docs]

    return {
        "total_reports": len(data),
        "high": len([d for d in data if d.get("severity") == "high"]),
        "medium": len([d for d in data if d.get("severity") == "medium"]),
        "low": len([d for d in data if d.get("severity") == "low"]),
    }

# ---------------- LATEST ---------------- #

@app.get("/reports/latest")
def latest_reports():
    docs = db.collection("reports").stream()
    data = [doc.to_dict() for doc in docs]

    return sorted(data, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]

# ---------------- UPDATE STATUS ---------------- #

@app.put("/update-status/{doc_id}")
def update_status(doc_id: str, status: str):
    db.collection("reports").document(doc_id).update({
        "status": status
    })
    return {"message": "status updated"}
import polyline

@app.post("/routes/analyze")
def analyze_routes(data: RouteRequest):

    start = data.start
    end = data.end
    load_dotenv()
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    
    

    url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": start,
        "destination": end,
        "alternatives": "true",   # ✅ IMPORTANT (multiple routes)
        "key": GOOGLE_API_KEY
    }

    res = requests.get(url, params=params).json()

    if res.get("status") != "OK":
        return {"error": res}

    routes = res["routes"]

    # 🔥 GET ALL REPORTS FROM FIREBASE
    docs = db.collection("reports").stream()
    reports = [doc.to_dict() for doc in docs]

    final_routes = []

    # 🔥 ANALYZE EACH ROUTE
    for i, r in enumerate(routes):

        points = polyline.decode(r["overview_polyline"]["points"])

        risk_score = 0
        reasons = []

        # sample points (performance)
        for p_lat, p_lng in points[::10]:

            for rep in reports:
                r_lat = rep["location"]["lat"]
                r_lng = rep["location"]["lng"]

                # simple proximity check
                if abs(p_lat - r_lat) < 0.01 and abs(p_lng - r_lng) < 0.01:

                    severity = rep.get("severity", "low")

                    if severity == "high":
                        risk_score += 10
                        reasons.append("pothole")
                    elif severity == "medium":
                        risk_score += 5
                    else:
                        risk_score += 2

        final_routes.append({
            "id": i,
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 30 else "medium" if risk_score > 15 else "low",
            "distance": r["legs"][0]["distance"]["text"],
            "duration": r["legs"][0]["duration"]["text"],
            "summary": r.get("summary", ""),
            "reason": f"{len(reasons)} issues detected"
        })

    # 🔥 MARK BEST ROUTE
    best = min(final_routes, key=lambda x: x["risk_score"])

    for r in final_routes:
        r["recommended"] = (r["id"] == best["id"])

    return {
        "routes": final_routes
    }