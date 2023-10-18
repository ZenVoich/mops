import fs from 'node:fs';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex} from '@noble/hashes/utils';
import {mainActor} from './mops.js';

export async function getFileHashesFromRegistry(packageIds: string[]): Promise<{[packageId: string]: {[fileId: string]: string;};}> {
	let actor = await mainActor();
	let fileHashesByPackageIds = await actor.getFileHashesByPackageIds(packageIds);
	return fileHashesByPackageIds;
}