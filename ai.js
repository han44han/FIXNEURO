import { supabase } from './database.js';

const TEXT_API = "https://fixneuro.onrender.com/check";
const IMAGE_API = "رابط_مودل_الصور_الخاص_بكم"; // استبدليه برابط مودل الصور

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const imageInput = document.getElementById('carImage');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');
    
    // معرفة أي قسم مفتوح الآن (نص أم صورة)
    const isImageMode = document.getElementById('imageInputGroup').style.display !== 'none';

    // 1. التحقق من المدخلات
    if (!isImageMode && !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل!");
        return;
    }
    if (isImageMode && !imageInput.files[0]) {
        alert("يرجى ارفاق صورة أولاً!");
        return;
    }

    // 2. تهيئة الواجهة للتحميل
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل الذكي...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        let aiStatus = "POSITIVE";
        let analysisResultText = "";
        const multiplier = isImageMode ? 1 : (parseFloat(carCategory.value) || 1);

        // 3. الاتصال بالـ API المناسب (نص أو صورة)
        if (isImageMode) {
            const formData = new FormData();
            formData.append('file', imageInput.files[0]);
            const imgRes = await fetch(IMAGE_API, { method: "POST", body: formData });
            const imgData = await imgRes.json();
            analysisResultText = imgData.label; // افترضنا أن المودل يرجع label
            aiStatus = "NEGATIVE"; 
        } else {
            const res = await fetch(TEXT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput.value })
            });
            const data = await res.json();
            aiStatus = data.prediction;
            analysisResultText = textInput.value.toLowerCase();
        }

        // 4. محرك التشخيص المختصر
        let diag = {
            title: "فحص تقني",
            problem: "خلل يحتاج فحص دقيق.",
            solution: "توجه لأقرب مركز صيانة.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff"
        };

        // منطق الكلمات المفتاحية (يعمل مع النص ومع نتيجة الصورة)
        if (analysisResultText.includes("حرارة") || analysisResultText.includes("تهريب")) {
            diag = { title: "منظومة التبريد", problem: "تهريب ماء أو عطل مراوح.", solution: "افحص الرديتر فوراً.", costMin: 400, costMax: 2000, color: "#ff4d4d" };
        } else if (analysisResultText.includes("قير") || analysisResultText.includes("نتعه")) {
            diag = { title: "ناقل الحركة", problem: "مشكلة في التروس أو الزيت.", solution: "افحص القير بالكمبيوتر.", costMin: 600, costMax: 4000, color: "#ff4d4d" };
        } else if (analysisResultText.includes("صدمه") || analysisResultText.includes("حادث")) {
            diag = { title: "سمكرة ودهان", problem: "تضرر الهيكل الخارجي.", solution: "إصلاح الهيكل وتقدير الصدمة.", costMin: 1000, costMax: 5000, color: "#ff4d4d" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // 5. عرض النتيجة النهائية مع زر المابز
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                    <span style="font-size:12px; color:${diag.color}; border:1px solid; padding:2px 8px; border-radius:5px;">AI: ${aiStatus}</span>
                </div>
                <p style="font-size:14px; margin-bottom:5px;"><strong>المشكلة:</strong> ${diag.problem}</p>
                <p style="font-size:14px; margin-bottom:15px;"><strong>الحل:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center; margin-bottom:15px;">
                    <span style="color:#fff; font-weight:bold;">التكلفة: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
                
                <button onclick="window.location.href='map.html'" 
                   style="width: 100%; background: #4db8ff; color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                   📍 ابحث عن أقرب ورشة في الخريطة
                </button>
            </div>`;

    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالمودل.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
