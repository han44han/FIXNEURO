import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// --- 1. التشخيص النصي ---
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultBox = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) return alert("يرجى وصف مشكلة السيارة");

    resultBox.innerHTML = `<p style="color:#4db8ff; text-align:center;">⏳ جاري تحليل وصف العطل...</p>`;
    resultBox.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        
        const data = await response.json();
        const isNeg = data.prediction === 'NEGATIVE';

        resultBox.innerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; border-right:5px solid ${isNeg ? '#ff4d4d' : '#4db8ff'};">
                <h3 style="color:${isNeg ? '#ff4d4d' : '#4db8ff'};">🔍 التقرير الفني:</h3>
                <p><strong>التشخيص:</strong> ${data.diagnosis}</p>
                <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px;">
                    <p style="color:#2ecc71; margin:0;"><strong>💡 الحل المقترح:</strong></p>
                    <p style="margin:5px 0 0 0;">${data.solution}</p>
                </div>
            </div>`;
    } catch (error) {
        resultBox.innerHTML = `<p style="color:#ff4d4d;">❌ فشل الاتصال بالسيرفر.</p>`;
    }
}

// --- 2. التشخيص بالصور ---
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const imageResBox = document.getElementById('image-result-box');

    if (!imageInput.files[0]) return alert("ارفع صورة أولاً");

    imageResBox.style.display = 'block';
    imageContent.innerHTML = `<p style="color:#4db8ff; text-align:center;">🔍 جاري فحص الهيكل...</p>`;

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        const isSafe = data.prediction === "Clean";

        imageContent.innerHTML = `
            <div style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.05); border:2px solid ${isSafe ? '#2ecc71' : '#ff4d4d'};">
                <h3 style="color:${isSafe ? '#2ecc71' : '#ff4d4d'};">📍 الأضرار المكتشفة:</h3>
                <p style="font-size:18px; font-weight:bold;">${isSafe ? '✅ السيارة سليمة' : '⚠️ ' + data.prediction}</p>
                <p style="color:#4db8ff;"><strong>🛠️ خطة الإصلاح:</strong></p>
                <p>${data.solution}</p>
                ${!isSafe ? `<button onclick="window.location.href='map.html'" style="width:100%; margin-top:10px; background:#ff4d4d; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">أقرب ورشة</button>` : ''}
            </div>`;
            
        const reader = new FileReader();
        reader.onload = (e) => { imageDisplay.src = e.target.result; imageDisplay.style.display = 'block'; };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (e) {
        imageContent.innerHTML = `<p style="color:#ff4d4d;">❌ خطأ في فحص الصورة.</p>`;
    }
}
