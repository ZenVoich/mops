import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";

import Version "./version";
import Utils "../utils";

module {
	public type PackageName = Text.Text;
	public type PackageId = Text.Text;

	public type Record = {
		time: Time.Time;
		name: PackageName;
		version: Version.Version;
		downloader: Principal;
	};

	public type ByPackageNameStable = [(Text.Text, Nat)];
	public type ByPackageIdStable = [(Text.Text, Nat)];
	public type Stable = ?{
		#v1: ([Record], ByPackageNameStable, ByPackageIdStable);
	};

	public class DownloadLog() = {
		var log = Buffer.Buffer<Record>(1000);
		public var downloadsByPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
		var downloadsByPackageId = TrieMap.TrieMap<PackageId, Nat>(Text.equal, Text.hash);

		public func add(record: Record) {
			let packageId = record.name # "@" # record.version;
			log.add(record);
			downloadsByPackageName.put(record.name, Option.get(downloadsByPackageName.get(record.name), 0) + 1);
			downloadsByPackageId.put(packageId, Option.get(downloadsByPackageId.get(packageId), 0) + 1);
		};

		public func getTotalDownloads(): Nat {
			var total = 0;
			for (count in downloadsByPackageName.vals()) {
				total += count;
			};
			total;
		};

		public func getTotalDownloadsByPackageName(name: PackageName): Nat {
			Option.get(downloadsByPackageName.get(name), 0);
		};

		public func get30DayDownloadsByPackageName(name: PackageName): Nat {
			let t30Days = 1_000_000_000 * 60 * 60 * 24 * 30;
			let t30DaysAgo = Time.now() - t30Days;
			var total = 0;
			for (record in log.vals()) {
				if (record.name == name and record.time > t30DaysAgo) {
					total += 1;
				};
			};
			total;
		};

		public func toStable(): Stable {
			?#v1(
				Buffer.toArray(log),
				Iter.toArray(downloadsByPackageName.entries()),
				Iter.toArray(downloadsByPackageId.entries()),
			);
		};

		public func loadStable(stab: Stable) {
			switch (stab) {
				case (null) {};
				case (?#v1(records, byName, byId)) {
					log := Buffer.fromArray<Record>(records);
					downloadsByPackageName := TrieMap.fromEntries<PackageName, Nat>(byName.vals(), Text.equal, Text.hash);
					downloadsByPackageId := TrieMap.fromEntries<PackageId, Nat>(byId.vals(), Text.equal, Text.hash);
				};
			};
		};
	};
};