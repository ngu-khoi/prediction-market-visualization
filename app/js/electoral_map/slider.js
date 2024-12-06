export default class Slider {
	constructor(parentElement, electoralMap) {
		this.parentElement = parentElement
		this.electoralMap = electoralMap

		// Create fixed date range
		this.startDate = new Date("2024-03-29T00:00:00")
		this.endDate = new Date("2024-11-04T05:17:00")
		this.dates = this.generateDateRange(this.startDate, this.endDate)
		console.log("Available dates:", this.dates)

		this.initVis()
	}

	generateDateRange(start, end) {
		const dates = []
		let currentDate = new Date(start)

		while (currentDate <= end) {
			const day = String(currentDate.getDate()).padStart(2, "0")
			const month = String(currentDate.getMonth() + 1).padStart(2, "0")
			const year = currentDate.getFullYear()
			dates.push(`${month}-${day}-${year} 00:00`)
			currentDate.setDate(currentDate.getDate() + 1)
		}

		return dates
	}

	getCurrentDate() {
		return this.dates[0]
	}

	initVis() {
		let vis = this

		// Create a separate container for the slider section
		const sliderSection = d3
			.select("#" + vis.parentElement)
			.insert("div", ":first-child")
			.attr("class", "slider-section")

		// Add caption
		sliderSection
			.append("h3")
			.text("Election Odds by Date")
			.style("margin-top", "0")
			.style("margin-bottom", "15px")
			.style("font-size", "18px")
			.style("font-weight", "bold")
			.style("color", "#333")

		// Create slider container
		this.sliderContainer = sliderSection
			.append("div")
			.attr("class", "slider-container")

		// Create slider
		this.slider = this.sliderContainer
			.append("input")
			.attr("type", "range")
			.attr("min", 0)
			.attr("max", this.dates.length - 1)
			.attr("value", 0)

		// Add date display
		this.dateLabel = this.sliderContainer
			.append("div")
			.attr("class", "date-label")
			.text(this.dates[0])

		// Add slider event listener
		this.slider.on("input", function () {
			const dateIndex = parseInt(this.value)
			const selectedDate = vis.dates[dateIndex]
			vis.dateLabel.text(selectedDate)
			vis.electoralMap.onDateChange(selectedDate)
		})
	}
}
