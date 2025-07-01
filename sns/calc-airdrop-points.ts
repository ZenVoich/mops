import {writeFileSync} from 'node:fs';
import {mainActor} from 'ic-mops/api/actors';


let githubContributors = [
	'rno2w-sqaaa-aaaaa-aaacq-cai', // tomijaga
	'rwlgt-iiaaa-aaaaa-aaaaa-cai', // peterpeterparker
	'rrkah-fqaaa-aaaaa-aaaaq-cai', // letmejustputthishere
	'r7inp-6aaaa-aaaaa-aaabq-cai', // rvanasa
];

// redundant owners with points <100
let excludedOwners : string[] = [
	// '4jijx-ekel7-4t2kx-32cyf-wzo3t-i4tas-qsq4k-ujnug-oxke7-o5aci-eae',
	// 'd7egg-wf5tk-olxbg-izlyy-bphvp-2nfuf-5yltc-kzmvt-dk5lo-qtv7e-vae',
	// 'rbjud-qg34b-xg57u-crnvy-oshry-fnolh-s2uyq-5bmxh-xfzhs-sz4eh-6ae',
];

let actor = await mainActor();

let packages = [
	(await actor.search('', [200n], [0n]))[0],
	(await actor.search('', [200n], [1n]))[0],
].flat();

let owners : Record<string, number> = {};

for (let contributor of githubContributors) {
	owners[contributor] = 150;
}

for (let p of packages) {
	let pkgOwners = p.owners.filter(o => !excludedOwners.includes(o.id.toText()));
	let owner = pkgOwners[0];
	if (owners[owner.id.toText()] === undefined) {
		owners[owner.id.toText()] = 100;
	}

	for (let owner of pkgOwners) {
		if (!excludedOwners.includes(owner.id.toText())) {
			owners[owner.id.toText()] = (owners[owner.id.toText()] ?? 0) + 20 / pkgOwners.length |0;
		}
	}
}

writeFileSync('points.json', JSON.stringify(owners, null, 2));

console.log(owners);

let totalPoints = 0;
for (let owner in owners) {
	totalPoints += owners[owner];
}

console.log(totalPoints);