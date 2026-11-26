// Copies the app's data and engine files into the presenter, so the offline replay uses the same data.
// Run from aira/: node presenter/sync-from-app.js   (then bump CACHE in presenter/sw.js and redeploy)
const fs = require('fs');
for (const f of ['data.js', 'kb_slice.js', 'engine.js', 'parentMode.js']) fs.copyFileSync('app/' + f, 'presenter/' + f);
console.log('copied 4 files from app/');
