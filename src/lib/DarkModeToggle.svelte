<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export const darkMode = writable(false);
	let isDark = false;

	onMount(() => {
		const stored = localStorage.getItem('darkMode');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		isDark = stored === 'true' || (stored === null && prefersDark);
		darkMode.set(isDark);
		updateTheme();
	});

	function toggleDarkMode() {
		isDark = !isDark;
		darkMode.set(isDark);
		localStorage.setItem('darkMode', isDark.toString());
		updateTheme();
	}

	function updateTheme() {
		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<button
	on:click={toggleDarkMode}
	class="cursor-pointer underline decoration-dotted"
	style="color: var(--black)"
	aria-label="Toggle dark mode"
>
	{isDark ? 'light' : 'dark'}
</button>