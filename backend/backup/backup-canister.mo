import Array "mo:base/Array";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Int32 "mo:base/Int32";
import Int "mo:base/Int";
import Char "mo:base/Char";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import ExperimentalStableMemory "mo:base/ExperimentalStableMemory";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";

import DateTime "mo:motoko-datetime/DateTime";
import LinkedList "mo:linked-list";
import Map "mo:map/Map";

actor class BackupCanister(whitelist : [Principal]) {
	type BackupId = Nat;
	type Chunk = Blob;

	type Backup = {
		id : BackupId;
		tag : Text;
		startTime : Time.Time;
		endTime : Time.Time;
		size : Nat;
		chunkRefs : [ChunkRef];
		biggestChunk : {
			index : Nat;
			size : Nat;
		};
	};

	type ChunkRef = {
		offset : Nat;
		size : Nat;
	};

	type UploadingBackup = {
		tag : Text;
		startTime : Time.Time;
		chunks : LinkedList.LinkedList<Blob>;
	};

	stable var curBackupId = 0;
	stable var curOffset = 0;
	stable var totalSize = 0;
	stable var backups = Map.new<BackupId, Backup>(Map.nhash);

	let PAGE_SIZE = 65536; // 64KB
	let GROW_PAGES = 512 : Nat64; // 32MB
	let uploadingBackups = TrieMap.TrieMap<BackupId, UploadingBackup>(Nat.equal, func x = Text.hash(Nat.toText(x)));

	/////////////////////////
	// HELPERS
	/////////////////////////

	func _isWhitelisted(id : Principal) : Bool {
		Array.find<Principal>(whitelist, func(whitelisted) = whitelisted == id) != null;
	};

	func _isAllowed(id : Principal) : Bool {
		_isWhitelisted(id) or Principal.isController(id);
	};

	func _storeChunk(chunk : Blob) : ChunkRef {
		let pages = Nat64.toNat(ExperimentalStableMemory.size());
		if (pages * PAGE_SIZE < curOffset + chunk.size()) {
			let beforePages = ExperimentalStableMemory.grow(GROW_PAGES);
			if (beforePages == 0xFFFF_FFFF_FFFF_FFFF) {
				Debug.trap("Cannot grow stable memory");
			};
		};

		let offset = curOffset;
		ExperimentalStableMemory.storeBlob(Nat64.fromNat(offset), chunk);
		curOffset += chunk.size();

		return {
			offset;
			size = chunk.size();
		};
	};

	/////////////////////////
	// BACKUP
	/////////////////////////

	public shared ({caller}) func startBackup(tag : Text) : async BackupId {
		assert(_isAllowed(caller));

		let backupId = curBackupId;
		curBackupId += 1;

		uploadingBackups.put(backupId, {
			tag;
			startTime = Time.now();
			chunks = LinkedList.LinkedList<Blob>();
		});

		backupId;
	};

	public shared ({caller}) func uploadChunk(backupId : BackupId, chunk : Chunk) : async () {
		assert(_isAllowed(caller));

		let ?uploadingBackup = uploadingBackups.get(backupId) else Debug.trap("uploadChunk: Invalid backup id " # Nat.toText(backupId));
		LinkedList.append(uploadingBackup.chunks, chunk);
	};

	public shared ({caller}) func finishBackup(backupId : BackupId) : async () {
		assert(_isAllowed(caller));

		let ?uploadingBackup = uploadingBackups.get(backupId) else Debug.trap("finishBackup: Invalid backup id " # Nat.toText(backupId));

		let chunkRefs = LinkedList.LinkedList<ChunkRef>();
		var size = 0;
		var biggestChunk = {
			index = 0;
			size = 0;
		};

		var i = 0;
		for (chunk in LinkedList.vals(uploadingBackup.chunks)) {
			let chunkRef = _storeChunk(chunk);
			size += chunkRef.size;
			LinkedList.append(chunkRefs, chunkRef);

			if (chunkRef.size > biggestChunk.size) {
				biggestChunk := {
					index = i;
					size = chunkRef.size;
				};
			};

			i += 1;
		};

		Map.set(backups, Map.nhash, backupId, {
			id = backupId;
			tag = uploadingBackup.tag;
			startTime = uploadingBackup.startTime;
			endTime = Time.now();
			size = size;
			chunkRefs = LinkedList.toArray(chunkRefs);
			biggestChunk = biggestChunk;
		});

		totalSize += size;

		uploadingBackups.delete(backupId);
	};

	/////////////////////////
	// RESTORE
	/////////////////////////

	public query ({caller}) func getChunk(backupId : Nat, chunkIndex : Nat) : async (Chunk, Bool) {
		assert(_isAllowed(caller));

		let ?backup = Map.get(backups, Map.nhash, backupId) else Debug.trap("getChunk: Invalid backup id " # Nat.toText(backupId));
		(_chunkFromRef(backup.chunkRefs[chunkIndex]), backup.chunkRefs.size() == chunkIndex + 1);
	};

	func _chunkFromRef(ref : ChunkRef) : Chunk {
		ExperimentalStableMemory.loadBlob(Nat64.fromNat(ref.offset), ref.size);
	};

	/////////////////////////
	// HTTP
	/////////////////////////

	func formatTime(time : Time.Time) : Text {
		let dt = DateTime.DateTime(?Int.abs(time));
		var res = "";
		res #= dt.showYear();
		res #= "-";
		res #= dt.showMonth();
		res #= "-";
		res #= dt.showDay();
		res #= " ";
		res #= dt.showHours();
		res #= ":";
		res #= dt.showMinutes();
		res #= ":";
		res #= dt.showSeconds();
		res;
	};

	func formatDuration(dur : Time.Time) : Text {
		Int.toText(dur / 1_000_000_000) # " s";
	};

	func formatSize(size : Nat, suffixes : [Text]) : Text {
		func _format(div : Nat, suffix : Text) : Text {
			let q = size / div;
			var r = size % div;
			let rText = Nat.toText(r) # "00";
			let rChars = Iter.toArray(rText.chars());
			Nat.toText(q) # "." # Char.toText(rChars[0]) # Char.toText(rChars[1]) # suffix;
		};

		let res = if (size < 1024) {
			Nat.toText(size) # " " #suffixes[0];
		}
		else if (size < 1024 ** 2) {
			_format(1024, " K" # suffixes[1]);
		}
		else if (size < 1024 ** 3) {
			_format(1024 ** 2, " M" # suffixes[1]);
		}
		else if (size < 1024 ** 4) {
			_format(1024 ** 3, " G" # suffixes[1]);
		}
		else {
			_format(1024 ** 4, " T" # suffixes[1]);
		};

		if (res.size() < 8) {
			res # "\t";
		}
		else {
			res;
		};
	};

	public type HeaderField = (Text, Text);

	public type HttpRequest = {
		url : Text;
		method : Text;
		body : Blob;
		headers : [HeaderField];
	};

	public type HttpResponse = {
		body : Blob;
		headers : [HeaderField];
		status_code : Nat16;
	};

	public query func http_request(request : HttpRequest) : async HttpResponse {
		var body = "";
		body #= "Total backups:\t\t" # Nat.toText(Map.size(backups)) # "\n\n";
		body #= "Total size:\t\t" # formatSize(totalSize, ["b", "B"]) # "\n\n";
		body #= "Allocated memory:\t" # formatSize(Prim.rts_memory_size(), ["b", "B"]) # "\n\n";
		body #= "Cycles balance:\t\t" # formatSize(ExperimentalCycles.balance(), ["cycles", "C"]) # "\n\n";
		body #= "\n\n\n";
		body #= "ID\t\tStart Time\t\t\tSize\t\tDuration\tChunks\t\tBiggest Chunk\t\tTag\n";
		body #= "----------------------------------------------------------------------------------------------------------------------------------\n";

		for (backup in Map.valsDesc(backups)) {
			body #= "" # Nat.toText(backup.id) # "\t\t"
				# formatTime(backup.startTime) # "\t\t"
				# formatSize(backup.size, ["b", "B"]) # "\t"
				# formatDuration(backup.endTime - backup.startTime) # "\t\t"
				# Nat.toText(backup.chunkRefs.size()) # "\t\t"
				# "#" # Nat.toText(backup.biggestChunk.index) # " - " # formatSize(backup.biggestChunk.size, ["b", "B"]) # "\t"
				# backup.tag
				# "\n";
		};

		{
			status_code = 200;
			headers = [];
			body = Text.encodeUtf8(body);
		};
	};
};