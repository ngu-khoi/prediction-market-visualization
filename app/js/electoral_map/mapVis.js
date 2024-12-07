export default class MapVis {
	constructor(parentElement, statesData, polymarketData) {
		console.log("MapVis constructor called")

		this.parentElement = parentElement
		this.statesData = statesData
		this.polymarketData = polymarketData

		// State name to postal code mapping
		this.stateMapping = {
			Alabama: "AL",
			Alaska: "AK",
			Arizona: "AZ",
			Arkansas: "AR",
			California: "CA",
			Colorado: "CO",
			Connecticut: "CT",
			Delaware: "DE",
			"District of Columbia": "DC",
			Florida: "FL",
			Georgia: "GA",
			Hawaii: "HI",
			Idaho: "ID",
			Illinois: "IL",
			Indiana: "IN",
			Iowa: "IA",
			Kansas: "KS",
			Kentucky: "KY",
			Louisiana: "LA",
			Maine: "ME",
			Maryland: "MD",
			Massachusetts: "MA",
			Michigan: "MI",
			Minnesota: "MN",
			Mississippi: "MS",
			Missouri: "MO",
			Montana: "MT",
			Nebraska: "NE",
			Nevada: "NV",
			"New Hampshire": "NH",
			"New Jersey": "NJ",
			"New Mexico": "NM",
			"New York": "NY",
			"North Carolina": "NC",
			"North Dakota": "ND",
			Ohio: "OH",
			Oklahoma: "OK",
			Oregon: "OR",
			Pennsylvania: "PA",
			"Rhode Island": "RI",
			"South Carolina": "SC",
			"South Dakota": "SD",
			Tennessee: "TN",
			Texas: "TX",
			Utah: "UT",
			Vermont: "VT",
			Virginia: "VA",
			Washington: "WA",
			"West Virginia": "WV",
			Wisconsin: "WI",
			Wyoming: "WY",
		}

		// Create tooltip
		this.tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip")
			.attr("id", "mapTooltip")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("pointer-events", "none")

		this.initVis()
	}

	initVis() {
		let vis = this

		// Set margins
		vis.margin = { top: 50, right: 20, bottom: 20, left: 20 }

		// Create container div with relative positioning for the map
		d3.select("#" + vis.parentElement)
			.append("div")
			.attr("class", "map-container")
			.style("position", "relative")
			.style("min-height", "600px")

		// Set dimensions
		vis.width =
			document.getElementById(vis.parentElement).getBoundingClientRect()
				.width -
			vis.margin.left -
			vis.margin.right
		vis.height = 600 - vis.margin.top - vis.margin.bottom

		// Create SVG
		vis.svg = d3
			.select(".map-container")
			.append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr(
				"transform",
				`translate(${vis.margin.left}, ${vis.margin.top})`
			)

		// Set up viewpoint and zoom
		vis.viewpoint = { width: 975, height: 610 }
		vis.zoom = Math.min(
			vis.width / vis.viewpoint.width,
			vis.height / vis.viewpoint.height
		)

		// Create map group with zoom transform
		vis.map = vis.svg
			.append("g")
			.attr("class", "states")
			.attr(
				"transform",
				`scale(${vis.zoom} ${vis.zoom})translate(${
					(vis.width - vis.viewpoint.width * vis.zoom) / 2 / vis.zoom
				},${
					(vis.height - vis.viewpoint.height * vis.zoom) /
					2 /
					vis.zoom
				})`
			)

		// Create path generator
		vis.path = d3.geoPath()

		// Draw states
		vis.states = vis.map
			.selectAll(".state")
			.data(vis.statesData.features)
			.enter()
			.append("path")
			.attr("class", "state")
			.attr("d", vis.path)
			.attr("stroke", "white")
			.attr("stroke-width", 0.5)
	}

	updateVis(date) {
		console.log("MapVis updateVis called with date:", date)

		// Find previous day's date
		const [month, day, year] = date.split(" ")[0].split("-")
		const currentDate = new Date(year, month - 1, day)
		const previousDate = new Date(currentDate)
		previousDate.setDate(previousDate.getDate() - 1)
		const prevDateStr = `${String(previousDate.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(previousDate.getDate()).padStart(
			2,
			"0"
		)}-${previousDate.getFullYear()} 00:00`

		// Update state colors
		this.states
			.transition()
			.duration(100) // Faster transition for smoother slider movement
			.attr(
				"fill",
				function (d) {
					const stateName = d.properties.name
					const stateId = this.stateMapping[stateName]
					if (!stateId) return "#cccccc"

					const stateData = this.polymarketData[stateId]
					if (!stateData || !stateData.length) return "#cccccc"

					const dayData = stateData.find((day) => {
						const matches = day["Date (UTC)"] === date
						if (stateId === "AK") {
							console.log(
								`Comparing dates for AK: ${day["Date (UTC)"]} === ${date}: ${matches}`
							)
						}
						return matches
					})

					if (!dayData) return "#cccccc"

					const trumpOdds = parseFloat(dayData["Donald Trump"])
					if (stateId === "AK") {
						console.log(`Trump odds for AK on ${date}:`, trumpOdds)
					}

					if (trumpOdds > 0.5) {
						const intensity = (trumpOdds - 0.5) * 2
						return d3.interpolateReds(0.3 + intensity * 0.7)
					} else {
						const intensity = (0.5 - trumpOdds) * 2
						return d3.interpolateBlues(0.3 + intensity * 0.7)
					}
				}.bind(this)
			)

		// Remove existing trend indicators
		this.svg.selectAll(".trend-indicator").remove()

		// Add trend indicators
		this.states.each(
			function (d) {
				const stateName = d.properties.name
				const stateId = this.stateMapping[stateName]
				if (!stateId) return

				const stateData = this.polymarketData[stateId]
				if (!stateData || !stateData.length) return

				const currentData = stateData.find(
					(day) => day["Date (UTC)"] === date
				)
				const previousData = stateData.find(
					(day) => day["Date (UTC)"] === prevDateStr
				)

				if (!currentData || !previousData) return

				const currentTrump = parseFloat(currentData["Donald Trump"])
				const previousTrump = parseFloat(previousData["Donald Trump"])
				const change = currentTrump - previousTrump

				if (Math.abs(change) > 0.001) {
					const centroid = this.path.centroid(d)
					const color = change > 0 ? "#ff4444" : "#4444ff"
					const symbol = change > 0 ? "▲" : "▼"

					this.map
						.append("text")
						.attr("class", "trend-indicator")
						.attr("x", centroid[0])
						.attr("y", centroid[1])
						.attr("text-anchor", "middle")
						.attr("fill", color)
						.attr("font-size", `${12 / this.zoom}px`)
						.text(symbol + Math.abs(change * 100).toFixed(1) + "%")
				}
			}.bind(this)
		)

		// Update tooltips
		this.states
			.on(
				"mouseover",
				function (event, d) {
					const stateName = d.properties.name
					const stateId = this.stateMapping[stateName]
					const stateData = this.polymarketData[stateId]

					const dayData = stateData?.find((day) => {
						return day["Date (UTC)"] === date
					})

					let tooltipContent = `<div style="background: white; padding: 10px; border-radius: 3px; border: 1px solid #ddd">
						<strong>${stateName}</strong><br>`

					if (dayData) {
						tooltipContent += `Trump: ${(
							parseFloat(dayData["Donald Trump"]) * 100
						).toFixed(1)}%<br>`
						tooltipContent += `Harris: ${(
							parseFloat(dayData["Kamala Harris"]) * 100
						).toFixed(1)}%<br>`
						tooltipContent += `Other: ${(
							parseFloat(dayData["Other"]) * 100
						).toFixed(1)}%`
					} else {
						tooltipContent += `No data available for ${date}`
					}
					tooltipContent += "</div>"

					this.tooltip
						.style("opacity", 1)
						.html(tooltipContent)
						.style("left", event.pageX + 10 + "px")
						.style("top", event.pageY - 10 + "px")

					d3.select(event.currentTarget).style("opacity", 0.8)
				}.bind(this)
			)
			.on(
				"mousemove",
				function (event) {
					this.tooltip
						.style("left", event.pageX + 10 + "px")
						.style("top", event.pageY - 10 + "px")
				}.bind(this)
			)
			.on(
				"mouseout",
				function (event) {
					this.tooltip.style("opacity", 0)
					d3.select(event.currentTarget).style("opacity", 1)
				}.bind(this)
			)
	}

	updateTooltip(d, element) {
		let vis = this
		const stateData = vis.getStateData(d, vis.currentDate)

		// Get mouse position
		const [mouseX, mouseY] = d3.pointer(element, vis.container.node())

		// Format percentages with proper % symbol
		const trumpPct = stateData
			? `${(stateData.trump * 100).toFixed(1)}%`
			: "N/A"
		const harrisPct = stateData
			? `${(stateData.harris * 100).toFixed(1)}%`
			: "N/A"

		vis.tooltip
			.style("left", `${mouseX + 10}px`)
			.style("top", `${mouseY + 10}px`).html(`
				<h4>${d.properties.name}</h4>
				<p>Electoral Votes: ${vis.electoralVotes[d.properties.postal]}</p>
				<p>Trump: ${trumpPct}</p>
				<p>Harris: ${harrisPct}</p>
			`)
	}
}
