// Run every test: node aira/app/tests/run-all.js
const { execFileSync } = require('child_process');
const path = require('path');
let failed = 0;
for (const f of ['engine.test.js', 'skills.test.js', 'chat.test.js', 'api.test.js']) {
  try { const out = execFileSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' }); console.log(f.padEnd(16), out.trim().split('\n').pop()); }
  catch (e) { failed++; console.log(f.padEnd(16), 'FAILED\n' + (e.stdout || '') + (e.stderr || '')); }
}
process.exit(failed ? 1 : 0);
