import { json } from '@sveltejs/kit';
import { getAllQuotations, getQuotationCount } from '$lib/db/quotations.js';
import { getLastSyncInfo } from '$lib/db/sync.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get ALL quotations from SQLite cache
		const allQuotations = getAllQuotations();
		const quotationCount = getQuotationCount();
		const syncInfo = getLastSyncInfo('quotations');
		
		return json({
			quotations: allQuotations || [],
			meta: {
				count: quotationCount,
				lastSync: syncInfo?.last_sync || null,
				source: 'server-cache-all'
			}
		});
		
	} catch (error) {
		console.error('Error in all quotations API:', error);
		return json(
			{ 
				error: 'Failed to fetch all quotations',
				quotations: [],
				meta: { count: 0, lastSync: null, source: 'error' }
			}, 
			{ status: 500 }
		);
	}
}