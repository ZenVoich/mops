import fs from 'node:fs';
import path from 'node:path';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex} from '@noble/hashes/utils';
import {getDependencyType, getRootDir, mainActor} from './mops.js';
import {resolvePackages} from './resolve-packages.js';

type LockFileV1 = {
	version: 1;
	mopsTomlHash: string;
	hashes: Record<string, Record<string, string>>;
};

async function getFileHashesFromRegistry(): Promise<[string, [string, Uint8Array | number[]][]][]> {
	let packageIds = await getResolvedMopsPackageIds();
	let actor = await mainActor();
	let fileHashesByPackageIds = await actor.getFileHashesByPackageIds(packageIds);
	return fileHashesByPackageIds;
}

async function getResolvedMopsPackageIds(): Promise<string[]> {
	let resolvedPackages = await resolvePackages();
	let packageIds = Object.entries(resolvedPackages)
		.filter(([_, version]) => getDependencyType(version) === 'mops')
		.map(([name, version]) => `${name}@${version}`);
	return packageIds;
}

// get hash of local file from '.mops' dir by fileId
export function getLocalFileHash(fileId: string): string {
	let rootDir = getRootDir();
	let file = path.join(rootDir, '.mops', fileId);
	if (!fs.existsSync(file)) {
		console.error(`Missing file ${fileId} in .mops dir`);
		process.exit(1);
	}
	let fileData = fs.readFileSync(file);
	return bytesToHex(sha256(fileData));
}

function getMopsTomlHash(): string {
	return bytesToHex(sha256(fs.readFileSync(getRootDir() + '/mops.toml')));
}

// compare hashes of local files with hashes from the registry
export async function checkIntegrity() {
	let fileHashesFromRegistry = await getFileHashesFromRegistry();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (let [_packageId, fileHashes] of fileHashesFromRegistry) {
		for (let [fileId, hash] of fileHashes) {
			let remoteHash = new Uint8Array(hash);
			let localHash = getLocalFileHash(fileId);

			if (localHash !== bytesToHex(remoteHash)) {
				console.error('Integrity check failed.');
				console.error(`Mismatched hash for ${fileId}: ${localHash} vs ${bytesToHex(remoteHash)}`);
				process.exit(1);
			}
		}
	}
}

export async function saveLockFile() {
	let rootDir = getRootDir();
	let fileHashes = await getFileHashesFromRegistry();
	let lockFile = path.join(rootDir, 'mops-lock.json');

	// if lock file exists and mops.toml hasn't changed, don't update it
	if (fs.existsSync(lockFile)) {
		let lockFileJson: LockFileV1 = JSON.parse(fs.readFileSync(lockFile).toString());
		let mopsTomlHash = getMopsTomlHash();
		if (mopsTomlHash === lockFileJson.mopsTomlHash) {
			return;
		}
	}

	let lockFileJson: LockFileV1 = {
		version: 1,
		mopsTomlHash: getMopsTomlHash(),
		hashes: fileHashes.reduce((acc, [packageId, fileHashes]) => {
			acc[packageId] = fileHashes.reduce((acc, [fileId, hash]) => {
				acc[fileId] = bytesToHex(new Uint8Array(hash));
				return acc;
			}, {} as Record<string, string>);
			return acc;
		}, {} as Record<string, Record<string, string>>),
	};

	fs.writeFileSync(lockFile, JSON.stringify(lockFileJson, null, 2));
}

// compare hashes of local files with hashes from the lock file
export async function checkLockFile() {
	let rootDir = getRootDir();
	let lockFile = path.join(rootDir, 'mops-lock.json');
	let packageIds = await getResolvedMopsPackageIds();

	// check if lock file exists
	if (!fs.existsSync(lockFile)) {
		// BREAKING CHANGE
		// console.error('Missing lock file. Run `mops install` to generate it.');
		// process.exit(1);
		return;
	}

	let lockFileJson: LockFileV1 = JSON.parse(fs.readFileSync(lockFile).toString());

	// check lock file version
	if (lockFileJson.version !== 1) {
		console.error('Integrity check failed');
		console.error(`Invalid lock file version: ${lockFileJson.version}. Supported versions: 1`);
		process.exit(1);
	}

	// check mops.toml hash
	if (lockFileJson.mopsTomlHash !== getMopsTomlHash()) {
		console.error('Integrity check failed');
		console.error('Mismatched mops.toml hash');
		console.error(`Locked hash: ${lockFileJson.mopsTomlHash}`);
		console.error(`Actual hash: ${getMopsTomlHash()}`);
		process.exit(1);
	}

	// check number of packages
	if (Object.keys(lockFileJson.hashes).length !== packageIds.length) {
		console.error('Integrity check failed');
		console.error(`Mismatched number of resolved packages: ${JSON.stringify(Object.keys(lockFileJson.hashes).length)} vs ${JSON.stringify(packageIds.length)}`);
		process.exit(1);
	}

	// check if resolved packages are in the lock file
	for (let packageId of packageIds) {
		if (!(packageId in lockFileJson.hashes)) {
			console.error('Integrity check failed');
			console.error(`Missing package ${packageId} in lock file`);
			process.exit(1);
		}
	}

	for (let [packageId, hashes] of Object.entries(lockFileJson.hashes)) {

		// check if package is in resolved packages
		if (!packageIds.includes(packageId)) {
			console.error('Integrity check failed');
			console.error(`Package ${packageId} in lock file but not in resolved packages`);
			process.exit(1);
		}

		for (let [fileId, lockedHash] of Object.entries(hashes)) {

			// check if file belongs to package
			if (!fileId.startsWith(packageId)) {
				console.error('Integrity check failed');
				console.error(`File ${fileId} in lock file does not belong to package ${packageId}`);
				process.exit(1);
			}

			// local file hash vs hash from lock file
			let localHash = getLocalFileHash(fileId);
			if (lockedHash !== localHash) {
				console.error('Integrity check failed');
				console.error(`Mismatched hash for ${fileId}`);
				console.error(`Locked hash: ${lockedHash}`);
				console.error(`Actual hash: ${localHash}`);
				process.exit(1);
			}
		}
	}
}