export default class PollingVisualization {
	constructor(containerId) {
		this.container = d3.select(`#${containerId}`)
		this.pollsData = null
		this.width = null
		this.height = null
		this.margin = null
		this.xScale = null
		this.yScale = null
		this.svg = null
		this.relevantPolls = null
		this.annotationGroup = null
		this.trumpLine = null
		this.bidenLine = null
		this.harrisLine = null
	}

	async initialize() {
		// Load data
		const pollsData = await d3.csv(
			"data/polls/presidential_general_averages.csv"
		)
		this.pollsData = pollsData
		this.createPollsChart()
	}

	createPollsChart() {
		const container = this.container
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

		// Get width from the step-content container
		const stepContent = d3.select(".step-content")
		const containerWidth = stepContent.node().getBoundingClientRect().width
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
			.curve(d3.curveMonotoneX)

		// Add clipPath definition
		this.svg
			.append("defs")
			.append("clipPath")
			.attr("id", "clip-polls")
			.append("rect")
			.attr("width", width)
			.attr("height", height)
			.attr("x", 0)
			.attr("y", 0)

		// Add a group for the clipped content
		const chartArea = this.svg
			.append("g")
			.attr("clip-path", "url(#clip-polls)")

		// Move the lines into the clipped group
		this.trumpLine = chartArea
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Trump"))
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", line)

		this.bidenLine = chartArea
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Biden"))
			.attr("fill", "none")
			.attr("stroke", "purple")
			.attr("stroke-width", 2)
			.attr("d", line)

		this.harrisLine = chartArea
			.append("path")
			.datum(relevantPolls.filter((d) => d.candidate === "Harris"))
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("d", line)

		// Add legend
		this.legend = svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${width + 10}, 0)`)

		const legendData = [
			{ label: "Trump", color: "red" },
			{ label: "Biden", color: "purple" },
			{ label: "Harris", color: "blue" },
		]

		legendData.forEach((d, i) => {
			const legendRow = this.legend
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

	updateVisualization(step) {
		// Recalculate width based on current container size
		const containerRect = this.container.node().getBoundingClientRect()
		const newWidth =
			containerRect.width - this.margin.left - this.margin.right

		// Update SVG dimensions
		this.width = newWidth
		this.svg.attr("width", newWidth + this.margin.left + this.margin.right)

		// Update x scale range
		this.xScale.range([0, newWidth])

		// Update legend position
		this.svg
			.select(".legend")
			.attr("transform", `translate(${newWidth + 10}, 0)`)

		const oldXScale = this.xScale.copy()
		const oldYScale = this.yScale.copy()

		// Update domains
		this.xScale.domain(step.xDomain)
		this.yScale.domain(step.yDomain)

		const t = d3.transition().duration(1500).ease(d3.easeCubicInOut)

		// Handle debate line
		const debateLine = this.svg
			.selectAll(".debate-line")
			.data(step.showDebateLine ? [new Date("2024-06-27")] : [])

		// Remove debate line if not needed
		debateLine.exit().transition(t).style("opacity", 0).remove()

		// Add or update debate line
		const debateLineEnter = debateLine
			.enter()
			.append("line")
			.attr("class", "debate-line")
			.attr("y1", 0)
			.attr("y2", this.height)
			.style("stroke", "#666")
			.style("stroke-width", "2px")
			.style("stroke-dasharray", "6,3")
			.style("opacity", 0)

		// Merge and transition
		debateLine
			.merge(debateLineEnter)
			.transition(t)
			.attr("x1", (d) => this.xScale(d))
			.attr("x2", (d) => this.xScale(d))
			.style("opacity", 1)

		// Update axes with transition
		this.svg
			.select(".x-axis")
			.transition(t)
			.call(d3.axisBottom(this.xScale))

		this.svg.select(".y-axis").transition(t).call(d3.axisLeft(this.yScale))

		// Create line generators for old and new scales
		const oldLine = d3
			.line()
			.x((d) => oldXScale(d.date))
			.y((d) => oldYScale(d.pct))
			.curve(d3.curveMonotoneX)

		const newLine = d3
			.line()
			.x((d) => this.xScale(d.date))
			.y((d) => this.yScale(d.pct))
			.curve(d3.curveMonotoneX)

		// Function to update each line with proper transition
		const updateLine = (lineElement, candidate) => {
			// Filter data to only show points within the domain
			const allData = this.relevantPolls
				.filter((d) => d.candidate === candidate)
				.filter((d) => {
					const [start, end] = step.xDomain
					return d.date >= start && d.date <= end
				})

			// Start with the filtered dataset and current path
			lineElement.datum(allData).attr("d", oldLine)

			// Transition to the new view
			lineElement.transition(t).attr("d", newLine).style("opacity", 1)
		}

		// Update all lines
		updateLine(this.trumpLine, "Trump")
		updateLine(this.bidenLine, "Biden")
		updateLine(this.harrisLine, "Harris")

		// Remove the old annotation group
		this.annotationGroup.remove()
	}
}
