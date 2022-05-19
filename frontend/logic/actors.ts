import {auth} from './auth';
import {createActor as createMainActor, canisterId as mainCanisterId} from '/declarations/main';

let getOptions = () => {
	return {
		agentOptions: {
			identity: process.env.NODE_ENV === 'production' && auth.identity,
		}
	}
}

export let mainActor = () => {
	return createMainActor(mainCanisterId, getOptions());
}