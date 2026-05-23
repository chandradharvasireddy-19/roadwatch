from ultralytics import YOLO
import os
from datetime import datetime

# Load trained model
model = YOLO("runs/detect/train-4/weights/best.pt")


def detect(file):
    results = model(file, conf=0.3, iou=0.5, save=True)

    pothole_count = 0
    total_area = 0
    total_conf = 0
    image_size = 0

    types = {
        "pothole": 0,
        "crack": 0,
        "other": 0
    }

    for r in results:
        if r.boxes is None:
            continue

        if hasattr(r, "orig_shape"):
            image_size = r.orig_shape[0] * r.orig_shape[1]

        for box in r.boxes:
            conf = float(box.conf[0])

            if conf < 0.3:
                continue

            cls = int(box.cls[0])

            # Class mapping
            if cls == 0:
                damage_type = "pothole"
            else:
                damage_type = "other"

            x1, y1, x2, y2 = box.xyxy[0]
            area = float((x2 - x1) * (y2 - y1))

            # Ignore tiny detections (noise)
            if area < 500:
                continue

            pothole_count += 1
            total_area += area
            total_conf += conf

            types[damage_type] += 1

    # Average confidence
    avg_conf = total_conf / pothole_count if pothole_count else 0

    # Damage ratio
    damage_ratio = float(total_area) / image_size if image_size else 0

    # Road score
    road_score = max(0, 100 - int(damage_ratio * 120))

    # Severity
    severity = get_severity(pothole_count, damage_ratio)

    # Output image path
    output_dir = "runs/detect/predict"
    image_output = None

    if os.path.exists(output_dir):
        files = os.listdir(output_dir)
        if files:
            latest_file = max(
                [os.path.join(output_dir, f) for f in files],
                key=os.path.getctime
            )
            latest_file = os.path.basename(latest_file)
            image_output = f"http://127.0.0.1:8000/output/{latest_file}"

    return {
        "potholes": pothole_count,
        "types": types,
        "severity": severity,
        "road_score": road_score,
        "risk_score": get_risk_score(pothole_count, damage_ratio),
        "message": get_message(severity),
        "image_output": image_output,
        "color": get_color(severity),
        "damage_ratio": round(damage_ratio, 3),
        "confidence": round(avg_conf, 2),
        "time": datetime.now().isoformat(),
        "summary": f"{pothole_count} potholes detected"
    }


# -------- HELPERS -------- #

def get_severity(count, ratio):
    if count == 0:
        return "none"
    elif ratio > 0.2 or count > 4:
        return "high"
    elif ratio > 0.1 or count > 2:
        return "medium"
    else:
        return "low"


def get_risk_score(count, ratio):
    score = count * 1.5 + (ratio * 10)
    return min(int(score), 10)


def get_message(severity):
    if severity == "high":
        return "Severely damaged road. Avoid this route."
    elif severity == "medium":
        return "Moderate damage detected. Drive carefully."
    elif severity == "low":
        return "Minor damage. Safe to drive."
    else:
        return "Road looks safe."


def get_color(severity):
    if severity == "high":
        return "red"
    elif severity == "medium":
        return "yellow"
    else:
        return "green"