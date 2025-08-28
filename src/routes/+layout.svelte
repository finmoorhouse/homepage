<script>
	import '../app.css';
	import DarkModeToggle from '$lib/DarkModeToggle.svelte';
</script>

<div class="min-h-screen">
	<div class="fixed bottom-4 left-4 z-10">
		<DarkModeToggle />
	</div>
	<slot />
</div>
