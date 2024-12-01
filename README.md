# 2024 Presidential Election Analysis
An interactive analysis of polling data and prediction markets during the 2024 US presidential election.

## Key Visualizations

### Electoral Map & Prediction Market Dashboard
Interactive visualization showing the final electoral college results alongside real-time prediction market prices from Polymarket and Kalshi. Users can explore state-by-state results and see how market prices evolved over time. Show any cool moments where the market was right or wrong.

TODO Specs
- [ ] Add slider to choose date (starting from whatever is available in the dataset)
- [ ] As slider moves, update the map to show the color/shade based on the odds for each state (darker = higher odds)
- [ ] Add on hover of each state a tooltip to show exact market price and electoral votes for each state
- [ ] Add zoom and pan functionality to the map

### Key Campaign Events Timeline
Scrollytelling narrative highlighting major campaign moments and their impact on both polls and prediction markets:
- The October presidential debate and its aftermath
- The January assassination attempt on candidate Trump
- Vice President Harris replacing Biden as Democratic nominee

TODO Specs
- [ ] Add Trump assassination attempt
- [ ] Make the caption more engaging and specific


### Arbitrage Analysis Tool
Interactive tool for analyzing price discrepancies between Kalshi and Polymarket prediction markets, revealing potential arbitrage opportunities throughout the campaign.

TODO Specs
- [ ] Add slider to choose date (starting from whatever is available in the dataset)
- [ ] On each date, show the volume and price for each market (Kalshi vs Polymarket)
- [ ] Show a quick calculation of the arbitrage opportunity based on the price and volume

## Data Sources

- Polling data: [2024 Presidential Election Polls](https://www.kaggle.com/datasets/downshift/russian-presidential-election-polls-2024-dataset/data)
- Polymarket data: [2024 US Election State Data](https://www.kaggle.com/datasets/pbizil/polymarket-2024-us-election-state-data)
- Kalshi market data: Internal API
- Electoral results: Associated Press

## Acknowledgments
Visualization design inspired by FiveThirtyEight's election coverage and D3.js examples.