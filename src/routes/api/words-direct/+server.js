import { WORD_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';

const API_URL = WORD_API_URL;

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const all = url.searchParams.get('all') === 'true';
		
		// Fetch directly from Google Sheets
		const fetchUrl = all ? `${API_URL}${API_URL.includes('?') ? '&' : '?'}all=true` : API_URL;
		console.log('Fetching words directly from Google Sheets:', all ? 'ALL words' : '3 random words');
		
		const response = await fetch(fetchUrl);
		
		if (!response.ok) {
			console.error('Error fetching from Google Sheets:', response.statusText);
			return json({ error: 'Failed to fetch words from Google Sheets' }, { status: 500 });
		}
		
		const data = await response.json();
		console.log('Received from Google Sheets:', Array.isArray(data) ? data.length + ' words' : 'single response');
		
		// Handle error response from Google Apps Script
		if (data.error) {
			throw new Error(`Google Sheets API error: ${data.message || data.error}`);
		}
		
		// Return data in consistent format
		const words = Array.isArray(data) ? data : [data];
		
		return json({
			words: words,
			meta: {
				count: words.length,
				source: 'google-sheets-direct',
				fetchedAll: all
			}
		});
		
	} catch (error) {
		console.error('Error in direct words API:', error);
		return json({ 
			error: 'Internal server error', 
			details: error.message 
		}, { status: 500 });
	}
}

export async function POST(request) {
	console.log('Adding word via direct API...');
	
	try {
		// Parse the incoming request
		const formData = await request.request.json();
		const { word } = formData;
		
		if (!word || typeof word !== 'string' || word.trim() === '') {
			return json({ error: 'No word provided' }, { status: 400 });
		}
		
		console.log('Processing word:', word);
		
		// Call the Google Apps Script web app directly
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ word: word.trim() })
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
				error: result.message || 'Failed to add word',
				details: result
			}, { status: 400 });
		}
		
		// Return success response
		return json({
			message: 'Word added successfully',
			word: result.word,
			definition: result.definition,
			isNew: result.isNew,
			definitionAdded: result.definitionAdded
		}, { status: 201 });
		
	} catch (error) {
		console.error('Error processing word:', error);
		return json({
			error: 'Internal server error', 
			details: error.message
		}, { status: 500 });
	}
}