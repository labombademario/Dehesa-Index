/* Dehesa Index — Mi explotación (v1). ES5.
   Tus cultivos (varias líneas) con superficie, rendimiento, costes y precio; margen, precio de equilibrio, sensibilidad y total por moneda,
   más «qué ha cambiado desde tu última visita» para las líneas que usan el precio de referencia de Dehesa.
   Reutiliza el motor de la calculadora (window.DICalc: mismas fórmulas, Unit Engine, BCE, frescura): aquí no se duplica ninguna cuenta.
   Separa siempre el DATO OFICIAL (precio de referencia con fuente, fecha y frescura) del CÁLCULO DEHESA (hecho con tus cifras).
   Privacidad: todo ocurre en el navegador. Guardado opcional en localStorage (di-farm-v1), apagado por defecto. No se rellena ningún dato por ti. */
(function () {
  'use strict';
  var K = window.DICalc; if (!K || !document.getElementById('fx-body')) return;
  var F = K.fmt, esc = F.esc, num = F.num, nf = F.nf, money = F.money, r2 = F.r2, dstr = F.dstr;
  var LANGS = ['es', 'en', 'fr', 'it'], KEY = 'di-farm-v1', MAXL = 8;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Mi explotación', 'My farm', 'Mon exploitation', 'La mia azienda'],
    sub: ['Tus cultivos, tus costes y el mercado en un solo sitio: margen, precio de equilibrio, sensibilidad y qué ha cambiado desde tu última visita. Todo se calcula en tu navegador: no se envía ningún dato.', 'Your crops, your costs and the market in one place: margin, break-even price, sensitivity and what has changed since your last visit. Everything is computed in your browser: no data is sent.', 'Vos cultures, vos coûts et le marché au même endroit : marge, prix d’équilibre, sensibilité et ce qui a changé depuis votre dernière visite. Tout est calculé dans votre navigateur : aucune donnée n’est envoyée.', 'Le tue colture, i tuoi costi e il mercato in un unico posto: margine, prezzo di pareggio, sensibilità e che cosa è cambiato dalla tua ultima visita. Tutto è calcolato nel tuo browser: nessun dato viene inviato.'],
    privacy: ['Tus datos no salen del navegador. Si activas “Recordar”, se guardan solo en este dispositivo (localStorage) y puedes borrarlos cuando quieras. Sin “Recordar” no puedo acordarme de tu última visita.', 'Your data never leaves the browser. If you enable “Remember”, it is stored only on this device (localStorage) and you can delete it any time. Without “Remember” I cannot recall your last visit.', 'Vos données ne quittent pas le navigateur. Si vous activez « Mémoriser », elles restent sur cet appareil (localStorage) et vous pouvez les effacer à tout moment. Sans « Mémoriser », je ne peux pas me souvenir de votre dernière visite.', 'I tuoi dati non lasciano il browser. Se attivi “Ricorda”, restano solo su questo dispositivo (localStorage) e puoi cancellarli quando vuoi. Senza “Ricorda” non posso ricordare la tua ultima visita.'],
    remember: ['Recordar en este navegador', 'Remember in this browser', 'Mémoriser dans ce navigateur', 'Ricorda in questo browser'],
    forget: ['Borrar datos guardados', 'Delete saved data', 'Effacer les données enregistrées', 'Cancella i dati salvati'],
    tagOff: ['Dato oficial', 'Official data', 'Donnée officielle', 'Dato ufficiale'],
    tagCalc: ['Cálculo Dehesa con tus cifras', 'Dehesa calculation with your figures', 'Calcul Dehesa avec vos chiffres', 'Calcolo Dehesa con le tue cifre'],
    chTitle: ['Qué ha cambiado desde tu última visita', 'What has changed since your last visit', 'Ce qui a changé depuis votre dernière visite', 'Che cosa è cambiato dalla tua ultima visita'],
    chHint: ['solo cultivos con «Precio de Dehesa»', 'only crops using “Dehesa price”', 'uniquement les cultures avec « Prix Dehesa »', 'solo colture con «Prezzo Dehesa»'],
    chNone: ['Aún no hay nada que comparar. Elige «Precio de Dehesa» en algún cultivo y activa «Recordar»: la próxima vez verás aquí qué ha cambiado.', 'Nothing to compare yet. Choose “Dehesa price” on a crop and enable “Remember”: next time you will see here what has changed.', 'Rien à comparer pour l’instant. Choisissez « Prix Dehesa » sur une culture et activez « Mémoriser » : la prochaine fois, vous verrez ici ce qui a changé.', 'Ancora nulla da confrontare. Scegli «Prezzo Dehesa» su una coltura e attiva «Ricorda»: la prossima volta vedrai qui che cosa è cambiato.'],
    chNoRem: ['Sin «Recordar» los cambios solo se comparan mientras esta página sigue abierta.', 'Without “Remember”, changes are only compared while this page stays open.', 'Sans « Mémoriser », les changements ne sont comparés que tant que cette page reste ouverte.', 'Senza «Ricorda» le variazioni si confrontano solo finché questa pagina resta aperta.'],
    chSame: ['Sin dato nuevo desde el {0}: el precio de referencia sigue en {1} / t (dato de {2}).', 'No new data since {0}: the reference price is still {1} / t (data for {2}).', 'Pas de nouvelle donnée depuis le {0} : le prix de référence reste à {1} / t (donnée du {2}).', 'Nessun dato nuovo dal {0}: il prezzo di riferimento resta {1} / t (dato del {2}).'],
    chDiff: ['Desde el {0}, el precio de referencia pasó de {1} a {2} por t ({3}; dato de {4}).', 'Since {0}, the reference price went from {1} to {2} per t ({3}; data for {4}).', 'Depuis le {0}, le prix de référence est passé de {1} à {2} par t ({3} ; donnée du {4}).', 'Dal {0}, il prezzo di riferimento è passato da {1} a {2} per t ({3}; dato del {4}).'],
    chMargin: ['Con tus cifras, el margen por ha pasa de {0} a {1}', 'With your figures, margin per ha goes from {0} to {1}', 'Avec vos chiffres, la marge par ha passe de {0} à {1}', 'Con le tue cifre, il margine per ha passa da {0} a {1}'],
    chMarginT: ['y el total de la línea de {0} a {1}', 'and the line total from {0} to {1}', 'et le total de la ligne de {0} à {1}', 'e il totale della riga da {0} a {1}'],
    chOther: ['El mercado o la moneda de referencia ha cambiado desde la última vez: no se compara con el dato guardado.', 'The reference market or currency changed since last time: not compared with the saved figure.', 'Le marché ou la devise de référence a changé depuis la dernière fois : pas de comparaison avec la donnée enregistrée.', 'Il mercato o la valuta di riferimento è cambiato dall’ultima volta: nessun confronto col dato salvato.'],
    chWait: ['Cargando el precio de referencia…', 'Loading the reference price…', 'Chargement du prix de référence…', 'Caricamento del prezzo di riferimento…'],
    markSeen: ['Marcar todo como visto', 'Mark all as seen', 'Tout marquer comme vu', 'Segna tutto come visto'],
    seenOk: ['Guardado: la próxima vez se compara con estos precios.', 'Saved: next time it will be compared with these prices.', 'Enregistré : la prochaine fois, la comparaison se fera avec ces prix.', 'Salvato: la prossima volta si confronterà con questi prezzi.'],
    sumTitle: ['Resumen de la explotación', 'Farm summary', 'Résumé de l’exploitation', 'Riepilogo dell’azienda'],
    sumHint: ['no se suman monedas distintas', 'different currencies are never added', 'les devises différentes ne sont jamais additionnées', 'valute diverse non vengono mai sommate'],
    sumNeed: ['Rellena superficie, rendimiento, costes y precio de al menos un cultivo para ver el resumen.', 'Fill in area, yield, costs and price for at least one crop to see the summary.', 'Renseignez surface, rendement, coûts et prix d’au moins une culture pour voir le résumé.', 'Compila superficie, resa, costi e prezzo di almeno una coltura per vedere il riepilogo.'],
    lines: ['Tus cultivos', 'Your crops', 'Vos cultures', 'Le tue colture'],
    add: ['Añadir cultivo', 'Add crop', 'Ajouter une culture', 'Aggiungi coltura'],
    rm: ['Quitar este cultivo', 'Remove this crop', 'Retirer cette culture', 'Rimuovi questa coltura'],
    maxL: ['Máximo {0} cultivos en esta versión.', 'Up to {0} crops in this version.', 'Maximum {0} cultures dans cette version.', 'Massimo {0} colture in questa versione.'],
    crop: ['Cultivo', 'Crop', 'Culture', 'Coltura'], area: ['Superficie', 'Area', 'Surface', 'Superficie'], yield: ['Rendimiento', 'Yield', 'Rendement', 'Resa'],
    currency: ['Moneda', 'Currency', 'Devise', 'Valuta'], price: ['Precio', 'Price', 'Prix', 'Prezzo'],
    mine: ['Mi precio', 'My price', 'Mon prix', 'Il mio prezzo'], dehesa: ['Precio de Dehesa', 'Dehesa price', 'Prix Dehesa', 'Prezzo Dehesa'],
    ha: ['ha', 'ha', 'ha', 'ha'], ac: ['acre', 'acre', 'acre', 'acro'], tha: ['t/ha', 't/ha', 't/ha', 't/ha'], buac: ['bu/acre', 'bu/acre', 'bu/acre', 'bu/acro'],
    pt: ['por tonelada', 'per tonne', 'par tonne', 'per tonnellata'], pbu: ['por bushel', 'per bushel', 'par boisseau', 'per bushel'],
    market: ['Mercado de referencia', 'Reference market', 'Marché de référence', 'Mercato di riferimento'],
    costs: ['Costes', 'Costs', 'Coûts', 'Costi'], costsHint: ['por unidad de superficie; lo que dejes en blanco cuenta como 0', 'per area unit; anything left blank counts as 0', 'par unité de surface ; ce qui reste vide compte pour 0', 'per unità di superficie; ciò che lasci vuoto vale 0'],
    c_fert: ['Fertilizantes', 'Fertiliser', 'Engrais', 'Fertilizzanti'], c_seed: ['Semilla', 'Seed', 'Semences', 'Sementi'], c_prot: ['Fitosanitarios', 'Crop protection', 'Produits phytosanitaires', 'Fitosanitari'],
    c_feed: ['Pienso / alimentación comprada', 'Feed / purchased feed', 'Aliments achetés', 'Mangimi acquistati'], c_energy: ['Energía y gasóleo', 'Energy and diesel', 'Énergie et gazole', 'Energia e gasolio'], c_mach: ['Maquinaria', 'Machinery', 'Machines', 'Macchinari'],
    c_labour: ['Mano de obra', 'Labour', 'Main-d’œuvre', 'Manodopera'], c_rent: ['Alquiler de tierra', 'Land rent', 'Fermage', 'Affitto terreno'], c_other: ['Otros costes', 'Other costs', 'Autres coûts', 'Altri costi'],
    above: ['{0} % por encima del equilibrio', '{0} % above break-even', '{0} % au-dessus de l’équilibre', '{0} % sopra il pareggio'], below: ['{0} % por debajo del equilibrio', '{0} % below break-even', '{0} % sous l’équilibre', '{0} % sotto il pareggio'],
    bePrice: ['Precio de equilibrio', 'Break-even price', 'Prix d’équilibre', 'Prezzo di pareggio'], priceUsed: ['Precio usado', 'Price used', 'Prix utilisé', 'Prezzo usato'],
    marginHa: ['Margen por ha', 'Margin per ha', 'Marge par ha', 'Margine per ha'], margin: ['Margen total', 'Total margin', 'Marge totale', 'Margine totale'],
    marginPct: ['Margen sobre ingresos', 'Margin on revenue', 'Marge sur recettes', 'Margine sui ricavi'], cost: ['Coste total', 'Total cost', 'Coût total', 'Costo totale'], revenue: ['Ingresos', 'Revenue', 'Recettes', 'Ricavi'],
    total: ['Total', 'Total', 'Total', 'Totale'], line: ['Cultivo', 'Crop', 'Culture', 'Coltura'],
    sens: ['Sensibilidad', 'Sensitivity', 'Sensibilité', 'Sensibilità'], vary: ['Variable', 'Variable', 'Variable', 'Variabile'], step: ['Variación', 'Change', 'Variation', 'Variazione'],
    vPrice: ['Precio', 'Price', 'Prix', 'Prezzo'], vYield: ['Rendimiento', 'Yield', 'Rendement', 'Resa'], vCost: ['Costes', 'Costs', 'Coûts', 'Costi'], actual: ['Actual', 'Current', 'Actuel', 'Attuale'],
    sensNote: ['Se aplica a todos los cultivos a la vez y solo con las líneas que tienen margen calculable. No es una previsión.', 'Applied to all crops at once and only to lines with a computable margin. It is not a forecast.', 'Appliquée à toutes les cultures à la fois et seulement aux lignes avec une marge calculable. Ce n’est pas une prévision.', 'Applicata a tutte le colture insieme e solo alle righe con margine calcolabile. Non è una previsione.'],
    needMore: ['Rellena superficie, rendimiento y precio para ver el margen; los costes por sí solos ya dan el coste por unidad.', 'Fill in area, yield and price to see the margin; costs alone already give the cost per unit.', 'Renseignez surface, rendement et prix pour voir la marge ; les coûts seuls donnent déjà le coût unitaire.', 'Compila superficie, resa e prezzo per vedere il margine; i soli costi danno già il costo unitario.'],
    loading: ['Cargando precio…', 'Loading price…', 'Chargement du prix…', 'Caricamento prezzo…'],
    noRef: ['Dehesa no tiene un precio de referencia convertible para este cultivo en esta moneda; usa «Mi precio».', 'Dehesa has no convertible reference price for this crop in this currency; use “My price”.', 'Dehesa n’a pas de prix de référence convertible pour cette culture dans cette devise ; utilisez « Mon prix ».', 'Dehesa non ha un prezzo di riferimento convertibile per questa coltura in questa valuta; usa «Il mio prezzo».'],
    refTitle: ['Precio de referencia de Dehesa', 'Dehesa reference price', 'Prix de référence Dehesa', 'Prezzo di riferimento Dehesa'],
    original: ['Dato original', 'Original figure', 'Donnée d’origine', 'Dato originale'], asOf: ['Dato de', 'Data for', 'Donnée du', 'Dato del'], source: ['Fuente', 'Source', 'Source', 'Fonte'],
    stale: ['Aviso: este dato está {0}; revísalo antes de decidir.', 'Warning: this data point is {0}; check it before deciding.', 'Attention : cette donnée est {0} ; vérifiez-la avant de décider.', 'Attenzione: questo dato è {0}; verificalo prima di decidere.'],
    refNote: ['Es una referencia de mercado, no tu precio de venta. Convertido con el tipo de cambio mensual del BCE y el Unit Engine.', 'It is a market reference, not your selling price. Converted with the monthly ECB rate and the Unit Engine.', 'C’est une référence de marché, pas votre prix de vente. Converti avec le taux BCE mensuel et l’Unit Engine.', 'È un riferimento di mercato, non il tuo prezzo di vendita. Convertito con il tasso BCE mensile e l’Unit Engine.'],
    notInc: ['No incluido: subvenciones, seguros, intereses, impuestos ni amortización de maquinaria salvo que los añadas en «Otros» o «Maquinaria». Para IVA o impuesto sobre ventas usa la calculadora.', 'Not included: subsidies, insurance, interest, taxes or machinery depreciation unless you add them under “Other” or “Machinery”. For VAT or sales tax use the calculator.', 'Non inclus : subventions, assurances, intérêts, taxes ni amortissement des machines sauf si vous les ajoutez sous « Autres » ou « Machines ». Pour la TVA ou la taxe de vente, utilisez le calculateur.', 'Non inclusi: sussidi, assicurazioni, interessi, imposte né ammortamento dei macchinari salvo che tu li aggiunga in «Altri» o «Macchinari». Per IVA o imposta sulle vendite usa il calcolatore.'],
    toCalc: ['Calculadora completa (impuestos, escenarios A/B/C)', 'Full calculator (taxes, A/B/C cases)', 'Calculateur complet (taxes, scénarios A/B/C)', 'Calcolatore completo (imposte, scenari A/B/C)'],
    toWatch: ['Mi seguimiento (avisos de precio)', 'My watchlist (price alerts)', 'Mon suivi (alertes de prix)', 'Il mio seguito (avvisi di prezzo)'],
    bad: ['Revisa este valor', 'Check this value', 'Vérifiez cette valeur', 'Controlla questo valore']
  };
  function t(k) { var a = TX[k]; if (!a) return k; return a[li()] === undefined ? a[0] : a[li()]; }
  function tf(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1] === undefined ? m : a[+i + 1]; }); }
  var U = window.DIUnits;
  var S = { lines: [], seen: {}, remember: false, vary: 'price', step: 10, n: 0, justSeen: false }, REF = {};

  /* ---------- guardado opcional ---------- */
  function newLine(crop) { S.n++; var c = K.blank(crop || 'trigo'); c.pSrc = 'manual'; return { id: 'l' + S.n, c: c }; }
  function save() { if (!S.remember) return; try { localStorage.setItem(KEY, JSON.stringify({ v: 1, lines: S.lines, seen: S.seen, vary: S.vary, step: S.step, n: S.n })); } catch (e) { /* sin almacenamiento */ } }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return; var d = JSON.parse(raw); if (!d || !Array.isArray(d.lines)) return;
      d.lines.slice(0, MAXL).forEach(function (l) {
        if (!l || !l.c || !K.CROPS[l.c.crop]) return;
        var b = K.blank(l.c.crop); Object.keys(b).forEach(function (f) { if (f !== 'costs' && f !== 'tax' && l.c[f] !== undefined) b[f] = l.c[f]; });
        K.COSTS.forEach(function (f) { if (l.c.costs && l.c.costs[f] !== undefined) b.costs[f] = l.c.costs[f]; });
        S.lines.push({ id: String(l.id || ('l' + (S.lines.length + 1))).replace(/[^a-z0-9]/gi, ''), c: b });
      });
      if (d.seen && typeof d.seen === 'object') Object.keys(d.seen).forEach(function (k) { var v = d.seen[k]; if (v && typeof v.perT === 'number' && v.key && v.cur) S.seen[k] = v; });
      if (d.vary === 'yield' || d.vary === 'cost') S.vary = d.vary; if (d.step === 5 || d.step === 20) S.step = d.step;
      S.n = Math.max(+d.n || 0, S.lines.length); if (S.lines.length) S.remember = true;
    } catch (e) { /* datos corruptos: se ignoran */ }
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- precio de referencia por línea ---------- */
  function lineOf(id) { for (var i = 0; i < S.lines.length; i++) if (S.lines[i].id === id) return S.lines[i]; return null; }
  function ensureRef(line) {
    var c = line.c; if (c.pSrc !== 'dehesa') { delete REF[line.id]; return; }
    var crop = c.crop, cur = c.cur; REF[line.id] = { state: 'loading' };
    K.loadRef(crop).then(function (obs) {
      if (line.c !== c || c.crop !== crop || c.cur !== cur || c.pSrc !== 'dehesa') return;
      var rows = obs.map(function (o) { return { key: o.region + '/' + o.product, o: o, r: K.refPerT(o, crop, cur) }; });
      var ok = rows.filter(function (x) { return x.r.value !== null && x.r.value !== undefined; });
      if (!ok.length) { REF[line.id] = { state: 'none', reason: rows[0] ? rows[0].r.reason : '' }; c.p = ''; }
      else {
        var pick = ok[0]; ok.forEach(function (x) { if (x.key === c.inst) pick = x; });
        c.inst = pick.key; c.pUnit = 't'; c.p = String(r2(pick.r.value));
        var fr = window.DIFreshness.evaluate(pick.o.observationDate, pick.o.frequency, pick.o.sourceId);
        REF[line.id] = { state: 'ok', ok: ok, pick: pick, value: pick.r.value, fresh: fr.state, period: String(pick.o.observationDate || '') };
        if (!S.seen[line.id]) { S.seen[line.id] = snap(line); }
      }
      save(); drawLine(line); drawAll();
    }, function () { REF[line.id] = { state: 'none', reason: '' }; drawLine(line); drawAll(); });
  }
  function snap(line) { var r = REF[line.id]; return { key: r.pick.key, cur: line.c.cur, period: r.period, perT: r2(r.value), at: today() }; }

  /* ---------- helpers de cálculo ---------- */
  function ovr(f) { var x = {}; x[S.vary === 'price' ? 'price' : S.vary === 'yield' ? 'yld' : 'cost'] = f; return x; }
  function cname(line) { return K.CROPS[line.c.crop][li()]; }
  function cl(c) { return JSON.parse(JSON.stringify(c)); }
  function pnum(v, cur) { return money(v, cur, 2); }

  /* ---------- pintado ---------- */
  function tag(k, cls) { return '<span class="pt-badge fx-tag-' + cls + '">' + esc(t(k)) + '</span>'; }
  function field(id, label, html) { return '<div class="cc-field"><label for="' + id + '">' + esc(label) + '</label>' + html + '</div>'; }
  function inp(line, f, val, ph) { var id = 'fx-' + line.id + '-' + f; return '<input id="' + id + '" data-l="' + line.id + '" data-f="' + f + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(val) + '" placeholder="' + esc(ph || '0') + '">'; }
  function seg(line, f, opts, cur) { return '<div class="pt-bar-ctl" role="radiogroup">' + opts.map(function (o) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (o[0] === cur) + '" data-l="' + line.id + '" data-seg="' + f + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
  function sel(line, f, opts, cur) { return '<select id="fx-' + line.id + '-' + f + '" data-l="' + line.id + '" data-f="' + f + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function stat(label, value, sub, cls) { return '<div class="di-card pt-card"><div class="pt-k">' + esc(label) + '</div><div class="pt-v ' + (cls || '') + '">' + value + '</div>' + (sub ? '<div class="pt-sub">' + sub + '</div>' : '') + '</div>'; }

  function refHtml(line) {
    var r = REF[line.id], c = line.c; if (!r || r.state === 'loading') return '<div class="pt-skel">' + esc(t('loading')) + '</div>';
    if (r.state === 'none') return '<div class="pt-note">' + esc(t('noRef')) + '</div>';
    var o = r.pick.o, lab = (window.DIFreshness.label[r.fresh] || {})[LANGS[li()]] || r.fresh;
    var m = r.ok.length > 1 ? field('fx-' + line.id + '-inst', t('market'), sel(line, 'inst', r.ok.map(function (x) { return [x.key, K.REG[x.o.region][li()]]; }), r.pick.key)) : '';
    return m + '<div class="di-card pt-card" style="margin-top:8px">' + tag('tagOff', 'off') + '<div class="pt-k">' + esc(t('refTitle')) + ' · ' + esc(K.REG[o.region][li()]) + '</div><div class="pt-v">' + esc(pnum(r.value, c.cur)) + ' <small>/ t</small></div>' +
      '<div class="pt-sub">' + esc(t('original')) + ': ' + esc(nf(o.value, 2) + ' ' + o.currency + '/' + (K.UL[o.unit] || o.unit)) + ' · ' + esc(t('asOf')) + ' ' + esc(dstr(o.observationDate)) + '</div>' +
      '<div class="pt-sub">' + esc(t('source')) + ': ' + esc(K.SRC[o.sourceId] || o.sourceId) + '</div>' +
      '<div><span class="pt-badge pt-fs-' + r.fresh + '">' + esc(lab) + '</span></div>' +
      (r.fresh === 'DELAYED' || r.fresh === 'STALE' ? '<div class="pt-note">' + esc(tf('stale', lab.toLowerCase())) + '</div>' : '') + '</div><p class="pt-src">' + esc(t('refNote')) + '</p>';
  }
  function resultHtml(line) {
    var c = line.c, o = K.calc(c), cur = c.cur, k = o.k;
    if (o.costHa === null && o.rev === undefined) return '<div class="pt-note">' + esc(t('needMore')) + '</div>';
    var h = tag('tagCalc', 'calc') + '<div class="pt-cards">';
    if (o.costT !== undefined) h += stat(t('bePrice'), esc(pnum(o.costT, cur)) + ' <small>/ t</small>', o.costBu !== undefined ? esc(pnum(o.costBu, cur)) + ' / bu' : '');
    if (o.price) h += stat(t('priceUsed'), esc(pnum(o.price, cur)) + ' <small>/ t</small>', o.costT !== undefined ? esc(tf(o.price >= o.costT ? 'above' : 'below', nf(Math.abs(o.price / o.costT - 1) * 100, 1))) : '');
    if (o.marginHa !== undefined) h += stat(t('marginHa'), esc(money(o.marginHa, cur, 0)), (o.margin !== undefined && o.margin !== null ? esc(t('margin')) + ': ' + esc(money(o.margin, cur)) + '<br>' : '') + (o.marginPct !== null ? esc(t('marginPct')) + ': ' + esc(nf(o.marginPct, 1)) + ' %' : ''), o.marginHa >= 0 ? 'pt-up' : 'pt-down');
    h += '</div>';
    return h;
  }
  function lineHtml(line, idx) {
    var c = line.c, kgBu = K.bushelKg(c.crop), au = c.areaU === 'ha' ? t('ha') : t('ac');
    var h = '<section class="fx-line" id="fx-sec-' + line.id + '" aria-label="' + esc(cname(line)) + '"><div class="di-movers-head-row"><h3>' + esc(cname(line)) + '</h3>' + (S.lines.length > 1 ? '<button type="button" class="pt-chip" data-l="' + line.id + '" data-act="rm">' + esc(t('rm')) + '</button>' : '') + '</div>';
    h += '<div class="cc-grid">' + field('fx-' + line.id + '-crop', t('crop'), sel(line, 'crop', K.CORDER.map(function (k2) { return [k2, K.CROPS[k2][li()]]; }), c.crop));
    h += field('fx-' + line.id + '-area', t('area') + ' (' + au + ')', '<div class="cc-row">' + inp(line, 'area', c.area) + seg(line, 'areaU', [['ha', t('ha')], ['ac', t('ac')]], c.areaU) + '</div>');
    h += field('fx-' + line.id + '-y', t('yield') + ' (' + (c.yU === 't_ha' ? t('tha') : t('buac')) + ')', '<div class="cc-row">' + inp(line, 'y', c.y) + seg(line, 'yU', [['t_ha', t('tha')]].concat(kgBu ? [['bu_ac', t('buac')]] : []), kgBu ? c.yU : 't_ha') + '</div>');
    h += field('fx-' + line.id + '-cur', t('currency'), sel(line, 'cur', Object.keys(K.CURS).map(function (k2) { return [k2, k2]; }), c.cur)) + '</div>';
    h += '<fieldset class="cc-fs"><legend>' + esc(t('price')) + '</legend>' + seg(line, 'pSrc', [['manual', t('mine')], ['dehesa', t('dehesa')]], c.pSrc);
    if (c.pSrc === 'manual') h += '<div class="cc-grid">' + field('fx-' + line.id + '-p', t('mine') + ' (' + (K.CURS[c.cur] || c.cur) + ' ' + (c.pUnit === 't' ? t('pt') : t('pbu')) + ')', '<div class="cc-row">' + inp(line, 'p', c.p) + seg(line, 'pUnit', [['t', t('pt')]].concat(kgBu ? [['bu', t('pbu')]] : []), kgBu ? c.pUnit : 't') + '</div>') + '</div>';
    else h += '<div id="fx-ref-' + line.id + '">' + refHtml(line) + '</div>';
    h += '</fieldset>';
    h += '<details class="cc-fs"><summary>' + esc(t('costs')) + ' (' + esc(K.CURS[c.cur] || c.cur) + '/' + esc(au) + ')</summary><p class="pt-src" style="margin:8px 0">' + esc(t('costsHint')) + '</p><div class="cc-grid">' + K.COSTS.map(function (k2) { return field('fx-' + line.id + '-c-' + k2, t('c_' + k2), inp(line, 'c-' + k2, c.costs[k2])); }).join('') + '</div></details>';
    h += '<div id="fx-r-' + line.id + '" aria-live="polite">' + resultHtml(line) + '</div></section>';
    return h;
  }
  function drawLine(line) {
    var r = document.getElementById('fx-r-' + line.id); if (r) r.innerHTML = resultHtml(line);
    var f = document.getElementById('fx-ref-' + line.id); if (f) f.innerHTML = refHtml(line);
  }

  function changesHtml() {
    var items = [], any = false, wait = false;
    S.lines.forEach(function (line) {
      var c = line.c; if (c.pSrc !== 'dehesa') return; any = true;
      var r = REF[line.id]; if (!r || r.state === 'loading') { wait = true; return; } if (r.state !== 'ok') return;
      var sv = S.seen[line.id], cur = c.cur, nowTxt = pnum(r.value, cur);
      if (!sv) return;
      var h = '<li><strong>' + esc(cname(line)) + '</strong> · ' + tag('tagOff', 'off') + ' ';
      if (sv.key !== r.pick.key || sv.cur !== cur) h += esc(t('chOther'));
      else if (sv.period === r.period) h += esc(tf('chSame', dstr(sv.at), nowTxt, dstr(r.period)));
      else {
        var pct = sv.perT ? (r.value / sv.perT - 1) * 100 : null;
        h += esc(tf('chDiff', dstr(sv.at), pnum(sv.perT, cur), nowTxt, pct === null ? '—' : (pct > 0 ? '+' : '') + nf(pct, 1) + ' %', dstr(r.period)));
        var prev = cl(c); prev.p = String(sv.perT); prev.pUnit = 't'; var a = K.calc(prev), b = K.calc(c);
        if (a.marginHa !== undefined && b.marginHa !== undefined) {
          h += '<br>' + tag('tagCalc', 'calc') + ' ' + esc(tf('chMargin', money(a.marginHa, cur), money(b.marginHa, cur)));
          if (a.margin !== undefined && a.margin !== null && b.margin !== undefined && b.margin !== null) h += ' ' + esc(tf('chMarginT', money(a.margin, cur), money(b.margin, cur)));
          h += '.';
        }
      }
      items.push(h + '</li>');
    });
    var h2 = '';
    if (items.length) h2 += '<ul class="fx-ch">' + items.join('') + '</ul><div class="pt-bar-ctl"><button type="button" class="pt-chip" data-act="seen">' + esc(t('markSeen')) + '</button>' + (S.justSeen ? '<span class="pt-sub">' + esc(t('seenOk')) + '</span>' : '') + '</div>';
    else if (wait) h2 += '<div class="pt-skel">' + esc(t('chWait')) + '</div>';
    else h2 += '<p class="pt-sub">' + esc(any ? t('chWait') : t('chNone')) + '</p>';
    if (!S.remember) h2 += '<p class="pt-src">' + esc(t('chNoRem')) + '</p>';
    return h2;
  }
  function summaryHtml() {
    var rows = [], by = {};
    S.lines.forEach(function (line) {
      var o = K.calc(line.c); if (o.costHa === null && o.marginHa === undefined) return;
      rows.push({ line: line, o: o }); var cu = line.c.cur; var g = by[cu] = by[cu] || { cost: 0, rev: 0, margin: 0, n: 0, lines: [] };
      if (o.marginHa !== undefined && o.margin !== undefined && o.margin !== null) { g.cost += o.cost; g.rev += o.rev; g.margin += o.margin; g.n++; g.lines.push(line); }
    });
    if (!rows.length) return '<p class="pt-sub">' + esc(t('sumNeed')) + '</p>';
    var h = tag('tagCalc', 'calc') + '<div class="pt-tblwrap"><table class="pt-table"><thead><tr><th>' + esc(t('line')) + '</th><th class="r">' + esc(t('bePrice')) + ' / t</th><th class="r">' + esc(t('priceUsed')) + ' / t</th><th class="r">' + esc(t('marginHa')) + '</th><th class="r">' + esc(t('margin')) + '</th></tr></thead><tbody>';
    rows.forEach(function (x) {
      var cu = x.line.c.cur, o = x.o;
      h += '<tr><th scope="row" style="text-align:left">' + esc(cname(x.line)) + (o.k.area ? ' <small>' + esc(nf(o.k.area, 1)) + ' ha</small>' : '') + '</th><td class="r">' + (o.costT === undefined ? '—' : esc(pnum(o.costT, cu))) + '</td><td class="r">' + (o.price ? esc(pnum(o.price, cu)) : '—') + '</td>' +
        '<td class="r">' + (o.marginHa === undefined ? '—' : '<span class="' + (o.marginHa >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(o.marginHa, cu, 0)) + '</span>') + '</td><td class="r">' + (o.margin === undefined || o.margin === null ? '—' : '<span class="' + (o.margin >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(o.margin, cu)) + '</span>') + '</td></tr>';
    });
    Object.keys(by).forEach(function (cu) { var g = by[cu]; if (!g.n) return; h += '<tr class="fx-tot"><th scope="row" style="text-align:left">' + esc(t('total')) + ' ' + esc(cu) + '</th><td class="r" colspan="3">' + esc(t('revenue')) + ': ' + esc(money(g.rev, cu, 0)) + ' · ' + esc(t('cost')) + ': ' + esc(money(g.cost, cu, 0)) + '</td><td class="r"><strong class="' + (g.margin >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(g.margin, cu, 0)) + '</strong></td></tr>'; });
    h += '</tbody></table></div>';
    // sensibilidad conjunta, por moneda
    var st = S.step / 100, cols = [[1 - st, '−' + S.step + ' %'], [1, t('actual')], [1 + st, '+' + S.step + ' %']], curs = Object.keys(by).filter(function (cu) { return by[cu].n; });
    if (curs.length) {
      h += '<h3 style="margin-top:14px">' + esc(t('sens')) + '</h3><div class="pt-bar-ctl"><span class="pt-lbl">' + esc(t('vary')) + '</span>' + [['price', t('vPrice')], ['yield', t('vYield')], ['cost', t('vCost')]].map(function (v) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (S.vary === v[0]) + '" data-seg="vary" data-v="' + v[0] + '">' + esc(v[1]) + '</button>'; }).join('') +
        '<span class="pt-lbl" style="margin-left:8px">' + esc(t('step')) + '</span>' + [5, 10, 20].map(function (s) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (S.step === s) + '" data-seg="step" data-v="' + s + '">±' + s + ' %</button>'; }).join('') + '</div>';
      h += '<div class="pt-tblwrap"><table class="pt-table"><thead><tr><th>' + esc(t('margin')) + '</th>' + cols.map(function (c2) { return '<th class="r">' + esc(c2[1]) + '</th>'; }).join('') + '</tr></thead><tbody>';
      curs.forEach(function (cu) {
        h += '<tr><th scope="row" style="text-align:left">' + esc(cu) + '</th>' + cols.map(function (c2) { var s2 = 0; by[cu].lines.forEach(function (ln) { var o = K.calc(ln.c, ovr(c2[0])); if (o.margin !== undefined && o.margin !== null) s2 += o.margin; }); return '<td class="r"><span class="' + (s2 >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(s2, cu, 0)) + '</span></td>'; }).join('') + '</tr>';
      });
      h += '</tbody></table></div><p class="pt-src">' + esc(t('sensNote')) + '</p>';
    }
    return h;
  }
  function drawAll() { var a = document.getElementById('fx-changes'), b = document.getElementById('fx-sum'); if (a) a.innerHTML = changesHtml(); if (b) b.innerHTML = summaryHtml(); }
  function sec(id, title, hint, body) { return '<section class="pt-sec" id="' + id + '"><div class="di-movers-head-row"><h2>' + esc(title) + '</h2>' + (hint ? '<span class="di-movers-hint">' + esc(hint) + '</span>' : '') + '</div>' + body + '</section>'; }
  function shell() {
    document.getElementById('fx-h1').textContent = t('title'); document.getElementById('fx-sub').textContent = t('sub'); document.title = t('title') + ' | Dehesa Index';
    var h = '<div class="pt-wrap"><div class="pt-note">' + esc(t('privacy')) + '</div>';
    h += sec('fx-changes-sec', t('chTitle'), t('chHint'), '<div id="fx-changes" aria-live="polite">' + changesHtml() + '</div>');
    h += sec('fx-sum-sec', t('sumTitle'), t('sumHint'), '<div id="fx-sum" aria-live="polite">' + summaryHtml() + '</div>');
    h += sec('fx-lines-sec', t('lines'), '', S.lines.map(lineHtml).join('') + '<div class="pt-bar-ctl">' + (S.lines.length < MAXL ? '<button type="button" class="pt-chip" data-act="add">+ ' + esc(t('add')) + '</button>' : '<span class="pt-sub">' + esc(tf('maxL', MAXL)) + '</span>') + '</div><p class="pt-src">' + esc(t('notInc')) + '</p>');
    h += '<div class="pt-bar-ctl"><label style="font-size:13px"><input type="checkbox" id="fx-remember"' + (S.remember ? ' checked' : '') + '> ' + esc(t('remember')) + '</label>' + (S.remember ? '<button type="button" class="pt-chip" data-act="forget">' + esc(t('forget')) + '</button>' : '') + '</div>';
    h += '<p class="pt-src"><a href="calculadora.html">' + esc(t('toCalc')) + ' →</a> · <a href="mi-seguimiento.html">' + esc(t('toWatch')) + ' →</a></p>' + (window.DICite ? window.DICite.derived(['usda_ers', 'ecb'], { what: 'calc' }) : '') + '</div>';
    document.getElementById('fx-body').innerHTML = h;
    S.lines.forEach(function (line) { if (line.c.pSrc === 'dehesa') ensureRef(line); });
  }

  /* ---------- eventos ---------- */
  function onClick(e) {
    var el = e.target; while (el && el !== document && !(el.getAttribute && (el.getAttribute('data-act') || el.getAttribute('data-seg')))) el = el.parentNode;
    if (!el || el === document) return;
    var act = el.getAttribute('data-act'), sg = el.getAttribute('data-seg'), v = el.getAttribute('data-v'), line = lineOf(el.getAttribute('data-l'));
    if (act === 'add') { if (S.lines.length < MAXL) { S.lines.push(newLine(S.lines.length ? S.lines[S.lines.length - 1].c.crop : 'trigo')); save(); shell(); } return; }
    if (act === 'rm' && line) { S.lines = S.lines.filter(function (x) { return x !== line; }); delete S.seen[line.id]; delete REF[line.id]; save(); shell(); return; }
    if (act === 'forget') { wipe(); S.remember = false; shell(); return; }
    if (act === 'seen') { S.lines.forEach(function (ln) { var r = REF[ln.id]; if (ln.c.pSrc === 'dehesa' && r && r.state === 'ok') S.seen[ln.id] = snap(ln); }); S.justSeen = true; save(); drawAll(); S.justSeen = false; return; }
    if (sg === 'vary') { S.vary = v; save(); drawAll(); return; }
    if (sg === 'step') { S.step = +v; save(); drawAll(); return; }
    if (!line) return; var c = line.c;
    if (sg === 'areaU' || sg === 'yU' || sg === 'pUnit') { if (c[sg] !== v) { K.convertCase(c, sg, v); save(); shell(); } return; }
    if (sg === 'pSrc') { if (c.pSrc !== v) { c.pSrc = v; c.inst = ''; if (v === 'dehesa') { c.p = ''; c.pUnit = 't'; } delete S.seen[line.id]; save(); shell(); } }
  }
  function onInput(e) {
    var el = e.target, f = el.getAttribute && el.getAttribute('data-f'), line = lineOf(el.getAttribute && el.getAttribute('data-l')); if (!f || !line || el.tagName === 'SELECT') return;
    var c = line.c, val = el.value, m = /^c-(.+)$/.exec(f);
    if (m && c.costs[m[1]] !== undefined) c.costs[m[1]] = val; else if (f === 'area' || f === 'y' || f === 'p') c[f] = val; else return;
    var bad = val !== '' && (num(val) === null || num(val) < 0); el.setAttribute('aria-invalid', bad ? 'true' : 'false'); el.title = bad ? t('bad') : '';
    drawLine(line); drawAll(); save();
  }
  function onChange(e) {
    var el = e.target; if (el.id === 'fx-remember') { S.remember = el.checked; if (S.remember) save(); else wipe(); shell(); return; }
    var f = el.getAttribute && el.getAttribute('data-f'), line = lineOf(el.getAttribute && el.getAttribute('data-l')); if (!f || !line || el.tagName !== 'SELECT') return; var c = line.c;
    if (f === 'crop') { c.crop = el.value; if (!K.bushelKg(c.crop)) { c.yU = 't_ha'; c.pUnit = 't'; } c.inst = ''; delete S.seen[line.id]; if (c.pSrc === 'dehesa') c.p = ''; save(); shell(); }
    else if (f === 'cur') { c.cur = el.value; delete S.seen[line.id]; if (c.pSrc === 'dehesa') c.p = ''; save(); shell(); }
    else if (f === 'inst') { c.inst = el.value; delete S.seen[line.id]; save(); ensureRef(line); }
  }

  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); shell(); };
  window.DehesaShared.init('informacion');
  loadSaved(); if (!S.lines.length) S.lines.push(newLine());
  var body = document.getElementById('fx-body'); body.addEventListener('click', onClick); body.addEventListener('input', onInput); body.addEventListener('change', onChange);
  var go = function () { shell(); };
  (window.DICite ? window.DICite.load() : Promise.resolve()).then(go, go);
})();
