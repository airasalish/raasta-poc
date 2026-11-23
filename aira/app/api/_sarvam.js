// Shared helpers for the Sarvam voice proxy. The key is read from the
// SARVAM_API_KEY environment variable on Vercel and never sent to the browser.
const LOCALES = new Set(['ta-IN', 'en-IN', 'hi-IN', 'ml-IN']);

function key() {
  return (process.env.SARVAM_API_KEY || '').trim();
}

// Only our own pages may spend credits.
function allowedOrigin(req) {
  const o = req.headers.origin || req.headers.referer || '';
  if (!o) return true; // same-origin GETs may omit it
  try {
    const h = new URL(o).hostname;
    const extra = (process.env.ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
    return h === 'localhost' || h === '127.0.0.1' || h === 'raasta-poc.vercel.app' ||
      /^raasta-[a-z0-9-]+-airasalishs-projects\.vercel\.app$/.test(h) || extra.includes(h);
  } catch (e) { return false; }
}

// Best-effort per-IP limit (per server instance) so one client can't drain the Sarvam credits.
// Default 40 calls per minute; override with RATE_PER_MIN in Vercel env.
const hits = new Map();
function tooMany(req, now = Date.now()) {
  const limit = parseInt(process.env.RATE_PER_MIN, 10) || 40;
  const ip = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = { LOCALES, key, allowedOrigin, tooMany, send, readRaw };
