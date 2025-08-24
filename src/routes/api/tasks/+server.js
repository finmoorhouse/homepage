import { json } from '@sveltejs/kit';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { TODOIST_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const api = new TodoistApi(TODOIST_KEY);
		
		// Get all tasks with pagination and filter server-side
		// (API filters don't seem to work reliably with TypeScript client)
		let allTasks = [];
		let cursor = null;
		
		do {
			const tasksResponse = await api.getTasks(cursor ? { cursor } : {});
			allTasks = allTasks.concat(tasksResponse.results || []);
			cursor = tasksResponse.nextCursor;
		} while (cursor);
		
		// Filter tasks that are due today or overdue (must have a due date)
		const today = new Date().toISOString().split('T')[0];
		const dueTasks = allTasks.filter(task => {
			if (!task.due) return false; // Exclude tasks without due dates
			return task.due.date <= today; // Include today and overdue tasks
		});

		// Take only the first 16 tasks to avoid cluttering the interface
		const limitedTasks = dueTasks.slice(0, 16);

		// Map Todoist tasks to our expected format
		const mappedTasks = limitedTasks.map(task => ({
			id: task.id,
			content: task.content,
			completed: task.checked,
			priority: task.priority,
			due: task.due ? {
				date: task.due.date,
				string: task.due.string
			} : null
		}));

		const response = {
			success: true,
			tasks: mappedTasks,
			total: mappedTasks.length
		};

		return json(response);
	} catch (error) {
		console.error('Error in tasks API:', error);
		return json({ error: 'Failed to fetch tasks from Todoist' }, { status: 500 });
	}
}