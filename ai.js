import { supabase } from './database.js';

export async function startAnalysis() {
    const imageInput = document.getElementById('carImage');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    
    if (!imageInput.files[0]) {
        alert("يرجى اختيار صورة أولاً!"); return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري تحليل الصورة بواسطة Mask R-CNN...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري التحليل..."; }

    // تجهيز الصورة للإرسال
    const formData = new FormData();
    formData.append('carImage', imageInput.files[0]);

    try {
        // إرسال الصورة إلى سيرفر البايثون (الذي قمت بتجهيزه)
        const response = await fetch('https://fixneuro.onrender.com/diagnose-image', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        // بناء النتيجة بناءً على رد الذكاء الاصطناعي
        let diag = data.diagnosis; // السيرفر يرسل (Front, Side, Rear)

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:${diag.color}; margin:0; font-size:16px;">🔍 نتيجة تحليل الذكاء الاصطناعي</h3>
                    <span style="background:${diag.color}; color:#000; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold;">📍 ${diag.location}</span>
                </div>
                <p style="font-size:14px; color:#eee;"><strong>التشخيص:</strong> تم اكتشاف ${diag.problem} بدقة عالية.</p>
                <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:12px; text-align:center; margin:15px 0;">
                    <span style="color:#fff; font-size:18px; font-weight:bold;">التكلفة التقديرية: ${diag.costMin} - ${diag.costMax} ريال</span>
                </div>
                <button onclick="window.location.href='map.html'" style="width:100%; background:${diag.color}; color:#000; border:none; padding:12px; border-radius:10px; font-weight:bold; cursor:pointer;">
                    📍 عرض الورش المتخصصة في ${diag.location}
                </button>
            </div>`;

    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ أثناء الاتصال بسيرفر الذكاء الاصطناعي.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
