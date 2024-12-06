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

		// Add Electoral Map import
		const [
			{ default: ElectoralMap },
			{ default: MapVis },
			{ default: Slider },
		] = await Promise.all([
			import("./electoral_map/electoralMap.js"),
			import("./electoral_map/mapVis.js"),
			import("./electoral_map/slider.js"),
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

		const [
			{ default: ArbitrageVisualization },
			{ default: Graph },
			{ default: StackedGraph },
			{ default: ArbitrageSlider },
		] = await Promise.all([
			import("./arbitrage/arbitrage.js"),
			import("./arbitrage/graph.js"),
			import("./arbitrage/stacked_graph.js"),
			import("./arbitrage/arbitrage_slider.js"),
		])

		return {
			// Debate aftermath and its components
			DebatePollingViz,
			DebatePolymarketViz,

			DebateAftermathViz,

			// Electoral Map
			ElectoralMap,
			MapVis,
			Slider,

			// Final visualizations (using actual class names)
			PollsVisualization,
			PolymarketVisualization,
			KalshiVisualization,
			ArbitrageVisualization,
			Graph,
			StackedGraph,
			ArbitrageSlider,
		}
	} catch (error) {
		console.error("Error loading modules:", error)
		throw error
	}
}

function initializeProgressIndicator() {
	const progressSteps = document.querySelectorAll(".progress-step")
	const sections = document.querySelectorAll("section.step")

	// Add click handlers to progress steps
	progressSteps.forEach((step) => {
		step.addEventListener("click", () => {
			const targetStep = step.dataset.step
			const targetSection = document.querySelector(
				`section[data-step="${targetStep}"]`
			)

			if (targetSection) {
				targetSection.scrollIntoView({
					behavior: "smooth",
					block: "start",
				})
			}
		})
	})

	// Create a new Intersection Observer
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const stepName = entry.target.dataset.step
					progressSteps.forEach((step) => {
						if (step.dataset.step === stepName) {
							step.classList.add("active")
						} else {
							step.classList.remove("active")
						}
					})
				}
			})
		},
		{
			threshold: 0.5,
			rootMargin: "0px",
		}
	)

	sections.forEach((section) => observer.observe(section))
}

document.addEventListener("DOMContentLoaded", async () => {
	try {
		// Initialize progress indicator
		initializeProgressIndicator()

		const modules = await loadModules()
		console.log("Loaded modules:", modules)

		// Initialize Electoral Map with required modules
		const electoralMap = new modules.ElectoralMap({
			MapVis: modules.MapVis,
			Slider: modules.Slider,
		})
		await electoralMap.initialize()

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

		const arbitrageViz = new modules.ArbitrageVisualization(
			"arbitrage-chart"
		)
		await arbitrageViz.initialize()

		// Add resize handler
		let resizeTimeout
		window.addEventListener("resize", () => {
			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(async () => {
				// Remove all SVGs and slider sections
				d3.selectAll(
					"#candlestick-chart svg, #kalshi-chart svg, #polymarket-chart svg, #electoral-map-container svg, .slider-section, #arbitrage-chart svg"
				).remove()

				// Reinitialize Electoral Map
				const newElectoralMap = new modules.ElectoralMap({
					MapVis: modules.MapVis,
					Slider: modules.Slider,
				})
				await newElectoralMap.initialize()

				// Reinitialize debate aftermath visualization
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

				const newArbitrageViz = new modules.ArbitrageVisualization(
					"arbitrage-chart"
				)
				await newArbitrageViz.initialize()
			}, 250)
		})
	} catch (error) {
		console.error("Error during initialization:", error)
	}
})
