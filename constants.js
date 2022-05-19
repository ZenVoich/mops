import fs from 'fs';

let isLocal = process.argv[2] !== 'prod' && process.env.NODE_ENV !== 'production';

let text = fs.readFileSync(new URL('backend/constants.template.mo', import.meta.url)).toString();

let canisterIds = JSON.parse(
	fs.readFileSync(new URL(isLocal ? '.dfx/local/canister_ids.json' : 'canister_ids.json', import.meta.url)).toString(),
);

let constants = {
	NETWORK: isLocal ? 'local' : 'ic',
};

Object.entries(canisterIds).forEach(([key, val]) => {
	constants[`${key.toUpperCase()}_CANISTER_ID`] = isLocal ? val.local : val.ic;
});

Object.entries(constants).forEach(([key, val]) => {
	text = text.replace(`\${${key}}`, val);
});

fs.writeFileSync(new URL('backend/constants.mo', import.meta.url), text);