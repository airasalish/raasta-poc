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
    source_url: "https://www.pudhumaipenn.tn.gov.in", verified_by: null },
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
    source_url: "https://scholarships.gov.in", verified_by: null },
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
