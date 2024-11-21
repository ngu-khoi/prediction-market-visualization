export default class PollsVisualization {
	constructor(containerId) {
		this.containerId = containerId
		this.margin = { top: 40, right: 30, bottom: 50, left: 60 }
		this.tooltip = null
		this.verticalLine = null
		this.pollsData = null
	}

	async initialize() {
		await this.loadData()
		this.setupDimensions()
		this.createSvg()
		this.createScales()
		this.createAxes()
		this.createGridlines()
		this.drawLines()
		this.createLegend()
		this.setupInteractivity()
	}

	async loadData() {
		const rawData = await d3.csv(
			"data/polls/presidential_general_averages.csv"
		)
		this.pollsData = this.processData(rawData)
	}

	processData(rawData) {
		return rawData
			.filter((poll) => {
				if (poll.state !== "National") return false
				if (poll.cycle !== "2024") return false
				const candidate = poll.candidate || poll[0]
				return ["Biden", "Harris", "Trump"].includes(candidate)
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
	}

	setupDimensions() {
		const container = d3.select(`#${this.containerId}`)
		const containerRect = container.node().getBoundingClientRect()
		this.width = containerRect.width - this.margin.left - this.margin.right
		this.height =
			containerRect.height - this.margin.top - this.margin.bottom
	}

	createSvg() {
		d3.select(`#${this.containerId}`).select("svg").remove()

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

		// Add title
		this.svg
			.append("text")
			.attr("x", this.width / 2)
			.attr("y", -10)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("text-decoration", "underline")
			.text("Polling Data")
	}

	createScales() {
		this.xScale = d3
			.scaleTime()
			.domain([new Date("2024-01-01"), new Date("2024-11-08")])
			.range([this.margin.left, this.width - this.margin.right])

		this.yScale = d3.scaleLinear().domain([30, 60]).range([this.height, 0])
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
					.tickFormat((d) => `${d}%`)
			)
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

		// Add 50% line
		this.svg
			.append("line")
			.attr("class", "fifty-percent-line")
			.attr("x1", this.margin.left)
			.attr("x2", this.width)
			.attr("y1", this.yScale(50))
			.attr("y2", this.yScale(50))
			.style("stroke", "#666")
			.style("stroke-width", "1px")
			.style("stroke-dasharray", "5,5")
			.style("opacity", 0.8)
	}

	drawLines() {
		const line = d3
			.line()
			.x((d) => this.xScale(d.date))
			.y((d) => this.yScale(d.pct))
			.curve(d3.curveMonotoneX)

		const candidateColors = {
			Trump: "red",
			Biden: "purple",
			Harris: "blue",
		}

		Object.entries(candidateColors).forEach(([candidate, color]) => {
			const candidateData = this.pollsData.filter(
				(d) => d.candidate === candidate
			)
			if (candidateData.length > 0) {
				this.svg
					.append("path")
					.datum(candidateData)
					.attr("class", `line ${candidate.toLowerCase()}`)
					.attr("fill", "none")
					.attr("stroke", color)
					.attr("stroke-width", 2)
					.attr("d", line)
			}
		})
	}

	createLegend() {
		const legendData = [
			{ label: "Trump", color: "red" },
			{ label: "Biden", color: "purple" },
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
		const bisect = d3.bisector((d) => d.date).left

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

		const candidateData = {
			Trump: this.pollsData.filter((d) => d.candidate === "Trump"),
			Biden: this.pollsData.filter((d) => d.candidate === "Biden"),
			Harris: this.pollsData.filter((d) => d.candidate === "Harris"),
		}

		const points = {}
		Object.entries(candidateData).forEach(([candidate, data]) => {
			if (data.length > 0) {
				const startDate = data[0].date
				points[candidate] =
					x0 >= startDate ? data[bisect(data, x0, 1)] : null
			}
		})

		this.updateTooltip(mouseX, event, points)
	}

	updateTooltip(mouseX, event, points) {
		if (Object.values(points).some((p) => p)) {
			this.verticalLine
				.style("opacity", 1)
				.attr("x1", mouseX + this.margin.left)
				.attr("x2", mouseX + this.margin.left)
				.attr("y1", 0)
				.attr("y2", this.height)

			const tooltipDate = d3.timeFormat("%B %d, %Y")(
				this.xScale.invert(mouseX + this.margin.left)
			)

			this.tooltip
				.style("opacity", 0.9)
				.html(
					`
                  <div style="font-weight: bold; margin-bottom: 5px">${tooltipDate}</div>
                  <div style="color: red">Trump: ${
						points.Trump?.pct.toFixed(1) ?? "N/A"
					}%</div>
                  <div style="color: purple">Biden: ${
						points.Biden?.pct.toFixed(1) ?? "N/A"
					}%</div>
                  <div style="color: blue">Harris: ${
						points.Harris?.pct.toFixed(1) ?? "N/A"
					}%</div>
              `
				)
				.style("left", event.pageX + 15 + "px")
				.style("top", event.pageY - 15 + "px")
		}
	}

	handleMouseOut() {
		this.verticalLine.style("opacity", 0)
		this.tooltip.style("opacity", 0)
	}
}

// Initialize the visualization
async function loadPolls() {
	const viz = new PollsVisualization("candlestick-chart")
	await viz.initialize()
}
