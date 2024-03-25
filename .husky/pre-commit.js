import {promisify} from 'node:util';
import {exec} from 'node:child_process';

let execAsync = promisify(exec);

try {
	await Promise.all([
		execAsync('npm run lint'),
		execAsync('npm run test'),
		execAsync('npm run check', {cwd: 'cli'}),
		execAsync('npm run check', {cwd: 'frontend'}),
	]);
}
catch (error) {
	console.error(error.stdout);
	console.error(error.stderr);
	process.exit(error.code);
}