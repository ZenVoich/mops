import path from 'node:path';
import {getRootDir} from '../../mops.js';

export function absToRel(p: string) {
	let rootDir = getRootDir();
	return path.relative(rootDir, path.resolve(p));
}