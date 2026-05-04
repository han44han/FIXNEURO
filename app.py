import os
import requests
import io
import torch
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS

# استيراد أدوات Detectron2
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = Flask(__name__)
CORS(app)

# --- كود تحميل الموديل ---
def download_model():
    model_id = '1SCiXoupm2eDFLqzjUKH2b8KGT0zQwpCx'
    url = f'https://drive.google.com/uc?export=download&id={model_id}'
    output = 'model_final.pth'
    if not os.path.exists(output):
        print("Downloading model...")
        response = requests.get(url, stream=True)
        with open(output, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    return output

MODEL_PATH = download_model()

# --- إعداد الموديل (Detectron2 Configuration) ---
cfg = get_cfg()
# اختر المعمارية التي تدربت عليها (مثلاً COCO-InstanceSegmentation)
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5  # ضع هنا عدد الفئات التي دربت الموديل عليها في Kaggle
cfg.MODEL.WEIGHTS = MODEL_PATH
cfg.MODEL.DEVICE = "cpu" # استخدم cpu إذا كنت سترفعه على Render (المجاني لا يدعم GPU)
predictor = DefaultPredictor(cfg)

# أسماء الفئات كما هي في Kaggle (رتبها بنفس ترتيب التدريب)
class_names = ["Scratch", "Dent", "Broken Glass", "Severe Damage", "Clean"] 

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # تحويل الصورة إلى تنسيق يفهمه OpenCV
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # إجراء التوقع
    outputs = predictor(img)
    
    # الحصول على أعلى نتيجة (أول كلاس مكتشف)
    classes = outputs["instances"].pred_classes.tolist()
    
    if len(classes) > 0:
        result_index = classes[0]
        prediction_text = class_names[result_index]
    else:
        prediction_text = "Clean" # إذا لم يجد ضرر

    return jsonify({
        "status": "success",
        "prediction": prediction_text
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
