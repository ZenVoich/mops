import {PocketIc, PocketIcServer} from '@hadronous/pic';

let picServer = await PocketIcServer.start({
	showRuntimeLogs: true,
	showCanisterLogs: true,
});
let pic = await PocketIc.create(picServer.getUrl());
let {canisterId, actor} = await pic.setupCanister({
	idlFactory: ({IDL}) => {
		return IDL.Service({'runTests': IDL.Func([], [], [])});
	},
	wasm: '.mops/.test/storage-actor.test.wasm',
	cycles: 1_000_000_000_000_000_000n, // doesn't help
});

await pic.addCycles(canisterId, 1_000_000_000_000); // doesn't help

await actor.runTests(); // error

await picServer.stop();