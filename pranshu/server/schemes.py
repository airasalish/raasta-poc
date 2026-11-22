POST_MATRIC = {
    "school_11_12", "iti", "aicte_diploma", "aicte_degree", "degree", "diploma_other",
}
HIGHER_ED = {"iti", "aicte_diploma", "aicte_degree", "degree", "diploma_other"}
REGULAR_DEGREE = {"aicte_degree", "degree"}
AICTE_COURSES = {"aicte_degree", "aicte_diploma"}

INCOME_MAX = {"below_2_5": 2.5, "to_4_5": 4.5, "to_8": 8.0, "above_8": 99.0}

CHECKED = "21 Nov 2026"

SCHEMES = [
    {
        "id": "pragati",
        "name": "AICTE Pragati Scholarship for Girls",
        "pays": "₹50,000 a year",
        "value": 50000,
        "who": "Girls in the first year (or lateral-entry second year) of an AICTE-approved degree or diploma. Family income up to ₹8 lakh a year. Not with another government scholarship.",
        "url": "https://scholarships.gov.in",
        "source": "AICTE Pragati FAQ and NSP 2026-27",
        "steps": AICTE_COURSES,
        "gender": "girl",
        "income_max": 8.0,
        "exclusive": True,
    },
    {
        "id": "csss",
        "name": "PM-USP Central Sector Scholarship (CSSS)",
        "pays": "₹12,000 a year for the first three years of a degree, ₹20,000 in later years",
        "value": 12000,
        "who": "Class 12 marks in the top 20% of your board and stream, a regular degree course (not diploma), family income up to ₹4.5 lakh a year. Not with another scholarship.",
        "url": "https://scholarships.gov.in",
        "source": "Ministry of Education CSSS FAQ and NSP 2026-27",
        "steps": REGULAR_DEGREE,
        "income_max": 4.5,
        "exclusive": True,
    },
    {
        "id": "pudhumai_penn",
        "name": "Pudhumai Penn (Tamil Nadu)",
        "pays": "₹1,000 a month until the first degree, diploma or ITI course is done",
        "value": 12000,
        "who": "Girls who studied class 6 to 12 in a Tamil Nadu government school, or Tamil-medium government-aided school. No income limit. Can be taken with other scholarships.",
        "url": "https://pudhumaipenn.tn.gov.in",
        "source": "Tamil Nadu Higher Education Policy Note 2026-27",
        "steps": HIGHER_ED,
        "state": "tamil_nadu",
        "gender": "girl",
        "govt_school": True,
    },
    {
        "id": "tamil_pudhalvan",
        "name": "Tamil Pudhalvan (Tamil Nadu)",
        "pays": "₹1,000 a month until the first degree, diploma or ITI course is done",
        "value": 12000,
        "who": "Boys who studied class 6 to 12 in a Tamil Nadu government school, or Tamil-medium government-aided school. No income limit. Can be taken with other scholarships.",
        "url": "https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/tamil-pudhalvan",
        "source": "Tamil Nadu Social Welfare Department",
        "steps": HIGHER_ED,
        "state": "tamil_nadu",
        "gender": "boy",
        "govt_school": True,
    },
    {
        "id": "pms_sc",
        "name": "Post-Matric Scholarship for SC Students",
        "pays": "Course fees plus a yearly allowance, by course group",
        "value": 20000,
        "who": "SC students after class 10, family income up to ₹2.5 lakh a year.",
        "url": "https://scholarships.gov.in",
        "source": "PIB, Ministry of Social Justice, Aug 2026",
        "steps": POST_MATRIC,
        "category": "sc",
        "income_max": 2.5,
    },
    {
        "id": "pms_st",
        "name": "Post-Matric Scholarship for ST Students",
        "pays": "Course fees plus a yearly allowance, by course group",
        "value": 20000,
        "who": "ST students after class 10, family income up to ₹2.5 lakh a year.",
        "url": "https://scholarships.gov.in",
        "source": "NSP Post-Matric scheme list 2026-27",
        "steps": POST_MATRIC,
        "category": "st",
        "income_max": 2.5,
    },
    {
        "id": "yasasvi",
        "name": "PM-YASASVI Post-Matric Scholarship (OBC, EBC, DNT)",
        "pays": "Academic allowance and fee support, by course group",
        "value": 10000,
        "who": "OBC, EBC or DNT students after class 10, family income up to ₹2.5 lakh a year.",
        "url": "https://scholarships.gov.in",
        "source": "NSP Post-Matric OBC guidelines",
        "steps": POST_MATRIC,
        "category": "obc",
        "income_max": 2.5,
    },
    {
        "id": "naps_stipend",
        "name": "NAPS-2 Stipend Support",
        "pays": "The government pays 25% of your stipend, up to ₹1,500 a month, into your bank account",
        "value": 8000,
        "who": "Apprentices registered on the National Apprenticeship Portal.",
        "url": "https://www.apprenticeshipindia.gov.in",
        "source": "PIB, Ministry of Skill Development, Aug 2026",
        "steps": {"apprenticeship"},
    },
    {
        "id": "pmkvy",
        "name": "PMKVY 4.0 Free Skill Training",
        "pays": "Free training, assessment and certificate. Travel or stay support for women in many centres",
        "value": 15000,
        "who": "Youth, including school and college dropouts, who register on Skill India Digital.",
        "url": "https://www.skillindiadigital.gov.in",
        "source": "PMKVY 4.0 guidelines, MSDE",
        "steps": {"short_course", "diploma_other"},
    },
    {
        "id": "vidyalaxmi",
        "name": "PM-Vidyalaxmi Education Loan",
        "pays": "Loan without collateral. 3% interest help on loans up to ₹10 lakh, full interest help for family income up to ₹4.5 lakh in technical courses",
        "value": 5000,
        "who": "Students admitted on merit to a top quality college. Family income up to ₹8 lakh a year for interest help.",
        "url": "https://pmvidyalaxmi.co.in",
        "source": "PM-Vidyalaxmi guidelines and PIB, Jul 2026",
        "steps": REGULAR_DEGREE | {"aicte_diploma"},
        "income_max": 8.0,
        "budget": {"none", "little"},
    },
]

BY_ID = {s["id"]: s for s in SCHEMES}


def fits_student(scheme: dict, facts: dict) -> tuple[bool, list[str]]:
    """Return whether a scheme can apply to this student, and conditions still to confirm."""
    notes = []
    if scheme.get("gender") and facts.get("gender") != scheme["gender"]:
        return False, notes
    if scheme.get("state") and facts.get("state") != scheme["state"]:
        return False, notes
    if scheme.get("govt_school"):
        answer = facts.get("govt_school")
        if answer == "no":
            return False, notes
        if answer != "yes":
            notes.append("Only if you studied class 6 to 12 in a government school.")
    if scheme.get("category") and facts.get("category") != scheme["category"]:
        return False, notes
    if scheme.get("budget") and facts.get("budget") not in scheme["budget"]:
        return False, notes
    limit = scheme.get("income_max")
    if limit:
        income = facts.get("income")
        if income in INCOME_MAX:
            if INCOME_MAX[income] > limit:
                return False, notes
        else:
            notes.append(f"Only if family income is up to ₹{limit:g} lakh a year.")
    return True, notes


def candidates(facts: dict) -> list[dict]:
    return [s for s in SCHEMES if fits_student(s, facts)[0]]


def attach(steps: list[dict], facts: dict) -> dict | None:
    """Put each eligible scheme on the first road step it fits. Returns the best scheme overall."""
    used = set()
    best = None
    for step in steps:
        matches = []
        for scheme in SCHEMES:
            if scheme["id"] in used or step.get("study_type") not in scheme["steps"]:
                continue
            ok, notes = fits_student(scheme, facts)
            if not ok:
                continue
            used.add(scheme["id"])
            matches.append({
                "id": scheme["id"],
                "name": scheme["name"],
                "pays": scheme["pays"],
                "who": scheme["who"],
                "notes": notes,
                "url": scheme["url"],
                "source": scheme["source"],
                "checked": CHECKED,
                "value": scheme["value"],
                "exclusive": scheme.get("exclusive", False),
            })
        matches.sort(key=lambda m: m["value"], reverse=True)
        if matches:
            matches[0]["best"] = True
            if best is None or matches[0]["value"] > best["value"]:
                best = matches[0]
        step["schemes"] = matches
    return best
