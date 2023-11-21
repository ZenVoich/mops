import TrieMap "mo:base/TrieMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Time "mo:base/Time";

import Types "../types";
import Semver "../semver";
import PackageUtils "../package-utils";

module {
	public type PackageName = Types.PackageName;
	public type PackageVersion = Types.PackageVersion;
	public type PackageId = Types.PackageId;
	public type FileId = Types.FileId;
	public type Err = Text;
	public type DependencyV2 = Types.DependencyV2;
	public type Access = Types.Access;
	public type PackageConfigV2 = Types.PackageConfigV2;
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
	public type PackageChanges = Types.PackageChanges;
	public type TestsChanges = Types.TestsChanges;
	public type DepChange = Types.DepChange;
	public type DepsStatus = Types.DepsStatus;
	public type PackageQuality = Types.PackageQuality;

	type NewPackageReleaseArgs = {
		userId : Principal;
		config : PackageConfigV2;
		notes : Text;
		storageId : Principal;
		fileIds : [FileId];
		fileHashes : [(FileId, Blob)];
		fileStats : ?PackageFileStats;
		testStats : ?TestStats;
	};

	public class Registry(
		packageVersions : TrieMap.TrieMap<PackageName, [PackageVersion]>,
		packageOwners : TrieMap.TrieMap<PackageName, Principal>,
		highestConfigs : TrieMap.TrieMap<PackageName, PackageConfigV2>,
		packageConfigs : TrieMap.TrieMap<PackageId, PackageConfigV2>,
		packagePublications : TrieMap.TrieMap<PackageId, PackagePublication>,
		fileIdsByPackage : TrieMap.TrieMap<PackageId, [FileId]>,
		hashByFileId : TrieMap.TrieMap<FileId, Blob>,
		packageFileStats : TrieMap.TrieMap<PackageId, PackageFileStats>,
		packageTestStats : TrieMap.TrieMap<PackageId, TestStats>,
		packageNotes : TrieMap.TrieMap<PackageId, Text>,
	) {

		// -----------------------------
		// Manage registry
		// -----------------------------

		public func newPackageRelease(newRelease : NewPackageReleaseArgs) {
			let packageId = newRelease.config.name # "@" # newRelease.config.version;

			_updateHighestConfig(newRelease.config);

			let versions = Option.get(packageVersions.get(newRelease.config.name), []);
			packageVersions.put(newRelease.config.name, Array.append(versions, [newRelease.config.version]));

			packageConfigs.put(packageId, newRelease.config);
			packageOwners.put(newRelease.config.name, newRelease.userId);
			packagePublications.put(packageId, {
				user = newRelease.userId;
				time = Time.now();
				storage = newRelease.storageId;
			});

			fileIdsByPackage.put(packageId, newRelease.fileIds);

			for ((fileId, hash) in newRelease.fileHashes.vals()) {
				hashByFileId.put(fileId, hash);
			};

			switch (newRelease.fileStats) {
				case (?fileStats) {
					packageFileStats.put(packageId, fileStats);
				};
				case (null) {};
			};

			switch (newRelease.testStats) {
				case (?testStats) {
					packageTestStats.put(packageId, testStats);
				};
				case (null) {};
			};

			packageNotes.put(packageId, newRelease.notes);

		};

		func _updateHighestConfig(config : PackageConfigV2) {
			switch (getHighestVersion(config.name)) {
				case (?ver) {
					if (Semver.compare(config.version, ver) == #greater) {
						highestConfigs.put(config.name, config);
					};
				};
				case (null) {
					highestConfigs.put(config.name, config);
				};
			};
		};

		// -----------------------------
		// All packages
		// -----------------------------

		public func getHighestConfigs() : [PackageConfigV2] {
			Iter.toArray(highestConfigs.vals());
		};

		public func getAllConfigs() : [PackageConfigV2] {
			Iter.toArray(packageConfigs.vals());
		};

		// -----------------------------
		// By package name
		// -----------------------------

		public func getPackageOwner(name : PackageName) : ?Principal {
			packageOwners.get(name);
		};

		public func getPackageVersions(name : PackageName) : ?[PackageVersion] {
			packageVersions.get(name);
		};

		public func getHighestVersion(name : PackageName) : ?PackageVersion {
			let ?versions = packageVersions.get(name) else return null;
			let verSorted = Array.sort(versions, Semver.compare);

			if (verSorted.size() != 0) {
				return ?verSorted[verSorted.size() - 1];
			};
			return null;
		};

		// -----------------------------
		// By package name and version
		// -----------------------------

		public func getPackageConfig(name : PackageName, version : PackageVersion) : ?PackageConfigV2 {
			packageConfigs.get(name # "@" # version);
		};

		public func getPackagePublication(name : PackageName, version : PackageVersion) : ?PackagePublication {
			packagePublications.get(name # "@" # version);
		};

		public func getPackageFileStats(name : PackageName, version : PackageVersion) : PackageFileStats {
			Option.get(packageFileStats.get(name # "@" # version), PackageUtils.defaultPackageFileStats());
		};

		public func getPackageTestStats(name : PackageName, version : PackageVersion) : TestStats {
			Option.get(packageTestStats.get(name # "@" # version), { passed = 0; passedNames = []; });
		};

		public func getPackageReleaseNotes(name : PackageName, version : PackageVersion) : Text {
			Option.get(packageNotes.get(name # "@" # version), "")
		};
	};
};