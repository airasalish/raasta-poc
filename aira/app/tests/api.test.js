// Run: node aira/app/tests/api.test.js  -- origin allowlist + rate limit (no network)
const assert = require('assert');
const { allowedOrigin, tooMany } = require('../api/_sarvam.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };
const req = (origin, ip = '1.2.3.4') => ({ headers: { origin, 'x-forwarded-for': ip } });
ok('own site allowed', () => assert(allowedOrigin(req('https://raasta-poc.vercel.app'))));
ok('localhost allowed', () => assert(allowedOrigin(req('http://localhost:5173'))));
ok('other sites blocked', () => assert(!allowedOrigin(req('https://evil.example.com'))));
ok('rate limit: 40 per minute per IP, then 429', () => {
  const t = 1e12; let blocked = 0;
  for (let i = 0; i < 45; i++) if (tooMany(req('x', '9.9.9.9'), t + i)) blocked++;
  assert.strictEqual(blocked, 5);
});
ok('rate limit resets after a minute', () => assert(!tooMany(req('x', '9.9.9.9'), 1e12 + 61000)));
ok('different IPs are counted separately', () => assert(!tooMany(req('x', '8.8.8.8'), 1e12)));
console.log(n + ' tests passed');
