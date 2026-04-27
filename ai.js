import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff; font-size:18px;">⏳ جاري فحص البيانات ومطابقتها مع قاعدة أعطال FixNeuro...</p></div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiResult = data.prediction; 
        const userText = textInput.value.toLowerCase();

        // 1. محرك التشخيص التفصيلي (الأسعار والحلول حسب الكلمة)
        let diag = null;

        if (userText.includes("حرارة") || userText.includes("ترتفع") || userText.includes("غليان")) {
            diag = {
                title: "خلل في منظومة التبريد",
                problem: "ارتفاع الحرارة يشير لتهريب سائل أو عطل في المراوح/البلف.",
                solution: "🚨 توقف فوراً! افحص الرديتر وليات الماء. لا تفتح الغطاء وهي ساخنة.",
                cost: "350 - 1,800",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = {
                title: "تآكل أو خلل ميكانيكي داخلي",
                problem: "أصوات الطقطقة تدل على ضعف ضغط الزيت أو تآكل في السبايك.",
                solution: "🚨 فحص طرمبة الزيت فوراً وتغيير الزيت بلزوجة أعلى أو فحص السبايك.",
                cost: "1,500 - 7,000",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("قير") || userText.includes("نتعه") || userText.includes("تبديل")) {
            diag = {
                title: "مشكلة في ناقل الحركة (القير)",
                problem: "النتعة تدل على اتساخ زيت القير أو خلل في الحساسات (Solenoids).",
                solution: "تغيير زيت القير والفلتر بالتدريج أو فحص مخ القير بالكمبيوتر.",
                cost: "600 - 3,500",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("مكيف") || userText.includes("فريون") || userText.includes("حر")) {
            diag = {
                title: "نظام التكييف والتهوية",
                problem: "ضعف التبريد نتيجة نقص الفريون أو اتساخ الفلتر.",
                solution: "فحص تهريب المواسير، تنظيف الفلتر، وإعادة تعبئة فريون أصلي.",
                cost: "200 - 1,500",
                color: "#4db8ff",
                status: "completed"
            };
        } else if (userText.includes("رجة") || userText.includes("تفتفة") || userText.includes("نفضة")) {
            diag = {
                title: "تصفية محرك (رجة ونفضة)",
                problem: "رجة المحرك سببها غالباً البواجي أو الكويلات أو كراسي المكينة.",
                solution: "تغيير طقم البواجي وتنظيف الثروتل (بوابة الهواء) وفحص الكويلات.",
                cost: "300 - 1,200",
                color: "#4db8ff",
                status: "completed"
            };
        } else if (userText.includes("فرامل") || userText.includes("فحمات") || userText.includes("صرير")) {
            diag = {
                title: "صيانة نظام الفرامل",
                problem: "صوت الصرير يعني انتهاء عمر الفحمات وتآكل الهوبات.",
                solution: "استبدال الفحمات الأمامية/الخلفية وخرط الهوبات لضمان التوازن.",
                cost: "250 - 950",
                color: "#4db8ff",
                status: "completed"
            };
        }

        // 2. إذا لم يجد كلمة مفتاحية، يستخدم رد الـ AI العام
        if (!diag) {
            diag = {
                title: aiResult === "NEGATIVE" ? "عطل تقني محتمل" : "فحص فني دوري",
                problem: "بناءً على تحليل AI: تم رصد مؤشرات لعطل يحتاج معاينة فنية.",
                solution: "يفضل التوجه لمركز صيانة لعمل فحص شامل بالكمبيوتر (OBD2).",
                cost: aiResult === "NEGATIVE" ? "1,000 - 3,000" : "150 - 400",
                color: aiResult === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
                status: aiResult === "NEGATIVE" ? "pending" : "completed"
            };
        }

        // 3. عرض النتيجة الملونة والمنظمة
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:25px; border-radius:20px; border:2px solid ${diag.color}; margin-top:20px; box-shadow: 0 0 20px ${diag.color}22;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h2>
                    <span style="background:${diag.color}; color:#000; padding:4px 12px; border-radius:8px; font-size:12px; font-weight:bold;">AI STATUS: ${aiResult}</span>
                </div>
                <p style="color:#ddd; margin-bottom:10px;"><strong>⚠️ التشخيص:</strong> ${diag.problem}</p>
                <p style="color:white; line-height:1.7; margin-bottom:20px;"><strong>🛠️ الحل المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:${diag.color}; font-weight:bold;">💰 التكلفة التقديرية (السعودية):</span>
                    <span style="color:#fff; font-size:18px; font-weight:bold;">${diag.cost} ر.س</span>
                </div>
            </div>`;

        // 4. حفظ التقرير في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const finalCost = parseInt(diag.cost.split('-')[1].replace(',', '').trim());
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: `الحل: ${diag.solution} | التشخيص: ${diag.problem}`,
                status: diag.status,
                cost: finalCost
            });
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر.</p>`;
    }
}
