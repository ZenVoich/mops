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
import {hello} "mo:utils/test";

import Utils "../utils";
import Version "./version";
import Types "./types";
import {validateConfig} "./validate-config";
import DownloadLog "./download-log";

actor {
	public type PackageName = Text.Text; // lib
	public type PackageId = Text.Text; // lib@1.2.3
	public type Err = Text.Text;
	public type Dependency = Types.Dependency;
	public type Access = Types.Access;
	public type Permission = Types.Permission;
	public type PackageConfig = Types.PackageConfig;
	public type PackageSummary = Types.PackageSummary;

	public type PackagePublication = {
		user: Principal;
		time: Time.Time;
	};

	var packagePublications = TrieMap.TrieMap<PackageId, PackagePublication>(Text.equal, Text.hash);
	var packageVersions = TrieMap.TrieMap<PackageName, [Version.Version]>(Text.equal, Text.hash);
	var packageConfigs = TrieMap.TrieMap<PackageId, PackageConfig>(Text.equal, Text.hash);
	var lastConfigs = TrieMap.TrieMap<PackageName, PackageConfig>(Text.equal, Text.hash);

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

	// publish
	type PublishingId = Text.Text;
	type PublishingErr = Err;
	type PublishingPackage = {
		time: Time.Time;
		user: Principal;
		config: PackageConfig;
	};
	let publishingPackages = TrieMap.TrieMap<PublishingId, PublishingPackage>(Text.equal, Text.hash);
	let publishingFiles = TrieMap.TrieMap<PublishingId, Buffer.Buffer<File>>(Text.equal, Text.hash);


	// TODO: check immutable fields
	// TODO: check dependency versions exists
	public shared ({caller}) func startPublish(config: PackageConfig): async Result.Result<PublishingId, PublishingErr> {
		assert(Utils.isAuthorized(caller));

		// validate config
		switch (validateConfig(config)) {
			case (#ok()) {};
			case (#err(err)) {
				return #err(err);
			};
		};

		var permissionCheck = switch (lastConfigs.get(config.name)) {
			case (null) {
				if (config.author != caller) {
					#err("Author mismatch");
				}
				else #ok("");
			};
			case (?lastConfig) {
				// todo: check permission field
				if (lastConfig.author != caller) {
					#err("You don't have no permissions to publish this package");
				}
				else #ok("");
			};
		};

		if (Result.isErr(permissionCheck)) {
			return permissionCheck;
		};

		// check version increment
		let versionsMaybe = packageVersions.get(config.name);
		if (Option.isSome(versionsMaybe)) {
			let versions = Utils.unwrap(versionsMaybe);
			let verSorted = Array.sort(versions, Version.compare);

			if (verSorted.size() != 0) {
				let maxVer = verSorted[verSorted.size() - 1];

				let order = Version.compare(maxVer, config.version);
				if (order == #equal) {
					return #err(config.name # "@" # config.version # " already published");
				};
				if (order == #greater) {
					return #err("Bigger version of package already published - " # maxVer # ". Please increment the package version");
				};
			};
		};

		// TODO: generate id
		let publishingId = Nat.toText(publishingPackages.size());

		if (publishingPackages.get(publishingId) != null) {
			return #err("Already publishing");
		};

		// start
		publishingPackages.put(publishingId, {
			time = Time.now();
			user = caller;
			config = config;
		});
		publishingFiles.put(publishingId, Buffer.Buffer(10));

		#ok(publishingId);
	};

	public shared ({caller}) func uploadFile(publishingId: PublishingId, path: Text.Text, content: Blob): async Result.Result<(), Err> {
		assert(Utils.isAuthorized(caller));

		let publishing = Utils.expect(publishingPackages.get(publishingId), "Publishing package not found");
		assert(publishing.user == caller);

		let pubFiles = Utils.expect(publishingFiles.get(publishingId), "Publishing files not found");
		assert(pubFiles.size() < 100);

		let moMd = Text.endsWith(path, #text ".mo") or Text.endsWith(path, #text ".md");
		let didToml = Text.endsWith(path, #text ".did") or Text.endsWith(path, #text ".toml");
		let license = Text.endsWith(path, #text "LICENSE") or Text.endsWith(path, #text "LICENSE.md") or Text.endsWith(path, #text "license");
		if (not (moMd or didToml or license)) {
			Debug.trap("File " # path # " has unsupported extension. Allowed: .mo, .md, .did, .toml");
		};

		let file: File = {
			id = publishing.config.name # "@" # publishing.config.version # "/" # path;
			path = path;
			content = content;
		};
		pubFiles.add(file);

		#ok();
	};

	// TODO: check required files
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

		for (file in pubFiles.vals()) {
			files.put(file.id, file);
		};

		let versions = Option.get(packageVersions.get(publishing.config.name), []);
		packageVersions.put(publishing.config.name, Array.append(versions, [publishing.config.version]));

		packageConfigs.put(packageId, publishing.config);
		lastConfigs.put(publishing.config.name, publishing.config);
		packagePublications.put(packageId, {
			user = caller;
			time = Time.now();
		});

		publishingFiles.delete(publishingId);
		publishingPackages.delete(publishingId);

		#ok();
	};


	// QUERY
	public shared query ({caller}) func whoami(): async Text.Text {
		Principal.toText(caller);
	};

	public shared query ({caller}) func getLastVersion(name: PackageName): async Version.Version {
		let config = Utils.expect(lastConfigs.get(name), "Package '" # name # "' not found");
		config.version;
	};

	public shared query ({caller}) func getLastConfig(name: PackageName): async PackageConfig {
		Utils.expect(lastConfigs.get(name), "Package '" # name # "' not found");
	};

	public shared query ({caller}) func getConfig(name: PackageName, version: Version.Version): async PackageConfig {
		Utils.expect(packageConfigs.get(name # "@" # version), "Package '" # name # "@" # version # "' not found");
	};

	public shared query ({caller}) func getFileIds(name: PackageName, version: Version.Version): async [FileId] {
		let packageId = name # "@" # version;
		Utils.expect(fileIdsByPackage.get(packageId), "Package '" # packageId # "' not found");
	};

	public shared query ({caller}) func getFile(fileId: FileId): async File {
		Utils.expect(files.get(fileId), "File '" # fileId # "' not found");
	};

	public shared query ({caller}) func getReadmeFile(name: PackageName, version: Version.Version): async File {
		let config = Utils.expect(packageConfigs.get(name # "@" # version), "Package '" # name # "@" # version # "' not found");
		let fileId = config.name # "@" # config.version # "/" # config.readme;
		Utils.expect(files.get(fileId), "File '" # fileId # "' not found");
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

		for (config in lastConfigs.vals()) {
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

		Array.map<PackageConfig, PackageSummary>(packages, func(config) {
			let updatedAt = switch (packagePublications.get(config.name # "@" # config.version)) {
				case (?pub) { pub.time };
				case (null) { 0 };
			};
			return {
				name = config.name;
				version = config.version;
				description = config.description;
				keywords = config.keywords;
				author = config.author;
				updatedAt = updatedAt;
				downloadsInLast30Days = 0;
				downloadsTotal = 0;
			}
		});
	};

	public query func test(): async Text {
		hello("world");
	};


	// SYSTEM
	stable var packagePublicationsStable: [(PackageId, PackagePublication)] = [];
	stable var packageVersionsStable: [(PackageName, [Version.Version])] = [];
	stable var packageConfigsStable: [(PackageId, PackageConfig)] = [];
	stable var lastConfigsStable: [(PackageName, PackageConfig)] = [];

	stable var fileIdsByPackageStable: [(PackageId, [FileId])] = [];
	stable var filesStable: [(FileId, File)] = [];

	stable var downloadLogStable: DownloadLog.Stable = null;


	system func preupgrade() {
		lastConfigsStable := Iter.toArray(lastConfigs.entries());
		downloadLogStable := downloadLog.toStable();
	};

	system func postupgrade() {
		lastConfigs := TrieMap.fromEntries<PackageName, PackageConfig>(lastConfigsStable.vals(), Text.equal, Text.hash);
		lastConfigsStable := [];

		packagePublications := TrieMap.fromEntries<PackageId, PackagePublication>(packagePublicationsStable.vals(), Text.equal, Text.hash);
		packagePublicationsStable := [];

		packageVersions := TrieMap.fromEntries<PackageName, [Version.Version]>(packageVersionsStable.vals(), Text.equal, Text.hash);
		packageVersionsStable := [];

		packageConfigs := TrieMap.fromEntries<PackageId, PackageConfig>(packageConfigsStable.vals(), Text.equal, Text.hash);
		packageConfigsStable := [];

		files := TrieMap.fromEntries<FileId, File>(filesStable.vals(), Text.equal, Text.hash);
		filesStable := [];

		fileIdsByPackage := TrieMap.fromEntries<PackageId, [FileId]>(fileIdsByPackageStable.vals(), Text.equal, Text.hash);
		fileIdsByPackageStable := [];

		downloadLog.loadStable(downloadLogStable);
		downloadLogStable := null;
	};
};