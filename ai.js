import { supabase } from './database.js';

// ملاحظة: موديلات Detectron2 (.pth) تتطلب سيرفر Python (مثل Flask أو FastAPI)
// الرابط أدناه يجب أن يكون رابط السيرفر الذي يستضيف موديل model_final.pth
const IMAGE_ANALYSIS_API = "https://your-python-backend.com/analyze-damage"; 
const TEXT_SENTIMENT_API = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const imageInput = document.getElementById('carImage');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');
    
    const isImageMode = document.getElementById('imageInputGroup').style.display !== 'none';

    if (!isImageMode && !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }
    if (isImageMode && !imageInput.files[0]) {
        alert("يرجى ارفاق صورة العطل المتضرر!");
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري فحص الضرر باستخدام ذكاء FixNeuro...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري التحليل..."; }

    try {
        let predictionLabel = "";
        let aiStatus = "NEUTRAL";
        const multiplier = isImageMode ? 1.5 : (parseFloat(carCategory.value) || 1); // رفعنا المعامل للصورة لأن الموديل دقيق

        if (isImageMode) {
            // إرسال الصورة لسيرفر المعالجة (Detectron2)
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            
            const response = await fetch(IMAGE_ANALYSIS_API, { method: "POST", body: formData });
            const data = await response.json();
            
            // الموديل يدعم 4 فئات (مثلاً: خدش، تقعر، كسر زجاج، حادث كلي)
            predictionLabel = data.highest_damage_type; 
            aiStatus = "NEGATIVE";
        } else {
            // تحليل النص (القديم)
            const response = await fetch(TEXT_SENTIMENT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput.value })
            });
            const data = await response.json();
            aiStatus = data.prediction;
            predictionLabel = textInput.value.toLowerCase();
        }

        // منطق التشخيص بناءً على موديل كشف الأضرار (Mask R-CNN)
        let diag = {
            title: "فحص الهيكل الخارجي",
            problem: "ضرر في جسم المركبة تم اكتشافه آلياً.",
            solution: "يتطلب إصلاح سمكرة وطلاء.",
            costMin: 800, costMax: 2500,
            color: "#ff4d4d"
        };

        // مواءمة النتائج مع فئات الموديل الـ 4
        if (predictionLabel.includes("scratch") || predictionLabel.includes("خدش")) {
            diag = { title: "خدوش سطحية", problem: "تضرر طبقة الطلاء الخارجية.", solution: "تلميع احترافي أو رش جزئي.", costMin: 200, costMax: 600, color: "#4db8ff" };
        } else if (predictionLabel.includes("dent") || predictionLabel.includes("تقعر")) {
            diag = { title: "تعديل صاج (Dents)", problem: "انبعاج في هيكل السيارة.", solution: "شفط الانبعاج على البارد (PDR).", costMin: 500, costMax: 1500, color: "#ffc107" };
        } else if (predictionLabel.includes("major") || predictionLabel.includes("حادث")) {
            diag = { title: "ضرر جسيم", problem: "تضرر أجزاء حيوية من الهيكل.", solution: "استبدال قطع وسمكرة كاملة.", costMin: 3000, costMax: 10000, color: "#ff4d4d" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // عرض النتيجة النهائية مع زر المابز
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                    <span style="font-size:11px; background:${diag.color}; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;">DETECTOR: Mask R-CNN</span>
                </div>
                <p style="font-size:14px; margin-bottom:5px;"><strong>تحليل الذكاء:</strong> ${diag.problem}</p>
                <p style="font-size:14px; margin-bottom:15px;"><strong>الإجراء المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:12px; border-radius:10px; text-align:center; margin-bottom:15px; border: 1px solid rgba(77,184,255,0.2);">
                    <span style="color:#4db8ff; font-size:13px; display:block; margin-bottom:4px;">التكلفة التقديرية للإصلاح</span>
                    <span style="color:#fff; font-weight:bold; font-size:18px;">${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
                <button onclick="window.location.href='map.html'" 
                   style="width: 100%; background: linear-gradient(135deg, #1a6fd4, #4db8ff); color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: inherit;">
                   📍 ابحث عن ورشة صيانة معتمدة
                </button>
            </div>`;

    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ في معالجة الموديل المستضاف.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
