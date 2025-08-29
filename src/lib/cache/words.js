import { openDB } from 'idb';

const DB_NAME = 'homepage-cache';
const DB_VERSION = 1;
const WORDS_STORE = 'words';

let dbPromise;

function getDB() {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Create words store
				if (!db.objectStoreNames.contains(WORDS_STORE)) {
					const wordsStore = db.createObjectStore(WORDS_STORE, {
						keyPath: 'word'
					});
					// Create index for easier querying
					wordsStore.createIndex('createdAt', 'createdAt');
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