import { bulkInsertQuotations, clearAllQuotations, getQuotationCount, bulkUpsertQuotations } from './quotations.js';
import { bulkInsertWords, clearAllWords, getWordCount, bulkUpsertWords } from './words.js';
import { getDatabase } from './index.js';

export async function syncQuotationsFromGoogleSheets(apiUrl) {
	try {
		console.log('Starting quotations sync from Google Sheets...');
		
		// Fetch ALL quotations using the new getAll action
		const syncUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getAll`;
		console.log('Fetching all quotations from:', syncUrl);
		
		const response = await fetch(syncUrl);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch quotations: ${response.statusText}`);
		}
		
		const data = await response.json();
		console.log('Received data from Google Sheets:', data);
		
		// Handle error response from Google Apps Script
		if (data.error) {
			throw new Error(`Google Sheets API error: ${data.message || data.error}`);
		}
		
		let quotations = [];
		
		if (Array.isArray(data)) {
			// Direct array of quotations
			quotations = data;
		} else {
			console.warn('Expected array of quotations, got:', data);
			return { success: false, error: 'Expected array of quotations from sync endpoint' };
		}
		
		if (quotations.length === 0) {
			console.warn('No quotations returned from Google Sheets');
			return { success: false, error: 'No quotations found in Google Sheets' };
		}
		
		// Perform differential sync - only update what's changed
		const db = getDatabase();
		
		// Convert quotations to the expected format
		const formattedQuotations = quotations.map(q => ({
			text: q.quotation || q.text,
			author: q.who || q.author,
			source: q.source
		}));
		
		// Use upsert to insert new or update existing quotations
		const syncResult = bulkUpsertQuotations(formattedQuotations);
		
		// Update sync metadata
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, record_count)
			VALUES (?, CURRENT_TIMESTAMP, ?)
		`);
		stmt.run('quotations', getQuotationCount());
		
		console.log(`Successfully synced ${quotations.length} quotations (${syncResult.inserted} new, ${syncResult.updated} updated)`);
		
		return {
			success: true,
			synced: quotations.length,
			inserted: syncResult.inserted,
			updated: syncResult.updated,
			timestamp: new Date().toISOString()
		};
		
	} catch (error) {
		console.error('Error syncing quotations:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

export async function syncWordsFromGoogleSheets(apiUrl) {
	try {
		console.log('Starting words sync from Google Sheets...');
		
		// Fetch ALL words using the new getAll parameter
		const syncUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}all=true`;
		console.log('Fetching all words from:', syncUrl);
		
		const response = await fetch(syncUrl);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch words: ${response.statusText}`);
		}
		
		const data = await response.json();
		console.log('Received data from Google Sheets:', data);
		
		// Handle error response from Google Apps Script
		if (data.error) {
			throw new Error(`Google Sheets API error: ${data.message || data.error}`);
		}
		
		let words = [];
		
		if (Array.isArray(data)) {
			// Direct array of words
			words = data;
		} else {
			console.warn('Expected array of words, got:', data);
			return { success: false, error: 'Expected array of words from sync endpoint' };
		}
		
		if (words.length === 0) {
			console.warn('No words returned from Google Sheets');
			return { success: false, error: 'No words found in Google Sheets' };
		}
		
		// Perform differential sync - only update what's changed
		const db = getDatabase();
		
		// Convert words to the expected format
		const formattedWords = words.map(w => ({
			word: w.word,
			definition: w.definition
		}));
		
		// Use upsert to insert new or update existing words
		const syncResult = bulkUpsertWords(formattedWords);
		
		// Update sync metadata
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, record_count)
			VALUES (?, CURRENT_TIMESTAMP, ?)
		`);
		stmt.run('words', getWordCount());
		
		console.log(`Successfully synced ${words.length} words (${syncResult.inserted} new, ${syncResult.updated} updated)`);
		
		return {
			success: true,
			synced: words.length,
			inserted: syncResult.inserted,
			updated: syncResult.updated,
			timestamp: new Date().toISOString()
		};
		
	} catch (error) {
		console.error('Error syncing words:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

export function getLastSyncInfo(tableName) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM sync_metadata WHERE table_name = ?');
	return stmt.get(tableName);
}