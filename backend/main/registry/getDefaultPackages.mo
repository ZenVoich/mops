import Types "../types";
import Registry "./Registry";

module {
	public type PackageName = Types.PackageName;
	public type PackageVersion = Types.PackageVersion;

	public func getDefaultPackages(registry : Registry.Registry, dfxVersion : Text) : [(PackageName, PackageVersion)] {
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
			case ("0.14.4") [("base", "0.9.3")];
			case ("0.15.0") [("base", "0.9.7")];
			case ("0.15.1") [("base", "0.9.8")];
			case ("0.15.2") [("base", "0.10.2")];
			case ("0.15.3") [("base", "0.10.3")];
			case ("0.16.0") [("base", "0.10.4")];
			case ("0.16.1") [("base", "0.10.4")];
			case ("0.17.0") [("base", "0.10.4")];
			case (_) {
				switch (registry.getHighestVersion("base")) {
					case (?ver) [("base", ver)];
					case (null) [];
				};
			};
		};
	};
};