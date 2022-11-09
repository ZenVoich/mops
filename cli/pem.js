import fs from 'fs';
import {Ed25519KeyIdentity, Secp256k1KeyIdentity} from '@dfinity/identity';
import pemfile from 'pem-file';

export function decodeFile(file) {
	const rawKey = fs.readFileSync(file).toString();
	return decode(rawKey);
}

export function decode(rawKey) {
	var buf = pemfile.decode(rawKey);
	if (rawKey.includes('EC PRIVATE KEY')) {
		if (buf.length != 118) {
			throw 'expecting byte length 118 but got ' + buf.length;
		}
		return Secp256k1KeyIdentity.fromSecretKey(buf.slice(7, 39));
	}
	if (buf.length != 85) {
		throw 'expecting byte length 85 but got ' + buf.length;
	}
	let secretKey = Buffer.concat([buf.slice(16, 48), buf.slice(53, 85)]);
	return Ed25519KeyIdentity.fromSecretKey(secretKey);
}