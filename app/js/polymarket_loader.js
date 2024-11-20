async function loadPolymarketData() {
	try {
		// Load Polymarket data
		const data = await d3.csv(
			"../../data/polymarket/polymarket-price-data-daily.csv"
		)

		// Parse the date using the correct format
		const parseDate = d3.timeParse("%m-%d-%Y %H:%M")

		// Process data for all candidates
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
		const processedBidenData = processData(data, "Joe Biden") // Added Biden

		// Render the graph
		renderPolymarketGraph({
			processedTrumpData,
			processedKamalaData,
			processedBidenData,
		})

		// Return the processed data
		return { processedTrumpData, processedKamalaData, processedBidenData }
	} catch (error) {
		console.error("Error loading Polymarket data:", error)
		return null
	}
}

function renderPolymarketGraph({
	processedTrumpData,
	processedKamalaData,
	processedBidenData,
}) {
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
				[
					...processedTrumpData,
					...processedKamalaData,
					...processedBidenData,
				],
				(d) => d.timestamp
			)
		)
		.range([0, width])

	const y = d3.scaleLinear().domain([0, 100]).range([height, 0])

	// Add axes and gridlines
	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0,${height})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(d3.timeWeek.every(1)) // Weekly ticks
				.tickFormat(d3.timeFormat("%b %d"))
		) // Format as "Jan 01"
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-45)") // Rotate labels for better readability

	svg.append("g")
		.attr("class", "y-axis")
		.attr("transform", `translate(${margin.left},0)`)
		.call(
			d3
				.axisLeft(y)
				.ticks(10)
				.tickFormat((d) => d + "%")
		)

	// Add x-axis label
	svg.append("text")
		.attr("class", "x-label")
		.attr("text-anchor", "middle")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 5)
		.text("Date")

	// Add y-axis label
	svg.append("text")
		.attr("class", "y-label")
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("y", -margin.left + 20)
		.attr("x", -height / 2)
		.text("Probability (%)")

	// Add CSS styles for the axes
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
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(10).tickSize(-height).tickFormat(""))
		.style("stroke-dasharray", "2,2")
		.style("opacity", 0.1)

	svg.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(""))
		.style("stroke-dasharray", "2,2")
		.style("opacity", 0.1)

	// Ensure we're showing the most recent data by adjusting the x-axis domain
	const allDates = [
		...processedTrumpData.map((d) => d.timestamp),
		...processedKamalaData.map((d) => d.timestamp),
		...processedBidenData.map((d) => d.timestamp),
	]

	const latestDate = new Date(Math.max(...allDates))
	const earliestDate = new Date(Math.min(...allDates))

	// Add one day to latest date to ensure we see all data
	latestDate.setDate(latestDate.getDate() + 1)

	x.domain([earliestDate, latestDate])

	// Update the x-axis with new domain
	svg.select(".x-axis").call(
		d3
			.axisBottom(x)
			.ticks(d3.timeWeek.every(1))
			.tickFormat(d3.timeFormat("%b %d"))
	)

	// Create and add lines
	const createLine = d3
		.line()
		.x((d) => x(d.timestamp))
		.y((d) => y(d.price_close))
		.defined((d) => d.price_close !== null)

	// Trump line (red)
	svg.append("path")
		.datum(processedTrumpData)
		.attr("class", "line trump")
		.attr("fill", "none")
		.attr("stroke", "red")
		.attr("stroke-width", 2)
		.attr("d", createLine)

	// Biden line (blue)
	svg.append("path")
		.datum(processedBidenData)
		.attr("class", "line biden")
		.attr("fill", "none")
		.attr("stroke", "blue")
		.attr("stroke-width", 2)
		.attr("d", createLine)

	// Harris line (purple)
	svg.append("path")
		.datum(processedKamalaData)
		.attr("class", "line kamala")
		.attr("fill", "none")
		.attr("stroke", "purple")
		.attr("stroke-width", 2)
		.attr("d", createLine)

	// Update hover functionality
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
			const bidenPoint =
				processedBidenData[bisect(processedBidenData, x0, 1)]

			if (trumpPoint || kamalaPoint || bidenPoint) {
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
                  Date: ${(
						trumpPoint ||
						kamalaPoint ||
						bidenPoint
					).timestamp.toLocaleDateString()}<br/>
                  Time: ${(
						trumpPoint ||
						kamalaPoint ||
						bidenPoint
					).timestamp.toLocaleTimeString()}<br/>
                  Trump: ${trumpPoint?.price_close?.toFixed(1) ?? "N/A"}%<br/>
                  Biden: ${bidenPoint?.price_close?.toFixed(1) ?? "N/A"}%<br/>
                  Harris: ${kamalaPoint?.price_close?.toFixed(1) ?? "N/A"}%
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

	// Add legend
	const legend = svg
		.append("g")
		.attr("class", "legend")
		.attr("transform", `translate(${width - 100}, 20)`)

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
	})
}
