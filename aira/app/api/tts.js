const { LOCALES, key, allowedOrigin, send, readRaw } = require('./_sarvam');

// POST { text, lang } -> { audio: <base64 wav> }
module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!key()) return send(res, 503, { error: 'Sarvam not configured' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'forbidden' });
  let body;
  try {
    body = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRaw(req, 20000)).toString('utf8') || '{}');
  } catch (e) { return send(res, 400, { error: 'bad json' }); }
  const text = String(body.text || '').trim().slice(0, 1200); // cap spend per call
  const lang = LOCALES.has(body.lang) ? body.lang : 'en-IN';
  if (!text) return send(res, 400, { error: 'text required' });
  const payload = {
    text,
    language_code: lang,
    model: process.env.SARVAM_TTS_MODEL || 'bulbul:v3',
    pace: 0.95
  };
  if (process.env.SARVAM_SPEAKER) payload.speaker = process.env.SARVAM_SPEAKER;
  try {
    const r = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': key(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'sarvam tts ' + r.status, detail: j && j.error && j.error.message });
    const audio = Array.isArray(j.audios) ? j.audios.join('') : '';
    if (!audio) return send(res, 502, { error: 'no audio' });
    return send(res, 200, { audio });
  } catch (e) {
    return send(res, 502, { error: 'sarvam unreachable' });
  }
};
