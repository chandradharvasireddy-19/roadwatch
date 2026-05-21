from fastapi import FastAPI, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
from ai_service import detect
from db import db
from datetime import datetime

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
        **result,
        "location": {"lat": lat, "lng": lng},
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        "priority": "high" if result.get("risk_score", 0) > 7 else "normal"
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