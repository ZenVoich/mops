import fs from 'fs';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import pemfile from 'pem-file';

export function decodeFile(file) {
	const rawKey = fs.readFileSync(file).toString();
	return decode(rawKey);
}

export function decode(rawKey) {
	var buf = pemfile.decode(rawKey);
	if (buf.length != 85) {
		throw 'expecting byte length 85 but got ' + buf.length;
	}
	let secretKey = Buffer.concat([buf.slice(16, 48), buf.slice(53, 85)]);
	return Ed25519KeyIdentity.fromSecretKey(secretKey);
}