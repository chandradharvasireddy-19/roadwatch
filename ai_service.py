from ultralytics import YOLO

model = YOLO("yolov8n.pt")

def detect(image_path):
    results = model(image_path)

    boxes = results[0].boxes
    count = len(boxes) if boxes is not None else 0

    if count == 0:
        severity = "low"
    elif count < 3:
        severity = "medium"
    else:
        severity = "high"

    return {
        "count": count,
        "severity": severity
    }