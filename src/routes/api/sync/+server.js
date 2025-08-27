import { json } from '@sveltejs/kit';
import { syncQuotationsFromGoogleSheets, getLastSyncInfo } from '$lib/db/sync.js';
import { QUOTATION_API_URL } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { table } = await request.json();
		
		if (!table) {
			return json({ error: 'Table name required' }, { status: 400 });
		}
		
		switch (table) {
			case 'quotations':
				const result = await syncQuotationsFromGoogleSheets(QUOTATION_API_URL);
				return json(result, { status: result.success ? 200 : 500 });
			
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