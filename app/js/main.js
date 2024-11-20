document.addEventListener("DOMContentLoaded", async () => {
	try {
		// Clear any existing charts
		d3.select("#candlestick-chart").html("")
		d3.select("#kalshi-chart").html("")
		d3.select("#polymarket-chart").html("")

		// Load polls data
		await loadPolls()

		// Load and render Kalshi data
		const kalshiData = await loadKalshiData()
		if (!kalshiData) {
			console.error("Failed to load Kalshi data.")
		}

		// Load Polymarket data
		const polymarketData = await loadPolymarketData()
		if (!polymarketData) {
			console.error("Failed to load Polymarket data.")
		}
	} catch (error) {
		console.error("Error during initialization:", error)
	}
})
