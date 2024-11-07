document.addEventListener("DOMContentLoaded", async () => {
	try {
		// Load and render Kalshi data
		const kalshiData = await loadKalshiData()
		if (kalshiData) {
			// Rendering is now handled within loadKalshiData
		} else {
			console.error("Failed to load Kalshi data.")
		}

		// Load Polymarket data
		const polymarketData = await loadPolymarketData()
		if (polymarketData) {
			renderGraph(polymarketData)
		} else {
			console.error("Failed to load Polymarket data.")
		}

		// Load polls data
		await loadPolls()
	} catch (error) {
		console.error("Error during initialization:", error)
	}
})
