<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import {
		getCachedWords,
		cacheWords,
		getCacheInfo,
		getCachedTasks,
		cacheTasks,
		getTasksCacheInfo,
		getCachedRandomQuotation,
		cacheQuotations,
		getQuotationsCacheInfo,
		getCachedQuotationCount,
		getCachedDoneThat,
		cacheDoneThat
	} from '$lib/cache/words.js';

	// Accept any unknown props to avoid SvelteKit warnings
	// Reference $$restProps to handle params and other unknown props
	$: if ($$restProps) {
		/* handle unknown props like params */
	}

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

	// DoneThat time tracking
	let doneThatData = null;
	let isLoadingDoneThat = false;
	let doneThatError = null;
	let doneThatCachedAt = null;
	let doneThatSyncMessage = null;

	async function getWord() {
		try {
			// Try to load from IndexedDB cache first
			const cachedWords = await getCachedWords(3);

			if (cachedWords.length > 0) {
				console.log('📱 Words loaded from IndexedDB cache:', cachedWords.length, 'words');
				wordData = cachedWords;
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
				console.log(
					'✅ Received',
					apiData.words.length,
					'words from Google Sheets, caching to IndexedDB'
				);
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
				console.log(
					'✅ Received',
					apiData.words.length,
					'words from Google Sheets, caching ALL to IndexedDB'
				);
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
			// Try to load from IndexedDB cache first
			const cachedQuotation = await getCachedRandomQuotation();

			if (cachedQuotation) {
				console.log('📱 Quotation loaded from IndexedDB cache');
				quotationData = cachedQuotation;
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
					source: apiData.source,
					url: apiData.url
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
				console.log(
					'✅ Received',
					apiData.quotations.length,
					'quotations from Google Sheets, caching ALL to IndexedDB'
				);
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
			// Try to load from IndexedDB cache first
			const cachedTasks = await getCachedTasks();

			if (cachedTasks.length > 0) {
				console.log('📱 Tasks loaded from IndexedDB cache:', cachedTasks.length, 'tasks');
				splitAndDisplayTasks(cachedTasks);
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
					console.log(
						'✅ Received',
						apiData.tasks.length,
						'tasks from Todoist, caching to IndexedDB'
					);
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
					console.log(
						'✅ Received',
						apiData.tasks.length,
						'filtered tasks from Todoist, caching to IndexedDB'
					);
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
				console.log(
					'✅ Received',
					apiData.tasks.length,
					'tasks from Todoist, caching ALL to IndexedDB'
				);
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
			today: tasks.filter((task) => task.due && task.due.date === today),
			overdue: tasks.filter((task) => task.due && task.due.date < today)
		};
	}

	async function syncTasks() {
		isRefreshingTasks = true;
		taskRefreshMessage = null;
		try {
			console.log('🔄 Syncing today/overdue tasks from Todoist API...');

			// Fetch only today/overdue tasks (uses Todoist filter server-side)
			const response = await fetch('/api/tasks-direct');
			const apiData = await response.json();

			if (apiData.tasks && apiData.tasks.length > 0) {
				console.log('✅ Received', apiData.tasks.length, 'today/overdue tasks from Todoist');
				await cacheTasks(apiData.tasks);
				splitAndDisplayTasks(apiData.tasks);
				taskRefreshMessage = `Synced ${apiData.tasks.length} tasks from Todoist`;
			} else {
				taskRefreshMessage = `No today/overdue tasks found`;
				splitAndDisplayTasks([]);
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

	// ---------------------------------------------------------
	// DoneThat Time Tracking
	// ---------------------------------------------------------

	async function getDoneThatData() {
		try {
			// Try to load from IndexedDB cache first
			const cached = await getCachedDoneThat();

			if (cached) {
				console.log('📱 DoneThat loaded from IndexedDB cache');
				doneThatData = cached.data;
				doneThatCachedAt = cached.cachedAt;
			} else {
				console.log('💾 No cached DoneThat data found, fetching from API...');
				await syncDoneThat();
			}
		} catch (error) {
			console.error('❌ Error loading DoneThat:', error);
			await syncDoneThat();
		}
	}

	async function syncDoneThat() {
		isLoadingDoneThat = true;
		doneThatError = null;
		doneThatSyncMessage = null;
		try {
			console.log('📡 Fetching DoneThat time tracking data...');
			const response = await fetch('/api/donethat?days=7');
			const data = await response.json();

			if (data.error) {
				console.error('DoneThat API error:', data.error);
				doneThatError = data.error;
				doneThatData = null;
				doneThatSyncMessage = `Sync failed: ${data.error}`;
			} else if (data.success && data.rows) {
				console.log('✅ Received DoneThat data:', data.rowCount, 'days');
				doneThatData = data;
				// Cache the data
				await cacheDoneThat(data);
				doneThatCachedAt = new Date().toISOString();
				doneThatSyncMessage = `Synced ${data.rowCount} days from DoneThat`;
			} else {
				doneThatError = 'Unexpected response format';
				doneThatData = null;
			}
		} catch (error) {
			console.error('❌ Error fetching DoneThat data:', error);
			doneThatError = error.message;
			doneThatData = null;
			doneThatSyncMessage = `Sync failed: ${error.message}`;
		} finally {
			isLoadingDoneThat = false;
		}
	}

	// Format minutes as hours and minutes
	function formatDuration(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours === 0) return `${mins}m`;
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	}

	// Format minutes as decimal hours (e.g., 6.25h)
	function formatDecimalHours(minutes) {
		const hours = minutes / 60;
		if (hours < 0.1) return '0h';
		return `${hours.toFixed(2).replace(/\.?0+$/, '')}h`;
	}

	// Get day name from date string (YYYY-MM-DD)
	function getDayName(dateStr) {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-GB', { weekday: 'short' });
	}

	// Get focus minutes from a day's categories
	function getFocusMinutes(day) {
		const focusCat = day.categories?.find(c => c.name === 'Focus work');
		return focusCat?.minutes || 0;
	}

	// Track whether detailed view is expanded
	let doneThatExpanded = false;

	// Tooltip state for DoneThat chart
	let hoveredDay = null;
	let tooltipX = 0;
	let tooltipY = 0;

	function handleDayHover(event, day) {
		hoveredDay = day;
		const rect = event.currentTarget.getBoundingClientRect();
		tooltipX = rect.left;
		tooltipY = rect.top - 10;
	}

	function handleDayLeave() {
		hoveredDay = null;
	}

	// ---------------------------------------------------------
	// Time Visualization Logic
	// ---------------------------------------------------------

	const START_DATE_EPOCH = new Date('2026-01-01T00:00:00').getTime();
	function getOrdinal(n) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}

	// Calculate time passed
	let daysPassedStr = '';
	let currentDayOfYearIndex = 0; // 0-364

	// Sun path visualization
	let currentHourDecimal = 0; // 0-24 with decimal for minutes
	let currentTimeStr = '';
	let sfHourDecimal = 0; // SF is 8 hours behind
	let sfTimeStr = '';
	let delhiHourDecimal = 0; // Delhi is 5.5 hours ahead
	let delhiTimeStr = '';

	function updateTimeVisualization() {
		const now = new Date();
		// Reset to midnight for day calculation to be consistent
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const start = START_DATE_EPOCH;

		const diffTime = today - start;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		// If today is Jan 1, diffDays is 0.
		const dayNumber = diffDays + 1;

		currentDayOfYearIndex = diffDays; // 0-indexed for the grid

		daysPassedStr = `${getOrdinal(dayNumber)} day of the year`;

		// Update current time for sun path (hours as decimal, e.g., 14.5 = 2:30 PM)
		currentHourDecimal = now.getHours() + now.getMinutes() / 60;

		// Format current time string
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		currentTimeStr = `${hours}:${minutes}`;

		// Calculate SF time (8 hours behind)
		sfHourDecimal = (currentHourDecimal - 8 + 24) % 24;
		const sfHours = Math.floor(sfHourDecimal).toString().padStart(2, '0');
		const sfMinutes = Math.floor((sfHourDecimal % 1) * 60).toString().padStart(2, '0');
		sfTimeStr = `${sfHours}:${sfMinutes}`;

		// Calculate Delhi time (5.5 hours ahead)
		delhiHourDecimal = (currentHourDecimal + 5.5) % 24;
		const delhiHours = Math.floor(delhiHourDecimal).toString().padStart(2, '0');
		const delhiMinutes = Math.floor((delhiHourDecimal % 1) * 60).toString().padStart(2, '0');
		delhiTimeStr = `${delhiHours}:${delhiMinutes}`;
	}

	// Calculate sunrise and sunset times for London
	// Using standard solar position algorithms
	const LONDON_LAT = 51.5074; // degrees North
	const LONDON_LON = -0.1278; // degrees West

	function calculateSunTimes(date) {
		const dayOfYear = Math.floor(
			(date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
		);

		// Solar declination angle (in radians)
		const declination =
			(23.45 * Math.PI) / 180 * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear));

		const latRad = (LONDON_LAT * Math.PI) / 180;

		// Hour angle at sunrise/sunset (when sun crosses horizon)
		const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);

		// Clamp for polar day/night (shouldn't happen in London but safety check)
		const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
		const hourAngle = Math.acos(clampedCos);

		// Convert hour angle to hours (15 degrees = 1 hour)
		const hourAngleHours = (hourAngle * 180) / Math.PI / 15;

		// Solar noon occurs at 12:00 + longitude correction + equation of time
		// For simplicity, using approximate solar noon at 12:00 UTC
		// London is close to 0° longitude so this is reasonably accurate
		const solarNoon = 12;

		const sunrise = solarNoon - hourAngleHours;
		const sunset = solarNoon + hourAngleHours;

		return { sunrise, sunset, dayLength: sunset - sunrise };
	}

	// Reactive sun times based on current date
	let sunTimes = calculateSunTimes(new Date());

	// Sun path calculation - smooth sine wave, always the same shape
	// Peaks at noon (hour 12), crosses zero at 6am and 6pm
	function getSunY(hour) {
		return Math.sin(((hour - 6) * Math.PI) / 12);
	}

	// Generate SVG path for the sine wave (vertical orientation)
	// Time flows top to bottom, sun position oscillates left/right
	const SVG_WIDTH = 60;
	const SVG_HEIGHT = 120;
	const CENTER_X = SVG_WIDTH / 2;
	const AMPLITUDE = 20;

	function generateSunPath() {
		const points = [];
		for (let h = 0; h <= 24; h += 0.25) {
			const y = (h / 24) * SVG_HEIGHT;
			const x = CENTER_X + getSunY(h) * AMPLITUDE; // Right = day, left = night
			points.push(`${x},${y}`);
		}
		return `M ${points.join(' L ')}`;
	}

	// The horizon line position shifts based on day length
	// At equinox (sunrise 6am), horizon is at center (x=30)
	// In winter (later sunrise like 8am), horizon moves right (more night)
	// In summer (earlier sunrise like 4am), horizon moves left (more day)
	$: horizonX = CENTER_X + getSunY(sunTimes.sunrise) * AMPLITUDE;

	$: sunPathD = generateSunPath();
	$: currentSunY = (currentHourDecimal / 24) * SVG_HEIGHT;
	$: currentSunX = CENTER_X + getSunY(currentHourDecimal) * AMPLITUDE;
	$: sfSunY = (sfHourDecimal / 24) * SVG_HEIGHT;
	$: sfSunX = CENTER_X + getSunY(sfHourDecimal) * AMPLITUDE;
	$: delhiSunY = (delhiHourDecimal / 24) * SVG_HEIGHT;
	$: delhiSunX = CENTER_X + getSunY(delhiHourDecimal) * AMPLITUDE;

	// Run initially
	updateTimeVisualization();

	// Function to convert markdown links to HTML
	function parseMarkdownLinks(text) {
		return text.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" target="_blank" class="text-flexoki-tx-2 underline hover:text-flexoki-black">$1</a>'
		);
	}

	// Load initial data when page mounts
	onMount(async () => {
		// Load a quotation, word, and tasks on page load
		await getQuotation();
		await getWord();
		await getTasks(); // This will load from cache if available
		await getDoneThatData(); // Load time tracking data
	});
</script>

<svelte:head>
	<title>Fin's Homepage</title>
</svelte:head>

<div class="m-5 p-2 border-b border-flexoki-ui min-h-[40px]">
	<h1 class="text-2xl m-0 p-0">Fin's Homepage</h1>
</div>

<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		{#if quotationData}
			<div class="flex flex-col">
				<p
					class="{quotationData.quotation.length < 200
						? 'text-2xl'
						: 'text-lg'} mb-8 leading-relaxed max-w-2xl text-left"
				>
					{quotationData.quotation}
				</p>
				{#if quotationData.who}
					<p class="text-sm text-flexoki-black-2 font-medium text-right">
						— {quotationData.who}{#if quotationData.source}
							{#if quotationData.url}, <a href={quotationData.url}>{quotationData.source}</a>
							{:else}, {quotationData.source}{/if}
						{/if}
					</p>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col">
				<p class="text-lg mb-8 leading-relaxed max-w-2xl text-left text-flexoki-tx-2">
					Loading quotation...
				</p>
			</div>
		{/if}
		<hr class="my-6 border-flexoki-ui" />

		{#if syncMessage}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span
					class="text-sm {syncMessage.includes('successfully') ||
					syncMessage.includes('Successfully')
						? 'text-flexoki-gr'
						: 'text-flexoki-re'}">{syncMessage}</span
				>
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
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isSyncingQuotations
					? 'opacity-50'
					: ''}"
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
						<span
							class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4
								? 'bg-flexoki-re'
								: task.priority === 3
									? 'bg-flexoki-or'
									: ''}"
						></span>
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
									<a href={task.url} target="_blank" class="underline hover:text-flexoki-tx-2"
										>Link</a
									>
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
						<span
							class="w-2 h-2 border border-flexoki-ui rounded-full {task.priority === 4
								? 'bg-flexoki-re'
								: task.priority === 3
									? 'bg-flexoki-or'
									: ''}"
						></span>
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
									<a href={task.url} target="_blank" class="underline hover:text-flexoki-tx-2"
										>Link</a
									>
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
				<span
					class="text-sm {taskRefreshMessage.includes('Refresh failed') ||
					taskRefreshMessage.includes('Sync failed')
						? 'text-flexoki-re'
						: 'text-flexoki-gr'}">{taskRefreshMessage}</span
				>
			</div>
		{/if}

		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isRefreshingTasks
				? 'opacity-50'
				: ''}"
			on:click={syncTasks}
			disabled={isRefreshingTasks}
		>
			{isRefreshingTasks ? 'Syncing...' : 'Sync tasks'}
		</button>
	</div>
</span>

<!-- DoneThat Time Tracking Panel -->
<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		<h3 class="text-lg font-medium mb-4">Time Tracking (Last 7 Days)</h3>

		{#if isLoadingDoneThat}
			<p class="text-flexoki-tx-2">Loading time tracking data...</p>
		{:else if doneThatError}
			<p class="text-flexoki-re">Error: {doneThatError}</p>
		{:else if doneThatData && doneThatData.rows}
			<!-- Summary stats -->
			{@const totalFocusMinutes = doneThatData.rows.reduce((sum, day) => sum + getFocusMinutes(day), 0)}
			{@const totalTrackedMinutes = doneThatData.rows.reduce((sum, day) => sum + (day.duration || 0), 0)}
			{@const avgFocusMinutes = Math.round(totalFocusMinutes / doneThatData.rows.length)}
			{@const avgTrackedMinutes = Math.round(totalTrackedMinutes / doneThatData.rows.length)}
			{@const maxTrackedMinutes = Math.max(...doneThatData.rows.map(d => d.duration || 0))}
			<div class="mb-4 text-sm text-flexoki-tx-2">
				<span>Focus: <b>{formatDecimalHours(totalFocusMinutes)}</b></span>
				<span class="mx-2">|</span>
				<span>Total: <b>{formatDecimalHours(totalTrackedMinutes)}</b></span>
				<span class="mx-2">|</span>
				<span>Daily avg: <b>{formatDecimalHours(avgFocusMinutes)}</b> / {formatDecimalHours(avgTrackedMinutes)}</span>
			</div>

			<!-- Bar chart of time tracked -->
			<div class="space-y-1 mb-4 relative">
				{#each doneThatData.rows.slice().reverse() as day}
					{@const focusMins = getFocusMinutes(day)}
					{@const totalMins = day.duration || 0}
					{@const totalBarWidth = maxTrackedMinutes > 0 ? (totalMins / maxTrackedMinutes) * 100 : 0}
					{@const focusBarWidth = maxTrackedMinutes > 0 ? (focusMins / maxTrackedMinutes) * 100 : 0}
					<div
						class="flex items-center gap-2 text-sm cursor-pointer group"
						role="button"
						tabindex="0"
						on:mouseenter={(e) => handleDayHover(e, day)}
						on:mouseleave={handleDayLeave}
						on:focus={(e) => handleDayHover(e, day)}
						on:blur={handleDayLeave}
					>
						<span class="w-8 text-flexoki-tx-3 text-xs">{getDayName(day.date)}</span>
						<div class="flex-1 h-5 bg-flexoki-bg-2 border border-flexoki-ui relative overflow-hidden group-hover:border-flexoki-tx-3 transition-colors">
							<!-- Total time bar (subtle background) -->
							<div
								class="absolute inset-y-0 left-0 bg-flexoki-ui-2 opacity-70"
								style="width: {totalBarWidth}%"
							></div>
							<!-- Focus time bar (softer foreground with outline) -->
							<div
								class="absolute inset-y-0 left-0 bg-flexoki-tx-3"
								style="width: {focusBarWidth}%; box-shadow: inset 0 0 0 1px var(--tx-2);"
							></div>
						</div>
						<span class="w-24 text-right text-xs text-flexoki-tx-3 whitespace-nowrap">
							<span class="text-flexoki-tx-2">{formatDecimalHours(focusMins)}</span>
							<span class="text-flexoki-tx-3">/{formatDecimalHours(totalMins)}</span>
						</span>
					</div>
				{/each}
			</div>

			<!-- Tooltip -->
			{#if hoveredDay}
				<div
					class="fixed z-50 bg-flexoki-white border border-flexoki-ui shadow-lg p-3 text-sm max-w-xs pointer-events-none"
					style="left: {tooltipX}px; top: {tooltipY}px; transform: translateY(-100%);"
				>
					<div class="font-medium mb-2">{getDayName(hoveredDay.date)} {hoveredDay.date}</div>
					<div class="text-flexoki-tx-2 mb-2">
						Total: <b>{formatDuration(hoveredDay.duration || 0)}</b>
					</div>
					{#if hoveredDay.categories && hoveredDay.categories.length > 0}
						<div class="space-y-1 mb-2">
							{#each hoveredDay.categories as cat}
								<div class="flex justify-between text-xs">
									<span class="{cat.name === 'Focus work' ? 'text-flexoki-tx-2 font-medium' : 'text-flexoki-tx-3'}">{cat.name}</span>
									<span class="text-flexoki-tx-3 ml-2">{formatDuration(cat.minutes)}</span>
								</div>
							{/each}
						</div>
					{/if}
					{#if hoveredDay.tasks && hoveredDay.tasks.length > 0}
						<div class="border-t border-flexoki-ui pt-2 mt-2">
							<div class="text-xs text-flexoki-tx-3 mb-1">Tasks:</div>
							<div class="space-y-1">
								{#each hoveredDay.tasks.slice(0, 5) as task}
									<div class="flex justify-between text-xs">
										<span class="text-flexoki-tx-2 truncate max-w-[180px]">{task.title}</span>
										<span class="text-flexoki-tx-3 ml-2">{formatDuration(task.duration)}</span>
									</div>
								{/each}
								{#if hoveredDay.tasks.length > 5}
									<div class="text-xs text-flexoki-tx-3">+{hoveredDay.tasks.length - 5} more...</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Expandable detailed breakdown -->
			<button
				class="text-sm text-flexoki-tx-3 hover:text-flexoki-tx-2 cursor-pointer mb-2"
				on:click={() => doneThatExpanded = !doneThatExpanded}
			>
				{doneThatExpanded ? '▼ Hide details' : '▶ Show details'}
			</button>

			{#if doneThatExpanded}
				<div class="space-y-4 mt-2">
					{#each doneThatData.rows.slice().reverse() as day, i}
						<div class="pb-3 {i < doneThatData.rows.length - 1 ? 'border-b border-flexoki-ui' : ''}">
							<div class="flex justify-between items-center mb-2">
								<span class="font-medium">{getDayName(day.date)} {day.date}</span>
								<span class="text-flexoki-tx-2">{formatDuration(day.duration)}</span>
							</div>

							{#if day.tasks && day.tasks.length > 0}
								<div class="mb-2">
									<ul class="text-sm text-flexoki-tx-2 space-y-0.5">
										{#each day.tasks as task}
											<li class="flex justify-between">
												<span>{task.title}</span>
												<span class="text-flexoki-tx-3 ml-2">{formatDuration(task.duration)}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if day.categories && day.categories.length > 0}
								<div class="flex flex-wrap gap-1 text-xs">
									{#each day.categories as cat}
										<span class="px-1.5 py-0.5 bg-flexoki-bg-2 border border-flexoki-ui">
											{cat.name}: {formatDuration(cat.minutes)}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<p class="text-flexoki-tx-2">No time tracking data available</p>
		{/if}

		<hr class="my-6 border-flexoki-ui" />

		{#if doneThatSyncMessage}
			<div class="mb-4 p-2 border border-flexoki-ui bg-flexoki-bg-2">
				<span
					class="text-sm {doneThatSyncMessage.includes('Sync failed')
						? 'text-flexoki-re'
						: 'text-flexoki-gr'}">{doneThatSyncMessage}</span
				>
			</div>
		{/if}

		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isLoadingDoneThat
				? 'opacity-50'
				: ''}"
			on:click={syncDoneThat}
			disabled={isLoadingDoneThat}
		>
			{isLoadingDoneThat ? 'Syncing...' : 'Sync time tracking'}
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
				<span
					class="text-sm {wordSyncMessage.includes('Sync failed')
						? 'text-flexoki-re'
						: 'text-flexoki-gr'}">{wordSyncMessage}</span
				>
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
				class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer {isSyncingWords
					? 'opacity-50'
					: ''}"
				on:click={syncWords}
				disabled={isSyncingWords}
			>
				{isSyncingWords ? 'Syncing...' : 'Sync words'}
			</button>
		</div>
	</div>
</span>

<div class="flex justify-center w-full flex-col md:flex-row">
	<div class="m-5 p-3 border border-flexoki-ui min-h-[40px] w-xs flex items-center justify-center">
		<div class="flex items-center">
			<!-- Dynamic time labels (left) -->
			<div class="relative h-72 w-14 text-xs mr-1">
				<span
					class="absolute right-0 -translate-y-1/2 text-flexoki-tx-2 whitespace-nowrap"
					style="top: {(currentHourDecimal / 24) * 100}%"
				>{currentTimeStr} UK</span>
				<span
					class="absolute right-0 -translate-y-1/2 text-flexoki-tx-3 whitespace-nowrap"
					style="top: {(sfHourDecimal / 24) * 100}%"
				>{sfTimeStr} SF</span>
				<span
					class="absolute right-0 -translate-y-1/2 text-flexoki-tx-3 whitespace-nowrap"
					style="top: {(delhiHourDecimal / 24) * 100}%"
				>{delhiTimeStr} IN</span>
			</div>

			<svg viewBox="0 0 60 120" class="h-72 w-auto">
				<!-- Night background (left of horizon line) -->
				<rect x="0" y="0" width={horizonX} height="120" fill="currentColor" class="text-flexoki-bg-2" />

				<!-- Vertical horizon line (shifts based on day length) -->
				<line x1={horizonX} y1="0" x2={horizonX} y2="120" stroke="currentColor" stroke-width="0.5" class="text-flexoki-ui-2" />

				<!-- Dotted horizontal time markers -->
				<line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-flexoki-ui-2" />
				<line x1="0" y1="30" x2="60" y2="30" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-flexoki-ui-2" />
				<line x1="0" y1="60" x2="60" y2="60" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-flexoki-ui-2" />
				<line x1="0" y1="90" x2="60" y2="90" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-flexoki-ui-2" />
				<line x1="0" y1="120" x2="60" y2="120" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-flexoki-ui-2" />

				<!-- UK time indicator (solid line, ends at sine wave) -->
				<line x1="0" y1={currentSunY} x2={currentSunX} y2={currentSunY} stroke="currentColor" stroke-width="0.5" class="text-flexoki-tx-2" />

				<!-- SF time indicator (solid line, ends at sine wave) -->
				<line x1="0" y1={sfSunY} x2={sfSunX} y2={sfSunY} stroke="currentColor" stroke-width="0.5" class="text-flexoki-tx-3" />

				<!-- Delhi time indicator (solid line, ends at sine wave) -->
				<line x1="0" y1={delhiSunY} x2={delhiSunX} y2={delhiSunY} stroke="currentColor" stroke-width="0.5" class="text-flexoki-tx-3" />

				<!-- Sun path sine wave (drawn on top of time lines) -->
				<path d={sunPathD} fill="none" stroke="currentColor" stroke-width="1" class="text-flexoki-tx-2" />

				<!-- Current sun position -->
				<circle cx={currentSunX} cy={currentSunY} r="2" fill="currentColor" class="text-flexoki-tx-2" />
			</svg>

			<!-- Fixed time scale (right) -->
			<div class="flex flex-col justify-between text-xs text-flexoki-tx-3 ml-2 h-72">
				<span>00:00</span>
				<span>06:00</span>
				<span>12:00</span>
				<span>18:00</span>
				<span>24:00</span>
			</div>
		</div>
	</div>

	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] w-md">
		<div class="flex flex-col mb-4">
			<h3 class="text-xl font-serif text-flexoki-tx">{daysPassedStr}</h3>
		</div>

		<div class="flex flex-wrap gap-1 mt-6">
			{#each Array(365) as _, i}
				<div
					class="w-3 h-3 {i <= currentDayOfYearIndex
						? 'bg-flexoki-tx-2'
						: 'bg-flexoki-bg-2 border border-flexoki-ui'} transition-colors duration-300 hover:scale-125"
					title="Day {i + 1}"
				></div>
			{/each}
		</div>
	</div>
</div>

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
						syncMessage =
							'Quotation added to Google Sheets. Click "Sync quotations" to see it locally.';
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
