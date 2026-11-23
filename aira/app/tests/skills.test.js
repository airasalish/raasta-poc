// Run: node aira/app/tests/skills.test.js  -- free-text skill -> tag mapping (from app.js) and matching for each family
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const dir = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8') + ';this.D={CAREERS,STEP_I18N};', ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'engine.js'), 'utf8') + ';this.E={matchCareers};', ctx);
vm.runInContext(app.slice(app.indexOf('const SKILL_TAGS'), app.indexOf('const TYPE_TXT')) + ';this.T={skillTags};', ctx);
const { skillTags } = ctx.T, { matchCareers } = ctx.E, { CAREERS } = ctx.D;
let n = 0;
const cases = [
  ['Dance', 'performing_arts', 'performing_arts'], ['Singing devotional songs', 'performing_arts', 'performing_arts'],
  ['Football', 'sports', 'sports_coach'], ['Fan repair', 'electrical', 'electrician'], ['Mixie repair', 'electrical', 'appliance_tech'],
  ['Driving tractor', 'driving', 'driver'], ['Mehendi', 'beauty', 'beautician'], ['Shop billing', 'accounts', 'accounts_assistant'],
  ['Caring for grandmother', 'care', 'health_assistant'], ['Pigeon training', 'animals', 'animal_care'], ['Stitching blouses', 'stitching', 'iti_sewing'],
  ['Cooking', 'cooking', 'food_processing']
];
for (const [skill, tag, career] of cases) {
  const tags = skillTags([skill]);
  assert(tags.includes(tag), skill + ' -> ' + tag + ' (got ' + tags + ')');
  const ids = matchCareers({ interests: tags, education: 'c11_12' }).map(c => c.id);
  assert(ids.includes(career), skill + ' should reach ' + career + ' (got ' + ids + ')');
  n++; console.log('ok', skill, '->', tag, '->', career);
}
for (const s of ['Studying', 'Watching TV', 'Nothing']) { assert.strictEqual(skillTags([s]).length, 0, s); n++; console.log('ok', s, '-> no tag (no guessing)'); }
CAREERS.forEach(c => { assert(c.title.ta && c.title.hi && c.title.ml, c.id + ' titles'); assert(c.path.every(p => !p[2] || /^https:\/\//.test(p[2])), c.id + ' links'); });
n++; console.log('ok every career has 4-language titles and https links');
CAREERS.forEach(c => c.path.forEach(p => ['ta', 'hi', 'ml'].forEach(l => assert(ctx.D.STEP_I18N[p[0]] && ctx.D.STEP_I18N[p[0]][l], c.id + ' step ' + l + ': ' + p[0]))));
n++; console.log('ok every pathway step is translated to ta, hi, ml');
console.log(n + ' tests passed');
