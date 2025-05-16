export async function GET(word) {
	const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
	const data = await response.json();

	// Access the definition from the response data
	const definition = data[0].meanings[0].definitions[0].definition;

	return definition;
}
