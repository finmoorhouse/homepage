import { json } from '@sveltejs/kit';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { TODOIST_KEY } from '$env/static/private';

async function fetchTasksFromTodoist(filterQuery = null) {
	const api = new TodoistApi(TODOIST_KEY);

	let allTasks = [];
	let cursor = undefined;

	try {
		do {
			let response;
			if (filterQuery) {
				// Use getTasksByFilter for filtered queries
				response = await api.getTasksByFilter({ query: filterQuery, cursor: cursor || undefined });
			} else {
				// Use getTasks for fetching all tasks
				response = await api.getTasks(cursor ? { cursor } : undefined);
			}

			// Detect if response is array (simple) or object with results (paginated envelope)
			let pageTasks = [];
			let nextCursor = null;

			if (Array.isArray(response)) {
				pageTasks = response;
				nextCursor = null;
			} else if (response && response.results && Array.isArray(response.results)) {
				pageTasks = response.results;
				nextCursor = response.nextCursor;
			} else {
				// Unexpected format
				console.warn('Unexpected Todoist API response format:', response);
			}

			if (pageTasks.length > 0) {
				allTasks = allTasks.concat(pageTasks);
			}

			cursor = nextCursor;
		} while (cursor);

		// Map Todoist tasks to our expected format
		// Note: Debugging showed 'checked' property is present, 'isCompleted' was missing
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

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const all = url.searchParams.get('all') === 'true';

		console.log('Fetching tasks directly from Todoist API:', all ? 'ALL tasks' : 'filtered tasks');

		if (all) {
			// Fetch all tasks for caching
			const allTasks = await fetchTasksFromTodoist();
			console.log('Received from Todoist API:', allTasks.length, 'total tasks');

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
			// Use Todoist filter to only fetch today & overdue tasks
			const filteredTasks = await fetchTasksFromTodoist('today | overdue');
			console.log('Received from Todoist API:', filteredTasks.length, 'today/overdue tasks');

			// Still apply our limit
			const limitedTasks = filteredTasks.slice(0, 16);

			return json({
				tasks: limitedTasks,
				meta: {
					totalCount: filteredTasks.length,
					filteredCount: limitedTasks.length,
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