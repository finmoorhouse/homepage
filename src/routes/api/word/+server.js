import { supabase } from '$lib/supabaseClient';

export async function GET() {

	const response = await supabase.rpc('random_words');
	console.log('Supabase response:', response);
	const data = response.data;
	console.log('Supabase data:', data);
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
