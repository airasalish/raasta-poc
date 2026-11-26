"""Cut the on-phone slice of Pranshu's knowledge base (raasta-local-db) into aira/app/kb_slice.js.

Run:  python -I build_slice.py <path to raasta.db> <output kb_slice.js>
Rule: for each trade family, NAPS apprenticeship openings in Tamil Nadu posted in 2026
(status open, newest first, max 6), the all-India 2026 count, and official NCO 2015 codes.
"""
import json, sqlite3, sys

STATE = "Tamil Nadu"
YEAR = "2026"
PER_FAMILY = 6

FAMILIES = {
    "stitching": {"courses": ["%tailor%", "%sewing%", "%garment%", "%fashion%", "%embroider%", "%printing textile%", "%textile%", "%stitching%"],
                  "nco": ["7531.0100", "8153.0101", "2163.0600"]},
    "electrical": {"courses": ["electrician%", "%wireman%", "%solar%"], "nco": ["7411.0100", "9313.0501"]},
    "phone": {"courses": ["%mobile%", "%electronics mechanic%", "%smartphone%", "%telecom%"], "nco": []},
    "appliance": {"courses": ["%refrigeration%", "%air condition%", "%appliance%", "%consumer electronics%"], "nco": []},
    "food": {"courses": ["%food%", "%bak%", "%commis%", "%cook%"], "nco": ["7512.0100"]},
    "beauty": {"courses": ["%beaut%", "%hair%", "%make up%", "%makeup%", "%cosmetolog%"], "nco": []},
    "health": {"courses": ["%general duty%", "%patient%", "%nursing%", "%phlebotom%", "%home health%", "%health worker%"], "nco": []},
    "driving": {"courses": ["%driver%", "%delivery%"], "nco": ["8322.0501", "8321.0201"]},
    "accounts": {"courses": ["%account%", "%data entry%", "%billing%", "%office assistant%"], "nco": []},
    "computers": {"courses": ["%computer operator%", "%data entry%", "%software%", "%ict system%"], "nco": []},
    "animal": {"courses": ["%dairy%", "%poultry%", "%animal%", "%livestock%", "%fish%"], "nco": []},
    "agri": {"courses": ["%agri%", "%farm%", "%drone%", "%irrigation%", "%horticult%"], "nco": []},
}
# NCO name patterns for families without hand-picked codes (first matches with a qualification pack win)
NCO_FIND = {
    "phone": ["%mobile phone%", "%telephone%repair%"], "appliance": ["%refrigerat%", "%air%condition%", "%domestic%appliance%"],
    "food": ["%food%process%", "%baker%"], "beauty": ["%beaut%", "%hair%dress%"], "health": ["%general duty%", "%nursing%aid%", "%health%worker%"],
    "driving": ["%car%driver%", "%motor%driver%", "%delivery%"], "accounts": ["%accounts%clerk%", "%account%assistant%", "%bookkeep%"],
    "computers": ["%data entry%", "%computer operator%"], "animal": ["%dairy%", "%poultry%", "%livestock%"], "agri": ["%drone%", "%field crop%", "%farm%"],
}

def where(pats):
    return "(" + " OR ".join(["lower(course_name) LIKE ?"] * len(pats)) + ")"

def main(db, out):
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    c.row_factory = sqlite3.Row
    fams = {}
    for name, f in FAMILIES.items():
        w = where(f["courses"]) + " AND status='1' AND substr(created_at,1,4)=?"
        args = [p.lower() for p in f["courses"]] + [YEAR]
        india = c.execute(f"SELECT count(*) FROM naps_opportunities WHERE {w}", args).fetchone()[0]
        tn = c.execute(f"SELECT count(*) FROM naps_opportunities WHERE {w} AND state_name=?", args + [STATE]).fetchone()[0]
        rows = c.execute(f"""SELECT course_name, establishment_name, city, district_name, stipend_from, stipend_upto,
                                    qualifications_text, code, created_at
                             FROM naps_opportunities WHERE {w} AND state_name=?
                             ORDER BY created_at DESC LIMIT 60""", args + [STATE]).fetchall()
        openings = [{"t": r["course_name"].replace("\ufffd", "-").strip(), "emp": (r["establishment_name"] or "").strip(),
                     "place": ", ".join(dict.fromkeys(x for x in [(r["city"] or "").strip(" ,").title(), (r["district_name"] or "").strip(" ,").title()] if x)),
                     "from": int(float(r["stipend_from"] or 0)), "upto": int(float(r["stipend_upto"] or 0)),
                     "qual": (r["qualifications_text"] or "").strip(), "code": r["code"], "posted": r["created_at"][:10]} for r in rows]
        seen = set(); uniq = []
        for o in openings:
            k = (o["t"].lower(), o["emp"].lower())
            if k not in seen:
                seen.add(k); uniq.append(o)
        openings = uniq[:PER_FAMILY]
        nco = []
        codes = list(f["nco"])
        if not codes:
            for pat in NCO_FIND.get(name, []):
                for r in c.execute("""SELECT nco_code FROM nco_occupations WHERE lower(occupation_name) LIKE ?
                                      ORDER BY (qualification_pack_reference IN ('NA','#N/A','')) LIMIT 1""", (pat,)):
                    if r[0] not in codes:
                        codes.append(r[0])
                if len(codes) >= 2:
                    break
        for code in codes:
            r = c.execute("SELECT nco_code, occupation_name, nswf_level, qualification_pack_reference FROM nco_occupations WHERE nco_code=?", (code,)).fetchone()
            if r:
                clean = lambda v: "" if v in (None, "NA", "#N/A") else str(v).strip()
                nco.append({"code": r[0], "name": " ".join(r[1].split()), "nsqf": clean(r[2]), "qp": clean(r[3])})
        fams[name] = {"india": india, "state": tn, "openings": openings, "nco": nco}
        print(f"{name:11} india={india:5} TN={tn:4} shown={len(openings)} nco={[n['code']+' '+n['name'] for n in nco]}")
    meta = {"snapshot": "22 Nov 2026", "state": STATE, "year": YEAR,
            "source": "NAPS public apprenticeship openings + NCO 2015, from the Raasta knowledge base (Pranshu Verma)",
            "portal": "https://www.apprenticeshipindia.gov.in"}
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("// Generated by aira/kb/build_slice.py from Pranshu's local knowledge base. Do not edit by hand.\n")
        fh.write("const KB_SLICE = " + json.dumps({"meta": meta, "families": fams}, ensure_ascii=False, separators=(",", ":")) + ";\n")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
