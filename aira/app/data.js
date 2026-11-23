// Raasta POC demo data.
// WARNING: opportunity rules below are DEMO placeholders written from memory.
// Pranshu must verify every rule on the official source_url before the demo
// and set verified_by + last_checked. Unverified items show a "verify" badge.

const QUESTIONS = [
  { key: "interests", en: "What do you enjoy doing or are good at?", ta: "உங்களுக்கு என்ன செய்யப் பிடிக்கும்?",
    options: [
      { v: "stitching", icon: "🧵", en: "Stitching", ta: "தையல்", kw: ["stitch", "sew", "tailor", "தை"] },
      { v: "phone_repair", icon: "📱", en: "Phone repair", ta: "போன் பழுது", kw: ["phone", "repair", "mobile", "போன்"] },
      { v: "drawing", icon: "🎨", en: "Drawing", ta: "வரைதல்", kw: ["draw", "paint", "art", "வரை"] },
      { v: "computers", icon: "💻", en: "Computers", ta: "கணினி", kw: ["computer", "code", "கணினி"] },
      { v: "farming", icon: "🌾", en: "Farming", ta: "விவசாயம்", kw: ["farm", "crop", "விவசா"] },
      { v: "cooking", icon: "🍳", en: "Cooking", ta: "சமையல்", kw: ["cook", "food", "சமை"] }
    ] },
  { key: "age", en: "How old are you?", ta: "உங்கள் வயது என்ன?",
    options: [15, 16, 17, 18, 19, 21].map(n => ({ v: n, icon: "🎂", en: n === 21 ? "20+" : String(n), ta: n === 21 ? "20+" : String(n), kw: [String(n)] })) },
  { key: "education", en: "Which class are you in?", ta: "நீங்கள் எந்த வகுப்பில் படிக்கிறீர்கள்?",
    options: [
      { v: "c9_10", icon: "📘", en: "Class 9-10", ta: "9-10 வகுப்பு", kw: ["9", "10", "nine", "ten"] },
      { v: "c11_12", icon: "📗", en: "Class 11-12", ta: "11-12 வகுப்பு", kw: ["11", "12", "twelve", "பன்னிரண்டு"] },
      { v: "passed12", icon: "🎓", en: "Passed 12", ta: "12 முடித்தேன்", kw: ["passed", "finished", "முடித்"] },
      { v: "iti_diploma", icon: "🛠️", en: "ITI / Diploma", ta: "ஐடிஐ / டிப்ளோமா", kw: ["iti", "diploma"] },
      { v: "ug", icon: "🏫", en: "College", ta: "கல்லூரி", kw: ["college", "degree", "கல்லூரி"] },
      { v: "dropout", icon: "🚪", en: "Left school", ta: "படிப்பை நிறுத்தினேன்", kw: ["left", "stopped", "drop"] }
    ] },
  { key: "gender", en: "Are you a girl or a boy?", ta: "நீங்கள் பெண்ணா ஆணா?",
    options: [
      { v: "female", icon: "👧", en: "Girl", ta: "பெண்", kw: ["girl", "female", "பெண்"] },
      { v: "male", icon: "👦", en: "Boy", ta: "ஆண்", kw: ["boy", "male", "ஆண்"] },
      { v: "other", icon: "🧑", en: "Other", ta: "மற்றவை", kw: ["other"] }
    ] },
  { key: "govt_school", en: "Did you study in a government school?", ta: "அரசுப் பள்ளியில் படித்தீர்களா?",
    options: [
      { v: true, icon: "✅", en: "Yes", ta: "ஆம்", kw: ["yes", "ஆம்", "ஆமா"] },
      { v: false, icon: "❌", en: "No", ta: "இல்லை", kw: ["no", "இல்லை"] }
    ] },
  { key: "category", en: "Your community category?", ta: "உங்கள் சமூகப் பிரிவு?",
    options: [
      { v: "general", icon: "👥", en: "General", ta: "பொது", kw: ["general", "பொது"] },
      { v: "obc", icon: "👥", en: "BC / OBC", ta: "பிசி / ஓபிசி", kw: ["bc", "obc"] },
      { v: "sc", icon: "👥", en: "SC", ta: "எஸ்சி", kw: ["sc"] },
      { v: "st", icon: "👥", en: "ST", ta: "எஸ்டி", kw: ["st"] },
      { v: "minority", icon: "👥", en: "Minority", ta: "சிறுபான்மை", kw: ["minority"] }
    ] },
  { key: "family_income_lakh", en: "Family income per year?", ta: "குடும்ப ஆண்டு வருமானம்?",
    options: [
      { v: 0.8, icon: "💰", en: "Below ₹1 lakh", ta: "₹1 லட்சத்திற்குள்", kw: ["below one", "less than one"] },
      { v: 2, icon: "💰", en: "₹1-2.5 lakh", ta: "₹1-2.5 லட்சம்", kw: ["two", "2"] },
      { v: 3.5, icon: "💰", en: "₹2.5-4.5 lakh", ta: "₹2.5-4.5 லட்சம்", kw: ["three", "four", "3", "4"] },
      { v: 6, icon: "💰", en: "Above ₹4.5 lakh", ta: "₹4.5 லட்சத்திற்கு மேல்", kw: ["five", "six", "above"] }
    ] },
  { key: "marks_percent", en: "Your marks in the last exam?", ta: "கடைசித் தேர்வில் மதிப்பெண்?",
    options: [
      { v: 45, icon: "📝", en: "Below 50%", ta: "50%க்கு கீழ்", kw: ["below 50", "less"] },
      { v: 65, icon: "📝", en: "50-75%", ta: "50-75%", kw: ["60", "70", "sixty", "seventy"] },
      { v: 82, icon: "📝", en: "75-90%", ta: "75-90%", kw: ["80", "eighty", "85"] },
      { v: 93, icon: "📝", en: "Above 90%", ta: "90%க்கு மேல்", kw: ["90", "ninety", "95"] }
    ] }
];

// Kavya's answers for the one-tap demo
const KAVYA = { name: "Kavya", district: "Villupuram", state: "TN", lang: "ta",
  interests: ["stitching"], age: 17, education: "c11_12", gender: "female", govt_school: true,
  category: "obc", family_income_lakh: 2, marks_percent: 82, disability: false };

const CAREERS = [
  { id: "fashion_tech", type: "professional", tags: ["stitching", "drawing"], min_edu: ["c11_12", "passed12"],
    title: { en: "Fashion Technology (Diploma / B.Des)", ta: "ஃபேஷன் டெக்னாலஜி" },
    why: "You already stitch for neighbours: that is real garment-construction skill.", earn: "₹15,000-30,000/month (indicative)",
    path: [["Learn pattern-making basics", "SWAYAM: search 'apparel'", "https://swayam.gov.in"],
           ["Practise 3 garments, photograph them as a portfolio", "Your own work", ""],
           ["Prepare for NIFT / state polytechnic entrance", "NIFT admissions", "https://www.nift.ac.in"],
           ["Apply for scholarships on the Radar", "National Scholarship Portal", "https://scholarships.gov.in"]],
    exams: ["NIFT entrance", "TN Polytechnic (DOTE) admission"] },
  { id: "garment_supervisor", type: "vocational", tags: ["stitching"], min_edu: ["c9_10", "c11_12", "passed12", "dropout"],
    title: { en: "Garment Unit Supervisor", ta: "ஆடைத் தொழிற்சாலை மேற்பார்வையாளர்" },
    why: "Tamil Nadu has a large garment industry; stitching + leadership = supervisor track.", earn: "₹12,000-22,000/month (indicative)",
    path: [["Short course: Sewing Machine Operator (PMKVY)", "Skill India Digital", "https://www.skillindiadigital.gov.in"],
           ["Apprenticeship at a garment unit (NAPS)", "Apprenticeship India", "https://www.apprenticeshipindia.gov.in"],
           ["Learn quality checks and line balancing", "SWAYAM", "https://swayam.gov.in"]],
    exams: ["None required"] },
  { id: "iti_sewing", type: "vocational", tags: ["stitching"], min_edu: ["c9_10", "c11_12", "passed12", "dropout"],
    title: { en: "ITI Sewing Technology", ta: "ஐடிஐ தையல் தொழில்நுட்பம்" },
    why: "A 1-year government trade course close to home; certificate employers recognise.", earn: "₹10,000-18,000/month or own shop (indicative)",
    path: [["Find the nearest Govt ITI with Sewing Technology", "Skill India Digital", "https://www.skillindiadigital.gov.in"],
           ["Apply in the state ITI admission window", "TN Skill Training Dept", "https://skilltraining.tn.gov.in"]],
    exams: ["ITI admission (merit based)"] },
  { id: "textile_design_digital", type: "emerging", tags: ["stitching", "drawing", "computers"], min_edu: ["c11_12", "passed12", "ug"],
    title: { en: "Digital Textile & Print Designer", ta: "டிஜிட்டல் துணி வடிவமைப்பாளர்" },
    why: "Emerging: online sellers need print designs; your stitching eye + free design tools.", earn: "₹500-2,000 per design online (indicative)",
    path: [["Free course: design basics", "SWAYAM", "https://swayam.gov.in"],
           ["Make 10 sample prints", "Your own work", ""]], exams: ["None"] },
  { id: "mobile_tech", type: "vocational", tags: ["phone_repair", "computers"], min_edu: ["c9_10", "c11_12", "passed12", "dropout"],
    title: { en: "Mobile Phone Technician", ta: "மொபைல் போன் டெக்னீஷியன்" },
    why: "Phone repair is in demand in every town.", earn: "₹10,000-25,000/month (indicative)",
    path: [["PMKVY Field Technician course", "Skill India Digital", "https://www.skillindiadigital.gov.in"]], exams: ["None"] },
  { id: "agri_drone", type: "emerging", tags: ["farming", "computers"], min_edu: ["c11_12", "passed12", "iti_diploma"],
    title: { en: "Agri-Drone Operator", ta: "விவசாய ட்ரோன் இயக்குநர்" },
    why: "Emerging: drones for spraying need trained local pilots.", earn: "indicative range to be verified",
    path: [["DGCA-approved remote pilot training", "Skill India Digital", "https://www.skillindiadigital.gov.in"]], exams: ["DGCA RPC"] },
  { id: "food_processing", type: "vocational", tags: ["cooking", "farming"], min_edu: ["c9_10", "c11_12", "passed12", "dropout"],
    title: { en: "Food Processing Technician", ta: "உணவு பதப்படுத்தும் தொழில்நுட்பர்" },
    why: "Cooking skill → packaged foods, a growing rural business.", earn: "₹10,000-20,000/month (indicative)",
    path: [["PMKVY food processing course", "Skill India Digital", "https://www.skillindiadigital.gov.in"]], exams: ["None"] },
  { id: "teacher", type: "govt", tags: ["drawing", "computers", "cooking", "farming", "stitching"], min_edu: ["c11_12", "passed12", "ug"],
    title: { en: "Teacher (D.El.Ed / B.Ed)", ta: "ஆசிரியர்" },
    why: "A stable government path that serves your own village.", earn: "per state pay scale",
    path: [["Finish Class 12, then D.El.Ed", "DIKSHA", "https://diksha.gov.in"]], exams: ["TN TET"] }
];

// Each rule: field, op, value, text. The ENGINE (not an LLM) evaluates these.
const OPPORTUNITIES = [
  { id: "pudhumai_penn", name: "Pudhumai Penn (TN)", type: "scholarship", benefit: "₹1,000/month during higher education",
    rules: [{ f: "gender", op: "in", v: ["female"], t: "For girl students" },
            { f: "state", op: "in", v: ["TN"], t: "Studied in Tamil Nadu" },
            { f: "govt_school", op: "eq", v: true, t: "Studied Class 6-12 in a government school" },
            { f: "education", op: "in", v: ["c11_12", "passed12"], t: "Joining higher education after Class 12" }],
    source_url: "https://www.myscheme.gov.in/schemes/pudhumai-penn-scheme", verified_by: null },
  { id: "central_sector", name: "Central Sector Scheme of Scholarship", type: "scholarship", benefit: "Annual scholarship for college",
    rules: [{ f: "education", op: "in", v: ["c11_12", "passed12"], t: "Class 12 student / passed" },
            { f: "marks_percent", op: "gte", v: 80, t: "Above 80th percentile in Class 12 board (approx.)" },
            { f: "family_income_lakh", op: "lte", v: 4.5, t: "Family income up to ₹4.5 lakh" }],
    source_url: "https://scholarships.gov.in", verified_by: null },
  { id: "post_matric_obc", name: "Post-Matric Scholarship (BC/OBC)", type: "scholarship", benefit: "Fees + maintenance allowance",
    rules: [{ f: "category", op: "in", v: ["obc"], t: "BC / OBC category" },
            { f: "education", op: "in", v: ["c11_12", "passed12", "iti_diploma", "ug"], t: "Studying after Class 10" },
            { f: "family_income_lakh", op: "lte", v: 2.5, t: "Family income up to ₹2.5 lakh" }],
    source_url: "https://scholarships.gov.in", verified_by: null },
  { id: "post_matric_sc", name: "Post-Matric Scholarship (SC)", type: "scholarship", benefit: "Fees + maintenance allowance",
    rules: [{ f: "category", op: "in", v: ["sc"], t: "SC category" },
            { f: "education", op: "in", v: ["c11_12", "passed12", "iti_diploma", "ug"], t: "Studying after Class 10" },
            { f: "family_income_lakh", op: "lte", v: 2.5, t: "Family income up to ₹2.5 lakh" }],
    source_url: "https://scholarships.gov.in", verified_by: null },
  { id: "nmms", name: "NMMS (Means-cum-Merit)", type: "scholarship", benefit: "₹12,000/year, Class 9-12",
    rules: [{ f: "education", op: "in", v: ["c9_10"], t: "Exam taken in Class 8, renewed from Class 9" },
            { f: "govt_school", op: "eq", v: true, t: "Government / aided school" },
            { f: "family_income_lakh", op: "lte", v: 3.5, t: "Family income up to ₹3.5 lakh" }],
    source_url: "https://education.gov.in/nmms", verified_by: null },
  { id: "naps", name: "NAPS Apprenticeship", type: "apprenticeship", benefit: "Monthly stipend while learning on the job",
    rules: [{ f: "age", op: "gte", v: 14, t: "At least 14 years (18 for hazardous trades)" },
            { f: "education", op: "in", v: ["c9_10", "c11_12", "passed12", "iti_diploma", "dropout"], t: "Meets trade's minimum education" }],
    source_url: "https://www.apprenticeshipindia.gov.in", verified_by: null },
  { id: "pmkvy", name: "PMKVY Short-Term Training", type: "training", benefit: "Free skill course + certificate",
    rules: [{ f: "age", op: "gte", v: 15, t: "Age 15 or above" }],
    source_url: "https://www.skillindiadigital.gov.in", verified_by: null }
];

const STUDENTS = [
  { student_id: "s1", name: "Kavya", ...KAVYA },
  { student_id: "s2", name: "Murugan", district: "Villupuram", state: "TN", interests: ["phone_repair"], age: 16, education: "c9_10", gender: "male", govt_school: true, category: "sc", family_income_lakh: 0.8, marks_percent: 65 },
  { student_id: "s3", name: "Divya", district: "Villupuram", state: "TN", interests: ["computers", "drawing"], age: 18, education: "passed12", gender: "female", govt_school: true, category: "sc", family_income_lakh: 2, marks_percent: 93 },
  { student_id: "s4", name: "Selvam", district: "Villupuram", state: "TN", interests: ["farming"], age: 19, education: "dropout", gender: "male", govt_school: true, category: "general", family_income_lakh: 2, marks_percent: 45 },
  { student_id: "s5", name: "Anitha", district: "Villupuram", state: "TN", interests: ["cooking"], age: 17, education: "c11_12", gender: "female", govt_school: false, category: "obc", family_income_lakh: 3.5, marks_percent: 65 }
];


// Additive UI translations: existing IDs, values, rules, and engine contracts remain unchanged.
const LANG_ADDITIONS={
 questions:[
  {hi:'आपको क्या करना अच्छा लगता है या आप किस काम में कुशल हैं?',ml:'നിങ്ങൾക്ക് ചെയ്യാൻ ഇഷ്ടമുള്ളതോ നന്നായി ചെയ്യാനറിയുന്നതോ എന്താണ്?'},
  {hi:'आपकी उम्र कितनी है?',ml:'നിങ്ങളുടെ പ്രായം എത്രയാണ്?'},
  {hi:'आप अभी किस कक्षा में पढ़ती/पढ़ते हैं?',ml:'നിങ്ങൾ ഇപ്പോൾ ഏത് ക്ലാസിലാണ്?'},
  {hi:'क्या आप लड़की हैं या लड़का?',ml:'നിങ്ങൾ പെൺകുട്ടിയാണോ ആൺകുട്ടിയാണോ?'},
  {hi:'क्या आपने सरकारी स्कूल में पढ़ाई की है?',ml:'നിങ്ങൾ സർക്കാർ സ്കൂളിൽ പഠിച്ചിട്ടുണ്ടോ?'},
  {hi:'आपकी समुदाय श्रेणी क्या है?',ml:'നിങ്ങളുടെ സമുദായ വിഭാഗം ഏതാണ്?'},
  {hi:'परिवार की सालाना आय कितनी है?',ml:'കുടുംബത്തിന്റെ വാർഷിക വരുമാനം എത്രയാണ്?'},
  {hi:'पिछली परीक्षा में आपके कितने अंक थे?',ml:'കഴിഞ്ഞ പരീക്ഷയിൽ നിങ്ങൾക്ക് എത്ര മാർക്ക് ലഭിച്ചു?'}
 ],
 options:[
  [['सिलाई','फोन मरम्मत','चित्र बनाना','कंप्यूटर','खेती','खाना बनाना'],['തയ്യൽ','ഫോൺ അറ്റകുറ്റപ്പണി','ചിത്രരചന','കമ്പ്യൂട്ടർ','കൃഷി','പാചകം']],
  [['15 वर्ष','16 वर्ष','17 वर्ष','18 वर्ष','19 वर्ष','20+'],['15 വയസ്','16 വയസ്','17 വയസ്','18 വയസ്','19 വയസ്','20+']],
  [['कक्षा 9–10','कक्षा 11–12','12वीं पूरी की','ITI / डिप्लोमा','कॉलेज','पढ़ाई छोड़ दी'],['ക്ലാസ് 9–10','ക്ലാസ് 11–12','പ്ലസ് ടു പൂർത്തിയാക്കി','ഐടിഐ / ഡിപ്ലോമ','കോളേജ്','പഠനം നിർത്തി']],
  [['लड़की','लड़का','अन्य'],['പെൺകുട്ടി','ആൺകുട്ടി','മറ്റുള്ളവർ']],
  [['हाँ','नहीं'],['അതെ','ഇല്ല']],
  [['सामान्य','BC / OBC','SC','ST','अल्पसंख्यक'],['ജനറൽ','BC / OBC','SC','ST','ന്യൂനപക്ഷം']],
  [['₹1 लाख से कम','₹1–2.5 लाख','₹2.5–4.5 लाख','₹4.5 लाख से अधिक'],['₹1 ലക്ഷത്തിൽ താഴെ','₹1–2.5 ലക്ഷം','₹2.5–4.5 ലക്ഷം','₹4.5 ലക്ഷത്തിന് മുകളിൽ']],
  [['50% से कम','50–75%','75–90%','90% से अधिक'],['50%-ൽ താഴെ','50–75%','75–90%','90%-ൽ കൂടുതൽ']]
 ],
 careers:{
 fashion_tech:{title:{hi:'फैशन टेक्नोलॉजी (डिप्लोमा / बी.डिज़ाइन)',ml:'ഫാഷൻ ടെക്നോളജി (ഡിപ്ലോമ / ബി.ഡിസൈൻ)'},why:{hi:'आप पड़ोसियों के लिए सिलाई करती हैं—यह कपड़े बनाने का वास्तविक कौशल है।',ml:'അയൽവാസികൾക്കായി തുന്നുന്ന പരിചയം വസ്ത്രനിർമാണത്തിലെ യഥാർത്ഥ കഴിവാണ്.'}},
 garment_supervisor:{title:{hi:'गारमेंट यूनिट सुपरवाइज़र',ml:'ഗാർമെന്റ് യൂണിറ്റ് സൂപ്പർവൈസർ'},why:{hi:'सिलाई के साथ नेतृत्व सीखकर गारमेंट यूनिट में पर्यवेक्षक की राह देखी जा सकती है।',ml:'തയ്യലിനൊപ്പം നേതൃത്വം പഠിച്ച് ഗാർമെന്റ് യൂണിറ്റിൽ സൂപ്പർവൈസർ ജോലി പരിഗണിക്കാം.'}},
 iti_sewing:{title:{hi:'ITI सिलाई टेक्नोलॉजी',ml:'ഐടിഐ തയ്യൽ ടെക്നോളജി'},why:{hi:'सरकारी ITI में सिलाई का प्रशिक्षण एक व्यावहारिक विकल्प हो सकता है।',ml:'സർക്കാർ ഐടിഐയിലെ തയ്യൽ പരിശീലനം പ്രായോഗികമായൊരു വഴിയാകാം.'}},
 textile_design_digital:{title:{hi:'डिजिटल टेक्सटाइल और प्रिंट डिज़ाइनर',ml:'ഡിജിറ്റൽ ടെക്സ്റ്റൈൽ, പ്രിന്റ് ഡിസൈനർ'},why:{hi:'सिलाई और डिज़ाइन में रुचि को डिजिटल टेक्सटाइल डिज़ाइन में आगे बढ़ाया जा सकता है।',ml:'തയ്യലിലും രൂപകൽപ്പനയിലുമുള്ള താൽപര്യം ഡിജിറ്റൽ ടെക്സ്റ്റൈൽ ഡിസൈനിലേക്ക് വളർത്താം.'}},
 mobile_tech:{title:{hi:'मोबाइल फोन तकनीशियन',ml:'മൊബൈൽ ഫോൺ ടെക്നീഷ്യൻ'},why:{hi:'फोन की मरम्मत सीखना एक उपयोगी तकनीकी कौशल है।',ml:'ഫോൺ അറ്റകുറ്റപ്പണി പഠിക്കുന്നത് പ്രയോജനകരമായ സാങ്കേതിക കഴിവാണ്.'}},
 agri_drone:{title:{hi:'कृषि ड्रोन ऑपरेटर',ml:'കാർഷിക ഡ്രോൺ ഓപ്പറേറ്റർ'},why:{hi:'कृषि में ड्रोन चलाने के लिए प्रशिक्षण और आवश्यक स्वीकृतियाँ जाँचें।',ml:'കൃഷിക്കായി ഡ്രോൺ പ്രവർത്തിപ്പിക്കാൻ പരിശീലനവും ആവശ്യമായ അംഗീകാരങ്ങളും പരിശോധിക്കുക.'}},
 food_processing:{title:{hi:'खाद्य प्रसंस्करण तकनीशियन',ml:'ഭക്ഷ്യ സംസ്കരണ ടെക്നീഷ്യൻ'},why:{hi:'खाना बनाने के कौशल को खाद्य प्रसंस्करण के प्रशिक्षण से जोड़ा जा सकता है।',ml:'പാചക കഴിവിനെ ഭക്ഷ്യസംസ്കരണ പരിശീലനവുമായി ബന്ധിപ്പിക്കാം.'}},
 teacher:{title:{hi:'शिक्षक (D.El.Ed / B.Ed)',ml:'അധ്യാപിക / അധ്യാപകൻ (D.El.Ed / B.Ed)'},why:{hi:'आगे की पढ़ाई और आवश्यक प्रशिक्षण के बाद शिक्षण पर विचार किया जा सकता है।',ml:'തുടർപഠനവും ആവശ്യമായ പരിശീലനവും കഴിഞ്ഞ് അധ്യാപന മേഖല പരിഗണിക്കാം.'}}
 },
 opportunity:{
 pudhumai_penn:{name:{hi:'पुदुमई पेन (तमिलनाडु)',ml:'പുതുമൈ പെൺ (തമിഴ്നാട്)'},benefit:{hi:'उच्च शिक्षा के दौरान मासिक सहायता (डेमो विवरण; सत्यापित करें)',ml:'ഉന്നതവിദ്യാഭ്യാസകാലത്തെ പ്രതിമാസ സഹായം (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 central_sector:{name:{hi:'केंद्रीय क्षेत्र छात्रवृत्ति योजना',ml:'സെൻട്രൽ സെക്ടർ സ്കോളർഷിപ്പ് പദ്ധതി'},benefit:{hi:'कॉलेज के लिए वार्षिक छात्रवृत्ति (डेमो विवरण; सत्यापित करें)',ml:'കോളേജിനുള്ള വാർഷിക സ്കോളർഷിപ്പ് (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 post_matric_obc:{name:{hi:'मैट्रिकोत्तर छात्रवृत्ति (BC/OBC)',ml:'പോസ്റ്റ് മെട്രിക് സ്കോളർഷിപ്പ് (BC/OBC)'},benefit:{hi:'फीस और रखरखाव सहायता (डेमो विवरण; सत्यापित करें)',ml:'ഫീസും പരിപാലന സഹായവും (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 post_matric_sc:{name:{hi:'मैट्रिकोत्तर छात्रवृत्ति (SC)',ml:'പോസ്റ്റ് മെട്രിക് സ്കോളർഷിപ്പ് (SC)'},benefit:{hi:'फीस और रखरखाव सहायता (डेमो विवरण; सत्यापित करें)',ml:'ഫീസും പരിപാലന സഹായവും (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 nmms:{name:{hi:'राष्ट्रीय साधन-सह-योग्यता छात्रवृत्ति (NMMS)',ml:'ദേശീയ മീൻസ്-കം-മെറിറ്റ് സ്കോളർഷിപ്പ് (NMMS)'},benefit:{hi:'वार्षिक सहायता (डेमो विवरण; सत्यापित करें)',ml:'വാർഷിക സഹായം (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 naps:{name:{hi:'राष्ट्रीय अप्रेंटिसशिप प्रोत्साहन योजना (NAPS)',ml:'ദേശീയ അപ്രന്റീസ്ഷിപ്പ് പ്രോത്സാഹന പദ്ധതി (NAPS)'},benefit:{hi:'काम के साथ सीखते समय मासिक वजीफा (डेमो विवरण; सत्यापित करें)',ml:'ജോലിക്കൊപ്പം പഠിക്കുമ്പോഴുള്ള പ്രതിമാസ സ്റ്റൈപൻഡ് (ഡെമോ വിവരം; പരിശോധിക്കുക)'}},
 pmkvy:{name:{hi:'प्रधानमंत्री कौशल विकास योजना (PMKVY)',ml:'പ്രധാനമന്ത്രി കൗശൽ വികാസ് യോജന (PMKVY)'},benefit:{hi:'कौशल पाठ्यक्रम और प्रमाणपत्र (डेमो विवरण; सत्यापित करें)',ml:'നൈപുണ്യ കോഴ്സും സർട്ടിഫിക്കറ്റും (ഡെമോ വിവരം; പരിശോധിക്കുക)'}}
 }
};
QUESTIONS.forEach((q,i)=>{q.hi=LANG_ADDITIONS.questions[i].hi;q.ml=LANG_ADDITIONS.questions[i].ml;q.options.forEach((o,j)=>{o.hi=LANG_ADDITIONS.options[i][0][j];o.ml=LANG_ADDITIONS.options[i][1][j]})});
CAREERS.forEach(c=>{const x=LANG_ADDITIONS.careers[c.id];if(!x)return;Object.assign(c.title,x.title);c.why_i18n={hi:x.why.hi,ml:x.why.ml}});
OPPORTUNITIES.forEach(o=>{const x=LANG_ADDITIONS.opportunity[o.id];if(!x)return;o.name_i18n=x.name;o.benefit_i18n=x.benefit;o.rules.forEach(r=>{r.hi=({gender:['लड़कियों के लिए','പെൺകുട്ടികൾക്കായി'],state:['तमिलनाडु में पढ़ाई','തമിഴ്നാട്ടിൽ പഠനം'],govt_school:['सरकारी स्कूल में पढ़ाई','സർക്കാർ സ്കൂളിൽ പഠനം'],education:['उच्च शिक्षा में प्रवेश','ഉന്നതവിദ്യാഭ്യാസത്തിലേക്ക് പ്രവേശനം'],marks_percent:['अंक संबंधी शर्त','മാർക്കുമായി ബന്ധപ്പെട്ട നിബന്ധന'],family_income_lakh:['परिवार की आय संबंधी शर्त','കുടുംബവരുമാന നിബന്ധന'],category:['BC / OBC श्रेणी','BC / OBC വിഭാഗം'],age:['न्यूनतम आयु शर्त','കുറഞ്ഞ പ്രായ നിബന്ധന']})[r.f]?.[0]||r.t;r.ml=({gender:['लड़कियों के लिए','പെൺകുട്ടികൾക്കായി'],state:['तमिलनाडु में पढ़ाई','തമിഴ്നാട്ടിൽ പഠനം'],govt_school:['सरकारी स्कूल में पढ़ाई','സർക്കാർ സ്കൂളിൽ പഠനം'],education:['उच्च शिक्षा में प्रवेश','ഉന്നतവിദ്യാഭ്യാസത്തിലേക്ക് പ്രവേശനം'],marks_percent:['अंक संबंधी शर्त','മാർക്കുമായി ബന്ധപ്പെട്ട നിബന്ധന'],family_income_lakh:['परिवार की आय संबंधी शर्त','കുടുംബവരുമാന നിബന്ധന'],category:['BC / OBC श्रेणी','BC / OBC വിഭാഗം'],age:['न्यूनतम आयु शर्त','കുറഞ്ഞ പ്രായ നിബന്ധന']})[r.f]?.[1]||r.t})});