import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";

import BackupCanister "./backup-canister";

module {
	public type State = ?{
		#v1 : Principal;
	};

	public type Duration = {
		#nanoseconds : Nat;
		#seconds : Nat;
		#minutes : Nat;
		#hours : Nat;
		#days : Nat;
	};


	public func init(state : State) : async State {
		switch (state) {
			case (null) {
				let canisterId = await _createBackupCanister();
				?#v1(canisterId);
			};
			case (sameState) {
				sameState;
			};
		};
	};

	public func getCanisterId(state : State) : Principal {
		let ?#v1(canisterId) = state else Debug.trap("Backup canister not initialized");
		canisterId;
	};

	public func getCanister(state : State) : BackupCanister.BackupCanister {
		let canisterId = getCanisterId(state);
		actor(Principal.toText(canisterId)) : BackupCanister.BackupCanister;
	};

	shared ({caller}) func _createBackupCanister() : async Principal {
		ExperimentalCycles.add(1_000_000_000_000); // 1 TC
		let backupCanister = await BackupCanister.BackupCanister([caller]);
		// let backupCanister = await (system BackupCanister.BackupCanister)(#new {
		// 	settings = ?{
		// 		controllers = ?[caller];
		// 		freezing_threshold = ?15_768_000; // 6 months
		// 		compute_allocation = null;
		// 		memory_allocation = null;
		// 	}
		// })([caller]);
		Principal.fromActor(backupCanister);
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

	public func setTimer(state : State, duration : Duration, backupFn : () -> async ()) : Nat {
		Timer.recurringTimer(#nanoseconds(_toNanos(duration)), backupFn);
	};

	public class NewBackup(state : State) {
		let backupCanister : BackupCanister.BackupCanister = getCanister(state);

		public var backupId = 0;

		public func startBackup(tag : Text) : async () {
			backupId := await backupCanister.startBackup(tag);
		};

		public func uploadChunk(blob : Blob) : async () {
			await backupCanister.uploadChunk(backupId, blob);
		};

		public func finishBackup() : async () {
			await backupCanister.finishBackup(backupId);
		};
	};
};