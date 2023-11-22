import Array "mo:base/Array";
import Option "mo:base/Option";
import Buffer "mo:base/Buffer";

import Types "../types";
import Registry "./Registry";
import Semver "../utils/semver";

module {
	public type PackageName = Types.PackageName;
	public type PackageVersion = Types.PackageVersion;
	public type DependencyV2 = Types.DependencyV2;
	public type PackageConfigV2 = Types.PackageConfigV2;
	public type TestStats = Types.TestStats;
	public type TestsChanges = Types.TestsChanges;
	public type PackageChanges = Types.PackageChanges;
	public type DepChange = Types.DepChange;

	// get package changes between this version and previous version
	public func getPackageChanges(registry : Registry.Registry, name : PackageName, version : PackageVersion) : PackageChanges {
		let curId = name # "@" # version;
		let prevVersion = Option.get(_getPrevVersion(registry, name, version), version);
		let prevId = name # "@" # prevVersion;

		{
			notes = registry.getPackageReleaseNotes(name, version);
			tests = _computeTestsChangesBetween(registry.getPackageTestStats(name, version), registry.getPackageTestStats(name, prevVersion));
			deps = _computeDepsChangesBetween(registry.getPackageConfig(name, version), registry.getPackageConfig(name, prevVersion));
			devDeps = _computeDevDepsChangesBetween(registry.getPackageConfig(name, version), registry.getPackageConfig(name, prevVersion));
		};
	};

	// prev package version from registry by semver
	func _getPrevVersion(registry : Registry.Registry, name : PackageName, version : PackageVersion) : ?PackageVersion {
		let ?versions = registry.getPackageVersions(name) else return null;
		let verSorted = Array.sort(versions, Semver.compare);
		let ?curIndex = Array.indexOf(version, versions, Semver.equal) else return null;
		if (curIndex > 0) {
			return ?verSorted[curIndex - 1];
		};
		null;
	};

	// tests changes
	public func _computeTestsChangesBetween(prevTestStats : TestStats, curTestStats : TestStats) : TestsChanges {
		let addedNames = Array.filter<Text>(curTestStats.passedNames, func(name) {
			Array.find<Text>(prevTestStats.passedNames, func(x) = x == name) == null;
		});

		let removedNames = Array.filter<Text>(prevTestStats.passedNames, func(name) {
			Array.find<Text>(curTestStats.passedNames, func(x) = x == name) == null;
		});

		{
			addedNames;
			removedNames;
		}
	};

	// deps changes
	public func _computeDepsChangesBetween(prevPackageConfig : ?PackageConfigV2, curPackageConfig : ?PackageConfigV2) : [DepChange] {
		let oldDeps = switch (prevPackageConfig) {
			case (?config) config.dependencies;
			case (null) [];
		};
		let newDeps = switch (curPackageConfig) {
			case (?config) config.dependencies;
			case (null) [];
		};
		_computeDepsChanges(oldDeps, newDeps);
	};

	// dev deps changes
	public func _computeDevDepsChangesBetween(prevPackageConfig : ?PackageConfigV2, curPackageConfig : ?PackageConfigV2) : [DepChange] {
		let oldDeps = switch (prevPackageConfig) {
			case (?config) config.devDependencies;
			case (null) [];
		};
		let newDeps = switch (curPackageConfig) {
			case (?config) config.devDependencies;
			case (null) [];
		};
		_computeDepsChanges(oldDeps, newDeps);
	};

	// compute deps changes
	public func _computeDepsChanges(oldDeps : [DependencyV2], newDeps : [DependencyV2]) : [DepChange] {
		let buf = Buffer.Buffer<DepChange>(newDeps.size());

		func _getDepVer(dep : DependencyV2) : Text {
			if (dep.version != "") {
				dep.version;
			}
			else {
				dep.repo;
			};
		};

		// added and updated deps
		for (newDep in newDeps.vals()) {
			let oldDepOpt = Array.find<DependencyV2>(oldDeps, func(oldDep) = oldDep.name == newDep.name);
			let oldVersion = switch (oldDepOpt) {
				case (?oldDep) _getDepVer(oldDep);
				case (null) "";
			};

			if (oldVersion != _getDepVer(newDep)) {
				buf.add({
					name = newDep.name;
					oldVersion = oldVersion;
					newVersion = _getDepVer(newDep);
				});
			};

		};

		// removed deps
		for (oldDep in oldDeps.vals()) {
			let newDepOpt = Array.find<DependencyV2>(newDeps, func(newDep) = newDep.name == oldDep.name);
			if (newDepOpt == null) {
				buf.add({
					name = oldDep.name;
					oldVersion = _getDepVer(oldDep);
					newVersion = "";
				});
			};
		};

		Buffer.toArray(buf);
	};
};