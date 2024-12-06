export default class ElectoralMap {
	constructor({ MapVis, Slider }) {
		this.MapVis = MapVis
		this.Slider = Slider
		this.mapVis = null
		this.slider = null
		this.stateData = {}
		this.currentDate = null
	}

	async loadStateData() {
		const states = [
			"AK",
			"AL",
			"AR",
			"AZ",
			"CA",
			"CO",
			"CT",
			"DC",
			"DE",
			"FL",
			"GA",
			"HI",
			"IA",
			"ID",
			"IL",
			"IN",
			"KS",
			"KY",
			"LA",
			"MA",
			"MD",
			"ME",
			"MI",
			"MN",
			"MO",
			"MS",
			"MT",
			"NC",
			"ND",
			"NE",
			"NH",
			"NJ",
			"NM",
			"NV",
			"NY",
			"OH",
			"OK",
			"OR",
			"PA",
			"RI",
			"SC",
			"SD",
			"TN",
			"TX",
			"UT",
			"VA",
			"VT",
			"WA",
			"WI",
			"WV",
			"WY",
		]

		try {
			for (const state of states) {
				try {
					const response = await d3.csv(
						`/data/polymarket/csv_day/${state}_daily.csv`
					)
					this.stateData[state] = response
				} catch (stateError) {
					console.warn(
						`Could not load data for ${state}:`,
						stateError
					)
					this.stateData[state] = []
				}
			}
		} catch (error) {
			console.error("Error loading state data:", error)
		}
	}

	async initialize() {
		try {
			await this.loadStateData()
			const geoData = await d3.json(
				"/js/electoral_map/states-albers-10m.json"
			)
			const states = topojson.feature(geoData, geoData.objects.states)

			// Initialize map visualization first
			this.mapVis = new this.MapVis(
				"electoral-map-container",
				states,
				this.stateData
			)

			// Initialize slider after map
			this.slider = new this.Slider("electoral-map-container", this)

			// Set initial date and update visualization
			this.currentDate = this.slider.getCurrentDate()
			this.wrangleData()
		} catch (error) {
			console.error("Error initializing map:", error)
			console.error(error.stack)
		}
	}

	wrangleData() {
		console.log("Wrangling data...") // Add this line
		console.log("MapVis instance in wrangleData:", this.mapVis) // Add this line
		if (!this.mapVis) {
			console.error("MapVis is null or undefined")
			return
		}
		if (typeof this.mapVis.updateVis !== "function") {
			console.error(
				"updateVis is not a function. Available methods:",
				Object.getOwnPropertyNames(Object.getPrototypeOf(this.mapVis))
			)
			return
		}
		this.mapVis.updateVis(this.currentDate)
	}

	onDateChange(newDate) {
		console.log("ElectoralMap received new date:", newDate)
		this.currentDate = newDate

		if (this.mapVis) {
			console.log("Updating MapVis with new date:", newDate)
			this.mapVis.updateVis(newDate)
		} else {
			console.error("MapVis not initialized")
		}
	}
}
