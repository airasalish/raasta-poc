// Run: node aira/app/tests/parent.test.js   (no dependencies)
// Parent voice note built by Nandana's script builder (parentMode.js) from the app's real data.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const dir = path.join(__dirname, '..');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8') + ';this.D={CAREERS,KAVYA,MURUGAN,STEP_I18N};', ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'engine.js'), 'utf8') + ';this.E={matchCareers};', ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'parentMode.js'), 'utf8') + ';this.P={parentNoteFor,PARENT_MAX_WORDS};', ctx);
const { CAREERS, KAVYA, MURUGAN, STEP_I18N } = ctx.D, { matchCareers } = ctx.E, { parentNoteFor, PARENT_MAX_WORDS } = ctx.P;
const career = id => CAREERS.find(c => c.id === id);
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

ok('English note names the student and the route', () => {
  const r = parentNoteFor(MURUGAN, career('mobile_tech'), 'en', STEP_I18N);
  assert(r && r.text.includes('Murugan'));
  assert(r.text.includes('Mobile'));
});
ok('Tamil note uses the Tamil name, not English letters for it', () => {
  const r = parentNoteFor(MURUGAN, career('mobile_tech'), 'ta', STEP_I18N);
  assert(r && r.text.includes('முருகன்'));
  assert(!/Murugan/.test(r.text));
});
ok('Tamil note includes the first step in Tamil (from STEP_I18N)', () => {
  const c = career('mobile_tech'); const step = STEP_I18N[c.path[0][0]].ta;
  assert(parentNoteFor(MURUGAN, c, 'ta', STEP_I18N).text.includes(step));
});
ok('never speaks a salary, even if a career has one', () => {
  const c = Object.assign({}, career('fashion_tech'), { earn: '₹15,000-30,000/month (indicative)' });
  for (const lang of ['en', 'ta', 'hi', 'ml']) { const t = parentNoteFor(KAVYA, c, lang, STEP_I18N).text; assert(!/₹|rupees|ரூபாய்|can earn|a month|சம்பாதிக்க/i.test(t), t); }
});
ok('scholarships come from the rules engine (Murugan is SC: post-matric SC named)', () => {
  const t = parentNoteFor(MURUGAN, career('mobile_tech'), 'en', STEP_I18N).text;
  assert(/scholarship/i.test(t));
});
ok('stays within the ~60 second word budget', () => {
  for (const lang of ['en', 'ta', 'hi', 'ml']) for (const p of [KAVYA, MURUGAN]) {
    const c = matchCareers(p)[0]; const r = parentNoteFor(p, c, lang, STEP_I18N);
    assert(r.words <= PARENT_MAX_WORDS[lang], lang + ' ' + r.words);
  }
});
ok('Hindi and Malayalam notes use local name, scheme names and first step', () => {
  const c = career('mobile_tech'), first = c.path[0][0];
  for (const [lang, name] of [['hi', 'मुरुगन'], ['ml', 'മുരുഗൻ']]) {
    const t = parentNoteFor(MURUGAN, c, lang, STEP_I18N).text;
    assert(t.includes(name) && !/Murugan/.test(t), t);
    assert(t.includes(STEP_I18N[first][lang]) && !t.includes(first), t);
    assert(!/NMMS \(Means/.test(t) && !/₹|rupees|रुपये|രൂപ/.test(t), t);
  }
});
ok('falls back (null) for no name or bad data', () => {
  assert.strictEqual(parentNoteFor({ ...MURUGAN, name: '' }, career('mobile_tech'), 'en', STEP_I18N), null);
  assert.strictEqual(parentNoteFor(MURUGAN, null, 'en', STEP_I18N), null);
});
ok('AI route with a plain-string title still works', () => {
  const r = parentNoteFor(MURUGAN, { id: 'ai_x', title: 'Phone repair shop assistant', path: [], earn: '₹9,000-12,000/month' }, 'en', STEP_I18N);
  assert(r && r.text.includes('Phone repair shop assistant') && !/₹|rupees/.test(r.text));
});
ok('live demo student Meena is named in Tamil, Hindi and Malayalam', () => {
  const c = career('textile_design_digital');
  for (const [lang, name] of [['ta', 'மீனா'], ['hi', 'मीना'], ['ml', 'മീന']]) assert(parentNoteFor({ ...KAVYA, name: 'Meena' }, c, lang, STEP_I18N).text.includes(name), lang);
});
console.log(n + ' tests passed');
