export async function parallel(threads: number, items: any[], fn: CallableFunction) {
	return new Promise<void>((resolve) => {
		let busyThreads = 0;
		items = items.slice();

		let loop = () => {
			if (!items.length) {
				if (busyThreads === 0) {
					resolve();
				}
				return;
			}
			if (busyThreads >= threads) {
				return;
			}
			busyThreads++;
			fn(items.shift()).then(() => {
				busyThreads--;
				loop();
			});
			loop();
		};
		loop();
	});
}