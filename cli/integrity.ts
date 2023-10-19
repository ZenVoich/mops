import fs from 'node:fs';
import path from 'node:path';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex} from '@noble/hashes/utils';
import {getDependencyType, getRootDir, mainActor} from './mops.js';
import {resolvePackages} from './resolve-packages.js';

export async function getFileHashesFromRegistry(packageIds: string[]): Promise<[string, [string, Uint8Array | number[]][]][]> {
	let actor = await mainActor();
	let fileHashesByPackageIds = await actor.getFileHashesByPackageIds(packageIds);
	return fileHashesByPackageIds;
}

export async function checkIntegrity() {
	let rootDir = getRootDir();
	let resolvedPackages = await resolvePackages();
	let packageIds = Object.entries(resolvedPackages)
		.filter(([_, version]) => getDependencyType(version) === 'mops')
		.map(([name, version]) => `${name}@${version}`);
	let fileHashesFromRegistry = await getFileHashesFromRegistry(packageIds);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (let [_packageId, fileHashes] of fileHashesFromRegistry) {
		for (let [fileId, hash] of fileHashes) {
			let remoteHash = new Uint8Array(hash);
			let localData = fs.readFileSync(path.join(rootDir, '.mops', fileId));
			let localHash = await sha256(localData);

			if (bytesToHex(localHash) !== bytesToHex(remoteHash)) {
				console.error('Integrity check failed.');
				console.error(`Mismatched hash for ${fileId}: ${bytesToHex(localHash)} vs ${bytesToHex(remoteHash)}`);
				process.exit(1);
			}
		}
	}
}

export async function saveLockFile() {
	let rootDir = getRootDir();
	let resolvedPackages = await resolvePackages();
	let packageIds = Object.entries(resolvedPackages)
		.filter(([_, version]) => getDependencyType(version) === 'mops')
		.map(([name, version]) => `${name}@${version}`);
	let fileHashes = await getFileHashesFromRegistry(packageIds);

	let lockFileJson = {
		version: 1,
		hashes: fileHashes.reduce((acc, [packageId, fileHashes]) => {
			acc[packageId] = fileHashes.reduce((acc, [fileId, hash]) => {
				acc[fileId] = bytesToHex(new Uint8Array(hash));
				return acc;
			}, {} as Record<string, string>);
			return acc;
		}, {} as Record<string, Record<string, string>>),
	};

	fs.writeFileSync(rootDir + '/mops-lock.json', JSON.stringify(lockFileJson, null, 2));
}

export async function checkLockFile() {
	let rootDir = getRootDir();
	let resolvedPackages = await resolvePackages();
	let packageIds = Object.entries(resolvedPackages)
		.filter(([_name, version]) => getDependencyType(version) === 'mops')
		.map(([name, version]) => `${name}@${version}`);

	let fileHashesFromRegistry = await getFileHashesFromRegistry(packageIds);

	let lockFileJson = JSON.parse(fs.readFileSync(rootDir + '/mops-lock.json').toString());
	if (lockFileJson.version !== 1) {
		console.error(`Invalid lock file version: ${lockFileJson.version}`);
		process.exit(1);
	}
	// if (lockFileJson.packageIds.length !== packageIds.length) {
	// 	console.error(`Mismatched packageIds: ${JSON.stringify(lockFileJson.packageIds)} vs ${JSON.stringify(packageIds)}`);
	// 	process.exit(1);
	// }
	// for (let i = 0; i < packageIds.length; i++) {
	// 	if (lockFileJson.packageIds[i] !== packageIds[i]) {
	// 		console.error(`Mismatched packageIds: ${JSON.stringify(lockFileJson.packageIds)} vs ${JSON.stringify(packageIds)}`);
	// 		process.exit(1);
	// 	}
	// }
	for (let [packageId, fileHashes] of fileHashesFromRegistry) {
		let hashes = lockFileJson.hashes[packageId];
		if (!hashes) {
			console.error(`Missing packageId ${packageId} in lock file`);
			process.exit(1);
		}
		for (let [fileId, hash] of fileHashes) {
			let lockFileHash = hashes[fileId];
			if (!lockFileHash) {
				console.error(`Missing fileId ${fileId} in lock file`);
				process.exit(1);
			}
			if (lockFileHash !== bytesToHex(new Uint8Array(hash))) {
				console.error(`Mismatched hash for ${fileId}: ${lockFileHash} vs ${bytesToHex(new Uint8Array(hash))}`);
				process.exit(1);
			}
		}
	}
}