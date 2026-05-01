import { supabase } from './database.js';

// الروابط البرمجية (تأكد من صحتها في السيرفر لديك)
const TEXT_API_URL = "https://fixneuro.onrender.com/check"; 
const IMAGE_API_URL = "https://fixneuro.onrender.com/diagnose-image"; 

// --- 1. دالة التشخيص النصي ---
export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const carCategory = document.getElementById('carCategory');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // تجهيز الواجهة للتحميل
    resText.innerText = "⏳ جاري تحليل النص...";
    resultBox.style.display = 'block';
    resImg.style.display = 'none';

    try {
        const response = await fetch(TEXT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory.value) || 1;

        // محرك تحليل الأعطال (القواعد المنطقية)
        let diag = calculateDiagnosis(userText, aiStatus, multiplier);

        // عرض النتيجة
        resText.innerHTML = `
            <strong style="color:${diag.color}">[${diag.title}]</strong><br>
            <b>المشكلة:</b> ${diag.problem}<br>
            <b>الحل:</b> ${diag.solution}<br>
            <div style="margin-top:10px; background:rgba(255,255,255,0.1); padding:5px; border-radius:5px;">
                التكلفة المتوقعة: ${diag.finalMin} - ${diag.finalMax} ريال
            </div>
        `;

        // حفظ التقرير في Supabase
        saveReportToSupabase(diag);

    } catch (error) {
        resText.innerText = "❌ فشل الاتصال بسيرفر التحليل النصي.";
    }
}

// --- 2. دالة التشخيص بالصور (Mask R-CNN) ---
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput.files[0]) {
        alert("يرجى اختيار صورة العطل أولاً!");
        return;
    }

    resText.innerText = "⏳ جاري فحص الصورة بالذكاء الاصطناعي...";
    resultBox.style.display = 'block';
    resImg.style.display = 'none';

    const formData = new FormData();
    formData.append('carImage', imageInput.files[0]);

    try {
        const response = await fetch(IMAGE_API_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // عرض الصورة المعالجة (التي تحتوي على الـ Mask)
        if (data.img_base64) {
            resImg.src = "data:image/jpeg;base64," + data.img_base64;
            resImg.style.display = 'block';
        }

        resText.innerHTML = `
            <strong style="color:#ffc107">[تحليل بصري]</strong><br>
            <b>التشخيص:</b> ${data.diagnosis || "تم اكتشاف ضرر في الهيكل الخارجي"}<br>
            <b>الإجراء:</b> يرجى مراجعة فني سمكرة لتقدير دقيق.
        `;

    } catch (error) {
        resText.innerText = "❌ فشل تحليل الصورة. تأكد من تشغيل سيرفر Python.";
    }
}

// --- دالة مساعدة لحساب التكاليف والنتائج ---
function calculateDiagnosis(userText, aiStatus, multiplier) {
    let diag = {
        title: "فحص عام",
        problem: "خلل غير محدد بدقة.",
        solution: "افحص السيارة بالكمبيوتر.",
        costMin: 200, costMax: 500,
        color: "#4db8ff"
    };

    if (userText.includes("حرارة")) {
        diag = { title: "منظومة التبريد", problem: "تهريب أو عطل مروحة", solution: "افحص الرديتر", costMin: 400, costMax: 1500, color: "#ff4d4d" };
    } else if (userText.includes("صوت") || userText.includes("طقطقه")) {
        diag = { title: "المحرك/العضلات", problem: "صوت ميكانيكي غير طبيعي", solution: "فحص يدوي للمكينة أو المساعدات", costMin: 1000, costMax: 5000, color: "#ff4d4d" };
    }

    return {
        ...diag,
        finalMin: Math.round(diag.costMin * multiplier),
        finalMax: Math.round(diag.costMax * multiplier)
    };
}

// --- دالة حفظ البيانات في Supabase ---
async function saveReportToSupabase(diag) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await supabase.from('maintenance_reports').insert({
            user_id: session.user.id,
            title: diag.title,
            description: diag.problem,
            cost: diag.finalMax
        });
    }
}
