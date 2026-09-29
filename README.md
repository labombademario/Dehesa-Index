# Dehesa-Index
Dehesa Index


## Automated News Pipeline

Dehesa Index now maintains an automated agricultural market-news pipeline:

RSS/Atom -> normalize -> deduplicate -> classify -> relevance score -> data/news.json -> js/news-index.js

- Sources currently queried: Reuters, USDA, European Commission Agriculture and FAO via RSS search feeds.
- Retention window: 14 days; maximum 80 stories.
- Classification maps stories to maize, wheat, soybeans, fertilizer, diesel, energy, dairy, feed and CAP.
- Topics include weather, trade, supply, energy, costs and policy.
- GitHub Actions refreshes the generated dataset every 3 hours and can also be run manually.
- Generated files should not be edited by hand: data/news.json and js/news-index.js are pipeline outputs.
- The market-news UI has a fallback layer so a product without a matching regional story can still show recent compatible global coverage.
