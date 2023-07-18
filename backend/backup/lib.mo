import Principal "mo:base/Principal";
import BackupCanister "./backup-canister";
import Debug "mo:base/Debug";
import ExperimentalCycles "mo:base/ExperimentalCycles";

module {
	public type State = ?Principal;

	public func init(state : State) : async State {
		switch (state) {
			case (?canisterId) {
				?canisterId;
			};
			case (null) {
				?(await createBackupCanister());
			};
		};
	};

	public func getCanister(state : State) : BackupCanister.BackupCanister {
		let ?canisterId = state else Debug.trap("Backup canister not initialized");
		actor(Principal.toText(canisterId)) : BackupCanister.BackupCanister;
	};

	public shared ({caller}) func createBackupCanister() : async Principal {
		ExperimentalCycles.add(1_000_000_000_000); // 1 TC
		let backupCanister = await BackupCanister.BackupCanister([caller]);
		// let backupCanister = await (system BackupCanister.BackupCanister)(#new {
		// 	settings = ?{
		// 		controllers = ?[caller];
		// 		freezing_threshold = ?15_768_000; // 6 months
		// 		compute_allocation = null;
		// 		memory_allocation = null;
		// 	}
		// })([]);
		Principal.fromActor(backupCanister);
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