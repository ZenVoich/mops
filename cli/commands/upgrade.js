import child_process from 'child_process';

export function upgrade() {
	console.log('Upgrading mops CLI...');
	child_process.execSync('npm i ic-mops -g', {stdio: 'inherit'});
}