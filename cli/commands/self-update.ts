import child_process from 'node:child_process';

export function selfUpdate({detached = false} = {}) {
	console.log('Updating mops CLI...');
	child_process.spawn('npm', ['install', 'ic-mops', '-g'], {stdio: 'inherit', detached});
}