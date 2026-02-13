import { redirect } from '@sveltejs/kit';
import { getSessionToken } from '$lib/auth.js';

export async function handle({ event, resolve }) {
	if (event.url.pathname === '/login') {
		return resolve(event);
	}

	const session = event.cookies.get('session');

	if (session !== getSessionToken()) {
		throw redirect(303, '/login');
	}

	return resolve(event);
}
