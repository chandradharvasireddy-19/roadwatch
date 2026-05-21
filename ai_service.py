from ultralytics import YOLO
import os

model = YOLO("yolov8n.pt")

def detect(file):
    results = model(file, save=True)

    pothole_count = 0
    total_area = 0
    image_size = 0

    for r in results:
        if r.boxes is None:
            continue

        # get image size safely
        if hasattr(r, "orig_shape"):
            image_size = r.orig_shape[0] * r.orig_shape[1]

        for box in r.boxes:
            conf = float(box.conf[0])

            if conf < 0.4:
                continue

            cls = int(box.cls[0])
            if cls not in [0, 2, 7]:  # temp filter
                continue

            x1, y1, x2, y2 = box.xyxy[0]
            area = float((x2 - x1) * (y2 - y1))
            pothole_count += 1
            total_area += area

    severity = get_severity(pothole_count, total_area)

    # output image
    output_dir = "runs/detect/predict"
    image_output = None

    if os.path.exists(output_dir):
        files = os.listdir(output_dir)
        if files:
            latest_file = sorted(files)[-1]
            image_output = f"/output/{latest_file}"

    damage_ratio = float(total_area) / image_size if image_size else 0

    return {
        "potholes": pothole_count,
        "severity": severity,
        "risk_score": get_risk_score(pothole_count, total_area),
        "message": get_message(severity),
        "image_output": image_output,
        "color": "green" if severity == "low" else "yellow" if severity == "medium" else "red",
        "damage_ratio": round(damage_ratio, 3)
    }


# -------- HELPERS -------- #

def get_severity(count, area):
    if count == 0:
        return "none"
    elif count <= 2 and area < 50000:
        return "low"
    elif count <= 5:
        return "medium"
    else:
        return "high"

def get_risk_score(count, area):
    score = count * 2 + (area / 50000)
    return min(int(score), 10)

def get_message(severity):
    if severity == "high":
        return "Dangerous road. Immediate repair needed."
    elif severity == "medium":
        return "Moderate damage. Repair recommended."
    elif severity == "low":
        return "Minor damage."
    else:
        return "Road looks safe."