export class MapVis {
	constructor(parentElement, statesData) {
		this.parentElement = parentElement
		this.statesData = statesData

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
		vis.margin = { top: 20, right: 20, bottom: 20, left: 20 }

		// Set dimensions
		vis.width =
			document.getElementById(vis.parentElement).getBoundingClientRect()
				.width -
			vis.margin.left -
			vis.margin.right
		vis.height = 400 - vis.margin.top - vis.margin.bottom

		// Create SVG
		vis.svg = d3
			.select("#" + vis.parentElement)
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
			.attr("fill", "#ddd")
			.attr("stroke", "white")
			.attr("stroke-width", 0.5)
			.on("mouseover", function (event, d) {
				d3.select(this).attr("fill", "#aaa")

				vis.tooltip
					.style("opacity", 1)
					.html(
						`<div style="background: white; padding: 10px; border-radius: 3px; border: 1px solid #ddd">
                      <strong>${d.properties.name}</strong>
                  </div>`
					)
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 10 + "px")
			})
			.on("mousemove", function (event) {
				vis.tooltip
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 10 + "px")
			})
			.on("mouseout", function () {
				d3.select(this).attr("fill", "#ddd")

				vis.tooltip.style("opacity", 0)
			})
	}

	updateDimensions() {
		let vis = this

		vis.width =
			document.getElementById(vis.parentElement).getBoundingClientRect()
				.width -
			vis.margin.left -
			vis.margin.right

		vis.zoom = Math.min(
			vis.width / vis.viewpoint.width,
			vis.height / vis.viewpoint.height
		)

		// Update SVG dimensions
		d3.select("#" + vis.parentElement + " svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)

		// Update map transform
		vis.map.attr(
			"transform",
			`scale(${vis.zoom} ${vis.zoom})translate(${
				(vis.width - vis.viewpoint.width * vis.zoom) / 2 / vis.zoom
			},${(vis.height - vis.viewpoint.height * vis.zoom) / 2 / vis.zoom})`
		)
	}
}
