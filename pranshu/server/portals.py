PORTALS = {
    "SWAYAM": {
        "url": "https://swayam.gov.in",
        "about": "Free online courses from school level to degree, with certificates.",
    },
    "DIKSHA": {
        "url": "https://diksha.gov.in",
        "about": "School lessons and textbooks for classes 1 to 12, by board and language.",
    },
    "Skill India Digital": {
        "url": "https://www.skillindiadigital.gov.in",
        "about": "Free short skill courses under PMKVY, training centres near you, and certificates.",
    },
    "NAPS": {
        "url": "https://www.apprenticeshipindia.gov.in",
        "about": "Apprenticeships with a monthly stipend, listed by trade and district.",
    },
    "NSP": {
        "url": "https://scholarships.gov.in",
        "about": "National Scholarship Portal for central and many state scholarships.",
    },
    "NTA": {
        "url": "https://nta.ac.in",
        "about": "Official site for national entrance exams such as JEE Main, NEET UG and CUET.",
    },
    "NCVT MIS": {
        "url": "https://www.ncvtmis.gov.in",
        "about": "Official list of ITIs and trades, to find a government ITI near you.",
    },
    "NIRF": {
        "url": "https://www.nirfindia.org",
        "about": "Government ranking of colleges and universities, by subject.",
    },
    "AICTE": {
        "url": "https://www.aicte-india.org",
        "about": "Approving body for engineering, diploma and other technical colleges.",
    },
    "NCS": {
        "url": "https://www.ncs.gov.in",
        "about": "National Career Service: job listings, job fairs and career counselling.",
    },
}

FINDERS = {
    "school_11_12": ["DIKSHA"],
    "exam_prep": ["NTA", "SWAYAM"],
    "short_course": ["Skill India Digital"],
    "iti": ["NCVT MIS", "Skill India Digital"],
    "aicte_diploma": ["AICTE"],
    "aicte_degree": ["AICTE", "NIRF"],
    "degree": ["NIRF", "SWAYAM"],
    "diploma_other": ["Skill India Digital"],
    "apprenticeship": ["NAPS"],
    "practice": ["SWAYAM"],
    "job": ["NCS"],
}


def portal_card(name: str, tip: str = "") -> dict | None:
    portal = PORTALS.get(name)
    if not portal:
        return None
    return {"name": name, "url": portal["url"], "about": portal["about"], "tip": tip}
