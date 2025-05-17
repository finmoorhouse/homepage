import { QUOTATION_API_URL } from '$env/static/private';

const API_URL = QUOTATION_API_URL;

import { json } from '@sveltejs/kit';
/** @type {import('./$types').RequestHandler} */

export async function GET() {
	console.log(QUOTATION_API_URL);
	try {
		// Fetch data from your Google Apps Script
		const response = await fetch(API_URL);

		// Check if the fetch was successful
		if (!response.ok) {
			console.error('Error fetching from Apps Script:', response.statusText);
			return json({ error: 'Failed to fetch quotation' }, { status: 500 });
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the data as JSON
		return json(data);
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
		return new Response(JSON.stringify({ error: 'No quotation provided' }), {
		  status: 400,
		  headers: { 'Content-Type': 'application/json' },
		});
	  }
	  
	  console.log('Processing quotation:', quotation);
	  
	  // URL of your deployed Google Apps Script web app
	  const scriptUrl = API_URL;
	  
	  // Call the Google Apps Script web app
	  const response = await fetch(scriptUrl, {
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
		return new Response(JSON.stringify({ 
		  error: result.message || 'Failed to add quotation',
		  details: result
		}), {
		  status: 400,
		  headers: { 'Content-Type': 'application/json' },
		});
	  }
	  
	  // Return success response with the quotation and related information
	  return new Response(JSON.stringify({
		message: result.isNew ? 'Quotation added successfully' : 'Quotation updated successfully',
		quotation: result.quotation,
		who: result.who,
		source: result.source,
		url: result.url,
		isNew: result.isNew,
		wasUpdated: result.wasUpdated
	  }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	  });
	} catch (error) {
	  console.error('Error processing quote:', error);
	  return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
		status: 500,
		headers: { 'Content-Type': 'application/json' },
	  });
	}
}