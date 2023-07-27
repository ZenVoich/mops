import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Order "mo:base/Order";
import Char "mo:base/Char";
import Hash "mo:base/Hash";
import TrieSet "mo:base/TrieSet";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";

import {DAY} "mo:time-consts";
import {ic} "mo:ic";
import Map "mo:map/Map";

import Utils "../utils";
import Version "./version";
import Types "./types";
import DownloadLog "./download-log";
import StorageManager "../storage/storage-manager";
import Storage "../storage/storage-canister";
import Users "./users";
import {validateConfig} "./validate-config";
import {generateId} "../generate-id";

actor {
	type TrieMap<K, V> = TrieMap.TrieMap<K, V>;

	public type PackageName = Text.Text; // lib
	public type PackageId = Text.Text; // lib@1.2.3
	public type Err = Text.Text;
	public type DependencyV2 = Types.DependencyV2;
	public type Access = Types.Access;
	public type PackageConfigV2 = Types.PackageConfigV2;
	public type PackagePublication = Types.PackagePublication;
	public type PackageDetails = Types.PackageDetails;
	public type PackageSummary = Types.PackageSummary;
	public type Ver = Version.Version;
	public type DownloadsSnapshot = Types.DownloadsSnapshot;
	public type User = Types.User;
	public type PageCount = Nat;

	let apiVersion = "1.2"; // (!) make changes in pair with cli

	var packageVersions = TrieMap.TrieMap<PackageName, [Ver]>(Text.equal, Text.hash);
	var packageOwners = TrieMap.TrieMap<PackageName, Principal>(Text.equal, Text.hash);

	var packagePublications = TrieMap.TrieMap<PackageId, PackagePublication>(Text.equal, Text.hash);

	var fileIdsByPackage = TrieMap.TrieMap<PackageId, [FileId]>(Text.equal, Text.hash);

	var packageConfigs = TrieMap.TrieMap<PackageId, PackageConfigV2>(Text.equal, Text.hash);
	var highestConfigs = TrieMap.TrieMap<PackageName, PackageConfigV2>(Text.equal, Text.hash);

	let downloadLog = DownloadLog.DownloadLog();
	downloadLog.setTimers();

	let storageManager = StorageManager.StorageManager();
	let users = Users.Users();

	// publish
	type PublishingId = Text.Text;
	type PublishingErr = Err;
	type PublishingPackage = {
		time : Time.Time;
		user : Principal;
		config : PackageConfigV2;
		storage : Principal;
	};
	public type FileId = Text.Text;
	public type PublishingFile = {
		id : FileId;
		path : Text.Text;
	};
	let publishingPackages = TrieMap.TrieMap<PublishingId, PublishingPackage>(Text.equal, Text.hash);
	let publishingFiles = TrieMap.TrieMap<PublishingId, Buffer.Buffer<PublishingFile>>(Text.equal, Text.hash);

	// PRIVATE
	func _getHighestVersion(name : PackageName) : ?Ver {
		let versionsMaybe = packageVersions.get(name);
		if (Option.isSome(versionsMaybe)) {
			let versions = Utils.unwrap(versionsMaybe);
			let verSorted = Array.sort(versions, Version.compare);

			if (verSorted.size() != 0) {
				return ?verSorted[verSorted.size() - 1];
			};
		};
		return null;
	};

	func _resolveVersion(name : PackageName, version : Ver) : ?Ver {
		if (version == "highest") {
			_getHighestVersion(name);
		}
		else {
			?version;
		};
	};

	func _updateHighestConfig(config : PackageConfigV2) {
		switch (_getHighestVersion(config.name)) {
			case (?ver) {
				if (Version.compare(config.version, ver) == #greater) {
					highestConfigs.put(config.name, config);
				};
			};
			case (null) {
				highestConfigs.put(config.name, config);
			};
		}
	};

	func _getPackageSummary(name : PackageName, version : Ver) : ?PackageSummary {
		let packageId = name # "@" # version;

		do ? {
			let config = packageConfigs.get(name # "@" # version)!;
			let publication = packagePublications.get(packageId)!;

			let owner = Option.unwrap(packageOwners.get(name));
			users.ensureUser(owner);

			return ?{
				owner = owner;
				ownerInfo = users.getUser(owner);
				config = config;
				publication = publication;
				downloadsInLast7Days = downloadLog.getDownloadsByPackageNameIn(config.name, 7 * DAY);
				downloadsInLast30Days = downloadLog.getDownloadsByPackageNameIn(config.name, 30 * DAY);
				downloadsTotal = downloadLog.getTotalDownloadsByPackageName(config.name);
				versionDownloadsTotal = downloadLog.getTotalDownloadsByPackageId(packageId);
			};
		};
	};

	func _getPackageDetails(name : PackageName, version : Ver) : ?PackageDetails {
		let packageId = name # "@" # version;

		do ? {
			let summary = _getPackageSummary(name, version)!;

			return ?{
				summary with
				versionHistory = _getPackageVersionHistory(name);
				deps = _getPackageDependencies(name, version);
				devDeps = _getPackageDevDependencies(name, version);
				dependents = _getPackageDependents(name);
				downloadTrend = downloadLog.getDownloadTrendByPackageName(name);
			};
		};
	};

	func _getPackageVersionHistory(name : PackageName) : [PackageSummary] {
		let versions = Utils.unwrap(packageVersions.get(name));
		Array.reverse(Array.map<Ver, PackageSummary>(versions, func(version) {
			Utils.unwrap(_getPackageSummary(name, version));
		}));
	};

	func _getDepsSummaries(deps : [DependencyV2]) : [PackageSummary] {
		let filtered = Array.filter<DependencyV2>(deps, func(dep) {
			dep.repo == "";
		});
		Array.map<DependencyV2, PackageSummary>(filtered, func(dep) {
			Utils.unwrap(_getPackageSummary(dep.name, dep.version));
		});
	};

	func _getPackageDependencies(name : PackageName, version : Ver) : [PackageSummary] {
		let packageId = name # "@" # version;
		let ?config = packageConfigs.get(packageId) else Debug.trap("Package '" # packageId # "' not found");
		_getDepsSummaries(config.dependencies);
	};

	func _getPackageDevDependencies(name : PackageName, version : Ver) : [PackageSummary] {
		let packageId = name # "@" # version;
		let ?config = packageConfigs.get(packageId) else Debug.trap("Package '" # packageId # "' not found");
		_getDepsSummaries(config.devDependencies);
	};

	func _getPackageDependents(name : PackageName) : [PackageSummary] {
		func isDependent(config : PackageConfigV2) : Bool {
			let dependent = Option.isSome(Array.find<DependencyV2>(config.dependencies, func(dep : DependencyV2) {
				dep.name == name;
			}));
			let devDependent = Option.isSome(Array.find<DependencyV2>(config.devDependencies, func(dep : DependencyV2) {
				dep.name == name;
			}));
			dependent or devDependent;
		};

		let dependentConfigs = Iter.filter<PackageConfigV2>(packageConfigs.vals(), isDependent);

		let pkgHash = func(a : PackageConfigV2) : Hash.Hash {
			Text.hash(a.name);
		};
		let pkgEqual = func(a : PackageConfigV2, b : PackageConfigV2) : Bool {
			a.name == b.name;
		};
		let unique = TrieSet.toArray(TrieSet.fromArray<PackageConfigV2>(Iter.toArray<PackageConfigV2>(dependentConfigs), pkgHash, pkgEqual)).vals();

		let summaries = Iter.map<PackageConfigV2, PackageSummary>(unique, func(config) {
			Utils.unwrap(_getPackageSummary(config.name, config.version));
		});

		let sorted = Iter.sort<PackageSummary>(summaries, func(a, b) {
			Nat.compare(b.downloadsTotal, a.downloadsTotal);
		});

		Iter.toArray(sorted);
	};


	// PUBLIC
	public shared ({caller}) func startPublish(config : PackageConfigV2) : async Result.Result<PublishingId, PublishingErr> {
		assert(Utils.isAuthorized(caller));

		// validate config
		switch (validateConfig(config)) {
			case (#ok) {};
			case (#err(err)) {
				return #err(err);
			};
		};

		// check permissions
		switch (packageOwners.get(config.name)) {
			case (null) {
				// deny '.' and '_' in name for new packages
				for (char in config.name.chars()) {
					let err = #err("invalid config: unexpected char '" # Char.toText(char) # "' in name '" # config.name # "'");
					if (char == '.' or char == '_') {
						return err;
					};
				};
			};
			case (?owner) {
				if (owner != caller) {
					return #err("You don't have permissions to publish this package");
				};
			};
		};

		// check if the same version is published
		switch (packageVersions.get(config.name)) {
			case (?versions) {
				let sameVersionOpt = Array.find<Ver>(versions, func(ver : Ver) {
					ver == config.version;
				});
				if (sameVersionOpt != null) {
					return #err(config.name # "@" # config.version # " already published");
				};
			};
			case (null) {};
		};

		// check dependencies
		for (dep in config.dependencies.vals()) {
			let packageId = dep.name # "@" # dep.version;
			if (dep.repo.size() == 0 and packageConfigs.get(packageId) == null) {
				return #err("Dependency " # packageId # " not found in registry");
			};
		};

		// check devDependencies
		for (dep in config.devDependencies.vals()) {
			let packageId = dep.name # "@" # dep.version;
			if (packageConfigs.get(packageId) == null) {
				return #err("Dev Dependency " # packageId # " not found in registry");
			};
		};

		let publishingId = await generateId();

		if (publishingPackages.get(publishingId) != null) {
			return #err("Already publishing");
		};

		await storageManager.ensureUploadableStorages();

		// start
		publishingPackages.put(publishingId, {
			time = Time.now();
			user = caller;
			config = config;
			storage = storageManager.getStorageForUpload();
		});
		publishingFiles.put(publishingId, Buffer.Buffer(10));

		#ok(publishingId);
	};

	public shared ({caller}) func startFileUpload(publishingId : PublishingId, path : Text.Text, chunkCount : Nat, firstChunk : Blob) : async Result.Result<FileId, Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		let pubFiles = Utils.expect(publishingFiles.get(publishingId), "Publishing files not found");
		assert(pubFiles.size() < 100);

		let moMd = Text.endsWith(path, #text(".mo")) or Text.endsWith(path, #text(".md"));
		let didToml = Text.endsWith(path, #text(".did")) or Text.endsWith(path, #text(".toml"));
		let license = Text.endsWith(path, #text("LICENSE")) or Text.endsWith(path, #text("LICENSE.md")) or Text.endsWith(path, #text("license"));
		let notice = Text.endsWith(path, #text("NOTICE")) or Text.endsWith(path, #text("NOTICE.md")) or Text.endsWith(path, #text("notice"));
		let docsTgz = path == "docs.tgz";
		if (not (moMd or didToml or license or notice or docsTgz)) {
			Debug.trap("File " # path # " has unsupported extension. Allowed: .mo, .md, .did, .toml");
		};

		let fileId = publishing.config.name # "@" # publishing.config.version # "/" # path;

		let startRes = await storageManager.startUpload(publishing.storage, {
			id = fileId;
			path = path;
			chunkCount = chunkCount;
			owners = [];
		});
		switch (startRes) {
			case (#err(err)) {
				return #err(err);
			};
			case (_) {};
		};

		// upload first chunk
		if (chunkCount != 0) {
			let uploadRes = await storageManager.uploadChunk(publishing.storage, fileId, 0, firstChunk);
			switch (uploadRes) {
				case (#err(err)) {
					return #err(err);
				};
				case (_) {};
			};
		};

		let pubFile : PublishingFile = {
			id = fileId;
			path = path;
		};
		pubFiles.add(pubFile);

		#ok(fileId);
	};

	public shared ({caller}) func uploadFileChunk(publishingId : PublishingId, fileId : FileId, chunkIndex : Nat, chunk : Blob) : async Result.Result<(), Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		await storageManager.uploadChunk(publishing.storage, fileId, chunkIndex, chunk);
	};

	public shared ({caller}) func finishPublish(publishingId : PublishingId) : async Result.Result<(), Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		let packageId = publishing.config.name # "@" # publishing.config.version;
		let pubFiles = Utils.expect(publishingFiles.get(publishingId), "Publishing files not found");

		var mopsToml = false;
		var readmeMd = false;

		for (file in pubFiles.vals()) {
			if (file.path == "mops.toml") {
				mopsToml := true;
			};
			if (file.path == "README.md") {
				readmeMd := true;
			};
		};

		if (not mopsToml) {
			return #err("Missing required file mops.toml");
		};
		if (not readmeMd) {
			return #err("Missing required file README.md");
		};

		let fileIds = Array.map(Buffer.toArray(pubFiles), func(file : PublishingFile) : Text.Text {
			file.id;
		});

		let res = await storageManager.finishUploads(publishing.storage, fileIds);
		if (Result.isErr(res)) {
			return res;
		};

		fileIdsByPackage.put(packageId, Array.filter(fileIds, func(fileId : Text.Text) : Bool {
			not Text.endsWith(fileId, #text("docs.tgz"));
		}));

		let versions = Option.get(packageVersions.get(publishing.config.name), []);
		packageVersions.put(publishing.config.name, Array.append(versions, [publishing.config.version]));

		packageConfigs.put(packageId, publishing.config);
		packageOwners.put(publishing.config.name, caller);
		highestConfigs.put(publishing.config.name, publishing.config);
		packagePublications.put(packageId, {
			user = caller;
			time = Time.now();
			storage = publishing.storage;
		});

		publishingFiles.delete(publishingId);
		publishingPackages.delete(publishingId);

		#ok;
	};

	// AIRDROP
	let cyclesPerOwner = 15_000_000_000_000; // 15 TC
	let cyclesPerPackage = 1_000_000_000_000; // 1 TC
	// id -> pkg count
	stable let airdropSnapshot = Map.new<Principal, Nat>(Map.phash);

	public shared ({caller}) func takeAirdropSnapshot() {
		assert(Utils.isAdmin(caller));
		assert(Map.size(airdropSnapshot) == 0);

		Map.clear(airdropSnapshot);

		for (owner in packageOwners.vals()) {
			Map.set(airdropSnapshot, Map.phash, owner, Option.get(Map.get(airdropSnapshot, Map.phash, owner), 0) + 1);
		};
	};

	func _getAirdropAmountForUser(owner : Principal) : Nat {
		let pkgCount = Option.get(Map.get(airdropSnapshot, Map.phash, owner), 0);
		if (pkgCount == 0) {
			return 0;
		};
		cyclesPerOwner + pkgCount * cyclesPerPackage;
	};

	public query ({caller}) func getAirdropAmount() : async Nat {
		_getAirdropAmountForUser(caller);
	};

	public query ({caller}) func getAirdropAmountAll() : async Nat {
		assert(Utils.isAdmin(caller));
		var total = 0;
		for (owner in Map.vals(airdropSnapshot)) {
			total += _getAirdropAmountForUser(caller);
		};
		total;
	};

	public shared ({caller}) func claimAirdrop(canisterId : Principal) : async Text {
		let cycles = _getAirdropAmountForUser(caller);
		if (cycles == 0) {
			return "No airdrop available";
		};

		let balance = ExperimentalCycles.balance();
		if (balance < cycles) {
			return "Not enough cycles in the canister";
		};

		ExperimentalCycles.add(cycles);
		await ic.deposit_cycles({
			canister_id = canisterId
		});

		Map.delete(airdropSnapshot, Map.phash, caller);

		return Nat.toText(cycles) # " cycles deposited to " # Principal.toText(canisterId);
	};


	// QUERY
	public shared query ({caller}) func getApiVersion() : async Text.Text {
		apiVersion;
	};

	public shared query ({caller}) func getDefaultPackages(dfxVersion : Text) : async [(PackageName, Version.Version)] {
		switch (dfxVersion) {
			case ("0.9.0") [("base", "0.6.20")];
			case ("0.9.2") [("base", "0.6.21")];
			case ("0.9.3") [("base", "0.6.25")];
			case ("0.10.0") [("base", "0.6.26")];
			case ("0.10.1") [("base", "0.6.28")];
			case ("0.11.1") [("base", "0.6.29")];
			case ("0.11.2") [("base", "0.6.29")];
			case ("0.12.0") [("base", "0.7.3")];
			case ("0.12.1") [("base", "0.7.3")];
			case ("0.13.0") [("base", "0.7.6")];
			case ("0.13.1") [("base", "0.7.6")];
			case ("0.14.0") [("base", "0.8.7")];
			case ("0.14.1") [("base", "0.8.8")];
			case ("0.14.2") [("base", "0.9.3")];
			case ("0.14.3") [("base", "0.9.3")];
			case ("0.15.0") [("base", "0.9.7")];
			case (_) {
				switch (_getHighestVersion("base")) {
					case (?ver) [("base", ver)];
					case (null) [];
				};
			};
		};
	};

	public shared query ({caller}) func getHighestVersion(name : PackageName) : async Result.Result<Ver, Err> {
		Result.fromOption(_getHighestVersion(name), "Package '" # name # "' not found");
	};

	public shared query ({caller}) func getPackageDetails(name : PackageName, version : Ver) : async Result.Result<PackageDetails, Err> {
		let packageDetails = do ? {
			let ver = _resolveVersion(name, version)!;
			_getPackageDetails(name, ver)!;
		};
		Result.fromOption(packageDetails, "Package '" # name # "' not found");
	};

	public shared query ({caller}) func getFileIds(name : PackageName, version : Ver) : async Result.Result<[FileId], Err> {
		let packageId = name # "@" # version;
		Result.fromOption(fileIdsByPackage.get(packageId), "Package '" # packageId # "' not found");
	};

	public shared ({caller}) func notifyInstall(name : PackageName, version : Ver) {
		let packageId = name # "@" # version;

		ignore Utils.expect(packageConfigs.get(packageId), "Package not found");

		downloadLog.add({
			time = Time.now();
			name = name;
			version = version;
			downloader = caller;
		});
	};

	func _toLowerCase(text : Text) : Text {
		Text.map(text , Prim.charToLower);
	};

	public query func search(searchText : Text.Text, limitOpt : ?Nat, pageIndexOpt : ?Nat) : async ([PackageSummary], PageCount) {
		let limit = Option.get(limitOpt, 20);
		let pageIndex = Option.get(pageIndexOpt, 0);

		assert(limit <= 100);
		assert(pageIndex <= 1_000_000);
		assert(searchText.size() <= 100);

		type ConfigWithPoints = {
			config : PackageConfigV2;
			sortingPoints : Nat;
		};
		let matchedConfigs = Buffer.Buffer<ConfigWithPoints>(0);
		let pattern = #text(_toLowerCase(searchText));

		for (config in highestConfigs.vals()) {
			var sortingPoints = 0;

			// search by owner
			if (Text.startsWith(searchText, #text("owner:"))) {
				ignore do ? {
					let searchOwnerName = Text.stripStart(searchText, #text("owner:"))!;
					let ownerId = packageOwners.get(config.name)!;
					let ownerInfo = users.getUserOpt(ownerId)!;
					if (searchOwnerName == ownerInfo.name) {
						sortingPoints += 3;
					};
				};
			}
			// search by keyword
			else if (Text.startsWith(searchText, #text("keyword:"))) {
				ignore do ? {
					let searchKeyword = Text.stripStart(searchText, #text("keyword:"))!;
					let found = Array.find(config.keywords, func(keyword : Text) : Bool {
						keyword == searchKeyword;
					});
					if (found != null) {
						sortingPoints += 3;
					};
				};
			}
			else {
				if (config.name == searchText) {
					sortingPoints += 10;
				};
				if (Text.contains(config.name, pattern)) {
					sortingPoints += 3;
				};
				if (Text.contains(_toLowerCase(config.description), pattern)) {
					sortingPoints += 1;
				};
				for (keyword in config.keywords.vals()) {
					if (Text.contains(_toLowerCase(keyword), pattern)) {
						sortingPoints += 2;
					};
				};
			};

			if (sortingPoints > 0) {
				matchedConfigs.add({config; sortingPoints});
			};
		};

		var configs = Array.sort<ConfigWithPoints>(Buffer.toArray(matchedConfigs), func(a, b) {
			var aPoints = a.sortingPoints;
			var bPoints = b.sortingPoints;

			if (a.config.name.size() < b.config.name.size()) aPoints += 1;
			if (a.config.name.size() > b.config.name.size()) bPoints += 1;

			Nat.compare(bPoints, aPoints);
		});

		let page = Utils.getPage(configs, pageIndex, limit);

		let summaries = Array.map<ConfigWithPoints, PackageSummary>(page.0, func(config) {
			Utils.unwrap(_getPackageSummary(config.config.name, config.config.version));
		});

		(summaries, page.1);
	};

	public query func getRecentlyUpdatedPackages() : async [PackageSummary] {
		let max = 5;
		let packages = Buffer.Buffer<PackageSummary>(max);

		let pubsSorted = Array.sort(Iter.toArray(packagePublications.entries()), func(a : (PackageId, PackagePublication), b : (PackageId, PackagePublication)) : Order.Order {
			Int.compare(b.1.time, a.1.time);
		});

		label l for ((packageId, _) in pubsSorted.vals()) {
			ignore do ? {
				let config = packageConfigs.get(packageId)!;
				let packageSummary = _getPackageSummary(config.name, config.version)!;

				var has = false;
				label find for (details in packages.vals()) {
					if (details.config.name == config.name) {
						has := true;
						break find;
					};
				};

				if (not has) {
					packages.add(packageSummary);
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
				let version = _getHighestVersion(packageName)!;
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
		let packageNames = downloadLog.getMostDownloadedPackageNamesIn(7 * DAY);
		_summariesFromNames(downloadLog.getMostDownloadedPackageNames(), 5);
	};

	public query func getPackagesByCategory() : async [(Text, [PackageSummary])] {
		let limit = 10;
		[
			(
				"Data Structures",
				_summariesFromNames([
					"bitbuffer",
					"enumeration",
					"buffer-deque",
					"stableheapbtreemap",
					"swb",
					"vector",
					"circular-buffer",
					"splay",
					"linked-list",
					"map",
					"merkle-patricia-trie",
				], limit)
			),
			(
				"Utilities",
				_summariesFromNames([
					"itertools",
					"xtended-text",
					"xtended-numbers",
					"prng",
					"fuzz",
					"test",
					"time-consts",
				], limit)
			),
			(
				"Encoding",
				_summariesFromNames([
					"deflate",
					"serde",
					"xml",
					"cbor",
					"candy",
					"candid",
				], limit)
			),
			(
				"Cryptography",
				_summariesFromNames([
					"sha2",
					"sha3",
					"libsecp256k1",
					"merkle-patricia-trie",
					"evm-txs",
					"ic-certification",
				], limit)
			),
			(
				"Types/Interfaces",
				_summariesFromNames([
					"ic",
					"ledger-types",
					"ckbtc-types",
					"canistergeek",
					"icrc1",
					"origyn-nft",
					"kyc",
				], limit)
			),
			(
				"HTTP",
				_summariesFromNames([
					"certified-http",
					"certified-cache",
					"ic-certification",
					"assets",
					"server",
					"http-parser",
					"web-io",
				], limit)
			),
			(
				"Async Data Flow",
				_summariesFromNames([
					"star",
					"maf",
					"rxmo",
				], limit)
			),
			(
				"Databases",
				_summariesFromNames([
					"candb",
					"rxmodb",
				], limit)
			),
		];
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

		let buf = Buffer.fromArray<PackageSummary>(Iter.toArray(packagesFirstPub.vals()));
		let max = Nat.min(5, buf.size());
		Buffer.reverse(buf);
		Buffer.toArray(Buffer.subBuffer<PackageSummary>(buf, buf.size() - max, max));
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
		users.ensureUser(caller);
		switch (prop) {
			case ("name") {
				let user = users.getUser(caller);
				let hasScopedPackages = false; // TODO
				if (user.name != "" and hasScopedPackages) {
					return #err("You can't change name after publishing scoped packages");
				};
				users.setName(caller, value);
			};
			case ("site") users.setSite(caller, value);
			case ("email") users.setEmail(caller, value);
			case ("github") users.setGithub(caller, value);
			case ("twitter") users.setTwitter(caller, value);
			case (_) #err("unknown property");
		};
	};

	// SYSTEM
	stable var packagePublicationsStable : [(PackageId, PackagePublication)] = [];
	stable var packageVersionsStable : [(PackageName, [Ver])] = [];
	stable var packageOwnersStable : [(PackageName, Principal)] = [];
	stable var packageConfigsStableV2 : [(PackageId, PackageConfigV2)] = [];
	stable var highestConfigsStableV2 : [(PackageName, PackageConfigV2)] = [];

	stable var fileIdsByPackageStable : [(PackageId, [FileId])] = [];

	stable var downloadLogStable : DownloadLog.Stable = null;
	stable var storageManagerStable : StorageManager.Stable = null;
	stable var usersStable : Users.Stable = null;

	system func preupgrade() {
		packagePublicationsStable := Iter.toArray(packagePublications.entries());
		packageVersionsStable := Iter.toArray(packageVersions.entries());
		packageOwnersStable := Iter.toArray(packageOwners.entries());
		fileIdsByPackageStable := Iter.toArray(fileIdsByPackage.entries());
		downloadLogStable := downloadLog.toStable();
		storageManagerStable := storageManager.toStable();
		usersStable := users.toStable();

		highestConfigsStableV2 := Iter.toArray(highestConfigs.entries());
		packageConfigsStableV2 := Iter.toArray(packageConfigs.entries());
	};

	system func postupgrade() {
		packagePublications := TrieMap.fromEntries<PackageId, PackagePublication>(packagePublicationsStable.vals(), Text.equal, Text.hash);
		packagePublicationsStable := [];

		packageVersions := TrieMap.fromEntries<PackageName, [Ver]>(packageVersionsStable.vals(), Text.equal, Text.hash);
		packageVersionsStable := [];

		packageOwners := TrieMap.fromEntries<PackageName, Principal>(packageOwnersStable.vals(), Text.equal, Text.hash);
		packageOwnersStable := [];

		fileIdsByPackage := TrieMap.fromEntries<PackageId, [FileId]>(fileIdsByPackageStable.vals(), Text.equal, Text.hash);
		fileIdsByPackageStable := [];

		downloadLog.cancelTimers();
		downloadLog.loadStable(downloadLogStable);
		downloadLog.setTimers();
		downloadLogStable := null;

		storageManager.loadStable(storageManagerStable);
		storageManagerStable := null;

		users.loadStable(usersStable);
		usersStable := null;

		highestConfigs := TrieMap.fromEntries<PackageName, PackageConfigV2>(highestConfigsStableV2.vals(), Text.equal, Text.hash);
		packageConfigs := TrieMap.fromEntries<PackageId, PackageConfigV2>(packageConfigsStableV2.vals(), Text.equal, Text.hash);

		highestConfigsStableV2 := [];
		packageConfigsStableV2 := [];
	};
};