<script lang="ts">
	import {link} from 'svelte-spa-history-router';
	import {filesize} from 'filesize';
	import {PackageDetails} from '/declarations/main/main.did.js';
	import DownloadTrend from '../DownloadTrend.svelte';
	import githubImg from '/img/github.svg';
	import twitterImg from '/img/twitter.svg';

	export let packageDetails: PackageDetails;
</script>

<div class="right-panel">
	<div class="downloads">
		<div class="detail">
			<div class="label">Downloads</div>
			<div class="value">{packageDetails.downloadsTotal}</div>
		</div>
		<DownloadTrend snapshots={packageDetails.downloadTrend}></DownloadTrend>
	</div>
	{#if packageDetails.config.repository}
		<div class="detail">
			<div class="label">Repository</div>
			<a class="value with-icon" href="{packageDetails.config.repository}" target="_blank">
				<img class="github-icon" src="{githubImg}" alt="GitHub logo" loading="lazy" />
				{packageDetails.config.repository.replace(/https?:\/\/(www\.)?(github\.com\/)?/, '')}
			</a>
		</div>
	{/if}
	{#if packageDetails.config.license}
		<div class="detail">
			<div class="label">License</div>
			<a class="value" href="https://spdx.org/licenses/{packageDetails.config.license}.html" target="_blank">{packageDetails.config.license}</a>
		</div>
	{/if}
	{#if packageDetails.fileStats.sourceSize}
		<div class="detail-row">
			<div class="detail">
				<div class="label">Size</div>
				{filesize(Number(packageDetails.fileStats.sourceSize), {standard: 'iec', round: 1})}
			</div>
			<div class="detail">
				<div class="label">Files</div>
				{packageDetails.fileStats.sourceFiles}
			</div>
		</div>
	{/if}
	{#if packageDetails.ownerInfo.name}
		<div class="detail">
			<div class="label">Owner</div>
			<div class="value owner">
				<a class="value" href="/search/owner:{packageDetails.ownerInfo.name}" use:link>
					@{packageDetails.ownerInfo.name}
				</a>
				<small>{packageDetails.ownerInfo.id}</small>
			</div>
			{#if packageDetails.ownerInfo.github}
				<a class="value with-icon" href="https://github.com/{packageDetails.ownerInfo.github}" target="_blank">
					<img class="github-icon" src="{githubImg}" alt="GitHub logo" loading="lazy" />
					{packageDetails.ownerInfo.github}
				</a>
			{/if}
			{#if packageDetails.ownerInfo.twitter}
				<a class="value with-icon" href="https://twitter.com/{packageDetails.ownerInfo.twitter}" target="_blank">
					<img class="twitter-icon" src="{twitterImg}" alt="Twitter logo" loading="lazy" />
					{packageDetails.ownerInfo.twitter}
				</a>
			{/if}
		</div>
	{:else if packageDetails.owner}
		<div class="detail">
			<div class="label">Owner</div>
			<div class="value">{packageDetails.owner}</div>
		</div>
	{/if}
</div>

<style>
	.right-panel {
		width: 240px;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.downloads {
		display: flex;
		align-items: flex-end;
		gap: 5px;
		justify-content: space-between;
	}

	.detail-row {
		display: flex;
		gap: 50px;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.label {
		font-weight: bold;
		color: #303030;
	}

	.value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.value.owner {
		margin-bottom: 7px;
	}

	.value.with-icon {
		display: flex;
		align-items: center;
		line-height: 1;
		gap: 5px;
		white-space: normal;
	}

	.github-icon,
	.twitter-icon {
		width: 20px;
		height: 20px;
		filter: hue-rotate(45deg) contrast(0.6);
	}

	@media (max-width: 750px) {
		.right-panel {
			margin-left: 20px;
			margin-bottom: 20px;
		}
	}
</style>