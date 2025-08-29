<script>
	import '../app.css';
	import DarkModeToggle from '$lib/DarkModeToggle.svelte';
	
	// Accept any unknown props to avoid SvelteKit warnings
	// Reference $$restProps to handle params and other unknown props
	$: if ($$restProps) { /* handle unknown props like params */ }
</script>

<div class="min-h-screen">
	<div class="fixed bottom-4 left-4 z-10">
		<DarkModeToggle />
	</div>
	<slot />
</div>
