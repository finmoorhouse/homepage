import { json } from '@sveltejs/kit';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { TODOIST_KEY } from '$env/static/private';

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

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const all = url.searchParams.get('all') === 'true';
		
		console.log('Fetching tasks directly from Todoist API:', all ? 'ALL tasks' : 'filtered tasks');
		
		// Fetch all tasks from Todoist API
		const allTasks = await fetchTasksFromTodoist();
		console.log('Received from Todoist API:', allTasks.length, 'total tasks');
		
		if (all) {
			// Return all tasks for caching
			return json({
				tasks: allTasks,
				meta: {
					totalCount: allTasks.length,
					filteredCount: allTasks.length,
					source: 'todoist-direct',
					fetchedAll: true
				}
			});
		} else {
			// Return filtered tasks for display
			const filteredTasks = filterAndLimitTasks(allTasks);
			console.log('Filtered to', filteredTasks.length, 'due/overdue tasks');
			
			return json({
				tasks: filteredTasks,
				meta: {
					totalCount: allTasks.length,
					filteredCount: filteredTasks.length,
					source: 'todoist-direct',
					fetchedAll: false
				}
			});
		}
		
	} catch (error) {
		console.error('Error in direct tasks API:', error);
		return json({ 
			error: 'Failed to fetch tasks from Todoist',
			tasks: [],
			meta: { totalCount: 0, filteredCount: 0, source: 'error' }
		}, { status: 500 });
	}
}