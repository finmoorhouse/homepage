import { QUOTATION_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';

const API_URL = QUOTATION_API_URL;

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const all = url.searchParams.get('all') === 'true';
		
		// Fetch directly from Google Sheets
		const fetchUrl = all ? `${API_URL}${API_URL.includes('?') ? '&' : '?'}action=getAll` : API_URL;
		console.log('Fetching quotations directly from Google Sheets:', all ? 'ALL quotations' : '1 random quotation');
		
		const response = await fetch(fetchUrl);
		
		if (!response.ok) {
			console.error('Error fetching from Google Sheets:', response.statusText);
			return json({ error: 'Failed to fetch quotations from Google Sheets' }, { status: 500 });
		}
		
		const data = await response.json();
		console.log('Received from Google Sheets:', Array.isArray(data) ? data.length + ' quotations' : 'single response');
		
		// Handle error response from Google Apps Script
		if (data.error) {
			throw new Error(`Google Sheets API error: ${data.message || data.error}`);
		}
		
		// Return data in consistent format
		if (all) {
			// For all quotations, expect an array
			const quotations = Array.isArray(data) ? data : [data];
			return json({
				quotations: quotations,
				meta: {
					count: quotations.length,
					source: 'google-sheets-direct',
					fetchedAll: true
				}
			});
		} else {
			// For single quotation, return in the same format as original API
			return json({
				quotation: data.quotation || data.text,
				who: data.who || data.author,
				source: data.source,
				meta: {
					count: 1,
					source: 'google-sheets-direct',
					fetchedAll: false
				}
			});
		}
		
	} catch (error) {
		console.error('Error in direct quotations API:', error);
		return json({ 
			error: 'Internal server error', 
			details: error.message 
		}, { status: 500 });
	}
}

export async function POST(request) {
	console.log('Adding quotation via direct API...');
	
	try {
		// Parse the incoming request
		const formData = await request.request.json();
		const { quotation, who, source, url } = formData;
		
		if (!quotation || typeof quotation !== 'string' || quotation.trim() === '') {
			return json({ error: 'No quotation provided' }, { status: 400 });
		}
		
		console.log('Processing quotation:', quotation);
		
		// Call the Google Apps Script web app directly
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				quotation: quotation.trim(),
				who: who ? who.trim() : '',
				source: source ? source.trim() : '',
				url: url ? url.trim() : ''
			})
		});
		
		// Check content type
		const contentType = response.headers.get('Content-Type');
		console.log('Response Content-Type:', contentType);
		
		if (!contentType || !contentType.includes('application/json')) {
			const textResponse = await response.text();
			console.error('Received non-JSON response:', textResponse.substring(0, 200) + '...');
			throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
		}
		
		const result = await response.json();
		console.log('Response from Google Apps Script:', result);
		
		if (!result.success) {
			return json({
				error: result.message || 'Failed to add quotation',
				details: result
			}, { status: 400 });
		}
		
		// Return success response
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
		console.error('Error processing quotation:', error);
		return json({
			error: 'Internal server error', 
			details: error.message
		}, { status: 500 });
	}
}