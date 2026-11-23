// Run: node aira/app/tests/chat.test.js   (no dependencies, no network: Sarvam is mocked)
const assert = require('assert');
process.env.SARVAM_API_KEY = 'test-key';
const chat = require('../api/chat.js');
const { decide, clean } = chat;
let n = 0; const ok = async (name, fn) => { await fn(); n++; console.log('ok', name); };
const base = { known: [], updates: {}, asked: [], retried: [], lastAsking: null, answer: '', userTurns: 1 };

// Fake Sarvam: first call = extraction JSON, second = reply text.
function mockSarvam(extraction, reply = 'Okay. Next question?') {
  const calls = [];
  global.fetch = async (url, opts) => {
    calls.push(JSON.parse(opts.body));
    const content = calls.length === 1 ? JSON.stringify(extraction) : reply;
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
  };
  return calls;
}
function run(body) {
  return new Promise(resolve => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(s) { resolve({ status: this.statusCode, body: JSON.parse(s) }); } };
    chat({ method: 'POST', body, headers: { origin: 'https://raasta-poc.vercel.app' } }, res);
  });
}
const Q = { role: 'assistant', content: 'What do you enjoy doing?' };

(async () => {
  await ok('discover first, facts later', () => assert.strictEqual(decide({ ...base }).stage, 'discover'));
  await ok('facts start after 3 turns', () => { const d = decide({ ...base, userTurns: 3 }); assert.strictEqual(d.stage, 'fact'); assert.strictEqual(d.next, 'age'); });
  await ok('uncaught answer is asked once more', () => {
    const d = decide({ ...base, userTurns: 5, asked: ['age'], lastAsking: 'age', answer: 'hmm' });
    assert.deepStrictEqual([d.next, d.retry], ['age', true]);
  });
  await ok('second miss -> declined, move on', () => {
    const d = decide({ ...base, userTurns: 6, asked: ['age'], retried: ['age'], lastAsking: 'age', answer: 'hmm' });
    assert.strictEqual(d.declined, 'age'); assert.strictEqual(d.next, 'education'); assert.strictEqual(d.retry, false);
  });
  for (const no of ["I don't want to say", 'சொல்ல விருப்பமில்லை', 'नहीं बताना', 'അറിയില്ല', 'skip'])
    await ok('refusal respected: ' + no, () => {
      const d = decide({ ...base, userTurns: 5, asked: ['family_income_lakh'], lastAsking: 'family_income_lakh', answer: no });
      assert.strictEqual(d.declined, 'family_income_lakh'); assert.notStrictEqual(d.next, 'family_income_lakh');
    });
  await ok('caught answer is never re-asked', () => {
    const d = decide({ ...base, userTurns: 5, asked: ['age'], lastAsking: 'age', updates: { age: 16 } });
    assert.strictEqual(d.next, 'education'); assert.strictEqual(d.retry, false);
  });
  await ok('all facts known -> finish', () => {
    const all = ['age', 'education', 'gender', 'govt_school', 'category', 'family_income_lakh', 'marks_percent'];
    assert.strictEqual(decide({ ...base, userTurns: 8, known: all, asked: all }).stage, 'finish');
  });
  await ok('hard stop at 12 turns', () => assert.strictEqual(decide({ ...base, userTurns: 12, asked: ['age'] }).stage, 'finish'));
  await ok('clean() rejects bad values', () => {
    assert.deepStrictEqual(clean({ age: 200, gender: 'robot', marks_percent: 150, interests: ['hacking'] }), {});
    assert.deepStrictEqual(clean({ age: '16', interests: ['sports', 'x'] }), { age: 16, interests: ['sports'] });
  });

  // Full handler with mocked Sarvam
  await ok('interest without a matching quote is dropped ("study" -> no computers)', async () => {
    mockSarvam({ updates: { interests: { value: ['computers'], quote: 'computers' } }, skills: ['Studying'] });
    const r = await run({ lang: 'en-IN', history: [Q, { role: 'user', content: 'study' }], profile: {}, skills: [] });
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.updates.interests, undefined);
  });
  await ok('bare interest (no quote object) is dropped', async () => {
    mockSarvam({ updates: { interests: ['computers'] }, skills: [] });
    const r = await run({ lang: 'en-IN', history: [Q, { role: 'user', content: 'I like cooking' }], profile: {}, skills: [] });
    assert.strictEqual(r.body.updates.interests, undefined);
  });
  await ok('quoted fact accepted ("4" for income)', async () => {
    mockSarvam({ updates: { family_income_lakh: { value: 4, quote: '4' } }, skills: [] });
    const r = await run({ lang: 'en-IN', history: [{ role: 'assistant', content: 'Family income in lakhs?' }, { role: 'user', content: '4' }], profile: { age: 16 }, skills: [], asked: ['age', 'family_income_lakh'], lastAsking: 'family_income_lakh' });
    assert.strictEqual(r.body.updates.family_income_lakh, 4); assert.notStrictEqual(r.body.asking, 'family_income_lakh');
  });
  await ok('invented fact (quote not in answer) rejected', async () => {
    mockSarvam({ updates: { age: { value: 17, quote: 'I am 17' } }, skills: [] });
    const r = await run({ lang: 'en-IN', history: [Q, { role: 'user', content: 'I dance' }], profile: {}, skills: [] });
    assert.strictEqual(r.body.updates.age, undefined);
  });
  await ok('finish uses the fixed Tamil closing, no model call', async () => {
    const calls = mockSarvam({ updates: {}, skills: [] });
    const all = ['age', 'education', 'gender', 'govt_school', 'category', 'family_income_lakh', 'marks_percent'];
    const prof = { age: 16, education: 'c11_12', gender: 'female', govt_school: true, category: 'obc', family_income_lakh: 2, marks_percent: 80 };
    const r = await run({ lang: 'ta-IN', history: [Q, { role: 'user', content: 'சரி' }], profile: prof, skills: [], asked: all });
    assert.strictEqual(r.body.done, true); assert(/நன்றி/.test(r.body.reply)); assert.strictEqual(calls.length, 1);
  });
  await ok('Sarvam down -> 502 (app falls back to tapping)', async () => {
    global.fetch = async () => { throw new Error('down'); };
    const r = await run({ lang: 'en-IN', history: [Q, { role: 'user', content: 'hi' }], profile: {}, skills: [] });
    assert.strictEqual(r.status, 502);
  });
  console.log(n + ' tests passed');
})().catch(e => { console.error(e); process.exit(1); });
