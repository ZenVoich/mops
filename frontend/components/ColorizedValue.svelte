<script lang="ts">
	export let value : number;
	let color = value < 0 ? 'green' : value > 0 ? 'red' : 'gray';
	let sign = value > 0 ? '+' : '';

</script>

<span style="color: {color}">{sign}{+value.toFixed(2)}%</span>