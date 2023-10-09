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

	// public composite query func noop() : async () {};

	public func runCell(rowIndex : Nat, colIndex : Nat) : async Bench.BenchResult {
		let ?bench = benchOpt else Debug.trap("bench not initialized");

		let rts_heap_size_before = Prim.rts_heap_size();
		let rts_memory_size_before = Prim.rts_memory_size();
		let rts_total_allocation_before = Prim.rts_total_allocation();
		let rts_mutator_instructions_before = Prim.rts_mutator_instructions();
		let rts_collector_instructions_before = Prim.rts_collector_instructions();

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

		// await noop();

		// await (func() : async () {})();

		{
			instructions = Nat64.toNat(instructions);
			rts_heap_size = Prim.rts_heap_size() - rts_heap_size_before;
			rts_memory_size = Prim.rts_memory_size() - rts_memory_size_before;
			rts_total_allocation = Prim.rts_total_allocation() - rts_total_allocation_before;
			rts_mutator_instructions = Prim.rts_mutator_instructions() - rts_mutator_instructions_before;
			rts_collector_instructions = Prim.rts_collector_instructions() - rts_collector_instructions_before;
		}
	};
};