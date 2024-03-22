import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import TrieSet "mo:base/TrieSet";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

import Types "../types";
import Registry "./Registry";
import DownloadLog "../DownloadLog";
import Users "../Users";

import {getPackageSummary; getPackageSummaryWithChanges} "./getPackageSummary";
import {getPackageChanges} "./getPackageChanges";

module {
	public type PackageName = Types.PackageName;
	public type PackageVersion = Types.PackageVersion;
	public type PackageSummary = Types.PackageSummary;
	public type PackageDetails = Types.PackageDetails;
	public type PackageSummaryWithChanges = Types.PackageSummaryWithChanges;
	public type DependencyV2 = Types.DependencyV2;
	public type PackageConfigV2 = Types.PackageConfigV2;

	// package details that appear on the package page
	public func getPackageDetails(registry : Registry.Registry, users : Users.Users, downloadLog : DownloadLog.DownloadLog, name : PackageName, version : PackageVersion) : ?PackageDetails {

		// all package versions with summaies and changes
		func _getPackageVersionHistory(name : PackageName) : [PackageSummaryWithChanges] {
			let ?versions = registry.getPackageVersions(name) else Debug.trap("Package '" # name # "' not found");
			Array.reverse(Array.map<PackageVersion, PackageSummaryWithChanges>(versions, func(version) {
				let ?summary = getPackageSummaryWithChanges(registry, users, downloadLog, name, version) else Debug.trap("Package '" # name # "' not found");
				summary;
			}));
		};

		func _getDepsSummaries(deps : [DependencyV2]) : [PackageSummary] {
			let filtered = Array.filter<DependencyV2>(deps, func(dep) {
				dep.repo == "";
			});
			Array.map<DependencyV2, PackageSummary>(filtered, func(dep) {
				let ?summary = getPackageSummary(registry, users, downloadLog, dep.name, dep.version) else Debug.trap("Package '" # dep.name # "' not found");
				summary;
			});
		};

		// dependencies
		func _getPackageDependencies(name : PackageName, version : PackageVersion) : [PackageSummary] {
			let packageId = name # "@" # version;
			let ?config = registry.getPackageConfig(name, version) else Debug.trap("Package '" # packageId # "' not found");
			_getDepsSummaries(config.dependencies);
		};

		// dev dependencies
		func _getPackageDevDependencies(name : PackageName, version : PackageVersion) : [PackageSummary] {
			let packageId = name # "@" # version;
			let ?config = registry.getPackageConfig(name, version) else Debug.trap("Package '" # packageId # "' not found");
			_getDepsSummaries(config.devDependencies);
		};

		// dependents
		func _getPackageDependents(name : PackageName) : [PackageSummary] {
			func isDependent(config : PackageConfigV2) : Bool {
				let dependent = Option.isSome(Array.find<DependencyV2>(config.dependencies, func(dep : DependencyV2) {
					dep.name == name and dep.repo == "";
				}));
				let devDependent = Option.isSome(Array.find<DependencyV2>(config.devDependencies, func(dep : DependencyV2) {
					dep.name == name and dep.repo == "";
				}));
				dependent or devDependent;
			};

			let dependentConfigs = Array.filter<PackageConfigV2>(registry.getAllConfigs(), isDependent);

			let pkgHash = func(a : PackageConfigV2) : Hash.Hash {
				Text.hash(a.name);
			};
			let pkgEqual = func(a : PackageConfigV2, b : PackageConfigV2) : Bool {
				a.name == b.name;
			};
			let unique = TrieSet.toArray(TrieSet.fromArray<PackageConfigV2>(dependentConfigs, pkgHash, pkgEqual)).vals();

			let summaries = Iter.map<PackageConfigV2, PackageSummary>(unique, func(config) {
				let ?summary = getPackageSummary(registry, users, downloadLog, config.name, config.version) else Debug.trap("Package '" # name # "' not found");
				summary;
			});

			let sorted = Iter.sort<PackageSummary>(summaries, func(a, b) {
				Nat.compare(b.downloadsTotal, a.downloadsTotal);
			});

			Iter.toArray(sorted);
		};

		// return package details
		do ? {
			let summary = getPackageSummary(registry, users, downloadLog, name, version)!;
			let fileStats = registry.getPackageFileStats(name, version);

			return ?{
				summary with
				versionHistory = _getPackageVersionHistory(name);
				deps = _getPackageDependencies(name, version);
				devDeps = _getPackageDevDependencies(name, version);
				dependents = _getPackageDependents(name);
				downloadTrend = downloadLog.getDownloadTrendByPackageName(name);
				fileStats = {
					sourceFiles = fileStats.sourceFiles;
					sourceSize = fileStats.sourceSize;
				};
				testStats = registry.getPackageTestStats(name, version);
				benchmarks = registry.getPackageBenchmarks(name, version);
				changes = getPackageChanges(registry, name, version);
			};
		};
	};
};