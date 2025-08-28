<svelte:head>
	<title>Fin's Homepage</title>
</svelte:head>

<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let wordData = null;
	let quotationData = null;
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
	let isSyncingQuotations = false;
	let isSyncingWords = false;
	let isRefreshingTasks = false;
	let syncMessage = null;
	let wordSyncMessage = null;
	let taskRefreshMessage = null;

	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
	async function getQuotation() {
		const response = await fetch('/api/quotation');
		quotationData = await response.json();
	}
	async function getTasks(forceRefresh = false) {
		if (forceRefresh) {
			isRefreshingTasks = true;
			taskRefreshMessage = null;
		}
		
		try {
			const url = forceRefresh ? '/api/tasks?refresh=true' : '/api/tasks';
			const response = await fetch(url);
			const data = await response.json();
			
			if (data.success) {
				// Split tasks into today and overdue
				const today = new Date().toISOString().split('T')[0];
				tasksData = {
					today: data.tasks.filter(task => task.due && task.due.date === today),
					overdue: data.tasks.filter(task => task.due && task.due.date < today)
				};
				
				if (forceRefresh) {
					const totalTasks = data.tasks.length;
					taskRefreshMessage = `Refreshed ${totalTasks} tasks successfully`;
				}
			} else {
				if (forceRefresh) {
					taskRefreshMessage = `Refresh failed: ${data.error}`;
				}
			}
		} catch (error) {
			if (forceRefresh) {
				taskRefreshMessage = `Refresh failed: ${error.message}`;
			}
		} finally {
			if (forceRefresh) {
				isRefreshingTasks = false;
			}
		}
	}
	
	async function syncQuotations() {
		isSyncingQuotations = true;
		syncMessage = null;
		try {
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ table: 'quotations' }),
			});
			
			const result = await response.json();
			
			if (result.success) {
				const { synced, inserted, updated } = result;
				if (inserted && updated) {
					syncMessage = `Synced ${synced} quotations (${inserted} new, ${updated} updated)`;
				} else {
					syncMessage = `Synced ${synced} quotations successfully`;
				}
				// Optionally refresh the current quotation
				await getQuotation();
			} else {
				syncMessage = `Sync failed: ${result.error}`;
			}
		} catch (error) {
			syncMessage = `Sync failed: ${error.message}`;
		} finally {
			isSyncingQuotations = false;
		}
	}

	async function syncWords() {
		isSyncingWords = true;
		wordSyncMessage = null;
		try {
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ table: 'words' }),
			});
			
			const result = await response.json();
			
			if (result.success) {
				const { synced, inserted, updated } = result;
				if (inserted && updated) {
					wordSyncMessage = `Synced ${synced} words (${inserted} new, ${updated} updated)`;
				} else {
					wordSyncMessage = `Synced ${synced} words successfully`;
				}
				// Optionally refresh the current word
				await getWord();
			} else {
				wordSyncMessage = `Sync failed: ${result.error}`;
			}
		} catch (error) {
			wordSyncMessage = `Sync failed: ${error.message}`;
		} finally {
			isSyncingWords = false;
		}
	}

	// Function to convert markdown links to HTML
	function parseMarkdownLinks(text) {
		return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-flexoki-tx-2 underline hover:text-flexoki-black">$1</a>');
	}

	// Load initial data when page mounts
	onMount(async () => {
		// Load a quotation, word, and tasks on page load
		await getQuotation();
		await getWord();
		await getTasks(); // This will load from cache if available
	});
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
		{:else}
			<div class="flex flex-col">
				<p class="text-lg mb-8 leading-relaxed max-w-2xl text-left text-flexoki-tx-2">Loading quotation...</p>
			</div>
		{/if}
		<hr class="my-6 border-flexoki-ui" />
		
		{#if syncMessage}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span class="text-sm {syncMessage.includes('successfully') ? 'text-flexoki-gr' : 'text-flexoki-re'}">{syncMessage}</span>
			</div>
		{/if}
		
		<div class="flex gap-2">
			<button
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
				on:click={getQuotation}>Get new quotation</button
			>
			<button
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isSyncingQuotations ? 'opacity-50' : ''}"
				on:click={syncQuotations}
				disabled={isSyncingQuotations}
			>
				{isSyncingQuotations ? 'Syncing...' : 'Sync quotations'}
			</button>
		</div>
	</div>
</span>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		<!-- Today's Tasks Section -->
		{#if tasksData && tasksData.today && tasksData.today.length > 0}
			<h3 class="text-lg font-medium mb-4">Today's tasks</h3>
			<div class="space-y-2 mb-6">
				{#each tasksData.today as task}
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4 ? 'bg-flexoki-re' : task.priority === 3 ? 'bg-flexoki-or' : ''}"></span>
						<div class="flex flex-col">
							<span class="text-flexoki-tx-2">{@html parseMarkdownLinks(task.content)}</span>
							<div class="text-xs text-flexoki-tx-3 flex gap-1 items-center">
								{#if task.due}
									<span>Due: {task.due.string}</span>
								{/if}
								{#if task.due && task.url}
									<span>/</span>
								{/if}
								{#if task.url}
									<a href={task.url} target="_blank" class="underline hover:text-flexoki-tx-2">Link</a>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Overdue Tasks Section -->
		{#if tasksData && tasksData.overdue && tasksData.overdue.length > 0}
			<h3 class="text-lg font-medium mb-4">Overdue tasks</h3>
			<div class="space-y-2 mb-6">
				{#each tasksData.overdue as task}
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4 ? 'bg-flexoki-re' : task.priority === 3 ? 'bg-flexoki-or' : ''}"></span>
						<div class="flex flex-col">
							<span class="text-flexoki-tx-2">{@html parseMarkdownLinks(task.content)}</span>
							<div class="text-xs text-flexoki-tx-3 flex gap-1 items-center">
								{#if task.due}
									<span>Due: {task.due.string}</span>
								{/if}
								{#if task.due && task.url}
									<span>•</span>
								{/if}
								{#if task.url}
									<a href={task.url} target="_blank" class="underline hover:text-flexoki-tx-2">Link</a>
								{/if}
							</div>
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
		
		{#if taskRefreshMessage}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span class="text-sm {taskRefreshMessage.includes('Refresh failed') ? 'text-flexoki-re' : 'text-flexoki-gr'}">{taskRefreshMessage}</span>
			</div>
		{/if}
		
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isRefreshingTasks ? 'opacity-50' : ''}"
			on:click={() => getTasks(true)}
			disabled={isRefreshingTasks}
		>
			{isRefreshingTasks ? 'Syncing...' : 'Sync tasks'}
		</button>
	</div>
</span>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		{#if wordData}
			<div class="mb-4">
				{#if Array.isArray(wordData)}
					<ul class="list-disc list-inside space-y-1">
						{#each wordData as word}
							<li class="text-flexoki-tx-2"><b>{word.word}</b>: {word.definition}</li>
						{/each}
					</ul>
				{:else}
					<p class="text-flexoki-tx-2"><b>{wordData.word}</b>: {wordData.definition}</p>
				{/if}
			</div>
		{/if}
		
		<hr class="my-6 border-flexoki-ui" />
		
		{#if wordSyncMessage}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span class="text-sm {wordSyncMessage.includes('Sync failed') ? 'text-flexoki-re' : 'text-flexoki-gr'}">{wordSyncMessage}</span>
			</div>
		{/if}
		
		<div class="flex gap-2">
			<button
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
				on:click={getWord}>Get new words</button
			>
			<button
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isSyncingWords ? 'opacity-50' : ''}"
				on:click={syncWords}
				disabled={isSyncingWords}
			>
				{isSyncingWords ? 'Syncing...' : 'Sync words'}
			</button>
		</div>
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
						
						// Clear sync message and suggest syncing
						syncMessage = 'Quotation added to Google Sheets. Click "Sync quotations" to see it locally.';
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
