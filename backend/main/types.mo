import Time "mo:base/Time";

module {
	public type PackageName = Text; // lib
	public type PackageId = Text; // lib@1.2.3
	public type Err = Text;

	public type Dependency = {
		name: PackageName; // max 50
		version: Text; // max 20
	};

	public type Access = {
		#readOnly;
		#readWrite;
	};

	public type Permission = {
		user: Principal;
		access: Access;
	};

	public type Script = {
		name: Text; // max 50
		value: Text; // max 200
	};

	public type PackageConfig = {
		name: PackageName; // max 50
		version: Text; // max 20
		description: Text; // max 200
		repository: Text; // max 300
		keywords: [Text]; // max 5 items, max 20 chars
		documentation: Text; // max 300
		homepage: Text; // max 300
		readme: Text; // max 100
		license: Text; // max 30
		donation: Text; // empty or 64 chars
		dependencies: [Dependency]; // max 100 items
		scripts: [Script]; // max 40 items
		dfx: Text; // max 10
		moc: Text; // max 10
	};

	public type PackagePublication = {
		time: Time.Time;
		user: Principal;
		storage: Principal;
	};

	public type PackageDetails = {
		owner: Principal;
		config: PackageConfig;
		publication: PackagePublication;
		downloadsTotal: Nat;
		downloadsInLast30Days: Nat;
	};
};