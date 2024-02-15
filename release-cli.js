/* eslint-disable no-undef */
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
import {execSync} from 'node:child_process';
import semver from 'semver';

let __dirname = new URL('.', import.meta.url).pathname;

execSync('npm run prepare', {stdio: 'inherit', cwd: path.resolve(__dirname, 'cli')});
execSync('npm run bundle', {stdio: 'inherit', cwd: path.resolve(__dirname, 'cli')});

let version = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'cli/package.json'))).version;
let tag = semver.parse(version).prerelease[0] || 'latest';

fs.cpSync(path.resolve(__dirname, 'cli/bundle/cli.tgz'), path.resolve(__dirname, `cli-releases/versions/${version}.tgz`), {force: false, errorOnExist: true});
fs.cpSync(path.resolve(__dirname, 'cli/bundle/cli.tgz'), path.resolve(__dirname, `cli-releases/versions/${tag}.tgz`), {force: true, errorOnExist: false});
fs.writeFileSync(path.resolve(__dirname, `cli-releases/tags/${tag}`), version);

console.log(`Release '${version}' created with tag '${tag}'`);