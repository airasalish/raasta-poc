const { key, allowedOrigin, send, readRaw } = require('./_sarvam');

// Adaptive conversation turn.
// POST { lang, history:[{role:'user'|'assistant', content}], profile, skills:[...] }
// -> { reply, updates:{field:value}, skills:[{label}], suggestions:[...], done }
// The model discovers the student through conversation; the server only accepts
// profile values that the rules engine (engine.js) understands.
const LANG = { 'ta-IN': 'Tamil', 'en-IN': 'English', 'hi-IN': 'Hindi', 'ml-IN': 'Malayalam' };
const FIELDS = {
  age: 'integer 13-30',
  education: ['c9_10', 'c11_12', 'passed12', 'iti_diploma', 'ug', 'dropout'],
  gender: ['female', 'male', 'other'],
  govt_school: [true, false],
  category: ['general', 'obc', 'sc', 'st', 'minority'],
  family_income_lakh: 'number in lakh rupees per year, e.g. 0.8, 2, 3.5, 6',
  marks_percent: 'number 0-100 (latest exam)'
};
const TAGS = ['stitching', 'drawing', 'computers', 'phone_repair', 'farming', 'cooking'];

function clean(updates) {
  const out = {};
  if (!updates || typeof updates !== 'object') return out;
  for (const [k, v] of Object.entries(updates)) {
    if (k === 'interests' && Array.isArray(v)) { const t = v.filter(x => TAGS.includes(x)); if (t.length) out.interests = t; }
    else if (Array.isArray(FIELDS[k])) { if (FIELDS[k].includes(v)) out[k] = v; }
    else if (k === 'age' && Number.isFinite(+v) && +v >= 10 && +v <= 40) out.age = Math.round(+v);
    else if (k === 'family_income_lakh' && Number.isFinite(+v) && +v >= 0 && +v < 100) out.family_income_lakh = +v;
    else if (k === 'marks_percent' && Number.isFinite(+v) && +v >= 0 && +v <= 100) out.marks_percent = +v;
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!key()) return send(res, 503, { error: 'Sarvam not configured' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'forbidden' });
  let b;
  try { b = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRaw(req, 60000)).toString('utf8') || '{}'); }
  catch (e) { return send(res, 400, { error: 'bad json' }); }
  const lang = LANG[b.lang] || 'English';
  const history = (Array.isArray(b.history) ? b.history : []).slice(-16)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 600) }));
  if (!history.length || history[history.length - 1].role !== 'user') return send(res, 400, { error: 'last message must be the student' });
  const profile = b.profile && typeof b.profile === 'object' ? b.profile : {};
  const known = Object.keys(FIELDS).filter(k => profile[k] !== undefined && profile[k] !== null);
  const missing = Object.keys(FIELDS).filter(k => !known.includes(k));
  const skills = (Array.isArray(b.skills) ? b.skills : []).slice(0, 20).map(s => String(s).slice(0, 60));

  const MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations';
  const lastQ = [...history].reverse().find(m => m.role === 'assistant');
  const answer = history[history.length - 1].content;
  // Fields already asked once: if the student skipped them, we move on instead of asking again.
  const asked = (Array.isArray(b.asked) ? b.asked : []).filter(k => k in FIELDS);
  const ASK = {
    age: 'how old they are',
    education: 'which class they are in now, or the last class they finished',
    gender: 'whether they are a girl or a boy (some scholarships are only for girls)',
    govt_school: 'whether they study in a government school',
    category: 'their community category: General, OBC/BC, SC, ST or minority (only for scholarships; they may skip)',
    family_income_lakh: 'roughly how much their family earns in a year, in lakhs',
    marks_percent: 'their marks percentage in the last exam'
  };

  const extractSystem =
`Extract facts from a student's answer. The question was: "${lastQ ? lastQ.content : ''}". The answer may be in any Indian language or a speech transcript.
Return ONLY a JSON object: {"updates":{"<field>":{"value":<value>,"quote":"<exact words from the answer that state it>"}},"skills":[...]}
updates: include a field ONLY if the answer explicitly states it, or it is a direct short answer to the question (e.g. question about income, answer "4" -> family_income_lakh 4); never guess. Fields: ${Object.entries(FIELDS).map(([k, v]) => k + ': ' + (Array.isArray(v) ? v.join('|') : v)).join('; ')}; interests: array from [${TAGS.join(',')}] only if clearly related (e.g. sewing = stitching).
skills: abilities, interests or experiences shown in the answer, as short English labels (e.g. "Dance", "Teaching children", "Shop accounts"). [] if none.`;

  const call = (messages, max) => fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'api-subscription-key': key(), 'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: max })
  }).then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('sarvam ' + r.status + ' ' + (j.error && j.error.message || '')); return String(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); });

  try {
    // 1) Understand this answer first, so the reply never asks for something just answered.
    const extractText = await call([{ role: 'system', content: extractSystem }, { role: 'user', content: answer }], 220).catch(() => '');
    let ex = {};
    try { const m = extractText.match(/\{[\s\S]*\}/); ex = m ? JSON.parse(m[0]) : {}; } catch (e) { ex = {}; }
    const norm = x => String(x || '').toLowerCase().replace(/[\s.,!?'"]+/g, '');
    const raw = {};
    for (const [k, v] of Object.entries(ex.updates && typeof ex.updates === 'object' ? ex.updates : {})) {
      if (v && typeof v === 'object' && !Array.isArray(v) && 'value' in v) {
        if (v.quote && norm(answer).includes(norm(v.quote))) raw[k] = v.value; // keep only facts backed by the student's own words
      } else if (k === 'interests') raw[k] = v;
    }
    const updates = clean(raw);
    const newSkills = (Array.isArray(ex.skills) ? ex.skills : []).map(s => String(s).slice(0, 40)).filter(Boolean).slice(0, 5);
    const allSkills = [...new Set([...skills, ...newSkills])];
    const nowKnown = Object.keys(FIELDS).filter(k => known.includes(k) || updates[k] !== undefined);
    const toAsk = Object.keys(FIELDS).filter(k => !nowKnown.includes(k) && !asked.includes(k));
    const userTurns = history.filter(m => m.role === 'user').length;

    // 2) Decide the stage in code, not in the model: discover skills, then facts one by one, then finish.
    const factsStarted = asked.length > 0 || known.length > 0;
    let stage, next = null;
    if (!factsStarted && userTurns < 3) stage = 'discover';
    else if (toAsk.length) { stage = 'fact'; next = toAsk[0]; }
    else stage = 'finish';

    const base = `You are Raahi, a warm career guide for rural Indian students. Reply ONLY in ${lang}, plain text, max 2 short sentences, simple words a 15-year-old understands (it is read aloud). Never promise jobs, money or scholarships. Never invent facts. Never say "you already told me".`;
    const task = stage === 'discover'
      ? `Acknowledge exactly what they said, then ask ONE follow-up question about their skills or interests (how they learned it, who they do it for, have they taught it or earned from it). If they say "I don't know", ask about a normal day or what people ask their help with. Skills noticed so far: ${allSkills.join(', ') || 'none'}.`
      : stage === 'fact'
        ? `Briefly thank them for the answer (one short phrase). Then ask ONLY this, nothing else: ${ASK[next]}. Do NOT ask about hobbies, interests, sports or skills again.`
        : `Thank them warmly in one sentence and tell them their career routes are ready to see. Do NOT ask any question.`;
    const replyText = await call([{ role: 'system', content: base + '\n' + task }, ...history], 200);
    const reply = replyText.replace(/^["'`]+|["'`]+$/g, '').slice(0, 500);
    if (!reply) return send(res, 502, { error: 'no reply' });
    return send(res, 200, {
      reply,
      updates,
      skills: newSkills,
      suggestions: [],
      asking: next,
      done: stage === 'finish'
    });
  } catch (e) {
    return send(res, 502, { error: 'sarvam unreachable', detail: String(e.message || e).slice(0, 200) });
  }
};
