import {readFileSync, writeFileSync} from 'node:fs';

let text = readFileSync('dist/package.json', 'utf8');
let json = JSON.parse(text);
delete json.scripts;
writeFileSync('dist/package.json', JSON.stringify(json, null, 2));