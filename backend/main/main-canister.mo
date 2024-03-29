import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Order "mo:base/Order";
import Option "mo:base/Option";
import Blob "mo:base/Blob";

import IC "mo:ic";
import {DAY} "mo:time-consts";
import Backup "mo:backup";
import Sha256 "mo:sha2/Sha256";
import HttpTypes "mo:http-types";

import Utils "../utils";
import Semver "./utils/semver";
import Types "./types";
import DownloadLog "./DownloadLog";
import StorageManager "../storage/storage-manager";
import Storage "../storage/storage-canister";
import Users "./Users";
import Badges "./badges";

import Registry "./registry/Registry";
import PackagePublisher "./PackagePublisher";
import {searchInRegistry} "./registry/searchInRegistry";
import {getPackageSummary} "./registry/getPackageSummary";
import {getPackageDetails = _getPackageDetails} "./registry/getPackageDetails";
import {getPackageChanges} "./registry/getPackageChanges";
import {packagesByCategory} "./registry/packagesByCategory";
import {getDefaultPackages = _getDefaultPackages} "./registry/getDefaultPackages";
import {verifyPackageRepository} "./verifyPackageRepository";

actor class Main() {
	public type PackageName = Text.Text; // lib
	public type PackageVersion = Types.PackageVersion; // 1.2.3
	public type PackageId = Text.Text; // lib@1.2.3
	public type FileId = Types.FileId;
	public type Err = Text.Text;
	public type PackageConfigV2 = Types.PackageConfigV2;
	public type PackageConfigV3 = Types.PackageConfigV3;
	public type PackagePublication = Types.PackagePublication;
	public type PackageDetails = Types.PackageDetails;
	public type PackageSummary = Types.PackageSummary;
	public type PackageSummaryWithChanges = Types.PackageSummaryWithChanges;
	public type PackageFileStats = Types.PackageFileStats;
	public type DownloadsSnapshot = Types.DownloadsSnapshot;
	public type User = Types.User;
	public type PageCount = Nat;
	public type SemverPart = Types.SemverPart;
	public type TestStats = Types.TestStats;
	public type PublishingId = Text;
	public type Benchmarks = Types.Benchmarks;

	let API_VERSION = "1.2"; // (!) make changes in pair with cli

	var packageVersions = TrieMap.TrieMap<PackageName, [PackageVersion]>(Text.equal, Text.hash);
	var packageOwners = TrieMap.TrieMap<PackageName, Principal>(Text.equal, Text.hash);
	var highestConfigs = TrieMap.TrieMap<PackageName, PackageConfigV3>(Text.equal, Text.hash);

	var packageConfigs = TrieMap.TrieMap<PackageId, PackageConfigV3>(Text.equal, Text.hash);
	var packagePublications = TrieMap.TrieMap<PackageId, PackagePublication>(Text.equal, Text.hash);
	var fileIdsByPackage = TrieMap.TrieMap<PackageId, [FileId]>(Text.equal, Text.hash);
	var hashByFileId = TrieMap.TrieMap<FileId, Blob>(Text.equal, Text.hash);
	var packageFileStats = TrieMap.TrieMap<PackageId, PackageFileStats>(Text.equal, Text.hash);
	var packageTestStats = TrieMap.TrieMap<PackageId, TestStats>(Text.equal, Text.hash);
	var packageBenchmarks = TrieMap.TrieMap<PackageId, Benchmarks>(Text.equal, Text.hash);
	var packageNotes = TrieMap.TrieMap<PackageId, Text>(Text.equal, Text.hash);

	var registry = Registry.Registry(
		packageVersions,
		packageOwners,
		highestConfigs,
		packageConfigs,
		packagePublications,
		fileIdsByPackage,
		hashByFileId,
		packageFileStats,
		packageTestStats,
		packageBenchmarks,
		packageNotes,
	);

	let downloadLog = DownloadLog.DownloadLog();
	downloadLog.setTimers();

	let storageManager = StorageManager.StorageManager();
	let users = Users.Users();

	var packagePublisher = PackagePublisher.PackagePublisher(registry, storageManager);

	// PRIVATE
	func _resolveVersion(name : PackageName, version : PackageVersion) : ?PackageVersion {
		if (version == "highest") {
			registry.getHighestVersion(name);
		}
		else {
			?version;
		};
	};

	func _getPackageSummary(name : PackageName, version : PackageVersion) : ?PackageSummary {
		getPackageSummary(registry, users, downloadLog, name, version);
	};

	func _getPackageSummaryWithChanges(name : PackageName, version : PackageVersion) : ?PackageSummaryWithChanges {
		let ?packageSummary = _getPackageSummary(name, version) else return null;
		?{
			packageSummary with
			changes = getPackageChanges(registry, name, version);
		};
	};

	public shared query func transformRequest(arg : IC.HttpTransformArg) : async IC.HttpResponse {
		{
			status = arg.response.status;
			body = arg.response.body;
			headers = [];
		};
	};

	let transform : IC.HttpTransform = {
		function = transformRequest;
		context = Blob.fromArray([]);
	};

	func _verifyPackageRepo(config : PackageConfigV3) : async Result.Result<(), Err> {
		await verifyPackageRepository(config.name, config.repository, transform);
	};

	// PUBLIC

	// Publication
	public shared ({caller}) func startPublish(configPub : Types.PackageConfigV3_Publishing) : async Result.Result<PublishingId, Err> {
		let config : PackageConfigV3 = {
			configPub with
			requirements = Option.get(configPub.requirements, []);
		};

		let pubRes = await packagePublisher.startPublish(caller, config);
		if (Result.isErr(pubRes)) {
			return pubRes;
		};

		let repoVerifyRes = await _verifyPackageRepo(config);
		switch (repoVerifyRes) {
			case (#ok) {};
			case (#err(err)) {
				return #err(err);
			};
		};

		return pubRes;
	};

	public shared ({caller}) func startFileUpload(publishingId : PublishingId, path : Text.Text, chunkCount : Nat, firstChunk : Blob) : async Result.Result<FileId, Err> {
		await packagePublisher.startFileUpload(caller, publishingId, path, chunkCount, firstChunk);
	};

	public shared ({caller}) func uploadFileChunk(publishingId : PublishingId, fileId : FileId, chunkIndex : Nat, chunk : Blob) : async Result.Result<(), Err> {
		await packagePublisher.uploadFileChunk(caller, publishingId, fileId, chunkIndex, chunk);
	};

	public shared ({caller}) func uploadTestStats(publishingId : PublishingId, testStats : TestStats) : async Result.Result<(), Err> {
		packagePublisher.uploadTestStats(caller, publishingId, testStats);
	};

	public shared ({caller}) func uploadNotes(publishingId : PublishingId, notes : Text) : async Result.Result<(), Err> {
		packagePublisher.uploadNotes(caller, publishingId, notes);
	};

	public shared ({caller}) func uploadBenchmarks(publishingId : PublishingId, benchmarks : Benchmarks) : async Result.Result<(), Err> {
		packagePublisher.uploadBenchmarks(caller, publishingId, benchmarks);
	};

	public shared ({caller}) func finishPublish(publishingId : PublishingId) : async Result.Result<(), Err> {
		await packagePublisher.finishPublish(caller, publishingId);
	};

	public shared ({caller}) func computeHashesForExistingFiles() : async () {
		assert(Utils.isAdmin(caller));

		for ((packageId, fileIds) in fileIdsByPackage.entries()) {
			let ?publication = packagePublications.get(packageId) else Debug.trap("Package publication '" # packageId # "' not found");
			let storage = actor(Principal.toText(publication.storage)) : Storage.Storage;

			label l for (fileId in fileIds.vals()) {
				if (hashByFileId.get(fileId) != null) {
					continue l;
				};
				let #ok(fileMeta) = await storage.getFileMeta(fileId) else Debug.trap("File meta '" # fileId # "' not found");

				let hasher = Sha256.Digest(#sha256);
				for (i in Iter.range(0, fileMeta.chunkCount - 1)) {
					let #ok(chunk) = await storage.downloadChunk(fileId, i) else Debug.trap("File chunk '" # fileId # "' not found");
					hasher.writeBlob(chunk);
				};
				hashByFileId.put(fileId, hasher.sum());
			};
		};
	};

	// QUERY
	public shared query ({caller}) func getApiVersion() : async Text.Text {
		API_VERSION;
	};

	public shared query ({caller}) func getDefaultPackages(dfxVersion : Text) : async [(PackageName, PackageVersion)] {
		_getDefaultPackages(registry, dfxVersion);
	};

	public shared query ({caller}) func getHighestVersion(name : PackageName) : async Result.Result<PackageVersion, Err> {
		Result.fromOption(registry.getHighestVersion(name), "Package '" # name # "' not found");
	};

	func _getHighestSemver(name : PackageName, currentVersion : PackageVersion, semverPart : SemverPart) : Result.Result<PackageVersion, Err> {
		if (packageConfigs.get(name # "@" # currentVersion) == null) {
			return #err("Package '" # name # "@" # currentVersion # "' not found");
		};
		let ?versions = packageVersions.get(name) else return #err("Package '" # name # "' not found");

		var max = currentVersion;
		for (ver in versions.vals()) {
			let patchBigger = Semver.major(ver) == Semver.major(max) and Semver.minor(ver) == Semver.minor(max) and Semver.patch(ver) > Semver.patch(max);
			let minorBigger = Semver.major(ver) == Semver.major(max) and Semver.minor(ver) > Semver.minor(max) or patchBigger;
			let majorBigger = Semver.major(ver) > Semver.major(max) or minorBigger or patchBigger;

			switch (semverPart) {
				case (#major) {
					if (majorBigger) {
						max := ver;
					};
				};
				case (#minor) {
					if (minorBigger) {
						max := ver;
					};
				};
				case (#patch) {
					if (patchBigger) {
						max := ver;
					};
				};
			};
		};

		#ok(max);
	};

	public shared query ({caller}) func getHighestSemverBatch(list : [(PackageName, PackageVersion, SemverPart)]) : async Result.Result<[(PackageName, PackageVersion)], Err> {
		assert(list.size() < 100);

		let buf = Buffer.Buffer<(PackageName, PackageVersion)>(list.size());
		for ((name, currentVersion, semverPart) in list.vals()) {
			switch (_getHighestSemver(name, currentVersion, semverPart)) {
				case (#ok(ver)) {
					buf.add((name, ver));
				};
				case (#err(err)) {
					return #err(err);
				};
			};
		};
		#ok(Buffer.toArray(buf));
	};

	public shared query ({caller}) func getPackageDetails(name : PackageName, version : PackageVersion) : async Result.Result<PackageDetails, Err> {
		let packageDetails = do ? {
			let ver = _resolveVersion(name, version)!;
			_getPackageDetails(registry, users, downloadLog, name, ver)!;
		};
		Result.fromOption(packageDetails, "Package '" # name # "' not found");
	};

	public shared query ({caller}) func getFileIds(name : PackageName, version : PackageVersion) : async Result.Result<[FileId], Err> {
		let packageId = name # "@" # version;
		Result.fromOption(fileIdsByPackage.get(packageId), "Package '" # packageId # "' not found");
	};

	func _getFileHashes(packageId : PackageId) : Result.Result<[(FileId, Blob)], Err> {
		let ?fileIds = fileIdsByPackage.get(packageId) else return #err("Package '" # packageId # "' not found");
		let buf = Buffer.Buffer<(FileId, Blob)>(fileIds.size());
		for (fileId in fileIds.vals()) {
			let ?hash = hashByFileId.get(fileId) else return #err("File hash not found for " # fileId);
			buf.add((fileId, hash));
		};
		#ok(Buffer.toArray(buf));
	};

	public shared ({caller}) func getFileHashes(name : PackageName, version : PackageVersion) : async Result.Result<[(FileId, Blob)], Err> {
		let packageId = name # "@" # version;
		_getFileHashes(packageId);
	};

	public query ({caller}) func getFileHashesQuery(name : PackageName, version : PackageVersion) : async Result.Result<[(FileId, Blob)], Err> {
		let packageId = name # "@" # version;
		_getFileHashes(packageId);
	};

	public shared ({caller}) func getFileHashesByPackageIds(packageIds : [PackageId]) : async [(PackageId, [(FileId, Blob)])] {
		let buf = Buffer.Buffer<(PackageId, [(FileId, Blob)])>(packageIds.size());

		for (packageId in packageIds.vals()) {
			let hashes = switch (_getFileHashes(packageId)) {
				case (#ok(hashes)) hashes;
				case (#err(_)) [];
			};
			buf.add((packageId, hashes));
		};

		Buffer.toArray(buf);
	};

	func _notifyInstall(name : PackageName, version : PackageVersion, downloader : Principal) {
		let packageId = name # "@" # version;

		if (packageConfigs.get(packageId) == null) {
			// Debug.trap("Package '" # packageId # "' not found");
			return;
		};

		downloadLog.add({
			time = Time.now();
			name;
			version;
			downloader;
		});
	};

	public shared ({caller}) func notifyInstall(name : PackageName, version : PackageVersion) {
		_notifyInstall(name, version, caller);
	};

	public shared ({caller}) func notifyInstalls(installs : [(PackageName, PackageVersion)]) {
		if (installs.size() > 100) {
			return;
		};
		for ((name, version) in installs.vals()) {
			_notifyInstall(name, version, caller);
		};
	};

	public query func search(searchText : Text.Text, limitOpt : ?Nat, pageIndexOpt : ?Nat) : async ([PackageSummary], PageCount) {
		searchInRegistry(registry, users, downloadLog, searchText, limitOpt, pageIndexOpt);
	};

	public query func getRecentlyUpdatedPackages() : async [PackageSummaryWithChanges] {
		let max = 5;
		let packages = Buffer.Buffer<PackageSummaryWithChanges>(max);

		let pubsSorted = Array.sort(Iter.toArray(packagePublications.entries()), func(a : (PackageId, PackagePublication), b : (PackageId, PackagePublication)) : Order.Order {
			Int.compare(b.1.time, a.1.time);
		});

		label l for ((packageId, _) in pubsSorted.vals()) {
			ignore do ? {
				let config = packageConfigs.get(packageId)!;
				let packageSummaryWithChanges = _getPackageSummaryWithChanges(config.name, config.version)!;

				var has = false;
				label find for (details in packages.vals()) {
					if (details.config.name == config.name) {
						has := true;
						break find;
					};
				};

				if (not has) {
					packages.add(packageSummaryWithChanges);
				};

				if (packages.size() >= max) {
					break l;
				};
			};
		};

		Buffer.toArray(packages)
	};

	func _summariesFromNames(packageNames : [PackageName], limit: Nat) : [PackageSummary] {
		let packages = Buffer.Buffer<PackageSummary>(limit);

		label l for (packageName in packageNames.vals()) {
			ignore do ? {
				let version = registry.getHighestVersion(packageName)!;
				let packageSummary = _getPackageSummary(packageName, version)!;

				packages.add(packageSummary);

				if (packages.size() >= limit) {
					break l;
				};
			};
		};

		Buffer.toArray(packages);
	};

	public query func getMostDownloadedPackages() : async [PackageSummary] {
		let packageNames = downloadLog.getMostDownloadedPackageNames();
		_summariesFromNames(packageNames, 5);
	};

	public query func getMostDownloadedPackagesIn7Days() : async [PackageSummary] {
		let packageNames = downloadLog.getMostDownloadedPackageNamesIn(7 * DAY, Time.now());
		_summariesFromNames(packageNames, 5);
	};

	func _sortByUpdated(summaries : [PackageSummary]) : [PackageSummary] {
		Array.sort<PackageSummary>(summaries, func(a, b) {
			Int.compare(b.publication.time, a.publication.time);
		});
	};

	public query func getPackagesByCategory() : async [(Text, [PackageSummary])] {
		let limit = 10;

		packagesByCategory
			|> Array.map<(Text, [Text]), (Text, [PackageSummary])>(_, func((category, packageNames)) {
				(category, _sortByUpdated(_summariesFromNames(packageNames, 1000)))
			})
			|> Array.take(_, limit);
	};

	public query func getNewPackages() : async [PackageSummary] {
		let pubsSorted = Array.sort(Iter.toArray(packagePublications.entries()), func(a : (PackageId, PackagePublication), b : (PackageId, PackagePublication)) : Order.Order {
			Int.compare(a.1.time, b.1.time);
		});

		let packagesFirstPub = TrieMap.TrieMap<PackageName, PackageSummary>(Text.equal, Text.hash);

		label l for ((packageId, _) in pubsSorted.vals()) {
			ignore do ? {
				let config = packageConfigs.get(packageId)!;
				let packageSummary = _getPackageSummary(config.name, config.version)!;

				if (packagesFirstPub.get(config.name) == null) {
					packagesFirstPub.put(config.name, packageSummary);
				};
			};
		};

		packagesFirstPub.vals()
			|> Iter.toArray(_)
			|> _sortByUpdated(_)
			|> Array.take(_, 10)
			|> Array.reverse(_);
	};

	public query func getDownloadTrendByPackageName(name : PackageName) : async [DownloadsSnapshot] {
		downloadLog.getDownloadTrendByPackageName(name);
	};

	public query func getDownloadTrendByPackageId(packageId : PackageId) : async [DownloadsSnapshot] {
		downloadLog.getDownloadTrendByPackageId(packageId);
	};

	public query func getTotalDownloads() : async Nat {
		downloadLog.getTotalDownloads();
	};

	public query func getTotalPackages() : async Nat {
		packageVersions.size();
	};

	public query func getStoragesStats() : async [(StorageManager.StorageId, StorageManager.StorageStats)] {
		storageManager.getStoragesStats();
	};

	// USERS
	public query func getUser(userId : Principal) : async ?User {
		users.getUserOpt(userId);
	};

	public shared ({caller}) func setUserProp(prop : Text, value : Text) : async Result.Result<(), Text> {
		users.setUserProp(caller, prop, value);
	};

	public shared ({caller}) func transferOwnership(packageName : PackageName, newOwner : Principal) : async Result.Result<(), Text> {
		registry.transferOwnership(caller, packageName, newOwner);
	};

	// BADGES
	public query func http_request(request : HttpTypes.Request) : async HttpTypes.Response {
		let r404 : HttpTypes.Response = {
			status_code = 404;
			headers = [];
			body = Blob.fromArray([]);
			streaming_strategy = null;
			upgrade = null;
		};

		if (request.url == "/.well-known/ic-domains") {
			return {
				status_code = 200;
				headers = [];
				body = Text.encodeUtf8("registry.mops.one");
				streaming_strategy = null;
				upgrade = null;
			};
		};

		if (Text.startsWith(request.url, #text("/badge/"))) {
			let ?response = Badges.processHttpRequest(registry, request) else return r404;
			return response;
		};

		return r404;
	};

	// BACKUP
	stable let backupStateV2 = Backup.init(null);
	let backupManager = Backup.BackupManager(backupStateV2, {maxBackups = 20});

	type BackupChunk = {
		#v7 : {
			#packagePublications : [(PackageId, PackagePublication)];
			#packageVersions : [(PackageName, [PackageVersion])];
			#packageOwners : [(PackageName, Principal)];
			#packageConfigs : [(PackageId, PackageConfigV3)];
			#highestConfigs : [(PackageName, PackageConfigV3)];
			#fileIdsByPackage : [(PackageId, [FileId])];
			#hashByFileId : [(FileId, Blob)];
			#packageFileStats : [(PackageId, PackageFileStats)];
			#packageTestStats : [(PackageId, TestStats)];
			#packageBenchmarks : [(PackageId, Benchmarks)];
			#packageNotes : [(PackageId, Text)];
			#downloadLog : DownloadLog.Stable;
			#storageManager : StorageManager.Stable;
			#users : Users.Stable;
		};
	};

	public shared ({caller}) func backup() : async () {
		assert(Utils.isAdmin(caller));
		await _backup();
	};

	public query ({caller}) func getBackupCanisterId() : async Principal {
		assert(Utils.isAdmin(caller));
		backupManager.getCanisterId();
	};

	func _backup() : async () {
		let backup = backupManager.NewBackup("v7");
		await backup.startBackup();
		await backup.uploadChunk(to_candid(#v7(#packagePublications(Iter.toArray(packagePublications.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageVersions(Iter.toArray(packageVersions.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageOwners(Iter.toArray(packageOwners.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#fileIdsByPackage(Iter.toArray(fileIdsByPackage.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#hashByFileId(Iter.toArray(hashByFileId.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageFileStats(Iter.toArray(packageFileStats.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageTestStats(Iter.toArray(packageTestStats.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageBenchmarks(Iter.toArray(packageBenchmarks.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageNotes(Iter.toArray(packageNotes.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#downloadLog(downloadLog.toStable())) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#storageManager(storageManager.toStable())) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#users(users.toStable())) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#highestConfigs(Iter.toArray(highestConfigs.entries()))) : BackupChunk));
		await backup.uploadChunk(to_candid(#v7(#packageConfigs(Iter.toArray(packageConfigs.entries()))) : BackupChunk));
		await backup.finishBackup();
	};

	// RESTORE
	public shared ({caller}) func restore(backupId : Nat) : async () {
		assert(false); // restore disabled
		assert(Utils.isAdmin(caller));

		await backupManager.restore(backupId, func(blob : Blob) {
			let ?#v7(chunk) : ?BackupChunk = from_candid(blob) else Debug.trap("Failed to restore chunk");

			switch (chunk) {
				case (#packagePublications(packagePublicationsStable)) {
					packagePublications := TrieMap.fromEntries<PackageId, PackagePublication>(packagePublicationsStable.vals(), Text.equal, Text.hash);
				};
				case (#packageVersions(packageVersionsStable)) {
					packageVersions := TrieMap.fromEntries<PackageName, [PackageVersion]>(packageVersionsStable.vals(), Text.equal, Text.hash);
				};
				case (#packageOwners(packageOwnersStable)) {
					packageOwners := TrieMap.fromEntries<PackageName, Principal>(packageOwnersStable.vals(), Text.equal, Text.hash);
				};
				case (#fileIdsByPackage(fileIdsByPackageStable)) {
					fileIdsByPackage := TrieMap.fromEntries<PackageId, [FileId]>(fileIdsByPackageStable.vals(), Text.equal, Text.hash);
				};
				case (#hashByFileId(hashByFileIdStable)) {
					hashByFileId := TrieMap.fromEntries<FileId, Blob>(hashByFileIdStable.vals(), Text.equal, Text.hash);
				};
				case (#packageFileStats(packageFileStatsStable)) {
					packageFileStats := TrieMap.fromEntries<PackageId, PackageFileStats>(packageFileStatsStable.vals(), Text.equal, Text.hash);
				};
				case (#packageTestStats(packageTestStatsStable)) {
					packageTestStats := TrieMap.fromEntries<PackageId, TestStats>(packageTestStatsStable.vals(), Text.equal, Text.hash);
				};
				case (#packageBenchmarks(packageBenchmarksStable)) {
					packageBenchmarks := TrieMap.fromEntries<PackageId, Benchmarks>(packageBenchmarksStable.vals(), Text.equal, Text.hash);
				};
				case (#packageNotes(packageNotesStable)) {
					packageNotes := TrieMap.fromEntries<PackageId, Text>(packageNotesStable.vals(), Text.equal, Text.hash);
				};
				case (#downloadLog(downloadLogStable)) {
					downloadLog.cancelTimers();
					downloadLog.loadStable(downloadLogStable);
					downloadLog.setTimers();
				};
				case (#storageManager(storageManagerStable)) {
					storageManager.loadStable(storageManagerStable);
				};
				case (#users(usersStable)) {
					users.loadStable(usersStable);
				};
				case (#highestConfigs(highestConfigsStable)) {
					highestConfigs := TrieMap.fromEntries<PackageName, PackageConfigV3>(highestConfigsStable.vals(), Text.equal, Text.hash);
				};
				case (#packageConfigs(packageConfigsStable)) {
					packageConfigs := TrieMap.fromEntries<PackageId, PackageConfigV3>(packageConfigsStable.vals(), Text.equal, Text.hash);
				};
			};
		});

		// re-init registry
		registry := Registry.Registry(
			packageVersions,
			packageOwners,
			highestConfigs,
			packageConfigs,
			packagePublications,
			fileIdsByPackage,
			hashByFileId,
			packageFileStats,
			packageTestStats,
			packageBenchmarks,
			packageNotes,
		);
		packagePublisher := PackagePublisher.PackagePublisher(registry, storageManager);
	};

	// SYSTEM
	stable var packagePublicationsStable : [(PackageId, PackagePublication)] = [];
	stable var packageVersionsStable : [(PackageName, [PackageVersion])] = [];
	stable var packageOwnersStable : [(PackageName, Principal)] = [];

	stable var packageConfigsStableV3 : [(PackageId, PackageConfigV3)] = [];
	stable var highestConfigsStableV3 : [(PackageName, PackageConfigV3)] = [];

	stable var fileIdsByPackageStable : [(PackageId, [FileId])] = [];
	stable var hashByFileIdStable : [(FileId, Blob)] = [];
	stable var packageFileStatsStable : [(PackageId, PackageFileStats)] = [];
	stable var packageTestStatsStable : [(PackageId, TestStats)] = [];
	stable var packageBenchmarksStable : [(PackageId, Benchmarks)] = [];
	stable var packageNotesStable : [(PackageId, Text)] = [];

	stable var downloadLogStable : DownloadLog.Stable = null;
	stable var storageManagerStable : StorageManager.Stable = null;
	stable var usersStable : Users.Stable = null;

	system func preupgrade() {
		packagePublicationsStable := Iter.toArray(packagePublications.entries());
		packageVersionsStable := Iter.toArray(packageVersions.entries());
		packageOwnersStable := Iter.toArray(packageOwners.entries());
		fileIdsByPackageStable := Iter.toArray(fileIdsByPackage.entries());
		hashByFileIdStable := Iter.toArray(hashByFileId.entries());
		packageFileStatsStable := Iter.toArray(packageFileStats.entries());
		packageTestStatsStable := Iter.toArray(packageTestStats.entries());
		packageBenchmarksStable := Iter.toArray(packageBenchmarks.entries());
		packageNotesStable := Iter.toArray(packageNotes.entries());
		downloadLogStable := downloadLog.toStable();
		storageManagerStable := storageManager.toStable();
		usersStable := users.toStable();

		highestConfigsStableV3 := Iter.toArray(highestConfigs.entries());
		packageConfigsStableV3 := Iter.toArray(packageConfigs.entries());
	};

	system func postupgrade() {
		packageConfigs := TrieMap.fromEntries<PackageId, PackageConfigV3>(packageConfigsStableV3.vals(), Text.equal, Text.hash);
		packageConfigsStableV3 := [];

		highestConfigs := TrieMap.fromEntries<PackageName, PackageConfigV3>(highestConfigsStableV3.vals(), Text.equal, Text.hash);
		highestConfigsStableV3 := [];

		packagePublications := TrieMap.fromEntries<PackageId, PackagePublication>(packagePublicationsStable.vals(), Text.equal, Text.hash);
		packagePublicationsStable := [];

		packageVersions := TrieMap.fromEntries<PackageName, [PackageVersion]>(packageVersionsStable.vals(), Text.equal, Text.hash);
		packageVersionsStable := [];

		packageOwners := TrieMap.fromEntries<PackageName, Principal>(packageOwnersStable.vals(), Text.equal, Text.hash);
		packageOwnersStable := [];

		fileIdsByPackage := TrieMap.fromEntries<PackageId, [FileId]>(fileIdsByPackageStable.vals(), Text.equal, Text.hash);
		fileIdsByPackageStable := [];

		hashByFileId := TrieMap.fromEntries<FileId, Blob>(hashByFileIdStable.vals(), Text.equal, Text.hash);
		hashByFileIdStable := [];

		packageFileStats := TrieMap.fromEntries<PackageId, PackageFileStats>(packageFileStatsStable.vals(), Text.equal, Text.hash);
		packageFileStatsStable := [];

		packageTestStats := TrieMap.fromEntries<PackageId, TestStats>(packageTestStatsStable.vals(), Text.equal, Text.hash);
		packageTestStatsStable := [];

		packageBenchmarks := TrieMap.fromEntries<PackageId, Benchmarks>(packageBenchmarksStable.vals(), Text.equal, Text.hash);
		packageBenchmarksStable := [];

		packageNotes := TrieMap.fromEntries<PackageId, Text>(packageNotesStable.vals(), Text.equal, Text.hash);
		packageNotesStable := [];

		downloadLog.cancelTimers();
		downloadLog.loadStable(downloadLogStable);
		downloadLog.setTimers();
		downloadLogStable := null;

		storageManager.loadStable(storageManagerStable);
		storageManagerStable := null;

		users.loadStable(usersStable);
		usersStable := null;

		registry := Registry.Registry(
			packageVersions,
			packageOwners,
			highestConfigs,
			packageConfigs,
			packagePublications,
			fileIdsByPackage,
			hashByFileId,
			packageFileStats,
			packageTestStats,
			packageBenchmarks,
			packageNotes,
		);

		packagePublisher := PackagePublisher.PackagePublisher(registry, storageManager);

		backupManager.setTimer(#hours(24), _backup);
	};

	backupManager.setTimer(#hours(24), _backup);
};