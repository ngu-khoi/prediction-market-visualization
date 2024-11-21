async function loadModules() {
	try {
		// Debate Aftermath and its dependencies
		const [
			{ default: DebatePollingViz },
			{ default: DebatePolymarketViz },
			{ default: DebateAftermathViz },
		] = await Promise.all([
			import("./key_events/debate_aftermath/polling.js"),
			import("./key_events/debate_aftermath/polymarket.js"),
			import("./key_events/debate_aftermath/debate_aftermath.js"),
		])

		// Final visualizations (separate from debate aftermath)
		const [
			{ default: PollsVisualization },
			{ default: PolymarketVisualization },
			{ default: KalshiVisualization },
		] = await Promise.all([
			import("./final_data_charts/polling.js"),
			import("./final_data_charts/polymarket.js"),
			import("./final_data_charts/kalshi.js"),
		])

		return {
			// Debate aftermath and its components
			DebatePollingViz,
			DebatePolymarketViz,
			DebateAftermathViz,

			// Final visualizations (using actual class names)
			PollsVisualization,
			PolymarketVisualization,
			KalshiVisualization,
		}
	} catch (error) {
		console.error("Error loading modules:", error)
		throw error
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	try {
		const modules = await loadModules()
		console.log("Loaded modules:", modules)

		// Initialize debate aftermath visualization
		const debateViz = new modules.DebateAftermathViz({
			PollingVisualization: modules.DebatePollingViz,
			PolymarketVisualization: modules.DebatePolymarketViz,
		})
		await debateViz.initialize()

		// Initialize final visualizations with their correct container IDs
		const finalPollingViz = new modules.PollsVisualization(
			"candlestick-chart"
		)
		const finalPolymarketViz = new modules.PolymarketVisualization(
			"polymarket-chart"
		)
		const kalshiViz = new modules.KalshiVisualization("kalshi-chart")

		await Promise.all([
			finalPollingViz.initialize(),
			finalPolymarketViz.initialize(),
			kalshiViz.initialize(),
		]).catch((error) => {
			console.error("Error initializing final visualizations:", error)
		})

		// Add resize handler
		let resizeTimeout
		window.addEventListener("resize", () => {
			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(async () => {
				d3.selectAll(
					"#candlestick-chart svg, #kalshi-chart svg, #polymarket-chart svg"
				).remove()

				const newDebateViz = new modules.DebateAftermathViz({
					PollingVisualization: modules.DebatePollingViz,
					PolymarketVisualization: modules.DebatePolymarketViz,
				})
				await newDebateViz.initialize()

				// Reinitialize final visualizations
				const newFinalPollingViz = new modules.PollsVisualization(
					"candlestick-chart"
				)
				const newFinalPolymarketViz =
					new modules.PolymarketVisualization("polymarket-chart")
				const newKalshiViz = new modules.KalshiVisualization(
					"kalshi-chart"
				)

				await Promise.all([
					newFinalPollingViz.initialize(),
					newFinalPolymarketViz.initialize(),
					newKalshiViz.initialize(),
				]).catch((error) => {
					console.error(
						"Error reinitializing final visualizations:",
						error
					)
				})
			}, 250)
		})
	} catch (error) {
		console.error("Error during initialization:", error)
	}
})
