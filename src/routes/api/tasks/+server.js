import { json } from '@sveltejs/kit';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { TODOIST_KEY } from '$env/static/private';
import { getFormattedTasks, getTaskCount, bulkUpsertTasks } from '$lib/db/tasks.js';
import { getDatabase } from '$lib/db/index.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const forceRefresh = url.searchParams.get('refresh') === 'true';
		
		// If not forcing refresh, try to load from cache first
		if (!forceRefresh) {
			const taskCount = getTaskCount();
			if (taskCount > 0) {
				// Load from cache and filter for due/overdue tasks
				const cachedTasks = getFormattedTasks();
				const filteredTasks = filterAndLimitTasks(cachedTasks);
				
				return json({
					success: true,
					tasks: filteredTasks,
					total: filteredTasks.length,
					fromCache: true
				});
			}
		}
		
		// Cache is empty or refresh requested - fetch from Todoist API
		const apiTasks = await fetchTasksFromTodoist();
		
		// Save to cache
		bulkUpsertTasks(apiTasks);
		
		// Update sync metadata
		const db = getDatabase();
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, record_count)
			VALUES (?, CURRENT_TIMESTAMP, ?)
		`);
		stmt.run('todoist_tasks', apiTasks.length);
		
		// Filter and return
		const filteredTasks = filterAndLimitTasks(apiTasks);
		
		return json({
			success: true,
			tasks: filteredTasks,
			total: filteredTasks.length,
			fromCache: false
		});
		
	} catch (error) {
		console.error('Error in tasks API:', error);
		
		// Try to return cached data as fallback
		try {
			const cachedTasks = getFormattedTasks();
			const filteredTasks = filterAndLimitTasks(cachedTasks);
			
			return json({
				success: true,
				tasks: filteredTasks,
				total: filteredTasks.length,
				fromCache: true,
				warning: 'Using cached data due to API error'
			});
		} catch (cacheError) {
			return json({ error: 'Failed to fetch tasks from Todoist and no cached data available' }, { status: 500 });
		}
	}
}

async function fetchTasksFromTodoist() {
	const api = new TodoistApi(TODOIST_KEY);
	
	// Get all tasks with pagination
	let allTasks = [];
	let cursor = null;
	
	do {
		const tasksResponse = await api.getTasks(cursor ? { cursor } : {});
		allTasks = allTasks.concat(tasksResponse.results || []);
		cursor = tasksResponse.nextCursor;
	} while (cursor);
	
	// Map Todoist tasks to our expected format
	return allTasks.map(task => ({
		id: task.id,
		content: task.content,
		completed: task.checked,
		priority: task.priority,
		url: task.url,
		due: task.due ? {
			date: task.due.date,
			string: task.due.string
		} : null
	}));
}

function filterAndLimitTasks(tasks) {
	// Filter tasks that are due today or overdue (must have a due date)
	const today = new Date().toISOString().split('T')[0];
	const dueTasks = tasks.filter(task => {
		if (!task.due) return false; // Exclude tasks without due dates
		return task.due.date <= today; // Include today and overdue tasks
	});

	// Take only the first 16 tasks to avoid cluttering the interface
	return dueTasks.slice(0, 16);
}