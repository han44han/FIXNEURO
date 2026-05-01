import cv2
import base64
import numpy as np
from flask import Flask, request, jsonify
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = Flask(__name__)

# إعداد الموديل وربط ملف الأوزان
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_101_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 4 
cfg.MODEL.WEIGHTS = "model_final(1).pth" 
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5 
predictor = DefaultPredictor(cfg)

@app.route('/diagnose', methods=['POST'])
def diagnose():
    file = request.files['carImage']
    # تحويل الصورة المرفوعة إلى مصفوفة OpenCV
    img_bytes = np.frombuffer(file.read(), np.uint8)
    im = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    # تشغيل التنبؤ[cite: 15]
    outputs = predictor(im)
    
    # رسم التحديد (Mask) على الصورة
    v = Visualizer(im[:, :, ::-1], scale=1.2)
    out = v.draw_instance_predictions(outputs["instances"].to("cpu"))
    
    # تحويل النتيجة لصيغة Base64 لإرسالها للمتصفح
    _, buffer = cv2.imencode('.jpg', out.get_image()[:, :, ::-1])
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        "img_base64": img_base64,
        "location": "مقدمة المركبة (Frontal)", 
        "diagnosis": "تم اكتشاف ضرر في الهيكل الخارجي"
    })
