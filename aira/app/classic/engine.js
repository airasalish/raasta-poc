// Rules engine + matcher. Runs fully on-device, so eligibility works offline.
// The same JSON rules will be evaluated by the Python backend (Gautam).

function checkRule(profile, r) {
  const val = profile[r.f];
  if (val === undefined || val === null) return null; // unknown -> "maybe"
  switch (r.op) {
    case "eq": return val === r.v;
    case "in": return r.v.includes(val);
    case "gte": return val >= r.v;
    case "lte": return val <= r.v;
    default: return null;
  }
}

function eligibility(profile) {
  return OPPORTUNITIES.map(o => {
    const reasons = o.rules.map(r => ({ rule: r.f, passed: checkRule(profile, r), text: r.t }));
    const status = reasons.some(x => x.passed === false) ? "not_eligible"
                 : reasons.some(x => x.passed === null) ? "maybe" : "eligible";
    return { opportunity_id: o.id, name: o.name, type: o.type, benefit: o.benefit, status, reasons,
             source_url: o.source_url, verified: !!o.verified_by };
  }).sort((a, b) => ["eligible", "maybe", "not_eligible"].indexOf(a.status) - ["eligible", "maybe", "not_eligible"].indexOf(b.status));
}

function matchCareers(profile) {
  const interests = profile.interests || [];
  // Matching needs at least one skill/interest; without one we return [] and the UI asks or shows a balanced fallback.
  if (!interests.length) return [];
  const edu = profile.education;
  const scored = CAREERS.map(c => {
    const hits = c.tags.filter(t => interests.includes(t)).length;
    let s = hits * 10;
    if (edu !== undefined && edu !== null) s += c.min_edu.includes(edu) ? 3 : -8; // unknown education: no penalty
    return { ...c, score: s, hits };
  }).filter(c => c.hits > 0 && c.score > 0).sort((a, b) => b.score - a.score || b.hits - a.hits);
  // Always surface at least one vocational and one emerging option if available
  const pick = scored.slice(0, 4);
  for (const t of ["vocational", "emerging"]) {
    if (!pick.some(c => c.type === t)) { const x = scored.find(c => c.type === t); if (x) pick.push(x); }
  }
  return pick;
}

function talentFlag(profile) {
  return (profile.marks_percent >= 80) || ((profile.interests || []).length >= 2);
}
