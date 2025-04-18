import Text "mo:base/Text";
import Result "mo:base/Result";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Error "mo:base/Error";

import IC "mo:ic";
import {ic} "mo:ic";

import Types "./types";

module {
	public func verifyPackageRepository(packageName : Types.PackageName, repositoryUrl : Text, transform : IC.HttpTransform) : async Result.Result<(), Text> {
		if (repositoryUrl == "") {
			return #ok;
		};

		if (not Text.startsWith(repositoryUrl, #text("https://github.com/"))) {
			return #err("Currently only github repositories are supported.\nPlease create an issue at https://github.com/ZenVoich/mops/issues if you want to add support for other repositories.");
		};

		let urlPath = Iter.toArray(Text.split(repositoryUrl, #text("https://github.com/")))[1];
		let pathChunks = Iter.toArray(Text.split(urlPath, #text("/")));
		let repoName = Array.take(pathChunks, 2);
		let path = Iter.toArray(Array.slice(pathChunks, 2, pathChunks.size()));
		let target = Array.filter<Text>(Array.flatten([repoName, ["master"], path, ["mops.toml"]]), func(x) = x != "");
		let url = "https://raw.githubusercontent.com/" # Text.join("/", target.vals());

		try {
			ExperimentalCycles.add<system>(1_000_000_000);
			let response = await ic.http_request({
				url = url;
				method = #get;
				max_response_bytes = ?(1024 * 4);
				body = null;
				headers = [];
				transform = ?transform;
			});

			if (response.status != 200) {
				return #err("Repository verification failed: Response status " # Nat.toText(response.status) # ". Please double-check the repository URL and make sure the mops.toml file exists in the repository root.");
			};

			let textOpt = Text.decodeUtf8(response.body);
			let text = switch (textOpt) {
				case (?text) text;
				case (null) {
					return #err("Repository verification failed: Cannot decode response");
				};
			};

			let hasName = text
				|> Iter.toArray(Text.split(_, #text("\n")))
				|> Array.find<Text>(_, func (line: Text) = Text.startsWith(line, #text("name")))
				|> Option.get<Text>(_, "")
				|> Text.endsWith(_, #text("\"" # packageName # "\""));

			if (not hasName) {
				return #err("Repository verification failed: Package name not found in mops.toml at " # repositoryUrl);
			};

			#ok;
		}
		catch (err) {
			return #err("Repository verification failed: Unexpected error: " # Error.message(err));
		};
	};
};