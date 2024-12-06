export default class ArbitrageVisualization {
	constructor(containerId, { Graph, StackedGraph, ArbitrageSlider }) {
		this.container = d3.select(`#${containerId}`)
		this.margin = { top: 150, right: 50, bottom: 50, left: 60 }
		this.width = null
		this.height = 500 - this.margin.top - this.margin.bottom
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

		// Create slider container first (moved above table)
		section
			.append("div")
			.attr("class", "slider-container")
			.style("width", "100%")
			.style("margin-bottom", "20px")

		// Create info section as table
		section
			.append("div")
			.attr("class", "arbitrage-info")
			.style("width", "100%")
			.style("margin-bottom", "20px")
			.style("background-color", "#f5f5f5")
			.style("border-radius", "5px")
			.style("padding", "15px")

		// Create graphs container
		const graphs = section
			.append("div")
			.style("display", "flex")
			.style("gap", "20px")

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
			(containerWidth - this.margin.left - this.margin.right * 2 - 20) / 2

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

		// Update info section as a table
		const info = this.container.select(".arbitrage-info")
		if (!info.empty()) {
			info.html(`
				<table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
					<tr style="border-bottom: 1px solid #ddd;">
						<th style="width: 180px; padding: 8px; text-align: center;">Date & Time</th>
						<th style="width: 110px; padding: 8px; text-align: center;">DJT on Kalshi</th>
						<th style="width: 130px; padding: 8px; text-align: center;">KH on Polymarket</th>
						<th style="width: 100px; padding: 8px; text-align: center;">Total Cost</th>
						<th style="width: 120px; padding: 8px; text-align: center;">Potential Profit</th>
						<th style="width: 120px; padding: 8px; text-align: center;">Max Volume</th>
						<th style="width: 100px; padding: 8px; text-align: center;">Max Profit</th>
					</tr>
					<tr>
						<td style="padding: 8px; text-align: center;">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
						<td style="padding: 8px; text-align: center;">${dateData.djt_kalshi.toFixed(
							2
						)}¢</td>
						<td style="padding: 8px; text-align: center;">${dateData.kh_poly.toFixed(
							2
						)}¢</td>
						<td style="padding: 8px; text-align: center;">${(
							dateData.djt_kalshi + dateData.kh_poly
						).toFixed(2)}¢</td>
						<td style="padding: 8px; text-align: center;">${(
							100 -
							dateData.djt_kalshi -
							dateData.kh_poly
						).toFixed(2)}¢</td>
						<td style="padding: 8px; text-align: center;">${Math.min(
							dateData.volume_djt
						).toLocaleString()}</td>
						<td style="padding: 8px; text-align: center;">$${(
							((100 - dateData.djt_kalshi - dateData.kh_poly) *
								Math.min(dateData.volume_djt)) /
							100
						).toFixed(2)}</td>
					</tr>
				</table>
			`)
		}
	}
}
