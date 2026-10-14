// Intelligent Marathi to English Translation & Transliteration Helper
const MARATHI_TO_EN_DICT = {
  // Common locations & administrative terms
  "उमरगा": "Omerga",
  "तालुक्यात": "in Taluka",
  "तालुका": "Taluka",
  "जिल्हा": "District",
  "जिल्ह्यात": "in District",
  "धाराशिव": "Dharashiv",
  "महाराष्ट्र": "Maharashtra",
  "ग्रामपंचायत": "Gram Panchayat",
  "नगरपरिषद": "Municipal Council",
  "शहर": "City",
  "शहरात": "in the city",
  "ग्रामीण": "rural",
  "भागात": "in area",

  // News & Governance
  "बातमी": "News",
  "बातम्या": "News",
  "प्रकल्प": "Project",
  "प्रकल्पाला": "to the Project",
  "गती": "momentum",
  "निर्णय": "decision",
  "बैठक": "meeting",
  "बैठकीत": "in meeting",
  "मंजूर": "approved",
  "निधी": "funds",
  "विकास": "development",
  "कामांना": "to works",
  "काम": "work",
  "सुरू": "started",
  "आदेश": "orders",
  "प्रशासनाने": "administration",
  "प्रशासन": "administration",
  "योजना": "scheme",
  "उद्घाटन": "inauguration",
  "घोषणा": "announcement",
  "ऐतिहासिक": "historic",
  "अधिकारी": "officer",
  "पोलिस": "Police",
  "पोलीस": "Police",

  // Public & Agriculture
  "शेतकरी": "Farmers",
  "शेतकऱ्यांनी": "Farmers",
  "शेतकऱ्यांना": "to farmers",
  "नागरिक": "Citizens",
  "नागरिकांनी": "Citizens",
  "आनंद": "delight",
  "बाजार": "Market",
  "समिती": "Committee",
  "समितीत": "in Committee",
  "बाजारभाव": "market rates",
  "सोयाबीन": "Soybean",
  "हरभरा": "Gram",
  "कापूस": "Cotton",
  "तूर": "Tur",
  "पिके": "crops",
  "पाऊस": "rainfall",
  "पावसाने": "by rain",
  "हवामान": "weather",
  "आवश्यक": "necessary",
  "नुकसान": "damage",
  "मदत": "aid",

  // Education, Health & Sports
  "विद्यार्थी": "Students",
  "विद्यार्थ्यांनी": "Students",
  "शाळा": "School",
  "महाविद्यालय": "College",
  "स्पर्धेत": "in competition",
  "यश": "success",
  "प्रथम": "first",
  "क्रमांक": "rank",
  "पारितोषिक": "award",
  "कौतुक": "felicitation",
  "आरोग्य": "Health",
  "रुग्णालय": "Hospital",
  "डॉक्टर": "Doctor",

  // Time & Connectors
  "आज": "Today",
  "काल": "Yesterday",
  "नवीन": "New",
  "मोठी": "Major",
  "मोठा": "Big",
  "विशेष": "Special",
  "महत्त्वाचे": "Important",
  "आणि": "and",
  "व": "and",
  "यांची": "their",
  "यांचे": "their",
  "झाली": "concluded",
  "झाले": "occurred",
  "आहे": "is",
  "आहेत": "are"
};

export function autoTranslateMarathiToEnglish(marathiText) {
  if (!marathiText || typeof marathiText !== 'string') return '';
  
  const trimmed = marathiText.trim();
  if (!trimmed) return '';

  // Tokenize words while preserving punctuation
  const words = trimmed.split(/(\s+|[,।!?;:"])/);

  const translatedWords = words.map(chunk => {
    // If it's punctuation or whitespace, keep it
    if (/^(\s+|[,।!?;:"])$/.test(chunk)) {
      if (chunk === '।') return '.';
      return chunk;
    }

    const cleanWord = chunk.replace(/[.,।!?;:"]/g, '');
    if (MARATHI_TO_EN_DICT[cleanWord]) {
      return MARATHI_TO_EN_DICT[cleanWord];
    }

    // Return the word as-is if no direct translation, maintaining readability
    return cleanWord;
  });

  let translated = translatedWords.join('');
  
  // Format first letter capitalize
  translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  return translated;
}

export function autoTranslateCategory(catMr) {
  const map = {
    "उमरगा विशेष": "Omerga Special",
    "महाराष्ट्र / जिल्हा": "Maharashtra / District",
    "कृषी व बाजारभाव": "Agriculture & Market",
    "शिक्षण व करिअर": "Education & Career",
    "राजकारण": "Politics",
    "गुन्हेगारी": "Crime & Law",
    "क्रीडा": "Sports"
  };
  return map[catMr] || "Regional News";
}

export function autoTranslateColor(colorMr) {
  const map = {
    "लाल": "Red",
    "पांढरा": "White",
    "हिरवा": "Green",
    "पिवळा": "Yellow",
    "केशरी": "Saffron / Orange",
    "निळा": "Blue",
    "गुलाबी": "Pink",
    "सोनेरी": "Gold",
    "जांभळा": "Purple",
    "मोती पांढरा": "Pearl White",
    "पोपटी": "Light Green",
    "गडद लाल": "Deep Red",
    "गडद निळा": "Navy Blue"
  };
  return map[colorMr] || colorMr || "Auspicious Color";
}
