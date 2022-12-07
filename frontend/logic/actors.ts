import {Principal} from '@dfinity/principal';
import {auth} from './auth';
import {createActor as createMainActor, canisterId as mainCanisterId} from '/declarations/main';
import {createActor as createStorageActor} from '/declarations/storage';

let getOptions = () => {
	return {
		agentOptions: {
			identity: process.env.NODE_ENV === 'production' && auth.identity,
		}
	};
};

export let mainActor = () => {
	return createMainActor(mainCanisterId, getOptions());
};

export let storageActor = (storageId: string | Principal) => {
	return createStorageActor(storageId, getOptions());
};

declare global {
	// eslint-disable-next-line no-unused-vars
	var getStoragesStats: () => void;
}

window.getStoragesStats = () => {
	mainActor().getStoragesStats().then((statsAr) => {
		console.log(statsAr.map(([principal, stats]) => {
			return [principal.toText(), stats];
		}));
	});
};