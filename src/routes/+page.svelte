<script>
	let wordData = null;
	let weatherData = null;

	async function getWeather() {
		const city = 'Oxford';
		const response = await fetch(`/api/weather?city=${city}`);
		weatherData = await response.json();
	}

	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
</script>

<h1>Homepage</h1>
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
	<button on:click={getWeather}>Get weather</button>
	{#if weatherData}
		<h3>Weather in {weatherData.name}</h3>
		<p>Temperature: {weatherData.main.temp}°C</p>
		<p>Description: {weatherData.weather[0].description}</p>
	{/if}
</div>

<style>
	button {
		margin: 10px;
	}

	div {
		margin: 20px;
		border-style: double;
		min-height: 200px;
		max-width: 600px;
	}
</style>
