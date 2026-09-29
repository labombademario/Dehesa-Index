/* Dehesa Index — compact cross-page news index.
   Kept separate from the full News UI so price/product pages can consume
   market-linked stories without loading the News page renderer. */
(function(global){
  'use strict';
  global.DehesaNewsIndex = {

    energia: [
      { id:'n8', date:'2026-09-18', region:'us', topic:'energia', source:'Reuters', headline:{es:'El diésel en EE. UU. alcanza niveles récord y presiona los costes agrícolas',en:'Record U.S. diesel prices squeeze farmers and could lift food costs',fr:'Le diesel américain atteint des niveaux records et pèse sur les coûts agricoles',it:'Il diesel negli USA raggiunge livelli record e pesa sui costi agricoli'}, url:'https://www.reuters.com/business/energy/record-us-diesel-prices-squeeze-farmers-food-prices-may-rise-2026-09-18/' },
      { id:'n10', date:'2026-09-29', region:'global', topic:'energia', source:'Reuters', headline:{es:'El petróleo baja mientras se recuperan algunas exportaciones de Oriente Medio',en:'Oil prices fall as Middle East exports show signs of recovery',fr:'Le pétrole recule alors que les exportations du Moyen-Orient montrent des signes de reprise',it:'Il petrolio scende mentre le esportazioni mediorientali mostrano segnali di ripresa'}, url:'https://www.reuters.com/business/energy/oil-prices-rise-second-session-continued-middle-east-supply-concern-2026-09-29/' }
    ],
    fertilizantes: [
      { id:'n11', date:'2026-09-29', region:'global', topic:'comercio', source:'Reuters', headline:{es:'Belarús plantea un proyecto de fertilizantes nitrogenados con Gazprom y ofrece cooperación a EE. UU.',en:'Belarus proposes a nitrogen fertilizer project with Gazprom and offers U.S. cooperation',fr:'La Biélorussie propose un projet d’engrais azotés avec Gazprom et offre une coopération aux États-Unis',it:'La Bielorussia propone un progetto di fertilizzanti azotati con Gazprom e offre cooperazione agli USA'}, url:'https://www.reuters.com/world/europe/lukashenko-proposes-us-join-belarus-gazprom-fertilizer-project-belta-reports-2026-09-29/' }
    ],
    maiz: [
      { id:'n7', date:'2026-09-21', region:'us', topic:'clima', source:'DTN Progressive Farmer', headline:{es:'Lluvias récord de septiembre frenan la cosecha de maíz en el Corn Belt de EE. UU.',en:'Record September rains slow corn harvest across the U.S. Corn Belt',fr:'Des pluies record en septembre ralentissent la récolte de maïs dans la Corn Belt américaine',it:'Piogge record di settembre rallentano la raccolta del mais nella Corn Belt statunitense'}, url:'https://www.dtnpf.com/agriculture/web/ag/news/article/2026/09/21/usda-crop-progress-corn-13-harvested' },
      { id:'n9', date:'2026-09-29', region:'us', topic:'oferta', source:'Farm Progress', headline:{es:'La cosecha de maíz de EE. UU. llega al 18% mientras las lluvias ralentizan el avance',en:'U.S. corn harvest reaches 18% as rain slows fieldwork',fr:'La récolte de maïs américaine atteint 18 % alors que les pluies ralentissent les travaux',it:'Il raccolto di mais negli USA raggiunge il 18% mentre le piogge rallentano i lavori'}, url:'https://www.farmprogress.com/markets-and-quotes/morning-market-review' }
    ],
    soja: [
      { id:'n5', date:'2026-04-13', region:'us', topic:'comercio', source:'Associated Press', headline:{es:'Ya bajo presión financiera, los agricultores estadounidenses se ven más asfixiados por los aranceles y la guerra de Irán',en:'Already under financial pressure, farmers squeezed further by tariffs and Iran war',fr:'Déjà sous pression financière, les agriculteurs américains davantage étranglés par les tarifs douaniers et la guerre en Iran',it:'Già sotto pressione finanziaria, gli agricoltori statunitensi ulteriormente colpiti dai dazi e dalla guerra in Iran'}, url:'https://www.pbs.org/newshour/nation/already-under-financial-pressure-farmers-squeezed-further-by-tariffs-and-iran-war' },
      { id:'n12', date:'2026-09-28', region:'global', topic:'comercio', source:'Reuters', headline:{es:'China recorta aranceles a productos agrícolas de EE. UU., pero excluye la soja',en:'China cuts tariffs on U.S. farm goods but excludes soybeans',fr:'La Chine réduit les droits sur les produits agricoles américains mais exclut le soja',it:'La Cina riduce i dazi sui prodotti agricoli USA ma esclude la soia'}, url:'https://www.reuters.com/world/china/china-says-cut-tariffs-us-farm-goods-soybeans-excluded-2026-09-28/' }
    ],
    trigo: [
      { id:'n12', date:'2026-09-28', region:'global', topic:'comercio', source:'Reuters', headline:{es:'China recorta aranceles a productos agrícolas de EE. UU., pero excluye la soja',en:'China cuts tariffs on U.S. farm goods but excludes soybeans',fr:'La Chine réduit les droits sur les produits agricoles américains mais exclut le soja',it:'La Cina riduce i dazi sui prodotti agricoli USA ma esclude la soia'}, url:'https://www.reuters.com/world/china/china-says-cut-tariffs-us-farm-goods-soybeans-excluded-2026-09-28/' }
    ],
    azucar: [
      { id:'n10', date:'2026-09-29', region:'global', topic:'clima', source:'Reuters', headline:{es:'El clima condiciona la producción de azúcar de Brasil pese a la subida de precios',en:'Weather, not price, drives Brazil mills on sugar production',fr:'Le climat, plutôt que les prix, guide la production de sucre au Brésil',it:'Il clima, più dei prezzi, guida la produzione di zucchero in Brasile'}, url:'https://www.reuters.com/world/americas/weather-not-price-drive-brazil-mills-sugar-production-2026-09-29/' }
    ],
    costes: [
      { id:'n8', date:'2026-09-18', region:'us', topic:'energia', source:'Reuters', headline:{es:'El diésel en EE. UU. alcanza niveles récord y presiona los costes agrícolas',en:'Record U.S. diesel prices squeeze farmers and could lift food costs',fr:'Le diesel américain atteint des niveaux records et pèse sur les coûts agricoles',it:'Il diesel negli USA raggiunge livelli record e pesa sui costi agricoli'}, url:'https://www.reuters.com/business/energy/record-us-diesel-prices-squeeze-farmers-food-prices-may-rise-2026-09-18/' }
    ],
    pac: [
      { id:'n13', date:'2026-09-28', region:'eu', topic:'oferta', source:'European Commission', headline:{es:'El comercio agroalimentario de la UE sigue siendo sólido en 2026',en:'EU agri-food trade remains solid in 2026',fr:'Le commerce agroalimentaire de l’UE reste solide en 2026',it:'Il commercio agroalimentare dell’UE resta solido nel 2026'}, url:'https://agriculture.ec.europa.eu/media/news/eu-agri-food-trade-remains-solid-2026-2026-09-28_en' }
    ]
  };
})(window);
