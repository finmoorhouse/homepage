<script>
	import { enhance } from '$app/forms';

	let wordData = null;
	let quotationData = null;
	let weatherData = null;
	let newWord = '';
	let formError = null;
	let formSuccessMessage = null;
	let formSuccess = false;
	let isSubmitting = false;

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

<div
	class="fixed bottom-4 right-4 m-5 p-5 border border-flexoki-ui min-h-[40px] max-w-[600px] w-xs"
>
	<h3>Add a Word</h3>
	<small
		><a class="text-flexoki-tx-2" href="https://docs.google.com/spreadsheets/" target="_blank"
			>Link to spreadsheet</a
		></small
	>

	{#if isSubmitting}
		<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
			<span class="text-flexoki-tx-2 text-sm mt-2">Waiting for response...</span>
		</div>
	{:else if formError}
		<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
			<span class="text-flexoki-re text-sm mt-2">{formError}</span>
		</div>
	{:else if formSuccess}
		<div class="bg-flexoki-bg-2 p-2 border border-flexoki-ui mt-2">
			<span class="text-flexoki-gr text-sm mt-2">Word added successfully!</span>
			<span class="text-flexoki-gr text-sm mt-2">
				<i>{formSuccessMessage.word} - {formSuccessMessage.definition}</i>
			</span>
		</div>
	{/if}

	<form
		method="POST"
		action="?/addWord"
		class="flex flex-col gap-4"
		use:enhance={() => {
			console.log('Form submission started');
			isSubmitting = true;
			return async ({ result }) => {
				console.log('Form submission completed:', result);
				isSubmitting = false;
				if (result.status === 200) {
					console.log('Setting success state');
					formSuccess = true;
					formSuccessMessage = result?.data || 'No definition given.';
					formError = null;
					newWord = '';
				} else if (result.data?.error) {
					console.log('Setting known error state');
					formError = result.data.error;
					formSuccess = false;
				} else {
					console.log('Setting unknown error state');
					formError = 'An unexpected error occurred';
					formSuccess = false;
				}
			};
		}}
	>
		<label for="word" class="text-md font-medium">Word</label>
		<input
			type="text"
			id="word"
			name="word"
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
