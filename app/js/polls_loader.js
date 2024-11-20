async function loadPolls() {
	// Load CSV data using D3
	const pollsData = await d3.csv(
		"data/polls/presidential_general_averages.csv"
	)

	// Filter and process the data
	const relevantPolls = pollsData
		.filter((poll) => {
			// Filter for national polls only and 2024 cycle
			if (poll.state !== "National") return false
			if (poll.cycle !== "2024") return false

			// Clean up candidate names for consistency
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

	// Update margins and dimensions to match other charts
	const margin = { top: 40, right: 30, bottom: 50, left: 60 }
	const width = 1100 - margin.left - margin.right
	const height = 600 - margin.top - margin.bottom

	// Remove any existing chart
	d3.select("#polls-chart").remove()

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
		.text("Polling Data")

	// Update scales
	const xScale = d3
		.scaleTime()
		.domain([new Date("2024-01-01"), new Date("2024-11-08")])
		.range([margin.left, width - margin.right])

	const yScale = d3.scaleLinear().domain([30, 60]).range([height, 0])

	// Update axes with new styling
	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0,${height})`)
		.call(
			d3
				.axisBottom(xScale)
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
				.axisLeft(yScale)
				.ticks(10)
				.tickFormat((d) => `${d}%`)
		)

	// Add gridlines
	svg.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(${margin.left},0)`)
		.call(
			d3
				.axisLeft(yScale)
				.ticks(10)
				.tickSize(-(width - margin.left - margin.right))
				.tickFormat("")
		)
		.style("stroke-dasharray", "2,2")
		.style("opacity", 0.1)

	// Add prominent 50% line
	svg.append("line")
		.attr("class", "fifty-percent-line")
		.attr("x1", margin.left)
		.attr("x2", width)
		.attr("y1", yScale(50))
		.attr("y2", yScale(50))
		.style("stroke", "#666")
		.style("stroke-width", "1px")
		.style("stroke-dasharray", "5,5")
		.style("opacity", 0.8)

	// Update line generator
	const line = d3
		.line()
		.x((d) => xScale(d.date))
		.y((d) => yScale(d.pct))
		.curve(d3.curveMonotoneX)

	// Split data by candidate
	const bidenPolls = relevantPolls.filter((d) => d.candidate === "Biden")
	const harrisPolls = relevantPolls.filter((d) => d.candidate === "Harris")
	const trumpPolls = relevantPolls.filter((d) => d.candidate === "Trump")

	// Draw lines with updated colors
	if (trumpPolls.length > 0) {
		svg.append("path")
			.datum(trumpPolls)
			.attr("class", "line trump")
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	if (bidenPolls.length > 0) {
		svg.append("path")
			.datum(bidenPolls)
			.attr("class", "line biden")
			.attr("fill", "none")
			.attr("stroke", "purple") // Changed to purple
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	if (harrisPolls.length > 0) {
		svg.append("path")
			.datum(harrisPolls)
			.attr("class", "line harris")
			.attr("fill", "none")
			.attr("stroke", "blue") // Changed to blue
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	// Add hover functionality with tooltip
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

	const bisect = d3.bisector((d) => d.date).left
	const verticalLine = svg
		.append("line")
		.attr("class", "vertical-line")
		.style("opacity", 0)
		.style("stroke", "gray")
		.style("stroke-dasharray", "4,4")

	svg.append("rect")
		.attr("width", width - margin.left - margin.right)
		.attr("height", height)
		.attr("transform", `translate(${margin.left},0)`)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mousemove", (event) => {
			const mouseX = d3.pointer(event)[0]
			const x0 = xScale.invert(mouseX + margin.left)

			const trumpPoint = trumpPolls[bisect(trumpPolls, x0, 1)]
			const bidenPoint = bidenPolls[bisect(bidenPolls, x0, 1)]
			const harrisPoint = harrisPolls[bisect(harrisPolls, x0, 1)]

			if (trumpPoint || bidenPoint || harrisPoint) {
				verticalLine
					.style("opacity", 1)
					.attr("x1", mouseX + margin.left)
					.attr("x2", mouseX + margin.left)
					.attr("y1", 0)
					.attr("y2", height)

				tooltip.transition().duration(50).style("opacity", 0.9)

				tooltip
					.html(
						`
					<div style="color: red">Trump: ${trumpPoint?.pct.toFixed(1) ?? "N/A"}%</div>
					<div style="color: purple">Biden: ${bidenPoint?.pct.toFixed(1) ?? "N/A"}%</div>
					<div style="color: blue">Harris: ${harrisPoint?.pct.toFixed(1) ?? "N/A"}%</div>
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

	// Update legend with new colors
	const legendData = [
		{ label: "Trump", color: "red" },
		{ label: "Biden", color: "purple" },
		{ label: "Harris", color: "blue" },
	]

	const legend = svg
		.append("g")
		.attr("class", "legend")
		.attr("transform", `translate(${width - 100}, 20)`)

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
