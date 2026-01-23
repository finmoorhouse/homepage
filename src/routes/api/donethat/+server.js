import { json } from '@sveltejs/kit';
import { DONETHAT_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		// Default to last 7 days
		const daysBack = parseInt(url.searchParams.get('days') || '7');

		const now = new Date();
		const to = now.getTime();
		const from = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).getTime();

		console.log('Fetching DoneThat report:', { from: new Date(from).toISOString(), to: new Date(to).toISOString() });

		const response = await fetch('https://api.donethat.ai/report', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': DONETHAT_KEY
			},
			body: JSON.stringify({
				dateRange: {
					from,
					to
				},
				aggregationLevel: 'day',
				includeCategories: true,
				includeProjects: true
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('DoneThat API error:', response.status, errorText);
			return json({
				error: `DoneThat API returned ${response.status}`,
				details: errorText
			}, { status: response.status });
		}

		const data = await response.json();
		console.log('DoneThat response: success=%s, rowCount=%s', data.success, data.rowCount);

		return json(data);

	} catch (error) {
		console.error('Error fetching DoneThat data:', error);
		return json({
			error: 'Failed to fetch DoneThat data',
			details: error.message
		}, { status: 500 });
	}
}
