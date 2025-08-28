import { getDatabase } from './index.js';

export function getAllTasks() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM todoist_tasks ORDER BY due_date ASC, priority DESC');
	return stmt.all();
}

export function getTaskById(id) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT * FROM todoist_tasks WHERE id = ?');
	return stmt.get(id);
}

export function insertTask(id, content, completed, priority, url, dueDate, dueString, project) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO todoist_tasks (id, content, completed, priority, url, due_date, due_string, project, synced_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	return stmt.run(id, content, completed ? 1 : 0, priority, url, dueDate, dueString, project);
}

export function updateTask(id, content, completed, priority, url, dueDate, dueString, project) {
	const db = getDatabase();
	const stmt = db.prepare(`
		UPDATE todoist_tasks 
		SET content = ?, completed = ?, priority = ?, url = ?, due_date = ?, due_string = ?, project = ?, synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`);
	return stmt.run(content, completed ? 1 : 0, priority, url, dueDate, dueString, project, id);
}

export function deleteTask(id) {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM todoist_tasks WHERE id = ?');
	return stmt.run(id);
}

export function clearAllTasks() {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM todoist_tasks');
	return stmt.run();
}

export function getTaskCount() {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM todoist_tasks');
	return stmt.get().count;
}

export function bulkInsertTasks(tasks) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO todoist_tasks (id, content, completed, priority, url, due_date, due_string, project, synced_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((tasks) => {
		for (const task of tasks) {
			stmt.run(
				task.id,
				task.content,
				task.completed,
				task.priority,
				task.url,
				task.due?.date || null,
				task.due?.string || null,
				task.project || null
			);
		}
	});
	
	return transaction(tasks);
}

export function upsertTask(id, content, completed, priority, url, dueDate, dueString, project) {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO todoist_tasks (id, content, completed, priority, url, due_date, due_string, project, synced_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, COALESCE((SELECT created_at FROM todoist_tasks WHERE id = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
	`);
	return stmt.run(id, content, completed, priority, url, dueDate, dueString, project, id);
}

export function taskExists(id) {
	const db = getDatabase();
	const stmt = db.prepare('SELECT COUNT(*) as count FROM todoist_tasks WHERE id = ?');
	return stmt.get(id).count > 0;
}

export function bulkUpsertTasks(tasks) {
	const db = getDatabase();
	
	// Clear all existing tasks first, then insert new ones
	// This ensures we remove tasks that were completed/deleted in Todoist
	const clearStmt = db.prepare('DELETE FROM todoist_tasks');
	const insertStmt = db.prepare(`
		INSERT INTO todoist_tasks (id, content, completed, priority, url, due_date, due_string, project, synced_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`);
	
	const transaction = db.transaction((tasks) => {
		// Clear existing tasks
		clearStmt.run();
		
		// Insert all new tasks
		for (const task of tasks) {
			insertStmt.run(
				task.id,
				task.content,
				task.completed ? 1 : 0, // Convert boolean to integer
				task.priority,
				task.url,
				task.due?.date || null,
				task.due?.string || null,
				task.project || null
			);
		}
		
		return { inserted: tasks.length, updated: 0 };
	});
	
	return transaction(tasks);
}

// Get tasks formatted for the frontend (matching current API structure)
export function getFormattedTasks() {
	const tasks = getAllTasks();
	
	return tasks.map(task => ({
		id: task.id,
		content: task.content,
		completed: Boolean(task.completed),
		priority: task.priority,
		url: task.url,
		due: task.due_date ? {
			date: task.due_date,
			string: task.due_string
		} : null
	}));
}