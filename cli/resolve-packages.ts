import process from 'node:process';
import path from 'node:path';
import {existsSync} from 'node:fs';
import chalk from 'chalk';
import {checkConfigFile, getRootDir, parseGithubURL, readConfig} from './mops.js';
import {VesselConfig, readVesselConfig} from './vessel.js';
import {Config, Dependency} from './types.js';
import {getDepCacheDir, getDepCacheName} from './cache.js';
import {getPackageId} from './helpers/get-package-id.js';
import {checkLockFileLight, readLockFile} from './integrity.js';

export interface ResolvedPackages {
	packages : Record<string, string>,
	overrides : Record<string, Record<string, string>>;
}

interface VersionedPackage {
	name : string;
	version : string;
	dependencyOf : string;
	isMopsPackage : boolean;
}

export async function resolvePackages({conflicts = 'ignore' as 'warning' | 'error' | 'ignore'} = {}) : Promise<ResolvedPackages> {
	if (!checkConfigFile()) {
		return {
			packages: {},
			overrides: {},
		};
	}

	if (checkLockFileLight()) {
		let lockFileJson = readLockFile();

		if (lockFileJson) {
			if (lockFileJson.version === 3) {
				return {
					packages: lockFileJson.deps,
					overrides: {},
				};
			}
			if (lockFileJson.version === 4) {
				return lockFileJson.resolved;
			}
		}
	}

	let rootDir = getRootDir();
	let packages : Record<string, Dependency & {isRoot : boolean;}> = {};
	let versions : Record<string, Array<VersionedPackage>> = {};
	let versionedPackages : Record<string, VersionedPackage> = {};

	let compareVersions = (a : string = '0.0.0', b : string = '0.0.0') => {
		let ap = a.split('.').map((x : string) => parseInt(x)) as [number, number, number];
		let bp = b.split('.').map((x : string) => parseInt(x)) as [number, number, number];
		if (ap[0] - bp[0]) {
			return Math.sign(ap[0] - bp[0]);
		}
		if (ap[0] === bp[0] && ap[1] - bp[1]) {
			return Math.sign(ap[1] - bp[1]);
		}
		if (ap[0] === bp[0] && ap[1] === bp[1] && ap[2] - bp[2]) {
			return Math.sign(ap[2] - bp[2]);
		}
		return 0;
	};

	const gitVerRegex = new RegExp(/v(\d{1,2}\.\d{1,2}\.\d{1,2})(-.*)?$/);
	const rootName = '<root>';

	const compareGitVersions = (repoA : string, repoB : string) => {
		const {branch: a} = parseGithubURL(repoA);
		const {branch: b} = parseGithubURL(repoB);

		if (gitVerRegex.test(a) && gitVerRegex.test(b)) {
			return compareVersions(a.substring(1), b.substring(1));
		}
		else if (!gitVerRegex.test(a)) {
			return -1;
		}
		else {
			return 1;
		}
	};

	let collectDeps = async (config : Config | VesselConfig, configDir : string, isRoot = false) => {
		let allDeps = [...Object.values(config.dependencies || {})];
		if (isRoot) {
			allDeps = [...allDeps, ...Object.values(config['dev-dependencies'] || {})];
		}
		for (const pkgDetails of allDeps) {
			const {name, repo, version} = pkgDetails;

			// take root dep version or bigger one
			if (
				isRoot
				|| !packages[name]
				|| !packages[name]?.isRoot
				&& (
					repo && packages[name]?.repo && compareGitVersions(packages[name]?.repo || '', repo) === -1
					|| compareVersions(packages[name]?.version, version) === -1)
			) {
				let temp = {
					...pkgDetails,
					isRoot,
				};
				packages[name] = temp;

				// normalize path relative to the root config dir
				if (pkgDetails.path) {
					temp.path = path.relative(rootDir, path.resolve(configDir, pkgDetails.path));
				}
			}

			let nestedConfig;
			let localNestedDir = '';

			// read nested config
			if (repo) {
				let cacheDir = getDepCacheName(name, repo);
				nestedConfig = await readVesselConfig(getDepCacheDir(cacheDir), {silent: true}) || {};
			}
			else if (pkgDetails.path) {
				localNestedDir = path.resolve(configDir, pkgDetails.path).replaceAll('{MOPS_ENV}', process.env.MOPS_ENV || 'local');
				let mopsToml = path.join(localNestedDir, 'mops.toml');
				if (existsSync(mopsToml)) {
					nestedConfig = readConfig();
				}
			}
			else if (version) {
				let cacheDir = getDepCacheName(name, version);
				nestedConfig = readConfig(getDepCacheDir(cacheDir) + '/mops.toml');
			}

			// collect nested deps
			if (nestedConfig) {
				await collectDeps(nestedConfig, localNestedDir, false);
			}

			let parentPkgId = isRoot ? rootName : '';
			if ('package' in config) {
				parentPkgId = getPackageId(config.package?.name || '', config.package?.version || '');
			}

			const packageVersions = versions[name] || (versions[name] = []);
			if (repo) {
				const {branch} = parseGithubURL(repo);
				const versionedPackage = {
					name,
					version: branch,
					dependencyOf: parentPkgId,
					isMopsPackage: false,
				};
				packageVersions.push(versionedPackage);
				versionedPackages[`${name}/github/${branch}`] = versionedPackage;
			}
			else if (version) {
				const majorVersion = version.split('.')[0];
				const versionedPackage = {
					name,
					version: version,
					dependencyOf: parentPkgId,
					isMopsPackage: true,
				};
				packageVersions.push(versionedPackage);
				versionedPackages[`${name}/mops/v${majorVersion}`] = versionedPackage;
			}
		}
	};

	let config = readConfig();
	await collectDeps(config, rootDir, true);

	// show conflicts
	let hasConflicts = false;

	if (conflicts !== 'ignore') {
		for (let [dep, vers] of Object.entries(versions)) {
			let majors = new Set(vers.filter(x => x.isMopsPackage).map(x => x.version.split('.')[0]));
			if (majors.size > 1) {
				console.error(chalk.reset('') + chalk.redBright(conflicts === 'error' ? 'Error!' : 'Warning!'), `Conflicting versions of dependency "${dep}"`);

				for (let {version, dependencyOf} of vers.reverse()) {
					console.error(chalk.reset('  ') + `${dep} ${chalk.bold.red(version.split('.')[0])}.${version.split('.').slice(1).join('.')} is dependency of ${chalk.bold(dependencyOf)}`);
				}

				hasConflicts = true;
			}
		}
	}

	if (conflicts === 'error' && hasConflicts) {
		process.exit(1);
	}

	let resolved : ResolvedPackages = {
		packages: {},
		overrides: {},
	};
	Object.entries(packages).forEach(([name, pkg]) => {
		let version : string | undefined;
		if (pkg.path) {
			version = path.resolve(rootDir, pkg.path).replaceAll('{MOPS_ENV}', process.env.MOPS_ENV || 'local');
		}
		else if (pkg.repo) {
			version = pkg.repo;
		}
		else if (pkg.version) {
			version = pkg.version;
		}

		if (version) {
			resolved.packages[name] = version;
		}
	});
	Object.entries(versions).forEach(([_name, _versionedPackages]) => {
		// TODO
	});
	return resolved;
}