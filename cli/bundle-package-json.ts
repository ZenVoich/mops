import {readFileSync, writeFileSync} from 'node:fs';

let packageJson = JSON.parse(readFileSync('./bundle/package.json', 'utf8'));

delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson.overrides;
packageJson.dependencies = {
	'decomp-tarxz': packageJson.dependencies['decomp-tarxz'],
	'buffer': packageJson.dependencies['buffer'],
};

writeFileSync('./bundle/package.json', JSON.stringify(packageJson, null, '  '));