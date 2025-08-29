import { json } from '@sveltejs/kit';
import { getAllWords, getWordCount } from '$lib/db/words.js';
import { getLastSyncInfo } from '$lib/db/sync.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get ALL words from SQLite cache
		const allWords = getAllWords();
		const wordCount = getWordCount();
		const syncInfo = getLastSyncInfo('words');
		
		return json({
			words: allWords || [],
			meta: {
				count: wordCount,
				lastSync: syncInfo?.last_sync || null,
				source: 'server-cache-all'
			}
		});
		
	} catch (error) {
		console.error('Error in all words API:', error);
		return json(
			{ 
				error: 'Failed to fetch all words',
				words: [],
				meta: { count: 0, lastSync: null, source: 'error' }
			}, 
			{ status: 500 }
		);
	}
}