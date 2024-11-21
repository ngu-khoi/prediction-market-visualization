document.addEventListener("DOMContentLoaded", async () => {
	try {
		await loadVisualizations()

		// Initialize debate aftermath visualization
		const debateViz = new DebateAftermathViz()
		await debateViz.initialize()

		// Add resize handler
		let resizeTimeout
		window.addEventListener("resize", () => {
			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(async () => {
				// Clear existing charts
				d3.selectAll(
					"#candlestick-chart svg, #kalshi-chart svg, #polymarket-chart svg"
				).remove()
				// Reload visualizations
				await loadVisualizations()

				const newDebateViz = new DebateAftermathViz()
				await newDebateViz.initialize()
			}, 250) // Debounce resize events
		})
	} catch (error) {
		console.error("Error during initialization:", error)
	}
})

async function loadVisualizations() {
	// Load polls data
	await loadPolls()

	// Load and render Kalshi data
	const kalshiData = await loadKalshiData()

	// Load Polymarket data
	const polymarketData = await loadPolymarketData()
}
