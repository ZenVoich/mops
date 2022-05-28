import {Actor, HttpAgent} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

import {idlFactory} from './declarations/main/main.did.js';
import {decodeFile} from './pem.js';


global.fetch = fetch;

let networkFile = new URL('./network.txt', import.meta.url);

export function setNetwork(network) {
	fs.writeFileSync(networkFile, network);
}

export function getNetwork() {
	let network = 'ic';
	if (fs.existsSync(networkFile)) {
		network = fs.readFileSync(networkFile).toString() || 'ic';
	}

	if (network === 'local') {
		let ids = JSON.parse(fs.readFileSync(new URL('../.dfx/local/canister_ids.json', import.meta.url)).toString());
		return {
			network,
			host: 'http://127.0.0.1:8000',
			canisterId: ids.main.local,
		};
	}
	else if (network === 'ic') {
		return {
			network,
			host: 'https://mainnet.dfinity.network',
			canisterId: 'oknww-riaaa-aaaam-qaf6a-cai',
		};
	}
}

export let getIdentity = () => {
	let identityPem = new URL('./identity.pem', import.meta.url);
	if (fs.existsSync(identityPem)) {
		return decodeFile(identityPem);
	}
};

export let mainActor = async () => {
	let network = getNetwork().network;
	let host = getNetwork().host;
	let canisterId = getNetwork().canisterId;

	let identity = getIdentity();
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
};

export function checkConfigFile() {
	let configFile = path.join(process.cwd(), 'mops.toml');
	if (!fs.existsSync(configFile)) {
		console.log(chalk.red('Error: ') + `Config file not found ${configFile}`);
		return false;
	}
	return true;
}

export function progressBar(step, total) {
	let done = Math.round(step / total * 10);
	return `[${':'.repeat(done)}${' '.repeat(10 - done)}]`;
}

export async function getMaxVersion(pkgName) {
	let actor = await mainActor();
	return actor.getMaxVersion(pkgName);
}

export function readConfig(configFile = path.join(process.cwd(), 'mops.toml')) {
	let text = fs.readFileSync(configFile).toString();
	return TOML.parse(text);
}