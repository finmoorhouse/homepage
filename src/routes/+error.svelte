<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>404 - Page Not Found</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-flexoki-bg-2">
	<div class="text-center p-8 max-w-md">
		<h1 class="text-6xl font-bold text-flexoki-black mb-4">404</h1>

		<h2 class="text-2xl font-semibold text-flexoki-tx-2 mb-4">Page not found</h2>

		<p class="text-sm text-flexoki-tx-2 mb-6">
			{#if $page.url.pathname}
				You were trying to reach: <code class="bg-flexoki-ui px-2 py-1 rounded text-xs"
					>{$page.url.pathname}</code
				>
			{/if}
		</p>
		<div class="space-y-4">
			<a
				href="/"
				class="inline-block px-6 py-3 bg-flexoki-black text-white rounded-lg hover:bg-flexoki-tx-2 transition-colors"
			>
				Take me home
			</a>
		</div>
	</div>
</div>
