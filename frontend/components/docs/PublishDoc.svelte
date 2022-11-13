<script>
	import Header from '../Header.svelte';
	import Footer from "../Footer.svelte";
</script>

<svelte:head>
	<title>MOPS &nbsp;&bull;&nbsp; Publish</title>
</svelte:head>

<Header></Header>

<div class="documentation">
	<div class="content">
		<h1>How to publish packages</h1>

		<h2>Requirements</h2>
		<ul>
			<li><a href="https://nodejs.org/" target="_blank">Node.js</a></li>
			<li><a href="https://internetcomputer.org/docs/current/developer-docs/quickstart/local-quickstart" target="_blank">DFX</a> >= 0.10.0</li>
		</ul>

		<h3>1. Install CLI tool</h3>
		<code>npm i -g ic-mops</code>
		<br>
		<div>This command will install cli tool <code class="inline">mops</code></div>

		<h3>2. Import Identity</h3>
		<div>Create new identity to publish packages</div>
		<br>
		<code>dfx identity new mops</code>

		<br>
		<div>Import identity into the mops</div>
		<br>
		<code>mops import-identity -- "$(dfx identity export mops)"</code>

		<h3>3. Initialize</h3>
		<div>Run this command in your package root</div>
		<br>
		<code>mops init &lt;your_package_name&gt;</code>

		<br>
		<div>Edit <code class="inline">description</code> and <code class="inline">repository</code> fields in <code class="inline">mops.toml</code> file.</div>
		<br>

		<div>Write your package code in <code class="inline">*.mo</code> source files in the <code class="inline">src/</code> directory.</div>
		<br>
		<div>Create <code class="inline">README.md</code> file with information on how to use your package.</div>

		<h3>4. Publish</h3>
		<div>Publish package to the mops registry!</div>
		<br>
		<code>mops publish</code>
	</div>
</div>

<Footer />

<style>
	@import "./docs.css";
</style>