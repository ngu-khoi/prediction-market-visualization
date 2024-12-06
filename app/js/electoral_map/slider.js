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
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		]

		while (currentDate <= end) {
			const day = String(currentDate.getDate()).padStart(2, "0")
			const month = months[currentDate.getMonth()]
			const year = currentDate.getFullYear()
			// Format for display: "March 29, 2024"
			const displayDate = `${month} ${day}, ${year}`
			// Keep the original format for data matching
			const dataDate = `${String(currentDate.getMonth() + 1).padStart(
				2,
				"0"
			)}-${day}-${year} 00:00`

			dates.push({
				display: displayDate,
				data: dataDate,
			})
			currentDate.setDate(currentDate.getDate() + 1)
		}

		return dates
	}

	getCurrentDate() {
		return this.dates[0].data
	}

	initVis() {
		let vis = this
		vis.isPlaying = false // Add state for play/pause

		// Create a separate container for the slider section
		const sliderSection = d3
			.select("#" + vis.parentElement)
			.insert("div", ":first-child")
			.attr("class", "slider-section")

		// Update caption text
		sliderSection
			.append("h3")
			.text("Choose a date to see election odds for each state")
			.style("margin-top", "0")
			.style("margin-bottom", "25px")
			.style("font-size", "20px")
			.style("font-weight", "bold")
			.style("color", "#333")

		// Create slider container with controls
		const controlsContainer = sliderSection
			.append("div")
			.attr("class", "controls-container")

		// Create play button
		this.playButton = controlsContainer
			.append("button")
			.attr("class", "play-button")
			.html('<i class="fas fa-play"></i>')
			.on("click", function () {
				if (vis.isPlaying) {
					// Pause
					vis.isPlaying = false
					clearInterval(vis.playInterval)
					d3.select(this).html('<i class="fas fa-play"></i>')
				} else {
					// Play
					vis.isPlaying = true
					d3.select(this).html('<i class="fas fa-pause"></i>')
					vis.playInterval = setInterval(() => {
						let currentValue = parseInt(
							vis.slider.property("value")
						)
						if (currentValue >= vis.dates.length - 1) {
							// Reset to start when reaching the end
							currentValue = -1
						}
						vis.slider.property("value", currentValue + 1)
						const selectedDate = vis.dates[currentValue + 1]
						vis.dateLabel.text(selectedDate.display)
						vis.electoralMap.onDateChange(selectedDate.data)
					}, 100) // Update every 0.1 seconds
				}
			})

		// Create slider
		this.slider = controlsContainer
			.append("input")
			.attr("type", "range")
			.attr("min", 0)
			.attr("max", this.dates.length - 1)
			.attr("value", 0)

		// Add date display
		this.dateLabel = controlsContainer
			.append("div")
			.attr("class", "date-label")
			.text(this.dates[0].display)

		// Add slider event listener
		this.slider.on("input", function () {
			const dateIndex = parseInt(this.value)
			const selectedDate = vis.dates[dateIndex]
			vis.dateLabel.text(selectedDate.display)
			vis.electoralMap.onDateChange(selectedDate.data)
		})
	}
}
