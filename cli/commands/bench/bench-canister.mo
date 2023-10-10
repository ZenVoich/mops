import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import ExperimentalInternetComputer "mo:base/ExperimentalInternetComputer";
import Prim "mo:prim";
import Bench "mo:bench";

import UserBench "./user-bench";

actor class() {
	var benchOpt : ?Bench.Bench = null;

	public func init() : async Bench.BenchSchema {
		let bench = UserBench.init();
		benchOpt := ?bench;
		bench.getSchema();
	};

	func _getStats() : Bench.BenchResult {
		{
			instructions = 0;
			rts_heap_size = Prim.rts_heap_size();
			rts_memory_size = Prim.rts_memory_size();
			rts_total_allocation = Prim.rts_total_allocation();
			rts_mutator_instructions = Prim.rts_mutator_instructions();
			rts_collector_instructions = Prim.rts_collector_instructions();
		}
	};

	func _runCell(rowIndex : Nat, colIndex : Nat) : Bench.BenchResult {
		let ?bench = benchOpt else Debug.trap("bench not initialized");
		let statsBefore = _getStats();

		let mode : Bench.BenchMode = #replica;
		let instructions = switch(mode) {
			case (#replica) {
				ExperimentalInternetComputer.countInstructions(func() {
					bench.runCell(rowIndex, colIndex);
				});
			};
			case (#wasi) {
				bench.runCell(rowIndex, colIndex);
				0 : Nat64;
			};
		};

		// await (func() : async () {})();

		let statsAfter = _getStats();

		{
			instructions = Nat64.toNat(instructions);
			rts_heap_size = statsAfter.rts_heap_size - statsBefore.rts_heap_size;
			rts_memory_size = statsAfter.rts_memory_size - statsBefore.rts_memory_size;
			rts_total_allocation = statsAfter.rts_total_allocation - statsBefore.rts_total_allocation;
			rts_mutator_instructions = statsAfter.rts_mutator_instructions - statsBefore.rts_mutator_instructions;
			rts_collector_instructions = statsAfter.rts_collector_instructions - statsBefore.rts_collector_instructions;
		}
	};

	public query func getStats() : async Bench.BenchResult {
		_getStats();
	};

	public query func runCellQuery(rowIndex : Nat, colIndex : Nat) : async Bench.BenchResult {
		_runCell(rowIndex, colIndex);
	};

	public func runCellUpdate(rowIndex : Nat, colIndex : Nat) : async Bench.BenchResult {
		_runCell(rowIndex, colIndex);
	};
};