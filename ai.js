import { supabase } from './database.js';

// الرابط الخاص بسيرفرك على Render (تأكد من تغييره للرابط الفعلي بعد الرفع)
const API_BASE_URL = "https://aviation-accent-amulet.ngrok-free.dev";

// --- 1. التشخيص النصي (بدون تعديل في المنطق الأصلي) ---
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
        const response = await fetch(`${API_BASE_URL}/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        
        // عرض النتيجة النصية بناءً على رد السيرفر (POSITIVE / NEGATIVE)
        resText.innerHTML = `
            <div style="padding:10px; border-left:4px solid ${data.prediction === 'NEGATIVE' ? '#ff4d4d' : '#4db8ff'}">
                <strong>حالة العطل:</strong> ${data.prediction === 'NEGATIVE' ? 'تحذير: عطل يحتاج فحص فوري' : 'مشكلة بسيطة أو فحص دوري'}<br>
                <small>تم التحليل بواسطة موديل DistilBERT</small>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل النصي.";
    }
}

// --- 2. التشخيص بالصور (يدعم تحديد مكان الصدمة) ---
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput.files[0]) {
        alert("يرجى اختيار صورة الصدمة أولاً");
        return;
    }

    // إظهار واجهة التحميل
    resText.innerHTML = "⏳ جاري فحص هيكل السيارة وتحديد مكان الصدمة...";
    resultBox.style.display = 'block';
    resImg.style.display = 'none';

    const formData = new FormData();
    formData.append('carImage', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/diagnose-image`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        const diag = data.diagnosis;

        // تحديث الواجهة بالبيانات القادمة من OpenCV في السيرفر
        resText.innerHTML = `
            <div style="border: 1px solid ${diag.color}; padding: 15px; border-radius: 10px; background: rgba(255,255,255,0.02);">
                <h3 style="color:${diag.color}; margin-top:0;">📍 مكان الصدمة: ${diag.location}</h3>
                <p><strong>التشخيص:</strong> ${diag.problem}</p>
                <p><strong>الإجراء المقترح:</strong> ${diag.solution}</p>
                <div style="background:${diag.color}; color:#000; padding:10px; border-radius:5px; text-align:center; font-weight:bold;">
                    التكلفة التقديرية: ${diag.costMin} - ${diag.costMax} ريال
                </div>
                <button onclick="window.location.href='map.html'" style="width:100%; margin-top:10px; padding:10px; cursor:pointer;">
                    البحث عن ورش في ${diag.location}
                </button>
            </div>
        `;

        // إظهار الصورة التي اختارها المستخدم كمعاينة
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block';
            resImg.style.maxWidth = '100%';
            resImg.style.borderRadius = '8px';
        };
        reader.readAsDataURL(imageInput.files[0]);

        // حفظ التقرير تلقائياً في Supabase
        saveToDatabase(diag);

    } catch (error) {
        resText.innerText = "❌ فشل تحليل الصورة. تأكد من تشغيل السيرفر.";
    }
}

// دالة مساعدة لحفظ التقارير
async function saveToDatabase(diag) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await supabase.from('maintenance_reports').insert({
            user_id: session.user.id,
            title: `صدمة في ${diag.location}`,
            description: diag.problem,
            cost: diag.costMax
        });
    }
}
