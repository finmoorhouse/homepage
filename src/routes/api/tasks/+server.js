import { json } from '@sveltejs/kit';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { TODOIST_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		// Fetch tasks directly from Todoist API
		const apiTasks = await fetchTasksFromTodoist();

		// Filter and return
		const filteredTasks = filterAndLimitTasks(apiTasks);

		return json({
			success: true,
			tasks: filteredTasks,
			total: filteredTasks.length
		});

	} catch (error) {
		console.error('Error in tasks API:', error);
		return json({ error: 'Failed to fetch tasks from Todoist' }, { status: 500 });
	}
}

async function fetchTasksFromTodoist() {
	const api = new TodoistApi(TODOIST_KEY);

	let allTasks = [];
	let cursor = undefined;

	try {
		do {
			// Pass cursor if it exists, otherwise undefined
			const response = await api.getTasks(cursor ? { cursor } : undefined);

			// Detect if response is array (simple) or object with results (paginated envelope)
			let pageTasks = [];
			let nextCursor = null;

			if (Array.isArray(response)) {
				pageTasks = response;
				nextCursor = null;
			} else if (response && response.results && Array.isArray(response.results)) {
				pageTasks = response.results;
				nextCursor = response.nextCursor;
			}

			if (pageTasks.length > 0) {
				allTasks = allTasks.concat(pageTasks);
			}

			cursor = nextCursor;
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
	} catch (error) {
		console.error('Error fetching tasks from Todoist:', error);
		throw error;
	}
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