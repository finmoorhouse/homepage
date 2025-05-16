import { QUOTATION_API_URL } from '$env/static/private'

const API_URL = QUOTATION_API_URL;

import { json } from '@sveltejs/kit';
/** @type {import('./$types').RequestHandler} */


export async function GET() {
	console.log(QUOTATION_API_URL);
	try {
	  // Fetch data from your Google Apps Script
	  const response = await fetch(API_URL);
	  
	  // Check if the fetch was successful
	  if (!response.ok) {
		console.error('Error fetching from Apps Script:', response.statusText);
		return json({ error: 'Failed to fetch quotation' }, { status: 500 });
	  }
	  
	  // Parse the JSON response
	  const data = await response.json();
	  
	  // Return the data as JSON
	  return json(data);
	} catch (error) {
	  console.error('Error in quotation API:', error);
	  return json({ error: 'Internal server error' }, { status: 500 });
	}
  }