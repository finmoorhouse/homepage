export const actions = {
    default: async ({ request, fetch }) => {
      const formData = await request.formData();
      const data = Object.fromEntries(formData.entries());
  
      try {
        const response = await fetch('/api/word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
  
        if (!response.ok) {
          throw new Error('Failed to add word');
        }
  
        // Handle successful response
        console.log('Word added successfully');
      } catch (error) {
        // Handle error
        console.error('Error adding word:', error);
      }
    },
  };