from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import os
from ai_service import detect

app = FastAPI()


@app.get("/")
def home():
    return {"message": "RoadWatch API running"}


@app.post("/detect")
async def detect_pothole(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run AI
    result = detect(file_path)

    # Delete temp file (cleanup)
    if os.path.exists(file_path):
        os.remove(file_path)

    return result  # ✅ return JSON directly


# Serve output images
app.mount("/output", StaticFiles(directory="runs/detect/predict"), name="output")