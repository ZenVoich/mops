import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Prelude "mo:base/Prelude";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Int "mo:base/Int";

module {
	let admins = ["hc7ih-ylbcm-cxqrk-kembs-xbsdz-7fhd7-amg45-yi62z-xvihp-6zilv-kae"];

	public func isAuthorized(principal : Principal) : Bool {
		not Principal.isAnonymous(principal);
	};

	public func isAdmin(principal : Principal) : Bool {
		let principalText = Principal.toText(principal);
		let admin = Array.find<Text>(admins, func(id : Text) = id == principalText) != null;
		admin or Principal.isController(principal);
	};

	public func anonymousPrincipal() : Principal {
		Principal.fromText("2vxsx-fae")
	};

	public func expect<T>(option : ?T, trapText : Text) : T {
		switch (option) {
			case (?val) val;
			case (null) Debug.trap(trapText);
		};
	};

	public func unwrap<T>(option : ?T) : T {
		switch (option) {
			case (?val) val;
			case (null) Prelude.unreachable();
		};
	};

	func _getPageItems<T>(items : [T], pageIndex : Nat, limit : Nat) : [T] {
		let start = pageIndex * limit;
		let end = Nat.min(start + limit, items.size());
		let size = end - start;

		if (size == 0) {
		return [];
		};

		let buf = Buffer.Buffer<T>(size);
		for (i in Iter.range(start, end - 1)) {
		buf.add(items[i]);
		};

		Buffer.toArray(buf);
	};

	public func getPage<T>(items : [T], pageIndex : Nat, limit : Nat) : ([T], Nat) {
		(
			_getPageItems(items, pageIndex, limit),
			items.size() / limit + (if (items.size() % limit == 0) 0 else 1),
		);
	};

	public func arrayTake<T>(ar : [T], n : Int) : [T] {
		let resSize = Nat.min(Int.abs(n), ar.size());
		let start = if (n > 0) 0 else ar.size() - resSize;
		Array.subArray(ar, 0, resSize);
	};
}