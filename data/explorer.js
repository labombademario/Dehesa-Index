(function(){
'use strict';
var state={rows:[],filtered:[]};
var $=function(s){return document.querySelector(s)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})};
function csv(v){var s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function render(){
 var el=$('#dd-results'), count=$('#dd-count');
 if(!el)return;
 count.textContent=state.filtered.length+' observaciones';
 if(!state.filtered.length){el.innerHTML='<div class="dd-empty">No hay observaciones para estos filtros.</div>';return}
 el.innerHTML='<div class="dd-table-wrap"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Región</th><th>Valor</th><th>Unidad</th><th>Fuente</th></tr></thead><tbody>'+
 state.filtered.slice().reverse().map(function(o){return '<tr><td>'+esc(o.observationDate)+'</td><td>'+esc(o.product)+'</td><td>'+esc(o.region)+'</td><td>'+esc(o.value)+'</td><td>'+esc(o.unit)+' '+esc(o.currency)+'</td><td>'+esc(o.sourceId)+'</td></tr>'}).join('')+
 '</tbody></table></div>';
}
function filter(){
 var p=$('#dd-product').value,r=$('#dd-region').value,from=$('#dd-from').value,to=$('#dd-to').value;
 state.filtered=state.rows.filter(function(o){
  var d=String(o.observationDate||'');
  return (!p||o.product===p)&&(!r||o.region===r)&&(!from||d>=from)&&(!to||d<=to);
 });
 render();
}
function download(){
 var fields=['product','region','sourceId','observationDate','snapshotDate','value','currency','unit','frequency','changePct'];
 var out=[fields.join(',')].concat(state.filtered.map(function(o){return fields.map(function(f){return csv(o[f])}).join(',')}));
 var blob=new Blob(['\uFEFF'+out.join('\n')+'\n'],{type:'text/csv;charset=utf-8'});
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dehesa-data-export.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
}
function init(){
 fetch('history.json').then(function(r){if(!r.ok)throw Error('history');return r.json()}).then(function(d){
  state.rows=Array.isArray(d.observations)?d.observations:[];
  var products=[...new Set(state.rows.map(function(o){return o.product}).filter(Boolean))].sort();
  products.forEach(function(p){var o=document.createElement('option');o.value=p;o.textContent=p;$('#dd-product').appendChild(o)});
  filter();
 }).catch(function(){ $('#dd-results').innerHTML='<div class="dd-empty">El histórico aún no está disponible. Se generará cuando el pipeline publique la primera serie.</div>'});
 ['dd-product','dd-region','dd-from','dd-to'].forEach(function(id){$('#'+id).addEventListener('change',filter)});
 $('#dd-export').addEventListener('click',download);
}
document.addEventListener('DOMContentLoaded',init);
})();