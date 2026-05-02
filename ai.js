import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    resText.innerText = "⏳ جاري تحليل العطل...";
    resultBox.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        
        const data = await response.json();
        
        // معالجة النتيجة لضمان عدم ظهور undefined
        const prediction = data.prediction || data.class || data.label || "غير محدد";
        const isNegative = prediction.toUpperCase() === 'NEGATIVE';

        resText.innerHTML = `
            <div style="padding:15px; border-right:4px solid ${isNegative ? '#ff4d4d' : '#4db8ff'}; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <strong style="color: ${isNegative ? '#ff4d4d' : '#4db8ff'};">حالة العطل:</strong> 
                ${isNegative ? 'تحذير: عطل فوري يحتاج تدخل' : 'فحص دوري / حالة مستقرة'}<br>
                <small style="opacity: 0.8;">النتيجة التقنية: ${prediction}</small>
            </div>
        `;
    } catch (error) {
        console.error("Error:", error);
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى اختيار صورة أولاً");
        return;
    }

    resText.innerHTML = "⏳ جاري فحص الصورة...";
    resultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        // استخراج النتيجة بأكثر من احتمال لتجنب الـ undefined
        const prediction = data.prediction || data.class || data.label || "لم يتم التعرف على العطل";

        if (data.status === 'success' || data.prediction || data.class) {
            resText.innerHTML = `
                <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(77,184,255,0.05);">
                    <h3 style="color:#4db8ff; margin-bottom: 8px;">📍 نتيجة الفحص البصري:</h3>
                    <p style="font-size: 1.1em;">${prediction}</p>
                </div>
            `;
            
            // معاينة الصورة المرفوعة
            const reader = new FileReader();
            reader.onload = (e) => {
                resImg.src = e.target.result;
                resImg.style.display = 'block';
            };
            reader.readAsDataURL(imageInput.files[0]);
            
            // حفظ التقرير في قاعدة البيانات
            saveToDatabase(prediction);
        } else {
            resText.innerText = "❌ فشل السيرفر في تحليل هذه الصورة.";
        }
    } catch (error) {
        console.error("Error:", error);
        resText.innerText = "❌ خطأ في الاتصال بالسيرفر، تأكد من تشغيل Render.";
    }
}

async function saveToDatabase(predictionText) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: `فحص ذكاء اصطناعي`,
                description: String(predictionText)
            });
            console.log("Report saved successfully");
        }
    } catch (e) {
        console.warn("Database save skipped or failed:", e);
    }
}
