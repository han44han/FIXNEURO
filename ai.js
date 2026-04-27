import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // 1. تنظيف الشاشة وتعطيل الزر لمنع التكرار
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff; font-size:18px;">⏳ جاري تحليل البيانات وتقدير التكلفة حسب فئة المركبة...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction; // NEGATIVE أو POSITIVE
        const userText = textInput.value.toLowerCase();
        
        // جلب معامل السعر بناءً على فئة السيارة
        const multiplier = parseFloat(carCategory.value) || 1;

        // 2. محرك الأسعار والتشخيص الذكي (الأسعار الأساسية للسيارات الاقتصادية)
        let diag = {
            title: aiStatus === "NEGATIVE" ? "عطل فني جسيم" : "فحص فني عام",
            problem: "بناءً على تحليل AI: تم رصد مؤشرات لعطل يحتاج معاينة فنية.",
            solution: "يفضل التوجه لمركز صيانة لعمل فحص شامل بالكمبيوتر (OBD2).",
            costMin: 150,
            costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        // تخصيص التشخيص والأسعار بناءً على الكلمات المفتاحية
        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = {
                title: "خلل في منظومة التبريد",
                problem: "ارتفاع الحرارة يشير لتهريب سائل أو عطل في المراوح/البلف.",
                solution: "🚨 توقف فوراً! افحص الرديتر وليات الماء. لا تفتح الغطاء وهي ساخنة.",
                costMin: 400, costMax: 2000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = {
                title: "تآكل ميكانيكي داخلي",
                problem: "أصوات الطقطقة تدل على ضعف ضغط الزيت أو تآكل في السبايك.",
                solution: "🚨 فحص طرمبة الزيت فوراً وتغيير الزيت بلزوجة أعلى أو فحص السبايك.",
                costMin: 1500, costMax: 7000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = {
                title: "مشكلة في ناقل الحركة (القير)",
                problem: "النتعة تدل على اتساخ زيت القير أو خلل في الحساسات.",
                solution: "تغيير زيت القير والفلتر بالتدريج أو فحص مخ القير بالكمبيوتر.",
                costMin: 600, costMax: 4000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("مكيف") || userText.includes("فريون") || userText.includes("حر")) {
            diag = {
                title: "نظام التكييف والتهوية",
                problem: "ضعف التبريد نتيجة نقص الفريون أو اتساخ الفلتر.",
                solution: "فحص تهريب المواسير، تنظيف الفلتر، وإعادة تعبئة فريون أصلي.",
                costMin: 200, costMax: 1500,
                color: "#4db8ff", status: "completed"
            };
        }

        // 3. حساب السعر النهائي بناءً على معامل فئة السيارة
        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // 4. عرض النتيجة النهائية بشكل مرتب
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:25px; border-radius:20px; border:2px solid ${diag.color}; margin-top:20px; animation: slideIn 0.5s ease;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h2>
                    <span style="background:${diag.color}; color:#000; padding:4px 12px; border-radius:8px; font-size:12px; font-weight:bold;">AI: ${aiStatus}</span>
                </div>
                <p style="color:#ddd; margin-bottom:10px;"><strong>⚠️ التشخيص:</strong> ${diag.problem}</p>
                <p style="color:white; line-height:1.7; margin-bottom:20px;"><strong>🛠️ الحل المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:${diag.color}; font-weight:bold;">💰 التكلفة التقديرية للفئة المختارة:</span>
                    <span style="color:#fff; font-size:18px; font-weight:bold;">${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ر.س</span>
                </div>
            </div>`;

        // 5. حفظ التقرير في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: `الفئة: ${carCategory.options[carCategory.selectedIndex].text} | ${diag.problem}`,
                status: diag.status,
                cost: finalMax
            });
        }
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
