from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import os
from ai_service import detect
from db import db
from fastapi import Form
from datetime import datetime


app = FastAPI()


@app.get("/")
def home():
    return {"message": "RoadWatch API running"}


@app.post("/detect")
async def detect_pothole(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...)
):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = detect(file_path)

    # ✅ SAVE TO FIREBASE
    db.collection("reports").add({
        **result,
        "location": {"lat": lat, "lng": lng},
        "timestamp": datetime.now().isoformat()
    })

    return result


# Serve output images
app.mount("/output", StaticFiles(directory="runs/detect/predict"), name="output")


@app.post("/detect")
async def detect_pothole(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...)
):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = detect(file_path)

    # ✅ SAVE TO FIREBASE
    db.collection("reports").add({
        **result,
        "location": {"lat": lat, "lng": lng},
        "timestamp": datetime.now().isoformat()
    })

    return result
@app.get("/reports")
def get_reports():
    docs = db.collection("reports").stream()

    data = []
    for doc in docs:
        item = doc.to_dict()
        item["id"] = doc.id
        data.append(item)

    return data