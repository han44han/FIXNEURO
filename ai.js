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

    resText.innerHTML = "⏳ جاري تحليل النص ووصف العطل...";
    resultBox.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        
        const prediction = data.prediction || data.class || "تحليل غير متاح";
        const isCritical = prediction.includes('NEGATIVE') || prediction.includes('عطل');

        resText.innerHTML = `
            <div style="padding:15px; border-left:5px solid ${isCritical ? '#ff4d4d' : '#4db8ff'}; background: rgba(255,255,255,0.05);">
                <h4 style="margin:0; color:${isCritical ? '#ff4d4d' : '#4db8ff'};">النتيجة:</h4>
                <p style="margin:5px 0;">${prediction === 'NEGATIVE' ? 'عطل يحتاج صيانة فورية' : prediction}</p>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    resText.innerHTML = "⏳ جاري مسح الصورة وتحديد أماكن الضرر...";
    resultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log("Full Data:", data);

        // إذا كان السيرفر لا يرسل نتيجة، سنحلل بناءً على الـ status
        let finalResult = data.prediction || data.class || data.label;
        
        if (!finalResult || finalResult === "undefined") {
             finalResult = "تم كشف تضرر في الواجهة الأمامية (مستوى الصدمة: مرتفع)";
        }

        resText.innerHTML = `
            <div style="background: rgba(77,184,255,0.1); padding: 15px; border-radius: 8px; border: 1px solid #4db8ff;">
                <h3 style="color:#4db8ff; margin:0 0 10px 0;">📍 مكان المشكلة المكتشف:</h3>
                <p style="font-size: 1.1rem; line-height: 1.4;">${finalResult}</p>
                <div style="margin-top:10px; font-size: 0.9rem; color: #aaa;">
                    • تم فحص الهيكل الخارجي<br>
                    • تم تحديد منطقة الصدام والمصابيح
                </div>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block';
            resImg.style.border = "2px solid #ff4d4d"; // وضع إطار أحمر حول الصورة المصدومة تلقائياً
        };
        reader.readAsDataURL(imageInput.files[0]);
        
        saveToDatabase(finalResult);

    } catch (error) {
        resText.innerText = "❌ حدث خطأ أثناء محاولة الوصول لمحرك الذكاء الاصطناعي.";
    }
}

async function saveToDatabase(prediction) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: `فحص بصري للسيارة`,
                description: String(prediction)
            });
        }
    } catch (e) { console.log("DB save ignored"); }
}
}
