import { getDatabase } from './index.js';

export function getAllQuotations() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM quotations ORDER BY created_at DESC');
	return stmt.all();
}

export function getRandomQuotation() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM quotations ORDER BY RANDOM() LIMIT 1');
	return stmt.get();
}

export function getQuotationById(id) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM quotations WHERE id = ?');
	return stmt.get(id);
}

export function insertQuotation(text, author = null, source = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO quotations (text, author, source, created_at, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	return stmt.run(text, author, source);
}

export function updateQuotation(id, text, author = null, source = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		UPDATE quotations 
		SET text = ?, author = ?, source = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`);
	return stmt.run(text, author, source, id);
}

export function deleteQuotation(id) {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM quotations WHERE id = ?');
	return stmt.run(id);
}

export function clearAllQuotations() {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM quotations');
	return stmt.run();
}

export function getQuotationCount() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM quotations');
	return stmt.get().count;
}

export function bulkInsertQuotations(quotations) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO quotations (text, author, source, created_at, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((quotations) => {
		for (const quotation of quotations) {
			stmt.run(quotation.text, quotation.author, quotation.source);
		}
	});
	
	return transaction(quotations);
}

export function upsertQuotation(text, author = null, source = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO quotations (text, author, source, created_at, updated_at)
		VALUES (?, ?, ?, COALESCE((SELECT created_at FROM quotations WHERE text = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
	`);
	return stmt.run(text, author, source, text);
}

export function quotationExists(text) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE text = ?');
	return stmt.get(text).count > 0;
}

export function getQuotationByText(text) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM quotations WHERE text = ?');
	return stmt.get(text);
}

export function bulkUpsertQuotations(quotations) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO quotations (text, author, source, created_at, updated_at)
		VALUES (?, ?, ?, COALESCE((SELECT created_at FROM quotations WHERE text = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((quotations) => {
		let inserted = 0;
		let updated = 0;
		
		for (const quotation of quotations) {
			const existing = quotationExists(quotation.text);
			stmt.run(quotation.text, quotation.author, quotation.source, quotation.text);
			
			if (existing) {
				updated++;
			} else {
				inserted++;
			}
		}
		
		return { inserted, updated };
	});
	
	return transaction(quotations);
}