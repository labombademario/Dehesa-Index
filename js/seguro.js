/* Dehesa Index — pestaña «Seguro agrario» de Precios. ES5, sin dependencias salvo window.DehesaShared (idioma, esc) y window.DICite (citas).
   Datos: data/crop-insurance.json (EE. UU., USDA RMA, sumado por Dehesa Index a partir de los ficheros públicos de la RMA) y
   data/crop-insurance-ca.json (Canadá, Statistics Canada: indemnizaciones y gasto de las explotaciones, por provincia; copiado sin transformar) y
   data/insurance-es.json (España, cuatro cifras curadas a mano y PENDIENTES de contraste). Nada se escribe a mano aquí salvo etiquetas:
   cada cifra de las tarjetas de EE. UU. y Canadá sale del JSON y lleva su cita. DehesaSeguro.render(contenedor). */
(function (root) {
  'use strict';
  var S = root.DehesaShared, esc = S.esc;
  var T = {
    es: { us: 'EE. UU. — USDA RMA (año agrícola', es: 'España — Agroseguro (ejercicio', badgeUs: 'DATOS OFICIALES (RMA)', badgePend: 'PENDIENTE DE CONTRASTE', year: 'Año agrícola (EE. UU.)', prov: 'Provisional: la RMA sigue actualizando este año y las indemnizaciones pueden subir.',
      pol: 'Pólizas con prima', liab: 'Capital asegurado', prem: 'Prima total', sub: 'Subvención de la prima', ind: 'Indemnizaciones', lr: 'Siniestralidad (indemnizaciones / prima total)', ac: 'Superficie asegurada (filas en acres)', ofPrem: 'de la prima',
      st: 'Por estado (10 mayores por capital asegurado)', cr: 'Por cultivo (10 mayores por capital asegurado)', ca: 'Indemnizaciones por causa de pérdida (8 mayores)', tr: 'Evolución nacional', stateC: 'Estado', cropC: 'Cultivo', causeC: 'Causa', yearC: 'Año',
      note: 'Dehesa Index suma los registros públicos de la RMA (estado × condado × cultivo × plan); no son cifras elaboradas por la RMA. Con los ficheros de 2024 se reproducen exactamente los totales nacionales que publica la propia RMA. Los nombres de cultivo y de causa son los de la RMA, en inglés. Las etiquetas con siglas de planes (ARPI/SCO/ECO/STAX…) son las que la RMA asigna a las indemnizaciones de esos planes, no un peligro concreto.',
      pend: 'Cifras sin contrastar con Agroseguro (su web no permite el acceso automatizado) y con condiciones de reutilización pendientes. Se muestran tal como estaban en el prototipo del sitio.', prem2: 'Primas totales', area: 'Superficie asegurada', ind2: 'Indemnizaciones pagadas', subs: 'Subvención pública', scope: 'Las cifras de España incluyen todas las líneas de Agroseguro (agrícola, ganadero y forestal); las de EE. UU. son solo del seguro de cosechas federal. Sirven como orden de magnitud, no como comparación exacta.', err: 'No se han podido cargar los datos del seguro agrario.', mEur: 'M€', mha: 'M ha', macres: 'M acres', musd: 'M$', mpol: 'M' },
    en: { us: 'United States — USDA RMA (crop year', es: 'Spain — Agroseguro (financial year', badgeUs: 'OFFICIAL DATA (RMA)', badgePend: 'PENDING VERIFICATION', year: 'Crop year (U.S.)', prov: 'Provisional: RMA keeps updating this year and indemnities may still rise.',
      pol: 'Policies earning premium', liab: 'Liability (insured amount)', prem: 'Total premium', sub: 'Premium subsidy', ind: 'Indemnities', lr: 'Loss ratio (indemnities / total premium)', ac: 'Insured acres (rows reported in acres)', ofPrem: 'of premium',
      st: 'By state (10 largest by liability)', cr: 'By crop (10 largest by liability)', ca: 'Indemnities by cause of loss (8 largest)', tr: 'National trend', stateC: 'State', cropC: 'Crop', causeC: 'Cause', yearC: 'Year',
      note: 'Dehesa Index sums the public RMA records (state × county × crop × plan); these are not figures produced by RMA. Summing the 2024 files reproduces RMA’s own published national totals exactly. Crop and cause names are RMA’s. Labels made of plan acronyms (ARPI/SCO/ECO/STAX…) are what RMA assigns to those plans’ indemnities, not a specific peril.',
      pend: 'Figures not re-checked with Agroseguro (its website refuses automated access); reuse terms pending. Shown as they were in the site prototype.', prem2: 'Total premiums', area: 'Insured area', ind2: 'Indemnities paid', subs: 'Public subsidy', scope: 'Spain’s figures cover all Agroseguro lines (crop, livestock and forestry); the U.S. figures are federal crop insurance only. Use them as an order of magnitude, not an exact comparison.', err: 'The crop insurance data could not be loaded.', mEur: '€M', mha: 'M ha', macres: 'M acres', musd: '$M', mpol: 'M' },
    fr: { us: 'États-Unis — USDA RMA (campagne', es: 'Espagne — Agroseguro (exercice', badgeUs: 'DONNÉES OFFICIELLES (RMA)', badgePend: 'À VÉRIFIER', year: 'Campagne (États-Unis)', prov: 'Provisoire : la RMA continue de mettre à jour cette année et les indemnités peuvent encore augmenter.',
      pol: 'Polices avec prime', liab: 'Capital assuré', prem: 'Prime totale', sub: 'Subvention de la prime', ind: 'Indemnités', lr: 'Sinistralité (indemnités / prime totale)', ac: 'Surface assurée (lignes en acres)', ofPrem: 'de la prime',
      st: 'Par État (10 plus grands par capital assuré)', cr: 'Par culture (10 plus grandes par capital assuré)', ca: 'Indemnités par cause de perte (8 plus grandes)', tr: 'Évolution nationale', stateC: 'État', cropC: 'Culture', causeC: 'Cause', yearC: 'Année',
      note: 'Dehesa Index additionne les enregistrements publics de la RMA (État × comté × culture × plan) ; ce ne sont pas des chiffres établis par la RMA. Avec les fichiers de 2024, on retrouve exactement les totaux nationaux publiés par la RMA. Les noms de cultures et de causes sont ceux de la RMA, en anglais. Les libellés composés de sigles de plans (ARPI/SCO/ECO/STAX…) sont ceux que la RMA attribue aux indemnités de ces plans, pas un péril précis.',
      pend: 'Chiffres non revérifiés auprès d’Agroseguro (son site refuse l’accès automatisé) ; conditions de réutilisation en attente. Affichés tels qu’ils figuraient dans le prototype du site.', prem2: 'Primes totales', area: 'Surface assurée', ind2: 'Indemnités versées', subs: 'Subvention publique', scope: 'Les chiffres de l’Espagne couvrent toutes les lignes d’Agroseguro (cultures, élevage et forêt) ; ceux des États-Unis ne concernent que l’assurance récolte fédérale. À prendre comme un ordre de grandeur, pas comme une comparaison exacte.', err: 'Les données de l’assurance agricole n’ont pas pu être chargées.', mEur: 'M€', mha: 'M ha', macres: 'M acres', musd: 'M$', mpol: 'M' },
    it: { us: 'Stati Uniti — USDA RMA (anno agrario', es: 'Spagna — Agroseguro (esercizio', badgeUs: 'DATI UFFICIALI (RMA)', badgePend: 'DA VERIFICARE', year: 'Anno agrario (Stati Uniti)', prov: 'Provvisorio: la RMA continua ad aggiornare quest’anno e gli indennizzi possono ancora crescere.',
      pol: 'Polizze con premio', liab: 'Capitale assicurato', prem: 'Premio totale', sub: 'Sovvenzione del premio', ind: 'Indennizzi', lr: 'Sinistralità (indennizzi / premio totale)', ac: 'Superficie assicurata (righe in acri)', ofPrem: 'del premio',
      st: 'Per stato (10 maggiori per capitale assicurato)', cr: 'Per coltura (10 maggiori per capitale assicurato)', ca: 'Indennizzi per causa di perdita (8 maggiori)', tr: 'Andamento nazionale', stateC: 'Stato', cropC: 'Coltura', causeC: 'Causa', yearC: 'Anno',
      note: 'Dehesa Index somma i record pubblici della RMA (stato × contea × coltura × piano); non sono cifre elaborate dalla RMA. Con i file del 2024 si riproducono esattamente i totali nazionali pubblicati dalla RMA. I nomi di colture e cause sono quelli della RMA, in inglese. Le etichette composte da sigle di piani (ARPI/SCO/ECO/STAX…) sono quelle che la RMA assegna agli indennizzi di quei piani, non un pericolo specifico.',
      pend: 'Cifre non ricontrollate con Agroseguro (il sito rifiuta l’accesso automatizzato); condizioni di riutilizzo in sospeso. Mostrate come nel prototipo del sito.', prem2: 'Premi totali', area: 'Superficie assicurata', ind2: 'Indennizzi pagati', subs: 'Sovvenzione pubblica', scope: 'Le cifre della Spagna includono tutte le linee di Agroseguro (colture, zootecnia e foreste); quelle degli Stati Uniti riguardano solo l’assicurazione federale dei raccolti. Da usare come ordine di grandezza, non come confronto esatto.', err: 'Non è stato possibile caricare i dati dell’assicurazione agricola.', mEur: 'M€', mha: 'M ha', macres: 'M acri', musd: 'M$', mpol: 'M' }
  };
  var STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var TC = {
    es: { title: 'Canadá — Statistics Canada (año', badge: 'DATOS OFICIALES (STATCAN)', yearL: 'Año (Canadá)', ind: 'Indemnizaciones del seguro de cosechas cobradas', hail: 'Indemnizaciones del seguro de granizo privado', exp: 'Gasto de las explotaciones en seguro de cosechas y granizo', prov: 'Por provincia', provC: 'Provincia', tr: 'Evolución nacional (últimos 15 años)', yearC: 'Año', indS: 'Indemnizaciones de cosechas', hailS: 'Granizo privado', expS: 'Gasto en seguro', mca: 'M CAD',
      note: 'Statistics Canada publica lo que cobran las explotaciones en indemnizaciones (tabla 32-10-0045) y lo que gastan en seguro de cosechas y granizo (tabla 32-10-0049). Ese gasto es el de las explotaciones, no la prima total del programa, así que con estas cifras no se puede calcular una siniestralidad y no se muestra. El granizo privado solo se publica para Manitoba, Saskatchewan y Alberta (— = sin dato publicado). Dólares canadienses; StatCan puede revisar los años recientes. Los nombres de provincia están traducidos; las cifras son las de StatCan.', err: 'No se han podido cargar los datos de Canadá.' },
    en: { title: 'Canada — Statistics Canada (year', badge: 'OFFICIAL DATA (STATCAN)', yearL: 'Year (Canada)', ind: 'Crop insurance payments received', hail: 'Private hail insurance payments received', exp: 'Farm spending on crop and hail insurance', prov: 'By province', provC: 'Province', tr: 'National trend (last 15 years)', yearC: 'Year', indS: 'Crop insurance payments', hailS: 'Private hail payments', expS: 'Spending on insurance', mca: 'C$M',
      note: 'Statistics Canada publishes what farms receive in indemnities (table 32-10-0045) and what they spend on crop and hail insurance (table 32-10-0049). That spending is the farms’ outlay, not the programme’s total premium, so no loss ratio can be computed from these figures and none is shown. Private hail is published only for Manitoba, Saskatchewan and Alberta (— = no published figure). Canadian dollars; StatCan may revise recent years.', err: 'The Canadian data could not be loaded.' },
    fr: { title: 'Canada — Statistique Canada (année', badge: 'DONNÉES OFFICIELLES (STATCAN)', yearL: 'Année (Canada)', ind: 'Indemnités d’assurance récolte reçues', hail: 'Indemnités d’assurance grêle privée reçues', exp: 'Dépenses des exploitations en assurance récolte et grêle', prov: 'Par province', provC: 'Province', tr: 'Évolution nationale (15 dernières années)', yearC: 'Année', indS: 'Indemnités récolte', hailS: 'Grêle privée', expS: 'Dépenses d’assurance', mca: 'M CAD',
      note: 'Statistique Canada publie ce que les exploitations reçoivent en indemnités (tableau 32-10-0045) et ce qu’elles dépensent en assurance récolte et grêle (tableau 32-10-0049). Cette dépense est celle des exploitations, pas la prime totale du programme : on ne peut donc pas calculer de sinistralité avec ces chiffres et aucune n’est affichée. La grêle privée n’est publiée que pour le Manitoba, la Saskatchewan et l’Alberta (— = pas de chiffre publié). Dollars canadiens ; StatCan peut réviser les années récentes.', err: 'Les données du Canada n’ont pas pu être chargées.' },
    it: { title: 'Canada — Statistics Canada (anno', badge: 'DATI UFFICIALI (STATCAN)', yearL: 'Anno (Canada)', ind: 'Indennizzi dell’assicurazione sui raccolti incassati', hail: 'Indennizzi dell’assicurazione grandine privata incassati', exp: 'Spesa delle aziende per assicurazione raccolti e grandine', prov: 'Per provincia', provC: 'Provincia', tr: 'Andamento nazionale (ultimi 15 anni)', yearC: 'Anno', indS: 'Indennizzi raccolti', hailS: 'Grandine privata', expS: 'Spesa assicurativa', mca: 'M CAD',
      note: 'Statistics Canada pubblica quanto le aziende incassano in indennizzi (tabella 32-10-0045) e quanto spendono per l’assicurazione su raccolti e grandine (tabella 32-10-0049). Quella spesa è dell’azienda, non il premio totale del programma: con queste cifre non si può calcolare una sinistralità e non viene mostrata. La grandine privata è pubblicata solo per Manitoba, Saskatchewan e Alberta (— = nessun dato pubblicato). Dollari canadesi; StatCan può rivedere gli anni recenti.', err: 'Non è stato possibile caricare i dati del Canada.' }
  };
  var PROV = { es: { CA: 'Canadá', NL: 'Terranova y Labrador', PE: 'Isla del Príncipe Eduardo', NS: 'Nueva Escocia', NB: 'Nuevo Brunswick', QC: 'Quebec', ON: 'Ontario', MB: 'Manitoba', SK: 'Saskatchewan', AB: 'Alberta', BC: 'Columbia Británica' },
    en: { CA: 'Canada', NL: 'Newfoundland and Labrador', PE: 'Prince Edward Island', NS: 'Nova Scotia', NB: 'New Brunswick', QC: 'Quebec', ON: 'Ontario', MB: 'Manitoba', SK: 'Saskatchewan', AB: 'Alberta', BC: 'British Columbia' },
    fr: { CA: 'Canada', NL: 'Terre-Neuve-et-Labrador', PE: 'Île-du-Prince-Édouard', NS: 'Nouvelle-Écosse', NB: 'Nouveau-Brunswick', QC: 'Québec', ON: 'Ontario', MB: 'Manitoba', SK: 'Saskatchewan', AB: 'Alberta', BC: 'Colombie-Britannique' },
    it: { CA: 'Canada', NL: 'Terranova e Labrador', PE: 'Isola del Principe Edoardo', NS: 'Nuova Scozia', NB: 'Nuovo Brunswick', QC: 'Québec', ON: 'Ontario', MB: 'Manitoba', SK: 'Saskatchewan', AB: 'Alberta', BC: 'Columbia Britannica' } };
  var PORDER = ['NL', 'PE', 'NS', 'NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC'];
  var F = { liab: 0, prem: 1, sub: 2, ind: 3, pol: 4, ac: 5 };
  function lang() { try { return S.getLang(); } catch (e) { return 'es'; } }
  function tx() { return T[lang()] || T.es; }
  function tc() { return TC[lang()] || TC.es; }
  function grp(n) { var sep = lang() === 'en' ? ',' : (lang() === 'fr' ? ' ' : '.'); return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
  function dec(x, d) { var s = Number(x).toFixed(d); return lang() === 'en' ? s : s.replace('.', ','); }
  function mus(v) { return lang() === 'en' ? '$' + grp(v / 1e6) + ' M' : grp(v / 1e6) + ' M$'; }
  function mil(v, unit) { return dec(v / 1e6, 1) + ' ' + unit; }
  function pct(a, b) { return b ? dec(100 * a / b, 0) + ' %' : '—'; }
  function lr(v) { return v[1] ? dec(v[3] / v[1], 2) : '—'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function cite(id, period, note) { return root.DICite ? root.DICite.html(id, { period: period, note: note }) : ''; }
  function tbl(head, rows) {
    return '<div class="pt-tblwrap"><table class="pt-table"><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' style="text-align:right"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' style="text-align:right;white-space:nowrap"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function topBy(group, y, n, k) {
    return Object.keys(group).filter(function (key) { return group[key][y]; }).sort(function (a, b) { return group[b][y][k] - group[a][y][k]; }).slice(0, n);
  }
  function usKpi(D, y) {
    var t = tx(), v = D.national[y], isProv = +y >= D.provisionalFrom;
    return '<div class="di-card di-info-card"><div class="di-info-card-title">' + esc(t.us + ' ' + y + ')') + '</div><div class="di-info-stat-list">' +
      row(t.pol, mil(v[F.pol], t.mpol)) + row(t.liab, mus(v[F.liab])) + row(t.prem, mus(v[F.prem])) +
      row(t.sub, mus(v[F.sub]) + ' (' + pct(v[F.sub], v[F.prem]) + ' ' + esc(t.ofPrem) + ')') + row(t.ind, mus(v[F.ind])) +
      row(t.lr, lr(v)) + row(t.ac, mil(v[F.ac], t.macres)) + '</div>' +
      (isProv ? '<div class="di-info-scope-note" style="margin-top:10px">' + esc(t.prov) + '</div>' : '') + cite('usda_rma', y) + '</div>';
  }
  function mcad(v) { if (v == null) return '—'; if (v < 1000) return lang() === 'en' ? 'C$' + grp(v) + 'K' : grp(v) + ' k CAD'; var m = v / 1e3, n = m >= 100 ? grp(m) : dec(m, 1); return lang() === 'en' ? 'C$' + n + ' M' : n + ' M CAD'; }
  function caKpi(C, y) {
    var t = tc(), i = C.years.indexOf(+y), d = C.data.CA;
    return '<div class="di-card di-info-card"><div class="di-info-card-title">' + esc(t.title + ' ' + y + ')') + '</div><div class="di-info-stat-list">' +
      row(t.ind, mcad(d.indemnities[i])) + row(t.hail, mcad(d.hailIndemnities[i])) + row(t.exp, mcad(d.farmPremiums[i])) + '</div>' +
      cite('statcan', y, '32-10-0045-01, 32-10-0049-01') + '</div>';
  }
  function caDetails(C, y) {
    var t = tc(), i = C.years.indexOf(+y), P = PROV[lang()] || PROV.es, h = '';
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.prov + ' · ' + y) + '</h3>' + tbl([t.provC, t.indS, t.hailS, t.expS],
      PORDER.map(function (k) { var d = C.data[k]; return [esc(P[k]), mcad(d.indemnities[i]), mcad(d.hailIndemnities[i]), mcad(d.farmPremiums[i])]; }));
    var from = Math.max(0, C.years.length - 15), rows = [];
    for (var j = C.years.length - 1; j >= from; j--) rows.push([esc(C.years[j]), mcad(C.data.CA.indemnities[j]), mcad(C.data.CA.hailIndemnities[j]), mcad(C.data.CA.farmPremiums[j])]);
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.tr) + '</h3>' + tbl([t.yearC, t.indS, t.hailS, t.expS], rows);
    return h;
  }
  function esCard(E) {
    var t = tx(), s = E.stats;
    return '<div class="di-card di-info-card"><div class="di-info-card-title">' + esc(t.es + ' ' + E.period + ')') + '</div><div class="di-info-stat-list">' +
      row(t.prem2, grp(s.premiumsMEur) + ' ' + t.mEur) + row(t.area, dec(s.insuredAreaMha, 1) + ' ' + t.mha) + row(t.ind2, grp(s.indemnitiesMEur) + ' ' + t.mEur) +
      row(t.subs, (s.publicSubsidyApprox ? '≈' : '') + grp(s.publicSubsidyPctOfPremium) + ' % ' + esc(t.ofPrem)) + '</div>' +
      '<div class="di-info-scope-note" style="margin-top:10px">' + esc(t.pend) + '</div>' + cite('agroseguro', E.period) + '</div>';
  }
  function details(D, y) {
    var t = tx(), st = D.states, cr = D.crops, h = '';
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.st) + '</h3>' + tbl([t.stateC, t.liab, t.prem, t.ind, t.lr],
      topBy(st, y, 10, 0).map(function (k) { var v = st[k][y]; return [esc(k + ' · ' + (STATES[k] || k)), mus(v[0]), mus(v[1]), mus(v[3]), lr(v)]; }));
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.cr) + '</h3>' + tbl([t.cropC, t.liab, t.prem, t.ind, t.lr],
      topBy(cr, y, 10, 0).map(function (k) { var v = cr[k][y]; return [esc(k), mus(v[0]), mus(v[1]), mus(v[3]), lr(v)]; }));
    var ci = D.causeIndemnity, ks = Object.keys(ci).filter(function (k) { return ci[k][y]; }).sort(function (a, b) { return ci[b][y] - ci[a][y]; }), tot = D.national[y][F.ind], mx = ks.length ? ci[ks[0]][y] : 1;
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.ca) + '</h3>' + tbl([t.causeC, t.ind, ''],
      ks.slice(0, 8).map(function (k) { return [esc(k), mus(ci[k][y]), '<span style="display:inline-block;height:8px;border-radius:4px;background:var(--accent);width:' + Math.max(2, Math.round(80 * ci[k][y] / mx)) + 'px;vertical-align:middle" title="' + esc(pct(ci[k][y], tot)) + '"></span> ' + esc(pct(ci[k][y], tot))]; }));
    h += '<h3 class="di-info-card-title" style="margin:22px 0 8px">' + esc(t.tr) + '</h3>' + tbl([t.yearC, t.liab, t.prem, t.sub, t.ind, t.lr],
      D.cropYears.slice().reverse().map(function (yy) { var v = D.national[yy]; return [esc(yy + (+yy >= D.provisionalFrom ? ' *' : '')), mus(v[0]), mus(v[1]), mus(v[2]), mus(v[3]), lr(v)]; }));
    h += '<div class="di-info-scope-note" style="margin-top:6px">* ' + esc(t.prov) + '</div>';
    return h;
  }
  function render(el) {
    var t = tx(), D = null, E = null, C = null;
    el.innerHTML = '<div class="di-info-scope-note">…</div>';
    function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
    Promise.all([get('data/crop-insurance.json'), get('data/insurance-es.json').catch(function () { return null; }), get('data/crop-insurance-ca.json').catch(function () { return null; }), root.DICite ? root.DICite.load() : null]).then(function (a) {
      D = a[0]; E = a[1]; C = a[2]; paint(String(D.latestCompleteYear), C ? String(C.latestYear) : null);
    }, function () { el.innerHTML = '<div class="di-info-scope-note">' + esc(t.err) + '</div>'; });
    function paint(y, cy) {
      t = tx(); var c = tc();
      var opts = D.cropYears.slice().reverse().map(function (yy) { return '<option value="' + yy + '"' + (String(yy) === y ? ' selected' : '') + '>' + yy + (+yy >= D.provisionalFrom ? ' *' : '') + '</option>'; }).join('');
      var copts = C ? C.years.slice().reverse().map(function (yy) { return '<option value="' + yy + '"' + (String(yy) === cy ? ' selected' : '') + '>' + yy + '</option>'; }).join('') : '';
      el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badgeUs) + '</div>' +
        '<div style="margin:0 0 16px"><label class="di-field-hint" for="sg-year">' + esc(t.year) + ' </label><select id="sg-year" class="di-eu-country-select">' + opts + '</select></div>' +
        '<div class="di-info-grid">' + usKpi(D, y) + (C ? caKpi(C, C.latestYear) : '') + (E ? esCard(E) : '') + '</div>' +
        '<div class="di-info-scope-note">' + esc(t.scope) + '</div>' + details(D, y) +
        '<div class="di-info-scope-note" style="margin-top:14px">' + esc(t.note) + '</div>' +
        (C ? '<div class="di-badge di-badge-green di-info-badge" style="margin-top:28px">' + esc(c.badge) + '</div>' +
          '<div style="margin:0 0 16px"><label class="di-field-hint" for="sg-ca-year">' + esc(c.yearL) + ' </label><select id="sg-ca-year" class="di-eu-country-select">' + copts + '</select></div>' +
          caDetails(C, cy) + '<div class="di-info-scope-note" style="margin-top:14px">' + esc(c.note) + '</div>' : '');
      var sel = el.querySelector('#sg-year'); if (sel) sel.addEventListener('change', function () { paint(sel.value, cy); });
      var csel = el.querySelector('#sg-ca-year'); if (csel) csel.addEventListener('change', function () { paint(y, csel.value); });
    }
  }
  root.DehesaSeguro = { render: render };
})(typeof window !== 'undefined' ? window : this);
