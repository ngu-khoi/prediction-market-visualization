async function loadPolls() {
	// Load CSV data using D3
	const pollsData = await d3.csv("data/polls/polls/polls/president_polls.csv")

	// Filter and process the data
	const relevantPolls = pollsData
		.filter((poll) => poll.party === "REP" || poll.party === "DEM")
		.map((poll) => ({
			date: new Date(poll.end_date),
			candidate: poll.candidate_name,
			party: poll.party,
			pct: +poll.pct,
			pollster: poll.pollster,
		}))
		.sort((a, b) => a.date - b.date)

	// Create polls chart container
	const margin = { top: 20, right: 30, bottom: 30, left: 40 }
	const width = document.getElementById("candlestick-chart").offsetWidth
	const height = 300

	const svg = d3
		.select("#chart-container")
		.append("div")
		.attr("id", "polls-chart")
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
		.domain([0, 100])
		.range([height - margin.bottom, margin.top])

	// Add axes
	svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(xScale))

	svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(yScale))

	// Create line generators for each party
	const demLine = d3
		.line()
		.x((d) => xScale(d.date))
		.y((d) => yScale(d.pct))

	const repLine = d3
		.line()
		.x((d) => xScale(d.date))
		.y((d) => yScale(d.pct))

	// Draw lines for each party
	const demPolls = relevantPolls.filter((d) => d.party === "DEM")
	const repPolls = relevantPolls.filter((d) => d.party === "REP")

	svg.append("path")
		.datum(demPolls)
		.attr("class", "dem-line")
		.attr("fill", "none")
		.attr("stroke", "blue")
		.attr("stroke-width", 2)
		.attr("d", demLine)

	svg.append("path")
		.datum(repPolls)
		.attr("class", "rep-line")
		.attr("fill", "none")
		.attr("stroke", "red")
		.attr("stroke-width", 2)
		.attr("d", repLine)

	// Add points for individual polls
	svg.selectAll(".dem-point")
		.data(demPolls)
		.enter()
		.append("circle")
		.attr("class", "dem-point")
		.attr("cx", (d) => xScale(d.date))
		.attr("cy", (d) => yScale(d.pct))
		.attr("r", 3)
		.attr("fill", "blue")
		.append("title")
		.text((d) => `${d.pollster}: ${d.candidate} ${d.pct}%`)

	svg.selectAll(".rep-point")
		.data(repPolls)
		.enter()
		.append("circle")
		.attr("class", "rep-point")
		.attr("cx", (d) => xScale(d.date))
		.attr("cy", (d) => yScale(d.pct))
		.attr("r", 3)
		.attr("fill", "red")
		.append("title")
		.text((d) => `${d.pollster}: ${d.candidate} ${d.pct}%`)
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", loadPolls)
