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

    // 1. تصفير النتيجة القديمة وتعطيل الزر
    resultDiv.innerHTML = ""; 
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل المختصر...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory.value) || 1;

        // 2. محرك التشخيص المختصر
        let diag = {
            title: "فحص تقني",
            problem: "خلل يحتاج فحص كمبيوتر.",
            solution: "توجه لأقرب مركز صيانة.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = {
                title: "منظومة التبريد",
                problem: "احتمال تهريب ماء أو عطل مراوح.",
                solution: "افحص الرديتر فوراً وتجنب القيادة.",
                costMin: 400, costMax: 2000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = {
                title: "ميكانيكا المحرك",
                problem: "خلل داخلي أو نقص في ضغط الزيت.",
                solution: "افحص مستوى الزيت وطرمبة الزيت.",
                costMin: 1500, costMax: 7000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = {
                title: "ناقل الحركة",
                problem: "اتساخ زيت القير أو عطل حساسات.",
                solution: "افحص زيت القير والفلتر بالكمبيوتر.",
                costMin: 600, costMax: 4000,
                color: "#ff4d4d", status: "pending"
            };
        } else if (userText.includes("مكيف") || userText.includes("حر")) {
            diag = {
                title: "نظام التكييف",
                problem: "نقص فريون أو اتساخ الفلتر.",
                solution: "فحص التهريب وتنظيف الفلتر.",
                costMin: 200, costMax: 1500,
                color: "#4db8ff", status: "completed"
            };
        }

        // حساب السعر النهائي
        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // 3. عرض النتيجة النهائية (مختصرة وأنيقة)
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                    <span style="font-size:12px; color:${diag.color}; border:1px solid; padding:2px 8px; border-radius:5px;">AI: ${aiStatus}</span>
                </div>
                <p style="font-size:14px; margin-bottom:5px;"><strong>المشكلة:</strong> ${diag.problem}</p>
                <p style="font-size:14px; margin-bottom:15px;"><strong>الحل:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center;">
                    <span style="color:#fff; font-weight:bold;">التكلفة: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

        // 4. الحفظ في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: diag.problem,
                status: diag.status,
                cost: finalMax
            });
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
