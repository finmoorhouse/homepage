import { WORD_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { getRandomWord, getRandomWords, getWordCount, insertWord } from '$lib/db/words.js';
import { syncWordsFromGoogleSheets, getLastSyncInfo } from '$lib/db/sync.js';

const API_URL = WORD_API_URL;

/** @type {import('./$types').RequestHandler} */

export async function GET() {
	try {
		// Check if we have words in local cache
		const wordCount = getWordCount();
		
		if (wordCount === 0) {
			// No words in cache, try to sync from Google Sheets first
			console.log('No words in local cache, syncing from Google Sheets...');
			const syncResult = await syncWordsFromGoogleSheets(API_URL);
			
			if (!syncResult.success) {
				console.error('Failed to sync words:', syncResult.error);
				// Fall back to direct API call
				return await fetchWordFromAPI();
			}
		}
		
		// Get 3 random words from local cache
		const randomWords = getRandomWords(3);
		
		if (!randomWords || randomWords.length === 0) {
			// No words in cache even after sync attempt, fall back to API
			console.log('No words available in cache, falling back to API...');
			return await fetchWordFromAPI();
		}
		
		// Return cached words
		return json(randomWords);
		
	} catch (error) {
		console.error('Error in word API:', error);
		// Fall back to direct API call
		return await fetchWordFromAPI();
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

		// Add word to local cache if it was successfully added
		if (result.success && result.isNew && result.definition) {
			try {
				insertWord(result.word, result.definition);
				console.log('Added word to local cache:', result.word);
			} catch (cacheError) {
				console.error('Failed to add word to local cache:', cacheError);
				// Don't fail the request, just log the error
			}
		}

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
