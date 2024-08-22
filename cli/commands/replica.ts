import process from 'node:process';
import {execSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {execaCommand} from 'execa';
import {IDL} from '@dfinity/candid';
import {Actor, HttpAgent} from '@dfinity/agent';
import {PocketIc, PocketIcServer} from 'pic-ic';
import {getRootDir, readConfig} from '../mops.js';
import {toolchain} from './toolchain/index.js';

export class Replica {
	type : 'dfx' | 'pocket-ic';
	verbose = false;
	canisters : Record<string, {cwd : string; canisterId : string; actor : any;}> = {};
	pocketIcServer ?: PocketIcServer;
	pocketIc ?: PocketIc;
	dir : string; // '.mops/.bench/'

	constructor(type : 'dfx' | 'pocket-ic', dir : string, verbose = false) {
		this.type = type;
		this.verbose = verbose;
		this.dir = dir;
	}

	async start({silent = false} = {}) {
		silent || console.log(`Starting ${this.type} replica...`);

		if (this.type == 'dfx') {
			await this.stop();
			let dir = path.join(getRootDir(), this.dir);
			fs.writeFileSync(path.join(dir, 'dfx.json'), JSON.stringify(this.dfxJson(''), null, 2));
			execSync('dfx start --background --clean --artificial-delay 0' + (this.verbose ? '' : ' -qqqq'), {cwd: dir, stdio: ['inherit', this.verbose ? 'inherit' : 'ignore', 'inherit']});
		}
		else {
			let pocketIcBin = await toolchain.bin('pocket-ic');

			// eslint-disable-next-line
			let config = readConfig();
			// if (config.toolchain?.['pocket-ic'] !== '4.0.0') {
			// 	console.error('Current Mops CLI only supports pocket-ic 4.0.0');
			// 	process.exit(1);
			// }

			this.pocketIcServer = await PocketIcServer.start({
				showRuntimeLogs: true,
				showCanisterLogs: true,
				binPath: pocketIcBin,
			});

			this.pocketIc = await PocketIc.create(this.pocketIcServer.getUrl());
		}
	}

	async stop() {
		if (this.type == 'dfx') {
			let dir = path.join(getRootDir(), this.dir);
			execSync('dfx stop' + (this.verbose ? '' : ' -qqqq'), {cwd: dir, stdio: ['pipe', this.verbose ? 'inherit' : 'ignore', 'pipe']});
		}
		else if (this.pocketIc && this.pocketIcServer) {
			await this.pocketIc.tearDown();
			await this.pocketIcServer.stop();
		}
	}

	async deploy(name : string, wasm : string, idlFactory : IDL.InterfaceFactory, cwd : string = process.cwd()) {
		if (this.type === 'dfx') {
			await execaCommand(`dfx deploy ${name} --mode reinstall --yes --identity anonymous`, {cwd, stdio: this.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});
			let canisterId = execSync(`dfx canister id ${name}`, {cwd}).toString().trim();

			let actor = Actor.createActor(idlFactory, {
				agent: await HttpAgent.create({
					host: 'http://127.0.0.1:4944',
					shouldFetchRootKey: true,
				}),
				canisterId,
			});

			this.canisters[name] = {cwd, canisterId, actor};
		}
		else if (this.pocketIc) {
			let {canisterId, actor} = await this.pocketIc.setupCanister({
				idlFactory,
				wasm,
			});
			await this.pocketIc.addCycles(canisterId, 1_000_000_000_000);
			this.canisters[name] = {
				cwd,
				canisterId: canisterId.toText(),
				actor,
			};
		}
	}

	getActor(name : string) : unknown {
		if (!this.canisters[name]) {
			throw new Error(`Canister ${name} not found`);
		}
		return this.canisters[name]?.actor;
	}

	getCanisterId(name : string) : string {
		return this.canisters[name]?.canisterId || '';
	}

	dfxJson(canisterName : string) {
		let canisters : Record<string, any> = {};
		if (canisterName) {
			canisters[canisterName] = {
				type: 'custom',
				wasm: 'canister.wasm',
				candid: 'canister.did',
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
					bind: '127.0.0.1:4944',
				},
			},
		};
	}
}
