import process from 'node:process';
import {ChildProcessWithoutNullStreams, execSync, spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {PassThrough} from 'node:stream';

import {IDL} from '@dfinity/candid';
import {Actor, HttpAgent} from '@dfinity/agent';
import {PocketIc, PocketIcServer} from 'pic-ic';

import {readConfig} from '../mops.js';
import {toolchain} from './toolchain/index.js';

type StartOptions = {
	type ?: 'dfx' | 'pocket-ic';
	dir ?: string;
	verbose ?: boolean;
	silent ?: boolean;
};

export class Replica {
	type : 'dfx' | 'pocket-ic' = 'dfx';
	verbose = false;
	canisters : Record<string, {cwd : string; canisterId : string; actor : any; stream : PassThrough;}> = {};
	pocketIcServer ?: PocketIcServer;
	pocketIc ?: PocketIc;
	dfxProcess ?: ChildProcessWithoutNullStreams;
	dir : string = ''; // absolute path (/.../.mops/.test/)
	ttl = 60;

	async start({type, dir, verbose, silent} : StartOptions = {}) {
		this.type = type ?? this.type;
		this.verbose = verbose ?? this.verbose;
		this.dir = dir ?? this.dir;

		silent || console.log(`Starting ${this.type} replica...`);

		if (this.type == 'dfx') {
			fs.mkdirSync(this.dir, {recursive: true});
			fs.writeFileSync(path.join(this.dir, 'dfx.json'), JSON.stringify(this.dfxJson(''), null, 2));
			fs.writeFileSync(path.join(this.dir, 'canister.did'), 'service : { runTests: () -> (); }');

			await this.stop();

			this.dfxProcess = spawn('dfx', ['start', '--clean', '--artificial-delay', '0', (this.verbose ? '' : '-qqqq')].filter(x => x), {cwd: this.dir});

			// process canister logs
			this._attachCanisterLogHandler(this.dfxProcess);

			this.dfxProcess.stdout.on('data', (data) => {
				console.log('DFX:', data.toString());
			});

			// await for dfx to start
			let ok = false;
			while (!ok) {
				await fetch('http://127.0.0.1:4945/api/v2/status')
					.then(res => {
						if (res.status === 200) {
							ok = true;
						}
					})
					.catch(() => {})
					.finally(() => {
						return new Promise(resolve => setTimeout(resolve, 1000));
					});
			}
		}
		else {
			let pocketIcBin = await toolchain.bin('pocket-ic');

			// eslint-disable-next-line
			let config = readConfig();
			if (config.toolchain?.['pocket-ic'] !== '4.0.0') {
				console.error('Current Mops CLI only supports pocket-ic 4.0.0');
				process.exit(1);
			}

			this.pocketIcServer = await PocketIcServer.start({
				showRuntimeLogs: false,
				showCanisterLogs: false,
				binPath: pocketIcBin,
				ttl: this.ttl,
			});
			this.pocketIc = await PocketIc.create(this.pocketIcServer.getUrl());

			// process canister logs
			this._attachCanisterLogHandler(this.pocketIcServer.serverProcess as ChildProcessWithoutNullStreams);
		}
	}

	_attachCanisterLogHandler(proc : ChildProcessWithoutNullStreams) {
		let curData = '';
		proc.stderr.on('data', (data) => {
			curData = curData + data.toString();

			if (curData.includes('\n')) {
				let m = curData.match(/\[Canister ([a-z0-9-]+)\] (.*)/);
				if (!m) {
					return;
				}
				let [, canisterId, msg] = m;

				let stream = this.getCanisterStream(canisterId || '');
				if (stream) {
					stream.write(msg);
				}

				curData = '';
			}
		});
	}

	async stop(sigint = false) {
		if (this.type == 'dfx') {
			this.dfxProcess?.kill();
			// execSync('dfx stop' + (this.verbose ? '' : ' -qqqq'), {cwd: this.dir, timeout: 10_000, stdio: ['pipe', this.verbose ? 'inherit' : 'ignore', 'pipe']});
		}
		else if (this.pocketIc && this.pocketIcServer) {
			if (!sigint) {
				await this.pocketIc.tearDown(); // error 'fetch failed' if run on SIGINT
			}
			await this.pocketIcServer.stop();
		}
	}

	async deploy(name : string, wasm : string, idlFactory : IDL.InterfaceFactory, cwd : string = process.cwd()) {
		if (this.type === 'dfx') {
			// prepare dfx.json for current canister
			let dfxJson = path.join(this.dir, 'dfx.json');

			let oldDfxJsonData;
			if (fs.existsSync(dfxJson)) {
				oldDfxJsonData = JSON.parse(fs.readFileSync(dfxJson).toString());
			}
			let newDfxJsonData = this.dfxJson(name, name + '.wasm');

			if (oldDfxJsonData.canisters) {
				newDfxJsonData.canisters = Object.assign(oldDfxJsonData.canisters, newDfxJsonData.canisters);
			}

			fs.mkdirSync(this.dir, {recursive: true});
			fs.writeFileSync(dfxJson, JSON.stringify(newDfxJsonData, null, 2));

			execSync(`dfx deploy ${name} --mode reinstall --yes --identity anonymous`, {cwd: this.dir, stdio: this.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});
			execSync(`dfx ledger fabricate-cycles --canister ${name} --t 100`, {cwd: this.dir, stdio: this.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});

			let canisterId = execSync(`dfx canister id ${name}`, {cwd: this.dir}).toString().trim();

			let actor = Actor.createActor(idlFactory, {
				agent: await HttpAgent.create({
					host: 'http://127.0.0.1:4945',
					shouldFetchRootKey: true,
				}),
				canisterId,
			});

			this.canisters[name] = {
				cwd,
				canisterId,
				actor,
				stream: new PassThrough(),
			};
		}
		else if (this.pocketIc) {
			// let {canisterId, actor} = await this.pocketIc.setupCanister(idlFactory, wasm);
			let {canisterId, actor} = await this.pocketIc.setupCanister({
				idlFactory,
				wasm,
			});
			await this.pocketIc.addCycles(canisterId, 1_000_000_000_000);
			this.canisters[name] = {
				cwd,
				canisterId: canisterId.toText(),
				actor,
				stream: new PassThrough(),
			};
		}

		if (!this.canisters[name]) {
			throw new Error(`Canister ${name} not found`);
		}

		return this.canisters[name];
	}

	getActor(name : string) : unknown {
		if (!this.canisters[name]) {
			throw new Error(`Canister ${name} not found`);
		}
		return this.canisters[name]?.actor;
	}

	getCanister(name : string) {
		return this.canisters[name];
	}

	getCanisterId(name : string) : string {
		return this.canisters[name]?.canisterId || '';
	}

	getCanisterStream(canisterId : string) : PassThrough | null {
		for (let canister of Object.values(this.canisters)) {
			if (canister.canisterId === canisterId) {
				return canister.stream;
			}
		}
		return null;
	}

	dfxJson(canisterName : string, wasmPath = 'canister.wasm', didPath = 'canister.did') {
		let canisters : Record<string, any> = {};
		if (canisterName) {
			canisters[canisterName] = {
				type: 'custom',
				wasm: wasmPath,
				candid: didPath,
			};
		}

		return {
			version: 1,
			canisters,
			defaults: {
				build: {
					packtool: 'mops sources',
				},
			},
			networks: {
				local: {
					type: 'ephemeral',
					bind: '127.0.0.1:4945',
				},
			},
		};
	}
}
