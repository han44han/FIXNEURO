import { supabase } from './database.js';

// تم تحديث الرابط ليعمل مع سيرفر Render الجديد
const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// --- 1. التشخيص النصي ---
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
        
        resText.innerHTML = `
            <div style="padding:10px; border-left:4px solid ${data.prediction === 'NEGATIVE' ? '#ff4d4d' : '#4db8ff'}">
                <strong>حالة العطل:</strong> ${data.prediction === 'NEGATIVE' ? 'تحذير: عطل يحتاج فحص فوري' : 'مشكلة بسيطة أو فحص دوري'}<br>
                <small>النتيجة: ${data.prediction}</small>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل النصي.";
    }
}

// --- 2. التشخيص بالصور ---
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput.files[0]) {
        alert("يرجى اختيار صورة الصدمة أولاً");
        return;
    }

    resText.innerHTML = "⏳ جاري فحص هيكل السيارة وتحديد مكان الصدمة...";
    resultBox.style.display = 'block';
    resImg.style.display = 'none';

    const formData = new FormData();
    // تغيير المفتاح إلى 'file' ليطابق كود السيرفر في app.py
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            resText.innerHTML = `
                <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(255,255,255,0.02);">
                    <h3 style="color:#4db8ff; margin-top:0;">📍 نتيجة الفحص: تم تحليل الصورة بنجاح</h3>
                    <p><strong>التشخيص:</strong> ${data.prediction}</p>
                    <p><small>عدد المناطق المكتشفة: ${data.boxes ? data.boxes.length : 0}</small></p>
                    <button onclick="window.location.href='map.html'" style="width:100%; margin-top:10px; padding:10px; cursor:pointer; background:#4db8ff; border:none; color:white; border-radius:5px;">
                        البحث عن أقرب ورشة إصلاح
                    </button>
                </div>
            `;

            // إظهار الصورة كمعاينة
            const reader = new FileReader();
            reader.onload = (e) => {
                resImg.src = e.target.result;
                resImg.style.display = 'block';
                resImg.style.maxWidth = '100%';
                resImg.style.borderRadius = '8px';
            };
            reader.readAsDataURL(imageInput.files[0]);

            // حفظ في القاعدة
            saveToDatabase(data);
        } else {
            resText.innerText = "❌ خطأ في السيرفر: " + data.message;
        }

    } catch (error) {
        console.error("Error:", error);
        resText.innerText = "❌ فشل تحليل الصورة. تأكد من أن السيرفر يعمل.";
    }
}

async function saveToDatabase(data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await supabase.from('maintenance_reports').insert({
            user_id: session.user.id,
            title: `تقرير فحص ذكاء اصطناعي`,
            description: data.prediction,
            cost: 0 // يمكن تحديثه لاحقاً
        });
    }
}
}
