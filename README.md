# 2024 Presidential Election Analysis
An interactive analysis of polling data and prediction markets during the 2024 US presidential election.

By Matt Mansour, Brett Kim, Raunak Daga, and Khoi Nguyen  
CS1710 Final Project @ Harvard University

## How to Run
1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Start a local server (any of these methods will work):
   - Python: `python3 -m http.server`
   - Node.js: `npx http-server`
   - PHP: `php -S localhost:8000`

3. Open your browser and navigate to:
   - Python: `http://localhost:8000`
   - Node.js: `http://localhost:8080`
   - PHP: `http://localhost:8000`

Note: The app directory must be the root folder for the website to function properly.

## Key Visualizations

### Electoral Map & Prediction Market Dashboard
Interactive visualization showing the final electoral college results alongside real-time prediction market prices from Polymarket and Kalshi. Users can explore state-by-state results and see how market prices evolved over time. Show any cool or insightful moments where the market was right or wrong.

Features:
- Slider to choose date (starting from available dataset)
- Dynamic map updates showing odds for each state (darker = higher odds)
- Hover tooltips displaying market price and electoral votes per state

### Key Campaign Events Timeline
An innovative scrollytelling visualization that synchronizes narrative elements with data visualization. Unlike traditional timeline displays, this implementation uses scroll-driven animations and targeted highlighting to draw attention to specific data points and trends at precise moments. Key features include:

- Synchronized scrolling triggers that reveal specific portions of the data visualization
- Narrative elements that automatically highlight relevant data points
- Focus on critical moments like the June presidential debate
- Interactive elements that allow users to explore the relationship between events and market movements
- Targeted highlighting of specific data points and trends during key campaign moments
- Dynamic annotations that provide context and analysis at precise timestamps

The visualization specifically demonstrates how these pivotal moments impacted both polling data and prediction markets, allowing for direct comparison of their responsiveness to major events.

### Arbitrage Analysis Tool
Interactive tool for analyzing price discrepancies between Kalshi and Polymarket prediction markets, revealing potential arbitrage opportunities throughout the campaign.

Features:
- Date selection slider
- Volume and price comparison between markets
- Real-time arbitrage opportunity calculations

## Data Sources

- Polling data: [2024 Presidential Election Polls](https://www.kaggle.com/datasets/downshift/russian-presidential-election-polls-2024-dataset/data)
- Polymarket data: [2024 US Election State Data](https://www.kaggle.com/datasets/pbizil/polymarket-2024-us-election-state-data)
- Kalshi market data: [Kalshi Markets](https://kalshi.com/)
- Electoral results: Associated Press

## Acknowledgments
Visualization design inspired by FiveThirtyEight's election coverage and D3.js examples.