import { openDB } from 'idb';

const DB_NAME = 'homepage-cache';
const DB_VERSION = 3;
const WORDS_STORE = 'words';
const TASKS_STORE = 'tasks';
const QUOTATIONS_STORE = 'quotations';

let dbPromise;

function getDB() {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db, oldVersion) {
				// Create words store
				if (!db.objectStoreNames.contains(WORDS_STORE)) {
					const wordsStore = db.createObjectStore(WORDS_STORE, {
						keyPath: 'word'
					});
					// Create index for easier querying
					wordsStore.createIndex('createdAt', 'createdAt');
				}
				
				// Create tasks store (new in version 2)
				if (oldVersion < 2 && !db.objectStoreNames.contains(TASKS_STORE)) {
					const tasksStore = db.createObjectStore(TASKS_STORE, {
						keyPath: 'id'
					});
					// Create indexes for easier querying
					tasksStore.createIndex('dueDate', 'dueDate');
					tasksStore.createIndex('priority', 'priority');
					tasksStore.createIndex('cachedAt', 'cachedAt');
				}
				
				// Create quotations store (new in version 3)
				if (oldVersion < 3 && !db.objectStoreNames.contains(QUOTATIONS_STORE)) {
					const quotationsStore = db.createObjectStore(QUOTATIONS_STORE, {
						keyPath: 'id'
					});
					// Create indexes for easier querying
					quotationsStore.createIndex('author', 'author');
					quotationsStore.createIndex('cachedAt', 'cachedAt');
				}
			}
		});
	}
	return dbPromise;
}

export async function cacheWords(words) {
	const db = await getDB();
	const tx = db.transaction(WORDS_STORE, 'readwrite');
	const store = tx.objectStore(WORDS_STORE);
	
	const timestamp = new Date().toISOString();
	
	for (const word of words) {
		const wordData = {
			word: word.word,
			definition: word.definition,
			createdAt: word.created_at || timestamp,
			updatedAt: word.updated_at || timestamp,
			cachedAt: timestamp
		};
		await store.put(wordData);
	}
	
	await tx.done;
}

export async function getCachedWords(count = 3) {
	const db = await getDB();
	const tx = db.transaction(WORDS_STORE, 'readonly');
	const store = tx.objectStore(WORDS_STORE);
	
	// Get all words and randomly select from them
	const allWords = await store.getAll();
	
	if (allWords.length === 0) {
		return [];
	}
	
	// Shuffle array and take requested count
	const shuffled = allWords.sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function getCachedWordCount() {
	const db = await getDB();
	const tx = db.transaction(WORDS_STORE, 'readonly');
	const store = tx.objectStore(WORDS_STORE);
	return await store.count();
}

export async function clearWordsCache() {
	const db = await getDB();
	const tx = db.transaction(WORDS_STORE, 'readwrite');
	const store = tx.objectStore(WORDS_STORE);
	await store.clear();
	await tx.done;
}

export async function getCacheInfo() {
	const count = await getCachedWordCount();
	
	if (count === 0) {
		return { count: 0, lastCached: null };
	}
	
	const db = await getDB();
	const tx = db.transaction(WORDS_STORE, 'readonly');
	const store = tx.objectStore(WORDS_STORE);
	
	// Get the most recently cached word to determine last cache time
	const allWords = await store.getAll();
	const lastCached = allWords.reduce((latest, word) => {
		const wordCachedAt = new Date(word.cachedAt);
		return !latest || wordCachedAt > latest ? wordCachedAt : latest;
	}, null);
	
	return {
		count,
		lastCached: lastCached ? lastCached.toISOString() : null
	};
}

// Tasks functions
export async function cacheTasks(tasks) {
	const db = await getDB();
	const tx = db.transaction(TASKS_STORE, 'readwrite');
	const store = tx.objectStore(TASKS_STORE);
	
	// Clear existing tasks first
	await store.clear();
	
	const timestamp = new Date().toISOString();
	
	for (const task of tasks) {
		const taskData = {
			id: task.id,
			content: task.content,
			completed: task.completed,
			priority: task.priority,
			url: task.url,
			dueDate: task.due?.date || null,
			dueString: task.due?.string || null,
			cachedAt: timestamp
		};
		await store.put(taskData);
	}
	
	await tx.done;
}

export async function getCachedTasks() {
	const db = await getDB();
	const tx = db.transaction(TASKS_STORE, 'readonly');
	const store = tx.objectStore(TASKS_STORE);
	
	const allTasks = await store.getAll();
	
	// Convert back to expected format
	return allTasks.map(task => ({
		id: task.id,
		content: task.content,
		completed: task.completed,
		priority: task.priority,
		url: task.url,
		due: task.dueDate ? {
			date: task.dueDate,
			string: task.dueString
		} : null
	}));
}

export async function getCachedTaskCount() {
	const db = await getDB();
	const tx = db.transaction(TASKS_STORE, 'readonly');
	const store = tx.objectStore(TASKS_STORE);
	return await store.count();
}

export async function clearTasksCache() {
	const db = await getDB();
	const tx = db.transaction(TASKS_STORE, 'readwrite');
	const store = tx.objectStore(TASKS_STORE);
	await store.clear();
	await tx.done;
}

export async function getTasksCacheInfo() {
	const count = await getCachedTaskCount();
	
	if (count === 0) {
		return { count: 0, lastCached: null };
	}
	
	const db = await getDB();
	const tx = db.transaction(TASKS_STORE, 'readonly');
	const store = tx.objectStore(TASKS_STORE);
	
	// Get the most recently cached task to determine last cache time
	const allTasks = await store.getAll();
	const lastCached = allTasks.reduce((latest, task) => {
		const taskCachedAt = new Date(task.cachedAt);
		return !latest || taskCachedAt > latest ? taskCachedAt : latest;
	}, null);
	
	return {
		count,
		lastCached: lastCached ? lastCached.toISOString() : null
	};
}

// Quotations functions
export async function cacheQuotations(quotations) {
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readwrite');
	const store = tx.objectStore(QUOTATIONS_STORE);
	
	// Clear existing quotations first
	await store.clear();
	
	const timestamp = new Date().toISOString();
	
	console.log('🔍 Caching quotations, sample data:', quotations[0]);
	
	for (let i = 0; i < quotations.length; i++) {
		const quotation = quotations[i];
		try {
			const quotationData = {
				// Generate ID if missing (IndexedDB keyPath requires it)
				id: quotation.id || quotation.text?.substring(0, 50) || `quotation_${i}`,
				text: quotation.text || quotation.quotation,
				author: quotation.author || quotation.who,
				source: quotation.source,
				createdAt: quotation.created_at || timestamp,
				updatedAt: quotation.updated_at || timestamp,
				cachedAt: timestamp
			};
			
			// Validate required fields
			if (!quotationData.text) {
				console.warn('⚠️ Skipping quotation with no text:', quotation);
				continue;
			}
			
			await store.put(quotationData);
		} catch (error) {
			console.error('❌ Error caching individual quotation:', error, quotation);
			// Continue with other quotations
		}
	}
	
	await tx.done;
}

export async function getCachedQuotations() {
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readonly');
	const store = tx.objectStore(QUOTATIONS_STORE);
	
	const allQuotations = await store.getAll();
	
	// Convert back to expected format
	return allQuotations.map(quotation => ({
		id: quotation.id,
		text: quotation.text,
		author: quotation.author,
		source: quotation.source,
		created_at: quotation.createdAt,
		updated_at: quotation.updatedAt
	}));
}

export async function getCachedRandomQuotation() {
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readonly');
	const store = tx.objectStore(QUOTATIONS_STORE);
	
	const allQuotations = await store.getAll();
	
	if (allQuotations.length === 0) {
		return null;
	}
	
	// Get random quotation
	const randomIndex = Math.floor(Math.random() * allQuotations.length);
	const quotation = allQuotations[randomIndex];
	
	// Convert back to expected format
	return {
		quotation: quotation.text,
		who: quotation.author,
		source: quotation.source
	};
}

export async function getCachedQuotationCount() {
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readonly');
	const store = tx.objectStore(QUOTATIONS_STORE);
	return await store.count();
}

export async function clearQuotationsCache() {
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readwrite');
	const store = tx.objectStore(QUOTATIONS_STORE);
	await store.clear();
	await tx.done;
}

export async function getQuotationsCacheInfo() {
	const count = await getCachedQuotationCount();
	
	if (count === 0) {
		return { count: 0, lastCached: null };
	}
	
	const db = await getDB();
	const tx = db.transaction(QUOTATIONS_STORE, 'readonly');
	const store = tx.objectStore(QUOTATIONS_STORE);
	
	// Get the most recently cached quotation to determine last cache time
	const allQuotations = await store.getAll();
	const lastCached = allQuotations.reduce((latest, quotation) => {
		const quotationCachedAt = new Date(quotation.cachedAt);
		return !latest || quotationCachedAt > latest ? quotationCachedAt : latest;
	}, null);
	
	return {
		count,
		lastCached: lastCached ? lastCached.toISOString() : null
	};
}