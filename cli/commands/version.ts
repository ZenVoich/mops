import fs from 'node:fs';

export function version() {
	let packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)).toString());
	return packageJson.version;
}