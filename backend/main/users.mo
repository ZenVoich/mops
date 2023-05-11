import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Char "mo:base/Char";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Iter "mo:base/Iter";

import Set "mo:map/Set";

import Types "./types";
import {isLetter; isLowerCaseLetter} "../main/is-letter";

module {
	public type Stable = ?{
		#v1 : {
			users : [(Principal, Types.User)];
			names : Set.Set<Text>;
		};
	};

	public class Users() {
		var _users = TrieMap.TrieMap<Principal, Types.User>(Principal.equal, Principal.hash);
		var _names = Set.new<Text>(Set.thash);

		public func toStable() : Stable {
			?#v1({
				users = Iter.toArray(_users.entries());
				names = _names;
			});
		};

		public func loadStable(stab : Stable) {
			switch (stab) {
				case (?#v1(data)) {
					_users := TrieMap.fromEntries<Principal, Types.User>(data.users.vals(), Principal.equal, Principal.hash);
					_names := data.names;
				};
				case (null) {};
			};
		};

		public func getUser(userId : Principal) : ?Types.User {
			_users.get(userId);
		};

		public func ensureUser(userId : Principal) {
			if (_users.get(userId) == null) {
				_users.put(userId, {
					id = userId;
					name = "";
					displayName = "";
					twitter = "";
					github = "";
					twitterVerified = false;
					githubVerified = false;
				})
			};
		};

		public func setName(userId : Principal, name : Text) : Result.Result<(), Text> {
			let valid = _validateName(name);
			if (Result.isErr(valid)) {
				return valid;
			};
			if (Set.has(_names, Set.thash, name)) {
				return #err("Name already taken");
			};
			if (name == "mops") {
				return #err("'mops' name is reserved");
			};
			if (name == "dfinity") {
				return #err("'dfinity' name is reserved");
			};

			let ?user = _users.get(userId) else return #err("User not found");

			// if (user.name != "") {
			// 	return #err("You cannot change user name");
			// };

			_users.put(userId, {
				user with
				name;
			});

			Set.add(_names, Set.thash, name);

			#ok;
		};

		public func setGithub(userId : Principal, github : Text) : Result.Result<(), Text> {
			let valid = _validateValue(github, ['-', '_', '.']);
			if (Result.isErr(valid)) {
				return valid;
			};

			let ?user = _users.get(userId) else return #err("User not found");
			_users.put(userId, {
				user with
				github;
			});

			#ok;
		};

		public func setTwitter(userId : Principal, twitter : Text) : Result.Result<(), Text> {
			let valid = _validateValue(twitter, ['-', '_', '.']);
			if (Result.isErr(valid)) {
				return valid;
			};

			let ?user = _users.get(userId) else return #err("User not found");
			_users.put(userId, {
				user with
				twitter;
			});

			#ok;
		};

		func _validateName(value : Text) : Result.Result<(), Text> {
			if (value.size() > 30) {
				return #err("invalid value: max length is 30 chars");
			};

			for (char in value.chars()) {
				if (not isLowerCaseLetter(char) and not Char.isDigit(char)) {
					return #err("invalid value: unexpected char '" # Char.toText(char) # "' in '" # value # "'");
				};
			};

			#ok;
		};

		func _validateValue(value : Text, allowedChars : [Char]) : Result.Result<(), Text> {
			let allowedCharsBuf = Buffer.fromArray<Char>(allowedChars);

			if (value.size() > 30) {
				return #err("invalid value: max length is 30 chars");
			};

			for (char in value.chars()) {
				if (not isLetter(char) and not Char.isDigit(char) and not Buffer.contains(allowedCharsBuf, char, Char.equal)) {
					return #err("invalid value: unexpected char '" # Char.toText(char) # "' in '" # value # "'");
				};
			};

			#ok;
		};
	};
};