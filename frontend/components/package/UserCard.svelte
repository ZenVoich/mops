<script lang="ts">
	import {link} from 'svelte-spa-history-router';
	import githubImg from '/img/github.svg';
	import twitterImg from '/img/twitter.svg';
	import {User} from '/declarations/main/main.did';

	export let user : User;
</script>

<div class="user-card">
	<div class="value user">
		{#if user.name}
			<a class="value" href="/search/owner:{user.name}" use:link>@{user.name}</a> <small>{user.id}</small>
		{:else}
			<a class="value" href="/search/owner:{user.id}" use:link>{user.id}</a>
		{/if}
	</div>
	{#if user.github}
		<a class="value with-icon" href="https://github.com/{user.github}" target="_blank">
			<img class="github-icon" src="{githubImg}" alt="GitHub logo" loading="lazy" />
			{user.github}
		</a>
	{/if}
	{#if user.twitter}
		<a class="value with-icon" href="https://twitter.com/{user.twitter}" target="_blank">
			<img class="twitter-icon" src="{twitterImg}" alt="Twitter logo" loading="lazy" />
			{user.twitter}
		</a>
	{/if}
</div>

<style>
	.value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.github-icon,
	.twitter-icon {
		width: 20px;
		height: 20px;
		filter: hue-rotate(45deg) contrast(0.6);
	}

	.user-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 0;
		padding-left: 7px;
		border-left: 2px solid #d5d9d08c;
	}
</style>