/** @type {import('./$types').Actions} */
import { fail } from '@sveltejs/kit';
export const actions = {
	addWord: async ({ request, fetch }) => {
		console.log('Form submission received');
		const formData = await request.formData();
		const word = formData.get('word');
		console.log('Received word:', word);

		if (!word) {
			console.log('No word provided');
			return fail(400, {
				success: false,
				error: 'Word is required'
			});
		}

		try {
			console.log('Making API request to add word:', word);
			const response = await fetch('/api/word', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ word })
			});

			if (!response.ok) {
				let errorData;
				try {
					errorData = await response.json();
				} catch (e) {
					try {
						const responseBody = await response.text();
						console.log('API request failed with non-JSON response:', {
							status: response.status,
							body: responseBody
						});
						return fail(response.status, {
							success: false,
							error: 'Failed to add word'
						});
					} catch (textError) {
						console.error('Failed to read response body:', textError);
						return fail(response.status, {
							success: false,
							error: 'Failed to read response from server'
						});
					}
				}

				console.log('API request failed:', { status: response.status, error: errorData });
				return fail(response.status, {
					success: false,
					error: errorData.error || 'Failed to add word'
				});
			}

			const responseData = await response.json();
			console.log('Added word successfully:', { status: response.status, data: responseData });

			const result = {
				success: true,
				word: responseData.word,
				definition: responseData.definition
			};

			console.log('Returning success result:', result);
			return result;
		} catch (error) {
			console.error('Error adding word:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	addQuotation: async ({ request, fetch }) => {
		console.log('Quotation form submission received');
		const formData = await request.formData();
		const quotation = formData.get('quotation');
		const who = formData.get('who');
		const source = formData.get('source');
		const url = formData.get('url');
		console.log('Received quotation:', { quotation, who, source, url });

		if (!quotation) {
			console.log('No quotation provided');
			return fail(400, {
				success: false,
				error: 'Quotation is required'
			});
		}

		try {
			console.log('Making API request to add quotation');
			const response = await fetch('/api/quotation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					quotation: quotation.trim(),
					who: who?.trim() || '',
					source: source?.trim() || '',
					url: url?.trim() || ''
				})
			});

			if (!response.ok) {
				let errorData;
				try {
					errorData = await response.json();
				} catch (e) {
					try {
						const responseBody = await response.text();
						console.log('API request failed with non-JSON response:', {
							status: response.status,
							body: responseBody
						});
						return fail(response.status, {
							success: false,
							error: 'Failed to add quotation'
						});
					} catch (textError) {
						console.error('Failed to read response body:', textError);
						return fail(response.status, {
							success: false,
							error: 'Failed to read response from server'
						});
					}
				}

				console.log('API request failed:', { status: response.status, error: errorData });
				return fail(response.status, {
					success: false,
					error: errorData.error || 'Failed to add quotation'
				});
			}

			const responseData = await response.json();
			console.log('Added quotation successfully:', { status: response.status, data: responseData });

			const result = {
				success: true,
				quotation: responseData.quotation,
				who: responseData.who,
				source: responseData.source,
				url: responseData.url
			};

			console.log('Returning success result:', result);
			return result;
		} catch (error) {
			console.error('Error adding quotation:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};
