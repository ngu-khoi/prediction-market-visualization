export default class StackedGraph {
	constructor(container, data, margin, height) {
		this.container = container
		this.data = data
		this.margin = margin
		this.height = height
	}

	create(
		width,
		id,
		title,
		price1Accessor,
		price2Accessor,
		label1,
		label2,
		yDomain
	) {
		const svg = this.container
			.append("div")
			.style("flex", "1")
			.append("svg")
			.attr("width", width + this.margin.left + this.margin.right)
			.attr("height", 750)
			.append("g")
			.attr(
				"transform",
				`translate(${this.margin.left},${this.margin.top})`
			)

		// Move title much higher
		svg.append("text")
			.attr("x", width / 2)
			.attr("y", -130)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-weight", "bold")
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

		// First draw the profit area (green, fills up to $1 line)
		const profitArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(0))
			.y1((d) => yScale(100)) // Fill only up to $1 line (100¢)

		svg.append("path")
			.datum(this.data)
			.attr("class", "profit-area")
			.attr("fill", "#BED9B9")
			.attr("opacity", 1)
			.attr("d", profitArea)

		// Then draw the loss area (red, below total cost line)
		const lossArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(0)) // Start from bottom
			.y1((d) => yScale(price1Accessor(d) + price2Accessor(d))) // Up to total cost line

		svg.append("path")
			.datum(this.data)
			.attr("class", "loss-area")
			.attr("fill", "#FFBEBB")
			.attr("opacity", 1)
			.attr("d", lossArea)

		// Add blue area below first line (at the front)
		const blueArea = d3
			.area()
			.x((d) => xScale(d.date))
			.y0((d) => yScale(0))
			.y1((d) => yScale(price1Accessor(d)))

		svg.append("path")
			.datum(this.data)
			.attr("class", "blue-area")
			.attr("fill", "#B3C6E7")
			.attr("opacity", 1)
			.attr("d", blueArea)

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
			.attr("transform", `translate(20, -110)`)

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
			.text("DJT on Kalshi Price")
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
			.text("Complement of KH on Polymarket (DJT on Polymarket)")
			.style("font-size", "12px")

		// Add profit area legend first
		legend
			.append("rect")
			.attr("x", 0)
			.attr("y", 50)
			.attr("width", 20)
			.attr("height", 20)
			.attr("fill", "#BED9B9")
			.attr("opacity", 1)

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 65)
			.text("Profit Area")
			.style("font-size", "12px")

		// Add loss area legend second
		legend
			.append("rect")
			.attr("x", 0)
			.attr("y", 75)
			.attr("width", 20)
			.attr("height", 20)
			.attr("fill", "#FFBEBB")
			.attr("opacity", 1)

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 90)
			.text("Loss Area")
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
}
