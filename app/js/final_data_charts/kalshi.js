export default class KalshiVisualization {
	constructor(containerId) {
		this.containerId = containerId
		this.margin = { top: 40, right: 30, bottom: 50, left: 60 }
		this.tooltip = null
		this.verticalLine = null
		this.parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S")
	}

	async initialize() {
		try {
			await this.loadData()
			this.setupDimensions()
			this.createSvg()
			this.createScales()
			this.createAxes()
			this.createGridlines()
			this.drawLines()
			this.createLegend()
			this.setupInteractivity()
		} catch (error) {
			console.error("Error initializing Kalshi visualization:", error)
		}
	}

	async loadData() {
		const [trumpData, kamalaData] = await Promise.all([
			d3.csv("../../data/kalshi/PRES-2024-DJT_candlesticks.csv"),
			d3.csv("../../data/kalshi/PRES-2024-KH_candlesticks.csv"),
		])

		this.data = {
			trump: this.processData(trumpData),
			kamala: this.processData(kamalaData),
		}
	}

	processData(data) {
		data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
		let lastValidPrice = null
		return data.map((d) => {
			const price = d.price_close ? +d.price_close : lastValidPrice
			if (price !== null) lastValidPrice = price
			return {
				timestamp: this.parseDate(d.timestamp),
				price_close: price,
			}
		})
	}

	setupDimensions() {
		const container = d3.select(`#${this.containerId}`)
		const containerRect = container.node().getBoundingClientRect()
		this.width = containerRect.width - this.margin.left - this.margin.right
		this.height =
			containerRect.height - this.margin.top - this.margin.bottom
	}

	createSvg() {
		this.svg = d3
			.select(`#${this.containerId}`)
			.append("svg")
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
			.attr(
				"transform",
				`translate(${this.margin.left},${this.margin.top})`
			)

		this.svg
			.append("text")
			.attr("x", this.width / 2)
			.attr("y", -10)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("text-decoration", "underline")
			.text("Kalshi Market Data")
	}

	createScales() {
		this.xScale = d3
			.scaleTime()
			.domain([new Date("2024-01-01"), new Date("2024-11-08")])
			.range([this.margin.left, this.width - this.margin.right])

		this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0])
	}

	createAxes() {
		// X-axis
		this.svg
			.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${this.height})`)
			.call(
				d3
					.axisBottom(this.xScale)
					.ticks(d3.timeWeek.every(1))
					.tickFormat(d3.timeFormat("%b %d"))
			)
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-45)")

		// Y-axis
		this.svg
			.append("g")
			.attr("class", "y-axis")
			.attr("transform", `translate(${this.margin.left},0)`)
			.call(
				d3
					.axisLeft(this.yScale)
					.ticks(10)
					.tickFormat((d) => `$${d.toFixed(2)}`)
			)

		// Style axes
		this.svg
			.selectAll(".x-axis path, .y-axis path")
			.style("stroke", "black")
			.style("stroke-width", "1px")

		this.svg
			.selectAll(".x-axis line, .y-axis line")
			.style("stroke", "black")
			.style("stroke-width", "0.5px")

		this.svg
			.selectAll(".x-axis text, .y-axis text")
			.style("font-size", "12px")
			.style("font-family", "Arial")
	}

	createGridlines() {
		// Add gridlines
		this.svg
			.append("g")
			.attr("class", "grid")
			.attr("transform", `translate(${this.margin.left},0)`)
			.call(
				d3
					.axisLeft(this.yScale)
					.ticks(10)
					.tickSize(
						-(this.width - this.margin.left - this.margin.right)
					)
					.tickFormat("")
			)
			.style("stroke-dasharray", "2,2")
			.style("opacity", 0.1)

		// Add 50 cent line
		this.svg
			.append("line")
			.attr("class", "fifty-cent-line")
			.attr("x1", this.margin.left)
			.attr("x2", this.width)
			.attr("y1", this.yScale(0.5))
			.attr("y2", this.yScale(0.5))
			.style("stroke", "#666")
			.style("stroke-width", "1px")
			.style("stroke-dasharray", "5,5")
			.style("opacity", 0.8)
	}

	drawLines() {
		const line = d3
			.line()
			.x((d) => this.xScale(d.timestamp))
			.y((d) => this.yScale(d.price_close / 100))
			.defined((d) => d.price_close !== null)

		const lineColors = {
			trump: "red",
			kamala: "blue",
		}

		Object.entries(lineColors).forEach(([candidate, color]) => {
			this.svg
				.append("path")
				.datum(this.data[candidate])
				.attr("class", `line ${candidate}`)
				.attr("fill", "none")
				.attr("stroke", color)
				.attr("stroke-width", 2)
				.attr("d", line)
		})
	}

	createLegend() {
		const legendData = [
			{ label: "Trump", color: "red" },
			{ label: "Harris", color: "blue" },
		]

		const legend = this.svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${this.width - 100}, 20)`)

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
		})
	}

	setupInteractivity() {
		this.createTooltip()
		this.setupHoverEffects()
	}

	createTooltip() {
		this.tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("background-color", "white")
			.style("border", "1px solid #ddd")
			.style("border-radius", "4px")
			.style("padding", "8px")
			.style("pointer-events", "none")
			.style("font-size", "12px")
			.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.1)")
			.style("z-index", "10")

		this.verticalLine = this.svg
			.append("line")
			.attr("class", "vertical-line")
			.style("opacity", 0)
			.style("stroke", "gray")
			.style("stroke-dasharray", "4,4")
	}

	setupHoverEffects() {
		const bisect = d3.bisector((d) => d.timestamp).left

		this.svg
			.append("rect")
			.attr("width", this.width - this.margin.left - this.margin.right)
			.attr("height", this.height)
			.attr("transform", `translate(${this.margin.left},0)`)
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mousemove", (event) => this.handleMouseMove(event, bisect))
			.on("mouseout", () => this.handleMouseOut())
	}

	handleMouseMove(event, bisect) {
		const mouseX = d3.pointer(event)[0]
		const x0 = this.xScale.invert(mouseX + this.margin.left)

		const points = {
			trump: this.data.trump[bisect(this.data.trump, x0, 1)],
			kamala: this.data.kamala[bisect(this.data.kamala, x0, 1)],
		}

		if (Object.values(points).some((p) => p)) {
			this.updateTooltip(mouseX, event, points)
		}
	}

	updateTooltip(mouseX, event, points) {
		this.verticalLine
			.style("opacity", 1)
			.attr("x1", mouseX + this.margin.left)
			.attr("x2", mouseX + this.margin.left)
			.attr("y1", 0)
			.attr("y2", this.height)

		const date = d3.timeFormat("%B %d, %Y")(
			this.xScale.invert(mouseX + this.margin.left)
		)

		this.tooltip
			.style("opacity", 0.9)
			.html(
				`
              <div style="font-weight: bold; margin-bottom: 5px">${date}</div>
              <div style="color: red">Trump: $${
					(points.trump?.price_close / 100)?.toFixed(2) ?? "N/A"
				}</div>
              <div style="color: blue">Harris: $${
					(points.kamala?.price_close / 100)?.toFixed(2) ?? "N/A"
				}</div>
          `
			)
			.style("left", event.pageX + 15 + "px")
			.style("top", event.pageY - 15 + "px")
	}

	handleMouseOut() {
		this.verticalLine.style("opacity", 0)
		this.tooltip.style("opacity", 0)
	}
}

// Initialize the visualization
async function loadKalshiData() {
	const viz = new KalshiVisualization("kalshi-chart")
	await viz.initialize()
}
