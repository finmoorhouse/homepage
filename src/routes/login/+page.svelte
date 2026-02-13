<script>
	import { enhance } from '$app/forms';

	/** @type {{ form: any }} */
	export let form;
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center">
	<div class="p-8 border border-flexoki-ui w-sm">
		<h1 class="text-xl mb-6">Login</h1>

		{#if form?.error}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span class="text-sm text-flexoki-re">{form.error}</span>
			</div>
		{/if}

		<form method="POST" use:enhance class="flex flex-col gap-4">
			<input
				type="password"
				name="password"
				placeholder="Password"
				required
				autofocus
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
			/>
			<button
				type="submit"
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			>
				Login
			</button>
		</form>
	</div>
</div>
