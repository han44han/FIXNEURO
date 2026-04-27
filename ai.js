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
        // 1. الاتصال بسيرفر الذكاء الاصطناعي
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const userText = textInput.value.toLowerCase();

        // 2. محرك تشخيص الأعطال (تعديل المنطق ليكون دقيقاً)
        let diagnosis = {
            title: "فحص فني عام",
            desc: "الوصف غير كافٍ لتحديد العطل بدقة. يفضل فحص السيارة كمبيوتر للتأكد من الحساسات والأنظمة الإلكترونية.",
            cost: "150 - 250",
            severity: "completed", // أخضر كحالة افتراضية
            color: "#4db8ff"
        };

        // فحص الكلمات المفتاحية لتحديد العطل والحل الصحيح
        if (userText.includes("حرارة") || userText.includes("ترتفع") || userText.includes("رديتر") || userText.includes("غليان")) {
            diagnosis = {
                title: "خلل في منظومة التبريد (حرارة مرتفعة)",
                desc: "🚨 **التشخيص:** احتمال تهريب في الرديتر، تعطل بلف الحرارة، أو تعطل المراوح. **الحل:** يجب التوقف فوراً وفحص مستوى السائل وتغيير القطعة التالفة لتجنب تلف رأس المكينة.",
                cost: "350 - 1,800",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("طقطقه") || userText.includes("صوت في المكينة") || userText.includes("صوت قوي")) {
            diagnosis = {
                title: "تآكل في أجزاء المحرك الداخلية",
                desc: "🚨 **التشخيص:** صوت الطقطقة يشير غالباً لضعف ضغط الزيت أو تآكل في السبايك أو التكايات. **الحل:** فحص طرمبة الزيت فوراً أو عمل توضيب جزئي للمحرك.",
                cost: "1,500 - 6,000",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("نتعه") || userText.includes("قير") || userText.includes("تأخير في التبديل")) {
            diagnosis = {
                title: "مشكلة في ناقل الحركة (الجيبربكس)",
                desc: "🚨 **التشخيص:** نتعة القير قد تكون بسبب اتساخ الفلتر أو نقص الزيت أو خلل في مخ القير (Solenoids). **الحل:** تغيير الزيت والفلتر أو فحص وبرمجة حساسات القير.",
                cost: "600 - 3,500",
                severity: "pending",
                color: "#ff4d4d"
            };
        } else if (userText.includes("فرامل") || userText.includes("فحمات") || userText.includes("صرير")) {
            diagnosis = {
                title: "استهلاك منظومة الكوابح (الفرامل)",
                desc: "✅ **التشخيص:** صوت الصرير يعني انتهاء عمر الفحمات (القماشات). **الحل:** استبدال الفحمات الأمامية/الخلفية مع خرط الهوبات إذا لزم الأمر لضمان السلامة.",
                cost: "250 - 800",
                severity: "completed",
                color: "#4db8ff"
            };
        } else if (userText.includes("مكيف") || userText.includes("حر") || userText.includes("فريون")) {
            diagnosis = {
                title: "ضعف كفاءة نظام التكييف",
                desc: "✅ **التشخيص:** نقص غاز الفريون أو اتساخ فلتر المكيف أو ضعف في الكومبريسور. **الحل:** فحص التهريب وإعادة تعبئة الفريون وتنظيف الفلاتر.",
                cost: "150 - 1,200",
                severity: "completed",
                color: "#4db8ff"
            };
        } else if (userText.includes("رجة") || userText.includes("نفضة") || userText.includes("تفتفة")) {
            diagnosis = {
                title: "اختلال في احتراق المحرك (تفتفة)",
                desc: "✅ **التشخيص:** اتساخ البواجي (شمعات الاحتراق) أو تعطل الكويلات أو اتساخ بوابة الهواء (الثروتل). **الحل:** تصفية ماكينة (تغيير بواجي وفلاتر وتنظيف بخاخات).",
                cost: "300 - 1,100",
                severity: "completed",
                color: "#4db8ff"
            };
        } else if (userText.includes("دخان") || userText.includes("كربون")) {
            diagnosis = {
                title: "مشكلة انبعاثات من المحرك",
                desc: "🚨 **التشخيص:** الدخان الأزرق يعني حرق زيت، والأسود يعني صرفية وقود عالية. **الحل:** فحص جلد البلوف أو الشنابر أو تنظيف البخاخات وحساس الشكمان.",
                cost: "400 - 3,000",
                severity: "pending",
                color: "#ff4d4d"
            };
        }

        // 3. عرض النتيجة النهائية للمستخدم
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:2px solid ${diagnosis.color}; margin-top:20px; animation: slideIn 0.5s ease;">
                <h3 style="color:${diagnosis.color}; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">📋 ${diagnosis.title}</h3>
                <p style="color:white; font-size:16px; line-height:1.7; margin-bottom:20px;">${diagnosis.desc}</p>
                <div style="background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#4db8ff; font-weight:bold;">
