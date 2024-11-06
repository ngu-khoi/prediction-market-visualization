// Set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 30, left: 60 }
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

// Create two tooltip divs
const tooltip = d3
	.select("body")
	.append("div")
	.attr("class", "tooltip")
	.style("opacity", 0)

// Load both datasets
Promise.all([
	d3.csv("../../data/kalshi/PRES-2024-DJT_candlesticks.csv"),
	d3.csv("../../data/kalshi/PRES-2024-KH_candlesticks.csv"),
])
	.then(function ([trumpData, kamalaData]) {
		// Parse the dates and convert strings to numbers for both datasets
		const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S")

		const processData = (data) => {
			// Sort data by timestamp first
			data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

			data.forEach((d) => {
				d.timestamp = parseDate(d.timestamp)
				d.price_close = d.price_close ? +d.price_close : null
			})

			// Fill in gaps with last known value
			let lastValidPrice = null
			data.forEach((d) => {
				if (d.price_close === null && lastValidPrice !== null) {
					d.price_close = lastValidPrice
				} else if (d.price_close !== null) {
					lastValidPrice = d.price_close
				}
			})

			return data
		}

		trumpData = processData(trumpData)
		kamalaData = processData(kamalaData)

		// Combine data ranges for scaling
		const allData = [...trumpData, ...kamalaData]

		// Set the scales
		const x = d3
			.scaleTime()
			.domain(d3.extent(allData, (d) => d.timestamp))
			.range([0, width])

		const y = d3
			.scaleLinear()
			.domain([0, 100]) // Prediction markets typically range from 0-100
			.range([height, 0])

		// Add the axes
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(x))

		svg.append("g").attr("class", "axis").call(d3.axisLeft(y))

		// Add horizontal guide lines
		const guideLines = [0, 25, 50, 75, 100]
		svg.selectAll(".guide-line")
			.data(guideLines)
			.enter()
			.append("line")
			.attr("class", "guide-line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", (d) => y(d))
			.attr("y2", (d) => y(d))
			.style("stroke", "#ccc")
			.style("stroke-dasharray", "4,4")
			.style("opacity", 0.5)

		// Create line generators
		const trumpLine = d3
			.line()
			.x((d) => x(d.timestamp))
			.y((d) => y(d.price_close))
			.defined((d) => d.price_close !== null) // Skip null values

		const kamalaLine = d3
			.line()
			.x((d) => x(d.timestamp))
			.y((d) => y(d.price_close))
			.defined((d) => d.price_close !== null) // Skip null values

		// Add the lines
		svg.append("path")
			.datum(trumpData)
			.attr("class", "line trump")
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", trumpLine)

		svg.append("path")
			.datum(kamalaData)
			.attr("class", "line kamala")
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("d", kamalaLine)

		// Add hover functionality
		const bisect = d3.bisector((d) => d.timestamp).left

		// Add invisible overlay for mouse tracking
		const overlay = svg
			.append("rect")
			.attr("width", width)
			.attr("height", height)
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)

		// Add vertical line for hover
		const verticalLine = svg
			.append("line")
			.attr("class", "vertical-line")
			.style("opacity", 0)
			.style("stroke", "gray")
			.style("stroke-dasharray", "4,4")

		function mousemove(event) {
			const mouseX = d3.pointer(event)[0]
			const x0 = x.invert(mouseX)

			const trumpIndex = bisect(trumpData, x0, 1)
			const kamalaIndex = bisect(kamalaData, x0, 1)

			// Add bounds checking
			const trumpPoint =
				trumpIndex < trumpData.length
					? trumpData[trumpIndex]
					: trumpData[trumpData.length - 1]
			const kamalaPoint =
				kamalaIndex < kamalaData.length
					? kamalaData[kamalaIndex]
					: kamalaData[kamalaData.length - 1]

			// Only show tooltip if we have valid data
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
						`Date: ${trumpPoint.timestamp.toLocaleDateString()}<br/>
						Time: ${trumpPoint.timestamp.toLocaleTimeString()}<br/>
						Trump: ${
							trumpPoint.price_close
								? trumpPoint.price_close.toFixed(1)
								: "N/A"
						}%<br/>
						Kamala: ${
							kamalaPoint.price_close
								? kamalaPoint.price_close.toFixed(1)
								: "N/A"
						}%`
					)
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 28 + "px")
			}
		}

		function mouseout() {
			verticalLine.style("opacity", 0)
			tooltip.transition().duration(500).style("opacity", 0)
		}
	})
	.catch(function (error) {
		console.error("Error loading the CSV files:", error)
	})
