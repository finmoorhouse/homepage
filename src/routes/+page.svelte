<svelte:head>
	<title>Fin's Homepage</title>
</svelte:head>

<script>
	import { enhance } from '$app/forms';

	let wordData = null;
	let quotationData = {
		quotation: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
		who: "Alan Kay",
		source: "PARC Meeting",
		url: "https://www.brainyquote.com/quotes/alan_kay_181225"
	};
	let weatherData = null;
	let newWord = '';
	let newQuotation = '';
	let newQuotationSource = '';
	let newQuotationWho = '';
	let newQuotationUrl = '';
	let formError = null;
	let formSuccessMessage = null;
	let formSuccess = false;
	let isSubmitting = false;
	let quotationFormError = null;
	let quotationFormSuccessMessage = null;
	let quotationFormSuccess = false;
	let isQuotationSubmitting = false;
	let tasksData = null;

	async function getWeather() {
		const city = 'Oxford';
		const response = await fetch(`/api/weather?city=${city}`);
		weatherData = await response.json();
	}
	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
	async function getQuotation() {
		const response = await fetch('/api/quotation');
		quotationData = await response.json();
	}
	async function getTasks() {
		const response = await fetch('/api/tasks');
		const data = await response.json();
		if (data.success) {
			// Split tasks into today and overdue
			const today = new Date().toISOString().split('T')[0];
			tasksData = {
				today: data.tasks.filter(task => task.due && task.due.date === today),
				overdue: data.tasks.filter(task => task.due && task.due.date < today)
			};
		}
	}

	// Function to convert markdown links to HTML
	function parseMarkdownLinks(text) {
		return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-flexoki-tx-2 underline hover:text-flexoki-black">$1</a>');
	}
</script>

<div class="m-5 p-2 border-b border-flexoki-ui min-h-[40px]">
	<h1 class="text-2xl m-0 p-0">Fin's Homepage</h1>
</div>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		{#if quotationData}
			<div class="flex flex-col">
				<p class="{quotationData.quotation.length < 200 ? 'text-2xl' : 'text-lg'} mb-8 leading-relaxed max-w-2xl text-left">{quotationData.quotation}</p>
				{#if quotationData.who}
					<p class="text-sm text-flexoki-black-2 font-medium text-right">
						— {quotationData.who}
						{#if quotationData.source}
							{#if quotationData.url}
								, <a href={quotationData.url}>{quotationData.source}</a>
							{:else}
								, {quotationData.source}
							{/if}
						{/if}
					</p>
				{/if}
			</div>
		{/if}
		<hr class="my-6 border-flexoki-ui" />
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getQuotation}>Get new quotation</button
		>
	</div>
</span>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		<!-- Today's Tasks Section -->
		{#if tasksData && tasksData.today && tasksData.today.length > 0}
			<h3 class="text-lg font-medium mb-4">Today's Tasks</h3>
			<div class="space-y-2 mb-6">
				{#each tasksData.today as task}
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4 ? 'bg-flexoki-re' : task.priority === 3 ? 'bg-flexoki-or' : ''}"></span>
						<div class="flex flex-col">
							<span class="text-flexoki-tx-2">{@html parseMarkdownLinks(task.content)}</span>
							{#if task.due}
								<span class="text-xs text-flexoki-tx-3">Due: {task.due.string}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Overdue Tasks Section -->
		{#if tasksData && tasksData.overdue && tasksData.overdue.length > 0}
			<h3 class="text-lg font-medium mb-4">Overdue</h3>
			<div class="space-y-2 mb-6">
				{#each tasksData.overdue as task}
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4 ? 'bg-flexoki-re' : task.priority === 3 ? 'bg-flexoki-or' : ''}"></span>
						<div class="flex flex-col">
							<span class="text-flexoki-tx-2">{@html parseMarkdownLinks(task.content)}</span>
							{#if task.due}
								<span class="text-xs text-flexoki-tx-3">Due: {task.due.string}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- No tasks message -->
		{#if !tasksData || (!tasksData.today?.length && !tasksData.overdue?.length)}
			<h3 class="text-lg font-medium mb-4">Tasks</h3>
			<div class="space-y-2 mb-6">
				<div class="flex items-center gap-2">
					<span class="w-2 h-2 border border-flexoki-ui rounded-full"></span>
					<span class="text-flexoki-tx-2">No tasks loaded</span>
				</div>
			</div>
		{/if}

		<hr class="my-6 border-flexoki-ui" />
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getTasks}>Refresh tasks</button>
	</div>
</span>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] inline-block">
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getWord}>Get words</button
		>
		{#if wordData}
			<ul>
				<li>
					<p><b>{wordData.word}</b>: {wordData.definition}</p>
				</li>
			</ul>
		{/if}
	</div>

	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] inline-block">
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getWeather}>Get weather</button
		>
		{#if weatherData}
			<h3>Weather in {weatherData.name}</h3>
			<p>Temperature: {weatherData.main.temp}°C</p>
			<p>Description: {weatherData.weather[0].description}</p>
		{/if}
	</div>
</span>

<div class="flex justify-center w-full flex-col md:flex-row">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] w-xs">
		<h3>Add a Word</h3>
		<small
			><a class="text-flexoki-tx-2" href="https://docs.google.com/spreadsheets/" target="_blank"
				>Link to spreadsheet</a
			></small
		>

		{#if isSubmitting}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-tx-2 text-sm mt-2">Waiting for response...</span>
			</div>
		{:else if formError}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-re text-sm mt-2">{formError}</span>
			</div>
		{:else if formSuccess}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-gr text-sm mt-2">Word added successfully!</span>
				<span class="text-flexoki-gr text-sm mt-2">
					<i>{formSuccessMessage.word} - {formSuccessMessage.definition}</i>
				</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/addWord"
			class="flex flex-col gap-4"
			use:enhance={() => {
				console.log('Form submission started');
				isSubmitting = true;
				return async ({ result }) => {
					console.log('Form submission completed:', result);
					isSubmitting = false;
					if (result.status === 200) {
						console.log('Setting success state');
						formSuccess = true;
						formSuccessMessage = result?.data || 'No definition given.';
						formError = null;
						newWord = '';
					} else if (result.data?.error) {
						console.log('Setting known error state');
						formError = result.data.error;
						formSuccess = false;
					} else {
						console.log('Setting unknown error state');
						formError = 'An unexpected error occurred';
						formSuccess = false;
					}
				};
			}}
		>
			<label for="word" class="text-md font-medium">Word</label>
			<input
				type="text"
				id="word"
				name="word"
				bind:value={newWord}
				required
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
			/>
			<button
				type="submit"
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			>
				Submit
			</button>
		</form>
	</div>

	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] w-md">
		<h3>Add a Quotation</h3>
		<small
			><a class="text-flexoki-tx-2" href="https://docs.google.com/spreadsheets/" target="_blank"
				>Link to spreadsheet</a
			></small
		>
		{#if isQuotationSubmitting}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-tx-2 text-sm mt-2">Waiting for response...</span>
			</div>
		{:else if quotationFormError}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-re text-sm mt-2">{quotationFormError}</span>
			</div>
		{:else if quotationFormSuccess}
			<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
				<span class="text-flexoki-gr text-sm mt-2">
					Successfully added quotation: “<i
						>{quotationFormSuccessMessage.quotation.split(' ').slice(0, 8).join(' ')}…” — {quotationFormSuccessMessage.who}</i
					>
				</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/addQuotation"
			class="flex flex-col gap-0"
			use:enhance={() => {
				console.log('Quotation form submission started');
				isQuotationSubmitting = true;
				return async ({ result }) => {
					console.log('Quotation form submission completed:', result);
					isQuotationSubmitting = false;
					if (result.status === 200) {
						console.log('Setting quotation success state');
						quotationFormSuccess = true;
						quotationFormSuccessMessage = result?.data || 'No quotation details given.';
						quotationFormError = null;
						newQuotation = '';
						newQuotationWho = '';
						newQuotationUrl = '';
					} else if (result.data?.error) {
						console.log('Setting quotation known error state');
						quotationFormError = result.data.error;
						quotationFormSuccess = false;
					} else {
						console.log('Setting quotation unknown error state');
						quotationFormError = 'An unexpected error occurred';
						quotationFormSuccess = false;
					}
				};
			}}
		>
			<label for="quotation" class="text-md font-medium">Quotation</label>
			<textarea
				id="quotation"
				name="quotation"
				bind:value={newQuotation}
				required
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
				rows="3"
			></textarea>

			<label for="who" class="text-md font-medium"
				>Who <span class="text-flexoki-tx-3">(optional)</span></label
			>
			<input
				type="text"
				id="who"
				name="who"
				bind:value={newQuotationWho}
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
			/>

			<label for="source" class="text-md font-medium"
				>Source <span class="text-flexoki-tx-3">(optional)</span></label
			>
			<input
				type="text"
				id="source"
				name="source"
				bind:value={newQuotationSource}
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
			/>

			<label for="url" class="text-md font-medium my-0"
				>URL <span class="text-flexoki-tx-3">(optional)</span></label
			>
			<input
				type="url"
				id="url"
				name="url"
				bind:value={newQuotationUrl}
				class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
			/>

			<button
				type="submit"
				class="mt-4 px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			>
				Submit
			</button>
		</form>
	</div>
</div>
