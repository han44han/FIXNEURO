import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff; font-size:18px;">⏳ جاري إرسال البيانات للذكاء الاصطناعي لتحليل العطل...</p></div>`;

    try {
        // --- الربط الفعلي بالسيرفر ---
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        // نتيجة الذكاء الاصطناعي (NEGATIVE تعني ضرر جسيم، POSITIVE تعني ضرر خفيف)
        const aiResult = data.prediction; 
        const userText = textInput.value.toLowerCase();

        // إعدادات افتراضية بناءً على رد الـ AI
        let diag = {
            title: aiResult === "NEGATIVE" ? "عطل تقني جسيم" : "عطل فني بسيط",
            problem: "تم تحليل النص بواسطة AI وتبين وجود خلل يحتاج فحص دقيق.",
            solution: "يرجى التوجه لأقرب مركز فني معتمد لفحص الحساسات.",
            cost: aiResult === "NEGATIVE" ? "1,500 - 5,000" : "150 - 500",
            color: aiResult === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiResult === "NEGATIVE" ? "pending" : "completed"
        };

        // دمج ذكاء الـ AI مع تفاصيل الأعطال في السعودية
        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag.title = "خلل في نظام التبريد";
            diag.problem = "ارتفاع الحرارة يشكل خطراً كبيراً على رأس المحرك.";
            diag.solution = "🚨 فحص الرديتر، بلف الحرارة، وطرمبة الماء. لا تفتح غطاء الرديتر وهو ساخن!";
            diag.cost = "400 - 2,500";
        } else if (userText.includes("طقطقه") || userText.includes("صوت في المكينة")) {
            diag.title = "مشكلة ميكانيكية في المحرك";
            diag.problem = "أصوات الطقطقة قد تعني تآكل السبايك أو نقص شديد في ضغط الزيت.";
            diag.solution = "🚨 فحص طرمبة الزيت فوراً وتجنب تشغيل السيارة لضمان عدم توقف المحرك نهائياً.";
            diag.cost = "2,000 - 8,000";
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag.title = "مشكلة في ناقل الحركة (القير)";
            diag.problem = "النتعة أو التأخير في التعشيق يعني اتساخ الزيت أو عطل في مخ القير.";
            diag.solution = "تغيير زيت القير والفلتر أو فحص حساسات القير بالكمبيوتر.";
            diag.cost = "700 - 4,500";
        } else if (userText.includes("مكيف") || userText.includes("حر")) {
            diag.title = "نظام التكييف";
            diag.problem = "ضعف التبريد غالباً بسبب تهريب فريون أو ضعف الكومبريسور.";
            diag.solution = "تعبئة فريون أصلي وفحص التهريب بالليزر وتنظيف فلتر المكيف.";
            diag.cost = "200 - 1,800";
        } else if (userText.includes("رجة") || userText.includes("تفتفة")) {
            diag.title = "تصفية محرك (رجة)";
            diag.problem = "اختلال الاحتراق بسبب البواجي أو الكويلات أو اتساخ البخاخات.";
            diag.solution = "تغيير البواجي وتنظيف بوابة الهواء (الثروتل) لزيادة كفاءة الوقود.";
            diag.cost = "300 - 1,200";
        }

        // عرض النتيجة النهائية
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="color:${diag.color};">📋 ${diag.title}</h2>
                    <span style="background:${diag.color}; color:#000; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:bold;">تحليل AI: ${aiResult}</span>
                </div>
                <p style="color:#eee; margin-bottom:10px;"><strong>⚠️ التشخيص:</strong> ${diag.problem}</p>
                <p style="color:white; line-height:1.6; margin-bottom:20px;"><strong>🛠️ الحل المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between;">
                    <span style="color:#4db8ff;">💰 التكلفة التقديرية بالسعودية:</span>
                    <span style="color:#fff; font-weight:bold;">${diag.cost} ر.س</span>
                </div>
            </div>`;

        // حفظ التقرير في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const finalCost = parseInt(diag.cost.split('-')[1].replace(',', '').trim());
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: `AI Result: ${aiResult} | ${diag.problem} | الحل: ${diag.solution}`,
                status: diag.status,
                cost: finalCost
            });
        }
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ في الاتصال بالـ AI. تأكدي من أن السيرفر Live.</p>`;
    }
}
