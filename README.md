# Dehesa-Index
Dehesa Index


## Automated News Pipeline

Dehesa Index now maintains an automated agricultural market-news pipeline:

RSS/Atom -> normalize -> deduplicate -> classify -> relevance score -> data/news.json -> js/news-index.js

- Sources currently queried: Reuters, Associated Press, AFP, EFE, Bloomberg, Financial Times, Wall Street Journal, CNBC, POLITICO, Euractiv, Xinhua, DTN, AgWeb, Farm Progress, Successful Farming, World Grain, Feed Strategy, Dairy Herd, Fastmarkets, S&P Global, Argus Media, FoodNavigator, Farmers Weekly, Farmers Guardian, Agriland, AGRA, Agroeuropa, ABC Rural, Grain Central, The Land, USDA, USDA ERS, European Commission Agriculture, FAO, OECD, WTO, EIA, IEA and International Grains Council via Google News RSS search feeds.n Commission Agriculture and FAO via RSS search feeds.
- Retention window: 14 days; maximum 120 stories.
- Classification maps stories to maize, wheat, soybeans, rice, barley, sugar, fertilizer, diesel, energy, dairy, feed, farm costs and CAP.
- Topics include weather, trade, supply, energy, costs and policy, with source-region tagging for US, EU and global coverage.
- GitHub Actions refreshes the generated dataset every 3 hours and can also be run manually.
- Generated files should not be edited by hand: data/news.json and js/news-index.js are pipeline outputs.
- The market-news UI has a fallback layer so a product without a matching regional story can still show recent compatible global coverage.


### News → Market Intelligence

The automated news pipeline also emits impactChannel and marketLinks metadata for each story.

- MARKET IMPACT, INPUT COST, TRADE, WEATHER, SUPPLY, ENERGY, and POLICY channels are assigned deterministically from the story classification.
- Input-cost stories can link to existing relationship keys such as fertilizer-cereals, energy-cereals, fertilizer-milk, and energy-milk.
- The frontend joins those keys to the live Agricultural Relationship Engine, so lag, correlation, and confidence are calculated from the current verified history rather than copied into the news feed.
- If a compatible Transmission Watch alert is active, the news card can also display TRANSMISSION WATCH.
- The linkage is descriptive: it identifies market context and observed historical relationships; it does not turn a news item into a price forecast.
