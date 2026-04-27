import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // 1. مسح أي نتيجة قديمة وتعطيل الزر
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff; font-size:18px;">⏳ جاري تحليل العطل ومطابقته مع السوق السعودي...</p></div>`;
    btn.disabled = true;
    btn.innerText = "جاري الفحص...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction; // NEGATIVE or POSITIVE
        const userText = textInput.value.toLowerCase();

        // 2. قاعدة بيانات الأعطال والأسعار (السوق السعودي)
        let diag = {
            title: aiStatus === "NEGATIVE" ? "عطل فني جسيم" : "فحص فني عام",
            problem: "بناءً على التحليل، السيارة تعاني من خلل يحتاج فحصاً دقيقاً.",
            solution: "يفضل زيارة أقرب مركز صيانة للفحص بجهاز الكمبيوتر OBD2.",
            cost: aiStatus === "NEGATIVE" ? "1,200 - 3,500" : "200 - 500",
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        // فحص الكلمات المفتاحية لتغيير السعر والوصف
        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = {
                title: "عطل في منظومة التبريد",
                problem: "ارتفاع الحرارة يشير لتهريب ماء أو عطل في المراوح/البلف.",
                solution: "🚨 توقف فوراً! افحص الرديتر وليات الماء ولا تفتح الغطاء وهي ساخنة.",
                cost: "450 - 2,500",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("صوت") || userText.includes("طقطقه") || userText.includes("مكينة")) {
            diag = {
                title: "خلل ميكانيكي بالمحرك",
                problem: "أصوات الطقطقة تدل على ضعف الزيت أو تآكل السبايك الداخلية.",
                solution: "فحص طرمبة الزيت ولزوجة الزيت فوراً وتجنب القيادة لمسافات طويلة.",
                cost: "1,500 - 8,000",
                color: "#ff4d4d",
                status: "pending"
            };
        } else if (userText.includes("مكيف") || userText.includes("حر")) {
            diag = {
                title: "ضعف في نظام التكييف",
                problem: "التبريد ضعيف بسبب نقص الفريون أو اتساخ الفلتر أو عطل الكومبريسور.",
                solution: "تعبئة فريون أصلي وفحص التهريب بالليزر وتنظيف فلتر المكيف.",
                cost: "200 - 1,800",
                color: "#4db8ff",
                status: "completed"
            };
        } else if (userText.includes("نتعه") || userText.includes("قير")) {
            diag = {
                title: "مشكلة في ناقل الحركة (القير)",
                problem: "تأخر في التبديلات أو نتعة نتيجة اتساخ الزيت أو عطل حساسات القير.",
                solution: "تغيير زيت وفلتر القير بالتدريج وفحص الحساسات بالكمبيوتر.",
                cost: "600 - 4,500",
                color: "#ff4d4d",
                status: "pending"
            };
        }

        // 3. عرض النتيجة (بعد مسح القديمة)
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="color:${diag.color};">📋 ${diag.title}</h2>
                    <span style="background:${diag.color}; color:#000; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:bold;">AI: ${aiStatus}</span>
                </div>
                <p style="color:#ddd; margin-bottom:10px;"><strong>⚠️ التشخيص:</strong> ${diag.problem}</p>
                <p style="color:white; line-height:1.7; margin-bottom:20px;"><strong>🛠️ الحل المقترح:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:${diag.color};">💰 التكلفة التقديرية:</span>
                    <span style="color:#fff; font-weight:bold;">${diag.cost} ريال</span>
                </div>
            </div>`;

        // 4. الحفظ في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const saveCost = parseInt(diag.cost.split('-')[1].replace(',', '').trim());
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: diag.problem,
                status: diag.status,
                cost: saveCost
            });
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر.</p>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "🔍 شخّص المشكلة الآن";
    }
}
