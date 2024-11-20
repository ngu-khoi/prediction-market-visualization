class DebateAftermathViz {
	constructor() {
		this.container = d3.select("#debate-aftermath")
	}

	async initialize() {
		// Create a simple container for the graphs
		this.container
			.append("div")
			.attr("id", "debate-polls-chart")
			.attr("class", "chart-container")
			.style("height", "400px") // Set explicit height
			.style("width", "100%") // Set explicit width

		// Create initial visualization
		await this.createVisualization()
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
		const margin = { top: 40, right: 30, bottom: 50, left: 60 }
		const width = 800 - margin.left - margin.right
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

		// Add axes
		svg.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale))

		svg.append("g").call(d3.axisLeft(yScale))

		// Create line generator
		const line = d3
			.line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.pct))

		// Split data by candidate
		const bidenPolls = relevantPolls.filter((d) => d.candidate === "Biden")
		const trumpPolls = relevantPolls.filter((d) => d.candidate === "Trump")
		const harrisPolls = relevantPolls.filter(
			(d) => d.candidate === "Harris"
		)

		// Draw lines
		svg.append("path")
			.datum(trumpPolls)
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", line)

		svg.append("path")
			.datum(bidenPolls)
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("d", line)

		svg.append("path")
			.datum(harrisPolls)
			.attr("fill", "none")
			.attr("stroke", "purple")
			.attr("stroke-width", 2)
			.attr("d", line)
	}
}
