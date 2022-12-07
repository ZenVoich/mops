import {onDestroy, onMount} from 'svelte';
import {auth} from '/logic/auth';

export function useAuth(fn: Function) {
	let isAuthenticated: boolean;

	let onAuthUpdate = () => {
		if (isAuthenticated !== auth.isAuthenticated) {
			fn();
			isAuthenticated = auth.isAuthenticated;
		}
	};

	onMount(() => {
		onAuthUpdate();
		auth.on('update', onAuthUpdate);
	});

	onDestroy(() => {
		auth.off('update', onAuthUpdate);
	});

	auth.updateAuthState().then(onAuthUpdate);
}