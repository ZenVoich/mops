<script lang="ts">
	import {Bar} from 'svelte-chartjs';
	import {Chart as ChartJS, BarElement, LinearScale, CategoryScale, TimeScale} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import {DownloadsSnapshot} from '/declarations/main/main.did.js';

	ChartJS.register([BarElement, LinearScale, CategoryScale, TimeScale]);

	export let snapshots : DownloadsSnapshot[] = [];
</script>

<div class="download-trend">
	{#if snapshots.length}
		<Bar
			width={100}
			height={30}
			data={{
				datasets: [{
					// @ts-ignore
					data: snapshots.map((snapshot) => {
						return {
							x: new Date(Number(snapshot.startTime / 1_000_000n)),
							y: Number(snapshot.downloads),
						};
					}),
					backgroundColor: window.getComputedStyle(document.body).getPropertyValue('--color-primary-light'),
					borderWidth: 0,
					barPercentage: 1,
					barThickness: 4,
					minBarLength: 0,
				}]
			}}
			options={{
				animation: false,
				events: [],
				layout: {
					padding: 0
				},
				scales: {
					x: {
						display: false,
						type: 'time',
						time: {
							unit: 'day'
						},
						min: Number(snapshots.at(-1).startTime / 1_000_000n) - 1000 * 60 * 60 * 24 * 13,
					},
					y: {
						beginAtZero: true,
						display: false,
					}
				},
				plugins: {
					legend: {
						display: false
					},
				},
			}}
		></Bar>
	{/if}
</div>

<style>
	.download-trend {
		border-bottom: 1px solid var(--color-primary-light);
	}
</style>