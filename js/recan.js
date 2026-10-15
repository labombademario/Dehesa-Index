/* Dehesa Index — Costes y rentas de las explotaciones españolas (RECAN, MAPA, CC BY 4.0). Lee data/recan.json.
   Cada cifra es la que publica el MAPA para una comunidad, un tipo y una dimensión económica; no se promedia ni se estima nada. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Costes y rentas de las explotaciones (España)', sub: 'Producción, costes, subvenciones y renta neta por explotación, según la Red Contable Agraria Nacional del MAPA: por comunidad autónoma, tipo de explotación y dimensión económica, de 2014 a 2024.',
      year: 'Ejercicio', ccaa: 'Comunidad', type: 'Tipo de explotación', dim: 'Dimensión económica', variable: 'Variable', chart: 'Evolución', all: 'Todas las variables del ejercicio', rank: 'Comparativa entre comunidades', value: 'Valor', prev: 'Ejercicio anterior', chg: 'Variación', farms: 'Explotaciones en la muestra', rep: 'Explotaciones representadas', none: 'Sin datos para esta combinación (el MAPA los marca como confidenciales o no hay muestra suficiente).', sample: 'Muestra',
      note: 'Los datos son valores medios por explotación tal como los publica el MAPA. Las celdas confidenciales no aparecen y no se rellenan ni se promedian entre comunidades. La dimensión económica es la clase de producción estándar de la explotación. Con pocas explotaciones en la muestra, la cifra es menos fiable. Las variaciones entre ejercicios pueden reflejar cambios en la muestra, no solo en la realidad del sector.', src: 'Fuente', lic: 'Licencia', updated: 'Actualizado', perFarm: 'por explotación' },
    en: { title: 'Farm costs and incomes (Spain)', sub: 'Output, costs, subsidies and net income per farm from the Spanish Farm Accountancy Data Network (RECAN, MAPA): by region, farm type and economic size, 2014 to 2024.',
      year: 'Year', ccaa: 'Region', type: 'Farm type', dim: 'Economic size', variable: 'Variable', chart: 'Trend', all: 'All variables for the year', rank: 'Comparison across regions', value: 'Value', prev: 'Previous year', chg: 'Change', farms: 'Farms in sample', rep: 'Farms represented', none: 'No data for this combination (MAPA marks it confidential or the sample is too small).', sample: 'Sample',
      note: 'Values are per-farm averages as published by MAPA. Confidential cells are not shown and are never filled or averaged across regions. Economic size is the farm’s standard-output class. With few farms in the sample the figure is less reliable. Year-on-year changes can reflect changes in the sample, not only in the sector. Variable names are in Spanish, as published.', src: 'Source', lic: 'Licence', updated: 'Updated', perFarm: 'per farm' },
    fr: { title: 'Coûts et revenus des exploitations (Espagne)', sub: 'Production, coûts, subventions et revenu net par exploitation selon le réseau comptable agricole espagnol (RECAN, MAPA) : par région, type d’exploitation et taille économique, de 2014 à 2024.',
      year: 'Exercice', ccaa: 'Région', type: 'Type d’exploitation', dim: 'Taille économique', variable: 'Variable', chart: 'Évolution', all: 'Toutes les variables de l’exercice', rank: 'Comparaison entre régions', value: 'Valeur', prev: 'Exercice précédent', chg: 'Variation', farms: 'Exploitations dans l’échantillon', rep: 'Exploitations représentées', none: 'Pas de données pour cette combinaison (le MAPA les marque confidentielles ou l’échantillon est trop petit).', sample: 'Échantillon',
      note: 'Valeurs moyennes par exploitation telles que publiées par le MAPA. Les cellules confidentielles ne sont pas affichées et ne sont ni remplies ni moyennées entre régions. Avec peu d’exploitations dans l’échantillon, le chiffre est moins fiable. Les variations d’un exercice à l’autre peuvent refléter un changement d’échantillon. Les noms des variables restent en espagnol.', src: 'Source', lic: 'Licence', updated: 'Mis à jour', perFarm: 'par exploitation' },
    it: { title: 'Costi e redditi delle aziende (Spagna)', sub: 'Produzione, costi, sussidi e reddito netto per azienda secondo la rete contabile agraria spagnola (RECAN, MAPA): per regione, tipo di azienda e dimensione economica, dal 2014 al 2024.',
      year: 'Esercizio', ccaa: 'Regione', type: 'Tipo di azienda', dim: 'Dimensione economica', variable: 'Variabile', chart: 'Andamento', all: 'Tutte le variabili dell’esercizio', rank: 'Confronto tra regioni', value: 'Valore', prev: 'Esercizio precedente', chg: 'Variazione', farms: 'Aziende nel campione', rep: 'Aziende rappresentate', none: 'Nessun dato per questa combinazione (il MAPA lo segnala come riservato o il campione è troppo piccolo).', sample: 'Campione',
      note: 'Valori medi per azienda come pubblicati dal MAPA. Le celle riservate non compaiono e non vengono riempite né mediate tra regioni. Con poche aziende nel campione la cifra è meno affidabile. Le variazioni tra esercizi possono riflettere cambi del campione. I nomi delle variabili restano in spagnolo.', src: 'Fonte', lic: 'Licenza', updated: 'Aggiornato', perFarm: 'per azienda' }
  };
  var X = {
    es: { q: '¿Qué explotación quieres consultar?', ph: 'Prueba con «olivar», «vacuno de leche» o «Extremadura»', go: 'Buscar', secs: 'O elige un sector', subtype: 'Subtipo', size: 'Tamaño económico', sizeHint: 'clase de producción estándar de la explotación', reset: 'Restablecer', nores: 'Sin resultados para «{q}». Prueba con otra palabra.', kT: 'Tipo', kC: 'Comunidad', kS: 'Sector',
      noCom: '«{t}» no tiene datos en {c}. Te mostramos {c2}, la comunidad con más datos.', noType: 'En {c} no hay datos de «{t}». Te mostramos «{t2}».', onlyHere: '{n} subtipos más sin datos en esta comunidad.',
      sumA: '{t} en {c}, {y}: la renta neta fue de {v} € por explotación ({chg} frente a {py}). Los ingresos fueron de {i} € y los costes de {k} €.', sumB: '{t} en {c}, {y}: la renta neta fue de {v} € por explotación. Los ingresos fueron de {i} € y los costes de {k} €.', sumC: '{t} en {c}, {y}: no hay renta neta publicada para esta combinación.', sumS: ' Las subvenciones corrientes netas equivalen al {x} % del valor añadido neto.',
      kinc: 'Ingresos (producción bruta)', kcost: 'Costes totales', ksub: 'Subvenciones corrientes', knet: 'Renta neta', kuta: 'Valor añadido neto por UTA', kHint: 'Pulsa un indicador para ver su evolución.', vs: 'frente a {y}', nodata: 'sin datos',
      small: 'Muestra pequeña ({n} explotaciones): interprétalo con cautela.', allv: 'Ver las {n} variables del MAPA', rankHint: 'Pulsa una comunidad para verla.',
      g1: 'Mano de obra, tierra y ganado', g2: 'Producción', g3: 'Costes', g4: 'Resultados', g5: 'Balance: activos y deudas', g6: 'Subvenciones', pick: 'Ver gráfico' },
    en: { q: 'Which farm type do you want to look up?', ph: 'Try “olives”, “dairy cattle” or “Extremadura”', go: 'Search', secs: 'Or pick a sector', subtype: 'Subtype', size: 'Economic size', sizeHint: 'standard-output class of the farm', reset: 'Reset', nores: 'No results for “{q}”. Try another word.', kT: 'Type', kC: 'Region', kS: 'Sector',
      noCom: '“{t}” has no data in {c}. Showing {c2}, the region with most data.', noType: 'No data for “{t}” in {c}. Showing “{t2}”.', onlyHere: '{n} more subtypes have no data in this region.',
      sumA: '{t} in {c}, {y}: net income was €{v} per farm ({chg} vs {py}). Output was €{i} and costs €{k}.', sumB: '{t} in {c}, {y}: net income was €{v} per farm. Output was €{i} and costs €{k}.', sumC: '{t} in {c}, {y}: no net income is published for this combination.', sumS: ' Net current subsidies equal {x}% of farm net value added.',
      kinc: 'Output (gross production)', kcost: 'Total costs', ksub: 'Current subsidies', knet: 'Net income', kuta: 'Net value added per AWU', kHint: 'Select an indicator to see its trend.', vs: 'vs {y}', nodata: 'no data',
      small: 'Small sample ({n} farms): read with caution.', allv: 'See all {n} MAPA variables', rankHint: 'Select a region to view it.',
      g1: 'Labour, land and livestock', g2: 'Output', g3: 'Costs', g4: 'Results', g5: 'Balance sheet: assets and debts', g6: 'Subsidies', pick: 'Show chart' },
    fr: { q: 'Quelle exploitation voulez-vous consulter ?', ph: 'Essayez « oliviers », « bovins lait » ou « Estrémadure »', go: 'Rechercher', secs: 'Ou choisissez un secteur', subtype: 'Sous-type', size: 'Taille économique', sizeHint: 'classe de production standard de l’exploitation', reset: 'Réinitialiser', nores: 'Aucun résultat pour « {q} ». Essayez un autre mot.', kT: 'Type', kC: 'Région', kS: 'Secteur',
      noCom: '« {t} » n’a pas de données en {c}. Affichage : {c2}, la région avec le plus de données.', noType: 'Pas de données « {t} » en {c}. Affichage : « {t2} ».', onlyHere: '{n} autres sous-types sans données dans cette région.',
      sumA: '{t} en {c}, {y} : le revenu net était de {v} € par exploitation ({chg} par rapport à {py}). La production était de {i} € et les coûts de {k} €.', sumB: '{t} en {c}, {y} : le revenu net était de {v} € par exploitation. La production était de {i} € et les coûts de {k} €.', sumC: '{t} en {c}, {y} : aucun revenu net publié pour cette combinaison.', sumS: ' Les subventions courantes nettes représentent {x} % de la valeur ajoutée nette.',
      kinc: 'Production brute', kcost: 'Coûts totaux', ksub: 'Subventions courantes', knet: 'Revenu net', kuta: 'Valeur ajoutée nette par UTA', kHint: 'Cliquez sur un indicateur pour voir son évolution.', vs: 'par rapport à {y}', nodata: 'pas de données',
      small: 'Petit échantillon ({n} exploitations) : à interpréter avec prudence.', allv: 'Voir les {n} variables du MAPA', rankHint: 'Cliquez sur une région pour l’afficher.',
      g1: 'Main-d’œuvre, terre et cheptel', g2: 'Production', g3: 'Coûts', g4: 'Résultats', g5: 'Bilan : actifs et dettes', g6: 'Subventions', pick: 'Voir le graphique' },
    it: { q: 'Quale azienda vuoi consultare?', ph: 'Prova con «olivo», «bovini da latte» o «Estremadura»', go: 'Cerca', secs: 'Oppure scegli un settore', subtype: 'Sottotipo', size: 'Dimensione economica', sizeHint: 'classe di produzione standard dell’azienda', reset: 'Reimposta', nores: 'Nessun risultato per «{q}». Prova un’altra parola.', kT: 'Tipo', kC: 'Regione', kS: 'Settore',
      noCom: '«{t}» non ha dati in {c}. Mostriamo {c2}, la regione con più dati.', noType: 'Nessun dato «{t}» in {c}. Mostriamo «{t2}».', onlyHere: 'Altri {n} sottotipi senza dati in questa regione.',
      sumA: '{t} in {c}, {y}: il reddito netto è stato di {v} € per azienda ({chg} rispetto al {py}). La produzione è stata di {i} € e i costi di {k} €.', sumB: '{t} in {c}, {y}: il reddito netto è stato di {v} € per azienda. La produzione è stata di {i} € e i costi di {k} €.', sumC: '{t} in {c}, {y}: nessun reddito netto pubblicato per questa combinazione.', sumS: ' Le sovvenzioni correnti nette equivalgono al {x} % del valore aggiunto netto.',
      kinc: 'Produzione lorda', kcost: 'Costi totali', ksub: 'Sovvenzioni correnti', knet: 'Reddito netto', kuta: 'Valore aggiunto netto per ULA', kHint: 'Seleziona un indicatore per vederne l’andamento.', vs: 'rispetto al {y}', nodata: 'nessun dato',
      small: 'Campione piccolo ({n} aziende): interpretare con cautela.', allv: 'Vedi le {n} variabili del MAPA', rankHint: 'Seleziona una regione per vederla.',
      g1: 'Manodopera, terra e bestiame', g2: 'Produzione', g3: 'Costi', g4: 'Risultati', g5: 'Bilancio: attività e debiti', g6: 'Sovvenzioni', pick: 'Mostra grafico' }
  };
  Object.keys(X).forEach(function (l) { for (var k in X[l]) T[l][k] = X[l][k]; });
  var SECN = { es: { cer: 'Cereales y cultivos extensivos', oli: 'Olivar', vin: 'Viñedo', fru: 'Frutales y leñosos', hor: 'Hortalizas y flores', bov: 'Vacuno', ovi: 'Ovino y caprino', por: 'Porcino y aves', mix: 'Explotaciones mixtas' },
    en: { cer: 'Cereals and field crops', oli: 'Olives', vin: 'Vineyards', fru: 'Fruit and tree crops', hor: 'Vegetables and flowers', bov: 'Cattle', ovi: 'Sheep and goats', por: 'Pigs and poultry', mix: 'Mixed farms' },
    fr: { cer: 'Céréales et grandes cultures', oli: 'Oliviers', vin: 'Vignes', fru: 'Fruits et cultures ligneuses', hor: 'Légumes et fleurs', bov: 'Bovins', ovi: 'Ovins et caprins', por: 'Porcins et volailles', mix: 'Exploitations mixtes' },
    it: { cer: 'Cereali e colture estensive', oli: 'Olivo', vin: 'Vigneti', fru: 'Frutteti e colture legnose', hor: 'Ortaggi e fiori', bov: 'Bovini', ovi: 'Ovini e caprini', por: 'Suini e avicoli', mix: 'Aziende miste' } };
  var D = null, ST = { c: null, t: null, d: null, y: null, v: 'SE420', note: '', openAll: false };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { return Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0; }
  var RT = {"Mano de obra total (UTA)":["Total labour input (AWU)","Main-d’œuvre totale (UTA)","Manodopera totale (ULA)"],"Mano de obra no asalariada (UTA)":["Unpaid labour input (AWU)","Main-d’œuvre non salariée (UTA)","Manodopera non salariata (ULA)"],"Mano de obra asalariada (UTA)":["Paid labour input (AWU)","Main-d’œuvre salariée (UTA)","Manodopera salariata (ULA)"],"Superficie Agraria Útil (SAU) (ha)":["Utilised agricultural area (UAA) (ha)","Surface agricole utile (SAU) (ha)","Superficie agricola utilizzata (SAU) (ha)"],"SAU en arrendamiento (ha)":["Rented UAA (ha)","SAU en fermage (ha)","SAU in affitto (ha)"],"Unidades de ganado (UG)":["Livestock units (LU)","Unités de gros bétail (UGB)","Unità di bestiame (UBA)"],"Producción Bruta Total":["Total output","Production brute totale","Produzione lorda totale"],"Producción Bruta Vegetal":["Total crop output","Production brute végétale","Produzione lorda vegetale"],"Producción Bruta Vegetal/SAU (€/ha)":["Crop output per hectare (€/ha)","Production végétale par hectare (€/ha)","Produzione vegetale per ettaro (€/ha)"],"Producción Bruta Animal":["Total livestock output","Production brute animale","Produzione lorda zootecnica"],"Producción Bruta Animal/UG (€/UG)":["Livestock output per LU (€/LU)","Production animale par UGB (€/UGB)","Produzione zootecnica per UBA (€/UBA)"],"Otra Producción Bruta (Incluye OAL)":["Other output (incl. other gainful activities)","Autres productions (y compris autres activités lucratives)","Altra produzione (incluse altre attività lucrative)"],"Costes Totales":["Total inputs","Charges totales","Costi totali"],"Consumos Intermedios":["Intermediate consumption","Consommations intermédiaires","Consumi intermedi"],"Costes específicos":["Specific costs","Charges spécifiques","Costi specifici"],"Costes específicos de cultivos":["Specific crop costs","Charges spécifiques des cultures","Costi specifici delle colture"],"Costes específicos de ganados":["Specific livestock costs","Charges spécifiques des animaux","Costi specifici degli allevamenti"],"Costes Específicos Cultivos/SAU (€/ha)":["Specific crop costs per hectare (€/ha)","Charges spécifiques des cultures par hectare (€/ha)","Costi specifici delle colture per ettaro (€/ha)"],"Costes Específicos Ganados/UG (€/UG)":["Specific livestock costs per LU (€/LU)","Charges spécifiques des animaux par UGB (€/UGB)","Costi specifici degli allevamenti per UBA (€/UBA)"],"Costes generales":["Farming overheads","Charges générales","Spese generali"],"Mant. corriente maquinaria y edificios":["Machinery and building current costs","Entretien courant des machines et bâtiments","Manutenzione corrente di macchine ed edifici"],"Energía":["Energy","Énergie","Energia"],"Trabajos terceros y arrend. maquinaria":["Contract work and machinery hire","Travaux par tiers et location de matériel","Lavori conto terzi e noleggio macchine"],"Otros costes generales":["Other direct inputs","Autres charges générales","Altre spese generali"],"Amortizaciones":["Depreciation","Amortissements","Ammortamenti"],"Costes factores externos":["External factors","Facteurs externes","Fattori esterni"],"Salarios y cargas sociales":["Wages paid","Salaires et charges sociales","Salari e oneri sociali"],"Arrendamientos pagados":["Rent paid","Fermages payés","Affitti pagati"],"Intereses pagados":["Interest paid","Intérêts payés","Interessi pagati"],"Valor Añadido Bruto de explotación":["Gross farm income","Valeur ajoutée brute de l’exploitation","Valore aggiunto lordo dell’azienda"],"Valor Añadido Neto de explotación":["Farm net value added","Valeur ajoutée nette de l’exploitation","Valore aggiunto netto dell’azienda"],"Valor Añadido Neto de explotación (Mediana)":["Farm net value added (median)","Valeur ajoutée nette de l’exploitation (médiane)","Valore aggiunto netto dell’azienda (mediana)"],"Renta Neta de explotación":["Farm net income","Revenu net de l’exploitation","Reddito netto dell’azienda"],"Valor Añadido Neto Explotación/UTA":["Farm net value added per AWU","Valeur ajoutée nette par UTA","Valore aggiunto netto per ULA"],"Valor Añadido Neto/UTA (euros/UTA) (Mediana)":["Farm net value added per AWU (median)","Valeur ajoutée nette par UTA (médiane)","Valore aggiunto netto per ULA (mediana)"],"Activos totales":["Total assets","Actif total","Attività totali"],"Capital Fijo":["Fixed assets","Capital fixe","Capitale fisso"],"Tierras, cultivos permanentes y cuotas":["Land, permanent crops and quotas","Terres, cultures permanentes et quotas","Terreni, colture permanenti e quote"],"Edificios y mejoras":["Buildings and improvements","Bâtiments et améliorations","Fabbricati e miglioramenti"],"Maquinaria y equipo":["Machinery and equipment","Machines et équipements","Macchine e attrezzature"],"Ganado reproductor":["Breeding livestock","Cheptel reproducteur","Bestiame da riproduzione"],"Capital Circulante":["Current assets","Capital circulant","Capitale circolante"],"Pasivos totales":["Total liabilities","Passif total","Passività totali"],"Préstamos a Medio y Largo Plazo":["Long and medium-term loans","Emprunts à moyen et long terme","Prestiti a medio e lungo termine"],"Préstamos a Corto Plazo":["Short-term loans","Emprunts à court terme","Prestiti a breve termine"],"Subvenciones corrientes Netas":["Net current subsidies","Subventions d’exploitation nettes","Sovvenzioni correnti nette"],"Subvenciones Corrientes Totales":["Total current subsidies","Subventions d’exploitation totales","Sovvenzioni correnti totali"],"Subvenciones corrientes: cultivos":["Current subsidies: crops","Subventions d’exploitation : cultures","Sovvenzioni correnti: colture"],"Subvenciones corrientes: ganados":["Current subsidies: livestock","Subventions d’exploitation : animaux","Sovvenzioni correnti: allevamenti"],"Subvenciones: desarrollo rural":["Subsidies: rural development","Subventions : développement rural","Sovvenzioni: sviluppo rurale"],"Pagos desacoplados":["Decoupled payments","Paiements découplés","Pagamenti disaccoppiati"],"Otras subvenciones":["Other subsidies","Autres subventions","Altre sovvenzioni"],"Costes de Otras Actividades Lucrativas":["Costs of other gainful activities","Charges des autres activités lucratives","Costi di altre attività lucrative"],"Subv. Corrientes Netas/Valor Añadido Neto (%)":["Net current subsidies / farm net value added (%)","Subventions nettes / valeur ajoutée nette (%)","Sovvenzioni nette / valore aggiunto netto (%)"],"Aves":["Poultry","Volailles","Avicoltura"],"Gallinas ponedoras":["Laying hens","Poules pondeuses","Galline ovaiole"],"Gallinas ponedoras y de engorde":["Laying hens and broilers","Poules pondeuses et poulets de chair","Galline ovaiole e polli da carne"],"Pollos de engorde":["Broilers","Poulets de chair","Polli da carne"],"Bovinos de carne y cría de bovinos":["Cattle rearing and fattening","Bovins viande et élevage","Bovini da carne e allevamento"],"Bovinos de carne, leche y cría de bovinos":["Cattle: dairy, rearing and fattening","Bovins lait, viande et élevage","Bovini da latte, da carne e allevamento"],"Bovinos de carne y leche y cría de bovinos":["Cattle: dairy, rearing and fattening","Bovins lait, viande et élevage","Bovini da latte, da carne e allevamento"],"Cereales, oleaginosas y proteaginosas":["Cereals, oilseeds and protein crops","Céréales, oléagineux et protéagineux","Cereali, oleaginose e proteaginose"],"Arroz":["Rice","Riz","Riso"],"Cereales (excepto arroz), oleaginosas y leguminosas":["Cereals (except rice), oilseeds and pulses","Céréales (sauf riz), oléagineux et légumineuses","Cereali (escluso riso), oleaginose e leguminose"],"Cereales y arroz, oleaginosas y leguminosas":["Cereals and rice, oilseeds and pulses","Céréales et riz, oléagineux et légumineuses","Cereali e riso, oleaginose e leguminose"],"Cultivos permanentes combinados":["Mixed permanent crops","Cultures permanentes combinées","Colture permanenti combinate"],"Cultivos leñosos diversos":["Various permanent crops","Cultures ligneuses diverses","Colture legnose diverse"],"Frutales":["Fruit","Fruits","Frutticoltura"],"Cítricos":["Citrus","Agrumes","Agrumi"],"Frutales y bayas (excepto cítricos)":["Fruit and berries (except citrus)","Fruits et baies (sauf agrumes)","Frutta e bacche (esclusi agrumi)"],"Frutales y bayas y cítricos diversos":["Fruit, berries and citrus, mixed","Fruits, baies et agrumes divers","Frutta, bacche e agrumi diversi"],"Frutas tropicales":["Tropical fruit","Fruits tropicaux","Frutta tropicale"],"Frutos secos":["Nuts","Fruits à coque","Frutta a guscio"],"Granívoros diversos combinados":["Mixed pigs and poultry","Granivores divers combinés","Granivori diversi combinati"],"Horticultura":["Horticulture","Horticulture","Orticoltura"],"Flores y plantas ornamentales al aire libre":["Flowers and ornamentals, outdoor","Fleurs et plantes ornementales de plein air","Fiori e piante ornamentali in pieno campo"],"Flores y plantas ornamentales en invernadero":["Flowers and ornamentals, under glass","Fleurs et plantes ornementales sous serre","Fiori e piante ornamentali in serra"],"Hortalizas al aire libre":["Vegetables, outdoor","Légumes de plein air","Ortaggi in pieno campo"],"Hortalizas en invernadero":["Vegetables, under glass","Légumes sous serre","Ortaggi in serra"],"Horticultura diversa":["Mixed horticulture","Horticulture diverse","Orticoltura diversa"],"Setas":["Mushrooms","Champignons","Funghi"],"Viveros":["Nurseries","Pépinières","Vivai"],"Mixto agricultura":["Mixed cropping","Polyculture","Policoltura"],"Agricultura general y alguna otra actividad":["Field crops with some other activity","Grandes cultures et autre activité","Seminativi e altra attività"],"Agricultura general y cultivos leñosos":["Field crops and permanent crops","Grandes cultures et cultures ligneuses","Seminativi e colture legnose"],"Agricultura general y horticultura":["Field crops and horticulture","Grandes cultures et horticulture","Seminativi e orticoltura"],"Agricultura general y viticultura":["Field crops and vineyards","Grandes cultures et viticulture","Seminativi e viticoltura"],"Horticultura y cultivos leñosos":["Horticulture and permanent crops","Horticulture et cultures ligneuses","Orticoltura e colture legnose"],"Otros policultivos":["Other mixed cropping","Autres polycultures","Altre policolture"],"Mixto agricultura y ganadería":["Mixed crops and livestock","Polyculture-élevage","Misto colture e allevamento"],"Agricultura general con herbívoros lecheros":["Field crops with dairy grazing livestock","Grandes cultures avec herbivores laitiers","Seminativi con erbivori da latte"],"Agricultura general con herbívoros no lecheros":["Field crops with non-dairy grazing livestock","Grandes cultures avec herbivores non laitiers","Seminativi con erbivori non da latte"],"Agricultura general y granívoros":["Field crops and pigs/poultry","Grandes cultures et granivores","Seminativi e granivori"],"Apicultura":["Beekeeping","Apiculture","Apicoltura"],"Cultivos leñosos y herbívoros":["Permanent crops and grazing livestock","Cultures ligneuses et herbivores","Colture legnose ed erbivori"],"Herbívoros lecheros con agricultura general":["Dairy grazing livestock with field crops","Herbivores laitiers avec grandes cultures","Erbivori da latte con seminativi"],"Herbívoros no lecheros con agricultura general":["Non-dairy grazing livestock with field crops","Herbivores non laitiers avec grandes cultures","Erbivori non da latte con seminativi"],"Otros cultivos mixtos y ganadería":["Other mixed crops and livestock","Autres cultures mixtes et élevage","Altre colture miste e allevamento"],"Mixto ganadería":["Mixed livestock","Élevage mixte","Allevamento misto"],"Granívoros y herbívoros lecheros":["Pigs/poultry and dairy grazing livestock","Granivores et herbivores laitiers","Granivori ed erbivori da latte"],"Granívoros y herbívoros no lecheros":["Pigs/poultry and non-dairy grazing livestock","Granivores et herbivores non laitiers","Granivori ed erbivori non da latte"],"Predominio herbívoros lecheros":["Mainly dairy grazing livestock","Dominante herbivores laitiers","Prevalenza erbivori da latte"],"Predominio herbívoros no lecheros":["Mainly non-dairy grazing livestock","Dominante herbivores non laitiers","Prevalenza erbivori non da latte"],"Olivar":["Olives","Oliviers","Olivicoltura"],"Otros cultivos anuales extensivos":["Other field crops","Autres grandes cultures","Altri seminativi"],"Algodón":["Cotton","Coton","Cotone"],"Cereales y arroz, oleaginosas y leguminosas y raíces y tubérculos":["Cereals, rice, oilseeds, pulses, roots and tubers","Céréales, riz, oléagineux, légumineuses, racines et tubercules","Cereali, riso, oleaginose, leguminose, radici e tuberi"],"Cultivos herbáceos combinados":["Mixed field crops","Grandes cultures combinées","Seminativi combinati"],"Hortalizas frescas en terreno de labor":["Field-grown fresh vegetables","Légumes frais de plein champ","Ortaggi freschi in pieno campo"],"Raíces y tubérculos":["Roots and tubers","Racines et tubercules","Radici e tuberi"],"Tabaco":["Tobacco","Tabac","Tabacco"],"Ovino, caprino y otros herbívoros":["Sheep, goats and other grazing livestock","Ovins, caprins et autres herbivores","Ovini, caprini e altri erbivori"],"Caprinos":["Goats","Caprins","Caprini"],"Herbívoros diversos":["Various grazing livestock","Herbivores divers","Erbivori diversi"],"Ovinos":["Sheep","Ovins","Ovini"],"Ovinos y bovinos":["Sheep and cattle","Ovins et bovins","Ovini e bovini"],"Porcinos":["Pigs","Porcins","Suini"],"Porcino de cría":["Pig breeding","Porcins naisseurs","Suini da riproduzione"],"Porcino de cría y engorde":["Pig breeding and fattening","Porcins naisseurs-engraisseurs","Suini da riproduzione e ingrasso"],"Porcino de engorde":["Pig fattening","Porcins engraisseurs","Suini da ingrasso"],"Vacuno lechero":["Dairy cattle","Bovins lait","Bovini da latte"],"Bovinos de leche":["Dairy cows","Bovins laitiers","Bovini da latte"],"Vitivinicultura":["Vineyards and wine","Viticulture","Viticoltura"],"Otros vinos":["Other wine","Autres vins","Altri vini"],"Otros viñedos":["Other vineyards","Autres vignobles","Altri vigneti"],"Uva de mesa":["Table grapes","Raisin de table","Uva da tavola"],"Vino con denominación de origen":["Quality wine (PDO)","Vin d’appellation d’origine","Vino a denominazione di origine"],"De 8.000 a < 25.000 Euros":["€8,000 to < €25,000","De 8 000 à < 25 000 €","Da 8.000 a < 25.000 €"],"De 25.000 a < 50.000 Euros":["€25,000 to < €50,000","De 25 000 à < 50 000 €","Da 25.000 a < 50.000 €"],"De 50.000 a < 100.000 Euros":["€50,000 to < €100,000","De 50 000 à < 100 000 €","Da 50.000 a < 100.000 €"],"De 100.000 a < 500.000 Euros":["€100,000 to < €500,000","De 100 000 à < 500 000 €","Da 100.000 a < 500.000 €"],"> = 500.000 Euros":["€500,000 or more","500 000 € ou plus","500.000 € o più"]};   // nombres de RECAN (MAPA, en espanol) en en|fr|it; variables SE*: nombres estandar de la RICA/FADN
  var UT = { en: [['expl.', 'farm'], ['UTA', 'AWU'], ['UG', 'LU']], fr: [['UG', 'UGB']], it: [['expl.', 'az.'], ['UTA', 'ULA'], ['UG', 'UBA']] };
  function rt(s) { var g = lang(), r = RT[s], i = { en: 0, fr: 1, it: 2 }[g]; return r && i != null ? r[i] : s; }
  function ru(s) { var g = lang(); (UT[g] || []).forEach(function (p) { s = s.split(p[0]).join(p[1]); }); return s; }
  function tlabel(i) { var x = D.types[i], a = rt(x[0]), b = rt(x[1]); return x[0] === x[1] || a === b ? a : a + ' — ' + b; }
  function vidx(id) { for (var i = 0; i < D.vars.length; i++) if (D.vars[i][0] === id) return i; return 0; }
  function uniq(a) { var o = [], s = {}; a.forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }
  function num(a) { return a.sort(function (x, y) { return x - y; }); }
  // ---------- selección y datos ----------
  var SEC = [['cer', '🌾', ['Cereales, oleaginosas y proteaginosas', 'Otros cultivos anuales extensivos']], ['oli', '🫒', ['Olivar']], ['vin', '🍇', ['Vitivinicultura']], ['fru', '🍎', ['Frutales', 'Cultivos permanentes combinados']], ['hor', '🍅', ['Horticultura']], ['bov', '🐄', ['Bovinos de carne y cría de bovinos', 'Bovinos de carne, leche y cría de bovinos', 'Vacuno lechero']], ['ovi', '🐑', ['Ovino, caprino y otros herbívoros']], ['por', '🐖', ['Porcinos', 'Aves', 'Granívoros diversos combinados']], ['mix', '🔀', ['Mixto agricultura', 'Mixto agricultura y ganadería', 'Mixto ganadería']]];
  var KP = [['SE131', 'kinc'], ['SE270', 'kcost'], ['SE605', 'ksub'], ['SE420', 'knet'], ['SE425', 'kuta']];
  var GR = [['g1', function (id) { return /^SE0/.test(id); }], ['g2', function (id) { return /^SE(1|2[0-5])/.test(id); }], ['g3', function (id) { return /^SE(27|28|30|31|33|34|35|36|37|38)/.test(id) || id === 'SE750'; }], ['g4', function (id) { return /^SE4[012]/.test(id); }], ['g5', function (id) { return /^SE4[3-9]/.test(id); }], ['g6', function (id) { return /^SE6/.test(id) || id === 'XSCVA'; }]];
  var AND = -1;
  function secName(id) { return (SECN[lang()] || SECN.es)[id]; }
  function secOf(ti) { var g = D.types[ti][0]; for (var i = 0; i < SEC.length; i++) if (SEC[i][2].indexOf(g) >= 0) return SEC[i][0]; return null; }
  function secTypes(id) { var o = []; D.types.forEach(function (x, i) { if (secOf(i) === id) o.push(i); }); return o; }
  function fm(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function fmt(v) { return nf(v, dec(v)); }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function find(y, c, t, d) { for (var i = 0; i < D.rows.length; i++) { var x = D.rows[i]; if (x[0] === y && x[1] === c && x[2] === t && x[3] === d) return x; } return null; }
  function cnt(c, t) { var n = 0; D.rows.forEach(function (x) { if (x[1] === c && x[2] === t) n++; }); return n; }
  function comsFor(t) { return num(uniq(D.rows.filter(function (x) { return x[2] === t; }).map(function (x) { return x[1]; }))); }
  function dimsFor(c, t) { return num(uniq(D.rows.filter(function (x) { return x[1] === c && x[2] === t; }).map(function (x) { return x[3]; }))); }
  function yearsFor(c, t, d) { return num(uniq(D.rows.filter(function (x) { return x[1] === c && x[2] === t && x[3] === d; }).map(function (x) { return x[0]; }))); }
  function bestCom(t) { var cs = comsFor(t); if (cs.indexOf(AND) >= 0) return AND; var b = cs[0], m = -1; cs.forEach(function (c) { var n = cnt(c, t); if (n > m) { m = n; b = c; } }); return b; }
  function bestType(c, pool) { var b = null, m = 0; (pool || D.types.map(function (x, i) { return i; })).forEach(function (ti) { var n = cnt(c, ti); if (n > m) { m = n; b = ti; } }); return b; }
  function tIdx(name) { for (var i = 0; i < D.types.length; i++) if (D.types[i][0] === name) return i; return 0; }
  function defaults() { ST.t = tIdx('Olivar'); ST.c = null; ST.d = null; ST.y = null; ST.v = 'SE420'; ST.note = ''; }
  function fix() {
    if (ST.t == null || !D.types[ST.t]) ST.t = tIdx('Olivar');
    var cs = comsFor(ST.t); if (cs.indexOf(ST.c) < 0) ST.c = bestCom(ST.t);
    var ds = dimsFor(ST.c, ST.t);
    if (ds.indexOf(ST.d) < 0) { var bd = ds[0], m = -1; ds.forEach(function (d) { var yy = yearsFor(ST.c, ST.t, d), n = yy[yy.length - 1] * 100 + yy.length; if (n > m) { m = n; bd = d; } }); ST.d = bd; }
    var ys = yearsFor(ST.c, ST.t, ST.d); if (ys.indexOf(ST.y) < 0) ST.y = ys[ys.length - 1];
    if (!D.vars.some(function (v) { return v[0] === ST.v; })) ST.v = 'SE420';
    return ys;
  }
  function pickType(t) { ST.note = ''; var old = ST.c; ST.t = t; if (cnt(ST.c, t) === 0) { var c2 = bestCom(t); ST.note = fm(tt().noCom, { t: tlabel(t), c: D.ccaa[old], c2: D.ccaa[c2] }); ST.c = c2; } ST.d = null; ST.y = null; }
  function pickCom(c) { ST.note = ''; var old = ST.t; ST.c = c; if (cnt(c, ST.t) === 0) { var sid = secOf(ST.t), t2 = bestType(c, sid ? secTypes(sid) : null); if (t2 == null) t2 = bestType(c, null); ST.note = fm(tt().noType, { t: tlabel(old), c: D.ccaa[c], t2: tlabel(t2) }); ST.t = t2; } ST.d = null; ST.y = null; }
  function pickSec(id) { var pool = secTypes(id), t2 = bestType(ST.c, pool); if (t2 != null) { ST.note = ''; ST.t = t2; ST.d = null; ST.y = null; return; } var best = pool[0], m = -1; pool.forEach(function (ti) { var n = D.rows.filter(function (x) { return x[2] === ti; }).length; if (n > m) { m = n; best = ti; } }); pickType(best); }
  function subLabel(ti, multi) { var x = D.types[ti]; return multi ? tlabel(ti) : rt(x[1]); }
  function pct(a, b) { return b != null && b !== 0 && a != null ? (a - b) / Math.abs(b) * 100 : null; }
  function sgn(c) { return (c > 0 ? '+' : c < 0 ? '−' : '') + nf(Math.abs(c), 1) + ' %'; }
  function val(row, id) { return row ? row[6][vidx(id)] : null; }
  function chartFor(vi, ys) {
    var pts = [];
    ys.forEach(function (y) { var r = find(y, ST.c, ST.t, ST.d); if (r && r[6][vi] != null) pts.push({ x: Date.UTC(D.years[y], 0, 1), y: r[6][vi], l: String(D.years[y]) }); });
    if (pts.length < 2) return '';
    var v = D.vars[vi];
    return window.DehesaChart.render({ series: [{ name: rt(v[1]), color: '#2f6b4a', pts: pts }], xMode: 'time', xTitle: tt().year, yTitle: ru(v[2]), aria: rt(v[1]) + ' (' + ru(v[2]) + ')', noLegend: true,
      vFmt: function (x) { return nf(x, dec(x)); }, xFmt: function (x) { return new Date(x).getUTCFullYear(); } });
  }
  // ---------- pintado ----------
  function topHtml() {
    var t = tt();
    return '<div class="um-hero"><h2 class="um-q" id="rc-q">' + esc(t.q) + '</h2><form class="um-form" id="rc-form" role="search" aria-labelledby="rc-q"><input class="um-input" id="rc-s" type="search" autocomplete="off" placeholder="' + esc(t.ph) + '" aria-label="' + esc(t.q) + '"><button class="di-btn um-go" type="submit">' + esc(t.go) + '</button></form><div id="rc-sr" class="rc-sg" aria-live="polite"></div>' +
      '<h3 class="um-h2">' + esc(t.secs) + '</h3><div class="um-prods" id="rc-secs"></div></div><div id="rc-ctl"></div><div id="rc-out"></div>';
  }
  function secsHtml() {
    var cur = secOf(ST.t);
    return SEC.map(function (s) { return '<button type="button" class="um-prod" data-sec="' + s[0] + '" data-rf="sec:' + s[0] + '" aria-pressed="' + (s[0] === cur) + '"><span class="um-emo" aria-hidden="true">' + s[1] + '</span><span>' + esc(secName(s[0])) + '</span></button>'; }).join('');
  }
  function ctlHtml(ys) {
    var t = tt(), sid = secOf(ST.t), all = sid ? secTypes(sid) : [ST.t], pool = all.filter(function (ti) { return cnt(ST.c, ti) > 0 || ti === ST.t; });
    var multi = uniq(all.map(function (ti) { return D.types[ti][0]; })).length > 1;
    var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
    var fld = function (id, label, inner) { return '<div class="rc-fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="di-compare-select" data-rf="' + id + '">' + inner + '</select></div>'; };
    var h = '<div class="rc-ctl">';
    if (pool.length > 1) h += fld('rc-t', t.subtype, opt(pool, ST.t, function (k) { return subLabel(k, multi); }));
    h += fld('rc-c', t.ccaa, opt(comsFor(ST.t), ST.c, function (k) { return D.ccaa[k]; })) + fld('rc-y', t.year, opt(ys.slice().reverse(), ST.y, function (k) { return D.years[k]; }));
    h += '<button type="button" class="di-btn um-cf" data-reset="1" data-rf="reset">' + esc(t.reset) + '</button></div>';
    var hid = all.length - pool.length; if (hid > 0) h += '<p class="um-hint">' + esc(fm(t.onlyHere, { n: hid })) + '</p>';
    var ds = dimsFor(ST.c, ST.t);
    if (ds.length > 1) h += '<fieldset class="rc-sz"><legend><b>' + esc(t.size) + '</b> <span class="um-cnt">· ' + esc(t.sizeHint) + '</span></legend><div class="rc-chips">' + ds.map(function (d) { return '<button type="button" class="rc-chip" data-dim="' + d + '" data-rf="dim:' + d + '" aria-pressed="' + (d === ST.d) + '">' + esc(rt(D.dims[d])) + '</button>'; }).join('') + '</div></fieldset>';
    else if (ds.length === 1) h += '<p class="um-hint"><b>' + esc(t.size) + ':</b> ' + esc(rt(D.dims[ds[0]])) + '</p>';
    return h;
  }
  function outHtml(ys) {
    var t = tt(), vi = vidx(ST.v), cur = find(ST.y, ST.c, ST.t, ST.d), pyI = ys[ys.indexOf(ST.y) - 1], prev = pyI != null ? find(pyI, ST.c, ST.t, ST.d) : null, h = '';
    if (ST.note) h += '<p class="um-warn" role="status">' + esc(ST.note) + '</p>';
    var names = { t: tlabel(ST.t), c: D.ccaa[ST.c], y: D.years[ST.y] }, net = val(cur, 'SE420'), inc = val(cur, 'SE131'), cost = val(cur, 'SE270'), sb = val(cur, 'XSCVA'), nc = net != null ? pct(net, val(prev, 'SE420')) : null, sum;
    if (net == null) sum = fm(t.sumC, names);
    else { var o = { t: names.t, c: names.c, y: names.y, v: fmt(net), i: inc != null ? fmt(inc) : '—', k: cost != null ? fmt(cost) : '—', chg: nc != null ? sgn(nc) : '', py: pyI != null ? D.years[pyI] : '' }; sum = fm(nc != null ? t.sumA : t.sumB, o); }
    if (net != null && sb != null && sb >= 0) sum += fm(t.sumS, { x: nf(sb, 0) });
    h += '<p class="rc-sum" role="status" aria-live="polite">' + esc(sum) + '</p>';
    h += '<p class="um-hint" style="margin:0 0 8px">' + esc(t.kHint) + '</p><div class="rc-kpis">' + KP.map(function (k) {
      var i = vidx(k[0]), a = cur ? cur[6][i] : null, b = prev ? prev[6][i] : null, c = pct(a, b);
      return '<button type="button" class="rc-kpi" data-kpi="' + k[0] + '" data-rf="kpi:' + k[0] + '" aria-pressed="' + (k[0] === ST.v) + '"><span class="rc-kl">' + esc(t[k[1]]) + '</span><span class="rc-kv">' + (a != null ? fmt(a) + ' <small>€</small>' : '<small>' + esc(t.nodata) + '</small>') + '</span><span class="rc-kc">' + (c != null ? esc(sgn(c) + ' ' + fm(t.vs, { y: D.years[pyI] })) : '&nbsp;') + '</span></button>';
    }).join('') + '</div>';
    var v = D.vars[vi], ch = chartFor(vi, ys);
    h += '<div class="di-card rc-card" id="rc-chart"><div class="rc-ct">' + esc(rt(v[1])) + ' (' + esc(ru(v[2])) + ')</div>' + (ch || '<p class="di-movers-hint">' + esc(t.none) + '</p>');
    var vv = cur ? cur[6][vi] : null;
    if (vv != null) h += '<div class="di-movers-hint" style="margin-top:6px">' + D.years[ST.y] + ': <b>' + nf(vv, dec(vv)) + ' ' + esc(ru(v[2])) + '</b> · ' + esc(t.farms) + ': ' + (cur[4] != null ? nf(cur[4], 0) : '—') + ' · ' + esc(t.rep) + ': ' + (cur[5] != null ? nf(cur[5], 0) : '—') + '</div>';
    if (cur && cur[4] != null && cur[4] < 10) h += '<p class="um-warn" style="margin:8px 0 0">' + esc(fm(t.small, { n: nf(cur[4], 0) })) + '</p>';
    h += '</div>';
    var rk = D.rows.filter(function (x) { return x[0] === ST.y && x[2] === ST.t && x[3] === ST.d && x[6][vi] != null; }).sort(function (a, b) { return b[6][vi] - a[6][vi]; });
    if (rk.length > 1) {
      var max = Math.max.apply(null, rk.map(function (x) { return Math.abs(x[6][vi]); })) || 1;
      h += '<div class="di-card rc-card"><div class="rc-ct">' + esc(t.rank) + ' · ' + esc(rt(v[1])) + ' (' + esc(ru(v[2])) + ') · ' + D.years[ST.y] + '</div><p class="um-hint" style="margin:0 0 6px">' + esc(t.rankHint) + '</p><div class="di-scroll"><table class="rc-t" data-no-cards data-no-rows><tbody>';
      rk.forEach(function (x) {
        var w = Math.max(2, Math.round(Math.abs(x[6][vi]) / max * 100)), me = x[1] === ST.c;
        h += '<tr' + (me ? ' class="on"' : '') + '><td><button type="button" class="rc-lk" data-com="' + x[1] + '" data-rf="com:' + x[1] + '" aria-pressed="' + me + '">' + esc(D.ccaa[x[1]]) + '</button></td><td class="rc-bar"><div style="height:8px;border-radius:4px;background:' + (x[6][vi] < 0 ? '#b5483a' : '#2f6b4a') + ';width:' + w + '%;opacity:' + (me ? 1 : .55) + '"></div></td><td class="r">' + nf(x[6][vi], dec(x[6][vi])) + ' <small>' + esc(ru(v[2])) + '</small></td><td class="r um-cnt">' + (x[4] != null ? nf(x[4], 0) : '—') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    }
    h += '<details class="um-adv" id="rc-all"' + (ST.openAll ? ' open' : '') + '><summary>' + esc(fm(t.allv, { n: D.vars.length })) + ' · ' + D.years[ST.y] + '</summary><div class="rc-allb">';
    GR.forEach(function (g) {
      var rows = D.vars.map(function (vv2, i) { return [vv2, i]; }).filter(function (p) { return g[1](p[0][0]) && cur && cur[6][p[1]] != null; });
      if (!rows.length) return;
      h += '<h4 class="rc-gh">' + esc(t[g[0]]) + '</h4><div class="di-scroll"><table class="rc-t" data-no-cards data-no-rows><tbody>' + rows.map(function (p) {
        var a = cur[6][p[1]], c = pct(a, prev ? prev[6][p[1]] : null);
        return '<tr><td><button type="button" class="rc-lk" data-var="' + p[0][0] + '" data-rf="var:' + p[0][0] + '" aria-pressed="' + (p[0][0] === ST.v) + '" title="' + esc(t.pick) + '">' + esc(rt(p[0][1])) + '</button></td><td class="r">' + nf(a, dec(a)) + '</td><td class="um-cnt">' + esc(ru(p[0][2])) + '</td><td class="r">' + (c == null ? '' : sgn(c)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    });
    h += '</div></details>';
    h += '<p class="di-movers-hint" style="margin-top:12px">' + t.note + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener">' + esc(D.source.name) + '</a> · ' + t.lic + ': ' + esc(D.source.license) + ' · ' + t.updated + ': ' + esc((D.generatedAt || '').slice(0, 10)) + '</p>';
    return h;
  }
  function syncUrl() {
    if (EMB || !window.history || !history.replaceState) return;
    try { history.replaceState(null, '', location.pathname + '?t=' + ST.t + '&c=' + ST.c + '&d=' + ST.d + '&y=' + ST.y + '&v=' + ST.v); } catch (e) { /* sin historial */ }
  }
  function update(focusKey) {
    var ys = fix(), root = document.getElementById('recan-body'); if (!root || !D) return;
    var ae = focusKey || (document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-rf') : null);
    var ctl = document.getElementById('rc-ctl'), out = document.getElementById('rc-out'), se = document.getElementById('rc-secs');
    if (!ctl || !out || !se) return;
    se.innerHTML = secsHtml(); ctl.innerHTML = ctlHtml(ys); out.innerHTML = outHtml(ys); syncUrl();
    if (ae) { var el = root.querySelector('[data-rf="' + ae + '"]'); if (el) el.focus(); }
  }
  function suggest(q) {
    var t = tt(), n = norm(q).trim(), res = [];
    if (!n) return res;
    var add = function (kind, id, label, hay, extra) { var h = norm(hay), i = h.indexOf(n); if (i >= 0) res.push({ kind: kind, id: id, label: label, k: t[extra], s: i === 0 ? 0 : (' ' + h).indexOf(' ' + n) >= 0 ? 1 : 2 }); };
    SEC.forEach(function (s) { add('s', s[0], secName(s[0]), secName(s[0]) + ' ' + SECN.es[s[0]], 'kS'); });
    D.types.forEach(function (x, i) { add('t', i, tlabel(i), tlabel(i) + ' ' + x[0] + ' ' + x[1], 'kT'); });
    D.ccaa.forEach(function (c, i) { add('c', i, c, c, 'kC'); });
    return res.sort(function (a, b) { return a.s - b.s; }).slice(0, 8);
  }
  function sgHtml(q) {
    var t = tt(), r = suggest(q); if (!q.trim()) return '';
    if (!r.length) return '<p class="um-hint">' + esc(fm(t.nores, { q: q })) + '</p>';
    return '<ul class="rc-sgl">' + r.map(function (x) { return '<li><button type="button" class="rc-sgb" data-sg="' + x.kind + ':' + x.id + '"><span>' + esc(x.label) + '</span><small>' + esc(x.k) + '</small></button></li>'; }).join('') + '</ul>';
  }
  function applySg(s) {
    var p = s.split(':'), id = p[1]; 
    if (p[0] === 's') pickSec(id); else if (p[0] === 't') pickType(+id); else pickCom(+id);
    var inp = document.getElementById('rc-s'), sr = document.getElementById('rc-sr'); if (inp) inp.value = ''; if (sr) sr.innerHTML = '';
    update(); var o = document.getElementById('rc-out'); if (o && o.scrollIntoView && window.matchMedia && !matchMedia('(prefers-reduced-motion: reduce)').matches) { /* el resumen queda justo debajo */ }
  }
  function build() {
    var root = document.getElementById('recan-body'); if (!root || !D) return;
    root.innerHTML = topHtml();
    var form = document.getElementById('rc-form'), inp = document.getElementById('rc-s'), sr = document.getElementById('rc-sr');
    inp.oninput = function () { sr.innerHTML = sgHtml(inp.value); };
    form.onsubmit = function (e) { e.preventDefault(); var r = suggest(inp.value); if (r.length) applySg(r[0].kind + ':' + r[0].id); else sr.innerHTML = sgHtml(inp.value); };
    root.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-sg],[data-sec],[data-kpi],[data-var],[data-dim],[data-com],[data-reset]') : null; if (!b || !root.contains(b)) return;
      if (b.hasAttribute('data-sg')) return applySg(b.getAttribute('data-sg'));
      var k;
      if ((k = b.getAttribute('data-sec'))) pickSec(k);
      else if ((k = b.getAttribute('data-kpi'))) { ST.v = k; ST.note = ''; }
      else if ((k = b.getAttribute('data-var'))) { ST.v = k; ST.note = ''; ST.openAll = true; }
      else if ((k = b.getAttribute('data-dim'))) { ST.d = +k; ST.y = null; ST.note = ''; }
      else if ((k = b.getAttribute('data-com'))) pickCom(+k);
      else if (b.hasAttribute('data-reset')) defaults();
      update(b.getAttribute('data-rf'));
      if (b.hasAttribute('data-var')) { var c = document.getElementById('rc-chart'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' }); }
    };
    root.onchange = function (e) {
      var el = e.target, id = el.id; if (!id || id.indexOf('rc-') !== 0) return;
      if (id === 'rc-c') pickCom(+el.value); else if (id === 'rc-t') pickType(+el.value); else if (id === 'rc-y') { ST.y = +el.value; ST.note = ''; } else return;
      update(el.getAttribute('data-rf'));
    };
    root.addEventListener('toggle', function (e) { if (e.target && e.target.id === 'rc-all') ST.openAll = e.target.open; }, true);
    update();
  }
  function fromUrl() {
    if (EMB) return; var q = {};
    (location.search || '').replace(/^\?/, '').split('&').forEach(function (p) { var a = p.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });
    if (q.t != null && /^\d+$/.test(q.t)) ST.t = +q.t;
    if (q.c != null && /^\d+$/.test(q.c)) ST.c = +q.c;
    if (q.d != null && /^\d+$/.test(q.d)) ST.d = +q.d;
    if (q.y != null && /^\d+$/.test(q.y)) ST.y = +q.y;
    if (q.v) ST.v = q.v;
  }
  function shell() { if (!ON) return; var t = tt(); var h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
  var EMB = !!document.getElementById('cs-es'), ON = !EMB;
  if (!EMB) window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); if (ON) { shell(); build(); } };
  shell();
  var LOADED = false;
  function loadData() {
    if (LOADED) { build(); return; } LOADED = true;
    fetch('data/recan.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) { D = d; AND = D.ccaa.indexOf('Andalucía'); defaults(); fromUrl(); if (ON) build(); })
      .catch(function () { var b = document.getElementById('recan-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
  }
  if (!EMB) loadData();
  if (EMB && window.CASeries && window.CASeries.custom) window.RECANTab = window.CASeries.custom({ id: 'cs-es', tabsHost: 'cs-ca-tabs', usBody: 'cs-body', usExtra: '#eucs', usRender: function () { if (window.__csUsRender) window.__csUsRender(); }, country: 'ES', tabUS: ['EE. UU.', 'US', 'États-Unis', 'Stati Uniti'], label: ['España (RECAN)', 'Spain (RECAN)', 'Espagne (RECAN)', 'Spagna (RECAN)'], onShow: function () { ON = true; shell(); loadData(); } });
})();
