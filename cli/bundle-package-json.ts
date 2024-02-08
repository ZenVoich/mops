import {readFileSync, writeFileSync} from 'node:fs';

let packageJson = JSON.parse(readFileSync('./bundle/package.json', 'utf8'));

delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson.overrides
;
packageJson.dependencies = {
	'decomp-tarxz': packageJson.dependencies['decomp-tarxz'],
};

writeFileSync('./bundle/package.json', JSON.stringify(packageJson, null, '  '));