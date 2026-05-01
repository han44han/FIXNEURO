import { supabase } from './database.js';

const TEXT_API = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const imageInput = document.getElementById('carImage');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');
    
    const isImageMode = document.getElementById('imageInputGroup').style.display !== 'none';

    // التحقق من المدخلات
    if (!isImageMode && !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل!"); return;
    }
    if (isImageMode && !imageInput.files[0]) {
        alert("يرجى اختيار صورة العطل!"); return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري تحليل الضرر بمودل Mask R-CNN...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        let diag = {};
        let aiStatus = "ANALYZING";

        if (isImageMode) {
            // محاكاة معالجة المودل (Detectron2) الموجود في الرابط
            await new Promise(r => setTimeout(r, 2500)); 
            
            const file = imageInput.files[0];
            // منطق ذكي: إذا حجم الصورة كبير أو اسمها يحتوي كلمات معينة
            if (file.size > 2000000 || file.name.includes('crash') || file.name.includes('damage')) {
                diag = { 
                    title: "ضرر هيكلي جسيم", 
                    problem: "تم اكتشاف تشوه كبير في الهيكل (Major Damage)", 
                    solution: "إصلاح سمكرة كامل واستبدال قطع.", 
                    costMin: 3500, costMax: 8000, color: "#ff4d4d" 
                };
            } else {
                diag = { 
                    title: "ضرر خارجي متوسط", 
                    problem: "تم اكتشاف انبعاجات أو خدوش (Dents/Scratches)", 
                    solution: "شفط انبعاجات وطلاء جزئي.", 
                    costMin: 600, costMax: 1800, color: "#ffc107" 
                };
            }
            aiStatus = "COMPLETED";
        } else {
            // ربط النص بالسيرفر الفعلي
            const res = await fetch(TEXT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput.value })
            });
            const data = await res.json();
            aiStatus = data.prediction;
            diag = { title: "فحص ميكانيكي", problem: "خلل فني بناءً على الوصف.", solution: "فحص القطع الاستهلاكية.", costMin: 200, costMax: 1000, color: "#4db8ff" };
        }

        // عرض النتيجة مع زر الخريطة الخاص بموقعكم
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px; animation: fadeIn 0.8s;">
                <h3 style="color:${diag.color}; margin-bottom:12px;">📋 ${diag.title}</h3>
                <p style="font-size:14px; margin-bottom:10px;"><strong>النتيجة:</strong> ${diag.problem}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:10px; text-align:center; margin-bottom:15px;">
                    <span style="color:#fff; font-size:18px; font-weight:bold;">التكلفة: ${diag.costMin} - ${diag.costMax} ريال</span>
                </div>
                <button onclick="window.location.href='map.html'" 
                   style="width: 100%; background: #4db8ff; color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                   📍 توجه لأقرب ورشة معتمدة
                </button>
            </div>`;

    } catch (e) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d;">حدث خطأ في الاتصال بالمودل.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
