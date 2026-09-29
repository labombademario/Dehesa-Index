/* Dehesa Index — compact cross-page news index.
   Kept separate from the full News UI so price/product pages can consume
   market-linked stories without loading the News page renderer. */
(function(global){
  'use strict';
  global.DehesaNewsIndex = {
    trigo: [],
    maiz: [
      { id:'n7', date:'2026-09-21', region:'us', topic:'clima', source:'DTN Progressive Farmer', headline:{es:'Lluvias récord de septiembre frenan la cosecha de maíz en el Corn Belt de EE. UU.',en:'Record September rains slow corn harvest across the U.S. Corn Belt',fr:'Des pluies record en septembre ralentissent la récolte de maïs dans la Corn Belt américaine',it:'Piogge record di settembre rallentano la raccolta del mais nella Corn Belt statunitense'}, url:'https://www.dtnpf.com/agriculture/web/ag/news/article/2026/09/21/usda-crop-progress-corn-13-harvested' }
    ],
    arroz: [],
    cebada: [
      { id:'n2', date:'2026-09-17', region:'eu', topic:'clima', source:'Euronews', headline:{es:'Calor y sequía: por qué podría escasear la cerveza en el Oktoberfest',en:'Heat and drought: why beer at Oktoberfest could soon be in short supply',fr:"Chaleur et sécheresse : pourquoi la bière pourrait bientôt manquer à l'Oktoberfest",it:"Caldo e siccità: perché la birra all'Oktoberfest potrebbe presto scarseggiare"}, url:'https://www.euronews.com/2026/09/17/heat-and-drought-why-beer-at-oktoberfest-could-soon-be-in-short-supply' }
    ],
    soja: [
      { id:'n5', date:'2026-04-13', region:'us', topic:'comercio', source:'Associated Press', headline:{es:'Ya bajo presión financiera, los agricultores estadounidenses se ven más asfixiados por los aranceles y la guerra de Irán',en:'Already under financial pressure, farmers squeezed further by tariffs and Iran war',fr:'Déjà sous pression financière, les agriculteurs américains davantage étranglés par les tarifs douaniers et la guerre en Iran',it:'Già sotto pressione finanziaria, gli agricoltori statunitensi ulteriormente colpiti dai dazi e dalla guerra in Iran'}, url:'https://www.pbs.org/newshour/nation/already-under-financial-pressure-farmers-squeezed-further-by-tariffs-and-iran-war' }
    ],
    fertilizantes: [
      { id:'n1', date:'2026-09-22', region:'eu', topic:'costes', source:'Euronews', headline:{es:'Los agricultores españoles piden ayuda urgente por el encarecimiento de costes debido a la guerra de Irán',en:'Spanish farmers demand urgent aid as war in Iran drives up costs',fr:"Les agriculteurs espagnols réclament une aide urgente face à la hausse des coûts liée à la guerre en Iran",it:"Gli agricoltori spagnoli chiedono aiuti urgenti per l'aumento dei costi dovuto alla guerra in Iran"}, url:'https://www.euronews.com/2026/09/22/spanish-farmers-demand-urgent-aid-as-war-in-iran-drives-up-costs' }
    ],
    diesel: [
      { id:'n1', date:'2026-09-22', region:'eu', topic:'energia', source:'Euronews', headline:{es:'Los agricultores españoles piden ayuda urgente por el encarecimiento de costes debido a la guerra de Irán',en:'Spanish farmers demand urgent aid as war in Iran drives up costs',fr:"Les agriculteurs espagnols réclament une aide urgente face à la hausse des coûts liée à la guerre en Iran",it:"Gli agricoltori spagnoli chiedono aiuti urgenti per l'aumento dei costi dovuto alla guerra in Iran"}, url:'https://www.euronews.com/2026/09/22/spanish-farmers-demand-urgent-aid-as-war-in-iran-drives-up-costs' }
    ],
    energia: [
      { id:'n1', date:'2026-09-22', region:'eu', topic:'energia', source:'Euronews', headline:{es:'Los agricultores españoles piden ayuda urgente por el encarecimiento de costes debido a la guerra de Irán',en:'Spanish farmers demand urgent aid as war in Iran drives up costs',fr:"Les agriculteurs espagnols réclament une aide urgente face à la hausse des coûts liée à la guerre en Iran",it:"Gli agricoltori spagnoli chiedono aiuti urgenti per l'aumento dei costi dovuto alla guerra in Iran"}, url:'https://www.euronews.com/2026/09/22/spanish-farmers-demand-urgent-aid-as-war-in-iran-drives-up-costs' }
    ],
    costes: [
      { id:'n1', date:'2026-09-22', region:'eu', topic:'costes', source:'Euronews', headline:{es:'Los agricultores españoles piden ayuda urgente por el encarecimiento de costes debido a la guerra de Irán',en:'Spanish farmers demand urgent aid as war in Iran drives up costs',fr:"Les agriculteurs espagnols réclament une aide urgente face à la hausse des coûts liée à la guerre en Iran",it:"Gli agricoltori spagnols chiedono aiuti urgentes per l'aumento de los costes"}, url:'https://www.euronews.com/2026/09/22/spanish-farmers-demand-urgent-aid-as-war-in-iran-drives-up-costs' }
    ],
    pac: [
      { id:'n3', date:'2026-09-10', region:'eu', topic:'politica', source:'Euronews', headline:{es:'Los agricultores saben que el dinero es limitado, dice el comisario europeo de Agricultura',en:'Farmers know cash is limited, European commissioner for agriculture says',fr:'Les agriculteurs savent que l’argent est limité, affirme le commissaire européen à l’Agriculture',it:'Gli agricoltori sanno che i fondi sono limitati, afferma il commissario europeo all’Agricoltura'}, url:'https://www.euronews.com/2026/09/10/farmers-know-cash-is-limited-european-commissioner-for-agriculture-christophe-hansen-says' },
      { id:'n6', date:'2026-07-28', region:'eu', topic:'ayudas', source:'La Moncloa — Gobierno de España', headline:{es:'Más de 563.000 agricultores y ganaderos solicitan las ayudas de la PAC para la campaña 2026',en:'Over 563,000 farmers and ranchers apply for CAP aid for the 2026 campaign',fr:'Plus de 563 000 agriculteurs et éleveurs demandent les aides de la PAC pour la campagne 2026',it:'Oltre 563.000 agricoltori e allevatori richiedono gli aiuti della PAC per la campagna 2026'}, url:'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/agricultura/Paginas/2026/280726-solicitud-unica-pac.aspx' }
    ]
  };
})(window);
