import { supabase } from './database.js';

// --- إعداد الرابط الموحد ---
// ملاحظة: تأكد أن هذا الرابط هو الرابط الفعلي لخدمتك على Render
const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

/**
 * دالة تحليل النصوص
 */
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // تهيئة الواجهة قبل الطلب
    resultDiv.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <p style="color:#4db8ff;">⏳ جاري فحص البيانات... قد يستغرق الطلب الأول دقيقة للاستيقاظ.</p>
        </div>`;
    
    if(btn) { btn.disabled = true; btn.innerText = "جاري الاتصال..."; }

    try {
        // إرسال الطلب مع إعدادات تقلل من مشاكل Preflight
        const response = await fetch(`${API_BASE_URL}/check`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
                // ملاحظة: تجنب إضافة headers مخصصة غير ضرورية لتقليل مشاكل CORS
            },
            body: JSON.stringify({ text: textInput.value })
        });

        if (!response.ok) {
            throw new Error(`خطأ من السيرفر: ${response.status}`);
        }

        const data = await response.json();
        const aiStatus = data.prediction || "NEGATIVE"; 
        const multiplier = parseFloat(carCategory?.value) || 1;

        // منطق التشخيص (Client-side Logic)
        const result = getDiagnosticResult(textInput.value, aiStatus, multiplier);
        
        // عرض النتيجة
        resultDiv.innerHTML = renderResultCard(result);

        // محاولة الحفظ في قاعدة البيانات
        saveToDatabase(result);

    } catch (error) {
        console.error("Fetch Error:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff4d4d; text-align:center; padding:15px; border:1px solid #ff4d4d; border-radius:12px;">
                <p>❌ فشل الاتصال بالسيرفر.</p>
                <small>تأكد من تفعيل CORS في كود Python (Flask) وتشغيل السيرفر.</small>
            </div>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "شخّص المشكلة الآن"; }
    }
}

/**
 * دالة تحليل الصور
 */
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري تحليل الصورة عبر الموديل...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
            // ملاحظة: عند إرسال FormData لا نضع Content-Type يدوياً، المتصفح يفعله تلقائياً
        });

        if (!response.ok) throw new Error("فشل فحص الصورة");

        const data = await response.json();
        imageContent.innerHTML = `
            <h3 style="color:#4db8ff;">نتيجة Detectron2:</h3>
            <p>${data.prediction || data.class || "تم رصد أضرار خارجية"}</p>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => { imageDisplay.src = e.target.result; imageDisplay.style.display = 'block'; };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerHTML = "<p style='color:#ff4d4d;'>❌ حدث خطأ أثناء تحليل الصورة.</p>";
    }
}

// --- دالات مساعدة (Helpers) لتقليل حجم الكود الأساسي ---

function getDiagnosticResult(text, status, multiplier) {
    let diag = { title: "فحص عام", problem: "مشكلة غير محددة بدقة.", solution: "فحص فني شامل.", min: 100, max: 300, color: "#4db8ff" };
    const userText = text.toLowerCase();

    if (userText.includes("حرارة")) {
        diag = { title: "نظام التبريد", problem: "ارتفاع حرارة أو تهريب.", solution: "فحص الرديتر والمراوح.", min: 200, max: 1500, color: "#ff4d4d" };
    } else if (userText.includes("صوت") || userText.includes("طقطقه")) {
        diag = { title: "المحرك", problem: "أصوات ميكانيكية.", solution: "فحص ضغط المحرك والزيت.", min: 500, max: 5000, color: "#ff4d4d" };
    }

    return {
        ...diag,
        min: Math.round(diag.min * multiplier),
        max: Math.round(diag.max * multiplier)
    };
}

function renderResultCard(res) {
    return `
        <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; border-right:5px solid ${res.color}; margin-top:20px;">
            <h3 style="color:${res.color};">${res.title}</h3>
            <p><strong>المشكلة:</strong> ${res.problem}</p>
            <p><strong>الحل:</strong> ${res.solution}</p>
            <p style="margin-top:10px; font-weight:bold;">التكلفة: ${res.min} - ${res.max} ريال</p>
        </div>`;
}

async function saveToDatabase(res) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id, title: res.title, description: res.problem, cost: res.max
            });
        }
    } catch (e) { console.log("DB Save Skipped"); }
}

// تصدير الدوال للـ HTML
window.startAnalysis = startAnalysis;
window.diagnoseImage = diagnoseImage;
