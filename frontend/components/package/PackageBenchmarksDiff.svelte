<script lang="ts">
	import {Benchmarks, Benchmark} from '/declarations/main/main.did.js';
	import PackageBenchmark from './PackageBenchmark.svelte';
	import ColorizedValue from '../ColorizedValue.svelte';

	export let curBenchmarks : Benchmarks;
	export let prevBenchmarks : Benchmarks;

	let pairs = curBenchmarks.map((cur) => [cur, prevBenchmarks.find((prev) => {
		return prev.file === cur.file;
	})]).filter((pair) => pair[1]);

	function computeDiff(cur : Benchmark, prev : Benchmark, metric : 'instructions' | 'rts_heap_size') : number {
		let curData = cur.metrics.find((m) => m[0] === metric);
		let prevData = prev.metrics.find((m) => m[0] === metric);

		if (curData && prevData) {
			let curSum = curData[1].flat().reduce((a, b) => a + b, 0n);
			let prevSum = prevData[1].flat().reduce((a, b) => a + b, 0n);

			return Number((curSum - prevSum)) / Number(prevSum) * 100;
		}
		else {
			return 0;
		}
	}
</script>

<div class="container">
	{#each pairs as [cur, prev]}
		<details class="bench">
			<summary>
				<div class="bench-name">{cur.name}</div>
				<div class="bench-overall-diff">
					<div>Instructions: <ColorizedValue value={computeDiff(cur, prev, 'instructions')}></ColorizedValue></div>
					<div>Heap: <ColorizedValue value={computeDiff(cur, prev, 'rts_heap_size')}></ColorizedValue></div>
				</div>
			</summary>
			<div class="diff">
				<PackageBenchmark benchmark={cur} otherBenchmark={prev}></PackageBenchmark>
			</div>
		</details>
	{/each}
</div>

<style>
	.container {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	summary {
		cursor: pointer;
	}

	.bench-overall-diff {
		margin-top: 4px;
		margin-left: 16px;
	}

	.diff {
		margin-top: 14px;
		margin-left: 16px;
	}

	.bench-name {
		display: inline-block;
		font-weight: 600;
	}
</style>