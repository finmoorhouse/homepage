import { getDatabase } from './index.js';

export function getAllWords() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM words ORDER BY created_at DESC');
	return stmt.all();
}

export function getRandomWord() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM words ORDER BY RANDOM() LIMIT 1');
	return stmt.get();
}

export function getRandomWords(count = 3) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM words ORDER BY RANDOM() LIMIT ?');
	return stmt.all(count);
}

export function getWordById(id) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM words WHERE id = ?');
	return stmt.get(id);
}

export function getWordByText(word) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM words WHERE word = ?');
	return stmt.get(word);
}

export function insertWord(word, definition = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO words (word, definition, created_at, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	return stmt.run(word, definition);
}

export function updateWord(id, word, definition = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		UPDATE words 
		SET word = ?, definition = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`);
	return stmt.run(word, definition, id);
}

export function deleteWord(id) {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM words WHERE id = ?');
	return stmt.run(id);
}

export function clearAllWords() {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM words');
	return stmt.run();
}

export function getWordCount() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM words');
	return stmt.get().count;
}

export function bulkInsertWords(words) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO words (word, definition, created_at, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((words) => {
		for (const wordObj of words) {
			stmt.run(wordObj.word, wordObj.definition);
		}
	});
	
	return transaction(words);
}

export function upsertWord(word, definition = null) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO words (word, definition, created_at, updated_at)
		VALUES (?, ?, COALESCE((SELECT created_at FROM words WHERE word = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
	`);
	return stmt.run(word, definition, word);
}

export function wordExists(word) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM words WHERE word = ?');
	return stmt.get(word).count > 0;
}

export function bulkUpsertWords(words) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO words (word, definition, created_at, updated_at)
		VALUES (?, ?, COALESCE((SELECT created_at FROM words WHERE word = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((words) => {
		let inserted = 0;
		let updated = 0;
		
		for (const wordObj of words) {
			const existing = wordExists(wordObj.word);
			stmt.run(wordObj.word, wordObj.definition, wordObj.word);
			
			if (existing) {
				updated++;
			} else {
				inserted++;
			}
		}
		
		return { inserted, updated };
	});
	
	return transaction(words);
}