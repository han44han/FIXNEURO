import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# كود تحميل الموديل تلقائياً من جوجل درايف
def download_model():
    model_id = '1SCiXoupm2eDFLqzjUKH2b8KGT0zQwpCx'
    url = f'https://drive.google.com/uc?export=download&id={model_id}'
    output = 'model_final.pth'
    if not os.path.exists(output):
        print("Downloading model from Google Drive...")
        response = requests.get(url, stream=True)
        with open(output, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Download complete.")
    return output

app = Flask(__name__)
CORS(app)

# تحميل الموديل عند تشغيل السيرفر
MODEL_PATH = download_model()

@app.route('/')
def home():
    return "FixNeuro AI Server is Running!"

@app.route('/predict', methods=['POST'])
def predict():
    # هنا كود التوقع الخاص بـ Detectron2
    # سنقوم بضبطه غداً بناءً على رد السيرفر
    return jsonify({"status": "success", "message": "Model is loaded and ready!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
    # بورت 10000 مناسب لـ Render
    app.run(host='0.0.0.0', port=10000)
