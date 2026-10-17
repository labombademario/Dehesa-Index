# Dehesa Index

[English](README.md) · [Español](README.es.md) · **Français**

[dehesaindex.com](https://dehesaindex.com) est un suivi mondial, dans le style de Bloomberg, des prix agricoles et des statistiques officielles : élevage, produits laitiers, céréales, oléagineux, engrais, aliments pour animaux et énergie, avec les prix des États-Unis, de l'Union européenne, du Royaume-Uni et du Canada et des statistiques officielles de plus de 30 pays (les nombres exacts de pays, d'agrégats et de régions proviennent de `data/catalog/manifest.json`, `entityType`). C'est un site statique (HTML, CSS et JavaScript ES5 pur, sans étape de compilation) alimenté par des pipelines GitHub Actions planifiés qui déposent des fichiers JSON dans `data/`. Interface en espagnol, anglais, français et italien.

## Droits et licences

© 2026 Dehesa Index. **Tous droits réservés.** Le code, les scripts, les schémas, la compilation de données et la conception de ce dépôt sont publiés à titre de transparence uniquement et ne sont pas concédés sous licence pour être copiés, redistribués ni réutilisés commercialement. Pour demander une licence, écrivez à [dehesaindex@gmail.com](mailto:dehesaindex@gmail.com).

Les données publiées par des sources tierces (Eurostat, USDA, la Commission européenne et d'autres) conservent leur propre licence et leurs conditions d'attribution, indiquées dans [`DATA_SOURCES.md`](DATA_SOURCES.md). Cet avis ne les modifie pas.

## Documentation

Ces documents sont en anglais.

- [`ARCHITECTURE.md`](ARCHITECTURE.md) : couches de données, pipelines, contrôles de qualité.
- [`DATA_MODEL.md`](DATA_MODEL.md) : contrats, fraîcheur, licences, anomalies.
- [`DATA_SOURCES.md`](DATA_SOURCES.md) : chaque source et sa licence (généré).
- [`CONTRIBUTING.md`](CONTRIBUTING.md) : vérifications avant un commit et règles du projet.
- [`docs/REPO_GROWTH.md`](docs/REPO_GROWTH.md) : budget de taille du dépôt et politique de conservation.

## Ce qu'il couvre

| Domaine | Pages | Sources principales |
|---|---|---|
| Prix | `precios.html`, `producto.html`, `europa.html`, `mercados.html` | USDA AMS, NASS, Portail de données agroalimentaires de l'UE, rapports nationaux de prix |
| Offre et demande | `oferta-demanda.html`, `cultivos.html`, `rendimientos.html`, `ganaderia.html`, `exportaciones.html` | USDA PSD, NASS, ERS, FAS GATS, ventes à l'exportation |
| Statistiques par pays | `paises.html`, `perfiles.html`, `recan.html` | MAPA, INE, Statbel, Destatis, BLE, FranceAgriMer, Statistics Canada, ABS, CBS, Statistics Denmark, Eurostat |
| Commerce extérieur | dans `paises.html` | Eurostat Comext (8 pays européens, extra/intra-UE, produit par partenaire), Statistics Canada, ABS |
| Droits de douane | `aranceles.html` | Tarif harmonisé de l'USITC (chapitres 01-24 et 31) plus une couche datée des mesures récentes |
| Profils de pays | `perfiles.html`, `paises.html?c=XX` | Indicateurs clés, partenaires commerciaux, macro (Banque mondiale, Eurostat), taux directeurs (Fed, BCE, Banque du Canada, RBA), salaires médians |
| Coûts et intrants | `costes.html`, `insumos.html` | ERS, Banque mondiale, séries d'engrais et d'énergie |
| Météo et sécheresse | `clima.html`, `sequia.html`, `mapa.html` | NASA POWER, US Drought Monitor, MARS |
| Actualités et calendrier | `noticias.html`, `calendario.html` | Pipeline RSS (ci-dessous), calendriers de publication |

Pays avec profil : Espagne, France, Allemagne, Belgique, Autriche, Portugal, Danemark, Pays-Bas, États-Unis, Canada, Australie et un aperçu de l'Union européenne.

## Fonctionnement

- `scripts/update-*.py|js` récupèrent et normalisent chacun une source et écrivent dans `data/` ; la plupart des workflows sont générés à partir de `sources.yml`. Les chiffres (nombre de pipelines, schémas, registre des licences et catalogue) sont générés dans le [README en anglais](README.md#how-it-works) afin de ne pas se désynchroniser ici.
- Les workflows de données ont un groupe de concurrence par ensemble de fichiers écrits (ceux qui écrivent le même fichier partagent un groupe ; les constructeurs de données dérivées partagent `dehesa-data-writes`) ; `scripts/publish-data.sh` fait un rebase et fusionne les registres partagés pour que les commits parallèles ne perdent jamais de données, et un chien de garde relance tout workflow annulé dans la file. Chacun écrit un `*-log.txt` à côté de sa sortie.
- Les fichiers par pays partagent un schéma : `{ schemaVersion, generatedAt, countries: { XX: { name, source, extend?, series: [{ id, group, label, unit, frequency, latestPeriod, latest, changePct, points }] } } }`. `js/country-data.js` les charge et les fusionne ; `js/paises.js` affiche l'explorateur et `js/perfil-pais.js` les profils.
- Seules les séries réelles publiées par chaque source sont affichées : rien n'est estimé ni complété. Les licences et les citations figurent dans `legal.html` et `metodologia.html`.
- Les tableaux sont triables sur tout le site (`initTableSort` dans `js/shared.js`).
- L'état en direct des pipelines et les lacunes de couverture sont publiés sur [`status.html`](https://dehesaindex.com/status.html), construit à partir de `data/pipeline-status.json` et `data/coverage-gaps.json`.

## Contrôles de qualité

```
python3 scripts/validate-data.py --all --no-report   # tous les schémas + tests sémantiques + cohérence
python3 scripts/test-contracts.py                    # les données réelles corrompues doivent être rejetées
python3 scripts/check-licenses.py && python3 scripts/check-catalog.py --strict
node scripts/qa-site.mjs && node scripts/qa-navigation.mjs && node scripts/qa-seo.mjs
node scripts/check-performance-budget.mjs            # budgets de poids par page
node scripts/e2e.mjs                                 # vrai navigateur, bureau et mobile, axe-core
```

Tous s'exécutent dans GitHub Actions (`quality.yml`, `qa-site.yml`, `qa-navigation.yml`) ; voir `CONTRIBUTING.md`.

## Données et licences

Chaque série conserve sa source et sa licence dans le JSON et sur la page. Les sources comprennent des données du gouvernement américain du domaine public, des données ouvertes CC BY 4.0 (Eurostat, Banque mondiale, INE Portugal, ABS, entre autres) et des conditions nationales d'attribution seule. Les éléments dont la licence reste à confirmer sont signalés dans les notes du projet et ne sont pas republiés en silence.

## Pipeline automatique d'actualités

Dehesa Index maintient un pipeline automatique d'actualités des marchés agricoles :

RSS/Atom -> normaliser -> dédupliquer -> classer -> noter la pertinence -> data/news.json -> data/views/news-index.json + data/views/news-feed.json

- Sources actuellement interrogées, via les flux de recherche RSS de Google News : Reuters, Associated Press, AFP, EFE, Bloomberg, Financial Times, Wall Street Journal, CNBC, POLITICO, Euractiv, Xinhua, DTN, AgWeb, Farm Progress, Successful Farming, World Grain, Feed Strategy, Dairy Herd, Fastmarkets, S&P Global, Argus Media, FoodNavigator, Farmers Weekly, Farmers Guardian, Agriland, AGRA, Agroeuropa, ABC Rural, Grain Central, The Land, USDA, USDA ERS, Commission européenne (Agriculture), FAO, OCDE, OMC, EIA, AIE et Conseil international des céréales.
- Fenêtre de conservation : 14 jours ; 120 articles au maximum.
- La classification rattache chaque article au maïs, blé, soja, riz, orge, sucre, engrais, gazole, énergie, produits laitiers, aliments pour animaux, coûts agricoles et PAC.
- Les thèmes incluent météo, commerce, offre, énergie, coûts et politique, avec une étiquette de région d'origine pour les États-Unis, l'UE et la couverture mondiale.
- GitHub Actions actualise le jeu de données toutes les 3 heures et peut aussi être lancé manuellement.
- Les fichiers générés ne doivent pas être modifiés à la main : `data/news.json` et `data/views/news-*.json` sont des sorties du pipeline.
- L'interface des actualités de marché comporte une couche de repli : un produit sans article régional correspondant peut tout de même afficher une couverture mondiale récente et compatible.

### Actualités → Intelligence de marché

Le pipeline d'actualités émet aussi des métadonnées `impactChannel` et `marketLinks` pour chaque article.

- Les canaux MARKET IMPACT, INPUT COST, TRADE, WEATHER, SUPPLY, ENERGY et POLICY sont attribués de façon déterministe à partir de la classification de l'article.
- Les articles sur les coûts des intrants peuvent renvoyer vers des clés de relation existantes, comme fertilizer-cereals, energy-cereals, fertilizer-milk et energy-milk.
- Le frontend associe ces clés au moteur de relations agricoles en direct : le décalage, la corrélation et la confiance sont calculés à partir de l'historique vérifié actuel, et non copiés dans le flux d'actualités.
- Si une alerte compatible de Transmission Watch est active, la fiche d'actualité peut aussi afficher TRANSMISSION WATCH.
- Le lien est descriptif : il identifie le contexte de marché et les relations historiques observées ; il ne transforme pas une actualité en prévision de prix.
