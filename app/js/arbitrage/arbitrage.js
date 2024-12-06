export default class ArbitrageVisualization {
	constructor(containerId) {
		this.container = d3.select(`#${containerId}`)
		this.margin = { top: 80, right: 50, bottom: 50, left: 60 }
		this.width = null
		this.height = 400 - this.margin.top - this.margin.bottom
		this.data = null
		this.slider = null
		this.currentDate = null
	}

	async initialize() {
		await this.loadData()

		// Clear container and create structure
		this.container.html("")

		// Create single section
		const section = this.container
			.append("div")
			.attr("class", "arbitrage-section")
			.style("margin-bottom", "40px")

		// Create graphs container
		const graphs = section
			.append("div")
			.style("display", "flex")
			.style("justify-content", "space-between")
			.style("margin-bottom", "20px")

		// Create info and slider container
		section
			.append("div")
			.attr("class", "arbitrage-info")
			.style("margin", "20px 0")

		section
			.append("div")
			.attr("class", "slider-container")
			.style("width", "100%")

		// Create graphs
		this.createSection(graphs)
		this.createSlider()
		this.updateSection(this.data[0].date)
	}

	async loadData() {
		try {
			const [djtData, khData, polymarketData] = await Promise.all([
				d3.csv("data/kalshi/PRES-2024-DJT_candlesticks.csv"),
				d3.csv("data/kalshi/PRES-2024-KH_candlesticks.csv"),
				d3.csv("data/polymarket/polymarket-price-data-daily.csv"),
			])

			// Process and merge data
			this.data = djtData
				.map((djt) => {
					const date = new Date(djt.timestamp)
					const dateStr = date.toISOString().split("T")[0]

					const khMatch = khData.find(
						(k) => k.timestamp === djt.timestamp
					)
					const polyMatch = polymarketData.find((p) =>
						p["Date (UTC)"].startsWith(dateStr.slice(5))
					)

					return {
						date: date,
						djt_kalshi: +djt.price_mean,
						kh_kalshi: khMatch ? +khMatch.price_mean : null, // No transform for total cost
						djt_poly: polyMatch
							? +polyMatch["Donald Trump"] * 100
							: null,
						kh_poly: polyMatch
							? +polyMatch["Kamala Harris"] * 100
							: null, // No transform for total cost
						volume_djt: +djt.volume,
						volume_kh: khMatch ? +khMatch.volume : 0,
					}
				})
				.filter(
					(d) =>
						d.kh_kalshi !== null &&
						d.djt_poly !== null &&
						d.kh_poly !== null
				)
		} catch (error) {
			console.error("Error loading data:", error)
			throw error
		}
	}

	createSection(container) {
		const containerWidth = this.container
			.node()
			.getBoundingClientRect().width
		const graphWidth =
			(containerWidth - this.margin.left - this.margin.right * 3) / 2

		// Create comparison graph on left with transformed KH Poly value
		this.createGraph(
			container,
			graphWidth,
			"left",
			"DJT on Kalshi vs KH on Polymarket",
			(d) => d.djt_kalshi,
			(d) => 100 - d.kh_poly, // Transform KH Poly value for display only
			"DJT on Kalshi Price",
			"Complement of KH on Polymarket (DJT on Polymarket)",
			[0, 100]
		)

		// Create stacked cost graph on right with original values
		this.createStackedGraph(
			container,
			graphWidth,
			"right",
			"Total Cost",
			(d) => d.djt_kalshi,
			(d) => d.kh_poly, // Use original value for total cost
			"DJT Kalshi",
			"KH Poly",
			[0, 120]
		)
	}

	createGraph(
		container,
		width,
		id,
		title,
		price1Accessor,
		price2Accessor,
		label1,
		label2,
		yDomain
	) {
		const svg = container
			.append("div")
			.style("flex", "1")
			.append("svg")
			.attr("width", width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
			.attr(
				"transform",
				`translate(${this.margin.left},${this.margin.top})`
			)

		// Add title
		svg.append("text")
			.attr("x", width / 2)
			.attr("y", -60)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text(title)

		// Create scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(this.data, (d) => d.date))
			.range([0, width])

		const yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0])

		// First draw the profit area (green, below Poly KH)
		const profitArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(0)) // Start from bottom
			.y1((d) => yScale(price2Accessor(d))) // Up to Poly KH line

		svg.append("path")
			.datum(this.data)
			.attr("class", "profit-area")
			.attr("fill", "green")
			.attr("opacity", 0.3)
			.attr("d", profitArea)

		// Then draw the loss area (red, below DJT Kalshi)
		const lossArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(0)) // Start from bottom
			.y1((d) => yScale(price1Accessor(d))) // Up to DJT Kalshi line

		svg.append("path")
			.datum(this.data)
			.attr("class", "loss-area")
			.attr("fill", "red")
			.attr("opacity", 0.3)
			.attr("d", lossArea)

		// Finally draw the lines (they will be on top)
		const line = d3
			.line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.price))

		// Add DJT Kalshi line
		svg.append("path")
			.datum(
				this.data.map((d) => ({
					date: d.date,
					price: price1Accessor(d),
				}))
			)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 1.5)
			.attr("d", line)

		// Add Poly KH line
		svg.append("path")
			.datum(
				this.data.map((d) => ({
					date: d.date,
					price: price2Accessor(d),
				}))
			)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 1.5)
			.attr("d", line)

		// Add axes labels and 100¢ line
		svg.append("line")
			.attr("class", "hundred-line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", yScale(100))
			.attr("y2", yScale(100))
			.attr("stroke", "black")
			.attr("stroke-dasharray", "5,5")
			.attr("opacity", 0.5)

		svg.append("text")
			.attr("class", "hundred-label")
			.attr("x", width - 30)
			.attr("y", yScale(100) - 5)
			.text("$1.00")
			.style("font-size", "12px")

		// Update axes
		svg.append("g")
			.attr("transform", `translate(0,${this.height})`)
			.call(d3.axisBottom(xScale))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-65)")

		svg.append("g").call(d3.axisLeft(yScale).tickFormat((d) => d + "¢"))

		// Add y-axis label
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - this.margin.left)
			.attr("x", 0 - this.height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Price in Cents")

		// Update legend
		const legend = svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(20, -70)`)

		// Add legend for lines
		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 0)
			.attr("y2", 0)
			.style("stroke", "blue")

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 5)
			.text(label1)
			.style("font-size", "12px")

		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 25)
			.attr("y2", 25)
			.style("stroke", "red")

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 30)
			.text(label2)
			.style("font-size", "12px")

		// Add profit opportunity with more spacing
		legend
			.append("rect")
			.attr("x", 0)
			.attr("y", 50)
			.attr("width", 20)
			.attr("height", 20)
			.attr("fill", "green")
			.attr("opacity", 0.3)

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 65)
			.text("Profit Opportunity")
			.style("font-size", "12px")

		// Add vertical line for current date
		svg.append("line")
			.attr("class", `current-date-line-${id}`)
			.attr("stroke", "#666")
			.attr("stroke-width", 1)
			.attr("stroke-dasharray", "5,5")
			.attr("y1", 0)
			.attr("y2", this.height)
			.style("display", "none")

		return svg
	}

	createStackedGraph(
		container,
		width,
		id,
		title,
		price1Accessor,
		price2Accessor,
		label1,
		label2,
		yDomain
	) {
		const svg = container
			.append("div")
			.style("flex", "1")
			.append("svg")
			.attr("width", width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
			.attr(
				"transform",
				`translate(${this.margin.left},${this.margin.top})`
			)

		// Add title
		svg.append("text")
			.attr("x", width / 2)
			.attr("y", -60)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text(title)

		// Create scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(this.data, (d) => d.date))
			.range([0, width])

		const yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0])

		// Create stacked lines
		const line1 = d3
			.line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(price1Accessor(d)))

		const line2 = d3
			.line()
			.x((d) => xScale(d.date))
			.y((d) => yScale(price1Accessor(d) + price2Accessor(d)))

		// Add base line
		svg.append("path")
			.datum(this.data)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 1.5)
			.attr("d", line1)

		// Add stacked line
		svg.append("path")
			.datum(this.data)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 1.5)
			.attr("d", line2)

		// Create area generator for profit region
		const profitArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(100)) // Always start from $1 line
			.y1((d) => yScale(price1Accessor(d) + price2Accessor(d))) // Go to total cost

		svg.append("path")
			.datum(this.data)
			.attr("class", "profit-area")
			.attr("fill", (d) => {
				const total = price1Accessor(d) + price2Accessor(d)
				return total <= 100 ? "green" : "red" // Green when total cost < $1 (arbitrage opportunity)
			})
			.attr("opacity", 0.3)
			.attr("d", profitArea)

		// Add $1 line
		svg.append("line")
			.attr("class", "hundred-line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", yScale(100))
			.attr("y2", yScale(100))
			.attr("stroke", "black")
			.attr("stroke-dasharray", "5,5")
			.attr("opacity", 0.5)

		svg.append("text")
			.attr("class", "hundred-label")
			.attr("x", width - 30)
			.attr("y", yScale(100) - 5)
			.text("$1.00")
			.style("font-size", "12px")

		// Add axes
		svg.append("g")
			.attr("transform", `translate(0,${this.height})`)
			.call(d3.axisBottom(xScale))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-65)")

		svg.append("g").call(d3.axisLeft(yScale).tickFormat((d) => d + "¢"))

		// Add y-axis label
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - this.margin.left)
			.attr("x", 0 - this.height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Price in Cents")

		// Add legend
		const legend = svg
			.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(20, -70)`)

		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 0)
			.attr("y2", 0)
			.style("stroke", "blue")

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 5)
			.text(label1)
			.style("font-size", "12px")

		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 25)
			.attr("y2", 25)
			.style("stroke", "red")

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 30)
			.text("Total Cost")
			.style("font-size", "12px")

		// Add profit opportunity legend
		legend
			.append("rect")
			.attr("x", 0)
			.attr("y", 50)
			.attr("width", 20)
			.attr("height", 20)
			.attr("fill", "green")
			.attr("opacity", 0.3)

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 65)
			.text("Profit Opportunity")
			.style("font-size", "12px")

		// Add vertical line for current date
		svg.append("line")
			.attr("class", `current-date-line-${id}`)
			.attr("stroke", "#666")
			.attr("stroke-width", 1)
			.attr("stroke-dasharray", "5,5")
			.attr("y1", 0)
			.attr("y2", this.height)
			.style("display", "none")

		return svg
	}

	createSlider() {
		const sliderContainer = this.container.select(".slider-container")
		const dates = this.data.map((d) => d.date)

		this.slider = sliderContainer
			.append("input")
			.attr("type", "range")
			.attr("min", 0)
			.attr("max", dates.length - 1)
			.attr("value", 0)
			.style("width", "100%")

		this.slider.on("input", () => {
			const dateIndex = +this.slider.node().value
			this.updateSection(dates[dateIndex])
		})
	}

	updateSection(date) {
		const dateData = this.data.find(
			(d) => d.date.getTime() === date.getTime()
		)
		if (!dateData) return

		// Update vertical lines for section 1
		const containerWidth = this.container
			.node()
			.getBoundingClientRect().width
		const graphWidth =
			(containerWidth - this.margin.left - this.margin.right * 3) / 2
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(this.data, (d) => d.date))
			.range([0, graphWidth])

		this.container
			.selectAll(".current-date-line-left, .current-date-line-right")
			.attr("x1", xScale(date))
			.attr("x2", xScale(date))
			.style("display", "block")

		// Update info for section 1
		const info = this.container.select(".arbitrage-info")
		if (!info.empty()) {
			info.html(`
				<div style="text-align: center; margin-bottom: 5px;">
					<h4 style="margin: 0 0 5px 0">DJT Kalshi vs KH Polymarket - ${date.toLocaleDateString()}</h4>
					<p style="margin: 2px 0">DJT on Kalshi: ${dateData.djt_kalshi.toFixed(2)}¢</p>
					<p style="margin: 2px 0">KH on Polymarket: ${dateData.kh_poly.toFixed(2)}¢</p>
					<p style="margin: 2px 0">Total Cost: ${(
						dateData.djt_kalshi + dateData.kh_poly
					).toFixed(2)}¢</p>
					<p style="margin: 2px 0">Potential Profit: ${(
						100 -
						dateData.djt_kalshi -
						dateData.kh_poly
					).toFixed(2)}¢</p>
					<p style="margin: 2px 0">Max Volume: ${Math.min(
						dateData.volume_djt
					).toLocaleString()} contracts</p>
					<p style="margin: 2px 0">Max Profit: $${(
						((100 - dateData.djt_kalshi - dateData.kh_poly) *
							Math.min(dateData.volume_djt)) /
						100
					).toFixed(2)}</p>
				</div>
			`)
		}
	}
}
