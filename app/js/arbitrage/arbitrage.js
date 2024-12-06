export default class ArbitrageVisualization {
	constructor(containerId, { Graph, StackedGraph, ArbitrageSlider }) {
		this.container = d3.select(`#${containerId}`)
		this.margin = { top: 120, right: 50, bottom: 50, left: 60 }
		this.width = null
		this.height = 700 - this.margin.top - this.margin.bottom
		this.data = null
		this.slider = null
		this.currentDate = null
		this.Graph = Graph
		this.StackedGraph = StackedGraph
		this.ArbitrageSlider = ArbitrageSlider
		this.leftGraph = null
		this.rightGraph = null
	}

	async initialize() {
		await this.loadData()

		// Clear container and create structure
		this.container.html("")

		// Create single section
		const section = this.container
			.append("div")
			.attr("class", "arbitrage-section")
			.style("margin-bottom", "40px")

		// Create graphs container
		const graphs = section
			.append("div")
			.style("display", "flex")
			.style("justify-content", "space-between")
			.style("margin-bottom", "20px")

		// Create info and slider container
		section
			.append("div")
			.attr("class", "arbitrage-info")
			.style("margin", "20px 0")

		section
			.append("div")
			.attr("class", "slider-container")
			.style("width", "100%")

		// Create graphs
		this.createSection(graphs)
		this.createSlider()
		this.updateSection(this.data[0].date)
	}

	async loadData() {
		try {
			const [djtData, khData, polymarketData] = await Promise.all([
				d3.csv("data/kalshi/PRES-2024-DJT_candlesticks.csv"),
				d3.csv("data/kalshi/PRES-2024-KH_candlesticks.csv"),
				d3.csv("data/polymarket/polymarket-price-data-daily.csv"),
			])

			// Process and merge data
			this.data = djtData
				.map((djt) => {
					const date = new Date(djt.timestamp)
					const dateStr = date.toISOString().split("T")[0]

					const khMatch = khData.find(
						(k) => k.timestamp === djt.timestamp
					)
					const polyMatch = polymarketData.find((p) =>
						p["Date (UTC)"].startsWith(dateStr.slice(5))
					)

					return {
						date: date,
						djt_kalshi: +djt.price_mean,
						kh_kalshi: khMatch ? +khMatch.price_mean : null,
						djt_poly: polyMatch
							? +polyMatch["Donald Trump"] * 100
							: null,
						kh_poly: polyMatch
							? +polyMatch["Kamala Harris"] * 100
							: null,
						volume_djt: +djt.volume,
						volume_kh: khMatch ? +khMatch.volume : 0,
					}
				})
				.filter(
					(d) =>
						d.kh_kalshi !== null &&
						d.djt_poly !== null &&
						d.kh_poly !== null
				)
		} catch (error) {
			console.error("Error loading data:", error)
			throw error
		}
	}

	createSection(container) {
		const containerWidth = this.container
			.node()
			.getBoundingClientRect().width
		const graphWidth =
			(containerWidth - this.margin.left - this.margin.right * 3) / 2

		// Create comparison graph on left with transformed KH Poly value
		this.leftGraph = new this.Graph(
			container,
			this.data,
			this.margin,
			this.height
		)
		this.leftGraph.create(
			graphWidth,
			"left",
			"DJT on Kalshi vs KH on Polymarket",
			(d) => d.djt_kalshi,
			(d) => 100 - d.kh_poly,
			"DJT on Kalshi Price",
			"Complement of KH on Polymarket (DJT on Polymarket)",
			[0, 100]
		)

		// Create stacked cost graph on right with original values
		this.rightGraph = new this.StackedGraph(
			container,
			this.data,
			this.margin,
			this.height
		)
		this.rightGraph.create(
			graphWidth,
			"right",
			"Total Cost",
			(d) => d.djt_kalshi,
			(d) => d.kh_poly,
			"DJT Kalshi",
			"KH Poly",
			[0, 120]
		)
	}

	createSlider() {
		this.slider = new this.ArbitrageSlider(
			this.container,
			this.data,
			(date) => this.updateSection(date)
		)
		this.slider.initialize()
	}

	updateSection(date) {
		const dateData = this.data.find(
			(d) => d.date.getTime() === date.getTime()
		)
		if (!dateData) return

		// Update vertical lines for section 1
		const containerWidth = this.container
			.node()
			.getBoundingClientRect().width
		const graphWidth =
			(containerWidth - this.margin.left - this.margin.right * 3) / 2
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(this.data, (d) => d.date))
			.range([0, graphWidth])

		this.container
			.selectAll(".current-date-line-left, .current-date-line-right")
			.attr("x1", xScale(date))
			.attr("x2", xScale(date))
			.style("display", "block")

		// Update info for section 1
		const info = this.container.select(".arbitrage-info")
		if (!info.empty()) {
			info.html(`
				<div style="text-align: center; margin-bottom: 5px;">
					<h4 style="margin: 0 0 5px 0">DJT Kalshi vs KH Polymarket - ${date.toLocaleDateString()}</h4>
					<p style="margin: 2px 0">DJT on Kalshi: ${dateData.djt_kalshi.toFixed(2)}¢</p>
					<p style="margin: 2px 0">KH on Polymarket: ${dateData.kh_poly.toFixed(2)}¢</p>
					<p style="margin: 2px 0">Total Cost: ${(
						dateData.djt_kalshi + dateData.kh_poly
					).toFixed(2)}¢</p>
					<p style="margin: 2px 0">Potential Profit: ${(
						100 -
						dateData.djt_kalshi -
						dateData.kh_poly
					).toFixed(2)}¢</p>
					<p style="margin: 2px 0">Max Volume: ${Math.min(
						dateData.volume_djt
					).toLocaleString()} contracts</p>
					<p style="margin: 2px 0">Max Profit: $${(
						((100 - dateData.djt_kalshi - dateData.kh_poly) *
							Math.min(dateData.volume_djt)) /
						100
					).toFixed(2)}</p>
				</div>
			`)
		}
	}
}
