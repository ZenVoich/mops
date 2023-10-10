import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Vector "mo:vector/Class";
import Bench "mo:bench";

module {
	public func init() : Bench.Bench {
		let bench = Bench.Bench();

		bench.name("Add (second)");
		bench.description("Add items one-by-one (second)");

		bench.rows(["Buffer", "Vector"]);
		bench.cols(["10", "10000", "1000000"]);

		bench.runner(func(row, col) {
			let ?n = Nat.fromText(col);

			// Vector
			if (row == "Vector") {
				let vec = Vector.Vector<Nat>();
				for (i in Iter.range(1, n)) {
					vec.add(i);
				};
			}
			// Buffer
			else if (row == "Buffer") {
				let buf = Buffer.Buffer<Nat>(0);
				for (i in Iter.range(1, n)) {
					buf.add(i);
				};
			};
		});

		// bench.table(["Vector", "Buffer"], ["10", "10000", "1000000"], func(row, col) {
		// });

		bench;
	};
};