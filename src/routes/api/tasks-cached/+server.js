import { json } from '@sveltejs/kit';
import { getFormattedTasks, getTaskCount } from '$lib/db/tasks.js';
import { getLastSyncInfo } from '$lib/db/sync.js';

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

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get tasks from SQLite cache
		const allTasks = getFormattedTasks();
		const filteredTasks = filterAndLimitTasks(allTasks);
		const taskCount = getTaskCount();
		const syncInfo = getLastSyncInfo('todoist_tasks');
		
		return json({
			tasks: filteredTasks,
			meta: {
				totalCount: taskCount,
				filteredCount: filteredTasks.length,
				lastSync: syncInfo?.last_sync || null,
				source: 'server-cache'
			}
		});
		
	} catch (error) {
		console.error('Error in cached tasks API:', error);
		return json(
			{ 
				error: 'Failed to fetch cached tasks',
				tasks: [],
				meta: { totalCount: 0, filteredCount: 0, lastSync: null, source: 'error' }
			}, 
			{ status: 500 }
		);
	}
}