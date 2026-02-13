<script>
	import '../app.css';
	import { page } from '$app/stores';
	import DarkModeToggle from '$lib/DarkModeToggle.svelte';

	// Accept any unknown props to avoid SvelteKit warnings
	// Reference $$restProps to handle params and other unknown props
	$: if ($$restProps) { /* handle unknown props like params */ }

	$: isLoginPage = $page.url.pathname === '/login';
</script>

<div class="min-h-screen">
	<div class="fixed bottom-4 left-4 z-10 flex gap-2 items-center">
		<DarkModeToggle />
		{#if !isLoginPage}
			<a
				href="/logout"
				class="text-xs text-flexoki-tx-3 hover:text-flexoki-tx-2 border border-flexoki-ui px-2 py-1"
			>Logout</a>
		{/if}
	</div>
	<slot />
</div>
