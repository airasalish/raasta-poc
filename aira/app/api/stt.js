const { LOCALES, key, allowedOrigin, send, readRaw } = require('./_sarvam');

// POST raw audio (webm/ogg/mp4/wav) with ?lang=ta-IN -> { transcript }
module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!key()) return send(res, 503, { error: 'Sarvam not configured' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'forbidden' });
  const url = new URL(req.url, 'http://x');
  const lang = LOCALES.has(url.searchParams.get('lang')) ? url.searchParams.get('lang') : 'unknown';
  const type = String(req.headers['content-type'] || 'audio/webm').split(';')[0];
  const ext = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3' }[type] || 'webm';
  let audio;
  try { audio = await readRaw(req, 3 * 1024 * 1024); } catch (e) { return send(res, e.status || 400, { error: 'bad audio' }); }
  if (!audio.length) return send(res, 400, { error: 'empty audio' });
  const form = new FormData();
  form.append('file', new Blob([audio], { type }), 'speech.' + ext);
  form.append('model', process.env.SARVAM_STT_MODEL || 'saaras:v4');
  form.append('mode', 'transcribe');
  form.append('language_code', lang);
  try {
    const r = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': key() },
      body: form
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'sarvam stt ' + r.status, detail: j && j.error && j.error.message });
    return send(res, 200, { transcript: j.transcript || '', language: j.language_code || null });
  } catch (e) {
    return send(res, 502, { error: 'sarvam unreachable' });
  }
};
