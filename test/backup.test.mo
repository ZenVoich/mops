import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import {test; suite; skip} "mo:test/async";

import Backup "../backend/backup";

var backupState : Backup.State = null;

await test("init", func() : async () {
	backupState := await Backup.init(backupState);
	assert(backupState != null);
});

// cli/prim:310:4: execution error, Value.prim: stableMemorySize
await skip("backup", func() : async () {
	let backup = Backup.NewBackup(backupState);
	await backup.startBackup("v1");
	// await backup.uploadChunk(to_candid(#users([1, 2])));
	// await backup.uploadChunk(to_candid(#files(["file1", "file2"])));
	await backup.uploadChunk(Blob.fromArray([1, 2]));
	await backup.uploadChunk(Blob.fromArray([22, 33, 44]));
	await backup.finishBackup();
});