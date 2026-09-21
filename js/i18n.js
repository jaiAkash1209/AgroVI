/**
 * AgroVI Multilingual Translation Engine (English, Hindi, Tamil)
 */

import { Store } from './state.js';

export const translations = {
  en: {
    overview: "Overview",
    cropVision: "Crop Vision",
    nutrition: "Nutrition",
    irrigation: "Irrigation",
    weatherDesk: "Weather Desk",
    marketHub: "Market Hub",
    products: "Products",
    about: "About Us",
    services: "Services",
    contact: "Contact Us",
    help: "Help",
    loginBtn: "Farmer Login",
    dashboardBtn: "App Dashboard",
    aboutAgroAI: "About AgroVI (AgroAI)",
    greeting: "Good afternoon, Ramesh.",
    heroSub: "Your field is calm. Check irrigation before sunset.",
    scanLeaf: "Scan Leaf",
    checkNutrition: "Check nutrition",
    controlWater: "Control water",
    checkWeather: "Check weather",
    organicCert: "100% Organic Certified",
    delivered24h: "Delivered Within 24 Hours",
    familyFarmed: "Family-Farmed Since 1985",
    zeroWaste: "Zero-Waste Packaging",
    storyTitle: "Our Farming Story",
    storyBody: "Three generations of farming Nashik fields organically. We nourish the soil, harvest naturally, and empower farmers with AI technology.",
    processTitle: "How AgroVI Works",
    step1Title: "1. Soil & IoT Sensing",
    step1Desc: "Collect real-time root-zone moisture, N-P-K nutrient data.",
    step2Title: "2. Edge AI Diagnosis",
    step2Desc: "Instant leaf disease detection with 98% accuracy.",
    step3Title: "3. Automated Fertigation",
    step3Desc: "Precision drip valve actuation based on crop stress.",
    step4Title: "4. Mandi Price Yield",
    step4Desc: "Direct farm-to-market trading at peak commodity rates.",
    ctaTitle: "Transform Your Farm with AgroVI AI Technology",
    ctaBtn: "Launch App Dashboard →",
    footerCopyright: "© 2026 AgroVI Smart Farming & AI Technologies. All rights reserved."
  },
  hi: {
    overview: "अवलोकन",
    cropVision: "फसल दृष्टि",
    nutrition: "पोषण",
    irrigation: "सिंचाई",
    weatherDesk: "मौसम डेस्क",
    marketHub: "मंडी बाज़ार",
    products: "उत्पाद",
    about: "हमारे बारे में",
    services: "सेवाएं",
    contact: "संपर्क करें",
    help: "सहायता",
    loginBtn: "किसान लॉगिन",
    dashboardBtn: "ऐप डैशबोर्ड",
    aboutAgroAI: "एग्रोवी (AgroAI) के बारे में",
    greeting: "शुभ दोपहर, रमेश।",
    heroSub: "आपका खेत शांत है। सूर्यास्त से पहले सिंचाई की जांच करें।",
    scanLeaf: "पत्ता स्कैन करें",
    checkNutrition: "पोषण जांचें",
    controlWater: "पानी नियंत्रित करें",
    checkWeather: "मौसम जांचें",
    organicCert: "100% जैविक प्रमाणित",
    delivered24h: "24 घंटे में डिलीवरी",
    familyFarmed: "1985 से पारिवारिक खेती",
    zeroWaste: "ज़ीरो-वेस्ट पैकेजिंग",
    storyTitle: "हमारी खेती की कहानी",
    storyBody: "तीन पीढ़ियों से नासिक के खेतों में जैविक खेती। हम एआई तकनीक से किसानों को सशक्त बनाते हैं।",
    processTitle: "एग्रोवी कैसे काम करता है",
    step1Title: "1. मिट्टी और आईओटी सेंसिंग",
    step1Desc: "वास्तविक समय में नमी और एन-पी-के डेटा एकत्र करें।",
    step2Title: "2. एज एआई निदान",
    step2Desc: "98% सटीकता के साथ पत्तियों के रोगों की जांच।",
    step3Title: "3. स्वचालित सिंचाई",
    step3Desc: "सटीक ड्रिप ड्रिप वाल्व स्वचालन।",
    step4Title: "4. मंडी भाव उपज",
    step4Desc: "उच्चतम मंडी दरों पर सीधा व्यापार।",
    ctaTitle: "एग्रोवी एआई तकनीक से अपने खेत को बदलें",
    ctaBtn: "ऐप डैशबोर्ड खोलें →",
    footerCopyright: "© 2026 एग्रोवी स्मार्ट फार्मिंग एंड एआई टेक्नोलॉजीज।"
  },
  ta: {
    overview: "மேலோட்டம்",
    cropVision: "பயிர் பார்வை",
    nutrition: "ஊட்டச்சத்து",
    irrigation: "பாசனம்",
    weatherDesk: "வானிலை",
    marketHub: "சந்தை மையம்",
    products: "தயாரிப்புகள்",
    about: "எங்களைப் பற்றி",
    services: "சேவைகள்",
    contact: "தொடர்பு கொள்ள",
    help: "உதவி",
    loginBtn: "விவசாயி உள்நுழைவு",
    dashboardBtn: "செயலி டாஷ்போர்டு",
    aboutAgroAI: "அக்ரோவி (AgroAI) பற்றி",
    greeting: "மதிய வணக்கம், ரமேஷ்.",
    heroSub: "உங்கள் நிலம் அமைதியாக உள்ளது. சூரிய அஸ்தமனத்திற்கு முன் பாசனத்தை சரிபார்க்கவும்.",
    scanLeaf: "இலை ஸ்கேன்",
    checkNutrition: "ஊட்டச்சத்து சரிபார்",
    controlWater: "நீர் கட்டுப்பாடு",
    checkWeather: "வானிலை சரிபார்",
    organicCert: "100% இயற்கை சான்றளிக்கப்பட்டது",
    delivered24h: "24 மணிநேரத்தில் விநியோகம்",
    familyFarmed: "1985 முதல் குடும்ப விவசாயம்",
    zeroWaste: "பூஜ்ய கழிவு பேக்கேஜிங்",
    storyTitle: "எங்கள் விவசாயக் கதை",
    storyBody: "மூன்று தலைமுறைகளாக இயற்கை விவசாயம். AI தொழில்நுட்பம் மூலம் விவசாயிகளை மேம்படுத்துகிறோம்.",
    processTitle: "அக்ரோவி எப்படி செயல்படுகிறது",
    step1Title: "1. மண் மற்றும் IoT உணரி",
    step1Desc: "மண் ஈரம் மற்றும் ஊட்டச்சத்து அளவுகளை அறிதல்.",
    step2Title: "2. எட்ஜ் AI கண்டறிதல்",
    step2Desc: "98% துல்லியத்துடன் இலை நோய் கண்டறிதல்.",
    step3Title: "3. தானியங்கி பாசனம்",
    step3Desc: "துல்லியமான சொட்டு நீர் வால்வு இயக்கம்.",
    step4Title: "4. சந்தை விலை வர்த்தகம்",
    step4Desc: "நேரடி பண்ணை முதல் சந்தை வர்த்தகம்.",
    ctaTitle: "அக்ரோவி AI தொழில்நுட்பத்துடன் உங்கள் பண்ணையை மாற்றவும்",
    ctaBtn: "செயலி டாஷ்போர்டை திறக்கவும் →",
    footerCopyright: "© 2026 அக்ரோவி ஸ்மார்ட் ஃபார்மிங் அண்ட் AI டெக்னாலஜிஸ்."
  }
};

export function setLanguage(lang) {
  if (!translations[lang]) return;
  Store.set('currentLang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
