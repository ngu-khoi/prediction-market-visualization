import { MapVis } from "./mapVis.js"

export default class ElectoralMap {
	constructor() {
		this.mapVis = null
	}

	async initialize() {
		try {
			console.log("Starting to initialize Electoral Map")

			// Updated path to be relative to server root
			const geoData = await d3.json(
				"/js/electoral_map/states-albers-10m.json"
			)
			console.log("Loaded geoData:", geoData)

			const states = topojson.feature(geoData, geoData.objects.states)
			console.log("Converted states:", states)

			this.mapVis = new MapVis("electoral-map-container", states)
			console.log("MapVis initialized")
		} catch (error) {
			console.error("Error loading map data:", error)
			console.error("Error details:", {
				message: error.message,
				stack: error.stack,
			})
		}
	}
}
