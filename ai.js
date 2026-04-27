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
        // 1. الاتصال بسيرفر الذكاء الاصطناعي للتحليل الأولي
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const userText = textInput.value.toLowerCase();

        // 2. محرك تشخيص الأعطال الموسع (Expert System)
        let diagnosis = {
            title: "فحص عام",
            desc: "لم يتم تحديد العطل بدقة، يرجى مراجعة المختص.",
            cost: "150 - 300",
            severity: "pending",
            color: "#4db8ff"
        };

        // مصفوفة الأعطال الشائعة في السعودية
        if (userText.includes("حرارة") || userText.includes("ترتفع") || userText.includes("رديتر")) {
            diagnosis = {
                title: "خلل في منظومة التبريد",
                desc: "مؤشر خطير قد يؤدي لتلف الرأس (الوجه). الأسباب: تهريب رديتر، تعطل المراوح، أو بلف الحرارة.",
                cost: "400 - 1,500",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت في المكينة")) {
            diagnosis = {
                title: "مشكلة في أجزاء المحرك الداخلية",
                desc: "صوت الطقطقة قد يشير لنقص زيت أو مشكلة في التكايات أو طرمبة الزيت. خطر عالي.",
                cost: "800 - 4,500",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("دخان") || userText.includes("كربون")) {
            diagnosis = {
                title: "مشكلة في احتراق المحرك",
                desc: "الدخان الأزرق (خلط زيت)، الأبيض (تهريب موية)، الأسود (صرفية بنزين). يحتاج فحص بخاخات أو شنابر.",
                cost: "300 - 2,500",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("نتعه") || userText.includes("القير") || userText.includes("تبديل")) {
            diagnosis = {
                title: "خلل في ناقل الحركة (القير)",
                desc: "النتعة غالباً بسبب حساس القير، نقص زيت، أو اتساخ الفلتر. يفضل الفحص بالكمبيوتر فوراً.",
                cost: "500 - 3,000",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("هزة") || userText.includes("رجة") || userText.includes("نفضة")) {
            diagnosis = {
                title: "مشكلة في كراسي المحرك أو البواجي",
                desc: "الرجة أثناء الوقوف تعني غالباً كراسي مكينة تالفة، وأثناء المشي تعني اختلال في احتراق البواجي.",
                cost: "200 - 1,200",
                severity: "completed",
                color: "#4db8ff"
            };
        } else if (userText.includes("فرامل") || userText.includes("فحمات") || userText.includes("صوت صرير")) {
            diagnosis = {
                title: "استهلاك منظومة الفرامل",
                desc: "صوت الصرير يعني انتهاء عمر الفحمات. استمرار المشي عليها يتلف الهوبات.",
                cost: "150 - 600",
                severity: "completed",
                color: "#4db8ff"
            };
        } else if (userText.includes("مكيف") || userText.includes("ما يبرد") || userText.includes("فريون")) {
            diagnosis = {
                title: "ضعف في نظام التكييف",
                desc: "قد يكون نقص فريون، تهريب في المواسير، أو ضعف في الكومبريسور.",
                cost: "200 - 1,800",
                severity: "completed",
                color: "#4db8ff"
            };
        }

        // 3. عرض النتيجة بتنسيق احترافي
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:2px solid ${diagnosis.color}; margin-top:20px;">
                <h3 style="color:${diagnosis.color}; margin-bottom:10px;">📋 ${diagnosis.title}</h3>
                <p style="color:white; font-size:16px; margin-bottom:15px;">${diagnosis.desc}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; font-weight:bold;">
                    <span style="color:#4db8ff;">💰 التكلفة التقريبية بالسوق السعودي: </span>
                    <span style="color:#fff;">${diagnosis.cost} ريال</span>
                </div>
                <p style="font-size:12px; color:#888; margin-top:10px;">* ملاحظة: الأسعار تقديرية تشمل قطع الغيار وأجرة اليد في الورش المتوسطة.</p>
            </div>`;

        // 4. الحفظ في قاعدة البيانات
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diagnosis.title,
                description: userText,
                status: diagnosis.severity,
                cost: parseInt(diagnosis.cost.split('-')[1]) || 500
            });
        }

    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ، يرجى المحاولة لاحقاً.</p>`;
    }
}
