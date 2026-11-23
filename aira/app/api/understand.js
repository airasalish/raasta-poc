const { key, allowedOrigin, send, readRaw, tooMany } = require('./_sarvam');

// POST { lang, question, options:[{v,label}], answer }
// -> { value: <option v or null>, unsure: bool, reply: short warm sentence in the student's language }
// Uses Sarvam's chat model with the same SARVAM_API_KEY. Only called when the free keyword matcher fails.
const LANG = { 'ta-IN': 'Tamil', 'en-IN': 'English', 'hi-IN': 'Hindi', 'ml-IN': 'Malayalam' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!key()) return send(res, 503, { error: 'Sarvam not configured' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'forbidden' });
  if (tooMany(req)) return send(res, 429, { error: 'too many requests' });
  let b;
  try { b = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRaw(req, 20000)).toString('utf8') || '{}'); }
  catch (e) { return send(res, 400, { error: 'bad json' }); }
  const answer = String(b.answer || '').slice(0, 400).trim();
  const options = Array.isArray(b.options) ? b.options.slice(0, 10).map(o => ({ v: o.v, label: String(o.label || '').slice(0, 60) })) : [];
  if (!answer || !options.length) return send(res, 400, { error: 'answer and options required' });
  const lang = LANG[b.lang] || 'English';

  const system = `You are Raahi, a warm career guide talking with a rural Indian school student by voice. ` +
    `You asked: "${String(b.question || '').slice(0, 200)}". Options (value: label): ` +
    options.map(o => `${JSON.stringify(o.v)}: ${o.label}`).join('; ') + `. ` +
    `Read the student's answer (it may be in any Indian language, informal, or a speech-to-text transcript with errors). ` +
    `Return ONLY a JSON object: {"value": <the matching option value exactly as given, or null>, "unsure": <true only if the student says they don't know / nothing / not sure>, "reply": "<one or two short, kind sentences in ${lang}>"}. ` +
    `Pick a value only if the answer clearly means that option (synonyms and close meanings count, e.g. sewing clothes = stitching). ` +
    `If the answer is about something not in the options (e.g. singing), set value null and in the reply appreciate it and ask which listed option is closest. ` +
    `Never invent facts about scholarships, money or eligibility. No markdown.`;

  try {
    const r = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'api-subscription-key': key(), 'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations',
        messages: [{ role: 'system', content: system }, { role: 'user', content: answer }],
        temperature: 0.2,
        max_tokens: 400
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'sarvam chat ' + r.status, detail: j && (j.error && j.error.message || j.message) });
    let text = String(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '');
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    const m = text.match(/\{[\s\S]*\}/);
    let out = {};
    try { out = m ? JSON.parse(m[0]) : {}; } catch (e) { out = {}; }
    const valid = options.some(o => JSON.stringify(o.v) === JSON.stringify(out.value));
    return send(res, 200, {
      value: valid ? out.value : null,
      unsure: !!out.unsure && !valid,
      reply: typeof out.reply === 'string' ? out.reply.slice(0, 400) : ''
    });
  } catch (e) {
    return send(res, 502, { error: 'sarvam unreachable' });
  }
};
