// Run: node aira/app/tests/engine.test.js   (no dependencies)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const dir = path.join(__dirname, '..');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8') + ';this.D={QUESTIONS,CAREERS,OPPORTUNITIES,KAVYA};', ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'engine.js'), 'utf8') + ';this.E={eligibility,matchCareers};', ctx);
const { CAREERS, OPPORTUNITIES, KAVYA } = ctx.D, { eligibility, matchCareers } = ctx.E;
const ids = p => matchCareers(p).map(c => c.id);
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

ok('no interests -> no guessing', () => assert.strictEqual(ids({ education: 'c11_12' }).length, 0));
ok('dancer gets performing arts, not garments', () => {
  const r = ids({ interests: ['performing_arts'], education: 'c11_12' });
  assert(r.includes('performing_arts')); assert(!r.some(x => ['fashion_tech', 'garment_supervisor', 'iti_sewing'].includes(x)));
});
ok('appliance repair -> electrician + appliance tech', () => {
  const r = ids({ interests: ['electrical'], education: 'dropout' });
  assert(r.includes('electrician') && r.includes('appliance_tech'));
});
ok('footballer -> sports coach', () => assert(ids({ interests: ['sports'], education: 'passed12' }).includes('sports_coach')));
ok('unknown education is not penalised', () => {
  const a = matchCareers({ interests: ['farming'] }).find(c => c.id === 'agri_drone');
  assert(a && a.score === 10);
});
ok('Kavya still gets stitching routes', () => assert(ids(KAVYA).includes('fashion_tech')));
ok('every career and scheme has Tamil text', () => {
  CAREERS.forEach(c => { assert(c.title.ta, c.id + ' title.ta'); assert(c.why_i18n && c.why_i18n.ta, c.id + ' why.ta'); });
  OPPORTUNITIES.forEach(o => { assert(o.name_i18n && o.name_i18n.ta, o.id + ' name.ta'); o.rules.forEach(r => assert(r.ta, o.id + ' rule.ta: ' + r.t)); });
});
ok('Central Sector label no longer claims percent = percentile', () => {
  const r = OPPORTUNITIES.find(o => o.id === 'central_sector').rules.find(x => x.f === 'marks_percent');
  assert(/approx/.test(r.t) && /percentile/.test(r.t) && /80%/.test(r.t));
});
ok('eligibility: missing info -> maybe, never eligible', () => eligibility({}).forEach(e => assert.strictEqual(e.status, 'maybe')));
ok('Kavya eligibility unchanged', () => {
  const s = Object.fromEntries(eligibility(KAVYA).map(e => [e.opportunity_id, e.status]));
  assert.strictEqual(s.pudhumai_penn, 'eligible'); assert.strictEqual(s.post_matric_sc, 'not_eligible');
});
console.log(n + ' tests passed');
