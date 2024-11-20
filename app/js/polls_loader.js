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

	// Create polls chart container
	const margin = { top: 20, right: 100, bottom: 30, left: 40 }
	const width = document.getElementById("candlestick-chart").offsetWidth
	const height = 400

	// Remove any existing chart
	d3.select("#polls-chart").remove()

	const svg = d3
		.select("#candlestick-chart")
		.append("svg")
		.attr("width", width)
		.attr("height", height)

	// Create scales
	const xScale = d3
		.scaleTime()
		.domain(d3.extent(relevantPolls, (d) => d.date))
		.range([margin.left, width - margin.right])

	const yScale = d3
		.scaleLinear()
		.domain([30, 60]) // Adjusted to focus on relevant range
		.range([height - margin.bottom, margin.top])

	// Add axes
	svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(xScale))

	svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(yScale))

	// Create line generator
	const line = d3
		.line()
		.x((d) => xScale(d.date))
		.y((d) => yScale(d.pct))
		.curve(d3.curveMonotoneX) // Add smoothing

	// Split data by candidate
	const bidenPolls = relevantPolls.filter((d) => d.candidate === "Biden")
	const harrisPolls = relevantPolls.filter((d) => d.candidate === "Harris")
	const trumpPolls = relevantPolls.filter((d) => d.candidate === "Trump")

	// Draw lines for each candidate
	if (trumpPolls.length > 0) {
		svg.append("path")
			.datum(trumpPolls)
			.attr("class", "trump-line")
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	if (bidenPolls.length > 0) {
		svg.append("path")
			.datum(bidenPolls)
			.attr("class", "biden-line")
			.attr("fill", "none")
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	if (harrisPolls.length > 0) {
		svg.append("path")
			.datum(harrisPolls)
			.attr("class", "harris-line")
			.attr("fill", "none")
			.attr("stroke", "purple")
			.attr("stroke-width", 2)
			.attr("d", line)
	}

	// Add points with tooltips
	const addPoints = (data, color) => {
		svg.selectAll(`.point-${color}`)
			.data(data)
			.enter()
			.append("circle")
			.attr("class", `point-${color}`)
			.attr("cx", (d) => xScale(d.date))
			.attr("cy", (d) => yScale(d.pct))
			.attr("r", 3)
			.attr("fill", color)
			.append("title")
			.text(
				(d) =>
					`${d.candidate}: ${d.pct.toFixed(
						1
					)}%\n${d.date.toLocaleDateString()}`
			)
	}

	addPoints(trumpPolls, "red")
	addPoints(bidenPolls, "blue")
	addPoints(harrisPolls, "purple")

	// Add legend
	const legend = svg
		.append("g")
		.attr("class", "legend")
		.attr(
			"transform",
			`translate(${width - margin.right + 10}, ${margin.top})`
		)

	const legendItems = [
		{ label: "Trump", color: "red" },
		{ label: "Biden", color: "blue" },
		{ label: "Harris", color: "purple" },
	]

	legendItems.forEach((item, i) => {
		const legendGroup = legend
			.append("g")
			.attr("transform", `translate(0, ${i * 20})`)

		legendGroup
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 0)
			.attr("y2", 0)
			.attr("stroke", item.color)
			.attr("stroke-width", 2)

		legendGroup
			.append("text")
			.attr("x", 25)
			.attr("y", 5)
			.text(item.label)
			.style("font-size", "12px")
	})
}
