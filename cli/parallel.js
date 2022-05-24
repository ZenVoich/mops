export async function parallel(threads, items, fn) {
	return new Promise((resolve) => {
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