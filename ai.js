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

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    imageResBox.style.display = 'block';
    imageContent.innerHTML = `<p style="color:#4db8ff; text-align:center;">🔍 جاري فحص الهيكل وتحديد الأضرار...</p>`;

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server Error");

        const data = await response.json();
        
        // --- تعديل: تعريف المتغيرات مرة واحدة فقط لتجنب الخطأ ---
        const detectedIssues = data.prediction || "غير محدد";
        const repairPlan = data.solution || "يرجى فحص السيارة لدى فني مختص.";
        const isSafe = detectedIssues.toLowerCase().includes("clean"); 
        
        let statusColor = isSafe ? "#2ecc71" : "#ff4d4d"; 

        imageContent.innerHTML = `
            <div style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.05); border:2px solid ${statusColor};">
                <h3 style="color:${statusColor};">📍 الأضرار المكتشفة:</h3>
                <p style="font-size:18px; font-weight:bold;">${isSafe ? '✅ السيارة سليمة' : '⚠️ ' + detectedIssues}</p>
                <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                    <p style="color:#4db8ff;"><strong>🛠️ خطة الإصلاح:</strong></p>
                    <p>${repairPlan}</p>
                </div>
                ${!isSafe ? `<button onclick="window.location.href='map.html'" style="width:100%; margin-top:15px; background:#ff4d4d; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold;">البحث عن أقرب ورشة</button>` : ''}
            </div>`;
            
        // عرض معاينة الصورة
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);

    } catch (error) {
        console.error("Error:", error);
        imageContent.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر. تأكدي من تشغيل Render.</p>`;
    }
}
