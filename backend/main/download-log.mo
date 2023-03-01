import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import Order "mo:base/Order";
import Timer "mo:base/Timer";
import Int "mo:base/Int";
import Int32 "mo:base/Int32";

import {MINUTE; DAY} "mo:time-consts";
import Date "mo:chronosphere/Date";
import DateBase "mo:chronosphere/Base";
import Itertools "mo:itertools/Iter";
import Deiter "mo:itertools/Deiter";

import Version "./version";
import Utils "../utils";

// todo add tests
// todo history?
// todo migration v1 -> v2
// todo stable
module {
	public type PackageName = Text.Text;
	public type PackageId = Text.Text;

	public type Record = {
		time: Time.Time;
		name: PackageName;
		version: Version.Version;
		downloader: Principal;
	};

	public type Snapshot = {
		startTime: Time.Time;
		endTime: Time.Time;
		downloads: Nat;
	};

	public type ByPackageNameStable = [(Text.Text, Nat)];
	public type ByPackageIdStable = [(Text.Text, Nat)];
	public type Stable = ?{
		#v1: ([Record], ByPackageNameStable, ByPackageIdStable);
		#v2: {
			records: [Record];
			downloadsByPackageName:  [(Text.Text, Nat)];
			downloadsByPackageId: [(Text.Text, Nat)];
		};
	};

	public class DownloadLog() = {
		var downloadsByPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
		var downloadsByPackageId = TrieMap.TrieMap<PackageId, Nat>(Text.equal, Text.hash);

		var dailySnapshotsByPackageName = TrieMap.TrieMap<PackageName, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var dailySnapshotsByPackageId = TrieMap.TrieMap<PackageId, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var weeklySnapshotsByPackageName = TrieMap.TrieMap<PackageName, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var weeklySnapshotsByPackageId = TrieMap.TrieMap<PackageId, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);

		var tempRecords = Buffer.Buffer<Record>(1000); // records not yet added to snapshots
		var curSnapshotDay = 1;
		var curSnapshotWeekDay: DateBase.DayOfWeek = #Monday;
		var timerId = 0;

		public func add(record: Record) {
			let packageId = record.name # "@" # record.version;
			tempRecords.add(record);
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

		public func getTotalDownloadsByPackageId(id: PackageId): Nat {
			Option.get(downloadsByPackageId.get(id), 0);
		};

		func _getTrend(snapshotsOpt: ?Buffer.Buffer<Snapshot>, max: Nat): [Snapshot] {
			switch (snapshotsOpt) {
				case (?snapshots) {
					let deiter = Deiter.fromArray(Buffer.toArray(snapshots));
					Iter.toArray(Itertools.take(Deiter.reverse(deiter), max));
				};
				case (null) {
					[];
				};
			};
		};

		public func getDownloadTrendByPackageName(name: PackageName): [Snapshot] {
			_getTrend(dailySnapshotsByPackageName.get(name), 14);
		};

		public func getDownloadTrendByPackageId(packageId: PackageId): [Snapshot] {
			_getTrend(dailySnapshotsByPackageId.get(packageId), 14);
		};

		func takeSnapshotsIfNeeded() {
			let dateParts = Date.unpack(Date.now());
			let (#Day day) = dateParts.day;

			// daily snapshots
			if (curSnapshotDay != day) {
				let dayAgo = Time.now() - 1 * DAY;
				let #Date date = Date.now();
				let startOfDay = Int32.toInt(date) * 86400000000000 - 1 * DAY;
				let endOfDay = Int32.toInt(date) * 86400000000000 - 1;

				// daily by name
				let byPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time > dayAgo) {
						byPackageName.put(record.name, Option.get(byPackageName.get(record.name), 0) + 1);
					};
				};

				for ((name, downloads) in byPackageName.entries()) {
					let snapshots = switch (dailySnapshotsByPackageName.get(name)) {
						case (?snapshots) snapshots;
						case (null) Buffer.Buffer<Snapshot>(1);
					};
					snapshots.add({
						startTime = startOfDay;
						endTime = endOfDay;
						downloads = downloads;
					});
				};

				// daily by id
				let byPackageId = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time > dayAgo) {
						let packageId = record.name # "@" # record.version;
						byPackageId.put(packageId, Option.get(byPackageId.get(packageId), 0) + 1);
					};
				};

				for ((packageId, downloads) in byPackageId.entries()) {
					let snapshots = switch (dailySnapshotsByPackageId.get(packageId)) {
						case (?snapshots) snapshots;
						case (null) Buffer.Buffer<Snapshot>(1);
					};
					snapshots.add({
						startTime = startOfDay;
						endTime = endOfDay;
						downloads = downloads;
					});
				};

				curSnapshotDay := Int.abs(day);
			};

			// weekly snapshots
			if (curSnapshotWeekDay != dateParts.wday and dateParts.wday == #Monday) {
				let weekAgo = Time.now() - 7 * DAY;
				let #Date date = Date.now();
				let startOfWeek = Int32.toInt(date) * 86400000000000 - 7 * DAY;
				let endOfWeek = Int32.toInt(date) * 86400000000000 - 1;

				// weekly by name
				let byPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time > weekAgo) {
						byPackageName.put(record.name, Option.get(byPackageName.get(record.name), 0) + 1);
					};
				};

				for ((name, downloads) in byPackageName.entries()) {
					let snapshots = switch (weeklySnapshotsByPackageName.get(name)) {
						case (?snapshots) snapshots;
						case (null) Buffer.Buffer<Snapshot>(1);
					};
					snapshots.add({
						startTime = startOfWeek;
						endTime = endOfWeek;
						downloads = downloads;
					});
				};

				// weekly by id
				let byPackageId = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time > weekAgo) {
						let packageId = record.name # "@" # record.version;
						byPackageId.put(packageId, Option.get(byPackageId.get(packageId), 0) + 1);
					};
				};

				for ((packageId, downloads) in byPackageId.entries()) {
					let snapshots = switch (weeklySnapshotsByPackageId.get(packageId)) {
						case (?snapshots) snapshots;
						case (null) Buffer.Buffer<Snapshot>(1);
					};
					snapshots.add({
						startTime = startOfWeek;
						endTime = endOfWeek;
						downloads = downloads;
					});
				};


				curSnapshotWeekDay := dateParts.wday;
				tempRecords.clear();
			};
		};

		public func getDownloadsByPackageNameIn(name: PackageName, duration: Time.Time): Nat {
			var total = 0;
			let from = Time.now() - duration;
			let snapshots = Option.get(dailySnapshotsByPackageName.get(name), Buffer.Buffer<Snapshot>(0));

			for (snapshot in snapshots.vals()) {
				if (snapshot.startTime > from) {
					total += 1;
				};
			};

			for (record in tempRecords.vals()) {
				if (record.name == name and record.time > from) {
					total += 1;
				};
			};

			total;
		};

		public func getMostDownloadedPackageNames(max: Nat): [PackageName] {
			var arr = Iter.toArray(downloadsByPackageName.entries());
			arr := Array.map<(PackageName, Nat), (PackageName, Nat)>(arr, func(item: (PackageName, Nat)) {
				(item.0, item.1);
			});

			let sorted = Array.sort(arr, func(a: (PackageName, Nat), b: (PackageName, Nat)): Order.Order {
				Nat.compare(b.1, a.1);
			});

			Array.map<(PackageName, Nat), PackageName>(sorted, func(item) {
				item.0;
			});
		};

		public func getMostDownloadedPackageNamesIn(max: Nat, duration: Time.Time): [PackageName] {
			var arr = Iter.toArray(downloadsByPackageName.entries());
			arr := Array.map<(PackageName, Nat), (PackageName, Nat)>(arr, func(item: (PackageName, Nat)) {
				(item.0, getDownloadsByPackageNameIn(item.0, duration));
			});

			let sorted = Array.sort(arr, func(a: (PackageName, Nat), b: (PackageName, Nat)): Order.Order {
				Nat.compare(b.1, a.1);
			});

			Array.map<(PackageName, Nat), PackageName>(sorted, func(item) {
				item.0;
			});
		};

		public func setTimers() {
			Timer.cancelTimer(timerId);
			timerId := Timer.recurringTimer(#nanoseconds(5 * MINUTE), func(): async () {
				takeSnapshotsIfNeeded();
			});
		};

		public func toStable(): Stable {
			// ?#v1(
			// 	Buffer.toArray(log),
			// 	Iter.toArray(downloadsByPackageName.entries()),
			// 	Iter.toArray(downloadsByPackageId.entries()),
			// );
			// ?#v2(
			// 	Buffer.toArray(tempRecords),
			// 	Iter.toArray(downloadsByPackageName.entries()),
			// 	Iter.toArray(downloadsByPackageId.entries()),
			// );
			null;
		};

		public func loadStable(stab: Stable) {
			switch (stab) {
				case (null) {};
				case (?#v1(records, byName, byId)) {
					tempRecords := Buffer.fromArray<Record>(records);
					downloadsByPackageName := TrieMap.fromEntries<PackageName, Nat>(byName.vals(), Text.equal, Text.hash);
					downloadsByPackageId := TrieMap.fromEntries<PackageId, Nat>(byId.vals(), Text.equal, Text.hash);
				};
				case (?#v2(data)) {
				};
			};
			setTimers();
		};

		setTimers();
	};
};