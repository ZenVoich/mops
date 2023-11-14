import {Actor, HttpAgent, Identity} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';

import {idlFactory} from '../declarations/main/index.js';
import {_SERVICE} from '../declarations/main/main.did.js';
import {idlFactory as storageIdlFactory} from '../declarations/storage/index.js';
import {_SERVICE as _STORAGE_SERVICE} from '../declarations/storage/storage.did.js';

import {getEndpoint} from './network.js';
import {getNetwork} from './network.js';

export let mainActor = async (identity?: Identity): Promise<_SERVICE> => {
	let network = getNetwork();
	let host = getEndpoint(network).host;
	let canisterId = getEndpoint(network).canisterId;

	// @ts-ignore exactOptionalPropertyTypes
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
};

export let storageActor = async (storageId: Principal, identity?: Identity): Promise<_STORAGE_SERVICE> => {
	let network = getNetwork();
	let host = getEndpoint(network).host;

	// @ts-ignore exactOptionalPropertyTypes
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(storageIdlFactory, {
		agent,
		canisterId: storageId,
	});
};
