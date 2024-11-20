async function loadPolymarketData() {
	try {
		// Load Polymarket data
		const data = await d3.csv(
			"../../data/polymarket/polymarket-price-data-daily.csv"
		)

		// Parse the date using the correct format
		const parseDate = d3.timeParse("%m-%d-%Y %H:%M")

		// Process data for Donald Trump and Kamala Harris
		const processData = (data, candidate) => {
			return data
				.map((d) => {
					const timestamp = parseDate(d["Date (UTC)"])
					const price_close = +d[candidate] * 100 // Convert to percentage
					return { timestamp, price_close }
				})
				.filter((d) => d.timestamp && !isNaN(d.price_close))
		}

		const processedTrumpData = processData(data, "Donald Trump")
		const processedKamalaData = processData(data, "Kamala Harris")

		// Render the graph
		renderPolymarketGraph({ processedTrumpData, processedKamalaData })

		// Return the processed data in a standardized format
		return { processedTrumpData, processedKamalaData }
	} catch (error) {
		console.error("Error loading Polymarket data:", error)
		return null
	}
}

function renderPolymarketGraph({ processedTrumpData, processedKamalaData }) {
	const margin = { top: 40, right: 30, bottom: 50, left: 60 }
	const width = 1100 - margin.left - margin.right
	const height = 600 - margin.top - margin.bottom

	// Create the SVG container
	const svg = d3
		.select("#candlestick-chart")
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
		.text("Polymarket Betting Data")

	// Create tooltip
	const tooltip = d3
		.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)

	// Set up scales
	const x = d3
		.scaleTime()
		.domain(
			d3.extent(
				[...processedTrumpData, ...processedKamalaData],
				(d) => d.timestamp
			)
		)
		.range([0, width])

	const y = d3.scaleLinear().domain([0, 100]).range([height, 0])

	// Add axes and gridlines
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(d3.timeWeek.every(1))) // Weekly ticks

	svg.append("g").attr("class", "axis").call(d3.axisLeft(y))

	// Add x-axis label
	svg.append("text")
		.attr(
			"transform",
			`translate(${width / 2},${height + margin.bottom - 10})`
		)
		.style("text-anchor", "middle")
		.text("Date")

	// Add y-axis label
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - margin.left)
		.attr("x", 0 - height / 2)
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Price (cents)")

	// Add gridlines
	;[0, 25, 50, 75, 100].forEach((value) => {
		svg.append("line")
			.attr("class", "guide-line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", y(value))
			.attr("y2", y(value))
			.style("stroke", "#ccc")
			.style("stroke-dasharray", "4,4")
			.style("opacity", 0.5)
	})

	// Create and add lines
	const createLine = d3
		.line()
		.x((d) => x(d.timestamp))
		.y((d) => y(d.price_close))
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

	svg.append("rect")
		.attr("width", width)
		.attr("height", height)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mousemove", (event) => {
			const mouseX = d3.pointer(event)[0]
			const x0 = x.invert(mouseX)

			const trumpPoint =
				processedTrumpData[bisect(processedTrumpData, x0, 1)]
			const kamalaPoint =
				processedKamalaData[bisect(processedKamalaData, x0, 1)]

			if (trumpPoint && kamalaPoint) {
				verticalLine
					.style("opacity", 1)
					.attr("x1", mouseX)
					.attr("x2", mouseX)
					.attr("y1", 0)
					.attr("y2", height)

				tooltip.transition().duration(200).style("opacity", 0.9)
				tooltip
					.html(
						`
                  Date: ${trumpPoint.timestamp.toLocaleDateString()}<br/>
                  Time: ${trumpPoint.timestamp.toLocaleTimeString()}<br/>
                  Trump: ${trumpPoint.price_close?.toFixed(1) ?? "N/A"}%<br/>
                  Kamala: ${kamalaPoint.price_close?.toFixed(1) ?? "N/A"}%
              `
					)
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 28 + "px")
			}
		})
		.on("mouseout", () => {
			verticalLine.style("opacity", 0)
			tooltip.transition().duration(500).style("opacity", 0)
		})
}
