import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import ExperimentalInternetComputer "mo:base/ExperimentalInternetComputer";
import Prim "mo:prim";
import Bench "mo:bench";

import UserBench "./user-bench"; // file path will be replaced with the *.bench.mo file path

actor class() {
	var benchOpt : ?Bench.Bench = null;

	public func init() : async Bench.BenchSchema {
		let bench = UserBench.init();
		benchOpt := ?bench;
		bench.getSchema();
	};

	public query func getSchema() : async Bench.BenchSchema {
		let ?bench = benchOpt else Debug.trap("bench not initialized");
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

	func _diffStats(before : Bench.BenchResult, after : Bench.BenchResult) : Bench.BenchResult {
		{
			instructions = after.instructions - before.instructions;
			rts_heap_size = after.rts_heap_size - before.rts_heap_size;
			rts_memory_size = after.rts_memory_size - before.rts_memory_size;
			rts_total_allocation = after.rts_total_allocation - before.rts_total_allocation;
			rts_mutator_instructions = after.rts_mutator_instructions - before.rts_mutator_instructions;
			rts_collector_instructions = after.rts_collector_instructions - before.rts_collector_instructions;
		}
	};

	func _runCell(rowIndex : Nat, colIndex : Nat) : Bench.BenchResult {
		let ?bench = benchOpt else Debug.trap("bench not initialized");
		let statsBefore = _getStats();

		let instructions = Nat64.toNat(ExperimentalInternetComputer.countInstructions(func() {
			bench.runCell(rowIndex, colIndex);
		}));

		let statsAfter = _getStats();
		_diffStats(statsBefore, { statsAfter with instructions });
	};

	func _runCellAwait(rowIndex : Nat, colIndex : Nat) : async Bench.BenchResult {
		let ?bench = benchOpt else Debug.trap("bench not initialized");
		let statsBefore = _getStats();

		let instructions = Nat64.toNat(ExperimentalInternetComputer.countInstructions(func() {
			bench.runCell(rowIndex, colIndex);
		}));

		await (func() : async () {})();

		let statsAfter = _getStats();
		_diffStats(statsBefore, { statsAfter with instructions });
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

	public func runCellUpdateAwait(rowIndex : Nat, colIndex : Nat) : async Bench.BenchResult {
		await _runCellAwait(rowIndex, colIndex);
	};
};