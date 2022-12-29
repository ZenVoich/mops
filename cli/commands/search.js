import asTable from 'as-table';
import chalk from 'chalk';
import {mainActor} from '../mops.js';

export async function search(text) {
	let actor = await mainActor();
	let res = await actor.search(text);

	if (!res.length) {
		console.log('Packages not found');
		return;
	}

	let ellipsis = (text, max) => {
		if (text.length <= max) {
			return text;
		}
		else {
			return text.slice(0, max) + '…';
		}
	};

	let maxNameLength = Math.max(...res.map(a => a.config.name.length));

	let table = res.map((item) => {
		return {
			NAME: chalk.bold(item.config.name),
			DESCRIPTION: ellipsis(item.config.description, process.stdout.columns - 40 - maxNameLength),
			VERSION: item.config.version,
			UPDATED: new Date(Number(item.publication.time / 1_000_000n)).toISOString().split('T')[0],
		};
	});

	console.log('');
	console.log(asTable.configure({
		delimiter: chalk.gray(' | '),
		dash: chalk.gray('─'),
		title: t => chalk.gray.bold(t),
	})(table));
	console.log('');
}