import { supabase } from './database.js';

// --- إعدادات الروابط (تأكد من كتابة رابط Render الخاص بك هنا) ---
const SERVER_URL = "https://fixneuro.onrender.com"; // رابط السيرفر الأساسي

/**
 * 1. دالة تحليل النص (التشخيص المعتمد على الوصف)
 * تتعامل مع مسار /check في السيرفر
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

    // تجهيز واجهة العرض
    resultDiv.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <p style="color:#4db8ff; animation: pulse 1.5s infinite;">⏳ جاري الاتصال بالذكاء الاصطناعي...</p>
            <small style="color:#888;">قد يستغرق التشغيل الأول 30 ثانية</small>
        </div>`;
    
    if(btn) { 
        btn.disabled = true; 
        btn.innerText = "جاري الفحص..."; 
    }

    try {
        // إرسال الطلب إلى السيرفر
        const response = await fetch(`${SERVER_URL}/check`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: textInput.value })
        });

        if (!response.ok) throw new Error('Server Response Error');

        const data = await response.json();
        const aiStatus = data.prediction || "NEGATIVE"; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory?.value) || 1;

        // منطق التشخيص الداخلي بناءً على رد السيرفر وكلمات المستخدم
        let diag = {
            title: "فحص الأنظمة العامة",
            problem: "تحليل أولي يشير إلى وجود خلل يتطلب فحصاً فيزيائياً.",
            solution: "نوصي بفحص السيارة بجهاز الكمبيوتر OBD-II لتحديد كود العطل بدقة.",
            costMin: 150, costMax: 350,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff"
        };

        // تخصيص النتائج بناءً على الكلمات المفتاحية
        if (userText.includes("حرارة") || userText.includes("غليان")) {
            diag = { title: "نظام التبريد", problem: "احتمال وجود تهريب في الرديتر أو عطل في منظم الحرارة (Thermostat).", solution: "لا تقم بفتح غطاء الرديتر وهو ساخن. افحص مستوى سائل التبريد.", costMin: 300, costMax: 1200, color: "#ff4d4d" };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = { title: "ميكانيكا المحرك", problem: "أصوات غير طبيعية قد تدل على تآكل في الأجزاء الداخلية أو نقص تزييت.", solution: "توقف عن القيادة فوراً وافحص مستوى الزيت.", costMin: 1000, costMax: 5000, color: "#ff4d4d" };
        } else if (userText.includes("نتعه") || userText.includes("قير")) {
            diag = { title: "ناقل الحركة (القير)", problem: "مشكلة في تبديلات القير قد تعود لحساسات أو اتساخ الزيت.", solution: "افحص مستوى وحالة زيت القير أولاً.", costMin: 500, costMax: 3500, color: "#ff9800" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // عرض النتيجة في الصفحة
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border-left: 5px solid ${diag.color}; animation: slideUp 0.5s ease-out;">
                <h3 style="color:${diag.color}; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                    <span>🔍</span> ${diag.title}
                </h3>
                <p style="margin-bottom:10px; line-height:1.6;"><strong>المشكلة المحتملة:</strong> ${diag.problem}</p>
                <p style="margin-bottom:15px; line-height:1.6; color:#ccc;"><strong>الإجراء المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(77,184,255,0.1); padding:15px; border-radius:12px; text-align:center; border: 1px dashed #4db8ff;">
                    <span style="font-size:0.9rem; color:#4db8ff; display:block; margin-bottom:5px;">التكلفة التقديرية (شاملة القطع وشغل اليد)</span>
                    <span style="font-size:1.3rem; font-weight:bold; color:#fff;">${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

        // حفظ التقرير في قاعدة البيانات إذا كان المستخدم مسجلاً
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase.from('maintenance_reports').insert({
                    user_id: session.user.id,
                    title: diag.title,
                    description: diag.problem,
                    status: 'completed',
                    cost: finalMax
                });
            }
        } catch (dbErr) { console.log("Database save skipped"); }

    } catch (error) {
        console.error("Fetch Error:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff4d4d; text-align:center; padding:20px; background:rgba(255,77,77,0.05); border-radius:15px; border: 1px solid #ff4d4d;">
                <p>❌ تعذر الاتصال بالسيرفر حالياً.</p>
                <button onclick="location.reload()" style="margin-top:10px; background:none; border:1px solid #ff4d4d; color:#fff; padding:5px 15px; border-radius:8px; cursor:pointer;">إعادة المحاولة</button>
            </div>`;
    } finally {
        if(btn) { 
            btn.disabled = false; 
            btn.innerText = "شخّص المشكلة الآن"; 
        }
    }
}

/**
 * 2. دالة تشخيص الصور (معالجة الأضرار الخارجية)
 * تتعامل مع مسار /predict في السيرفر
 */
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const btn = document.getElementById('mainBtn');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى اختيار صورة للسيارة المتضررة أولاً");
        return;
    }

    imageResBox.style.display = 'block';
    imageContent.innerHTML = `<p style="color:#4db8ff;">⏳ جاري تحليل ملامح الضرر بالذكاء الاصطناعي...</p>`;
    if(btn) btn.disabled = true;

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${SERVER_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        imageContent.innerHTML = `
            <div style="margin-top:10px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📉 نتيجة الفحص البصري:</h3>
                <p style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">${data.prediction || "تم التعرف على الضرر في هيكل السيارة"}</p>
                <p style="margin-top:10px; font-size:0.9rem; color:#888;">النتيجة مبنية على تحليل Detectron2 الأولي.</p>
            </div>`;
        
        // معاينة الصورة المرفوعة
        const reader = new FileReader();
        reader.onload = (e) => { 
            imageDisplay.src = e.target.result; 
            imageDisplay.style.display = 'block'; 
        };
        reader.readAsDataURL(imageInput.files[0]);

    } catch (error) {
        console.error("Image Analysis Error:", error);
        imageContent.innerHTML = `<p style="color:#ff4d4d;">❌ فشل تحليل الصورة. تأكد من أن السيرفر يعمل.</p>`;
    } finally {
        if(btn) btn.disabled = false;
    }
}

// ربط الدوال بالنافذة العالمية ليتمكن الـ HTML من استدعائها
window.startAnalysis = startAnalysis;
window.diagnoseImage = diagnoseImage;
