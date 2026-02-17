const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'ait-src');
const dist = path.join(__dirname, 'ait-dist');

fs.mkdirSync(dist, { recursive: true });
for (const file of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, file), path.join(dist, file));
}
console.log('ait-dist/ ready');
