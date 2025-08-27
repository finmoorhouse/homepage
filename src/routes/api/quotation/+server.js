import { QUOTATION_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { getRandomQuotation, getQuotationCount } from '$lib/db/quotations.js';
import { syncQuotationsFromGoogleSheets } from '$lib/db/sync.js';

const API_URL = QUOTATION_API_URL;

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Check if we have any quotations in cache
		const count = getQuotationCount();
		
		if (count === 0) {
			// No cached quotations, try to sync first
			console.log('No cached quotations found, syncing from Google Sheets...');
			await syncQuotationsFromGoogleSheets(API_URL);
		}
		
		// Get a random quotation from cache
		const quotation = getRandomQuotation();
		
		if (!quotation) {
			return json({ error: 'No quotations available' }, { status: 404 });
		}
		
		// Return in the same format as the original API
		return json({
			quotation: quotation.text,
			who: quotation.author,
			source: quotation.source
		});
		
	} catch (error) {
		console.error('Error in quotation API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request) {
	console.log('Request started.');
	
	try {
		// Parse the incoming request from your SvelteKit app
		const formData = await request.request.json();
		const { quotation, who, source, url } = formData;
		
		if (!quotation || typeof quotation !== 'string' || quotation.trim() === '') {
			return json({ error: 'No quotation provided' }, { status: 400 });
		}
		
		console.log('Processing quotation:', quotation);
		
		// Call the Google Apps Script web app to sync with remote
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				quotation: quotation.trim(),
				who: who ? who.trim() : '',
				source: source ? source.trim() : '',
				url: url ? url.trim() : ''
			}),
		});
		
		// Check content type to debug response format
		const contentType = response.headers.get('Content-Type');
		console.log('Response Content-Type:', contentType);
		
		// For debugging: if not JSON, try to read the text response
		if (!contentType || !contentType.includes('application/json')) {
			const textResponse = await response.text();
			console.error('Received non-JSON response:', textResponse.substring(0, 200) + '...');
			throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
		}
		
		// Parse the response from the Google Apps Script
		const result = await response.json();
		
		console.log('Response from Google Apps Script:', result);
		
		if (!result.success) {
			return json({ 
				error: result.message || 'Failed to add quotation',
				details: result
			}, { status: 400 });
		}
		
		// Note: Not caching locally - user needs to sync to see new quotation in local cache
		
		// Return success response with the quotation and related information
		return json({
			message: result.isNew ? 'Quotation added successfully' : 'Quotation updated successfully',
			quotation: result.quotation,
			who: result.who,
			source: result.source,
			url: result.url,
			isNew: result.isNew,
			wasUpdated: result.wasUpdated
		}, { status: 201 });
		
	} catch (error) {
		console.error('Error processing quote:', error);
		return json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}