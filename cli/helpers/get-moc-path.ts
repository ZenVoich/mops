import {execSync} from 'node:child_process';

export function getMocPath(): string {
	let mocPath = process.env.DFX_MOC_PATH;
	if (!mocPath) {
		mocPath = execSync('dfx cache show').toString().trim() + '/moc';
	}
	if (!mocPath) {
		mocPath = 'moc';
	}
	return mocPath;
}