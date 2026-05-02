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
        
        resText.innerHTML = `
            <div style="padding:10px; border-right:4px solid ${data.prediction === 'NEGATIVE' ? '#ff4d4d' : '#4db8ff'}">
                <strong>حالة العطل:</strong> ${data.prediction === 'NEGATIVE' ? 'تحذير: عطل فوري' : 'فحص دوري'}<br>
                <small>النتيجة: ${data.prediction}</small>
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

        if (data.status === 'success' || data.prediction) {
            resText.innerHTML = `
                <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px;">
                    <h3 style="color:#4db8ff;">📍 نتيجة الفحص:</h3>
                    <p>${data.prediction}</p>
                </div>
            `;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                resImg.src = e.target.result;
                resImg.style.display = 'block';
            };
            reader.readAsDataURL(imageInput.files[0]);
            
            saveToDatabase(data);
        } else {
            resText.innerText = "❌ فشل في تحليل الصورة.";
        }
    } catch (error) {
        resText.innerText = "❌ خطأ في الاتصال بالسيرفر.";
    }
}

async function saveToDatabase(data) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: `فحص ذكاء اصطناعي`,
                description: data.prediction
            });
        }
    } catch (e) {
        console.log("Database save skipped");
    }
}
