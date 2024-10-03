import {globSync} from 'glob';

let globConfig = {
	nocase: true,
	ignore: [
		'**/node_modules/**',
		'**/.mops/**',
		'**/.vessel/**',
		'**/.git/**',
	],
};

export function globMoFiles(rootDir : string) {
	// return globSync('{src,test?(s)}/**/*.mo', {cwd: rootDir, ...globConfig});
	return globSync('src/**/*.mo', {cwd: rootDir, ...globConfig});
}