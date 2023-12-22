import fs from 'node:fs';
import {Command, Argument, Option} from 'commander';
import chalk from 'chalk';

import {init} from './commands/init.js';
import {publish} from './commands/publish.js';
import {importPem} from './commands/import-identity.js';
import {sources} from './commands/sources.js';
import {checkApiCompatibility, setNetwork, apiVersion, checkConfigFile, getNetworkFile} from './mops.js';
import {getNetwork} from './api/network.js';
import {whoami} from './commands/whoami.js';
import {installAll} from './commands/install-all.js';
import {search} from './commands/search.js';
import {add} from './commands/add.js';
import {cacheSize, cleanCache} from './cache.js';
import {test} from './commands/test/test.js';
import {template} from './commands/template.js';
import {selfUpdate} from './commands/self-update.js';
import {remove} from './commands/remove.js';
import {getUserProp, setUserProp} from './commands/user.js';
import {bump} from './commands/bump.js';
import {sync} from './commands/sync.js';
import {outdated} from './commands/outdated.js';
import {update} from './commands/update.js';
import {bench} from './commands/bench.js';
import {transferOwnership} from './commands/transfer-ownership.js';
import {toolchain} from './commands/toolchain/index.js';
import {Tool} from './types.js';
// import {docs} from './commands/docs.js';

declare global {
	// eslint-disable-next-line no-var
	var MOPS_NETWORK: string;
}

let networkFile = getNetworkFile();
if (fs.existsSync(networkFile)) {
	globalThis.MOPS_NETWORK = fs.readFileSync(networkFile).toString() || 'ic';
}

let program = new Command();

program.name('mops');

// --version
let packageJson = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url)).toString());
program.version(`CLI ${packageJson.version}\nAPI ${apiVersion}`, '-v --version');

// init
program
	.command('init')
	.description('Initialize a new project or package in the current directory')
	.option('-y, --yes', 'Accept all defaults')
	.action(async (options) => {
		await init(options);
	});

// add
program
	.command('add <pkg>')
	.description('Install the package and save it to mops.toml')
	.option('--dev', 'Add to [dev-dependencies] section')
	.option('--verbose')
	.addOption(new Option('--lock <action>', 'Lockfile action').choices(['update', 'ignore']))
	.action(async (pkg, options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await add(pkg, options);
	});

// remove
program
	.command('remove <pkg>')
	.alias('rm')
	.description('Remove package and update mops.toml')
	.option('--dev', 'Remove from dev-dependencies instead of dependencies')
	.option('--verbose', 'Show more information')
	.option('--dry-run', 'Do not actually remove anything')
	.addOption(new Option('--lock <action>', 'Lockfile action').choices(['update', 'ignore']))
	.action(async (pkg, options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await remove(pkg, options);
	});

// install
program
	.command('install [pkg]')
	.alias('i')
	.description('Install all dependencies specified in mops.toml')
	.option('--verbose')
	.addOption(new Option('--lock <action>', 'Lockfile action').choices(['check', 'update', 'ignore']))
	.action(async (pkg, options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}

		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		await toolchain.ensureToolchainInited({strict: false});

		if (pkg) {
			// @deprecated
			console.log(chalk.yellow('Consider using the \'mops add\' command to install a specific package.'));
			await add(pkg, options);
		}
		else {
			await installAll(options);
			await toolchain.installAll(options);
		}
	});

// publish
program
	.command('publish')
	.description('Publish package to the mops registry')
	.option('--no-docs', 'Do not generate docs')
	.option('--no-test', 'Do not run tests')
	.action(async (options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		let compatible = await checkApiCompatibility();
		if (compatible) {
			await publish(options);
		}
	});

// set-network
program
	.command('set-network <network>')
	.alias('sn')
	.description('Set network local|staging|ic')
	.action(async (network) => {
		await setNetwork(network);
		console.log(`Selected '${network}' network`);
	});

// get-network
program
	.command('get-network')
	.alias('gn')
	.description('Get network')
	.action(async () => {
		console.log(getNetwork());
	});

// import-identity
program
	.command('import-identity <data>')
	.description('Import .pem file data to use as identity')
	.addOption(new Option('--no-encrypt', 'Do not ask for a password to encrypt identity'))
	.action(async (data, options) => {
		await importPem(data, options);
		await whoami();
	});

// sources
program
	.command('sources')
	.description('for dfx packtool')
	.option('--verbose')
	.action(async (options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await installAll({silent: true, lock: 'ignore'});
		await toolchain.ensureToolchainInited({strict: false});
		let sourcesArr = await sources(options);
		console.log(sourcesArr.join('\n'));
	});

// whoami
program
	.command('whoami')
	.description('Print your principal')
	.action(async () => {
		await whoami();
	});

// search
program
	.command('search <text>')
	.description('Search for packages')
	.action(async (text) => {
		await search(text);
	});

// cache
program
	.command('cache')
	.description('Manage cache')
	.addArgument(new Argument('<sub>').choices(['size', 'clean']))
	.action(async (sub) => {
		if (sub == 'clean') {
			await cleanCache();
			console.log('Cache cleaned');
		}
		else if (sub == 'size') {
			let size = await cacheSize();
			console.log('Cache size is ' + size);
		}
	});

// test
program
	.command('test [filter]')
	.description('Run tests')
	.addOption(new Option('-r, --reporter <reporter>', 'Test reporter').choices(['verbose', 'compact', 'files', 'silent']).default('verbose'))
	.addOption(new Option('--mode <mode>', 'Test mode').choices(['interpreter', 'wasi']).default('interpreter'))
	.option('-w, --watch', 'Enable watch mode')
	.action(async (filter, options) => {
		await installAll({silent: true, lock: 'ignore'});
		await test(filter, options);
	});

// bench
program
	.command('bench [filter]')
	.description('Run benchmarks')
	.addOption(new Option('--replica <replica>', 'Which replica to use to run benchmarks').choices(['dfx', 'pocket-ic']).default('dfx'))
	.addOption(new Option('--gc <gc>', 'Garbage collector').choices(['copying', 'compacting', 'generational', 'incremental']).default('copying'))
	.addOption(new Option('--save', 'Save benchmark results to .bench/<filename>.json'))
	.addOption(new Option('--compare', 'Run benchmark and compare results with .bench/<filename>.json'))
	// .addOption(new Option('--force-gc', 'Force GC'))
	.addOption(new Option('--verbose', 'Show more information'))
	.action(async (filter, options) => {
		await installAll({silent: true, lock: 'ignore'});
		await bench(filter, options);
	});

// template
program
	.command('template')
	.description('Apply template')
	.action(async () => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await template();
	});

// docs
// program
// 	.command('docs')
// 	.description('Generate documentation (experimental)')
// 	.action(async () => {
// 		if (!checkConfigFile()) {
// 			process.exit(1);
// 		}
// 		await docs();
// 	});

// self update
program
	.command('self-update')
	.description('Update mops CLI to the latest version')
	.option('--detached')
	.option('--force')
	.action(async (options) => {
		if (options.force) {
			selfUpdate(options);
		}
		else {
			console.log('Please run \'npm i -g ic-mops\'');
		}
	});

// user
program
	.command('user')
	.addArgument(new Argument('<sub>').choices(['set', 'get']))
	.addArgument(new Argument('<prop>').choices(['name', 'site', 'email', 'github', 'twitter']))
	.addArgument(new Argument('[value]'))
	.description('User settings')
	.action(async (sub, prop, value) => {
		if (sub == 'get') {
			await getUserProp(prop);
		}
		else if (sub == 'set') {
			if (!value) {
				console.log('error: missing required argument "value"');
				return;
			}
			await setUserProp(prop, value);
		}
	});

// bump
program
	.command('bump [major|minor|patch]')
	.description('Bump current package version')
	.action(async (part) => {
		await bump(part);
	});

// sync
program
	.command('sync')
	.description('Add missing packages and remove unused packages')
	.addOption(new Option('--lock <action>', 'Lockfile action').choices(['update', 'ignore']))
	.action(async (options) => {
		await sync(options);
	});

// outdated
program
	.command('outdated')
	.description('Print outdated dependencies specified in mops.toml')
	.action(async () => {
		await outdated();
	});

// update
program
	.command('update [pkg]')
	.description('Update dependencies specified in mops.toml')
	.addOption(new Option('--lock <action>', 'Lockfile action').choices(['update', 'ignore']))
	.action(async (pkg, options) => {
		await update(pkg, options);
	});

// transfer-ownership
program
	.command('transfer-ownership [to-principal]')
	.description('Transfer ownership of the current package to another principal')
	.action(async (toPrincipal) => {
		await transferOwnership(toPrincipal);
	});

// toolchain
const toolchainCommand = new Command('toolchain').description('Toolchain management');

toolchainCommand
	.command('init')
	.description('One-time initialization of toolchain management')
	.action(async () => {
		await toolchain.init();
	});

toolchainCommand
	.command('reset')
	.description('Uninstall toolchain management')
	.action(async () => {
		await toolchain.init({reset: true});
	});

toolchainCommand
	.command('use')
	.description('Install specified tool version and update mops.toml')
	.addArgument(new Argument('<tool>').choices(['moc', 'wasmtime', 'pocket-ic']))
	.addArgument(new Argument('[version]'))
	.action(async (tool, version) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await toolchain.use(tool, version);
	});

toolchainCommand
	.command('update')
	.description('Update specified tool or all tools to the latest version and update mops.toml')
	.addArgument(new Argument('[tool]').choices(['moc', 'wasmtime', 'pocket-ic']))
	.action(async (tool?: Tool) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await toolchain.update(tool);
	});

toolchainCommand
	.command('bin')
	.description('Get path to the tool binary\n<tool> can be one of "moc", "wasmtime", "pocket-ic"')
	.addArgument(new Argument('<tool>').choices(['moc', 'wasmtime', 'pocket-ic']))
	.addOption(new Option('--fallback', 'Fallback to the moc that comes with dfx if moc is not specified in the [toolchain] section'))
	.action(async (tool, options) => {
		let bin = await toolchain.bin(tool, options);
		console.log(bin);
	});

program.addCommand(toolchainCommand);

program.parse();