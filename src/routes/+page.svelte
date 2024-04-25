<script>
	let wordData = null;
	let weatherData = null;
	let quoteData = null;

	async function getWeather() {
		const city = 'Oxford';
		const response = await fetch(`/api/weather?city=${city}`);
		weatherData = await response.json();
	}

	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
	async function getQuote() {
		const response = await fetch('/api/quotes');
		quoteData = await response.json();
	}
</script>

<h1>Homepage</h1>
<span style="display:inline-flex; border:1px solid black;">
	<div>
		<button on:click={getWord}>Get words</button>
		{#if wordData}
			<ul>
				{#each wordData as wordData}
					<li>
						<p><b>{wordData.word}</b>: {wordData.definition}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<div>
		<button on:click={getQuote}>Get quote</button>
		{#if quoteData}
			<ul>
				{#each quoteData as quoteData}
					<li>
						<p>
							“{quoteData.quote}” — {quoteData.who}, <a href={quoteData.link}>{quoteData.source}</a>
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div>
		<button on:click={getWeather}>Get weather</button>
		{#if weatherData}
			<h3>Weather in {weatherData.name}</h3>
			<p>Temperature: {weatherData.main.temp}°C</p>
			<p>Description: {weatherData.weather[0].description}</p>
		{/if}
	</div>
</span>

<style>
	button {
		margin: 10px;
	}

	div {
		margin: 20px;
		padding: 15px;
		border: 1px solid #222;
		min-height: 60px;
		max-width: 600px;
	}
</style>
