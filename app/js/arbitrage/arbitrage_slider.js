export default class ArbitrageSlider {
	constructor(container, data, onDateChange) {
		this.container = container
		this.data = data
		this.onDateChange = onDateChange
		this.slider = null
	}

	initialize() {
		const sliderContainer = this.container.select(".slider-container")
		const dates = this.data.map((d) => d.date)

		this.slider = sliderContainer
			.append("input")
			.attr("type", "range")
			.attr("min", 0)
			.attr("max", dates.length - 1)
			.attr("value", 0)
			.style("width", "100%")

		this.slider.on("input", () => {
			const dateIndex = +this.slider.node().value
			this.onDateChange(dates[dateIndex])
		})
	}
}
