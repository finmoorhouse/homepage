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

// Updated POST function
export async function POST(request) {
	console.log('Request started.');
	const formData = await request.request.json();
	const { word, definition } = formData;
	
	console.log('Word:', word);
	console.log('Definition:', definition);
	
	try {
	  const { data, error } = await supabase
		.from('words')
		.insert({ word, definition });
  
	  if (error) {
		console.error('Error adding word:', error);
		return new Response(JSON.stringify({ error: 'Failed to add word' }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json' },
		});
	  }
  
	  return new Response(JSON.stringify({ message: 'Word added successfully' }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	  });
	} catch (error) {
	  console.error('Error adding word:', error);
	  return new Response(JSON.stringify({ error: 'Internal server error' }), {
		status: 500,
		headers: { 'Content-Type': 'application/json' },
	  });
	}
  }