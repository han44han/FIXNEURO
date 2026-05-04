import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// 1. دالة تشخيص النص (startAnalysis)
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري تحليل العطل وتقدير التكلفة...</p></div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction || data.class || "غير محدد";
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory?.value) || 1;

        let diag = {
            title: "فحص تقني عام",
            problem: "خلل يحتاج فحص كمبيوتر لتحديده بدقة.",
            solution: "توجه لأقرب مركز صيانة للفحص بجهاز OBD.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff"
        };

        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = { title: "منظومة التبريد", problem: "احتمال تهريب ماء أو عطل في المراوح.", solution: "افحص الرديتر فوراً وتجنب القيادة.", costMin: 400, costMax: 2000, color: "#ff4d4d" };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = { title: "ميكانيكا المحرك", problem: "خلل داخلي أو نقص في ضغط الزيت.", solution: "افحص مستوى الزيت وطرمبة الزيت.", costMin: 1500, costMax: 7000, color: "#ff4d4d" };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = { title: "ناقل الحركة", problem: "اتساخ زيت القير أو عطل في الحساسات.", solution: "افحص زيت القير والفلتر بالكمبيوتر.", costMin: 600, costMax: 4000, color: "#ff4d4d" };
        } else if (userText.includes("مكيف") || userText.includes("حر")) {
            diag = { title: "نظام التكييف", problem: "نقص فريون أو اتساخ الفلتر.", solution: "فحص التهريب وتنظيف الفلتر.", costMin: 200, costMax: 1500, color: "#4db8ff" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:15px; border-radius:15px; border:2px solid ${diag.color};">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                    <span style="font-size:12px; color:${diag.color}; border:1px solid; padding:2px 8px; border-radius:5px;">AI: ${aiStatus}</span>
                </div>
                <p style="font-size:14px; margin-bottom:5px;"><strong>المشكلة:</strong> ${diag.problem}</p>
                <p style="font-size:14px; margin-bottom:15px;"><strong>الحل:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center;">
                    <span style="color:#fff; font-weight:bold;">التكلفة التقديرية: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر.</p>`;
    }
}

// 2. دالة تشخيص الصور (diagnoseImage) فائقة الدقة
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
    imageContent.innerHTML = `<div style="text-align:center; padding:10px;"><p style="color:#4db8ff;">🔍 جاري فحص تفاصيل الهيكل بدقة...</p></div>`;
    imageDisplay.style.display = 'none';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // تحويل النتيجة لنص صغير للبحث فيه
        let prediction = (data.prediction || data.class || "").toLowerCase();
        let finalMessage = "";
        let statusColor = "#2ecc71"; // أخضر (سليم) كحالة افتراضية

        // قائمة الكلمات التي تؤكد وجود ضرر حقيقي
        const realDamageMarkers = ["damage", "dent", "scratch", "broken", "crash", "smash", "خدش", "صدمة", "ضرر"];
        
        // التحقق: هل النتيجة تحتوي على كلمات ضرر حقيقية؟ وهل تخلو من كلمات "السليم"؟
        const isActuallyDamaged = realDamageMarkers.some(marker => prediction.includes(marker)) && 
                                  !prediction.includes("no damage") && 
                                  !prediction.includes("clean");

        if (isActuallyDamaged) {
            finalMessage = `⚠️ رصد الذكاء الاصطناعي ضرراً محتملاً: ${data.prediction || "تلف في الهيكل"}`;
            statusColor = "#ff4d4d"; // أحمر (تنبيه)
        } else {
            finalMessage = "✅ الفحص البصري الدقيق: السيارة تبدو سليمة ولا توجد أضرار خارجية واضحة.";
            statusColor = "#2ecc71"; // أخضر (آمن)
        }

        imageContent.innerHTML = `
            <div style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.05); border:2px solid ${statusColor}; transition: 0.5s;">
                <h3 style="color:${statusColor}; margin-bottom:8px;">📍 التقرير البصري:</h3>
                <p style="font-size:16px; font-weight:bold;">${finalMessage}</p>
                <p style="font-size:12px; color:#aaa; margin-top:8px;">* ملاحظة: النتائج تعتمد على جودة الإضاءة وزاوية التصوير.</p>
            </div>`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);

    } catch (error) {
        imageContent.innerHTML = `<p style="color:#ff4d4d;">❌ حدث خطأ أثناء معالجة الصورة. حاول مرة أخرى.</p>`;
    }
}

// ربط الدوال بالمتصفح لضمان العمل مع التبويبات
window.startAnalysis = startAnalysis;
window.diagnoseImage = diagnoseImage;
