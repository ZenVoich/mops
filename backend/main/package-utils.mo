import Types "./types";
import Iter "mo:base/Iter";
import Text "mo:base/Text";

module {
	public type PackageName = Types.PackageName;
	public type PackageVersion = Types.PackageVersion;
	public type PackageId = Types.PackageId;
	public type PackageFileStats = Types.PackageFileStats;
	public type PackageChanges = Types.PackageChanges;

	public func getPackageId(name : PackageName, version : PackageVersion) : PackageId {
		name # "@" # version;
	};

	public func parsePackageId(packageId : PackageId) : (PackageName, PackageVersion) {
		let parts = Iter.toArray(Text.split(packageId, #text("@")));
		(parts[0], parts[1]);
	};

	public func defaultPackageFileStats() : PackageFileStats {
		{
			sourceFiles = 0;
			sourceSize = 0;
			docsCount = 0;
			docsSize = 0;
			testFiles = 0;
			testSize = 0;
			benchFiles = 0;
			benchSize = 0;
		}
	};

	public func defaultPackageChanges() : PackageChanges {
		{
			notes = "";
			tests = {
				addedNames = [];
				removedNames = [];
			};
			deps = [];
			devDeps = [];
		};
	};
};