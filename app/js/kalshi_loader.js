async function loadKalshiData() {
	try {
		// Load data
		const [trumpData, kamalaData] = await Promise.all([
			d3.csv("../../data/kalshi/PRES-2024-DJT_candlesticks.csv"),
			d3.csv("../../data/kalshi/PRES-2024-KH_candlesticks.csv"),
		])

		const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S")

		// Process data helper
		const processData = (data) => {
			data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
			let lastValidPrice = null
			return data.map((d) => {
				const price = d.price_close ? +d.price_close : lastValidPrice
				if (price !== null) lastValidPrice = price
				return {
					timestamp: parseDate(d.timestamp),
					price_close: price,
				}
			})
		}

		const processedTrumpData = processData(trumpData)
		const processedKamalaData = processData(kamalaData)

		// Render the graph
		renderKalshiGraph({ processedTrumpData, processedKamalaData })

		// Return the processed data in a standardized format
		return { processedTrumpData, processedKamalaData }
	} catch (error) {
		console.error("Error loading Kalshi data:", error)
		return null
	}
}

function renderKalshiGraph({ processedTrumpData, processedKamalaData }) {
	// Get the container dimensions
	const container = d3.select("#kalshi-chart")
	const containerWidth = container.node().getBoundingClientRect().width
	const containerHeight = container.node().getBoundingClientRect().height

	const margin = { top: 40, right: 30, bottom: 50, left: 60 }
	const width = containerWidth - margin.left - margin.right
	const height = containerHeight - margin.top - margin.bottom

	const svg = d3
		.select("#kalshi-chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`)

	// Add title
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", -10)
		.attr("text-anchor", "middle")
		.style("font-size", "16px")
		.style("text-decoration", "underline")
		.text("Kalshi Market Data")

	// Create tooltip
	const tooltip = d3
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

	// Set up scales
	const x = d3
		.scaleTime()
		.domain([new Date("2024-01-01"), new Date("2024-11-08")])
		.range([margin.left, width - margin.right])

	const y = d3.scaleLinear().domain([0, 1]).range([height, 0])

	// Add axes and gridlines
	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0,${height})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(d3.timeWeek.every(1))
				.tickFormat(d3.timeFormat("%b %d"))
		)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-45)")

	svg.append("g")
		.attr("class", "y-axis")
		.attr("transform", `translate(${margin.left},0)`)
		.call(
			d3
				.axisLeft(y)
				.ticks(10)
				.tickFormat((d) => `$${d.toFixed(2)}`)
		)

	// Add CSS styles for axes
	svg.selectAll(".x-axis path, .y-axis path")
		.style("stroke", "black")
		.style("stroke-width", "1px")

	svg.selectAll(".x-axis line, .y-axis line")
		.style("stroke", "black")
		.style("stroke-width", "0.5px")

	svg.selectAll(".x-axis text, .y-axis text")
		.style("font-size", "12px")
		.style("font-family", "Arial")

	// Add gridlines
	svg.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(${margin.left},0)`)
		.call(
			d3
				.axisLeft(y)
				.ticks(10)
				.tickSize(-(width - margin.left - margin.right))
				.tickFormat("")
		)
		.style("stroke-dasharray", "2,2")
		.style("opacity", 0.1)

	// Add prominent 50 cent line
	svg.append("line")
		.attr("class", "fifty-cent-line")
		.attr("x1", margin.left)
		.attr("x2", width)
		.attr("y1", y(0.5))
		.attr("y2", y(0.5))
		.style("stroke", "#666")
		.style("stroke-width", "1px")
		.style("stroke-dasharray", "5,5")
		.style("opacity", 0.8)

	// Create and add lines
	const createLine = d3
		.line()
		.x((d) => x(d.timestamp))
		.y((d) => y(d.price_close / 100))
		.defined((d) => d.price_close !== null)

	svg.append("path")
		.datum(processedTrumpData)
		.attr("class", "line trump")
		.attr("fill", "none")
		.attr("stroke", "red")
		.attr("stroke-width", 2)
		.attr("d", createLine)

	svg.append("path")
		.datum(processedKamalaData)
		.attr("class", "line kamala")
		.attr("fill", "none")
		.attr("stroke", "blue")
		.attr("stroke-width", 2)
		.attr("d", createLine)

	// Add hover functionality
	const bisect = d3.bisector((d) => d.timestamp).left
	const verticalLine = svg
		.append("line")
		.attr("class", "vertical-line")
		.style("opacity", 0)
		.style("stroke", "gray")
		.style("stroke-dasharray", "4,4")

	// Update hover functionality section
	svg.append("rect")
		.attr("width", width - margin.left - margin.right)
		.attr("height", height)
		.attr("transform", `translate(${margin.left},0)`)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mousemove", (event) => {
			const mouseX = d3.pointer(event)[0]
			const x0 = x.invert(mouseX + margin.left)

			const trumpPoint =
				processedTrumpData[bisect(processedTrumpData, x0, 1)]
			const kamalaPoint =
				processedKamalaData[bisect(processedKamalaData, x0, 1)]

			if (trumpPoint || kamalaPoint) {
				verticalLine
					.style("opacity", 1)
					.attr("x1", mouseX + margin.left)
					.attr("x2", mouseX + margin.left)
					.attr("y1", 0)
					.attr("y2", height)

				tooltip.transition().duration(50).style("opacity", 0.9)

				// Updated tooltip HTML to include date
				tooltip
					.html(
						`
                  <div style="margin-bottom: 5px">${d3.timeFormat("%B %d, %Y")(
						x0
					)}</div>
                  <div style="color: red">Trump: $${
						(trumpPoint?.price_close / 100)?.toFixed(2) ?? "N/A"
					}</div>
                  <div style="color: blue">Harris: $${
						(kamalaPoint?.price_close / 100)?.toFixed(2) ?? "N/A"
					}</div>
                  `
					)
					.style("left", event.pageX + 15 + "px")
					.style("top", event.pageY - 15 + "px")
			}
		})
		.on("mouseout", () => {
			verticalLine.style("opacity", 0)
			tooltip.transition().duration(200).style("opacity", 0)
		})

	// Update legend
	const legend = svg
		.append("g")
		.attr("class", "legend")
		.attr("transform", `translate(${width - 100}, 20)`)

	const legendData = [
		{ label: "Trump", color: "red" },
		{ label: "Harris", color: "blue" },
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
	})
}
