/* Visor de parcelas de Portugal (IFAP iSIP, CC BY 4.0) - ES5, sin librerías.
   Teselas WMS en EPSG:3857 pedidas directamente al servidor del IFAP. */
(function () {
  var OWS = 'https://www.ifap.pt/isip/ows/isip.data/ows';
  var R = 6378137, ORG = Math.PI * R, TS = 256;
  var T = {
    es: { title: 'Mapa de parcelas y cultivos (IFAP)', layer: 'Capa', cul: 'Cultivos declarados 2025', oc: 'Ocupación del suelo 2025', par: 'Parcelas 2025', dis: 'Distritos', go: 'Ir a', zin: 'Acercar', zout: 'Alejar',
      hint: 'Acerca el mapa (zoom 10 o más) para ver las parcelas; a escala nacional el IFAP no sirve la capa.', legend: 'Leyenda', src: 'Fuente', lic: 'Licencia', note: 'Datos geográficos de parcelas declaradas (iSIP, campaña 2025). Sin agregados nacionales: es un visor, no una estadística.',
      places: { '': 'Portugal', alentejo: 'Alentejo (montado)', douro: 'Douro', ribatejo: 'Ribatejo', algarve: 'Algarve', beira: 'Beira Interior', minho: 'Minho' } },
    en: { title: 'Parcel and crop map (IFAP)', layer: 'Layer', cul: 'Declared crops 2025', oc: 'Land use 2025', par: 'Parcels 2025', dis: 'Districts', go: 'Go to', zin: 'Zoom in', zout: 'Zoom out',
      hint: 'Zoom in (level 10 or more) to see parcels; IFAP does not serve the layer at national scale.', legend: 'Legend', src: 'Source', lic: 'Licence', note: 'Geographic data of declared parcels (iSIP, 2025 campaign). No national aggregates: a viewer, not a statistic.',
      places: { '': 'Portugal', alentejo: 'Alentejo (montado)', douro: 'Douro', ribatejo: 'Ribatejo', algarve: 'Algarve', beira: 'Beira Interior', minho: 'Minho' } },
    fr: { title: 'Carte des parcelles et cultures (IFAP)', layer: 'Couche', cul: 'Cultures déclarées 2025', oc: 'Occupation du sol 2025', par: 'Parcelles 2025', dis: 'Districts', go: 'Aller à', zin: 'Zoom avant', zout: 'Zoom arrière',
      hint: 'Zoomez (niveau 10 ou plus) pour voir les parcelles ; l’IFAP ne sert pas la couche à l’échelle nationale.', legend: 'Légende', src: 'Source', lic: 'Licence', note: 'Données géographiques des parcelles déclarées (iSIP, campagne 2025). Pas d’agrégats nationaux : un visualiseur, pas une statistique.',
      places: { '': 'Portugal', alentejo: 'Alentejo (montado)', douro: 'Douro', ribatejo: 'Ribatejo', algarve: 'Algarve', beira: 'Beira Interior', minho: 'Minho' } },
    it: { title: 'Mappa di particelle e colture (IFAP)', layer: 'Livello', cul: 'Colture dichiarate 2025', oc: 'Uso del suolo 2025', par: 'Particelle 2025', dis: 'Distretti', go: 'Vai a', zin: 'Ingrandisci', zout: 'Riduci',
      hint: 'Ingrandisci (livello 10 o più) per vedere le particelle; l’IFAP non serve il livello a scala nazionale.', legend: 'Legenda', src: 'Fonte', lic: 'Licenza', note: 'Dati geografici delle particelle dichiarate (iSIP, campagna 2025). Nessun aggregato nazionale: un visualizzatore, non una statistica.',
      places: { '': 'Portugal', alentejo: 'Alentejo (montado)', douro: 'Douro', ribatejo: 'Ribatejo', algarve: 'Algarve', beira: 'Beira Interior', minho: 'Minho' } }
  };
  var LAYERS = { cul: 'isip.data:culturas.2025jun10', oc: 'isip.data:ocupacoes.solo.2025jun10', par: 'isip.data:parcelas.2025jun10' };
  var VIEWS = { '': [-8.0, 39.6, 6], alentejo: [-7.9, 38.4, 11], douro: [-7.55, 41.15, 11], ribatejo: [-8.6, 39.1, 11], algarve: [-8.2, 37.2, 10], beira: [-7.3, 40.3, 10], minho: [-8.4, 41.75, 11] };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function mx(lon) { return lon * ORG / 180; }
  function my(lat) { return Math.log(Math.tan((90 + lat) * Math.PI / 360)) * R; }
  function lonOf(x) { return x / ORG * 180; }
  function latOf(y) { return (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI; }

  var SAVED = null, RESIZE = null; // posicion, zoom y capa se conservan al volver a montar el visor (cambio de serie o de rango)
  function mount(el, lang) {
    var t = T[lang] || T.es, st = { l: 'cul', z: 6, cx: mx(-8.0), cy: my(39.6) }, w = 0, h = 0, drag = null;
    if (SAVED) st = { l: SAVED.l, z: SAVED.z, cx: SAVED.cx, cy: SAVED.cy };
    el.innerHTML = '<div class="di-card" style="padding:16px 18px;margin-top:18px">' +
      '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:10px">' + esc(t.title.toUpperCase()) + '</div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px">' +
      '<label style="font-size:13px;flex:1;min-width:150px">' + t.layer + '<br><select class="di-compare-select" data-k="l">' + ['cul', 'oc', 'par'].map(function (k) { return '<option value="' + k + '">' + esc(t[k]) + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:13px;flex:1;min-width:150px">' + t.go + '<br><select class="di-compare-select" data-k="v">' + Object.keys(VIEWS).map(function (k) { return '<option value="' + k + '">' + esc(t.places[k]) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="ifap-vp" style="position:relative;height:440px;background:#eef1ec;border:1px solid var(--border);border-radius:8px;overflow:hidden;touch-action:none;cursor:grab" role="img" aria-label="' + esc(t.title) + '">' +
      '<div class="ifap-tiles" style="position:absolute;left:0;top:0"></div>' +
      '<div class="ifap-hint" style="position:absolute;left:10px;bottom:10px;right:60px;font-size:12px;background:rgba(255,255,255,.92);padding:6px 9px;border-radius:6px;color:#333"></div>' +
      '<div style="position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px"><button type="button" class="ifap-z" data-d="1" aria-label="' + esc(t.zin) + '" style="width:34px;height:34px;font-size:18px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer">+</button><button type="button" class="ifap-z" data-d="-1" aria-label="' + esc(t.zout) + '" style="width:34px;height:34px;font-size:18px;border:1px solid var(--border);background:var(--surface);border-radius:6px;cursor:pointer">−</button></div></div>' +
      '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px">' + t.legend + '</summary><img class="ifap-leg" alt="' + esc(t.legend) + '" style="max-width:100%;margin-top:8px;background:#fff" loading="lazy"></details>' +
      '<p class="di-movers-hint" style="margin-top:10px">' + t.note + '</p>' +
      '<p class="di-movers-hint">' + t.src + ': <a href="https://www.ifap.pt/isip/ows/isip.data/ows?SERVICE=WMS&REQUEST=GetCapabilities" target="_blank" rel="noopener">IFAP — iSIP</a> · ' + t.lic + ': CC BY 4.0</p></div>';
    var vp = el.querySelector('.ifap-vp'), tiles = el.querySelector('.ifap-tiles'), hint = el.querySelector('.ifap-hint'), leg = el.querySelector('.ifap-leg');
    function legend() { leg.src = OWS + '?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=' + encodeURIComponent(LAYERS[st.l]) + '&STYLE='; }
    function render() {
      w = vp.clientWidth; h = vp.clientHeight; SAVED = { l: st.l, z: st.z, cx: st.cx, cy: st.cy };
      var ws = TS * Math.pow(2, st.z), res = 2 * ORG / ws; // m/px
      var x0 = st.cx - w / 2 * res, y1 = st.cy + h / 2 * res; // esquina sup-izq en metros
      var tx0 = Math.floor((x0 + ORG) / (TS * res)), ty0 = Math.floor((ORG - y1) / (TS * res));
      var tx1 = Math.floor((x0 + w * res + ORG) / (TS * res)), ty1 = Math.floor((ORG - (y1 - h * res)) / (TS * res)), n = Math.pow(2, st.z), html = '', x, y;
      var lay = st.z >= 10 ? LAYERS[st.l] : 'distritos', lyr = st.z >= 10 ? lay : 'distritos';
      hint.style.display = st.z >= 10 ? 'none' : 'block'; hint.textContent = t.hint;
      for (y = ty0; y <= ty1; y++) for (x = tx0; x <= tx1; x++) {
        if (y < 0 || y >= n) continue;
        var bx0 = -ORG + x * TS * res, bx1 = bx0 + TS * res, by1 = ORG - y * TS * res, by0 = by1 - TS * res;
        var left = Math.round((bx0 - x0) / res), top = Math.round((y1 - by1) / res);
        html += '<img alt="" draggable="false" style="position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + TS + 'px;height:' + TS + 'px" onerror="this.style.visibility=\'hidden\'" src="' + OWS + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=' + encodeURIComponent(lyr) + '&STYLES=&CRS=EPSG:3857&BBOX=' + [bx0, by0, bx1, by1].join(',') + '&WIDTH=' + TS + '&HEIGHT=' + TS + '&FORMAT=image/png&TRANSPARENT=true">';
      }
      tiles.innerHTML = html;
    }
    function setView(v) { st.cx = mx(v[0]); st.cy = my(v[1]); st.z = v[2]; render(); }
    function zoom(d, px, py) {
      var nz = Math.max(6, Math.min(18, st.z + d)); if (nz === st.z) return;
      var res = 2 * ORG / (TS * Math.pow(2, st.z)), nres = 2 * ORG / (TS * Math.pow(2, nz));
      var ax = st.cx + (px - w / 2) * res, ay = st.cy - (py - h / 2) * res; // punto bajo el cursor
      st.cx = ax - (px - w / 2) * nres; st.cy = ay + (py - h / 2) * nres; st.z = nz; render();
    }
    el.querySelector('select[data-k=l]').onchange = function (e) { st.l = e.target.value; legend(); render(); };
    el.querySelector('select[data-k=v]').onchange = function (e) { setView(VIEWS[e.target.value]); };
    Array.prototype.forEach.call(el.querySelectorAll('.ifap-z'), function (b) { b.onclick = function () { zoom(+b.getAttribute('data-d'), w / 2, h / 2); }; });
    vp.addEventListener('pointerdown', function (e) { if (e.target.tagName === 'BUTTON') return; drag = { x: e.clientX, y: e.clientY }; vp.style.cursor = 'grabbing'; try { vp.setPointerCapture(e.pointerId); } catch (x) {} });
    vp.addEventListener('pointermove', function (e) { if (!drag) return; var res = 2 * ORG / (TS * Math.pow(2, st.z)); st.cx -= (e.clientX - drag.x) * res; st.cy += (e.clientY - drag.y) * res; drag = { x: e.clientX, y: e.clientY }; render(); });
    function end() { drag = null; vp.style.cursor = 'grab'; }
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
    vp.addEventListener('dblclick', function (e) { var r = vp.getBoundingClientRect(); zoom(1, e.clientX - r.left, e.clientY - r.top); });
    var wheelAt = 0;
    vp.addEventListener('wheel', function (e) { e.preventDefault(); var n = Date.now(); if (n - wheelAt < 250) return; wheelAt = n; var r = vp.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    if (RESIZE) window.removeEventListener('resize', RESIZE);
    RESIZE = render; window.addEventListener('resize', render);
    el.querySelector('select[data-k=l]').value = st.l; legend();
    if (SAVED) render(); else setView(VIEWS['']);
  }
  window.DIIfapMap = { mount: mount };
})();
