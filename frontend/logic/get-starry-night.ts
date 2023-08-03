import {createStarryNight} from '@wooorm/starry-night';
import moGrammar from '@wooorm/starry-night/lang/source.mo';

type StarryNight = Awaited<ReturnType<typeof createStarryNight>>;

declare global {
	// eslint-disable-next-line no-unused-vars, no-var
	var starryNight: StarryNight;
}

export async function getStarryNight(): Promise<StarryNight> {
	if (!window.starryNight) {
		window.starryNight = await createStarryNight([moGrammar], {
			getOnigurumaUrlFetch: () => {
				return new URL('/external/onig@1.7.0.wasm', import.meta.url);
			}
		});
	}

	return window.starryNight;
}