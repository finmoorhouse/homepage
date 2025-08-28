import { json } from '@sveltejs/kit';
import { syncQuotationsFromGoogleSheets, syncWordsFromGoogleSheets, getLastSyncInfo } from '$lib/db/sync.js';
import { QUOTATION_API_URL, WORD_API_URL } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { table } = await request.json();
		
		if (!table) {
			return json({ error: 'Table name required' }, { status: 400 });
		}
		
		switch (table) {
			case 'quotations':
				const quotationsResult = await syncQuotationsFromGoogleSheets(QUOTATION_API_URL);
				return json(quotationsResult, { status: quotationsResult.success ? 200 : 500 });
				
			case 'words':
				const wordsResult = await syncWordsFromGoogleSheets(WORD_API_URL);
				return json(wordsResult, { status: wordsResult.success ? 200 : 500 });
			
			default:
				return json({ error: `Sync not implemented for table: ${table}` }, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error in sync API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function GET({ url }) {
	try {
		const table = url.searchParams.get('table');
		
		if (!table) {
			return json({ error: 'Table name required' }, { status: 400 });
		}
		
		const syncInfo = getLastSyncInfo(table);
		return json(syncInfo || { message: 'No sync information found' });
		
	} catch (error) {
		console.error('Error getting sync info:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}