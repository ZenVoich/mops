import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";

import BackupCanister "./backup-canister";

module {
	public type State = {
		#v1 : {
			var canisterId : ?Principal;
		};
	};

	public type BackupService = BackupCanister.BackupCanister;

	public type Duration = {
		#nanoseconds : Nat;
		#seconds : Nat;
		#minutes : Nat;
		#hours : Nat;
		#days : Nat;
	};

	public func init(canisterId : ?Principal) : State {
		#v1({
			var canisterId = canisterId;
		});
	};

	public class BackupManager(state : State) {
		func _ensureBackupCanister() : async () {
			switch (state) {
				case (#v1(data)) {
					if (data.canisterId == null) {
						let canisterId = await _createBackupCanister();
						data.canisterId := ?canisterId;
					};
				};
			};
		};

		func _createBackupCanister() : async Principal {
			if (ExperimentalCycles.balance() < 2_000_000_000_000) {
				Debug.trap("Not enough cycles to create backup canister");
			};
			ExperimentalCycles.add(1_000_000_000_000); // 1 TC
			// let backupCanister = await BackupCanister.BackupCanister([]);
			let backupCanister = await (system BackupCanister.BackupCanister)(#new {
				settings = ?{
					controllers = null;
					freezing_threshold = ?15_768_000; // 6 months
					compute_allocation = null;
					memory_allocation = null;
				}
			})([]);
			Principal.fromActor(backupCanister);
		};

		public func getCanisterId() : Principal {
			let #v1(data) = state else Debug.trap("Backup canister not initialized");
			let ?canisterId = data.canisterId else Debug.trap("Backup canister not initialized");
			canisterId;
		};

		public func getCanister() : BackupCanister.BackupCanister {
			let canisterId = getCanisterId();
			actor(Principal.toText(canisterId)) : BackupCanister.BackupCanister;
		};

		public func setTimer(duration : Duration, backupFn : () -> async ()) : Nat {
			var backupInProgress = false;
			Timer.recurringTimer(#nanoseconds(_toNanos(duration)), func() : async () {
				if (backupInProgress) {
					return;
				};
				backupInProgress := true;
				try {
					await backupFn();
				} catch (_) {};
				backupInProgress := false;
			});
		};

		public func restore(backupId : Nat, restoreChunk : (Blob) -> ()) : async () {
			let backupCanister = getCanister();
			var chunkIndex = 0;

			label l while (true) {
				let (blob, done) = await backupCanister.getChunk(backupId, chunkIndex);

				restoreChunk(blob);

				if (done) {
					break l;
				};
				chunkIndex += 1;
			};
		};

		public class NewBackup(tag : Text) {
			public var backupId = 0;

			public func startBackup() : async () {
				await _ensureBackupCanister();
				backupId := await getCanister().startBackup(tag);
			};

			public func uploadChunk(blob : Blob) : async () {
				await getCanister().uploadChunk(backupId, blob);
			};

			public func finishBackup() : async () {
				await getCanister().finishBackup(backupId);
			};
		};
	};

	func _toNanos(duration : Duration) : Nat {
		switch (duration) {
			case (#nanoseconds(ns)) ns;
			case (#seconds(s)) s * 1_000_000_000;
			case (#minutes(m)) m * 1_000_000_000 * 60;
			case (#hours(h)) h * 1000_000_000 * 60 * 60;
			case (#days(d)) d * 1000_000_000 * 60 * 60 * 24;
		};
	};
};