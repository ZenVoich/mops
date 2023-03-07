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
import Nat32 "mo:base/Nat32";

import {MINUTE; DAY} "mo:time-consts";
import Date "mo:chronosphere/Date";
import DateBase "mo:chronosphere/Base";
import Itertools "mo:itertools/Iter";
import Deiter "mo:itertools/Deiter";

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
			totalDownloads: Nat;
			downloadsByPackageName: [(Text.Text, Nat)];
			downloadsByPackageId: [(Text.Text, Nat)];
			dailySnapshots: [Snapshot];
			weeklySnapshots: [Snapshot];
			dailySnapshotsByPackageName: [(Text.Text, [Snapshot])];
			dailySnapshotsByPackageId: [(Text.Text, [Snapshot])];
			weeklySnapshotsByPackageName: [(Text.Text, [Snapshot])];
			weeklySnapshotsByPackageId: [(Text.Text, [Snapshot])];
			tempRecords: [Record];
			curSnapshotDay: Nat;
			curSnapshotWeekDay: DateBase.DayOfWeek;
			timerId: Nat;
		};
	};

	public class DownloadLog() = {
		var totalDownloads = 0;

		var downloadsByPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
		var downloadsByPackageId = TrieMap.TrieMap<PackageId, Nat>(Text.equal, Text.hash);

		var dailySnapshots = Buffer.Buffer<Snapshot>(1000);
		var weeklySnapshots = Buffer.Buffer<Snapshot>(1000);

		var dailySnapshotsByPackageName = TrieMap.TrieMap<PackageName, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var dailySnapshotsByPackageId = TrieMap.TrieMap<PackageId, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var weeklySnapshotsByPackageName = TrieMap.TrieMap<PackageName, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);
		var weeklySnapshotsByPackageId = TrieMap.TrieMap<PackageId, Buffer.Buffer<Snapshot>>(Text.equal, Text.hash);

		var tempRecords = Buffer.Buffer<Record>(1000); // records not yet added to snapshots
		var curSnapshotDay = 0;
		var curSnapshotWeekDay: DateBase.DayOfWeek = #Monday;
		var timerId = 0;

		public func add(record: Record) {
			let packageId = record.name # "@" # record.version;
			tempRecords.add(record);
			downloadsByPackageName.put(record.name, Option.get(downloadsByPackageName.get(record.name), 0) + 1);
			downloadsByPackageId.put(packageId, Option.get(downloadsByPackageId.get(packageId), 0) + 1);
			totalDownloads += 1;
		};

		public func getTotalDownloads(): Nat {
			totalDownloads;
		};

		public func recalcTotalDownloads() {
			var total = 0;
			for (count in downloadsByPackageName.vals()) {
				total += count;
			};
			totalDownloads := total
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

		public func getDownloadTrend(): [Snapshot] {
			_getTrend(?dailySnapshots, 14);
		};

		public func getDownloadTrendByPackageName(name: PackageName): [Snapshot] {
			_getTrend(dailySnapshotsByPackageName.get(name), 14);
		};

		public func getDownloadTrendByPackageId(packageId: PackageId): [Snapshot] {
			_getTrend(dailySnapshotsByPackageId.get(packageId), 14);
		};

		public func takeSnapshotsIfNeeded() {
			let timeNow = Time.now();
			let dateNow = timeNow / 86400000000000;

			let dateParts = Date.unpack(#Date(Int32.fromInt(dateNow)));
			let (#Day day) = dateParts.day;

			// daily snapshots
			if (curSnapshotDay != Int.abs(day)) {
				let dayAgo = timeNow - 1 * DAY;
				let startOfPrevDay = dateNow * 86400000000000 - 1 * DAY;
				let endOfPrevDay = dateNow * 86400000000000 - 1;

				// daily total
				dailySnapshots.add({
					startTime = startOfPrevDay;
					endTime = endOfPrevDay;
					downloads = totalDownloads;
				});

				// daily by name
				let byPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time >= dayAgo) {
						byPackageName.put(record.name, Option.get(byPackageName.get(record.name), 0) + 1);
					};
				};

				for ((name, downloads) in byPackageName.entries()) {
					let snapshots = switch (dailySnapshotsByPackageName.get(name)) {
						case (?snapshots) snapshots;
						case (null) {
							let snapshots = Buffer.Buffer<Snapshot>(1);
							dailySnapshotsByPackageName.put(name, snapshots);
							snapshots;
						};
					};
					snapshots.add({
						startTime = startOfPrevDay;
						endTime = endOfPrevDay;
						downloads = downloads;
					});
				};

				// daily by id
				let byPackageId = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time >= dayAgo) {
						let packageId = record.name # "@" # record.version;
						byPackageId.put(packageId, Option.get(byPackageId.get(packageId), 0) + 1);
					};
				};

				for ((packageId, downloads) in byPackageId.entries()) {
					let snapshots = switch (dailySnapshotsByPackageId.get(packageId)) {
						case (?snapshots) snapshots;
						case (null) {
							let snapshots = Buffer.Buffer<Snapshot>(1);
							dailySnapshotsByPackageId.put(packageId, snapshots);
							snapshots;
						}
					};
					snapshots.add({
						startTime = startOfPrevDay;
						endTime = endOfPrevDay;
						downloads = downloads;
					});
				};
			};

			// weekly snapshots
			if (curSnapshotWeekDay != dateParts.wday and dateParts.wday == #Monday) {
				let weekAgo = timeNow - 7 * DAY;
				let startOfPrevWeek = dateNow * 86400000000000 - 7 * DAY;
				let endOfPrevWeek = dateNow * 86400000000000 - 1;

				// weekly total
				weeklySnapshots.add({
					startTime = startOfPrevWeek;
					endTime = endOfPrevWeek;
					downloads = totalDownloads;
				});

				// weekly by name
				let byPackageName = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time >= weekAgo) {
						byPackageName.put(record.name, Option.get(byPackageName.get(record.name), 0) + 1);
					};
				};

				for ((name, downloads) in byPackageName.entries()) {
					let snapshots = switch (weeklySnapshotsByPackageName.get(name)) {
						case (?snapshots) snapshots;
						case (null) {
							let snapshots = Buffer.Buffer<Snapshot>(1);
							weeklySnapshotsByPackageName.put(name, snapshots);
							snapshots;
						}
					};
					snapshots.add({
						startTime = startOfPrevWeek;
						endTime = endOfPrevWeek;
						downloads = downloads;
					});
				};

				// weekly by id
				let byPackageId = TrieMap.TrieMap<PackageName, Nat>(Text.equal, Text.hash);
				for (record in tempRecords.vals()) {
					if (record.time >= weekAgo) {
						let packageId = record.name # "@" # record.version;
						byPackageId.put(packageId, Option.get(byPackageId.get(packageId), 0) + 1);
					};
				};

				for ((packageId, downloads) in byPackageId.entries()) {
					let snapshots = switch (weeklySnapshotsByPackageId.get(packageId)) {
						case (?snapshots) snapshots;
						case (null) {
							let snapshots = Buffer.Buffer<Snapshot>(1);
							weeklySnapshotsByPackageId.put(packageId, snapshots);
							snapshots;
						}
					};
					snapshots.add({
						startTime = startOfPrevWeek;
						endTime = endOfPrevWeek;
						downloads = downloads;
					});
				};

				tempRecords.clear();
			};

			curSnapshotDay := Int.abs(day);
			curSnapshotWeekDay := dateParts.wday;
		};

		public func getDownloadsByPackageNameIn(name: PackageName, duration: Time.Time): Nat {
			var total = 0;
			let from = Time.now() - duration;
			let snapshots = Option.get(dailySnapshotsByPackageName.get(name), Buffer.Buffer<Snapshot>(0));

			label l for (snapshot in snapshots.vals()) {
				if (snapshot.startTime >= from) {
					total += 1;
				}
				else break l;
			};

			for (record in tempRecords.vals()) {
				if (record.name == name and record.time >= from) {
					total += 1;
				};
			};

			total;
		};

		public func getMostDownloadedPackageNames(): [PackageName] {
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

		public func getMostDownloadedPackageNamesIn(duration: Time.Time): [PackageName] {
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
			func snapshotsToStable(snapshotsMap: TrieMap.TrieMap<Text.Text, Buffer.Buffer<Snapshot>>): [(Text.Text, [Snapshot])] {
				Iter.toArray(
					Iter.map<(Text.Text, Buffer.Buffer<Snapshot>), (Text.Text, [Snapshot])>(
						snapshotsMap.entries(),
						func((key, buf)) {
							(key, Buffer.toArray(buf));
						}
					)
				);
			};

			?#v2({
				totalDownloads;
				downloadsByPackageName = Iter.toArray(downloadsByPackageName.entries());
				downloadsByPackageId = Iter.toArray(downloadsByPackageId.entries());
				dailySnapshots = Buffer.toArray(dailySnapshots);
				weeklySnapshots = Buffer.toArray(weeklySnapshots);
				dailySnapshotsByPackageName = snapshotsToStable(dailySnapshotsByPackageName);
				dailySnapshotsByPackageId = snapshotsToStable(dailySnapshotsByPackageId);
				weeklySnapshotsByPackageName = snapshotsToStable(weeklySnapshotsByPackageName);
				weeklySnapshotsByPackageId = snapshotsToStable(weeklySnapshotsByPackageId);
				tempRecords = Buffer.toArray(tempRecords);
				curSnapshotDay;
				curSnapshotWeekDay;
				timerId;
			});
		};

		public func loadStable(stab: Stable) {
			switch (stab) {
				case (?#v1(records, byName, byId)) {
					tempRecords := Buffer.fromArray<Record>(records);
					downloadsByPackageName := TrieMap.fromEntries<PackageName, Nat>(byName.vals(), Text.equal, Text.hash);
					downloadsByPackageId := TrieMap.fromEntries<PackageId, Nat>(byId.vals(), Text.equal, Text.hash);
					recalcTotalDownloads();
				};
				case (?#v2(data)) {
					func snapshotsFromStable(snapshotsMapStable: [(Text.Text, [Snapshot])]): TrieMap.TrieMap<Text.Text, Buffer.Buffer<Snapshot>> {
						let iter = Iter.map<(Text.Text, [Snapshot]), (Text.Text, Buffer.Buffer<Snapshot>)>(
							snapshotsMapStable.vals(),
							func((key, buf)) {
								(key, Buffer.fromArray(buf));
							}
						);
						TrieMap.fromEntries(iter, Text.equal, Text.hash);
					};

					downloadsByPackageName := TrieMap.fromEntries<PackageName, Nat>(data.downloadsByPackageName.vals(), Text.equal, Text.hash);
					downloadsByPackageId := TrieMap.fromEntries<PackageName, Nat>(data.downloadsByPackageId.vals(), Text.equal, Text.hash);

					dailySnapshots := Buffer.fromArray<Snapshot>(data.dailySnapshots);
					weeklySnapshots := Buffer.fromArray<Snapshot>(data.weeklySnapshots);

					dailySnapshotsByPackageName := snapshotsFromStable(data.dailySnapshotsByPackageName);
					dailySnapshotsByPackageId := snapshotsFromStable(data.dailySnapshotsByPackageId);
					weeklySnapshotsByPackageName := snapshotsFromStable(data.weeklySnapshotsByPackageName);
					weeklySnapshotsByPackageId := snapshotsFromStable(data.weeklySnapshotsByPackageId);

					tempRecords := Buffer.fromArray<Record>(data.tempRecords);
					curSnapshotDay := data.curSnapshotDay;
					curSnapshotWeekDay := data.curSnapshotWeekDay;
					timerId := data.timerId;
				};
				case (null) {};
			};
		};
	};
};