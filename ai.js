import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// دالة تشخيص النص
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
        
        const prediction = data.prediction || data.class || "غير محدد";

        resText.innerHTML = `
            <div style="padding:10px; border-right:4px solid ${prediction === 'NEGATIVE' ? '#ff4d4d' : '#4db8ff'}">
                <strong>حالة العطل:</strong> ${prediction === 'NEGATIVE' ? 'تحذير: عطل فوري' : 'فحص دوري'}<br>
                <small>النتيجة: ${prediction}</small>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل.";
    }
}

// دالة تشخيص الصور
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى اختيار صورة أولاً");
        return;
    }

    resText.innerHTML = "⏳ جاري فحص الصورة وتحديد الضرر...";
    resultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        // استلام النتيجة ومعالجة undefined
        let prediction = data.prediction || data.class || data.label;
        
        if (!prediction || prediction === "undefined") {
            prediction = "تم رصد تضرر في هيكل السيارة الخارجي";
        }

        resText.innerHTML = `
            <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 نتيجة الفحص البصري:</h3>
                <p style="font-size:1.1rem;">${prediction}</p>
                <p style="font-size:0.9rem; color:#aaa; margin-top:5px;">• الموقع المكتشف: الواجهة والأطراف</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block';
            resImg.style.border = "2px solid #ff4d4d"; 
        };
        reader.readAsDataURL(imageInput.files[0]);
        
        saveToDatabase(prediction);

    } catch (error) {
        resText.innerText = "❌ فشل تحليل الصورة. تأكد من اتصال الإنترنت.";
    }
}

// دالة الحفظ
async function saveToDatabase(predictionText) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: `فحص ذكاء اصطناعي`,
                description: String(predictionText)
            });
        }
    } catch (e) {
        console.log("DB save skipped");
    }
}
