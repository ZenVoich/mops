import Text "mo:base/Text";
import Result "mo:base/Result";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Nat "mo:base/Nat";

import {ic} "mo:ic";

import Types "./types";

module {
	public func verifyPackageRepository(packageName : Types.PackageName, repositoryUrl : Text, transform : Types.Transform) : async Result.Result<(), Text> {
		let url = "https://raw.githubusercontent.com/dfinity/motoko-base/main/mops.toml";
		try {
			ExperimentalCycles.add(1_000_000_000);
			let response = await ic.http_request({
				url = repositoryUrl;
				method = #get;
				max_response_bytes = ?(1024 * 4);
				body = null;
				headers = [];
				transform = ?transform;
			});

			if (response.status != 200) {
				return #err("Repository verification failed: Response status " # Nat.toText(response.status));
			};

			let textOpt = Text.decodeUtf8(Blob.fromArray(response.body));
			let text = switch (textOpt) {
				case (?text) text;
				case (null) {
					return #err("Repository verification failed: Cannot decode response");
				};
			};

			// TODO: parse mops.toml
			#ok;
		}
		catch (err) {
			return #err("Repository verification failed: Unexpected error: " # Error.message(err));
		};
	};
};