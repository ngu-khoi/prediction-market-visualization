export default class DebateAftermathViz {
	constructor({ PollingVisualization, PolymarketVisualization } = {}) {
		if (!PollingVisualization) {
			throw new Error("PollingVisualization is required")
		}
		if (!PolymarketVisualization) {
			throw new Error("PolymarketVisualization is required")
		}
		this.container = d3.select("#debate-aftermath")
		this.currentStep = 0
		this.PollingVisualization = PollingVisualization
		this.PolymarketVisualization = PolymarketVisualization
		this.steps = [
			{
				xDomain: [new Date("2024-01-01"), new Date("2024-11-08")],
				annotation: "Presidential polling trends throughout 2024",
				yDomain: [30, 60],
				showDebateLine: false,
				showPolymarket: false,
			},
			{
				xDomain: [new Date("2024-01-11"), new Date("2024-07-21")],
				annotation:
					"Trump maintained a steady but small lead in early 2024 polling",
				yDomain: [30, 60],
				showDebateLine: false,
				showPolymarket: false,
			},
			{
				xDomain: [new Date("2024-01-11"), new Date("2024-07-21")],
				annotation:
					"The first presidential debate between Biden and Trump was held on June 27th",
				yDomain: [30, 60],
				showDebateLine: true,
				showPolymarket: false,
			},
			{
				xDomain: [new Date("2024-06-13"), new Date("2024-07-30")],
				annotation:
					"After a perceived poor performance in the debate, Biden's support declined while Trump's lead grew",
				yDomain: [36, 46],
				showDebateLine: true,
				showPolymarket: false,
			},
			{
				xDomain: [new Date("2024-06-13"), new Date("2024-07-30")],
				annotation:
					"Let's see how this compares to the Polymarket prediction market",
				yDomain: [36, 46],
				showDebateLine: true,
				showPolymarket: false,
				polymarketOpacity: 0,
			},
			{
				xDomain: [new Date("2024-01-01"), new Date("2024-11-08")],
				annotation:
					"Polymarket prediction market trend throughout 2024",
				yDomain: [30, 60],
				showDebateLine: false,
				showPolymarket: true,
				polymarketOpacity: 1,
				pollsOpacity: 0.2,
			},
			{
				xDomain: [new Date("2024-01-11"), new Date("2024-07-21")],
				annotation:
					"Trump maintained a larger lead in early 2024 polling, but the gap closed leading up to the debate",
				yDomain: [30, 60],
				showDebateLine: false,
				showPolymarket: true,
				polymarketOpacity: 1,
				pollsOpacity: 0.2,
			},
			{
				xDomain: [new Date("2024-01-11"), new Date("2024-07-21")],
				annotation:
					"The first presidential debate between Biden and Trump was held on June 27th",
				yDomain: [30, 60],
				showDebateLine: true,
				showPolymarket: true,
				polymarketOpacity: 1,
				pollsOpacity: 1,
			},
			{
				xDomain: [new Date("2024-06-13"), new Date("2024-07-30")],
				annotation:
					"Biden's support crashes in both polls and prediction markets; however, the Polymarket diverged by more than 40 cents compared to the polls divering by 2 percentage points",
				yDomain: [36, 46],
				showDebateLine: true,
				showPolymarket: true,
				polymarketOpacity: 1,
				pollsOpacity: 1,
			},
		]
		this.pollingViz = null
		this.polymarketViz = null
	}

	async initialize() {
		// Create containers
		const vizContainer = this.container
			.append("div")
			.attr("class", "sticky-container")
			.style("position", "sticky")
			.style("top", "0")
			.style("height", "100vh")
			.style("display", "flex")
			.style("flex-direction", "column")
			.style("background", "white")
			.style("z-index", "1")

		// Add annotation card container
		const annotationCard = vizContainer
			.append("div")
			.attr("class", "annotation-card")
			.style("position", "absolute")
			.style("background", "white")
			.style("padding", "20px")
			.style("border-radius", "8px")
			.style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
			.style("max-width", "500px")
			.style("width", "90%")
			.style("left", "50%")
			.style("top", "50px")
			.style("transform", "translateX(-50%)")
			.style("opacity", "0")
			.style("transition", "opacity 0.5s ease")
			.style("z-index", "1000")
			.style("pointer-events", "none")

		// Add charts container with flexbox
		const chartsContainer = vizContainer
			.append("div")
			.style("display", "flex")
			.style("gap", "20px")
			.style("margin-top", "150px")
			.style("width", "100%")

		// Add polling chart container
		chartsContainer
			.append("div")
			.attr("id", "debate-polls-chart")
			.attr("class", "chart-container")
			.style("height", "400px")
			.style("width", "100%") // Start at full width
			.style("transition", "width 0.5s ease") // Smooth transition

		// Add polymarket chart container
		chartsContainer
			.append("div")
			.attr("id", "debate-polymarket-chart")
			.attr("class", "chart-container")
			.style("height", "400px")
			.style("width", "0")
			.style("min-width", "0")
			.style("opacity", "0")
			.style("transition", "all 0.5s ease")
			.style("overflow", "hidden")

		// Create steps container with moderate space
		const stepsContainer = this.container
			.append("div")
			.attr("class", "debate-steps-container")
			.style("padding-top", "80vh")
			.style("padding-bottom", "80vh")

		// Add steps with moderate padding between them
		this.steps.forEach((step, i) => {
			stepsContainer
				.append("div")
				.attr("class", "debate-step")
				.style("height", "60vh")
				.style("margin-bottom", "70vh")
				.style("opacity", "0")
				.html(step.annotation)
		})

		// Initialize both visualizations
		this.pollingViz = new this.PollingVisualization("debate-polls-chart")
		await this.pollingViz.initialize()

		this.polymarketViz = new this.PolymarketVisualization(
			"debate-polymarket-chart"
		)
		await this.polymarketViz.initialize()

		// Initialize scroll handling
		this.initializeScrollHandling()
		this.initializeVizSectionObserver()
	}

	initializeVizSectionObserver() {
		const sectionObserver = new IntersectionObserver(
			(entries) => {
				const card = this.container.select(".annotation-card")

				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						// Hide card when outside visualization section
						card.style("opacity", "0")
					}
				})
			},
			{
				threshold: 0,
				rootMargin: "-1px 0px -1px 0px", // Trigger exactly at section boundaries
			}
		)

		// Observe the sticky container
		sectionObserver.observe(
			this.container.select(".sticky-container").node()
		)
	}

	initializeScrollHandling() {
		let lastActiveIndex = -1

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const step = entry.target
					const stepIndex = Array.from(
						this.container.node().querySelectorAll(".debate-step")
					).indexOf(step)

					// Only proceed if we're intersecting and it's a new step
					if (entry.isIntersecting && stepIndex !== lastActiveIndex) {
						lastActiveIndex = stepIndex

						// Check if sticky container is in view
						const stickyContainer = this.container
							.select(".sticky-container")
							.node()
						const containerRect =
							stickyContainer.getBoundingClientRect()
						const isContainerVisible =
							containerRect.top >= 0 &&
							containerRect.bottom <= window.innerHeight

						// Only show card if we're in the visualization section
						if (isContainerVisible) {
							this.updateVisualization(stepIndex)

							const card =
								this.container.select(".annotation-card")
							card.transition()
								.duration(300)
								.style("opacity", "0")
								.end()
								.then(() => {
									card.html(this.steps[stepIndex].annotation)
										.transition()
										.duration(300)
										.style("opacity", "1")
								})
						}
					}
				})
			},
			{
				root: null,
				threshold: 0.35,
				rootMargin: "-25% 0px",
			}
		)

		// Observe all steps
		this.container
			.node()
			.querySelectorAll(".debate-step")
			.forEach((step) => observer.observe(step))
	}

	updateVisualization(stepIndex) {
		if (this.currentStep === stepIndex) return
		const wasShowingPolymarket =
			this.currentStep !== null &&
			this.steps[this.currentStep].showPolymarket
		this.currentStep = stepIndex

		const step = this.steps[stepIndex]
		const polymarketChart = this.container.select(
			"#debate-polymarket-chart"
		)
		const pollsChart = this.container.select("#debate-polls-chart")

		// If showPolymarket hasn't changed, update immediately
		if (wasShowingPolymarket === step.showPolymarket) {
			if (step.showPolymarket) {
				this.pollingViz.updateVisualization(step)
				this.polymarketViz.updateVisualization(step)
			} else {
				this.pollingViz.updateVisualization(step)
			}
			return
		}

		// First update container widths with transition
		if (step.showPolymarket) {
			// Add transition to polls chart - faster transition
			pollsChart
				.style("transition", "width 300ms ease")
				.style("width", "50%")

			// Wait shorter time for transition to complete
			setTimeout(() => {
				// Force layout recalculation
				pollsChart.node().getBoundingClientRect()

				// Update polling visualization with the new width
				this.pollingViz.updateVisualization(step)

				// Reduced delay before showing polymarket
				setTimeout(() => {
					polymarketChart
						.style("display", "block")
						.style("opacity", "1")
						.style("width", "0")
						.style("transition", "width 300ms ease")

					// Force a reflow
					polymarketChart.node().offsetHeight

					// Transition polymarket width
					polymarketChart.style("width", "50%")

					// Update polymarket after its transition
					setTimeout(() => {
						this.polymarketViz.updateVisualization(step)
					}, 350)
				}, 400) // Reduced delay
			}, 350) // Reduced delay
		} else {
			// Reverse transition with same pattern
			polymarketChart
				.style("transition", "all 300ms ease")
				.style("width", "0")
				.style("opacity", "0")

			// Add transition to polls chart
			pollsChart
				.style("transition", "width 300ms ease")
				.style("width", "100%")

			// Wait for transitions to complete
			setTimeout(() => {
				// Hide polymarket
				polymarketChart.style("display", "none")

				// Force layout recalculation
				pollsChart.node().getBoundingClientRect()

				// Update polling visualization with the new width
				this.pollingViz.updateVisualization(step)
			}, 350)
		}
	}
}
