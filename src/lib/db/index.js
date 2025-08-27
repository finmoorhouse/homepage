import Database from 'better-sqlite3';
import { dev } from '$app/environment';
import { join } from 'path';

let db;

export function getDatabase() {
	if (!db) {
		try {
			const dbPath = dev ? 'data/homepage.db' : '/tmp/homepage.db';
			console.log('Attempting to open database at:', dbPath);
			db = new Database(dbPath);
			
			// Enable WAL mode for better performance
			db.pragma('journal_mode = WAL');
			
			// Initialize schema
			initializeSchema();
			console.log('Database initialized successfully');
		} catch (error) {
			console.error('Failed to initialize database:', error);
			throw error;
		}
	}
	return db;
}

function initializeSchema() {
	// Quotations table
	db.exec(`
		CREATE TABLE IF NOT EXISTS quotations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			text TEXT NOT NULL,
			author TEXT,
			source TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
	
	// Words table (for future use)
	db.exec(`
		CREATE TABLE IF NOT EXISTS words (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			word TEXT NOT NULL UNIQUE,
			definition TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
	
	// Todoist tasks table (for future use)
	db.exec(`
		CREATE TABLE IF NOT EXISTS todoist_tasks (
			id TEXT PRIMARY KEY,
			content TEXT NOT NULL,
			due_date TEXT,
			project TEXT,
			completed BOOLEAN DEFAULT 0,
			synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
	
	// Sync metadata table
	db.exec(`
		CREATE TABLE IF NOT EXISTS sync_metadata (
			table_name TEXT PRIMARY KEY,
			last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
			record_count INTEGER DEFAULT 0
		)
	`);
}

export function closeDatabase() {
	if (db) {
		db.close();
		db = null;
	}
}