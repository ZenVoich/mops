import {execSync} from 'node:child_process';
import {getMocPath} from './get-moc-path.js';

export function getMocVersion(): string {
	let mocPath = getMocPath();
	let match = execSync(mocPath).toString().trim().match(/Motoko compiler ([^\s]+) .*/);
	return match?.[1] || '';
}