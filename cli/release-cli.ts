/* eslint-disable no-undef */
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
import {execSync} from 'node:child_process';
import semver from 'semver';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex} from '@noble/hashes/utils';

import {findChangelogEntry} from './helpers/find-changelog-entry.js';

let __dirname = new URL('.', import.meta.url).pathname;

execSync('npm run prepare', {stdio: 'inherit', cwd: __dirname});
execSync('npm run bundle', {stdio: 'inherit', cwd: __dirname});

let version = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version;
let tag = semver.parse(version)?.prerelease[0] || 'latest';
let releaseNotes = findChangelogEntry(fs.readFileSync(path.resolve(__dirname, 'CHANGELOG.md'), 'utf8'), version);
let hash = bytesToHex(sha256(fs.readFileSync(path.resolve(__dirname, 'bundle/cli.tgz'))));

fs.cpSync(path.resolve(__dirname, 'bundle/cli.tgz'), path.resolve(__dirname, `../cli-releases/versions/${version}/cli.tgz`), {force: false, errorOnExist: true});
fs.writeFileSync(path.resolve(__dirname, `../cli-releases/versions/${version}/RELEASE_NOTES.md`), releaseNotes);
fs.writeFileSync(path.resolve(__dirname, `../cli-releases/versions/${version}/cli.tgz.sha256`), hash);

fs.cpSync(path.resolve(__dirname, `../cli-releases/versions/${version}`), path.resolve(__dirname, `../cli-releases/versions/${tag}`), {force: true, errorOnExist: false, recursive: true});

fs.writeFileSync(path.resolve(__dirname, `../cli-releases/tags/${tag}`), version);

console.log(`Release '${version}' created with tag '${tag}'`);