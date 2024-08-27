import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Region "mo:base/Region";
import Debug "mo:base/Debug";
import ExperimentalStableMemory "mo:base/ExperimentalStableMemory";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Vector "mo:vector/Class";
import Bench "mo:bench";

module {
	public func init() : Bench.Bench {
		let bench = Bench.Bench();

		bench.name("Add");
		bench.description("Add items one-by-one");

		bench.cols(["StableMemory", "Region"]);
		bench.rows(["10 pages", "100 pages", "256 pages"]);

		let region = Region.new();

		bench.runner(func(row, col) {
			// StableMemory
			if (col == "StableMemory") {
				if (row == "10 pages") {
					ignore ExperimentalStableMemory.grow(10);
				}
				else if (row == "100 pages") {
					ignore ExperimentalStableMemory.grow(100);
				}
				else if (row == "256 pages") {
					ignore ExperimentalStableMemory.grow(256);
				};
			}
			// Region
			else if (col == "Region") {
				if (row == "10 pages") {
					ignore Region.grow(region, 10);

					// for (i in Iter.range(0, 10)) {
					// 	let offset = i * 10;
					// 	let value = Blob.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
					// 	Region.storeBlob(region, Nat64.fromNat(offset), value);
					// };
				}
				else if (row == "100 pages") {
					ignore Region.grow(region, 100);

					// for (i in Iter.range(0, 50)) {
					// 	let offset = i * 10;
					// 	let value = Blob.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
					// 	Region.storeBlob(region, Nat64.fromNat(offset), value);
					// };
				}
				else if (row == "256 pages") {
					ignore Region.grow(region, 256);

					// for (i in Iter.range(0, 100)) {
					// 	let offset = i * 10;
					// 	let value = Blob.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
					// 	Region.storeBlob(region, Nat64.fromNat(offset), value);
					// };
				}
			};
		});

		bench;
	};
};