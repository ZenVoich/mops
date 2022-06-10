import {rts_memory_size} "mo:prim";
import Cycles "mo:base/ExperimentalCycles";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";

import Utils "../utils";
import Types "./types";

shared({caller = parent}) actor class Storage() {
	public type StorageStats = Types.StorageStats;
	public type FileMeta = Types.FileMeta;
	public type FileId = Types.FileId;
	public type Chunk = Types.Chunk;
	public type Err = Types.Err;


	var filesMeta = TrieMap.TrieMap<FileId, FileMeta>(Text.equal, Text.hash);
	var filesChunks = TrieMap.TrieMap<FileId, [Chunk]>(Text.equal, Text.hash);


	func _getStats(): StorageStats {
		return {
			fileCount = filesMeta.size();
			memorySize = rts_memory_size();
			cyclesBalance = Cycles.balance();
		};
	};

	public query func getStats(): async StorageStats {
		_getStats();
	};

	public func acceptCycles(): async () {
		ignore Cycles.accept(Cycles.available());
	};

	public shared query ({caller}) func getFileIdsRange(start: Nat, end: Nat): async [FileId] {
		assert(caller == parent);

		let buffer = Buffer.Buffer<FileId>(end - start);
		let fileIds = Iter.toArray(filesMeta.keys());

		for (i in Iter.range(start, end - 1)) {
			buffer.add(fileIds[i]);
		};

		buffer.toArray();
	};


	// UPLOAD
	let activeUploadsMeta = TrieMap.TrieMap<FileId, FileMeta>(Text.equal, Text.hash);
	let activeUploadsChunks = TrieMap.TrieMap<FileId, [var Chunk]>(Text.equal, Text.hash);

	public shared ({caller}) func startUpload(fileMeta: FileMeta): async Result.Result<(), Err> {
		assert(caller == parent);

		switch (filesMeta.get(fileMeta.id)) {
			case (null) {};
			case (_) {
				return #err("File '" # fileMeta.id # "' already exists");
			};
		};

		activeUploadsMeta.put(fileMeta.id, fileMeta);
		activeUploadsChunks.put(fileMeta.id, Array.init<Chunk>(fileMeta.chunkCount, Blob.fromArray([])));

		#ok();
	};

	public shared ({caller}) func uploadChunk(fileId: FileId, chunkIndex: Nat, chunk: Chunk): async () {
		assert(caller == parent);

		let fileMeta = Utils.expect(activeUploadsMeta.get(fileId), "File '" # fileId # "' is not uploading");
		let chunks = Utils.expect(activeUploadsChunks.get(fileId), "File '" # fileId # "' is not uploading");
		chunks[chunkIndex] := chunk;
	};

	public shared ({caller}) func finishUpload(fileId: FileId): async () {
		assert(caller == parent);

		let fileMeta = Utils.expect(activeUploadsMeta.get(fileId), "File '" # fileId # "' is not uploading");
		let chunks = Utils.expect(activeUploadsChunks.get(fileId), "File '" # fileId # "' is not uploading");

		filesMeta.put(fileId, fileMeta);
		filesChunks.put(fileId, Array.freeze<Chunk>(chunks));

		activeUploadsMeta.delete(fileId);
		activeUploadsChunks.delete(fileId);
	};

	// update file owners
	public shared ({caller}) func updateFileOwners(fileId: FileId, owners: [Principal]): async () {
		assert(caller == parent);

		let fileMeta = Utils.expect(filesMeta.get(fileId), "File '" # fileId # "' not found");
		filesMeta.put(fileId, {
			id = fileMeta.id;
			path = fileMeta.path;
			chunkCount = fileMeta.chunkCount;
			owners = owners;
		});
	};

	// delete file
	public shared ({caller}) func deleteFile(fileId: FileId): async () {
		assert(caller == parent);

		filesMeta.delete(fileId);
		filesChunks.delete(fileId);
	};


	// DOWNLOAD
	func _getFileMeta(fileId: FileId, caller: Principal): Result.Result<FileMeta, Err>  {
		switch (filesMeta.get(fileId)) {
			case (null) {
				#err("File '" # fileId # "' not found");
			};
			case (?fileMeta) {
				if (fileMeta.owners.size() > 0) {
					let found = Array.find<Principal>(fileMeta.owners, func(owner) = owner == caller);
					if (found == null) {
						return #err("You have no permissions to access file " # fileId);
					};
				};
				#ok(fileMeta);
			};
		};
	};

	public shared query ({caller}) func getFileMeta(fileId: FileId): async Result.Result<FileMeta, Err> {
		assert(fileId.size() < 1000);
		_getFileMeta(fileId, caller);
	};

	public shared query ({caller}) func downloadChunk(fileId: FileId, chunkIndex: Nat): async Result.Result<Chunk, Err> {
		assert(fileId.size() < 1000);

		// check access
		switch (_getFileMeta(fileId, caller)) {
			case (#err(err)) {
				return #err(err);
			};
			case (#ok(_)) {};
		};

		let chunks = Utils.unwrap(filesChunks.get(fileId));
		#ok(chunks[chunkIndex]);
	};


	// SYSTEM
	stable var filesMetaStable: [(FileId, FileMeta)] = [];
	stable var filesChunksStable: [(FileId, [Chunk])] = [];

	system func preupgrade() {
		filesMetaStable := Iter.toArray(filesMeta.entries());
		filesChunksStable := Iter.toArray(filesChunks.entries());
	};

	system func postupgrade() {
		filesMeta := TrieMap.fromEntries<FileId, FileMeta>(filesMetaStable.vals(), Text.equal, Text.hash);
		filesMetaStable := [];

		filesChunks := TrieMap.fromEntries<FileId, [Chunk]>(filesChunksStable.vals(), Text.equal, Text.hash);
		filesChunksStable := [];
	};
};