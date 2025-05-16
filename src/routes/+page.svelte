<script>
	let wordData = null;
	let quotationData = null;
	let weatherData = null;
	let newWord = ''; // Add this to store the input value

	async function getWeather() {
		const city = 'Oxford';
		const response = await fetch(`/api/weather?city=${city}`);
		weatherData = await response.json();
	}
	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
	async function getQuotation() {
		const response = await fetch('/api/quotation');
		quotationData = await response.json();
	}
	async function handleSubmit(event) {
		event.preventDefault();
		try {
			const response = await fetch('/api/word', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ word: newWord })
			});

			if (!response.ok) {
				throw new Error('Failed to add word');
			}

			// Clear the input after successful submission
			newWord = '';
			// Optionally refresh the word list
			await getWord();
		} catch (error) {
			console.error('Error adding word:', error);
		}
	}
</script>

<h1 class="font-extrabold text-2xl">Homepage</h1>
<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] inline w-2xl">
		{#if quotationData}
			<div class="flex flex-col items-center">
				<p class="text-lg italic mb-4 leading-relaxed max-w-2xl">{quotationData.quotation}</p>
				<p class="text-sm text-flexoki-black-2 font-medium">— {quotationData.who}</p>
			</div>
		{/if}
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getQuotation}>Get quotation</button
		>
	</div>
</span>
<span class="flex justify-center w-full">
	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] inline-block">
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getWord}>Get words</button
		>
		{#if wordData}
			<ul>
				<li>
					<p><b>{wordData.word}</b>: {wordData.definition}</p>
				</li>
			</ul>
		{/if}
	</div>

	<div class="m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] inline-block">
		<button
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
			on:click={getWeather}>Get weather</button
		>
		{#if weatherData}
			<h3>Weather in {weatherData.name}</h3>
			<p>Temperature: {weatherData.main.temp}°C</p>
			<p>Description: {weatherData.weather[0].description}</p>
		{/if}
	</div>
</span>

<div class="fixed bottom-4 right-4 m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px]">
	<h3>Add a Word</h3>
	<small ><a class="text-flexoki-tx-2" href='https://docs.google.com/spreadsheets/' target="_blank">Link to spreadsheet</a></small>
	<form on:submit={handleSubmit} class="flex flex-col gap-4">
		<label for="word" class="text-md font-medium ">Word</label>
		<input
			type="text"
			id="word"
			bind:value={newWord}
			required
			class="px-4 py-2 border border-flexoki-ui focus:outline-none focus:border-b-1 focus:border-b-flexoki-black"
		/>
		<button
			type="submit"
			class="px-6 py-2 text-flexoki-black border-1 border-flexoki-ui hover:border-flexoki-ui-2 cursor-pointer"
		>
			Submit
		</button>
	</form>
</div>
