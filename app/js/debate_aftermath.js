class DebateAftermathViz {
	constructor() {
		this.container = d3.select("#debate-aftermath")
		this.currentStep = 0
		this.steps = [
			{
				xDomain: [new Date("2024-01-01"), new Date("2024-11-08")],
				annotation: "Polling trends throughout 2024",
				yDomain: [30, 60],
			},
			{
				xDomain: [new Date("2024-01-11"), new Date("2024-07-21")],
				annotation: "Biden maintained a steady lead in early polling",
				yDomain: [30, 60],
			},
			{
				xDomain: [new Date("2024-06-23"), new Date("2024-07-20")],
				annotation:
					"After the debate, Biden's support declined while Trump gained ground",
				yDomain: [36, 46],
			},
		]
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

		// Add annotation card container - now relative to vizContainer
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

		// Add chart container
		vizContainer
			.append("div")
			.attr("id", "debate-polls-chart")
			.attr("class", "chart-container")
			.style("height", "400px")
			.style("width", "100%")
			.style("margin-top", "150px")

		// Create steps container
		const stepsContainer = this.container
			.append("div")
			.attr("class", "debate-steps-container")
			.style("padding-top", "50vh")
			.style("padding-bottom", "50vh")

		// Add steps
		this.steps.forEach((step, i) => {
			stepsContainer
				.append("div")
				.attr("class", "debate-step")
				.style("height", "60vh") // Reduced height
				.style("opacity", "0")
				.html(step.annotation)
		})

		await this.createVisualization()
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
				threshold: 0.5,
				rootMargin: "-35% 0px -35% 0px",
			}
		)

		// Observe all steps
		this.container
			.node()
			.querySelectorAll(".debate-step")
			.forEach((step) => observer.observe(step))
	}

	async createVisualization() {
		// Load data
		const pollsData = await d3.csv(
			"data/polls/presidential_general_averages.csv"
		)
		this.pollsData = pollsData

		// Create visualization
		this.createPollsChart()
	}

	createPollsChart() {
		const container = d3.select("#debate-polls-chart")
		container.html("") // Clear any existing content

		// Process the polls data
		const relevantPolls = this.pollsData
			.filter((poll) => {
				if (poll.state !== "National") return false
				if (poll.cycle !== "2024") return false
				const candidate = poll.candidate || poll[0]
				return (
					candidate === "Biden" ||
					candidate === "Harris" ||
					candidate === "Trump"
				)
			})
			.map((poll) => ({
				date: new Date(poll.date || poll[1]),
				candidate: poll.candidate || poll[0],
				pct: +(
					poll.pct_trend_adjusted ||
					poll.pct_estimate ||
					poll[2] ||
					0
				),
			}))
			.sort((a, b) => a.date - b.date)

		// Setup dimensions
		const margin = { top: 40, right: 100, bottom: 50, left: 60 } // Increased right margin for legend
		const containerWidth = container.node().getBoundingClientRect().width
		const width = containerWidth - margin.left - margin.right
		const height = 400 - margin.top - margin.bottom

		// Create SVG
		const svg = container
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)

		// Create scales
		const xScale = d3
			.scaleTime()
			.domain([new Date("2024-01-01"), new Date("2024-11-08")])
			.range([0, width])

		const yScale = d3.scaleLinear().domain([30, 60]).range([height, 0])

		// Add axes with class names
		svg.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale))

		svg.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale))

		// Store dimensions and elements for later use
		this.width = width
		this.height = height
		this.margin = margin
		this.xScale = xScale
		this.yScale = yScale
		this.svg = svg
		this.relevantPolls = relevantPolls

		// Add annotation group
		this.annotationGroup = svg
			.append("g")
			.attr("class", "annotation-group")
			.attr("opacity", 0)

		this.annotationGroup
			.append("text")
			.attr("class", "annotation-text")
			.attr("x", width / 2)
			.attr("y", height / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("fill", "#333")
			.style("font-weight", "bold")

		// Create line generator
		const line = d3
			.line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.pct))
			.curve(d3.curveMonotoneX) // Added curve interpolation for smoother lines

		// Draw lines with stored references
		this.trumpLine = svg
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Trump"))
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", line)

		this.bidenLine = svg
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Biden"))
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("d", line)

		this.harrisLine = svg
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Harris"))
			.attr("fill", "none")
			.attr("stroke", "purple")
			.attr("stroke-width", 2)
			.attr("d", line)

		// Add legend
		const legend = svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${width + 10}, 0)`) // Positioned outside the chart

		const legendData = [
			{ label: "Trump", color: "red" },
			{ label: "Biden", color: "blue" },
			{ label: "Harris", color: "purple" },
		]

		legendData.forEach((d, i) => {
			const legendRow = legend
				.append("g")
				.attr("transform", `translate(0, ${i * 20})`)

			legendRow
				.append("line")
				.attr("x1", 0)
				.attr("x2", 20)
				.attr("stroke", d.color)
				.attr("stroke-width", 2)

			legendRow
				.append("text")
				.attr("x", 30)
				.attr("y", 5)
				.text(d.label)
				.style("font-size", "12px")
				.style("alignment-baseline", "middle")
		})
	}

	updateVisualization(stepIndex) {
		if (this.currentStep === stepIndex) return
		this.currentStep = stepIndex

		const step = this.steps[stepIndex]
		const t = d3.transition().duration(1500).ease(d3.easeCubicInOut)

		// Update x-axis domain
		this.xScale.domain(step.xDomain)

		// Update y-axis domain and transition
		this.yScale.domain(step.yDomain)

		// Update both axes with transition
		this.svg
			.select(".x-axis")
			.transition(t)
			.call(d3.axisBottom(this.xScale))

		this.svg.select(".y-axis").transition(t).call(d3.axisLeft(this.yScale))

		// Update line paths with transition
		const line = d3
			.line()
			.x((d) => this.xScale(d.date))
			.y((d) => this.yScale(d.pct))
			.curve(d3.curveMonotoneX)

		// Filter data for current domain
		const currentDomain = step.xDomain
		const filteredData = (candidate) =>
			this.relevantPolls
				.filter((d) => d.candidate === candidate)
				.filter(
					(d) =>
						d.date >= currentDomain[0] && d.date <= currentDomain[1]
				)

		this.trumpLine
			.datum(filteredData("Trump"))
			.transition(t)
			.attr("d", line)

		this.bidenLine
			.datum(filteredData("Biden"))
			.transition(t)
			.attr("d", line)

		this.harrisLine
			.datum(filteredData("Harris"))
			.transition(t)
			.attr("d", line)

		// Remove the old annotation group code since we're using the card now
		this.annotationGroup.remove()
	}
}
