import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { AUTH_PASSWORD } from '$env/static/private';
import { getSessionToken } from '$lib/auth.js';

export function load({ cookies }) {
	if (cookies.get('session') === getSessionToken()) {
		throw redirect(303, '/');
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password');

		if (password !== AUTH_PASSWORD) {
			return fail(401, { error: 'Invalid password' });
		}

		cookies.set('session', getSessionToken(), {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(303, '/');
	}
};
