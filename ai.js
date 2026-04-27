import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff; font-size:18px;">⏳ جاري تحليل العطل ومطابقته مع قاعدة البيانات...</p></div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const userText = textInput.value.toLowerCase();

        // قاعدة بيانات الأعطال - الأسعار والتشخيصات (السوق السعودي)
        let diag = {
            title: "فحص فني شامل",
            problem: "العطل غير محدد بدقة من خلال الوصف.",
            solution: "يجب فحص السيارة بجهاز الكمبيوتر (OBD2) لتحديد الحساس المتعطل وتوفير الوقت والمال.",
            cost: "150 - 200",
            color: "#4db8ff",
            status: "completed"
        };

        if (userText.includes("حرارة") || userText.includes("ترتفع") || userText.includes("رديتر") || userText.includes("غليان")) {
            diag = {
                title: "خلل في نظام تبريد المحرك",
                problem: "ارتفاع درجة الحرارة نتيجة نقص سائل التبريد أو تعطل المروحة أو بلف الحرارة.",
                solution: "🚨 توقف فوراً! افحص طرمبة الماء، الرديتر، وبلف الحرارة. استمرار القيادة قد يتلف المكينة.",
                cost: "450 - 2,200",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت في المكينة") || userText.includes("تكتكه")) {
            diag = {
                title: "تآكل أجزاء المحرك (توضيب)",
                problem: "أصوات داخلية ناتجة عن ضعف تزييت أو تآكل السبايك أو التكايات.",
                solution: "🚨 فحص مستوى ولزوجة الزيت فوراً. قد تحتاج لتغيير طرمبة الزيت أو عمل صيانة داخلية للمحرك.",
                cost: "1,200 - 7,000",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("نتعه") || userText.includes("قير") || userText.includes("تبديل")) {
            diag = {
                title: "خلل في ناقل الحركة (القير)",
                problem: "تأخر في التبديلات أو وجود نتشة نتيجة اتساخ الزيت أو عطل في الحساسات.",
                solution: "فحص زيت القير والفلتر. إذا كان الزيت محترقاً يجب تغييره بالتدريج أو فحص مخ القير.",
                cost: "550 - 4,000",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("رجة") || userText.includes("تفتفة") || userText.includes("نفضة")) {
            diag = {
                title: "اختلال احتراق (تصفية ماكينة)",
                problem: "رجة في المحرك ناتجة عن ضعف البواجي، الكويلات، أو اتساخ البخاخات.",
                solution: "تغيير طقم البواجي وفحص الكويلات وتنظيف بوابة الهواء (الثروتل).",
                cost: "350 - 1,400",
                color: "#4db8ff",
                status: "completed"
            };
        } else if (userText.includes("فرامل") || userText.includes("فحمات") || userText.includes("صرير")) {
            diag = {
                title: "صيانة نظام المكابح",
                problem: "تآكل الفحمات (القماشات) أو وجود تعرجات في الهوبات.",
                solution: "استبدال الفحمات الأمامية/الخلفية مع خرط الهوبات لضمان توازن الفرامل.",
                cost: "200 - 900",
                color: "#4db8ff",
                status: "completed"
            };
        } else if (userText.includes("مكيف") || userText.includes("فريون") || userText.includes("ما يبرد")) {
            diag = {
                title: "نظام التكييف والتهوية",
                problem: "ضعف التبريد بسبب نقص الفريون، تهريب، أو تعطل الكومبريسور.",
                solution: "فحص دورة الفريون بجهاز الضغط، تنظيف الفلتر، والتأكد من كلتش الكومبريسور.",
                cost: "250 - 1,800",
                color: "#4db8ff",
                status: "completed"
            };
        }

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:2px solid ${diag.color}; margin-top:20px;">
                <h2 style="color:${diag.color}; margin-bottom:15px;">📋 ${diag.title}</h2>
                <p style="color:#eee; margin-bottom:10px;"><strong>⚠️ المشكلة:</strong> ${diag.problem}</p>
                <p style="color:white; line-height:1.6; margin-bottom:20px;"><strong>🛠️ الحل المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between;">
                    <span style="color:#4db8ff;">💰 التكلفة المتوقعة (ريال):</span>
                    <span style="color:#fff; font-weight:bold;">${diag.cost} ر.س</span>
                </div>
            </div>`;

        // الحفظ في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const saveCost = parseInt(diag.cost.split('-')[1].replace(',', '').trim());
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: `المشكلة: ${diag.problem} | الحل: ${diag.solution}`,
                status: diag.status,
                cost: saveCost
            });
        }
    } catch (e) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال.. تأكدي من تشغيل السيرفر.</p>`;
    }
}
