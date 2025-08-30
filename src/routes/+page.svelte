<svelte:head>
	<title>Fin's Homepage</title>
</svelte:head>

<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { getCachedWords, cacheWords, getCacheInfo, getCachedTasks, cacheTasks, getTasksCacheInfo, getCachedRandomQuotation, cacheQuotations, getQuotationsCacheInfo, getCachedQuotationCount } from '$lib/cache/words.js';
	
	// Accept any unknown props to avoid SvelteKit warnings
	// Reference $$restProps to handle params and other unknown props
	$: if ($$restProps) { /* handle unknown props like params */ }

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
		try {
			// First try to load from IndexedDB cache
			const cachedWords = await getCachedWords(3);
			
			if (cachedWords.length > 0) {
				console.log('📱 Words loaded from IndexedDB cache:', cachedWords.length, 'words');
				// Show cached data immediately
				wordData = cachedWords;
				
				// Then check if we should refresh from server
				const cacheInfo = await getCacheInfo();
				const cacheAge = cacheInfo.lastCached ? Date.now() - new Date(cacheInfo.lastCached).getTime() : Infinity;
				const shouldRefresh = cacheAge > 24 * 60 * 60 * 1000; // Refresh if cache is older than 1 day
				
				if (shouldRefresh) {
					console.log('🔄 Cache is stale (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), refreshing in background...');
					// Fetch fresh data in background and update cache
					try {
						await getWordFromAPI();
					} catch (bgError) {
						console.log('❌ Background refresh failed:', bgError);
						// Keep showing cached data
					}
				} else {
					console.log('✅ Words cache is fresh (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), no refresh needed');
				}
			} else {
				console.log('💾 No cached words found, fetching from API...');
				// No cache, fetch from API
				await getWordFromAPI();
			}
		} catch (error) {
			console.error('❌ Error loading words:', error);
			// Fall back to API
			await getWordFromAPI();
		}
	}

	async function getWordFromAPI() {
		try {
			console.log('📡 Fetching words directly from Google Sheets API...');
			const response = await fetch('/api/words-direct');
			const apiData = await response.json();
			
			if (apiData.words && apiData.words.length > 0) {
				console.log('✅ Received', apiData.words.length, 'words from Google Sheets, caching to IndexedDB');
				wordData = apiData.words;
				// Cache the data
				await cacheWords(apiData.words);
			} else {
				console.log('⚠️ No words from Google Sheets API');
				wordData = null;
			}
		} catch (error) {
			console.error('❌ Error fetching from Google Sheets API:', error);
			wordData = null;
		}
	}

	async function cacheAllWordsFromAPI() {
		try {
			console.log('📡 Fetching ALL words from Google Sheets API for IndexedDB...');
			const response = await fetch('/api/words-direct?all=true');
			const apiData = await response.json();
			
			if (apiData.words && apiData.words.length > 0) {
				console.log('✅ Received', apiData.words.length, 'words from Google Sheets, caching ALL to IndexedDB');
				await cacheWords(apiData.words);
				console.log('💾 Successfully cached', apiData.words.length, 'words to IndexedDB');
			} else {
				console.log('⚠️ No words available for bulk caching');
			}
		} catch (error) {
			console.error('❌ Error fetching all words for caching:', error);
		}
	}
	async function getQuotation() {
		try {
			// First try to load from IndexedDB cache
			const cachedQuotation = await getCachedRandomQuotation();
			
			if (cachedQuotation) {
				console.log('📱 Quotation loaded from IndexedDB cache');
				// Show cached data immediately
				quotationData = cachedQuotation;
				
				// Check if we should refresh from server
				const cacheInfo = await getQuotationsCacheInfo();
				const cacheAge = cacheInfo.lastCached ? Date.now() - new Date(cacheInfo.lastCached).getTime() : Infinity;
				const shouldRefresh = cacheAge > 24 * 60 * 60 * 1000; // Refresh if cache is older than 1 day
				
				if (shouldRefresh) {
					console.log('🔄 Quotations cache is stale (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), refreshing in background...');
					// Fetch fresh data in background and update cache
					try {
						await getQuotationFromAPI();
					} catch (bgError) {
						console.log('❌ Background quotation refresh failed:', bgError);
						// Keep showing cached data
					}
				} else {
					console.log('✅ Quotations cache is fresh (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), no refresh needed');
				}
			} else {
				console.log('💾 No cached quotations found, fetching from API...');
				// No cache, fetch from API
				await getQuotationFromAPI();
			}
		} catch (error) {
			console.error('❌ Error loading quotation:', error);
			// Fall back to API
			await getQuotationFromAPI();
		}
	}

	async function getQuotationFromAPI() {
		try {
			console.log('📡 Fetching quotation directly from Google Sheets API...');
			const response = await fetch('/api/quotations-direct');
			const apiData = await response.json();
			
			if (apiData.quotation) {
				console.log('✅ Received quotation from Google Sheets');
				quotationData = {
					quotation: apiData.quotation,
					who: apiData.who,
					source: apiData.source
				};
			} else {
				console.log('⚠️ No quotation from Google Sheets API');
				quotationData = null;
			}
		} catch (error) {
			console.error('❌ Error fetching quotation from Google Sheets API:', error);
			quotationData = null;
		}
	}

	async function cacheAllQuotationsFromAPI() {
		try {
			console.log('📡 Fetching ALL quotations from Google Sheets API for IndexedDB...');
			const response = await fetch('/api/quotations-direct?all=true');
			const apiData = await response.json();
			
			if (apiData.quotations && apiData.quotations.length > 0) {
				console.log('✅ Received', apiData.quotations.length, 'quotations from Google Sheets, caching ALL to IndexedDB');
				await cacheQuotations(apiData.quotations);
				console.log('💾 Successfully cached', apiData.quotations.length, 'quotations to IndexedDB');
			} else {
				console.log('⚠️ No quotations available for bulk caching');
			}
		} catch (error) {
			console.error('❌ Error fetching all quotations for caching:', error);
		}
	}
	async function getTasks(forceRefresh = false) {
		if (forceRefresh) {
			isRefreshingTasks = true;
			taskRefreshMessage = null;
			console.log('🔄 Force refreshing tasks from Todoist API...');
			await getTasksFromAPI(true);
			return;
		}

		try {
			// First try to load from IndexedDB cache
			const cachedTasks = await getCachedTasks();
			
			if (cachedTasks.length > 0) {
				console.log('📱 Tasks loaded from IndexedDB cache:', cachedTasks.length, 'tasks');
				// Show cached data immediately
				splitAndDisplayTasks(cachedTasks);
				
				// Check if we should refresh from server
				const cacheInfo = await getTasksCacheInfo();
				const cacheAge = cacheInfo.lastCached ? Date.now() - new Date(cacheInfo.lastCached).getTime() : Infinity;
				const shouldRefresh = cacheAge > 24 * 60 * 60 * 1000; // Refresh if cache is older than 1 day
				
				if (shouldRefresh) {
					console.log('🔄 Tasks cache is stale (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), refreshing in background...');
					// Fetch fresh data in background and update cache
					try {
						await getTasksFromAPI(false);
					} catch (bgError) {
						console.log('❌ Background tasks refresh failed:', bgError);
						// Keep showing cached data
					}
				} else {
					console.log('✅ Tasks cache is fresh (age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours), no refresh needed');
				}
			} else {
				console.log('💾 No cached tasks found, fetching from API...');
				// No cache, fetch from API
				await getTasksFromAPI(false);
			}
		} catch (error) {
			console.error('❌ Error loading tasks:', error);
			// Fall back to API
			await getTasksFromAPI(false);
		}
	}

	async function getTasksFromAPI(fetchAll = false) {
		try {
			if (fetchAll) {
				console.log('📡 Fetching ALL tasks from Todoist API...');
				const response = await fetch('/api/tasks-direct?all=true');
				const apiData = await response.json();
				
				if (apiData.tasks && apiData.tasks.length > 0) {
					console.log('✅ Received', apiData.tasks.length, 'tasks from Todoist, caching to IndexedDB');
					await cacheTasks(apiData.tasks);
					// Filter for display
					splitAndDisplayTasks(apiData.tasks);
					
					taskRefreshMessage = `Refreshed ${apiData.meta.totalCount} tasks successfully`;
				} else {
					taskRefreshMessage = `Refresh failed: No tasks received`;
				}
			} else {
				console.log('📡 Fetching filtered tasks from Todoist API...');
				const response = await fetch('/api/tasks-direct');
				const apiData = await response.json();
				
				if (apiData.tasks) {
					console.log('✅ Received', apiData.tasks.length, 'filtered tasks from Todoist, caching to IndexedDB');
					await cacheTasks(apiData.tasks);
					splitAndDisplayTasks(apiData.tasks);
				} else {
					console.log('⚠️ No tasks from Todoist API');
				}
			}
		} catch (error) {
			console.error('❌ Error fetching tasks from Todoist API:', error);
			if (fetchAll) {
				taskRefreshMessage = `Refresh failed: ${error.message}`;
			}
		} finally {
			if (fetchAll) {
				isRefreshingTasks = false;
			}
		}
	}

	async function cacheAllTasksFromAPI() {
		try {
			console.log('📡 Fetching ALL tasks from Todoist API for IndexedDB...');
			const response = await fetch('/api/tasks-direct?all=true');
			const apiData = await response.json();
			
			if (apiData.tasks && apiData.tasks.length > 0) {
				console.log('✅ Received', apiData.tasks.length, 'tasks from Todoist, caching ALL to IndexedDB');
				await cacheTasks(apiData.tasks);
				console.log('💾 Successfully cached', apiData.tasks.length, 'tasks to IndexedDB');
				return apiData.meta.totalCount;
			} else {
				console.log('⚠️ No tasks available for bulk caching');
				return 0;
			}
		} catch (error) {
			console.error('❌ Error fetching all tasks for caching:', error);
			throw error;
		}
	}

	function splitAndDisplayTasks(tasks) {
		// Split tasks into today and overdue
		const today = new Date().toISOString().split('T')[0];
		tasksData = {
			today: tasks.filter(task => task.due && task.due.date === today),
			overdue: tasks.filter(task => task.due && task.due.date < today)
		};
	}

	async function syncTasks() {
		isRefreshingTasks = true;
		taskRefreshMessage = null;
		try {
			console.log('🔄 Syncing tasks directly from Todoist API...');
			
			// Fetch ALL tasks directly from Todoist and cache them
			const totalCount = await cacheAllTasksFromAPI();
			
			// Now get tasks from the freshly populated cache to display
			console.log('🎲 Getting tasks from freshly synced cache for display...');
			const cachedTasks = await getCachedTasks();
			if (cachedTasks.length > 0) {
				console.log('✅ Displaying', cachedTasks.length, 'tasks from synced cache');
				splitAndDisplayTasks(cachedTasks);
				taskRefreshMessage = `Successfully synced ${totalCount} tasks from Todoist`;
			} else {
				taskRefreshMessage = `Sync completed but no tasks available for display`;
			}
			
		} catch (error) {
			console.error('❌ Sync tasks failed:', error);
			taskRefreshMessage = `Sync failed: ${error.message}`;
		} finally {
			isRefreshingTasks = false;
		}
	}
	
	async function syncQuotations() {
		isSyncingQuotations = true;
		syncMessage = null;
		try {
			console.log('🔄 Syncing quotations directly from Google Sheets API...');
			
			// Fetch ALL quotations directly from Google Sheets and cache them
			await cacheAllQuotationsFromAPI();
			
			// Now get a quotation from the freshly populated cache to display
			console.log('🎲 Getting quotation from freshly synced cache for display...');
			const cachedQuotation = await getCachedRandomQuotation();
			if (cachedQuotation) {
				console.log('✅ Displaying quotation from synced cache');
				quotationData = cachedQuotation;
				// Get the actual total count from cache for the success message
				const totalCachedCount = await getCachedQuotationCount();
				syncMessage = `Successfully synced ${totalCachedCount} quotations from Google Sheets`;
			} else {
				syncMessage = `Sync completed but no quotations available for display`;
			}
			
		} catch (error) {
			console.error('❌ Sync quotations failed:', error);
			syncMessage = `Sync failed: ${error.message}`;
		} finally {
			isSyncingQuotations = false;
		}
	}

	async function syncWords() {
		isSyncingWords = true;
		wordSyncMessage = null;
		try {
			console.log('🔄 Syncing words directly from Google Sheets API...');
			
			// Fetch ALL words directly from Google Sheets and cache them
			await cacheAllWordsFromAPI();
			
			// Now get some words from the freshly populated cache to display
			console.log('🎲 Getting words from freshly synced cache for display...');
			const cachedWords = await getCachedWords(3);
			if (cachedWords.length > 0) {
				console.log('✅ Displaying', cachedWords.length, 'words from synced cache');
				wordData = cachedWords;
				wordSyncMessage = `Successfully synced ${cachedWords.length} words from Google Sheets`;
			} else {
				wordSyncMessage = `Sync completed but no words available for display`;
			}
			
		} catch (error) {
			console.error('❌ Sync words failed:', error);
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
				<span class="text-sm {syncMessage.includes('successfully') || syncMessage.includes('Successfully') ? 'text-flexoki-gr' : 'text-flexoki-re'}">{syncMessage}</span>
			</div>
		{/if}
		
		<div class="flex gap-2">
			<button
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
				on:click={async () => {
					// Get different random quotation from cache
					console.log('🎲 Getting new random quotation from IndexedDB cache...');
					const newQuotation = await getCachedRandomQuotation();
					if (newQuotation) {
						console.log('✅ Got new random quotation from cache');
						quotationData = newQuotation;
					} else {
						console.log('💾 No cached quotations, fetching from API...');
						await getQuotationFromAPI();
					}
				}}>Get new quotation</button
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
				<span class="text-sm {taskRefreshMessage.includes('Refresh failed') || taskRefreshMessage.includes('Sync failed') ? 'text-flexoki-re' : 'text-flexoki-gr'}">{taskRefreshMessage}</span>
			</div>
		{/if}
		
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isRefreshingTasks ? 'opacity-50' : ''}"
			on:click={syncTasks}
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
				on:click={async () => {
					// Get different random words from cache
					console.log('🎲 Getting new random words from IndexedDB cache...');
					const newWords = await getCachedWords(3);
					if (newWords.length > 0) {
						console.log('✅ Got', newWords.length, 'new random words from cache');
						wordData = newWords;
					} else {
						console.log('💾 No cached words, fetching from API...');
						await getWordFromAPI();
					}
				}}>Get new words</button
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
