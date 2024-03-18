<script lang="ts">
	import {Benchmark} from '/declarations/main/main.did.js';
	import ColorizedValue from '../ColorizedValue.svelte';

	export let benchmark : Benchmark;
	export let otherBenchmark : Benchmark | undefined = undefined;

	function getMetricNum(bench : Benchmark, row : string, col : string, metric : string) : number | undefined {
		let metricData = bench.metrics.find((m) => m[0] === metric);
		let rowIndex = bench.rows.indexOf(row);
		let colIndex = bench.cols.indexOf(col);

		return Number(metricData?.[1]?.[rowIndex]?.[colIndex]);
	}

	function getMetric(bench : Benchmark, row : string, col : string, metric : string) {
		let value = getMetricNum(bench, row, col, metric);

		if (value !== undefined) {
			return value.toLocaleString('en-US').replaceAll(',', '_') ?? '-';
		}
		else {
			return '-';
		}
	}

	function getMetricDiff(row : string, col : string, metric : string) : number {
		let curValue = getMetricNum(benchmark, row, col, metric);
		let prevValue = getMetricNum(otherBenchmark, row, col, metric);

		if (curValue && prevValue) {
			return (curValue - prevValue) / prevValue * 100;
		}
		else {
			return 0;
		}
	}
</script>

<div class="test-stats">
	<div>
		{#if !otherBenchmark}
			<h2>{benchmark.name}</h2>
			<div>{benchmark.description}</div>
			<br>
		{/if}

		<b>Instructions</b>
		<table>
			<thead>
				<tr>
					<th></th>
					{#each benchmark.cols as col}
						<th>{col}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each benchmark.rows as row}
					<tr>
						<td>{row}</td>
						{#each benchmark.cols as col}
							<td>
								{#if otherBenchmark}
									<ColorizedValue value={getMetricDiff(row, col, 'instructions')}></ColorizedValue>
								{:else}
									{getMetric(benchmark, row, col, 'instructions')}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>

		<b>Heap</b>
		<table>
			<thead>
				<tr>
					<th></th>
					{#each benchmark.cols as col}
						<th>{col}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each benchmark.rows as row}
					<tr>
						<td>{row}</td>
						{#each benchmark.cols as col}
							<td>
								{#if otherBenchmark}
									<ColorizedValue value={getMetricDiff(row, col, 'rts_heap_size')}></ColorizedValue>
								{:else}
									{getMetric(benchmark, row, col, 'rts_heap_size')}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	table {
		margin-top: 6px;
	}
</style>