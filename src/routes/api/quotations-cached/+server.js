import { json } from '@sveltejs/kit';
import { getRandomQuotation, getQuotationCount } from '$lib/db/quotations.js';
import { getLastSyncInfo } from '$lib/db/sync.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get random quotation from SQLite cache
		const randomQuotation = getRandomQuotation();
		const quotationCount = getQuotationCount();
		const syncInfo = getLastSyncInfo('quotations');
		
		if (!randomQuotation) {
			return json({
				quotation: null,
				meta: {
					count: quotationCount,
					lastSync: syncInfo?.last_sync || null,
					source: 'server-cache-empty'
				}
			});
		}
		
		// Return in the same format as the original API
		return json({
			quotation: randomQuotation.text,
			who: randomQuotation.author,
			source: randomQuotation.source,
			meta: {
				count: quotationCount,
				lastSync: syncInfo?.last_sync || null,
				source: 'server-cache'
			}
		});
		
	} catch (error) {
		console.error('Error in cached quotations API:', error);
		return json(
			{ 
				error: 'Failed to fetch cached quotation',
				quotation: null,
				meta: { count: 0, lastSync: null, source: 'error' }
			}, 
			{ status: 500 }
		);
	}
}