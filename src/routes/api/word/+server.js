import { WORD_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';

const API_URL = WORD_API_URL;

/** @type {import('./$types').RequestHandler} */

export async function GET() {
	try {
		// Fetch words directly from Google Sheets API
		return await fetchWordFromAPI();
	} catch (error) {
		console.error('Error in word API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

async function fetchWordFromAPI() {
	try {
		// Fetch data from your Google Apps Script
		const response = await fetch(API_URL);

		// Check if the fetch was successful
		if (!response.ok) {
			console.error('Error fetching from Apps Script:', response.statusText);
			return json({ error: 'Failed to fetch word' }, { status: 500 });
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the data as JSON
		return json(data);
	} catch (error) {
		console.error('Error fetching from API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request) {
	console.log('Request started.');

	try {
		// Parse the incoming request from your SvelteKit app
		const formData = await request.request.json();
		const { word } = formData;

		if (!word || typeof word !== 'string' || word.trim() === '') {
			return new Response(JSON.stringify({ error: 'No word provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		console.log('Processing word:', word);

		// URL of your deployed Google Apps Script web app
		const scriptUrl = API_URL;

		// Call the Google Apps Script web app
		const response = await fetch(scriptUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ word: word.trim() })
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
			return new Response(
				JSON.stringify({
					error: result.message || 'Failed to add word',
					details: result
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Word was successfully added to Google Sheets

		// Return success response with the word and definition
		return new Response(
			JSON.stringify({
				message: 'Word added successfully',
				word: result.word,
				definition: result.definition,
				isNew: result.isNew,
				definitionAdded: result.definitionAdded
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error processing word:', error);
		return new Response(
			JSON.stringify({ error: 'Internal server error', details: error.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
