import ExperimentalInternetComputer "mo:base/ExperimentalInternetComputer";
import Buffer "mo:base/Buffer";
import Nat64 "mo:base/Nat64";
import Prim "mo:prim";

module {
	let VERSION = 1;

	public type BenchMode = {
		#replica;
		#wasi;
	};

	public type BenchSchema = {
		name : Text;
		description : Text;
		rows : [Text];
		cols : [Text];
	};

	public type BenchResult = {
		instructions : Nat;
		rts_heap_size : Nat;
		rts_memory_size : Nat;
		rts_total_allocation : Nat;
		rts_mutator_instructions : Nat;
		rts_collector_instructions : Nat;
	};

	public class Bench() {
		var _name = "";
		var _description = "";
		var _rows = Buffer.Buffer<Text>(0);
		var _cols = Buffer.Buffer<Text>(0);
		var _runner = func(row : Text, col : Text) {};

		public func name(value : Text) {
			_name := value;
		};

		public func description(value : Text) {
			_description := value;
		};

		public func rows(value : [Text]) {
			_rows := Buffer.fromArray(value);
		};

		public func cols(value : [Text]) {
			_cols := Buffer.fromArray(value);
		};

		public func runner(fn : (row : Text, col : Text) -> ()) {
			_runner := fn;
		};

		// INTERNAL
		public func getVersion() : Nat {
			VERSION;
		};

		public func getSchema() : BenchSchema {
			{
				name = _name;
				description = _description;
				rows = Buffer.toArray(_rows);
				cols = Buffer.toArray(_cols);
			}
		};

		public func runCell(rowIndex : Nat, colIndex : Nat) {
			let row = _rows.get(rowIndex);
			let col = _cols.get(colIndex);
			_runner(row, col);
		};
	};
};