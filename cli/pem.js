import fs from 'fs';
import {Ed25519KeyIdentity, Secp256k1KeyIdentity} from '@dfinity/identity';
import pemfile from 'pem-file';
import crypto from 'crypto';

export function decodeFile(file, password) {
	let rawKey = fs.readFileSync(file);
	if (password) {
		return decode(decrypt(rawKey, password));
	}
	return decode(rawKey);
}

function decode(rawKey) {
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

let algorithm = 'aes-256-ctr';

export function encrypt(buffer, password) {
	let key = crypto.createHash('sha256').update(password).digest('base64').slice(0, 32);
	// Create an initialization vector
	let iv = crypto.randomBytes(16);
	// Create a new cipher using the algorithm, key, and iv
	let cipher = crypto.createCipheriv(algorithm, key, iv);
	// Create the new (encrypted) buffer
	let result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
	return result;
}

function decrypt(encrypted, password) {
	let key = crypto.createHash('sha256').update(password).digest('base64').slice(0, 32);
	// Get the iv: the first 16 bytes
	let iv = encrypted.slice(0, 16);
	// Get the rest
	encrypted = encrypted.slice(16);
	// Create a decipher
	let decipher = crypto.createDecipheriv(algorithm, key, iv);
	// Actually decrypt it
	let result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return result;
}