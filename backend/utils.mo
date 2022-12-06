import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Prelude "mo:base/Prelude";
import Buffer "mo:base/Buffer";

import Constants "./constants";

module {
	let admins = {
		local = ["hc7ih-ylbcm-cxqrk-kembs-xbsdz-7fhd7-amg45-yi62z-xvihp-6zilv-kae"];
		ic = ["hc7ih-ylbcm-cxqrk-kembs-xbsdz-7fhd7-amg45-yi62z-xvihp-6zilv-kae"];
	};

	public func isAuthorized(principal: Principal): Bool {
		if	(Constants.NETWORK == "local") {
			true;
		}
		else {
			not Principal.isAnonymous(principal);
		}
	};

	public func isAdmin(principal: Principal): Bool {
		let principalText = Principal.toText(principal);
		let adminArr =
			if	(Constants.NETWORK == "local") admins.local
			else admins.ic;
		Array.find<Text>(adminArr, func(id: Text) = id == principalText) != null;
	};

	public func anonymousPrincipal(): Principal {
		Principal.fromText("2vxsx-fae")
	};

	public func expect<T>(option: ?T, trapText: Text): T {
		switch (option) {
			case (?val) val;
			case (null) Debug.trap(trapText);
		};
	};

	public func unwrap<T>(option: ?T): T {
		switch (option) {
			case (?val) val;
			case (null) Prelude.unreachable();
		};
	};
}