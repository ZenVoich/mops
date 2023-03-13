import child_process from 'child_process';

export function selfUpdate({detached = false} = {}) {
	console.log('Updating mops CLI...');
	child_process.execSync('npm i ic-mops -g', {stdio: 'inherit', detached});
}