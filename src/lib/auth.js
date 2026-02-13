import { createHmac } from 'crypto';
import { AUTH_PASSWORD } from '$env/static/private';

export function getSessionToken() {
	return createHmac('sha256', AUTH_PASSWORD).update('homepage-session').digest('hex');
}
