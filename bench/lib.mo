import ExperimentalInternetComputer "mo:base/ExperimentalInternetComputer";
import Buffer "mo:base/Buffer";
import Nat64 "mo:base/Nat64";
import Prim "mo:prim";

module {
	let VERSION = 1;

	public type BenchSchema = {
		name : Text;
		description : Text;
		rows : [Text];
		cols : [Text];
	};

	public type BenchResult = {
		instructions : Int;
		rts_mutator_instructions : Int;
		rts_collector_instructions : Int;
		rts_heap_size : Int;
		rts_memory_size : Int;
		rts_total_allocation : Int;
	};

	class BenchHeap() {
		type List = {
			value : Any;
			var next : ?List;
		};

		let list : List = {
			value = null;
			var next = null;
		};

		var last = list;

		public func add(value : Any) {
			let next : List = {value = value; var next = null};
			last.next := ?next;
			last := next;
		};
	};

	public class Bench() {
		var _name = "";
		var _description = "";
		var _rows = Buffer.Buffer<Text>(0);
		var _cols = Buffer.Buffer<Text>(0);
		var _runner = func(row : Text, col : Text) {};

		// public let heap : BenchHeap = BenchHeap();

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