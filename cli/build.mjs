import esbuild from 'esbuild';
import metaUrlPlugin from '@chialab/esbuild-plugin-meta-url';

await esbuild.build({
	entryPoints: ['./cli.js'],
	outfile: 'dist/cli.js',
	bundle: true,
	// minify: true,
	platform: 'node',
	format: 'cjs',
	plugins: [metaUrlPlugin()],
});
