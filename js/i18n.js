/**
 * AgroVI Comprehensive Multilingual Engine
 * Supports English, Hindi, Tamil, Marathi, Telugu, Kannada, Punjabi, and Gujarati.
 * Automatically persists language selection across page navigation using localStorage.
 */

import { Store } from './state.js';

export const translations = {
  en: {
    // Navigation & Global
    overview: "Overview",
    cropVision: "Crop Vision AI",
    nutrition: "Plant Nutrition",
    irrigation: "Smart Irrigation",
    weatherDesk: "Weather Desk",
    marketHub: "Market Mandi Hub",
    products: "Products",
    about: "About Us",
    services: "Services",
    process: "How It Works",
    contact: "Contact Us",
    help: "Help",
    loginBtn: "Login",
    signUpBtn: "Sign Up",
    dashboardBtn: "App Dashboard",
    backToHome: "← Back to Home",
    voiceAgent: "Voice Agent",
    exitBtn: "Logout",
    myProfile: "My Profile",
    farmSettings: "Farm & Plot Settings",
    languageSettings: "Preferences",
    helpSupport: "Help & Agri Helpline",
    aboutAgroAI: "About AgroVI",
    fieldNavigation: "FIELD NAVIGATION",
    systemLive: "System Live",
    companyProfile: "COMPANY PROFILE",
    solutionsTitle: "SOLUTIONS & SERVICES",
    endToEndEcosystem: "End-to-End Agri-Tech Ecosystem",
    automationWorkflow: "AUTOMATED WORKFLOW",
    getInTouch: "GET IN TOUCH",

    // Dashboard Overview
    fieldSummaryTitle: "Field Summary & Command Center",
    heroSub: "Your field is calm. Check irrigation before sunset.",
    soilHealthIndex: "Soil Health Index",
    optimalMoistureStatus: "Optimal Moisture & pH",
    rootZoneMoisture: "Root Zone Moisture",
    solarRadiation: "Solar Radiation",
    highET0: "High Evapotranspiration",
    ndviVegetation: "NDVI Vegetation",
    healthyCanopy: "Healthy Canopy",
    quickActions: "Quick Actions",
    scanLeaf: "Scan Leaf",
    checkNutrition: "Check nutrition",
    controlWater: "Control water",
    checkWeather: "Check weather",

    // Services Cards
    cropVisionCardTitle: "Crop Vision AI Lab",
    cropVisionCardDesc: "Instant leaf image diagnosis detecting early blight, leaf rust, and pest infestation with dosage remedies.",
    openDiagnosticLab: "Open Diagnostic Lab →",
    plantNutritionCardTitle: "Plant Nutrition & Soil N-P-K",
    plantNutritionCardDesc: "Real-time root-zone Nitrogen, Phosphorus, Potassium balance monitoring and custom organic fertilizer calculators.",
    viewNutritionAnalytics: "View Nutrition Analytics →",
    smartDripCardTitle: "Smart Drip Irrigation",
    smartDripCardDesc: "Automated zone solenoid valve control reacting dynamically to soil moisture sensors and solar heat.",
    controlIrrigationGrid: "Control Irrigation Grid →",
    microclimateCardTitle: "Micro-Climate Weather Desk",
    microclimateCardDesc: "Hyper-local 7-day weather forecasts, dew point tracking, rainfall radar, and frost risk warnings.",
    checkWeatherForecast: "Check Weather Forecast →",
    apmcMandiCardTitle: "APMC Mandi Market Hub",
    apmcMandiCardDesc: "Live commodity trading prices for Wheat, Rice, Tomato, Cotton with direct farm-to-buyer sales contracts.",
    exploreMarketRates: "Explore Market Rates →",
    satelliteCardTitle: "Satellite & Drone Mapping",
    satelliteCardDesc: "Multispectral NDVI orbital satellite heatmaps monitoring crop canopy vigor across entire field sectors.",
    viewOrbitalImagery: "View Orbital Imagery →",

    // Plant Nutrition
    nutritionTitle: "Plant Nutrition & N-P-K Soil Analytics",
    nutritionDesc: "Monitor Nitrogen, Phosphorus, Potassium levels and calculate tailored fertilizer dosages.",
    npkControllers: "Soil N-P-K Balance Controllers",
    nitrogenLabel: "Nitrogen (N) - Leaf & Stem Vigor",
    phosphorusLabel: "Phosphorus (P) - Root Development",
    potassiumLabel: "Potassium (K) - Disease Immunity",
    phGaugeTitle: "Soil pH & Micronutrient Profile",

    // Crop Vision AI
    cropVisionTitle: "Crop Vision AI — Real-Time Leaf Disease Diagnostic",
    cropVisionDesc: "Upload or capture a leaf photo for instant computer vision disease detection, canvas heatmap segmentation, and remedy advice.",
    uploadBoxTitle: "Upload Leaf Image or Use Live Camera",
    dragDropText: "Drag & drop leaf photo here, or click to browse",
    runScanBtn: "Run AI Diagnostic Scan",
    defectHeatmapLabel: "AI Defect Heatmap Segmentation:",
    reportTitle: "AI Diagnostic Scan & Remedy Report",
    pathologyLabel: "Pathology Diagnosis:",
    infectionAreaLabel: "Infection Surface Area:",
    organicTreatment: "Organic Treatment:",
    chemicalTreatment: "Chemical Treatment:",
    recommendedSpray: "Recommended Spray Volume:",

    // Smart Irrigation
    irrigationTitle: "Smart Irrigation & Valve Actuation",
    irrigationDesc: "Automated drip irrigation zone scheduling and real-time solenoid valve switches.",
    zone1Title: "Zone 1: North Orchard",
    zone2Title: "Zone 2: South Wheat Field",
    zone3Title: "Zone 3: Greenhouse Tomatoes",

    // Weather Desk
    weatherTitle: "Micro-Climate Weather Desk",
    weatherDesc: "Localized 7-day weather predictions, frost risk alerts, and humidity gauges.",
    currentMicroclimate: "Current Micro-Climate",

    // Market Mandi Hub
    marketTitle: "Mandi Commodity Market Hub",
    marketDesc: "Live APMC agricultural trading rates, buyer orders, and crop price forecasts.",
    liveLookupTitle: "Live APMC Market Lookup",

    // Auth & Login Form
    welcomeTitle: "Welcome to AgroVI Portal",
    welcomeDesc: "Enter your registered credentials to access your smart farm telemetry.",
    usernameLabel: "Username or Mobile / Email",
    passwordLabel: "Password",
    rememberMe: "Remember this device",
    loginSubmit: "Login",
    newRegistration: "Sign Up",
    forgotPassTab: "Forgot Password?",
    createAccountTitle: "Create New AgroVI Account",
    fullNameLabel: "Full Name *",
    phoneLabel: "Mobile Phone Number *",
    emailLabel: "Email Address *",
    farmSizeLabel: "Farm Size (Acres) *",
    accountPassLabel: "Account Password (Min 8 Characters) *",
    registerSubmit: "Sign Up",
    sendResetSubmit: "Send Reset Link",

    // Landing Page Trust Strip & Footer
    organicCert: "100% Organic Certified",
    delivered24h: "Delivered Within 24 Hours",
    familyFarmed: "Family-Farmed Since 1985",
    zeroWaste: "Zero-Waste Packaging",
    storyTitle: "Our Farming Story",
    storyBody: "Three generations of farming Nashik fields organically. We nourish the soil, harvest naturally, and empower farmers with AI technology.",
    ctaTitle: "Transform Your Farm with AgroVI AI Technology",
    ctaBtn: "Launch App Dashboard →",
    footerCopyright: "© 2026 AgroVI Smart Farming & AI Technologies. All rights reserved."
  },

  hi: {
    // Navigation & Global
    overview: "अवलोकन",
    cropVision: "फसल दृष्टि एआई",
    nutrition: "पौधों का पोषण",
    irrigation: "स्मार्ट सिंचाई",
    weatherDesk: "मौसम डेस्क",
    marketHub: "मंडी बाज़ार",
    products: "उत्पाद",
    about: "हमारे बारे में",
    services: "सेवाएं",
    process: "कैसे काम करता है",
    contact: "संपर्क करें",
    help: "सहायता",
    loginBtn: "लॉगिन",
    signUpBtn: "साइन अप",
    dashboardBtn: "ऐप डैशबोर्ड",
    backToHome: "← मुख्य पृष्ठ पर लौटें",
    voiceAgent: "वॉइस एजेंट",
    exitBtn: "लॉगआउट",
    myProfile: "मेरी प्रोफ़ाइल",
    farmSettings: "खेत और प्लॉट सेटिंग्स",
    languageSettings: "प्राथमिकताएं",
    helpSupport: "सहायता और हेल्पलाइन",
    aboutAgroAI: "एग्रोवी (AgroVI) के बारे में",
    fieldNavigation: "नेविगेशन",
    systemLive: "सिस्टम लाइव",

    // Dashboard Overview
    fieldSummaryTitle: "खेत सारांश और कमांड सेंटर",
    heroSub: "आपका खेत शांत है। सूर्यास्त से पहले सिंचाई की जांच करें।",
    soilHealthIndex: "मिट्टी स्वास्थ्य सूचकांक",
    optimalMoistureStatus: "इष्टतम नमी और पीएच",
    rootZoneMoisture: "जड़ क्षेत्र की नमी",
    solarRadiation: "सौर विकिरण",
    highET0: "उच्च वाष्पीकरण दर",
    ndviVegetation: "NDVI वनस्पति विकास",
    healthyCanopy: "स्वस्थ कैनोपी",
    quickActions: "त्वरित कार्रवाइयां",
    scanLeaf: "पत्ता स्कैन करें",
    checkNutrition: "पोषण जांचें",
    controlWater: "पानी नियंत्रित करें",
    checkWeather: "मौसम जांचें",

    // Plant Nutrition
    nutritionTitle: "पौधों का पोषण और एन-पी-के मिट्टी विश्लेषण",
    nutritionDesc: "नाइट्रोजन, फास्फोरस, पोटेशियम के स्तर की निगरानी करें और उर्वरक खुराक की गणना करें।",
    npkControllers: "मिट्टी एन-पी-के संतुलन नियंत्रक",
    nitrogenLabel: "नाइट्रोजन (N) - पत्ती और तना विकास",
    phosphorusLabel: "फास्फोरस (P) - जड़ विकास",
    potassiumLabel: "पोटेशियम (K) - रोग प्रतिरोधक क्षमता",
    phGaugeTitle: "मिट्टी का pH और सूक्ष्म पोषक तत्व प्रोफ़ाइल",

    // Crop Vision AI
    cropVisionTitle: "फसल दृष्टि एआई — वास्तविक समय पत्ती रोग निदान",
    cropVisionDesc: "तत्काल कंप्यूटर विजन रोग निदान और उपचार सलाह के लिए एक पत्ती की तस्वीर अपलोड करें।",
    uploadBoxTitle: "पत्ती की छवि अपलोड करें या लाइव कैमरा का उपयोग करें",
    dragDropText: "पत्ती की तस्वीर यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
    runScanBtn: "एआई रोग निदान स्कैन चलाएं",
    defectHeatmapLabel: "एआई दोष हीटमैप विभाजन:",
    reportTitle: "एआई निदान स्कैन और उपचार रिपोर्ट",
    pathologyLabel: "रोग निदान:",
    infectionAreaLabel: "संक्रमण सतह क्षेत्र:",
    organicTreatment: "जैविक उपचार:",
    chemicalTreatment: "रासायनिक उपचार:",
    recommendedSpray: "अनुशंसित स्प्रे मात्रा:",

    // Smart Irrigation
    irrigationTitle: "स्मार्ट सिंचाई और वाल्व स्वचालन",
    irrigationDesc: "स्वचालित ड्रिप सिंचाई क्षेत्र शेड्यूलिंग और वास्तविक समय सोलेनोइड वाल्व स्विच।",
    zone1Title: "क्षेत्र 1: उत्तरी बाग",
    zone2Title: "क्षेत्र 2: दक्षिणी गेहूं का खेत",
    zone3Title: "क्षेत्र 3: ग्रीनहाउस टमाटर",

    // Weather Desk
    weatherTitle: "सूक्ष्म जलवायु मौसम डेस्क",
    weatherDesc: "स्थानीयकृत 7-दिवसीय मौसम पूर्वानुमान, पाला जोखिम अलर्ट और आर्द्रता।",
    currentMicroclimate: "वर्तमान सूक्ष्म जलवायु",

    // Market Mandi Hub
    marketTitle: "मंडी जिंस बाज़ार केंद्र",
    marketDesc: "लाइव एपीएमसी कृषि व्यापार दरें, खरीदार के ऑर्डर और मूल्य पूर्वानुमान।",
    liveLookupTitle: "लाइव एपीएमसी मार्केट लुकअप",

    // Auth & Login Form
    welcomeTitle: "एग्रोवी पोर्टल में आपका स्वागत है",
    welcomeDesc: "अपने स्मार्ट फॉर्म टेलीमेट्री तक पहुंचने के लिए पंजीकृत क्रेडेंशियल दर्ज करें।",
    usernameLabel: "उपयोगकर्ता नाम या मोबाइल / ईमेल",
    passwordLabel: "पासवर्ड",
    rememberMe: "इस डिवाइस को याद रखें",
    loginSubmit: "लॉगिन",
    newRegistration: "साइन अप",
    forgotPassTab: "पासवर्ड भूल गए?",
    createAccountTitle: "नया एग्रोवी खाता बनाएं",
    fullNameLabel: "पूरा नाम *",
    phoneLabel: "मोबाइल नंबर *",
    emailLabel: "ईमेल पता *",
    farmSizeLabel: "खेत का आकार (एकड़) *",
    accountPassLabel: "खाता पासवर्ड (न्यूनतम 8 वर्ण) *",
    registerSubmit: "साइन अप",
    sendResetSubmit: "रीसेट लिंक भेजें",

    // Landing Page Trust Strip & Footer
    organicCert: "100% जैविक प्रमाणित",
    delivered24h: "24 घंटे में डिलीवरी",
    familyFarmed: "1985 से पारिवारिक खेती",
    zeroWaste: "ज़ीरो-वेस्ट पैकेजिंग",
    storyTitle: "हमारी खेती की कहानी",
    storyBody: "तीन पीढ़ियों से नासिक के खेतों में जैविक खेती। हम एआई तकनीक से किसानों को सशक्त बनाते हैं।",
    ctaTitle: "एग्रोवी एआई तकनीक से अपने खेत को बदलें",
    ctaBtn: "ऐप डैशबोर्ड खोलें →",
    footerCopyright: "© 2026 एग्रोवी स्मार्ट फार्मिंग एंड एआई टेक्नोलॉजीज।"
  },

  ta: {
    // Navigation & Global
    overview: "மேலோட்டம்",
    cropVision: "பயிர் பார்வை AI",
    nutrition: "பயிர் ஊட்டச்சத்து",
    irrigation: "ஸ்மார்ட் பாசனம்",
    weatherDesk: "வானிலை மையம்",
    marketHub: "சந்தை மண்டி",
    products: "தயாரிப்புகள்",
    about: "எங்களைப் பற்றி",
    services: "சேவைகள்",
    process: "செயல்முறை",
    contact: "தொடர்பு கொள்ள",
    help: "உதவி",
    loginBtn: "உள்நுழைவு",
    signUpBtn: "பதிவு செய்க",
    dashboardBtn: "செயலி டாஷ்போர்டு",
    backToHome: "← முகப்பு பக்கத்திற்குச் செல்லவும்",
    voiceAgent: "குரல் உதவியாளர்",
    exitBtn: "வெளியேறு",
    myProfile: "என் சுயவிவரம்",
    farmSettings: "பண்ணை அமைப்புகள்",
    languageSettings: "விருப்பத்தேர்வுகள்",
    helpSupport: "உதவி மற்றும் உதவி எண்",
    aboutAgroAI: "அக்ரோவி (AgroVI) பற்றி",
    fieldNavigation: "பண்ணை வழிசெலுத்தல்",
    systemLive: "சிஸ்டம் இயங்குகிறது",
    companyProfile: "நிறுவனத்தின் சுயவிவரம்",
    solutionsTitle: "தீர்வுகள் & சேவைகள்",
    endToEndEcosystem: "விவசாய தொழில்நுட்ப அமைப்பு",
    automationWorkflow: "தானியங்கி பணிப்பாய்வு",
    getInTouch: "தொடர்பில் இருங்கள்",

    // Dashboard Overview
    fieldSummaryTitle: "பண்ணை சுருக்கம் & கட்டுப்பாட்டு மையம்",
    heroSub: "உங்கள் நிலம் அமைதியாக உள்ளது. சூரிய அஸ்தமனத்திற்கு முன் பாசனத்தை சரிபார்க்கவும்.",
    soilHealthIndex: "மண் சுகாதார குறியீடு",
    optimalMoistureStatus: "சிறப்பான ஈரம் & pH",
    rootZoneMoisture: "வேர் பகுதி ஈரப்பதம்",
    solarRadiation: "சூரிய கதிர்வீச்சு",
    highET0: "அதிக ஆவியாதல் வீதம்",
    ndviVegetation: "NDVI தாவர வளர்ச்சி",
    healthyCanopy: "ஆரோக்கியமான பயிர் பட்ஸ்",
    quickActions: "விரைவு நடவடிக்கைகள்",
    scanLeaf: "இலை ஸ்கேன்",
    checkNutrition: "ஊட்டச்சத்து சரிபார்",
    controlWater: "நீர் கட்டுப்பாடு",
    checkWeather: "வானிலை சரிபார்",

    // Services Cards
    cropVisionCardTitle: "பயிர் பார்வை AI ஆய்வுக்கூடம்",
    cropVisionCardDesc: "இலை நோய்கள் மற்றும் பூச்சித் தாக்குதல்களை உடனுக்குடன் கண்டறிந்து தீர்வுகள் பெறலாம்.",
    openDiagnosticLab: "ஆய்வுக்கூடத்தை திறக்கவும் →",
    plantNutritionCardTitle: "பயிர் ஊட்டச்சத்து & மண் N-P-K",
    plantNutritionCardDesc: "தழைச்சத்து, மணிச்சத்து, சாம்பல்சத்து சமநிலை கண்காணிப்பு மற்றும் உரம் கணக்கீடு.",
    viewNutritionAnalytics: "ஊட்டச்சத்து விவரம் பார்க்க →",
    smartDripCardTitle: "ஸ்மார்ட் சொட்டு நீர் பாசனம்",
    smartDripCardDesc: "மண் ஈரப்பத உணரிகளுக்கு ஏற்ப தானியங்கி சொட்டு நீர் வால்வு கட்டுப்பாடு.",
    controlIrrigationGrid: "பாசனத்தை கட்டுப்படுத்த →",
    microclimateCardTitle: "வானிலை தகவல் பலகை",
    microclimateCardDesc: "7 நாள் வானிலை கணிப்பு, மழைக்காலம் மற்றும் பனிப்பொழிவு எச்சரிக்கைகள்.",
    checkWeatherForecast: "வானிலை பார்க்க →",
    apmcMandiCardTitle: "APMC சந்தை மண்டி மையம்",
    apmcMandiCardDesc: "கோதுமை, நெல், தக்காளி, பருத்தி நேரடி சந்தை விலைகள் மற்றும் வர்த்தகம்.",
    exploreMarketRates: "சந்தை விலை பார்க்க →",
    satelliteCardTitle: "சாட்டிலைட் & ட்ரோன் வரைபடம்",
    satelliteCardDesc: "பயிர் வளர்ச்சியை விண்வெளி செயற்கைக்கோள் NDVI மூலம் கண்காணித்தல்.",
    viewOrbitalImagery: "செயற்கைக்கோள் படம் பார்க்க →",

    // Plant Nutrition
    nutritionTitle: "பயிர் ஊட்டச்சத்து & N-P-K மண் பகுப்பாய்வு",
    nutritionDesc: "தழைச்சத்து, மணிச்சத்து, சாம்பல்சத்து அளவுகளை கண்காணித்து உரம் கணக்கிடுங்கள்.",
    npkControllers: "மண் N-P-K சமநிலை கட்டுப்பாட்டாளர்கள்",
    nitrogenLabel: "தழைச்சத்து (N) - இலை & தண்டு வளர்ச்சி",
    phosphorusLabel: "மணிச்சத்து (P) - வேர் வளர்ச்சி",
    potassiumLabel: "சாம்பல்சத்து (K) - நோய் எதிர்ப்புத்திறன்",
    phGaugeTitle: "மண் pH & நுண் ஊட்டச்சத்து விவரம்",

    // Crop Vision AI
    cropVisionTitle: "பயிர் பார்வை AI — இலை நோய் கண்டறிதல்",
    cropVisionDesc: "இலை படத்தை பதிவேற்றி கணினி பார்வையின் மூலம் உடனடி நோய் கண்டறிதல் மற்றும் தீர்வுகள் பெறவும்.",
    uploadBoxTitle: "இலை படத்தை பதிவேற்றவும் அல்லது கேமராவை பயன்படுத்தவும்",
    dragDropText: "இலை படத்தை இங்கு இழுத்து போடவும் அல்லது கிளிக் செய்யவும்",
    runScanBtn: "AI நோய் பரிசோதனை இயக்கு",
    defectHeatmapLabel: "AI நோய் பாதிப்பு பகுதி வரைபடம்:",
    reportTitle: "AI நோய் பரிசோதனை அறிக்கை & தீர்வுகள்",
    pathologyLabel: "நோய் கண்டறிதல்:",
    infectionAreaLabel: "பாதிக்கப்பட்ட மேற்பரப்பு பகுதி:",
    organicTreatment: "இயற்கை சிகிச்சை:",
    chemicalTreatment: "இரசாயன சிகிச்சை:",
    recommendedSpray: "பரிந்துரைக்கப்பட்ட தெளிப்பு அளவு:",

    // Smart Irrigation
    irrigationTitle: "ஸ்மார்ட் பாசனம் & வால்வு கட்டுப்பாடு",
    irrigationDesc: "தானியங்கி சொட்டு நீர் பாசன மண்டலங்கள் மற்றும் வால்வு இயக்கம்.",
    zone1Title: "மண்டலம் 1: வட தென்னந்தோப்பு",
    zone2Title: "மண்டலம் 2: தெற்கு கோதுமை வயல்",
    zone3Title: "மண்டலம் 3: பசுமை இல்ல தக்காளி",

    // Weather Desk
    weatherTitle: "வானிலை தகவல் பலகை",
    weatherDesc: "உள்ளூர் 7 நாள் வானிலை கணிப்பு, பனிப்பொழிவு எச்சரிக்கை, காற்றீரம்.",
    currentMicroclimate: "தற்போதைய வானிலை நிலை",

    // Market Mandi Hub
    marketTitle: "சந்தை மண்டி விலை மையம்",
    marketDesc: "நேரடி APMC விவசாய வர்த்தக விலைகள் மற்றும் கொள்முதல் வாய்ப்புகள்.",
    liveLookupTitle: "நேரடி APMC சந்தை விலை தேடல்",

    // Auth & Login Form
    welcomeTitle: "அக்ரோவி போர்ட்டலுக்கு வரவேற்கிறோம்",
    welcomeDesc: "உங்கள் ஸ்மார்ட் பண்ணை தரவுகளை அணுக உள்நுழைக.",
    usernameLabel: "பயனர் பெயர் அல்லது மொபைல் / மின்னஞ்சல்",
    passwordLabel: "கடவுச்சொல்",
    rememberMe: "இந்த சாதனத்தை நினைவில் கொள்க",
    loginSubmit: "உள்நுழைக",
    newRegistration: "பதிவு செய்க",
    forgotPassTab: "கடவுச்சொல் மறந்துவிட்டதா?",
    createAccountTitle: "புதிய அக்ரோவி கணக்கை உருவாக்கவும்",
    fullNameLabel: "முழு பெயர் *",
    phoneLabel: "மொபைல் எண் *",
    emailLabel: "மின்னஞ்சல் முகவரி *",
    farmSizeLabel: "பண்ணை அளவு (ஏக்கர்) *",
    accountPassLabel: "கணக்கு கடவுச்சொல் (குறைந்தது 8 எழுத்துக்கள்) *",
    registerSubmit: "பதிவு செய்க",
    sendResetSubmit: "மீட்டமைப்பு இணைப்பை அனுப்புக",

    // Landing Page Trust Strip & Footer
    organicCert: "100% இயற்கை சான்றளிக்கப்பட்டது",
    delivered24h: "24 மணிநேரத்தில் விநியோகம்",
    familyFarmed: "1985 முதல் குடும்ப விவசாயம்",
    zeroWaste: "பூஜ்ய கழிவு பேக்கேஜிங்",
    storyTitle: "எங்கள் விவசாயக் கதை",
    storyBody: "மூன்று தலைமுறைகளாக இயற்கை விவசாயம். AI தொழில்நுட்பம் மூலம் விவசாயிகளை மேம்படுத்துகிறோம்.",
    ctaTitle: "அக்ரோவி AI தொழில்நுட்பத்துடன் உங்கள் பண்ணையை மாற்றவும்",
    ctaBtn: "செயலி டாஷ்போர்டை திறக்கவும் →",
    footerCopyright: "© 2026 அக்ரோவி ஸ்மார்ட் ஃபார்மிங் அண்ட் AI டெக்னாலஜிஸ்."
  },

  mr: {
    // Marathi
    overview: "एकूण चित्र",
    cropVision: "पिक दृष्टी AI",
    nutrition: "पिक पोषण",
    irrigation: "स्मार्ट सिंचन",
    weatherDesk: "हवामान डेस्क",
    marketHub: "बाजार समिती मका",
    about: "आमच्याबद्दल",
    services: "सेवा",
    contact: "संपर्क करा",
    loginBtn: "लॉगिन",
    signUpBtn: "साइन अप",
    dashboardBtn: "अ‍ॅप डैशबोर्ड",
    voiceAgent: "व्हॉइस एजंट",
    exitBtn: "लॉगआउट",
    myProfile: "माझी प्रोफाइल",
    farmSettings: "शेती आणि प्लॉट सेटिंग्ज",
    languageSettings: "प्राधान्ये",
    helpSupport: "मदत आणि हेल्पलाइन",
    heroSub: "तुमची शेती शांत आहे. सूर्यास्तापूर्वी सिंचन तपासा."
  },

  te: {
    // Telugu
    overview: "అవలోకనం",
    cropVision: "పంట విజన్ AI",
    nutrition: "పంట పోషణ",
    irrigation: "స్మార్ట్ నీటిపారుదల",
    weatherDesk: "వాతావరణ కేంద్రం",
    marketHub: "మార్కెట్ మండి",
    about: "మా గురించి",
    services: "సేవలు",
    contact: "సంప్రదించండి",
    loginBtn: "లాగిన్",
    signUpBtn: "సైన్ అప్",
    dashboardBtn: "యాప్ డాష్‌బోర్డ్",
    voiceAgent: "వాయిస్ ఏజెంట్",
    exitBtn: "లాగౌట్",
    myProfile: "నా ప్రొఫైల్",
    farmSettings: "వ్యవసాయ మరియు ప్లాట్ సెట్టింగ్‌లు",
    languageSettings: "ప్రాధాన్యతలు",
    helpSupport: "సహాయం మరియు హెల్ప్‌లైన్",
    heroSub: "మీ పొలం ప్రశాంతంగా ఉంది. సూర్యాస్తమయానికి ముందే నీటిపారుదలని తనిఖీ చేయండి."
  },

  kn: {
    // Kannada
    overview: "ಅವಲೋಕನ",
    cropVision: "ಬೆಳೆ ದೃಷ್ಟಿ AI",
    nutrition: "ಸಸ್ಯ ಪೋಷಣೆ",
    irrigation: "ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ",
    weatherDesk: "ಹವಾಮಾನ ಡೆಸ್ಕ್",
    marketHub: "ಮಾರುಕಟ್ಟೆ ಮಂಡಿ",
    about: "ನಮ್ಮ ಬಗ್ಗೆ",
    services: "ಸೇವೆಗಳು",
    contact: "ಸಂಪರ್ಕಿಸಿ",
    loginBtn: "ಲಾಗಿನ್",
    signUpBtn: "ಸೈನ್ ಅಪ್",
    dashboardBtn: "ಆ್ಯಪ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    voiceAgent: "ವಾಯ್ಸ್ ಏಜೆಂಟ್",
    exitBtn: "ನಿರ್ಗಮನ",
    myProfile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
    farmSettings: "ಫಾರ್ಮ್ ಮತ್ತು ಪ್ಲಾಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    languageSettings: "ಆದ್ಯತೆಗಳು",
    helpSupport: "ಸಹಾಯ ಮತ್ತು ಸಹಾಯವಾಣಿ",
    heroSub: "ನಿಮ್ಮ ಹೊಲ ಶಾಂತವಾಗಿದೆ. ಸೂರ್ಯಾಸ್ತದ ಮೊದಲು ನೀರಾವರಿ ಪರಿಶೀಲಿಸಿ."
  },

  pa: {
    // Punjabi
    overview: "ਸੰਖੇਪ",
    cropVision: "ਫਸਲ ਦ੍ਰਿਸ਼ਟੀ AI",
    nutrition: "ਪੌਧਿਆਂ ਦਾ ਪੋਸ਼ਣ",
    irrigation: "ਸਮਾਰਟ ਸਿੰਚਾਈ",
    weatherDesk: "ਮੌਸਮ ਡੈਸਕ",
    marketHub: "ਮੰਡੀ ਬਜ਼ਾਰ",
    about: "ਸਾਡੇ ਬਾਰੇ",
    services: "ਸੇਵਾਵਾਂ",
    contact: "ਸੰਪਰਕ ਕਰੋ",
    loginBtn: "ਲੌਗਇਨ",
    signUpBtn: "ਸਾਈਨ ਅੱਪ",
    dashboardBtn: "ਐਪ ਡੈਸ਼ਬੋਰਡ",
    voiceAgent: "ਵੌਇਸ ਏਜੰਟ",
    exitBtn: "ਲੌਗਆਉਟ",
    myProfile: "ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ",
    farmSettings: "ਖੇਤ ਅਤੇ ਪਲਾਟ ਸੈਟਿੰਗਾਂ",
    languageSettings: "ਤਰਜੀਹਾਂ",
    helpSupport: "ਮਦਦ ਅਤੇ ਹੈਲਪਲਾਈਨ",
    heroSub: "ਤੁਹਾਡਾ ਖੇਤ ਸ਼ਾਂਤ ਹੈ। ਸੂਰਜ ਡੁੱਬਣ ਤੋਂ ਪਹਿਲਾਂ ਸਿੰਚਾਈ ਦੀ ਜਾਂਚ ਕਰੋ।"
  },

  gu: {
    // Gujarati
    overview: "ઓવરવ્યુ",
    cropVision: "પાક દ્રષ્ટિ AI",
    nutrition: "છોડનું પોષણ",
    irrigation: "સ્માર્ટ સિંચાઈ",
    weatherDesk: "હવામાન ડેસ્ક",
    marketHub: "માર્કેટ મંડી",
    about: "અમારા વિશે",
    services: "સેવાઓ",
    contact: "સંપર્ક કરો",
    loginBtn: "લોગઇન",
    signUpBtn: "સાઇન અપ",
    dashboardBtn: "એપ ડેશબોર્ડ",
    voiceAgent: "વોઇસ એજન્ટ",
    exitBtn: "લોગઆઉટ",
    myProfile: "મારી પ્રોફાઇલ",
    farmSettings: "ખેતર અને પ્લોટ સેટિંગ્સ",
    languageSettings: "પસંદગીઓ",
    helpSupport: "મદદ અને હેલ્પલાઇન",
    heroSub: "તમારું ખેતર શાંત છે. સૂર્યાસ્ત પહેલાં સિંચાઈ તપાસો."
  },

  ml: {
    // Malayalam (മലയാളം)
    overview: "അവലോകനം",
    cropVision: "ക്രോപ്പ് വിഷൻ AI",
    nutrition: "വിള പോഷണം",
    irrigation: "സ്മാർട്ട് ജലസേചനം",
    weatherDesk: "കാലാവസ്ഥാ കേന്ദ്രം",
    marketHub: "വിപണി മണ്ഡി",
    products: "ഉൽപ്പന്നങ്ങൾ",
    about: "ഞങ്ങളെക്കുറിച്ച്",
    services: "സേവനങ്ങൾ",
    process: "പ്രവർത്തന രീതി",
    contact: "ബന്ധപ്പെടുക",
    help: "സഹായം",
    loginBtn: "ലോഗിൻ",
    signUpBtn: "സൈൻ അപ്പ്",
    dashboardBtn: "ആപ്പ് ഡാഷ്‌ബോർഡ്",
    backToHome: "← പ്രധാന പേജിലേക്ക്",
    voiceAgent: "വോയ്സ് ഏജന്റ്",
    exitBtn: "ലോഗ്ഔട്ട്",
    myProfile: "എന്റെ പ്രൊഫൈൽ",
    farmSettings: "ഫാം ക്രമീകരണങ്ങൾ",
    languageSettings: "മുൻഗണനകൾ",
    helpSupport: "സഹായവും ഹെൽപ്പ്‌ലൈനും",
    aboutAgroAI: "അഗ്രോവി (AgroVI) നെക്കുറിച്ച്",
    fieldNavigation: "ഫാം നാവിഗേഷൻ",
    systemLive: "സിസ്റ്റം തത്സമയം",
    companyProfile: "കമ്പനി പ്രൊഫൈൽ",
    solutionsTitle: "പരിഹാരങ്ങളും സേവനങ്ങളും",
    endToEndEcosystem: "കാർഷിക സാങ്കേതിക സംവിധാനം",
    automationWorkflow: "ഓട്ടോമേറ്റഡ് പ്രവർത്തനം",
    getInTouch: "ബന്ധപ്പെടുക",

    // Dashboard Overview
    fieldSummaryTitle: "ഫാം സംഗ്രഹം & കൺട്രോൾ സെന്റർ",
    heroSub: "നിങ്ങളുടെ കൃഷിയിടം ശാന്തമാണ്. സൂര്യാസ്തമയത്തിന് മുമ്പ് ജലസേചനം പരിശോധിക്കുക.",
    soilHealthIndex: "മണ്ണ് ആരോഗ്യ സൂചിക",
    optimalMoistureStatus: "ഉത്തമമായ ഈർപ്പവും pH ഉം",
    rootZoneMoisture: "വേരുപടല ഈർപ്പം",
    solarRadiation: "സൗരോർജ്ജ വികിരണം",
    highET0: "ഉയർന്ന ബാഷ്പീകരണ നിരക്ക്",
    ndviVegetation: "NDVI സസ്യ വളർച്ച",
    healthyCanopy: "ആരോഗ്യമുള്ള വിളകൾ",
    quickActions: "ദ്രുത നടപടികൾ",
    scanLeaf: "ഇല സ്കാൻ ചെയ്യുക",
    checkNutrition: "പോഷണം പരിശോധിക്കുക",
    controlWater: "വെള്ളം നിയന്ത്രിക്കുക",
    checkWeather: "കാലാവസ്ഥ പരിശോധിക്കുക",

    // Services Cards
    cropVisionCardTitle: "ക്രോപ്പ് വിഷൻ AI ലാബ്",
    cropVisionCardDesc: "ഇല രോഗങ്ങളും കീടബാധകളും തത്സമയം കണ്ടെത്തി മരുന്ന് അളവ് നിർദ്ദേശിക്കുന്നു.",
    openDiagnosticLab: "ലാബ് തുറക്കുക →",
    plantNutritionCardTitle: "വിള പോഷണവും മണ്ണും N-P-K",
    plantNutritionCardDesc: "നൈട്രജൻ, ഫോസ്ഫറസ്, പൊട്ടാസ്യം അളവുകൾ തത്സമയം നിരീക്ഷിക്കുകയും വളം കണക്കാക്കുകയും ചെയ്യാം.",
    viewNutritionAnalytics: "പോഷക വിശകലനം കാണുക →",
    smartDripCardTitle: "സ്മാർട്ട് തുള്ളിനന ജലസേചനം",
    smartDripCardDesc: "മണ്ണിലെ ഈർപ്പത്തിനും വെയിലിനും അനുസരിച്ച് സ്വയം പ്രവർത്തിക്കുന്ന ഡ്രിപ്പ് വാൽവുകൾ.",
    controlIrrigationGrid: "ജലസേചനം നിയന്ത്രിക്കുക →",
    microclimateCardTitle: "കാലാവസ്ഥാ കേന്ദ്രം",
    microclimateCardDesc: "7 ദിവസത്തെ തദേശീയ കാലാവസ്ഥാ പ്രവചനം, മഴ പ്രവചനം, മഞ്ഞു വീഴ്ച മുന്നറിയിപ്പ്.",
    checkWeatherForecast: "കാലാവസ്ഥ കാണുക →",
    apmcMandiCardTitle: "APMC വിപണി മണ്ഡി",
    apmcMandiCardDesc: "ഗോതമ്പ്, നെല്ല്, തക്കാളി, പരുത്തി എന്നിവയുടെ തത്സമയ വിപണി വിലകളും വിപണനവും.",
    exploreMarketRates: "വിപണി നിരക്കുകൾ കാണുക →",
    satelliteCardTitle: "സാറ്റലൈറ്റ് & ഡ്രോൺ മാപ്പിംഗ്",
    satelliteCardDesc: "സാറ്റലൈറ്റ് NDVI ഇമേജറി വഴി കൃഷിയിടത്തിന്റെ വളർച്ച നിരീക്ഷണം.",
    viewOrbitalImagery: "സാറ്റലൈറ്റ് ചിത്രം കാണുക →",

    // Plant Nutrition
    nutritionTitle: "വിള പോഷണവും N-P-K മണ്ണ് വിശകലനവും",
    nutritionDesc: "നൈട്രജൻ, ഫോസ്ഫറസ്, പൊട്ടാസ്യം അളവുകൾ നിരീക്ഷിച്ച് ആവശ്യമായ വളം കണക്കാക്കുക.",
    npkControllers: "മണ്ണ് N-P-K ബാലൻസ് കണ്ട്രോളറുകൾ",
    nitrogenLabel: "നൈട്രജൻ (N) - ഇലയും തണ്ടും വളർച്ച",
    phosphorusLabel: "ഫോസ്ഫറസ് (P) - വേരുപടല വളർച്ച",
    potassiumLabel: "പൊട്ടാസ്യം (K) - രോഗപ്രതിരോധ ശേഷി",
    phGaugeTitle: "മണ്ണ് pH ഉം സൂക്ഷ്മപോഷക പ്രൊഫൈലും",

    // Crop Vision AI
    cropVisionTitle: "ക്രോപ്പ് വിഷൻ AI — തത്സമയ ഇല രോഗ നിർണ്ണയം",
    cropVisionDesc: "ഇലയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്ത് കൃത്യമായ രോഗനിർണ്ണയവും പരിഹാരവും നേടുക.",
    uploadBoxTitle: "ഇലയുടെ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിക്കുക",
    dragDropText: "ഇലയുടെ ചിത്രം ഇവിടെ ഡ്രാഗ് ആൻഡ് ഡ്രോപ്പ് ചെയ്യുക, അല്ലെങ്കിൽ ക്ലിക്ക് ചെയ്യുക",
    runScanBtn: "AI രോഗനിർണ്ണയ സ്കാൻ ചെയ്യുക",
    defectHeatmapLabel: "AI തകരാർ മാപ്പിംഗ് സെഗ്മെന്റേഷൻ:",
    reportTitle: "AI രോഗനിർണ്ണയ റിപ്പോർട്ടും ചികിത്സയും",
    pathologyLabel: "രോഗനിർണ്ണയം:",
    infectionAreaLabel: "ബാധിച്ച ഉപരിതല വിസ്തീർണ്ണം:",
    organicTreatment: "ജൈവ ചികിത്സ:",
    chemicalTreatment: "രാസ ചികിത്സ:",
    recommendedSpray: "നിർദ്ദേശിച്ച തളിക്കൽ അളവ്:",

    // Smart Irrigation
    irrigationTitle: "സ്മാർട്ട് ജലസേചനവും വാൽവ് നിയന്ത്രണവും",
    irrigationDesc: "സ്വയം പ്രവർത്തിക്കുന്ന തുള്ളിനന സോളനോയിഡ് വാൽവുകൾ.",
    zone1Title: "സോൺ 1: വടക്കൻ തോട്ടം",
    zone2Title: "സോൺ 2: തെക്കൻ ഗോതമ്പ് പാടം",
    zone3Title: "സോൺ 3: ഗ്രീൻഹൗസ് തക്കാളി",

    // Weather Desk
    weatherTitle: "കാലാവസ്ഥാ കേന്ദ്രം",
    weatherDesc: "7 ദിവസത്തെ കാലാവസ്ഥാ പ്രവചനവും ഈർപ്പമാനിയും.",
    currentMicroclimate: "തത്സമയ കാലാവസ്ഥ",

    // Market Mandi Hub
    marketTitle: "വിപണി മണ്ഡി കേന്ദ്രം",
    marketDesc: "തത്സമയ APMC കൃഷി വിപണി നിരക്കുകളും കർഷക ഓർഡറുകളും.",
    liveLookupTitle: "തത്സമയ APMC വിപണി തിരച്ചിൽ",

    // Auth & Login Form
    welcomeTitle: "അഗ്രോവി പോർട്ടലിലേക്ക് സ്വാഗതം",
    welcomeDesc: "നിങ്ങളുടെ സ്മാർട്ട് ഫാം ഡാറ്റ കാണുന്നതിന് ലോഗിൻ ചെയ്യുക.",
    usernameLabel: "യൂസർനെയിം അല്ലെങ്കിൽ മൊബൈൽ / ഇമെയിൽ",
    passwordLabel: "പാസ്‌വേഡ്",
    rememberMe: "ഈ ഉപകരണം ഓർമ്മിക്കുക",
    loginSubmit: "ലോഗിൻ",
    newRegistration: "സൈൻ അപ്പ്",
    forgotPassTab: "പാസ്‌വേഡ് മറന്നുപോയോ?",
    createAccountTitle: "പുതിയ അഗ്രോവി അക്കൗണ്ട് ഉണ്ടാക്കുക",
    fullNameLabel: "പൂർണ്ണ നാമം *",
    phoneLabel: "മൊബൈൽ നമ്പർ *",
    emailLabel: "ഇമെയിൽ വിലാസം *",
    farmSizeLabel: "കൃഷിയിടത്തിന്റെ അളവ് (ഏക്കർ) *",
    accountPassLabel: "അക്കൗണ്ട് പാസ്‌വേഡ് (കുറഞ്ഞത് 8 അക്ഷരങ്ങൾ) *",
    registerSubmit: "സൈൻ അപ്പ്",
    sendResetSubmit: "റീസെറ്റ് ലിങ്ക് അയയ്ക്കുക",

    // Landing Page Trust Strip & Footer
    organicCert: "100% ജൈവ സാക്ഷ്യപ്പെടുത്തിയത്",
    delivered24h: "24 മണിക്കൂറിനുള്ളിൽ ഡെലിവറി",
    familyFarmed: "1985 മുതൽ പാരമ്പര്യ കൃഷി",
    zeroWaste: "സീറോ-വേസ്റ്റ് പാക്കേജിംഗ്",
    storyTitle: "ഞങ്ങളുടെ കൃഷി കഥ",
    storyBody: "മൂന്ന് തലമുറകളായി ജൈവകൃഷി. AI സാങ്കേതികവിദ്യയിലൂടെ കർഷകരെ ശാക്തീകരിക്കുന്നു.",
    ctaTitle: "അഗ്രോവി AI സാങ്കേതികവിദ്യ ഉപയോഗിച്ച് നിങ്ങളുടെ കൃഷിയിടം മാറ്റുക",
    ctaBtn: "ആപ്പ് ഡാഷ്‌ബോർഡ് തുറക്കുക →",
    footerCopyright: "© 2026 അഗ്രോവി സ്മാർട്ട് ഫാമിംഗ് & AI ടെക്നോളജീസ്."
  }
};

/**
 * Apply selected language globally across DOM & save choice to localStorage
 */
export function setLanguage(lang) {
  const effectiveLang = translations[lang] ? lang : 'en';
  Store.set('currentLang', effectiveLang);
  
  try {
    localStorage.setItem('agrovi_language', effectiveLang);
  } catch (e) {
    console.warn('Could not persist language:', e);
  }

  document.documentElement.lang = effectiveLang;

  // Translate all DOM elements containing data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (translations[effectiveLang] && translations[effectiveLang][key]) {
      el.textContent = translations[effectiveLang][key];
    }
  });

  // Keep dropdown selects synchronized
  document.querySelectorAll('#lang-select, .lang-select-dropdown').forEach((select) => {
    select.value = effectiveLang;
  });

  // Keep legacy buttons synchronized if present
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    if (btn.getAttribute('data-lang') === effectiveLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Initialize language settings on page startup
 */
export function initLanguage() {
  let savedLang = 'en';
  try {
    savedLang = localStorage.getItem('agrovi_language') || Store.get('currentLang') || 'en';
  } catch (e) {
    savedLang = 'en';
  }

  setLanguage(savedLang);

  // Bind dropdown change event listeners
  document.querySelectorAll('#lang-select, .lang-select-dropdown').forEach((select) => {
    select.value = savedLang;
    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      setLanguage(selected);
    });
  });
}

