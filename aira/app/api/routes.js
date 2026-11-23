const { key, allowedOrigin, send, readRaw, tooMany } = require('./_sarvam');

// POST { lang, skills:[...], profile } -> { routes:[{ id, title, type, why, earn:'', path:[[step, label, url]], exams:[] }] }
// Career routes built from the student's own Skill Genome (e.g. singing, dance, shop accounts),
// not only from the fixed catalogue. Links are limited to trusted public sites.
const LANG = { 'ta-IN': 'Tamil', 'en-IN': 'English', 'hi-IN': 'Hindi', 'ml-IN': 'Malayalam' };
const RESOURCES = {
  swayam: ['SWAYAM', 'swayam.gov.in'],
  nptel: ['NPTEL', 'nptel.ac.in'],
  ncs: ['National Career Service', 'ncs.gov.in'],
  skillindia: ['Skill India Digital', 'skillindiadigital.gov.in'],
  apprenticeship: ['Apprenticeship India', 'apprenticeshipindia.gov.in'],
  diksha: ['DIKSHA', 'diksha.gov.in'],
  nsp: ['National Scholarship Portal', 'scholarships.gov.in'],
  tnskill: ['TN Skill Training', 'skilltraining.tn.gov.in'],
  ignou: ['IGNOU', 'ignou.ac.in'],
  nios: ['NIOS', 'nios.ac.in'],
  none: ['', '']
};
const TYPES = ['vocational', 'professional', 'emerging', 'govt'];
const EDU = { c9_10: 'Class 9-10', c11_12: 'Class 11-12', passed12: 'Passed Class 12', iti_diploma: 'ITI/Diploma', ug: 'College', dropout: 'Left school' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!key()) return send(res, 503, { error: 'Sarvam not configured' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'forbidden' });
  if (tooMany(req)) return send(res, 429, { error: 'too many requests' });
  let b;
  try { b = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRaw(req, 20000)).toString('utf8') || '{}'); }
  catch (e) { return send(res, 400, { error: 'bad json' }); }
  const skills = (Array.isArray(b.skills) ? b.skills : []).slice(0, 12).map(s => String(s).slice(0, 50)).filter(Boolean);
  if (!skills.length) return send(res, 400, { error: 'skills required' });
  const p = b.profile && typeof b.profile === 'object' ? b.profile : {};
  const lang = LANG[b.lang] || 'English';
  const who = [p.age && `age ${p.age}`, EDU[p.education], p.gender, p.govt_school === true && 'government school', 'Tamil Nadu, rural'].filter(Boolean).join(', ');

  const system =
`Suggest 3 realistic career routes in India for a rural student (${who}) whose skills and interests are: ${skills.join(', ')}.
Routes must come DIRECTLY from these skills (e.g. singing -> playback/devotional singer, music teacher, sound/recording assistant). Mix one vocational or low-cost route, one study route, and one emerging route. No salary numbers, no promises.
Return ONLY JSON: {"routes":[{"title":"<route name in ${lang}>","job":"<the everyday English name of the job people do, 1-3 words, e.g. groundskeeper, playback singer, tailor>","type":"vocational|professional|emerging|govt","why":"<one sentence in ${lang} linking to their skill>","steps":[{"step":"<short step in ${lang}>","course":"<a SPECIFIC real course, certificate or programme name in English, e.g. Certificate in Carnatic Music, Sound Recording Assistant (QP), or empty>","site":"swayam|nptel|skillindia|apprenticeship|ncs|diksha|ignou|nios|tnskill|none"}, 4 steps total],"exams":["<real course/exam/certificate names, English>"]}]}`;

  try {
    const r = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'api-subscription-key': key(), 'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations',
        messages: [{ role: 'system', content: system }, { role: 'user', content: 'Skills: ' + skills.join(', ') + '. Reply with the JSON only.' }],
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'sarvam chat ' + r.status });
    const text = String(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
    const m = text.match(/\{[\s\S]*\}/);
    let out = {};
    try { out = m ? JSON.parse(m[0]) : {}; } catch (e) { out = {}; }
    const routes = (Array.isArray(out.routes) ? out.routes : []).slice(0, 4).map((x, i) => ({
      id: 'ai:' + i,
      title: String(x.title || '').slice(0, 80),
      job: String(x.job || '').replace(/[^A-Za-z \-]/g, '').slice(0, 40).trim(),
      type: TYPES.includes(x.type) ? x.type : 'emerging',
      why: String(x.why || '').slice(0, 240),
      earn: '',
      path: (Array.isArray(x.steps) ? x.steps : []).slice(0, 4).map(s => { const rsc = RESOURCES[s && s.site] || RESOURCES.none; const course = String(s && s.course || '').replace(/[<>]/g, '').slice(0, 80).trim(); const url = rsc[1] ? 'https://www.google.com/search?q=' + encodeURIComponent((course || '') + ' site:' + rsc[1]) : ''; return [String(s && s.step || '').slice(0, 120), course ? course + ' · ' + rsc[0] : rsc[0], url]; }).filter(s => s[0]),
      exams: (Array.isArray(x.exams) ? x.exams : []).slice(0, 4).map(e => String(e).slice(0, 60)),
      ai: true
    })).filter(x => x.title && x.path.length);
    if (!routes.length) return send(res, 502, { error: 'no routes', raw: text.slice(0, 200) });
    return send(res, 200, { routes });
  } catch (e) {
    return send(res, 502, { error: 'sarvam unreachable' });
  }
};
