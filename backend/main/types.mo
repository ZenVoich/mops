import Time "mo:base/Time";

module {
	public type PackageName = Text; // lib
	public type PackageId = Text; // lib@1.2.3
	public type Err = Text;

	public type Dependency = {
		name: PackageName; // max 80
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

	public type PackageConfig = {
		name: PackageName; // max 80
		version: Text; // max 20
		description: Text; // max 200
		repository: Text; // max 300
		keywords: [Text]; // max 5 items, max 20 chars
		documentation: Text; // max 300
		homepage: Text; // max 300
		readme: Text; // max 100
		license: Text; // max 30
		isPrivate: Bool;
		owner: Principal;
		donation: Text; // max 64
		files: [Text]; // max 20 items, max 100 chars
		dependencies: [Dependency]; // max 100 items
		permissions: [Permission]; // max 50 items
		dfx: Text; // max 10
		moc: Text; // max 10
	};

	public type PackageSummary = {
		name: PackageName;
		version: Text;
		description: Text;
		keywords: [Text];
		downloadsInLast30Days: Nat;
		downloadsTotal: Nat;
		updatedAt: Time.Time;
	};
};