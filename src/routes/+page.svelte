<script>
	let wordData = null;
	let weatherData = null;

	async function getWeather() {
		const city = 'Oxford';
		const response = await fetch(`/api/weather?city=${city}`);
		weatherData = await response.json();
	};

	async function getWord() {
		const response = await fetch('/api/word');
		wordData = await response.json();
	}
</script>

<h1>Homepage</h1>

<pre>
     *
    ***
   *****
  *******
 *********
***********
     |
</pre>

<button on:click={getWeather}>Get weather</button>
<button on:click={getWord}>Get word</button>

{#if weatherData}
	<h1>Weather in {weatherData.name}</h1>
	<p>Temperature: {weatherData.main.temp}°C</p>
	<p>Description: {weatherData.weather[0].description}</p>
{/if}

{#if wordData}
	<p>Word: {wordData}</p>
{/if}
