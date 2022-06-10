import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
// import {hello} "mo:utils/test";

import Utils "../utils";
import Version "./version";
import Types "./types";
import {validateConfig} "./validate-config";
import DownloadLog "./download-log";
import StorageManager "../storage/storage-manager";
import Storage "../storage/storage-canister";
import {generateId} "../generate-id";

actor {
	public type PackageName = Text.Text; // lib
	public type PackageId = Text.Text; // lib@1.2.3
	public type Err = Text.Text;
	public type Dependency = Types.Dependency;
	public type Access = Types.Access;
	public type PackageConfig = Types.PackageConfig;
	public type PackageSummary = Types.PackageSummary;

	public type PackagePublication = {
		time: Time.Time;
		user: Principal;
		storage: Principal;
	};

	let apiVersion = "0.1"; // (!) make changes in pair with cli
	var packagePublications = TrieMap.TrieMap<PackageId, PackagePublication>(Text.equal, Text.hash);
	var packageVersions = TrieMap.TrieMap<PackageName, [Version.Version]>(Text.equal, Text.hash);
	var packageOwners = TrieMap.TrieMap<PackageName, Principal>(Text.equal, Text.hash);
	var packageConfigs = TrieMap.TrieMap<PackageId, PackageConfig>(Text.equal, Text.hash);
	var maxConfigs = TrieMap.TrieMap<PackageName, PackageConfig>(Text.equal, Text.hash);

	// files
	public type FileId = Text.Text;
	public type File = {
		id: FileId;
		path: Text.Text;
		content: Blob;
	};

	var files = TrieMap.TrieMap<FileId, File>(Text.equal, Text.hash);
	var fileIdsByPackage = TrieMap.TrieMap<PackageId, [FileId]>(Text.equal, Text.hash);
	let downloadLog = DownloadLog.DownloadLog();
	let storageManager = StorageManager.StorageManager();

	// publish
	type PublishingId = Text.Text;
	type PublishingErr = Err;
	type PublishingPackage = {
		time: Time.Time;
		user: Principal;
		config: PackageConfig;
		storage: Principal;
	};
	let publishingPackages = TrieMap.TrieMap<PublishingId, PublishingPackage>(Text.equal, Text.hash);
	let publishingFiles = TrieMap.TrieMap<PublishingId, Buffer.Buffer<File>>(Text.equal, Text.hash);


	// PRIVATE
	func _getMaxVersion(name: PackageName): ?Version.Version {
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

	func _resolveVersion(name: PackageName, version: Version.Version): Version.Version {
		if (version == "max") {
			Utils.expect(_getMaxVersion(name), "Package '" # name # "' not found");
		}
		else {
			version;
		};
	};

	func _updateMaxConfig(config: PackageConfig) {
		switch (_getMaxVersion(config.name)) {
			case (?ver) {
				if (Version.compare(config.version, ver) == #greater) {
					maxConfigs.put(config.name, config);
				};
			};
			case (null) {
				maxConfigs.put(config.name, config);
			};
		}
	};


	// PUBLIC
	public shared ({caller}) func startPublish(config: PackageConfig): async Result.Result<PublishingId, PublishingErr> {
		assert(Utils.isAuthorized(caller));

		// validate config
		switch (validateConfig(config)) {
			case (#ok()) {};
			case (#err(err)) {
				return #err(err);
			};
		};

		// check permissions
		switch (packageOwners.get(config.name)) {
			case (null) {};
			case (?owner) {
				if (owner != caller) {
					return #err("You don't have permissions to publish this package");
				};
			};
		};

		// check if the same version is published
		switch (packageVersions.get(config.name)) {
			case (?versions) {
				let sameVersionOpt = Array.find<Version.Version>(versions, func(ver: Version.Version) {
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
			switch (packageConfigs.get(packageId)) {
				case (null) {
					return #err("Dependency " # packageId # " not found in registry");
				};
				case (_) {};
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

	// public shared ({caller}) func startFileUpload(publishingId: PublishingId, path: Text.Text, chunkCount: Nat): async Result.Result<(), Err> {
	public shared ({caller}) func uploadFile(publishingId: PublishingId, path: Text.Text, content: Blob): async Result.Result<(), Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		let pubFiles = Utils.expect(publishingFiles.get(publishingId), "Publishing files not found");
		assert(pubFiles.size() < 100);

		let moMd = Text.endsWith(path, #text(".mo")) or Text.endsWith(path, #text(".md"));
		let didToml = Text.endsWith(path, #text(".did")) or Text.endsWith(path, #text(".toml"));
		let license = Text.endsWith(path, #text("LICENSE")) or Text.endsWith(path, #text("LICENSE.md")) or Text.endsWith(path, #text("license"));
		if (not (moMd or didToml or license)) {
			Debug.trap("File " # path # " has unsupported extension. Allowed: .mo, .md, .did, .toml");
		};

		let fileId = publishing.config.name # "@" # publishing.config.version # "/" # path;

		await storageManager.startUpload(publishing.storage, {
			id = fileId;
			path = path;
			chunkCount = 1;
			owners = [];
		});
		await storageManager.uploadChunk(publishing.storage, fileId, 0, content);

		let file: File = {
			id = publishing.config.name # "@" # publishing.config.version # "/" # path;
			path = path;
			content = content;
		};
		pubFiles.add(file);

		#ok();
	};

	public shared ({caller}) func finishPublish(publishingId: PublishingId): async Result.Result<(), Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		let packageId = publishing.config.name # "@" # publishing.config.version;
		let pubFiles = Utils.expect(publishingFiles.get(publishingId), "Publishing files not found");

		let fileIds = Array.map(pubFiles.toArray(), func(file: File): Text.Text {
			file.id;
		});
		fileIdsByPackage.put(packageId, fileIds);

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

		for (file in pubFiles.vals()) {
			files.put(file.id, file);
			await storageManager.finishUpload(publishing.storage, file.id);
		};

		let versions = Option.get(packageVersions.get(publishing.config.name), []);
		packageVersions.put(publishing.config.name, Array.append(versions, [publishing.config.version]));

		packageConfigs.put(packageId, publishing.config);
		packageOwners.put(publishing.config.name, caller);
		maxConfigs.put(publishing.config.name, publishing.config);
		packagePublications.put(packageId, {
			user = caller;
			time = Time.now();
			storage = publishing.storage;
		});

		publishingFiles.delete(publishingId);
		publishingPackages.delete(publishingId);

		#ok();
	};


	// QUERY
	public shared query ({caller}) func getApiVersion(): async Text.Text {
		apiVersion;
	};

	public shared query ({caller}) func getMaxVersion(name: PackageName): async Version.Version {
		Utils.expect(_getMaxVersion(name), "Package '" # name # "' not found");
	};

	public shared query ({caller}) func getPackageSummary(name: PackageName, version: Version.Version): async PackageSummary {
		var ver = _resolveVersion(name, version);
		toPackageSummary(Utils.expect(packageConfigs.get(name # "@" # ver), "Package '" # name # "@" # version # "' not found"));
	};

	public shared query ({caller}) func getConfig(name: PackageName, version: Version.Version): async PackageConfig {
		var ver = _resolveVersion(name, version);
		Utils.expect(packageConfigs.get(name # "@" # ver), "Package '" # name # "@" # version # "' not found");
	};

	public shared query ({caller}) func getFileIds(name: PackageName, version: Version.Version): async [FileId] {
		let packageId = name # "@" # version;
		Utils.expect(fileIdsByPackage.get(packageId), "Package '" # packageId # "' not found");
	};

	public shared ({caller}) func getFile(fileId: FileId): async File {
		// Utils.expect(files.get(fileId), "File '" # fileId # "' not found");
		let storageId = storageManager.getStorageOfFile(fileId);
		let storage = actor(Principal.toText(storageId)): Storage.Storage;
		let fileMeta = Utils.unwrap(Result.toOption(await storage.getFileMeta(fileId)));
		let chunk = Utils.unwrap(Result.toOption(await storage.downloadChunk(fileId, 0)));

		return {
			id = fileId;
			path = fileMeta.path;
			content = chunk;
		};
	};

	public shared ({caller}) func getReadmeFile(name: PackageName, version: Version.Version): async File {
		var ver = _resolveVersion(name, version);
		let config = Utils.expect(packageConfigs.get(name # "@" # ver), "Package '" # name # "@" # version # "' not found");
		let fileId = config.name # "@" # config.version # "/" # config.readme;
		await getFile(fileId);
	};

	public shared ({caller}) func notifyInstall(name: PackageName, version: Version.Version) {
		let packageId = name # "@" # version;

		ignore Utils.expect(packageConfigs.get(packageId), "Package not found");

		downloadLog.add({
			time = Time.now();
			name = name;
			version = version;
			downloader = caller;
		});
	};

	public query func search(searchText: Text.Text): async [PackageSummary] {
		let max = 20;
		let match = Buffer.Buffer<PackageConfig>(max);
		let pattern = #text(searchText);

		for (config in maxConfigs.vals()) {
			if (Text.contains(config.name, pattern) or Text.contains(config.description, pattern)) {
				match.add(config);
			};
		};

		var packages = Array.sort<PackageConfig>(match.toArray(), func(a, b) {
			var aPoints = 0;
			var bPoints = 0;

			if (Text.contains(a.name, pattern)) aPoints += 10;
			if (Text.contains(b.name, pattern)) bPoints += 10;

			if (a.name.size() < b.name.size()) aPoints += 1;
			if (a.name.size() > b.name.size()) bPoints += 1;

			Nat.compare(bPoints, aPoints);
		});

		// limit results
		packages := Array.tabulate<PackageConfig>(Nat.min(packages.size(), max), func(i: Nat) {
			packages[i];
		});

		Array.map<PackageConfig, PackageSummary>(packages, toPackageSummary);
	};

	public query func getRecentlyUpdatedPackages(): async [PackageSummary] {
		let max = 5;
		let packages = Buffer.Buffer<PackageSummary>(max);

		let pubsDesc = Array.reverse(Iter.toArray(packagePublications.keys()));

		label l for (packageId in pubsDesc.vals()) {
			switch (packageConfigs.get(packageId)) {
				case (?config) {
					packages.add(toPackageSummary(config));

					if (packages.size() >= max) {
						break l;
					};
				};
				case (null) {};
			};
		};

		packages.toArray();
	};

	func toPackageSummary(config: PackageConfig): PackageSummary {
		let updatedAt = switch (packagePublications.get(config.name # "@" # config.version)) {
			case (?pub) { pub.time };
			case (null) { 0 };
		};
		return {
			// config fields
			name = config.name;
			version = config.version;
			description = config.description;
			repository = config.repository;
			keywords = config.keywords;
			documentation = config.documentation;
			homepage = config.homepage;
			readme = config.readme;
			license = config.license;
			donation = config.donation;
			dependencies = config.dependencies;
			scripts = config.scripts;
			dfx = config.dfx;
			moc = config.moc;
			// extra fields
			owner = Option.get(packageOwners.get(config.name), Utils.anonymousPrincipal());
			updatedAt = updatedAt;
			downloadsInLast30Days = 0;
			downloadsTotal = 0;
		}
	};

	// public query func test(): async Text {
	// 	hello("world");
	// };


	// SYSTEM
	stable var packagePublicationsStable: [(PackageId, PackagePublication)] = [];
	stable var packageVersionsStable: [(PackageName, [Version.Version])] = [];
	stable var packageOwnersStable: [(PackageName, Principal)] = [];
	stable var packageConfigsStable: [(PackageId, PackageConfig)] = [];
	stable var maxConfigsStable: [(PackageName, PackageConfig)] = [];

	stable var fileIdsByPackageStable: [(PackageId, [FileId])] = [];
	stable var filesStable: [(FileId, File)] = [];

	stable var downloadLogStable: DownloadLog.Stable = null;
	stable var storageManagerStable: StorageManager.Stable = null;


	system func preupgrade() {
		maxConfigsStable := Iter.toArray(maxConfigs.entries());
		packagePublicationsStable := Iter.toArray(packagePublications.entries());
		packageVersionsStable := Iter.toArray(packageVersions.entries());
		packageOwnersStable := Iter.toArray(packageOwners.entries());
		packageConfigsStable := Iter.toArray(packageConfigs.entries());
		filesStable := Iter.toArray(files.entries());
		fileIdsByPackageStable := Iter.toArray(fileIdsByPackage.entries());
		downloadLogStable := downloadLog.toStable();
		storageManagerStable := storageManager.toStable();
	};

	system func postupgrade() {
		maxConfigs := TrieMap.fromEntries<PackageName, PackageConfig>(maxConfigsStable.vals(), Text.equal, Text.hash);
		maxConfigsStable := [];

		packagePublications := TrieMap.fromEntries<PackageId, PackagePublication>(packagePublicationsStable.vals(), Text.equal, Text.hash);
		packagePublicationsStable := [];

		packageVersions := TrieMap.fromEntries<PackageName, [Version.Version]>(packageVersionsStable.vals(), Text.equal, Text.hash);
		packageVersionsStable := [];

		packageOwners := TrieMap.fromEntries<PackageName, Principal>(packageOwnersStable.vals(), Text.equal, Text.hash);
		packageOwnersStable := [];

		packageConfigs := TrieMap.fromEntries<PackageId, PackageConfig>(packageConfigsStable.vals(), Text.equal, Text.hash);
		packageConfigsStable := [];

		files := TrieMap.fromEntries<FileId, File>(filesStable.vals(), Text.equal, Text.hash);
		filesStable := [];

		fileIdsByPackage := TrieMap.fromEntries<PackageId, [FileId]>(fileIdsByPackageStable.vals(), Text.equal, Text.hash);
		fileIdsByPackageStable := [];

		downloadLog.loadStable(downloadLogStable);
		downloadLogStable := null;

		storageManager.loadStable(storageManagerStable);
		storageManagerStable := null;
	};
};