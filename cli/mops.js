import {Actor, HttpAgent} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

import {idlFactory} from './declarations/main/main.did.js';
import {decodeFile} from './pem.js';

let network = 'local';
let networks = {
	local: {
		host: 'http://127.0.0.1:8000',
		// canisterId: "ai7t5-aibaq-aaaaa-aaaaa-c",
		canisterId: 'hozae-racaq-aaaaa-aaaaa-c',
	},
	ic: {
		host: 'https://mainnet.dfinity.network',
		canisterId: '',
	},
};

global.fetch = fetch;

export async function setNetwork(net) {
	network = net;
}

export let getIdentity = () => {
	let identityPem = new URL('./identity.pem', import.meta.url);
	if (fs.existsSync(identityPem)) {
		return decodeFile(identityPem);
	}
};

export let mainActor = async () => {
	let host = networks[network].host;
	let canisterId = networks[network].canisterId;

	// if (network === 'local') {
	// 	let ids = JSON.parse(fs.readFileSync('.dfx/local/canister_ids.json').toString());
	// 	canisterId = await ids.main.local;
	// }

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

export async function getLastVersion(pkgName) {
	let actor = await mainActor();
	return actor.getLastVersion(pkgName);
}

export function readConfig(configFile = path.join(process.cwd(), 'mops.toml')) {
	let text = fs.readFileSync(configFile).toString();
	return TOML.parse(text);
}