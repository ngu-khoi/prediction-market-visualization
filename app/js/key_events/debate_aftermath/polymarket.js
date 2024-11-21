export default class PolymarketVisualization {
	constructor(containerId) {
		this.container = d3.select(`#${containerId}`)
		this.margin = { top: 40, right: 100, bottom: 50, left: 60 }
		this.width = null
		this.height = 400 - this.margin.top - this.margin.bottom
		this.svg = null
		this.xScale = null
		this.yScale = null
		this.parseDate = d3.timeParse("%m-%d-%Y %H:%M")
		this.data = null
		this.currentStep = null

		// Modify resize observer
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (entry.contentRect.width > 0 && this.data) {
				this.handleResize(entry.contentRect.width)
			}
		})
	}

	async initialize() {
		await this.loadData()
		// Start observing the container
		this.resizeObserver.observe(this.container.node())
	}

	handleResize(containerWidth) {
		this.width = containerWidth - this.margin.left - this.margin.right

		// Update SVG dimensions
		this.svg.attr(
			"width",
			this.width + this.margin.left + this.margin.right
		)

		// Update clipPath width
		this.svg.select("#clip-polymarket rect").attr("width", this.width)

		// Update x scale range
		this.xScale.range([0, this.width])

		// Update legend position
		this.svg
			.select(".legend")
			.attr("transform", `translate(${this.width + 10}, 0)`)

		// If we have a current step, update with current data
		if (this.currentStep) {
			this.updateVisualization(this.currentStep, false) // false = no transition
		}
	}

	rebuildChart() {
		const containerRect = this.container.node().getBoundingClientRect()
		if (containerRect.width === 0) return

		this.width = containerRect.width - this.margin.left - this.margin.right

		// Clear and rebuild
		this.container.html("")
		this.createChart()
	}

	async loadData() {
		const [dailyData, hourlyData] = await Promise.all([
			d3.csv("../../../data/polymarket/polymarket-price-data-daily.csv"),
			d3.csv("../../../data/polymarket/polymarket-price-data-hourly.csv"),
		])

		const candidates = {
			trump: "Donald Trump",
			biden: "Joe Biden",
			kamala: "Kamala Harris",
		}

		this.data = Object.entries(candidates).reduce((acc, [key, name]) => {
			acc[key] = this.processData(dailyData, hourlyData, name)
			return acc
		}, {})
	}

	processData(dailyData, hourlyData, candidate) {
		const processDataset = (dataset) =>
			dataset
				.map((d) => ({
					timestamp: this.parseDate(d["Date (UTC)"]),
					price: +d[candidate] * 100,
				}))
				.filter((d) => d.timestamp && !isNaN(d.price) && d.price > 0)

		return [
			...processDataset(dailyData),
			...processDataset(hourlyData),
		].sort((a, b) => a.timestamp - b.timestamp)
	}

	createChart() {
		if (!this.data || this.width <= 0) return

		// Create SVG
		this.svg = this.container
			.append("svg")
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
			.attr(
				"transform",
				`translate(${this.margin.left},${this.margin.top})`
			)

		// Add clipPath definition
		this.svg
			.append("defs")
			.append("clipPath")
			.attr("id", "clip-polymarket")
			.append("rect")
			.attr("width", this.width)
			.attr("height", this.height)
			.attr("x", 0)
			.attr("y", 0)

		// Add a group for the clipped content
		const chartArea = this.svg
			.append("g")
			.attr("clip-path", "url(#clip-polymarket)")

		// Create scales
		this.xScale = d3
			.scaleTime()
			.range([0, this.width])
			.domain([new Date("2024-01-01"), new Date("2024-11-08")])

		this.yScale = d3.scaleLinear().domain([0, 100]).range([this.height, 0])

		// Add axes
		this.svg
			.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${this.height})`)
			.call(d3.axisBottom(this.xScale))

		this.svg
			.append("g")
			.attr("class", "y-axis")
			.call(d3.axisLeft(this.yScale))

		// Create line generator
		const line = d3
			.line()
			.x((d) => this.xScale(d.timestamp))
			.y((d) => this.yScale(d.price))
			.curve(d3.curveMonotoneX)

		// Add lines for each candidate inside the clipped area
		const colors = { trump: "red", biden: "purple", kamala: "blue" }

		Object.entries(this.data).forEach(([candidate, data]) => {
			chartArea
				.append("path")
				.datum(data)
				.attr("class", `line ${candidate}`)
				.attr("fill", "none")
				.attr("stroke", colors[candidate])
				.attr("stroke-width", 2)
				.attr("d", line)
		})

		// Add legend
		const legend = this.svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${this.width + 10}, 0)`)

		const legendEntries = Object.entries(colors)
		legendEntries.forEach(([candidate, color], i) => {
			const g = legend
				.append("g")
				.attr("transform", `translate(0, ${i * 20})`)

			g.append("line")
				.attr("x1", 0)
				.attr("x2", 20)
				.attr("stroke", color)
				.attr("stroke-width", 2)

			g.append("text")
				.attr("x", 25)
				.attr("y", 5)
				.text(candidate.charAt(0).toUpperCase() + candidate.slice(1))
		})
	}

	updateVisualization(step, shouldTransition = true) {
		// Store current step
		this.currentStep = step

		// If container is hidden or zero width, wait for resize
		const containerRect = this.container.node().getBoundingClientRect()
		if (containerRect.width === 0) {
			console.log("Container width is 0, waiting for resize")
			return
		}

		// If no SVG exists yet, create it
		if (!this.svg) {
			this.rebuildChart()
		}

		const t = shouldTransition
			? d3.transition().duration(1500).ease(d3.easeCubicInOut)
			: d3.transition().duration(0)

		// Filter data first
		const filteredData = {}
		Object.entries(this.data).forEach(([candidate, data]) => {
			filteredData[candidate] = data.filter((d) => {
				const [start, end] = step.xDomain
				return d.timestamp >= start && d.timestamp <= end
			})
		})

		// Update x scale domain
		this.xScale.domain(step.xDomain)

		// Handle debate line inside the clipped area
		const chartArea = this.svg.select("[clip-path='url(#clip-polymarket)']")

		const debateLine = chartArea
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

		// Update lines with transition
		const line = d3
			.line()
			.x((d) => this.xScale(d.timestamp))
			.y((d) => this.yScale(d.price))
			.curve(d3.curveMonotoneX)

		Object.entries(filteredData).forEach(([candidate, data]) => {
			this.svg
				.select(`.line.${candidate}`)
				.datum(data)
				.transition(t)
				.attr("d", line)
		})
	}

	// Clean up when done
	destroy() {
		this.resizeObserver.disconnect()
	}
}
