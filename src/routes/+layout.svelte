<script>
	import '../app.css';
	import DarkModeToggle from '$lib/DarkModeToggle.svelte';
</script>

<div class="min-h-screen">
	<div class="fixed top-4 right-4 z-10">
		<DarkModeToggle />
	</div>
	<slot />
</div>
