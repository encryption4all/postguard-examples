<script lang="ts">
	let { children } = $props();
</script>

<nav>
	<a href="/" class="brand">PostGuard for Business</a>
	<div class="nav-links">
		<a href="/send">Send</a>
		<a href="/download">Download</a>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		color: #333;
		background: #fafafa;
	}
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: #fff;
		border-bottom: 1px solid #eee;
	}
	.brand {
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		color: #333;
	}
	.nav-links {
		display: flex;
		gap: 1.5rem;
	}
	.nav-links a {
		text-decoration: none;
		color: #555;
		font-size: 0.95rem;
	}
	.nav-links a:hover {
		color: #111;
	}
	main {
		max-width: 640px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
</style>
