import { json } from '@sveltejs/kit';
import { getRandomWords, getWordCount } from '$lib/db/words.js';
import { getLastSyncInfo } from '$lib/db/sync.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get random words from SQLite cache
		const wordCount = getWordCount();
		console.log('SQLite word count:', wordCount);
		
		const randomWords = getRandomWords(3);
		console.log('Random words from SQLite:', randomWords?.length || 0);
		
		const syncInfo = getLastSyncInfo('words');
		
		return json({
			words: randomWords || [],
			meta: {
				count: wordCount,
				lastSync: syncInfo?.last_sync || null,
				source: 'server-cache'
			}
		});
		
	} catch (error) {
		console.error('Error in cached words API:', error);
		return json(
			{ 
				error: 'Failed to fetch cached words',
				words: [],
				meta: { count: 0, lastSync: null, source: 'error' }
			}, 
			{ status: 500 }
		);
	}
}