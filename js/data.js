/* Dehesa Index — capa de datos y funciones puras compartidas por Precios
   (y, más adelante, por el resto de páginas de mercado). Extraído 1:1 del
   artefacto Design original (Main.dc.html): mismos precios, mismas fuentes,
   mismos comentarios de investigación -- solo se ha adaptado la sintaxis
   `this.props`/`this.state` a funciones planas. ES5 a propósito, sin build
   step (var, function(){}, sin arrow functions). */
(function (global) {
  'use strict';

  // --- Tipos de cambio (Banco Central Europeo, referencia del 26 oct 2026) -
  var EURUSD = 1.1188;
  var GBPUSD = 1.3348;
  var FX_DATE = '2026-10-26'; // fecha ISO de la cotización, la actualiza scripts/update-fx.mjs
  var CADUSD = 0.7128;
  var DKKUSD = 0.1497; // corona danesa (ERM II, ~7,46 por EUR); la actualiza scripts/update-fx.mjs
  var FX = { USD: 1, EUR: EURUSD, GBP: GBPUSD, CAD: CADUSD, DKK: DKKUSD };
  var FXM = {"s":"1999-01","EUR":[1.16078,1.12077,1.0883,1.07044,1.06281,1.03775,1.03527,1.06035,1.05008,1.07063,1.03382,1.01101,1.0137,0.98342,0.96434,0.94695,0.90597,0.94918,0.93966,0.90406,0.87211,0.85516,0.85639,0.89732,0.93828,0.9217,0.90952,0.892,0.87416,0.85317,0.86066,0.90048,0.91109,0.90587,0.88831,0.89237,0.88329,0.87004,0.8758,0.88584,0.917,0.95544,0.99218,0.97776,0.98079,0.98111,1.00136,1.01825,1.06219,1.07729,1.08065,1.08476,1.15818,1.16628,1.13718,1.11387,1.12217,1.16919,1.1702,1.22856,1.26132,1.26465,1.22616,1.19854,1.20072,1.21383,1.22659,1.21759,1.22178,1.24897,1.29914,1.34076,1.31193,1.30143,1.32007,1.29379,1.2694,1.21649,1.20372,1.22924,1.22564,1.20145,1.17857,1.18561,1.21031,1.19383,1.202,1.22712,1.27696,1.265,1.26837,1.28113,1.27274,1.2611,1.28814,1.32128,1.29986,1.30742,1.32419,1.35162,1.35113,1.34186,1.37156,1.36225,1.38965,1.42275,1.46836,1.45704,1.47179,1.47484,1.55265,1.57505,1.5557,1.55528,1.57697,1.49754,1.43695,1.33221,1.27321,1.34494,1.32387,1.27847,1.30498,1.31903,1.36505,1.40165,1.40877,1.4268,1.45616,1.48164,1.49145,1.46136,1.42721,1.36857,1.35685,1.34057,1.25653,1.22085,1.277,1.28942,1.3067,1.38978,1.3661,1.32201,1.33597,1.36489,1.39992,1.44418,1.43486,1.43884,1.42643,1.43432,1.377,1.37063,1.35557,1.31791,1.29049,1.32241,1.3201,1.31617,1.27889,1.25263,1.22884,1.24,1.28557,1.29742,1.28277,1.31194,1.32881,1.3359,1.29636,1.3026,1.29821,1.31888,1.30801,1.33095,1.33479,1.3635,1.34929,1.37036,1.36102,1.36585,1.38225,1.38125,1.37321,1.35924,1.35392,1.33161,1.29014,1.26727,1.24722,1.23313,1.16213,1.13497,1.08377,1.07793,1.11495,1.12132,1.09958,1.1139,1.12212,1.12351,1.0736,1.08772,1.08597,1.10929,1.10997,1.13392,1.13111,1.12289,1.10685,1.12117,1.12121,1.10261,1.0799,1.05429,1.06144,1.06427,1.06847,1.07227,1.10575,1.12295,1.15111,1.18067,1.19146,1.17559,1.1738,1.18362,1.21995,1.23478,1.23362,1.22763,1.18122,1.16783,1.16857,1.1549,1.16587,1.1484,1.13669,1.13842,1.14164,1.13512,1.13025,1.12383,1.11846,1.12934,1.12184,1.11262,1.10039,1.10526,1.10509,1.11135,1.11004,1.0905,1.10634,1.08619,1.09018,1.12546,1.14634,1.18281,1.17924,1.17752,1.18379,1.21697,1.21708,1.20979,1.18991,1.19791,1.21459,1.20471,1.18218,1.17718,1.17703,1.16015,1.14141,1.13038,1.13145,1.13419,1.1019,1.08187,1.05785,1.05658,1.01789,1.01284,0.99038,0.98257,1.02013,1.05888,1.0769,1.07151,1.07058,1.09677,1.08675,1.08399,1.10581,1.09089,1.06838,1.05625,1.08082,1.09031,1.09051,1.07947,1.08722,1.07278,1.08122,1.0759,1.08441,1.10122,1.1106,1.09044,1.06301,1.04787,1.03537,1.04125,1.08068,1.12139,1.1278,1.15162,1.16769,1.16314,1.17322,1.16304,1.15602,1.17087,1.17382,1.1824,1.15583,1.17064,1.16732,1.1518,1.14175,1.15931,1.15132],"GBP":[1.65139,1.62782,1.62125,1.60964,1.61459,1.59592,1.57386,1.60627,1.62342,1.65766,1.62291,1.61373,1.63939,1.59996,1.57927,1.58348,1.50616,1.50838,1.50817,1.48915,1.43504,1.45108,1.42639,1.46281,1.47807,1.4538,1.44565,1.43481,1.42539,1.40115,1.41424,1.43683,1.46264,1.45186,1.43652,1.43903,1.43253,1.42255,1.42237,1.44257,1.45966,1.48349,1.55344,1.53655,1.55537,1.55746,1.57178,1.58563,1.61645,1.60845,1.58326,1.57435,1.62388,1.6608,1.62351,1.59308,1.61017,1.67595,1.68913,1.7502,1.82233,1.86829,1.82671,1.80144,1.78793,1.82728,1.84239,1.81889,1.79332,1.80633,1.85957,1.92915,1.87776,1.887,1.9067,1.89446,1.85586,1.81851,1.7507,1.79381,1.80881,1.7633,1.7349,1.74554,1.76435,1.748,1.74368,1.76658,1.86883,1.84225,1.84404,1.89324,1.88525,1.87513,1.91128,1.96367,1.95938,1.95721,1.94673,1.98961,1.983,1.9861,2.03375,2.01021,2.01728,2.04376,2.07116,2.02187,1.96961,1.96399,2.00358,1.98153,1.96405,1.96491,1.98842,1.88895,1.79789,1.69346,1.53283,1.48699,1.44182,1.44149,1.41898,1.46957,1.54339,1.6361,1.63635,1.65396,1.63366,1.61827,1.65915,1.62424,1.61623,1.56222,1.50493,1.53286,1.46595,1.47498,1.52814,1.56553,1.55584,1.58583,1.59759,1.55874,1.57707,1.61267,1.61554,1.6357,1.63447,1.62132,1.61222,1.63607,1.57963,1.57479,1.58104,1.5614,1.55087,1.58002,1.58194,1.60141,1.59124,1.55453,1.55892,1.57193,1.61056,1.6084,1.59571,1.61495,1.59576,1.54888,1.50747,1.53111,1.52884,1.54814,1.51755,1.54934,1.58581,1.60942,1.61051,1.63843,1.64625,1.65538,1.66196,1.67385,1.68421,1.69041,1.70711,1.67015,1.63075,1.60697,1.57769,1.56429,1.51557,1.53269,1.49778,1.49472,1.54588,1.55571,1.5556,1.55958,1.53444,1.53303,1.51944,1.49833,1.43915,1.43027,1.42267,1.43118,1.45426,1.42049,1.31602,1.31099,1.31555,1.23348,1.24277,1.24855,1.23279,1.24807,1.23436,1.26412,1.29245,1.28009,1.29897,1.29573,1.33168,1.31982,1.32193,1.34099,1.38111,1.39687,1.39728,1.40764,1.34649,1.3288,1.31707,1.2877,1.30585,1.30098,1.28996,1.26809,1.28849,1.30079,1.31697,1.30406,1.28299,1.26739,1.24729,1.21527,1.23512,1.26259,1.28858,1.31162,1.30704,1.29675,1.23669,1.24069,1.22927,1.25221,1.26714,1.31305,1.29662,1.29767,1.32112,1.34288,1.36343,1.38629,1.38566,1.38444,1.40808,1.40291,1.38084,1.38025,1.3737,1.3698,1.34621,1.33182,1.35497,1.35365,1.31745,1.29326,1.24499,1.23203,1.19815,1.19865,1.13234,1.12864,1.17402,1.2178,1.2208,1.21006,1.21392,1.24471,1.24856,1.2625,1.28799,1.27007,1.24002,1.21691,1.24168,1.26532,1.26991,1.26304,1.27125,1.2524,1.26364,1.2711,1.28588,1.29326,1.32181,1.30597,1.27492,1.26549,1.23394,1.25345,1.2911,1.31344,1.33706,1.35515,1.35042,1.34425,1.35017,1.33445,1.31371,1.33814,1.35189,1.35858,1.3342,1.3466,1.34849,1.33353,1.33707,1.35425,1.34167],"CAD":[0.65781,0.66769,0.65917,0.67138,0.68451,0.68075,0.67213,0.66972,0.67668,0.67728,0.68196,0.67827,0.69022,0.68913,0.68483,0.68174,0.66864,0.6771,0.67668,0.67437,0.67369,0.6617,0.64858,0.65598,0.66555,0.65711,0.64201,0.64161,0.64883,0.6555,0.65433,0.64983,0.63892,0.63685,0.62765,0.634,0.62491,0.62684,0.62996,0.63239,0.64532,0.6532,0.64758,0.63768,0.63546,0.63374,0.63637,0.64156,0.64909,0.66095,0.67782,0.68436,0.72315,0.73826,0.72461,0.71541,0.73202,0.75487,0.76181,0.76162,0.77162,0.75199,0.75161,0.74591,0.72589,0.73603,0.75623,0.76068,0.77489,0.8006,0.83602,0.8209,0.81691,0.80696,0.82175,0.80907,0.79627,0.80504,0.81719,0.82949,0.8481,0.84916,0.84524,0.86053,0.86299,0.86995,0.86358,0.87328,0.90101,0.89786,0.88676,0.89353,0.89609,0.8859,0.8802,0.86858,0.85043,0.85401,0.85586,0.88144,0.91318,0.9388,0.95133,0.94467,0.97364,1.02426,1.03673,0.9966,0.99033,1.00056,1.0005,0.98659,1.00171,0.98419,0.98719,0.94992,0.94527,0.85146,0.82095,0.81021,0.81552,0.80208,0.79236,0.81482,0.86879,0.88931,0.89025,0.91922,0.92444,0.94861,0.94364,0.94911,0.95918,0.94684,0.97692,0.99545,0.96214,0.96329,0.95856,0.96147,0.96686,0.98204,0.98772,0.99201,1.00619,1.01221,1.02396,1.04393,1.03343,1.02311,1.04591,1.01935,0.99824,0.98037,0.97548,0.97763,0.98717,1.00235,1.00609,1.00719,0.99014,0.97296,0.98615,1.0069,1.02171,1.01357,1.00316,1.01046,1.0075,0.99123,0.97579,0.98179,0.97923,0.97006,0.96044,0.96074,0.96605,0.96513,0.95392,0.93988,0.9144,0.9049,0.90036,0.90983,0.9185,0.92292,0.93222,0.91534,0.90877,0.89156,0.88228,0.86744,0.82781,0.79936,0.79336,0.80969,0.82178,0.80939,0.77852,0.761,0.75403,0.76508,0.75349,0.72981,0.70302,0.72423,0.75523,0.77882,0.77337,0.77564,0.76714,0.77017,0.76391,0.75553,0.7438,0.74931,0.75644,0.76335,0.74688,0.74423,0.73517,0.75157,0.78621,0.79299,0.81391,0.79425,0.7837,0.78342,0.80437,0.79529,0.77376,0.78582,0.77726,0.76195,0.76098,0.76673,0.76649,0.76893,0.75787,0.74515,0.75127,0.75702,0.74831,0.74748,0.74277,0.75232,0.76351,0.75341,0.75484,0.75799,0.75536,0.75912,0.76432,0.75282,0.71762,0.71052,0.71634,0.7378,0.74048,0.75562,0.75662,0.75682,0.76512,0.78034,0.78554,0.78795,0.79486,0.79992,0.82443,0.81881,0.79847,0.79394,0.78945,0.80363,0.796,0.78159,0.79221,0.78642,0.78991,0.79245,0.7785,0.78052,0.77231,0.77446,0.75105,0.72905,0.74417,0.73643,0.74402,0.74412,0.73084,0.74148,0.73993,0.75204,0.7565,0.74193,0.73897,0.72974,0.72891,0.74406,0.74534,0.74117,0.7383,0.73173,0.73156,0.72944,0.72934,0.73174,0.73859,0.7273,0.71559,0.70256,0.69471,0.69914,0.6964,0.71422,0.72083,0.73101,0.73063,0.72439,0.72303,0.71439,0.71148,0.72418,0.72579,0.73257,0.72933,0.72726,0.72833,0.71253,0.70832,0.71904,0.71632],"DKK":[0.15599,0.15074,0.14642,0.14402,0.14298,0.13964,0.13917,0.14257,0.14126,0.14403,0.13902,0.13588,0.13618,0.13209,0.12949,0.1271,0.12149,0.12722,0.12598,0.12122,0.11686,0.11483,0.11485,0.12032,0.12571,0.1235,0.12185,0.11952,0.11716,0.11446,0.11561,0.12095,0.12244,0.12181,0.11931,0.11989,0.11884,0.1171,0.11784,0.11916,0.12333,0.12854,0.13354,0.13165,0.13206,0.13205,0.13481,0.13711,0.14291,0.14496,0.1455,0.14608,0.15599,0.15708,0.15299,0.14987,0.15109,0.15736,0.15735,0.16509,0.16935,0.16973,0.1646,0.16102,0.16138,0.16328,0.16496,0.16373,0.16426,0.16792,0.17482,0.18036,0.17632,0.17486,0.17727,0.17367,0.17052,0.1634,0.16139,0.16479,0.16433,0.16101,0.15799,0.15905,0.16221,0.15994,0.1611,0.16445,0.17125,0.16965,0.17002,0.17171,0.17061,0.16915,0.17276,0.17724,0.17439,0.1754,0.17776,0.18135,0.18131,0.18023,0.18432,0.18303,0.18651,0.19088,0.19698,0.19532,0.19754,0.19786,0.20824,0.21112,0.20851,0.20852,0.21139,0.20076,0.19266,0.17871,0.17094,0.18052,0.17765,0.17157,0.17514,0.17707,0.18331,0.18825,0.1892,0.19167,0.19565,0.19904,0.20042,0.19637,0.19177,0.18385,0.18233,0.18012,0.16886,0.16407,0.17136,0.17309,0.17545,0.18638,0.18325,0.17738,0.17928,0.18307,0.18772,0.19366,0.19243,0.19293,0.19131,0.19253,0.18493,0.18412,0.18217,0.17728,0.17356,0.17788,0.17754,0.17692,0.17204,0.16853,0.1652,0.16654,0.17247,0.17396,0.17198,0.17585,0.17809,0.17908,0.17388,0.17472,0.17417,0.17685,0.17539,0.17846,0.17898,0.18279,0.1809,0.18369,0.18241,0.18303,0.18519,0.18501,0.18398,0.18223,0.18158,0.17862,0.17329,0.17022,0.1676,0.16574,0.15619,0.15234,0.14529,0.14439,0.14943,0.15031,0.14736,0.14926,0.1504,0.1506,0.14391,0.14578,0.14553,0.14864,0.14885,0.15235,0.15206,0.15099,0.14879,0.15068,0.15055,0.1482,0.14514,0.14178,0.14275,0.14315,0.1437,0.14417,0.14862,0.15098,0.15479,0.15874,0.16014,0.15795,0.15773,0.15902,0.16385,0.16584,0.16561,0.16483,0.15859,0.15677,0.15681,0.1549,0.15632,0.15395,0.15235,0.15249,0.15292,0.15211,0.15146,0.15055,0.14978,0.15125,0.15027,0.14914,0.14744,0.14797,0.1479,0.14873,0.14854,0.14596,0.1481,0.14557,0.14618,0.15097,0.15394,0.15885,0.15846,0.15822,0.15898,0.16354,0.16362,0.16268,0.16001,0.16108,0.16333,0.162,0.15895,0.15829,0.15829,0.15594,0.15347,0.15201,0.15205,0.15243,0.1481,0.14543,0.14217,0.14203,0.13676,0.13615,0.13318,0.13208,0.13714,0.14237,0.14478,0.14393,0.14379,0.14718,0.1459,0.14552,0.14842,0.14639,0.14328,0.14158,0.14492,0.14624,0.14624,0.1448,0.14581,0.14381,0.14493,0.14424,0.14535,0.14759,0.14887,0.14619,0.14253,0.14049,0.13877,0.13959,0.14487,0.15022,0.15118,0.15438,0.15647,0.15584,0.15718,0.15574,0.1548,0.15675,0.15713,0.15828,0.15469,0.15665,0.15621,0.1541,0.15274,0.15508,0.15402],"e":"2026-09"}; // medias mensuales del BCE (USD por 1 unidad); las escribe scripts/build-fx-monthly.py
  var CCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', DKK: 'kr ', PLN: 'zł ' };

  // Nombres de mes abreviados por idioma, para mostrar FX_DATE en el panel
  // sin depender de Intl (coherencia con el resto del sitio, que es ES5
  // puro y sin build step).
  var MONTH_ABBR = {
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  };
  function formatFxDate(isoDate, lang) {
    var parts = String(isoDate).split('-');
    var y = parts[0], m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    var months = MONTH_ABBR[lang] || MONTH_ABBR.es;
    if (lang === 'en') return months[m - 1] + ' ' + d + ', ' + y;
    return d + ' ' + months[m - 1] + ' ' + y;
  }

  var UNIT_LABELS = {
    es: { bushel: 'bushel', mmbtu: 'MMBtu', mwh: 'MWh', barril: 'barril', cwt: 'cwt', lb: 'lb', ton_corta: 'ton corta', tonelada: 'tonelada', kg: 'kg', '100kg': '100 kg', gal: 'galón', docena: 'docena', litro: 'litro' },
    en: { bushel: 'bushel', mmbtu: 'MMBtu', mwh: 'MWh', barril: 'barrel', cwt: 'cwt', lb: 'lb', ton_corta: 'short ton', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'dozen', litro: 'liter' },
    fr: { bushel: 'bushel', mmbtu: 'MMBtu', mwh: 'MWh', barril: 'baril', cwt: 'cwt', lb: 'lb', ton_corta: 'tonne courte', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'douzaine', litro: 'litre' },
    it: { bushel: 'bushel', mmbtu: 'MMBtu', mwh: 'MWh', barril: 'barile', cwt: 'cwt', lb: 'lb', ton_corta: 'tonnellata corta', tonelada: 'tonnellata', kg: 'kg', '100kg': '100 kg', gal: 'gallone', docena: 'dozzina', litro: 'litro' }
  };

  var REGION = {
    es: { us: 'EE. UU.', eu: 'Europa', uk: 'Reino Unido', ca: 'Canadá', dk: 'Dinamarca' },
    en: { us: 'U.S.', eu: 'Europe', uk: 'U.K.', ca: 'Canada', dk: 'Denmark' },
    fr: { us: 'États-Unis', eu: 'Europe', uk: 'Royaume-Uni', ca: 'Canada', dk: 'Danemark' },
    it: { us: 'Stati Uniti', eu: 'Europa', uk: 'Regno Unito', ca: 'Canada', dk: 'Danimarca' }
  };

  var ENERGY_REGIONS = {
    es: { usNacional: 'EE. UU. (nacional)', usMidwest: 'Medio Oeste (Midwest)', usSur: 'Sur (Costa del Golfo)', usOeste: 'Oeste (Costa Oeste)', usEste: 'Este (Costa Este)', euPromedio: 'Media UE-27', euAlemania: 'Alemania', euFrancia: 'Francia', euEspana: 'España', euItalia: 'Italia', usTitle: 'EE. UU. por regiones', euTitle: 'Europa por país', regionalTitle: 'Desglose regional' },
    en: { usNacional: 'U.S. (national)', usMidwest: 'Midwest', usSur: 'South (Gulf Coast)', usOeste: 'West (West Coast)', usEste: 'East (East Coast)', euPromedio: 'EU-27 average', euAlemania: 'Germany', euFrancia: 'France', euEspana: 'Spain', euItalia: 'Italy', usTitle: 'U.S. by region', euTitle: 'Europe by country', regionalTitle: 'Regional breakdown' },
    fr: { usNacional: 'États-Unis (national)', usMidwest: 'Midwest', usSur: 'Sud (côte du Golfe)', usOeste: 'Ouest (côte Pacifique)', usEste: 'Est (côte Est)', euPromedio: 'Moyenne UE-27', euAlemania: 'Allemagne', euFrancia: 'France', euEspana: 'Espagne', euItalia: 'Italie', usTitle: 'États-Unis par région', euTitle: 'Europe par pays', regionalTitle: 'Répartition régionale' },
    it: { usNacional: 'Stati Uniti (nazionale)', usMidwest: 'Midwest', usSur: 'Sud (costa del Golfo)', usOeste: 'Ovest (costa Pacifica)', usEste: 'Est (costa Orientale)', euPromedio: 'Media UE-27', euAlemania: 'Germania', euFrancia: 'Francia', euEspana: 'Spagna', euItalia: 'Italia', usTitle: 'Stati Uniti per regione', euTitle: 'Europa per paese', regionalTitle: 'Ripartizione regionale' }
  };
  var COUNTRY_ER_KEY = { de: 'euAlemania', fr: 'euFrancia', es: 'euEspana', it: 'euItalia' };
  var COUNTRY_FLAG = { de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹' };

  var QUOTE_TYPES = {
    es: {
      futuro: { label: 'Futuro', desc: 'Precio de un contrato de futuros negociado en un mercado organizado (p. ej. CBOT, Euronext).' },
      referencia: { label: 'Referencia oficial', desc: 'Precio o índice de referencia publicado por un organismo público (p. ej. USDA), no un contrato negociado.' },
      lonja: { label: 'Lonja', desc: 'Precio de contratación en una lonja o mercado físico regional.' },
      indice: { label: 'Índice', desc: 'Índice compuesto a partir de varias fuentes, no un precio de una única transacción.' },
      spot: { label: 'Spot', desc: 'Precio al contado para entrega inmediata.' }
    },
    en: {
      futuro: { label: 'Futures', desc: 'Price of a futures contract traded on an organized exchange (e.g. CBOT, Euronext).' },
      referencia: { label: 'Official reference', desc: 'Reference price or index published by a public body (e.g. USDA), not a traded contract.' },
      lonja: { label: 'Regional market', desc: 'Price set at a regional physical trading market (lonja).' },
      indice: { label: 'Index', desc: 'Composite index built from several sources, not a single-transaction price.' },
      spot: { label: 'Spot', desc: 'Cash price for immediate delivery.' }
    },
    fr: {
      futuro: { label: 'Futur', desc: 'Prix d’un contrat à terme négocié sur un marché organisé (p. ex. CBOT, Euronext).' },
      referencia: { label: 'Référence officielle', desc: 'Prix ou indice de référence publié par un organisme public (p. ex. USDA), pas un contrat négocié.' },
      lonja: { label: 'Marché régional', desc: 'Prix constaté sur un marché physique régional (lonja).' },
      indice: { label: 'Indice', desc: 'Indice composite construit à partir de plusieurs sources, pas le prix d’une seule transaction.' },
      spot: { label: 'Spot', desc: 'Prix au comptant pour livraison immédiate.' }
    },
    it: {
      futuro: { label: 'Futuro', desc: 'Prezzo di un contratto future negoziato su un mercato organizzato (es. CBOT, Euronext).' },
      referencia: { label: 'Riferimento ufficiale', desc: 'Prezzo o indice di riferimento pubblicato da un ente pubblico (es. USDA), non un contratto negoziato.' },
      lonja: { label: 'Mercato regionale', desc: 'Prezzo rilevato in un mercato fisico regionale (lonja).' },
      indice: { label: 'Indice', desc: 'Indice composito costruito da più fonti, non il prezzo di una singola transazione.' },
      spot: { label: 'Spot', desc: 'Prezzo a pronti per consegna immediata.' }
    }
  };

  var NAMES = {
    es: { trigo_duro: 'Trigo duro', canola_elevador: 'Canola, oferta de elevador (Alberta)', trigo_pienso_ab: 'Trigo forrajero, oferta de elevador (Alberta)', cebada_pienso_ab: 'Cebada forrajera, oferta de elevador (Alberta)', avena_pienso_ab: 'Avena forrajera, oferta de elevador (Alberta)', trigo_cwrs_ab: 'Trigo CWRS, oferta de elevador (Alberta)', lenteja_laird_ab: 'Lenteja Laird n.º 1, oferta al contado (Alberta)', guisante_verde_ab: 'Guisante verde n.º 2, oferta al contado (Alberta)', novillo_ab: 'Novillos, ventas directas (Alberta)', cerdo_ab: 'Cerdo en canal, precio al contado (Alberta)', soja_grano: 'Soja en grano', lenteja: 'Lentejas', guisante_seco: 'Guisantes secos', lino: 'Lino (linaza)', gas_natural: 'Gas natural', petroleo_wti: 'Petróleo WTI (Texas)', petroleo_brent: 'Petróleo Brent', mantequilla: 'Mantequilla', leche_polvo: 'Leche desnatada en polvo', colza: 'Colza', centeno: 'Centeno', cebada: 'Cebada', avena: 'Avena', sorgo: 'Sorgo', maiz: 'Maíz', trigo: 'Trigo', arroz: 'Arroz', leche: 'Leche', vaca: 'Vaca (vacuno)', cabra: 'Cabra', pienso: 'Pienso compuesto', harina_soja: 'Harina de soja', urea: 'Urea', dap: 'DAP (fosfato diamónico)', potasa: 'Potasa (MOP)', cerdo: 'Cerdo', cordero: 'Cordero', huevos: 'Huevos', pollo: 'Pollo', azucar: 'Azúcar', oliva: 'Aceite de oliva', diesel: 'Diésel agrícola' },
    en: { trigo_duro: 'Durum wheat', canola_elevador: 'Canola, elevator bid (Alberta)', trigo_pienso_ab: 'Feed wheat, elevator bid (Alberta)', cebada_pienso_ab: 'Feed barley, elevator bid (Alberta)', avena_pienso_ab: 'Feed oats, elevator bid (Alberta)', trigo_cwrs_ab: 'CWRS wheat, elevator bid (Alberta)', lenteja_laird_ab: 'Laird lentils no. 1, cash bid (Alberta)', guisante_verde_ab: 'Green peas no. 2, cash bid (Alberta)', novillo_ab: 'Steers, direct sales (Alberta)', cerdo_ab: 'Hogs (carcass), cash price (Alberta)', soja_grano: 'Soybeans', lenteja: 'Lentils', guisante_seco: 'Dry peas', lino: 'Flaxseed', gas_natural: 'Natural gas', petroleo_wti: 'WTI crude oil (Texas)', petroleo_brent: 'Brent crude oil', mantequilla: 'Butter', leche_polvo: 'Skim milk powder', colza: 'Rapeseed', centeno: 'Rye', cebada: 'Barley', avena: 'Oats', sorgo: 'Sorghum', maiz: 'Corn', trigo: 'Wheat', arroz: 'Rice', leche: 'Milk', vaca: 'Cattle', cabra: 'Goat', pienso: 'Compound feed', harina_soja: 'Soybean meal', urea: 'Urea', dap: 'DAP (diammonium phosphate)', potasa: 'Potash (MOP)', cerdo: 'Pork', cordero: 'Lamb', huevos: 'Eggs', pollo: 'Chicken', azucar: 'Sugar', oliva: 'Olive oil', diesel: 'Agricultural diesel' },
    fr: { trigo_duro: 'Blé dur', canola_elevador: 'Canola, offre d\'élévateur (Alberta)', trigo_pienso_ab: 'Blé fourrager, offre d\'élévateur (Alberta)', cebada_pienso_ab: 'Orge fourragère, offre d\'élévateur (Alberta)', avena_pienso_ab: 'Avoine fourragère, offre d\'élévateur (Alberta)', trigo_cwrs_ab: 'Blé CWRS, offre d\'élévateur (Alberta)', lenteja_laird_ab: 'Lentilles Laird n° 1, offre au comptant (Alberta)', guisante_verde_ab: 'Pois verts n° 2, offre au comptant (Alberta)', novillo_ab: 'Bouvillons, ventes directes (Alberta)', cerdo_ab: 'Porc (carcasse), prix comptant (Alberta)', soja_grano: 'Soja (grain)', lenteja: 'Lentilles', guisante_seco: 'Pois secs', lino: 'Lin (graines)', gas_natural: 'Gaz naturel', petroleo_wti: 'Pétrole WTI (Texas)', petroleo_brent: 'Pétrole Brent', mantequilla: 'Beurre', leche_polvo: 'Lait écrémé en poudre', colza: 'Colza', centeno: 'Seigle', cebada: 'Orge', avena: 'Avoine', sorgo: 'Sorgho', maiz: 'Maïs', trigo: 'Blé', arroz: 'Riz', leche: 'Lait', vaca: 'Bovins', cabra: 'Chèvre', pienso: 'Aliment composé', harina_soja: 'Tourteau de soja', urea: 'Urée', dap: 'DAP (phosphate diammonique)', potasa: 'Potasse (MOP)', cerdo: 'Porc', cordero: 'Agneau', huevos: 'Œufs', pollo: 'Poulet', azucar: 'Sucre', oliva: "Huile d'olive", diesel: 'Gazole agricole' },
    it: { trigo_duro: 'Grano duro', canola_elevador: 'Canola, offerta elevatore (Alberta)', trigo_pienso_ab: 'Grano da foraggio, offerta elevatore (Alberta)', cebada_pienso_ab: 'Orzo da foraggio, offerta elevatore (Alberta)', avena_pienso_ab: 'Avena da foraggio, offerta elevatore (Alberta)', trigo_cwrs_ab: 'Grano CWRS, offerta elevatore (Alberta)', lenteja_laird_ab: 'Lenticchie Laird n. 1, offerta a pronti (Alberta)', guisante_verde_ab: 'Piselli verdi n. 2, offerta a pronti (Alberta)', novillo_ab: 'Manzi, vendite dirette (Alberta)', cerdo_ab: 'Suini (carcassa), prezzo a pronti (Alberta)', soja_grano: 'Soia in grani', lenteja: 'Lenticchie', guisante_seco: 'Piselli secchi', lino: 'Lino (semi)', gas_natural: 'Gas naturale', petroleo_wti: 'Petrolio WTI (Texas)', petroleo_brent: 'Petrolio Brent', mantequilla: 'Burro', leche_polvo: 'Latte scremato in polvere', colza: 'Colza', centeno: 'Segale', cebada: 'Orzo', avena: 'Avena', sorgo: 'Sorgo', maiz: 'Mais', trigo: 'Grano', arroz: 'Riso', leche: 'Latte', vaca: 'Bovini', cabra: 'Capra', pienso: 'Mangime composto', harina_soja: 'Farina di soia', urea: 'Urea', dap: 'DAP (fosfato diammonico)', potasa: 'Potassa (MOP)', cerdo: 'Maiale', cordero: 'Agnello', huevos: 'Uova', pollo: 'Pollo', azucar: 'Zucchero', oliva: "Olio d'oliva", diesel: 'Gasolio agricolo' }
  };

  var SRC_URL = {
    nass: 'https://www.nass.usda.gov/Charts_and_Maps/Agricultural_Prices/index.php',
    amsDairy: 'https://www.ams.usda.gov/market-news/dairy',
    amsMars: 'https://mymarketnews.ams.usda.gov/',
    ecPrices: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    cmeLiveCattle: 'https://www.cmegroup.com/markets/agriculture/livestock/live-cattle.html',
    euronext: 'https://www.euronext.com/en/products/commodities',
    euronextColza: 'https://live.euronext.com/en/product/commodities-futures/ECO-DPAR',
    defraMilk: 'https://www.gov.uk/government/statistics/uk-milk-prices-and-composition-of-milk',
    statcan: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701',
    cmeSoybeanMeal: 'https://www.cmegroup.com/markets/agriculture/oilseeds/soybean-meal',
    dtnFertilizer: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/09/23/fertilizer-prices-rise-six-eight',
    worldBank: 'https://www.worldbank.org/en/research/commodity-markets',
    usdaPork: 'https://www.ams.usda.gov/market-news/daily-pork-reports',
    ecPigmeat: 'https://agridata.ec.europa.eu/extensions/DashboardPigmeat/PigmeatPricesCarcases.html',
    mercolleida: 'https://www.mercolleida.com/es',
    usdaLamb: 'https://www.ams.usda.gov/mnreports/lswlamb.pdf',
    ecSheep: 'https://agridata.ec.europa.eu/extensions/Dataportal/sheep-and-goat-meat.html',
    usdaEggs: 'https://www.ams.usda.gov/market-news/egg-market-news-reports',
    usdaPoultry: 'https://www.ams.usda.gov/market-news/livestock-poultry-grain',
    ecPoultry: 'https://agridata.ec.europa.eu/extensions/DashboardPoultry/PoultryPrices.html',
    ecEggs: 'https://agridata.ec.europa.eu/extensions/DashboardEggs/EggsPrice.html',
    usdaSugar: 'https://www.ers.usda.gov/topics/crops/sugar-and-sweeteners/data',
    ecSugar: 'https://agridata.ec.europa.eu/extensions/DashboardSugar/SugarPrice.html',
    ecOliveOil: 'https://agridata.ec.europa.eu/extensions/DashboardOliveOil/OliveOilPrices.html',
    eia: 'https://www.eia.gov/petroleum/gasdiesel/',
    usdaAgTransportFuel: 'https://agtransport.usda.gov/Fuel/Weekly-On-Highway-Diesel-Fuel-Prices/x88w-atzp',
    euOilBulletin: 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en',
    enesa: 'https://www.mapa.gob.es/es/enesa/datos_sobre_el_seguro/informes_de_contratacion_del_seguro_agrario/',
    rma: 'https://www.rma.usda.gov/',
    mapaCoyuntura: 'https://www.mapa.gob.es/es/estadistica/temas/publicaciones/informe-semanal-coyuntura',
    franceAgriMerVin: 'https://www.franceagrimer.fr/chiffre-et-analyses-economiques/les-marches-la-production-de-vin',
    oemv: 'https://www.oemv.es/informes',
    cmeLumber: 'https://www.cmegroup.com/markets/agriculture/lumber-and-softs/lumber/quotes.html',
    forestResearchTimber: 'https://www.forestresearch.gov.uk/tools-and-resources/statistics/statistics-by-topic/timber-statistics/timber-price-indices/',
    franceBoisForetBois: 'https://franceboisforet.fr/2026/05/26/prix-de-vente-des-bois-sur-pied-en-foret-privee-indicateur-2026/'
  };

  function withSeps(list) {
    return list.map(function (s, i) { return { name: s.name, url: s.url, sep: i < list.length - 1 ? ' · ' : '' }; });
  }

  // Las 11 categorías "de producto" (con precio diario/semanal) más
  // Seguro agrario, Vino a granel y Madera, que son bloques informativos
  // propios (estadísticas oficiales anuales/de campaña reales, sin tarjeta
  // de producto/histórico/calculadora/alertas -- ver isInsurance/isWine/
  // isWood en precios.js).
  var CATS = {
    es: {
      cereales: { label: 'Cereales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Lácteos', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Ganado', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Porcino', sources: [{ name: 'USDA NASS (cerdo)', url: SRC_URL.nass }, { name: 'Comisión Europea (porcino)', url: SRC_URL.ecPigmeat }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovino', sources: [{ name: 'USDA AMS (cordero)', url: SRC_URL.usdaLamb }, { name: 'Comisión Europea (ovino)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Avicultura', sources: [{ name: 'USDA NASS (huevo)', url: SRC_URL.nass }, { name: 'USDA NASS (aves)', url: SRC_URL.nass }, { name: 'Comisión Europea (pollo)', url: SRC_URL.ecPoultry }, { name: 'Comisión Europea (huevo)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Pienso', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'índices regionales UE', url: SRC_URL.ecPrices }, { name: 'Comisión Europea (oleaginosas)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizantes', sources: [{ name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'referencia internacional (Banco Mundial)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Azúcar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Comisión Europea', url: SRC_URL.ecSugar }] },
      aceite: { label: "Aceites", sources: [{ name: "Comisión Europea", url: SRC_URL.ecOliveOil }, { name: "Banco Mundial (referencia internacional)", url: SRC_URL.worldBank }] },
      tropicales: { label: "Café, cacao y otros", sources: [{ name: "Banco Mundial (referencia internacional)", url: SRC_URL.worldBank }] },
      hortalizas: { label: 'Frutas y hortalizas', sources: [{ name: 'Comisión Europea', url: 'https://agridata.ec.europa.eu/' }, { name: 'MAPA', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' }] },
      energia: { label: 'Energía', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Boletín Semanal del Petróleo (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Seguro agrario', sources: [{ name: 'ENESA (MAPA)', url: SRC_URL.enesa }, { name: 'USDA RMA', url: SRC_URL.rma }] },
      vino: { label: 'Vino a granel', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }] },
      madera: { label: 'Madera', sources: [{ name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }] }
    },
    en: {
      cereales: { label: 'Grains', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Dairy', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'European Commission', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Livestock', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'European Commission', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Pork', sources: [{ name: 'USDA NASS (pork)', url: SRC_URL.nass }, { name: 'European Commission (pigmeat)', url: SRC_URL.ecPigmeat }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Sheep & Lamb', sources: [{ name: 'USDA AMS (lamb)', url: SRC_URL.usdaLamb }, { name: 'European Commission (sheep)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Poultry & Eggs', sources: [{ name: 'USDA NASS (eggs)', url: SRC_URL.nass }, { name: 'USDA NASS (poultry)', url: SRC_URL.nass }, { name: 'European Commission (poultry)', url: SRC_URL.ecPoultry }, { name: 'European Commission (eggs)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Feed', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'EU regional indices', url: SRC_URL.ecPrices }, { name: 'European Commission (oilseeds)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizer', sources: [{ name: 'European Commission (Agri-food)', url: SRC_URL.ecPrices }, { name: 'international reference (World Bank)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sugar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'European Commission', url: SRC_URL.ecSugar }] },
      aceite: { label: "Oils", sources: [{ name: "European Commission", url: SRC_URL.ecOliveOil }, { name: "World Bank (international reference)", url: SRC_URL.worldBank }] },
      tropicales: { label: "Coffee, cocoa & more", sources: [{ name: "World Bank (international reference)", url: SRC_URL.worldBank }] },
      hortalizas: { label: 'Fruit and vegetables', sources: [{ name: 'European Commission', url: 'https://agridata.ec.europa.eu/' }, { name: 'MAPA', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' }] },
      energia: { label: 'Energy', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Weekly Oil Bulletin (EC)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Crop insurance', sources: [{ name: 'ENESA (MAPA)', url: SRC_URL.enesa }, { name: 'USDA RMA', url: SRC_URL.rma }] },
      vino: { label: 'Bulk wine', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }] },
      madera: { label: 'Timber', sources: [{ name: 'Forest Research (UK)', url: SRC_URL.forestResearchTimber }] }
    },
    fr: {
      cereales: { label: 'Céréales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Produits laitiers', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commission européenne', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Bétail', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commission européenne', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Porc', sources: [{ name: 'USDA NASS (porc)', url: SRC_URL.nass }, { name: 'Commission européenne (porcin)', url: SRC_URL.ecPigmeat }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovins', sources: [{ name: 'USDA AMS (agneau)', url: SRC_URL.usdaLamb }, { name: 'Commission européenne (ovins)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Volaille et œufs', sources: [{ name: 'USDA NASS (œufs)', url: SRC_URL.nass }, { name: 'USDA NASS (volaille)', url: SRC_URL.nass }, { name: 'Commission européenne (volaille)', url: SRC_URL.ecPoultry }, { name: 'Commission européenne (œufs)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Aliments', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indices régionaux UE', url: SRC_URL.ecPrices }, { name: 'Commission européenne (oléagineux)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Engrais', sources: [{ name: 'Commission européenne (Agri-food)', url: SRC_URL.ecPrices }, { name: 'référence internationale (Banque mondiale)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sucre', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Commission européenne', url: SRC_URL.ecSugar }] },
      aceite: { label: "Huiles", sources: [{ name: "Commission européenne", url: SRC_URL.ecOliveOil }, { name: "Banque mondiale (référence internationale)", url: SRC_URL.worldBank }] },
      tropicales: { label: "Café, cacao et autres", sources: [{ name: "Banque mondiale (référence internationale)", url: SRC_URL.worldBank }] },
      hortalizas: { label: 'Fruits et légumes', sources: [{ name: 'Commission européenne', url: 'https://agridata.ec.europa.eu/' }, { name: 'MAPA', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' }] },
      energia: { label: 'Énergie', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Bulletin pétrolier hebdomadaire (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Assurance agricole', sources: [{ name: 'ENESA (MAPA)', url: SRC_URL.enesa }, { name: 'USDA RMA', url: SRC_URL.rma }] },
      vino: { label: 'Vin en vrac', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }] },
      madera: { label: 'Bois', sources: [{ name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }] }
    },
    it: {
      cereales: { label: 'Cereali', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Lattiero-caseario', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commissione europea', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Bestiame', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commissione europea', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Suini', sources: [{ name: 'USDA NASS (suino)', url: SRC_URL.nass }, { name: 'Commissione europea (suino)', url: SRC_URL.ecPigmeat }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovini', sources: [{ name: 'USDA AMS (agnello)', url: SRC_URL.usdaLamb }, { name: 'Commissione europea (ovini)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Avicoltura', sources: [{ name: 'USDA NASS (uova)', url: SRC_URL.nass }, { name: 'USDA NASS (pollame)', url: SRC_URL.nass }, { name: 'Commissione europea (pollame)', url: SRC_URL.ecPoultry }, { name: 'Commissione europea (uova)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Mangimi', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indici regionali UE', url: SRC_URL.ecPrices }, { name: 'Commissione europea (semi oleosi)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizzanti', sources: [{ name: 'Commissione europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'riferimento internazionale (Banca Mondiale)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Zucchero', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Commissione europea', url: SRC_URL.ecSugar }] },
      aceite: { label: "Oli", sources: [{ name: "Commissione europea", url: SRC_URL.ecOliveOil }, { name: "Banca mondiale (riferimento internazionale)", url: SRC_URL.worldBank }] },
      tropicales: { label: "Caffè, cacao e altro", sources: [{ name: "Banca mondiale (riferimento internazionale)", url: SRC_URL.worldBank }] },
      hortalizas: { label: 'Frutta e verdura', sources: [{ name: 'Commissione europea', url: 'https://agridata.ec.europa.eu/' }, { name: 'MAPA', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' }] },
      energia: { label: 'Energia', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Bollettino Petrolifero Settimanale (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Assicurazione agricola', sources: [{ name: 'ENESA (MAPA)', url: SRC_URL.enesa }, { name: 'USDA RMA', url: SRC_URL.rma }] },
      vino: { label: 'Vino sfuso', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }] },
      madera: { label: 'Legname', sources: [{ name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }] }
    }
  };

  var FOOT = {
    es: {
      vaca: 'EE. UU. cotiza en pie; Europa y Reino Unido, en canal (deadweight) — misma unidad de peso, pero no la misma base de medición.',
      cabra: 'Mercado con menor liquidez y bases distintas (en pie vs. canal) — cotización de referencia. La UE no publica precio de caprino por país, así que el selector de país no se aplica a este producto.',
      pienso: 'El precio del pienso varía mucho por lonja local — este es un índice de referencia, no un precio único.',
      harina_soja: 'La cifra europea es la harina de soja en España (media nacional, salida de fábrica, Comisión Europea); la de EE. UU. es la de Iowa (FOB, 46,5-48 % de proteína, USDA AMS) en tonelada corta. No es exactamente el mismo producto ni el mismo punto de venta, así que la comparación es orientativa.',
      cerdo: 'Esta es la referencia de mercado del porcino blanco (comodity) — el cerdo ibérico de bellota de la dehesa cotiza muy por encima y no tiene un índice público propio.',
      cordero: 'EE. UU. cotiza en vivo y Europa en canal — misma unidad de peso, pero no la misma base de medición.',
      azucar: 'El precio de EE. UU. es estructuralmente más alto por su sistema de cuotas de importación, no por una anomalía puntual del mercado.',
      aceite: 'La oferta de EE. UU. (California) es mucho menor y no existe un índice público tan frecuente como en la UE — cifra orientativa. Los precios europeos han sido muy volátiles tras la sequía de 2023-2024. Alemania y Francia no tienen cotización nacional de aceite de oliva (no son países productores): al elegirlos se muestra la referencia europea.',
      diesel: 'El precio mostrado es el del diésel de carretera (on-highway), la referencia pública más completa y frecuente. El gasóleo agrícola, con un impuesto reducido, suele ser más barato; en la mayoría de países no se publica de forma sistemática por región. En España sí: el precio del gasóleo B por provincia está en Insumos, pestaña España.'
    },
    en: {
      vaca: 'The U.S. quotes live weight, while Europe and the U.K. quote carcass (deadweight) — same unit of weight, but not the same measurement basis.',
      cabra: 'A less liquid market with different bases (live weight vs. carcass) — a reference quote. The EU publishes no goat price by country, so the country selector does not apply to this product.',
      pienso: 'Feed prices vary widely by local market — this is a reference index, not a single price.',
      harina_soja: 'The European figure is Spanish soybean meal (national average, ex-factory, European Commission); the US one is Iowa (FOB, 46.5-48% protein, USDA AMS) per short ton. It is not exactly the same product or delivery point, so the comparison is indicative.',
      cerdo: 'This is the standard (commodity) pork market reference — dehesa-raised, acorn-fed Iberian pork trades well above it and has no public index of its own.',
      cordero: 'The U.S. quotes live weight while Europe quotes carcass weight — same unit of weight, but not the same measurement basis.',
      azucar: 'The U.S. price is structurally higher due to its import quota system, not a one-off market anomaly.',
      aceite: "U.S. supply (California) is much smaller and lacks a public index as frequent as the EU's — an indicative figure only. European prices have been highly volatile since the 2023–2024 drought. Germany and France have no national olive oil quotation (they are not producing countries): selecting them shows the European reference instead.",
      diesel: 'The price shown is on-highway (retail) diesel, the most complete and frequent public benchmark. Farm (dyed, lower-duty) diesel is typically cheaper; most countries do not publish it consistently by region. Spain does: farm diesel (gasóleo B) by province is under Inputs, Spain tab.'
    },
    fr: {
      vaca: "Les États-Unis cotent en poids vif ; l'Europe et le Royaume-Uni, en poids carcasse — même unité de poids, mais pas la même base de mesure.",
      cabra: "Marché moins liquide avec des bases différentes (poids vif vs. carcasse) — cotation de référence. L'UE ne publie pas de prix caprin par pays, le sélecteur de pays ne s'applique donc pas à ce produit.",
      pienso: "Le prix des aliments pour animaux varie fortement selon le marché local — il s'agit d'un indice de référence, pas d'un prix unique.",
      harina_soja: "Le chiffre européen est le tourteau de soja en Espagne (moyenne nationale, départ usine, Commission européenne) ; celui des États-Unis est celui de l'Iowa (FOB, 46,5-48 % de protéines, USDA AMS) en tonne courte. Ce n'est pas exactement le même produit ni le même point de vente : la comparaison est indicative.",
      cerdo: "Il s'agit de la référence de marché du porc blanc (matière première) — le porc ibérique élevé en dehesa et nourri au gland se négocie bien au-dessus et n'a pas d'indice public propre.",
      cordero: "Les États-Unis cotent en poids vif et l'Europe en poids carcasse — même unité de poids, mais pas la même base de mesure.",
      azucar: "Le prix américain est structurellement plus élevé en raison de son système de quotas d'importation, et non d'une anomalie ponctuelle du marché.",
      aceite: "L'offre américaine (Californie) est bien plus faible et il n'existe pas d'indice public aussi fréquent qu'en UE — chiffre indicatif. Les prix européens ont été très volatils depuis la sécheresse de 2023-2024. L'Allemagne et la France n'ont pas de cotation nationale pour l'huile d'olive (ce ne sont pas des pays producteurs) : en les sélectionnant, c'est la référence européenne qui s'affiche.",
      diesel: "Le prix indiqué est celui du gazole routier (à la pompe), la référence publique la plus complète et la plus fréquente. Le gazole agricole, à fiscalité réduite, est généralement moins cher ; la plupart des pays ne le publient pas systématiquement par région. L'Espagne, si : le gasóleo B par province se trouve dans Intrants, onglet Espagne."
    },
    it: {
      vaca: 'Gli Stati Uniti quotano a peso vivo, mentre l\'Europa e il Regno Unito quotano a peso morto — stessa unità di peso, ma non la stessa base di misurazione.',
      cabra: 'Mercato con minore liquidità e basi diverse (peso vivo vs. peso morto) — quotazione di riferimento. L\'UE non pubblica un prezzo caprino per paese, quindi il selettore di paese non si applica a questo prodotto.',
      pienso: 'Il prezzo del mangime varia molto per mercato locale — questo è un indice di riferimento, non un prezzo unico.',
      harina_soja: 'La cifra europea è la farina di soia in Spagna (media nazionale, franco fabbrica, Commissione europea); quella degli Stati Uniti è quella dell\'Iowa (FOB, 46,5-48 % di proteine, USDA AMS) per tonnellata corta. Non è esattamente lo stesso prodotto né lo stesso punto di vendita: il confronto è indicativo.',
      cerdo: 'Questo è il riferimento di mercato del suino bianco (commodity) — il maiale iberico allevato allo stato brado e nutrito con ghiande quota molto al di sopra e non ha un indice pubblico proprio.',
      cordero: 'Gli Stati Uniti quotano a peso vivo mentre l\'Europa quota a peso morto — stessa unità di peso, ma non la stessa base di misurazione.',
      azucar: 'Il prezzo statunitense è strutturalmente più alto a causa del suo sistema di quote di importazione, non per un\'anomalia puntuale del mercato.',
      aceite: 'L\'offerta statunitense (California) è molto minore e non esiste un indice pubblico frequente come nell\'UE — cifra indicativa. I prezzi europei sono stati molto volatili dopo la siccità del 2023-2024. Germania e Francia non hanno una quotazione nazionale dell\'olio d\'oliva (non sono paesi produttori): selezionandole viene mostrato il riferimento europeo.',
      diesel: 'Il prezzo mostrato è quello del gasolio stradale (alla pompa), il riferimento pubblico più completo e frequente. Il gasolio agricolo, ad accisa ridotta, è generalmente più economico; la maggior parte dei paesi non lo pubblica in modo sistematico per regione. La Spagna sì: il gasóleo B per provincia è in Input, scheda Spagna.'
    }
  };

  // --- Vino a granel y Madera: bloques informativos propios (el seguro agrario sale de data/crop-insurance.json, ver js/seguro.js)
  // con estadísticas oficiales reales (no precios de mercado diarios/
  // semanales que convertir de moneda/unidad), verbatim del artefacto
  // original -- ver isInsurance/isWine/isWood en precios.js. ------------

  var WOOD = {
    es: {
      badge: 'DATO OFICIAL REAL',
      ukTitle: 'Reino Unido — Forest Research (dato trimestral, marzo 2026)',
      ukStats: [
        { label: 'Índice de venta en pie, coníferas', value: '35,17 £/m³' },
        { label: 'Variación interanual', value: '+12,9%' },
        { label: 'Qué mide', value: 'Madera en pie sin talar, no aserrada' }
      ],
      scopeNote: "La madera no tiene un mercado internacional centralizado como el trigo o el maíz, así que no hay una referencia global. Se muestra el índice trimestral de venta en pie de coníferas de Forest Research (Reino Unido; madera sin aserrar, todavía en el bosque), publicado con licencia abierta, y debajo el índice oficial de precios de la madera de Alemania (Destatis). Faltan otros mercados por licencia o por falta de fuente: el futuro de madera del CME Group (EE. UU.) no permite redistribuir la cotización; la media de venta en pie de France Bois Forêt/ONF (Francia) no tiene licencia de reutilización confirmada; España solo tiene datos regionales desactualizados (Castilla y León, 2020); e Italia no tiene una fuente nacional citable."
    },
    en: {
      badge: 'REAL OFFICIAL DATA',
      ukTitle: 'United Kingdom — Forest Research (quarterly data, March 2026)',
      ukStats: [
        { label: 'Coniferous standing sales price index', value: '£35.17/m³' },
        { label: 'Year-over-year change', value: '+12.9%' },
        { label: 'What it measures', value: 'Standing (unfelled) timber, not sawn' }
      ],
      scopeNote: "Timber has no centralized international market the way wheat or corn does, so there is no global benchmark. Shown here is Forest Research's quarterly coniferous standing-sales price index (United Kingdom; unfelled timber, still in the forest), published under an open licence, and below it Germany's official timber price index (Destatis). Other markets are missing because of licensing or lack of a source: CME Group's lumber futures (US) do not allow the quote to be redistributed; France Bois Forêt/ONF's standing-sale average (France) has no confirmed reuse licence; Spain only has outdated regional data (Castile and León, 2020); and Italy has no citable national source."
    },
    fr: {
      badge: 'DONNÉE OFFICIELLE RÉELLE',
      ukTitle: 'Royaume-Uni — Forest Research (donnée trimestrielle, mars 2026)',
      ukStats: [
        { label: 'Indice de prix de vente sur pied, résineux', value: '35,17 £/m³' },
        { label: 'Variation sur un an', value: '+12,9 %' },
        { label: 'Ce que ça mesure', value: 'Bois sur pied, non abattu, non scié' }
      ],
      scopeNote: "Le bois n'a pas de marché international centralisé comme le blé ou le maïs : il n'existe donc pas de référence mondiale. On présente l'indice trimestriel de prix de vente sur pied des résineux de Forest Research (Royaume-Uni ; bois non abattu, encore en forêt), publié sous licence ouverte, et en dessous l'indice officiel des prix du bois en Allemagne (Destatis). D'autres marchés manquent pour des raisons de licence ou faute de source : le contrat à terme sur le bois du CME Group (États-Unis) n'autorise pas la redistribution de la cotation ; la moyenne des ventes sur pied de France Bois Forêt/ONF (France) n'a pas de licence de réutilisation confirmée ; l'Espagne n'a que des données régionales anciennes (Castille-et-León, 2020) ; et l'Italie n'a pas de source nationale citable."
    },
    it: {
      badge: 'DATO UFFICIALE REALE',
      ukTitle: 'Regno Unito — Forest Research (dato trimestrale, marzo 2026)',
      ukStats: [
        { label: 'Indice prezzo vendita in piedi, conifere', value: '35,17 £/m³' },
        { label: 'Variazione annua', value: '+12,9%' },
        { label: 'Cosa misura', value: 'Legname in piedi, non abbattuto né segato' }
      ],
      scopeNote: "Il legname non ha un mercato internazionale centralizzato come il grano o il mais, quindi non esiste un riferimento globale. Si mostra l'indice trimestrale del prezzo di vendita in piedi delle conifere di Forest Research (Regno Unito; legname non abbattuto, ancora nel bosco), pubblicato con licenza aperta, e sotto l'indice ufficiale dei prezzi del legno della Germania (Destatis). Mancano altri mercati per motivi di licenza o per assenza di fonte: il future sul legname del CME Group (USA) non consente di ridistribuire la quotazione; la media delle vendite in piedi di France Bois Forêt/ONF (Francia) non ha una licenza di riutilizzo confermata; la Spagna ha solo dati regionali datati (Castiglia e León, 2020); e l'Italia non ha una fonte nazionale citabile."
    }
  };

  // --- Base de datos de productos (RAW), verbatim del artefacto original ---
  var RAW = [
    {
      id: 'cereales', nameKey: 'cereales',
      products: [
        { nameKey: 'maiz', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 4.45, changePct: 4.46, history: [4.12, 4.27, 4.31, 4.48, 4.28, 4.26, 4.45], currency: 'USD', kgPerUnit: 25.401 },
          eu: { price: 259, changePct: 0, history: [254, 244, 244, 248, 250, 263, 260, 259, 260, 259, 259, 259], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (maíz pienso, mercado de Zaragoza, salida de silo)' } } },
        { nameKey: 'trigo', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 27.2155, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 6.23, changePct: 2.81, history: [5.15, 5.52, 5.7, 5.88, 5.7, 6.06, 6.23], currency: 'USD', kgPerUnit: 27.2155 },
          eu: { price: 274.11, changePct: 0.8499, history: [258.67, 246, 245.6, 247.2, 254.89, 258, 262.3, 262.7, 264.1, 266, 271.8, 274.11], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 215.00, changePct: -0.3, history: [217.80, 217.20, 216.60, 216.10, 215.90, 215.65, 215.00], currency: 'GBP', kgPerUnit: 1000 },
          countryFactors: { es: 1, fr: 0.911, de: 0.905, it: 0.952 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (trigo panificable, mercado de Zaragoza, salida de silo)' }, uk: { type: 'futuro', market: 'AHDB (trigo pienso, entrega nov. 2026)' } } },
        // Trigo duro: referencia de España (Sevilla); Italia y otros países publican sus propios mercados. Las cifras de muestra las sustituye el script con datos reales
        { nameKey: 'trigo_duro', imperialUnitKey: 'bushel', imperialKgPerUnit: 27.2155, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          eu: { price: 283, changePct: 1.7986, history: [262, 260, 260, 260, 260, 260, 260, 268, 270, 270, 278, 283], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { eu: { type: 'referencia', market: 'Comisión Europea (trigo duro, mercado de Sevilla, salida de silo)' } } },
        { nameKey: 'arroz', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 12.8, changePct: 8.47, history: [12.3, 11.7, 11.3, 11.4, 11.8, 11.8, 12.8], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 327.53, changePct: -2.0456, history: [451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 334.37, 334.37, 334.37, 327.53], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (arroz cáscara japónica, España)' } } },
        // Cebada y avena: EE. UU. (USDA NASS, precio recibido) y Europa (Comisión Europea). Las cifras de muestra las sustituyen los scripts con datos reales
        { nameKey: 'cebada', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 21.7724, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 5.55, changePct: 0.73, history: [5.47, 5.5, 5.58, 5.35, 5.47, 5.51, 5.55], currency: 'USD', kgPerUnit: 21.7724 },
          eu: { price: 246, changePct: 1.2346, history: [225, 225, 222, 225, 228, 228, 233, 235, 235, 238, 243, 246], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (cebada pienso, mercado de Lleida, salida de silo)' } } },
        { nameKey: 'avena', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 14.515, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 3.02, changePct: -2.58, history: [3.08, 3.18, 3.17, 3.21, 3.25, 3.1, 3.02], currency: 'USD', kgPerUnit: 14.515 },
          eu: { price: 124.71, changePct: -0.6453, history: [124.7, 115.13, 123.2, 126.06, 122.44, 129.94, 127.87, 127.98, 130.92, 125.52, 124.71], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (avena pienso, agregado UE)' } } },
        // Colza: EE. UU. (USDA NASS, canola) y Europa; centeno: solo Europa (NASS dejó de publicarlo en 1976) (Comisión Europea)
        { nameKey: 'colza', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 25.7, changePct: -3.38, history: [20.9, 22.5, 22.6, 27.5, 27.7, 26.6, 25.7], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 476.14, changePct: -0.1949, history: [443.13, 442.19, 443.48, 443.14, 443.98, 437.35, 476.03, 476.36, 475.27, 479.51, 477.07, 476.14], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (canola)' }, eu: { type: 'referencia', market: 'Comisión Europea (colza, España, media nacional)' } } },
        { nameKey: 'centeno', imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          eu: { price: 161.12, changePct: 0.6811, history: [149.53, 145.82, 145.12, 152.79, 161.63, 153.58, 160.53, 153.9, 152.65, 154.02, 160.03, 161.12], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { eu: { type: 'referencia', market: 'Comisión Europea (centeno panificable, agregado UE)' } } },
        { nameKey: 'soja_grano', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 27.2155, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 12.1, changePct: 4.31, history: [10.6, 11.1, 11.2, 11.6, 11.3, 11.6, 12.1], currency: 'USD', kgPerUnit: 27.2155 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido por el agricultor)' }, ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'lenteja', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 16.1, changePct: -7.47, history: [18.2, 21.8, 16.4, 17, 18.5, 17.4, 16.1], currency: 'USD', kgPerUnit: 45.359 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido por el agricultor)' }, ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'guisante_seco', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 9.32, changePct: -16.04, history: [11.2, 11, 10.7, 11.2, 10.6, 11.1, 9.32], currency: 'USD', kgPerUnit: 45.359 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido por el agricultor)' }, ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'lino', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 11.2, changePct: -4.27, history: [12, 11.9, 11.6, 12.6, 11.9, 11.7, 11.2], currency: 'USD', kgPerUnit: 25.401 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido por el agricultor)' }, ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        // Sorgo: solo hay dato en EE. UU. (USDA NASS). El portal de la Comisión Europea no publica precio de sorgo, así que no hay región `eu`
        { nameKey: 'sorgo', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 7.7, changePct: -3.99, history: [6.46, 6.94, 6.73, 7.5, 7.95, 8.02, 7.7], currency: 'USD', kgPerUnit: 45.359 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' } } },
        { nameKey: 'canola_elevador', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'trigo_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'cebada_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'avena_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'trigo_cwrs_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'lenteja_laird_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'guisante_verde_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'lacteos', nameKey: 'lacteos',
      products: [
        { nameKey: 'leche', caUnitKey: '100kg', caKgPerUnit: 100, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 19.8, changePct: -2.46, history: [18.3, 19.7, 20.8, 21.3, 21.1, 20.3, 19.8], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 45.53, changePct: 0, history: [51.94, 52.62, 52.62, 52.52, 52.23, 51.84, 47.48, 46.31, 45.53, 45.05, 45.53, 45.53], currency: 'EUR', kgPerUnit: 100 },
          countryFactors: { es: 1, de: 0.904, fr: 0.975, it: 1.016 },
          uk: { price: 35.82, changePct: 4.02, history: [34.20, 34.50, 34.80, 35.10, 35.35, 35.60, 35.82], currency: 'GBP', kgPerUnit: 100 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 100 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, leche total)' }, eu: { type: 'referencia', market: 'Comisión Europea (leche cruda de vaca, España)' }, uk: { type: 'referencia', market: 'Defra (precio medio en granja del Reino Unido)' } } },
        // Mantequilla y leche desnatada en polvo: solo dato de Europa (agregado UE de la Comisión). Las cifras de muestra las sustituye el script con datos reales
        { nameKey: 'mantequilla', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: '100kg', metricKgPerUnit: 100,
          eu: { price: 400.61, changePct: -3.3394, history: [409.9, 394.24, 397.79, 403.61, 413.82, 410.77, 420.06, 416.42, 425.4, 412.54, 414.45, 400.61], currency: 'EUR', kgPerUnit: 100 },
          quoteTypes: { eu: { type: 'referencia', market: 'Comisión Europea (mantequilla, agregado UE)' } } },
        { nameKey: 'leche_polvo', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 2.165, changePct: -0.92, history: [1.53, 1.575, 1.75, 1.76, 1.84, 1.87, 1.905, 2.03, 2.12, 2.17, 2.185, 2.165], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 336.89, changePct: 3.7415, history: [280.68, 280.74, 289, 291.39, 301.62, 306.09, 308.19, 308.73, 311.02, 321.06, 324.74, 336.89], currency: 'EUR', kgPerUnit: 100 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (leche desnatada en polvo, Este y Centro, calor bajo/medio, punto medio del rango)' }, eu: { type: 'referencia', market: 'Comisión Europea (leche desnatada en polvo, agregado UE)' } } }
      ]
    },
    {
      id: 'ganado', nameKey: 'ganado',
      products: [
        { nameKey: 'vaca', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 234, changePct: -6.02, history: [243, 240, 245, 256, 258, 249, 234], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 610.4, changePct: 0.7377, history: [592.41, 616.07, 611.57, 612.58, 612.58, 605.95, 610.21, 614.67, 611.29, 605.72, 605.93, 610.4], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'vaca',
          countryFactors: { es: 1, de: 1.113, fr: 1.022, it: 1.125 },
          uk: { price: 620.00, changePct: 0.4, history: [610, 612, 614, 616, 618, 619, 620], currency: 'GBP', kgPerUnit: 100 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, novillos y novillas, peso vivo)' }, eu: { type: 'referencia', market: 'Comisión Europea (vacuno, España, machos jóvenes A-R3)' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, todas las categorías prime)' } } },
        { nameKey: 'cabra', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 2.15, changePct: 0.5, history: [2.05, 2.08, 2.10, 2.09, 2.12, 2.14, 2.15], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 6.85, changePct: 0.4, history: [6.60, 6.65, 6.70, 6.75, 6.78, 6.82, 6.85], currency: 'EUR', kgPerUnit: 1 },
          footnoteKey: 'cabra' },
        { nameKey: 'novillo_ab', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'cwt', metricKgPerUnit: 45.359,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'porcino', nameKey: 'porcino',
      products: [
        { nameKey: 'cerdo', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 70.5, changePct: -0.7, history: [65.9, 68.7, 67.8, 68.5, 69.4, 71, 70.5], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 168.22, changePct: -1.262, history: [168.63, 166.33, 169.1, 172.57, 175.96, 178.08, 177.64, 178.56, 175.56, 172.68, 170.37, 168.22], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 180.84, changePct: 0.2, history: [179.20, 179.50, 179.80, 180.10, 180.30, 180.40, 180.84], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cerdo',
          countryFactors: { es: 1, de: 0.911, fr: 1.193, it: 1.353 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, cerdos vivos)' }, eu: { type: 'referencia', market: 'Comisión Europea (porcino, España, clase S)' }, uk: { type: 'referencia', market: 'AHDB (SPP, especificación UE, GB)' } } },
        { nameKey: 'cerdo_ab', caUnitKey: 'kg', caKgPerUnit: 1, imperialUnitKey: 'kg', imperialKgPerUnit: 1, metricUnitKey: 'kg', metricKgPerUnit: 1,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'ovino', nameKey: 'ovino',
      products: [
        { nameKey: 'cordero', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 189, changePct: 0, history: [169, 181, 181, 189, 194, 189, 189], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 1097.9, changePct: 3.4194, history: [933, 951.2, 956.8, 970.5, 1007.3, 1008, 1003.1, 1011.8, 1031.8, 1052.5, 1061.6, 1097.9], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 724.00, changePct: 1.5, history: [705, 710, 714, 717, 719, 721, 724], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cordero',
          countryFactors: { es: 1, de: 0.824, fr: 0.84, it: 0.753 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido, corderos, peso vivo)' }, ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, eu: { type: 'referencia', market: 'Comisión Europea (ovino, España, cordero pesado)' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, cordero NSL)' } } }
      ]
    },
    {
      id: 'avicultura', nameKey: 'avicultura',
      products: [
        // huevos: docena EE. UU. = 0,6804 kg (huevo grande, mínimo USDA de 24 oz/docena) para comparar con la UE en €/100 kg; es una aproximación por tamaño, no un peso medio real
        { nameKey: 'huevos', caUnitKey: 'docena', caKgPerUnit: 0.6804, imperialUnitKey: 'docena', imperialKgPerUnit: 0.6804, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 0.77, changePct: -1.79, history: [0.98, 1.26, 0.56, 0.56, 0.53, 0.78, 0.77], currency: 'USD', kgPerUnit: 0.6804 },
          eu: { price: 252.28, changePct: 1.0535, history: [205.91, 205.91, 205.91, 207.22, 209.55, 230.04, 239.12, 242.27, 245.69, 248.31, 249.65, 252.28], currency: 'EUR', kgPerUnit: 100 },
          countryFactors: { es: 1, de: 0.896, fr: 1.034, it: 1.2 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 0.6804 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, huevos de mesa)' }, eu: { type: 'referencia', market: 'Comisión Europea (huevos, España, gallinas en jaula)' } } },
        { nameKey: 'pollo', caUnitKey: 'kg', caKgPerUnit: 1, imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 0.65, changePct: -1.36, history: [0.66, 0.67, 0.68, 0.71, 0.7, 0.66, 0.65], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 2.3503, changePct: 0.5003, history: [2.2321, 2.2263, 2.239, 2.2644, 2.2764, 2.3051, 2.3499, 2.3507, 2.3364, 2.3531, 2.3386, 2.3503], currency: 'EUR', kgPerUnit: 1 },
          countryFactors: { es: 1, de: 1.957, fr: 1.574, it: 1.608 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, broilers, peso vivo)' }, eu: { type: 'referencia', market: 'Comisión Europea (pollo, España, broiler entero 65 %)' } } }
      ]
    },
    {
      id: 'pienso', nameKey: 'pienso',
      products: [
        { nameKey: 'pienso', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 318, changePct: 0.3, history: [310, 312, 315, 313, 316, 317, 318], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 312, changePct: 0.3, history: [305, 307, 309, 308, 310, 311, 312], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'pienso',
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido, broilers, peso vivo)' }, eu: { type: 'indice', market: 'Comisión Europea (índices regionales)' } } },
        { nameKey: 'harina_soja', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 362.8, changePct: -5.37, history: [317.9, 313.7, 324, 344, 351.96, 351.8, 379.08, 384.14, 364.06, 361.13, 383.37, 362.8], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 439.21, changePct: 0.9516, history: [382.56, 374.51, 358.63, 375.86, 394.93, 399.88, 401.44, 409.67, 424.84, 422.46, 435.07, 439.21], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'harina_soja',
          uk: { price: 355.00, changePct: 5.65, history: [340, 343, 346, 349, 351, 353, 355], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (harina de soja, Iowa, FOB, 46,5-48 % de proteína)' }, eu: { type: 'referencia', market: 'Comisión Europea (harina de soja, España, media nacional)' }, uk: { type: 'indice', market: 'Farmers Weekly (mercado del Reino Unido)' } } }
      ]
    },
    {
      id: 'fertilizantes', nameKey: 'fertilizantes',
      products: [
        { nameKey: 'urea', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 489, changePct: 0.6, history: [470, 475, 480, 478, 482, 486, 489], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 407.5, changePct: 4.4872, history: [394.4,409.3,392.5,415.4,472.0,725.6,856.9,770.5,453.1,400.0,390.0,407.5], currency: 'USD', kgPerUnit: 1000},
          uk: { price: 476.00, changePct: 0.5, history: [465, 468, 470, 472, 474, 475, 476], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'Sin fuente verificada' }, eu: { type: 'referencia', market: 'Banco Mundial' }, uk: { type: 'indice', market: 'AHDB (urea granulada 46% N, cotización media GB)' } } },
        { nameKey: 'dap', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 735, changePct: 0.7, history: [710, 715, 720, 722, 725, 730, 735], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 742, changePct: 0.406, history: [611, 606, 607, 604, 606, 663, 700, 717, 729, 736, 739, 742], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 794.00, changePct: 0.4, history: [780, 783, 786, 789, 791, 792, 794], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'Sin fuente verificada' }, eu: { type: 'indice', market: 'Comisión Europea (fósforo, precio agregado por nutriente)' }, uk: { type: 'indice', market: 'AHDB (DAP, cotización media GB)' } } },
        { nameKey: 'potasa', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 480, changePct: 0.4, history: [460, 465, 470, 472, 475, 478, 480], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 363, changePct: -0.2747, history: [366, 363, 360, 360, 357, 359, 368, 370, 368, 366, 364, 363], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 367.00, changePct: 0.3, history: [358, 360, 362, 363, 364, 366, 367], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'Sin fuente verificada' }, eu: { type: 'indice', market: 'Comisión Europea (potasio, precio agregado por nutriente)' }, uk: { type: 'indice', market: 'AHDB (MOP/potasa, cotización media GB)' } } }
      ]
    },
    {
      id: 'azucar', nameKey: 'azucar',
      products: [
        { nameKey: 'azucar', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 0.51, changePct: 6.81, history: [0.42, 0.42, 0.42, 0.4425, 0.45, 0.4775, 0.51], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 501.4009, changePct: -0.687, history: [537.8029, 535.8926, 528.9824, 531.6697, 525.4319, 518.3146, 516.2968, 512.9793, 510.1677, 502.1113, 504.8693, 501.4009], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'azucar',
          quoteTypes: { us: { type: 'referencia', market: 'USDA ERS (azúcar refinado de remolacha, Medio Oeste, a granel)' }, eu: { type: 'referencia', market: 'Comisión Europea (azúcar blanco, media UE)' } } }
      ]
    },
    {
      id: 'aceite', nameKey: 'aceite',
      products: [
        { nameKey: 'oliva', imperialUnitKey: 'gal', imperialKgPerUnit: 3.41, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 27.50, changePct: 0.4, history: [26.20, 26.60, 26.90, 27.10, 27.25, 27.40, 27.50], currency: 'USD', kgPerUnit: 3.41 },
          eu: { price: 326.35, changePct: -1.6603, history: [357.58, 355.84, 351.69, 349.77, 345.9, 348.74, 347.03, 346.89, 344.84, 343.19, 331.86, 326.35], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'aceite',
          countryFactors: { es: 1, it: 1.455 } }
      ]
    },
    {
      id: 'energia', nameKey: 'energia',
      // Las cifras de abajo son solo marcador de posición: la ficha permanece oculta hasta que
      // data/latest.json aporta una observación verificada (EIA / Banco Mundial). kgPerUnit=1:
      // MMBtu y barril no son unidades de masa, así que no se aplica conversión de unidad.
      products: [
        { nameKey: 'gas_natural', imperialUnitKey: 'mmbtu', imperialKgPerUnit: 1, metricUnitKey: 'mwh', metricKgPerUnit: 3.412142,   // en Europa el gas se cotiza en €/MWh: 1 MWh = 3,412142 MMBtu
          us: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          eu: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { us: { type: 'referencia', market: 'EIA · Henry Hub (EE. UU., precio al contado, diario)' }, eu: { type: 'referencia', market: 'Banco Mundial · TTF (Europa, media mensual con ~1 mes de retraso; el Banco Mundial lo publica en USD/MMBtu y aquí se pasa a €/MWh, la unidad original del TTF, con el cambio medio del BCE de cada mes; desde abril de 2015)' } } },
        { nameKey: 'petroleo_wti', imperialUnitKey: 'barril', imperialKgPerUnit: 1, metricUnitKey: 'barril', metricKgPerUnit: 1,
          us: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { us: { type: 'referencia', market: 'EIA (WTI Cushing, spot)' } } },
        { nameKey: 'petroleo_brent', imperialUnitKey: 'barril', imperialKgPerUnit: 1, metricUnitKey: 'barril', metricKgPerUnit: 1,
          eu: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { eu: { type: 'referencia', market: 'EIA (Brent Europa, spot FOB)' } } }
      ]
    }
  ];

  // --- Gasóleo agrícola / diésel (Energía) ---------------------------------
  var LITRO_KG = 0.835;
  var GAL_KG = LITRO_KG * 3.78541;
  var DIESEL_US_NATIONAL = { price: 6.276, changePct: 1.5698, history: [5.967, 6.285, 6.529, 6.382, 6.199, 6.179, 6.276], currency: 'USD', kgPerUnit: GAL_KG };
  var DIESEL_EU_NATIONAL = { price: 2.138675613493391, changePct: 0.1383, history: [2.1588395999247614, 2.2264435149088713, 2.236559817346141, 2.148526960199634, 2.1357209073916077, 2.138675613493391], currency: 'EUR', kgPerUnit: LITRO_KG };
  var DIESEL_UK_NATIONAL = { price: 1.9918, changePct: 0.4, history: [1.9300, 1.9450, 1.9580, 1.9690, 1.9760, 1.9840, 1.9918], currency: 'GBP', kgPerUnit: LITRO_KG };
  var DIESEL_US_REGIONS = [
    { key: 'usMidwest', price: 6.680, changePct: 0.9, history: [6.55, 6.58, 6.61, 6.60, 6.64, 6.67, 6.680], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usSur', price: 6.177, changePct: 0.8, history: [6.05, 6.08, 6.10, 6.09, 6.13, 6.16, 6.177], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usOeste', price: 7.456, changePct: 1.0, history: [7.30, 7.34, 7.38, 7.36, 7.40, 7.44, 7.456], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usEste', price: 6.268, changePct: 0.7, history: [6.15, 6.17, 6.20, 6.19, 6.22, 6.25, 6.268], currency: 'USD', kgPerUnit: GAL_KG }
  ];
  // Sin cifras fijas: price/history se rellenan en precios.js desde data/diesel-eu-countries.json (Boletin Semanal del Petroleo, CE). Sin ese fichero no se muestra valor.
  var DIESEL_EU_COUNTRIES = [
    { key: 'euAlemania', code: 'DE', price: null, changePct: null, history: [], currency: 'EUR', kgPerUnit: LITRO_KG, observed: false },
    { key: 'euFrancia', code: 'FR', price: null, changePct: null, history: [], currency: 'EUR', kgPerUnit: LITRO_KG, observed: false },
    { key: 'euEspana', code: 'ES', price: null, changePct: null, history: [], currency: 'EUR', kgPerUnit: LITRO_KG, observed: false },
    { key: 'euItalia', code: 'IT', price: null, changePct: null, history: [], currency: 'EUR', kgPerUnit: LITRO_KG, observed: false }
  ];
  var DIESEL_COUNTRY_TO_KEY = { de: 'euAlemania', fr: 'euFrancia', es: 'euEspana', it: 'euItalia' };
  var DIESEL_QUOTE_TYPES = { us: { type: 'indice', market: 'EIA' }, eu: { type: 'indice', market: 'Boletín Semanal del Petróleo (CE)' }, uk: { type: 'indice', market: 'RAC Fuel Watch' } };

  // --- Funciones puras de formato / conversión (mismo comportamiento que el
  // artefacto original, sin `this`) -----------------------------------------
  function spark(history, w, h, pad) {
    w = w || 120; h = h || 36; pad = (pad == null) ? 4 : pad;
    var min = Math.min.apply(null, history);
    var max = Math.max.apply(null, history);
    var range = (max - min) || 1;
    var step = (w - pad * 2) / (history.length - 1);
    return history.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }
  function sparkShared(history, min, max, w, h, pad) {
    w = w || 120; h = h || 36; pad = (pad == null) ? 4 : pad;
    var range = (max - min) || 1;
    var step = (w - pad * 2) / (history.length - 1);
    return history.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }
  function trendColor(history, T) {
    var first = history[0];
    var last = history[history.length - 1];
    if (last > first) return T.positive;
    if (last < first) return T.negative;
    return T.neutral;
  }
  function fmtChange(pct) {
    var sign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
    // Formato local (auditoria 8-oct-2026): coma decimal y espacio antes de % en es/fr/it; punto en ingles
    var lg = (typeof window !== 'undefined' && window.DehesaShared && window.DehesaShared.getLang) ? window.DehesaShared.getLang() : 'es';
    var val = Math.abs(pct).toFixed(1);
    return lg === 'en' ? sign + val + '%' : sign + val.replace('.', ',') + '\u00a0%';
  }
  function changeColor(pct, T) {
    if (pct > 0) return T.positive;
    if (pct < 0) return T.negative;
    return T.neutral;
  }
  function curLang() { return (typeof window !== 'undefined' && window.DehesaShared && window.DehesaShared.getLang) ? window.DehesaShared.getLang() : 'es'; }
  // Cifras en formato local (auditoria 8-oct-2026): 264,1 en es/fr/it, 264.1 en ingles
  function fmtNumber(v) {
    var decimals = Math.abs(v) >= 100 ? 1 : (Math.abs(v) >= 1 ? 2 : 3);   // «4,450 $/bushel» se leía como miles: 2 decimales desde 1
    try { return v.toLocaleString(curLang(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); } catch (e) { return v.toFixed(decimals); }
  }
  function fmtTotal(v) {
    try { return v.toLocaleString(curLang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (e) { /* formato fijo de respaldo */ }
    var fixed = Math.abs(v).toFixed(2);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (v < 0 ? '-' : '') + parts.join('.');
  }
  // Cambio del MES del dato: dolares por 1 unidad de ccy en la media mensual del BCE (FXM). Sin fecha, o con un mes
  // aun sin media publicada (el actual), se usa el cambio de hoy. Antes de 1999 no hay serie: devuelve null y el punto no se convierte (no se inventa un cambio).
  function fxAt(ccy, ts) {
    if (ccy === 'USD') return 1;
    var a = FXM[ccy];
    if (!a || !isFinite(ts) || ts === null || ts === undefined) return FX[ccy];
    var d = new Date(ts), i = (d.getUTCFullYear() - 1999) * 12 + d.getUTCMonth();
    if (i >= a.length) return FX[ccy];
    return i < 0 ? null : a[i];
  }
  function ccyRatio(from, to, fx, ts) {
    if (from === to) return 1;
    if (fx === FX) { var a = fxAt(from, ts), c = fxAt(to, ts); return a === null || c === null ? null : a / c; }   // cambio del mes del dato (null: sin serie)
    return fx[from] / fx[to];                              // cambio indicado por quien llama (tests)
  }
  function regionTs(region) { var p = region && region.histPts; return p && p.length ? p[p.length - 1].ts : null; }
  function computeFactor(region, targetCcy, targetKgPerUnit, fx, ts) {
    return (targetKgPerUnit / region.kgPerUnit) * ccyRatio(region.currency, targetCcy, fx, ts);
  }
  function buildRegion(region, labelText, targetCcy, targetKgPerUnit, targetUnitLabel, fx, T) {
    var factor = computeFactor(region, targetCcy, targetKgPerUnit, fx, regionTs(region));
    var convertedPrice = region.price * factor;
    var convertedHistory = region.history.map(function (v) { return v * factor; });
    var symbol = CCY_SYMBOL[targetCcy] || targetCcy;
    return {
      label: labelText,
      price: symbol + fmtNumber(convertedPrice),
      priceValue: convertedPrice,
      unit: '/' + targetUnitLabel,
      changeLabel: fmtChange(region.changePct),
      changeColor: changeColor(region.changePct, T),
      sparkPath: spark(convertedHistory),
      sparkColor: trendColor(convertedHistory, T)
    };
  }
  function deriveCountryRaw(rawEu, factor) {
    if (!factor || factor === 1) return rawEu;
    return {
      price: rawEu.price * factor,
      changePct: rawEu.changePct,
      history: rawEu.history.map(function (v) { return v * factor; }),
      histPts: rawEu.histPts ? rawEu.histPts.map(function (q) { return { ts: q.ts, value: q.value * factor }; }) : null,
      histGran: rawEu.histGran,
      currency: rawEu.currency,
      kgPerUnit: rawEu.kgPerUnit
    };
  }

  // --- Histórico ampliado: solo datos reales -------------------------------
  // Cada región con observación verificada guarda region.histPts = [{ ts, value }]
  // (fecha UTC en milisegundos y valor en la moneda y unidad de origen) y
  // region.histGran ('day' o 'month'). No se genera, interpola ni rellena nada:
  // sin histPts no hay histórico y la interfaz lo dice.
  function realHistory(region, targetCcy, targetKgPerUnit, fx) {
    if (!region || !region.histPts || region.histPts.length < 2) return null;
    var kg = targetKgPerUnit / region.kgPerUnit;
    var pts = [];
    region.histPts.forEach(function (p) { var r = ccyRatio(region.currency, targetCcy, fx, p.ts); if (r !== null) pts.push({ ts: p.ts, y: p.value * kg * r }); });   // sin cambio del mes (antes de 1999): el punto se omite
    if (pts.length < 2) return null;
    return { gran: region.histGran || 'day', pts: pts };
  }
  function isoDate(ts, gran) { var s = new Date(ts).toISOString(); return gran === 'month' ? s.slice(0, 7) : s.slice(0, 10); }
  function exportRealCsv(csvHeaderDate, csvHeaderPrice, productKey, regionCode, pts, gran, targetCcy, targetUnitLabel) {
    try {
      if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !pts || !pts.length) return;
      var lines = [csvHeaderDate + ',' + csvHeaderPrice + ' (' + targetCcy + '/' + targetUnitLabel + ')'];
      pts.forEach(function (p) { lines.push(isoDate(p.ts, gran) + ',' + p.y.toFixed(4)); });
      var blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'dehesa-index-' + productKey + '-' + regionCode + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
    } catch (e) {}
  }
  var HISTORY_COMPARE_PRESETS = [
    ['cereales-trigo', 'cereales-maiz'],
    ['lacteos-leche', 'pienso-pienso'],
    ['cereales-trigo', 'fertilizantes-urea']
  ];


  // --- Data Trust v2: esquema normalizado de observaciones -----------------
  // RAW sigue siendo la fuente de compatibilidad con la UI existente. Este
  // registro convierte cada cotización piloto en una observación trazable:
  // identidad + valor + unidad + mercado + fuente + frecuencia + fechas +
  // metodología + comparabilidad + estado de verificación.
  var DATA_TRUST_SCHEMA_VERSION = '2.0';

  var DATA_TRUST_SOURCES = {
    usda_nass: { name: 'USDA NASS', url: SRC_URL.nass, authority: 'official' },
    usda_ams_dairy: { name: 'USDA AMS (Class III)', url: SRC_URL.amsDairy, authority: 'official' },
    european_commission: { name: 'Comisión Europea — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data/price-monitoring-sector/milk-and-dairy-products_en', authority: 'official' },
    euronext: { name: 'Euronext (MATIF)', url: SRC_URL.euronext, authority: 'official' },
    dtn_fertilizer: { name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer, authority: 'commercial' },
    world_bank: { name: 'Banco Mundial', url: SRC_URL.worldBank, authority: 'official' },
    eurostat: { name: 'Eurostat', url: 'https://ec.europa.eu/eurostat/web/agriculture/information-data', authority: 'official' },
    eia: { name: 'EIA', url: SRC_URL.eia, authority: 'official' },
    alberta_ag: { name: 'Alberta Agriculture and Irrigation', url: 'https://open.alberta.ca/publications/3479492', authority: 'official' },
    statcan: { name: 'Statistics Canada', url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701', authority: 'official' },
    defra: { name: 'Defra (Reino Unido)', url: SRC_URL.defraMilk, authority: 'official' },
    eu_agrifood: { name: 'Comisión Europea — Agri-food Data Portal', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data_en', authority: 'official' },
    eu_oil_bulletin: { name: 'Boletín Semanal del Petróleo (CE)', url: SRC_URL.euOilBulletin, authority: 'official' },
    usda_ams_mars: { name: 'USDA AMS Market News (MARS)', url: SRC_URL.amsMars, authority: 'official' }
  };

  var DATA_TRUST_PILOT = {
    'cereales-trigo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:11.993Z'
    },
    'cereales-trigo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del trigo blando panificable (milling wheat) en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:14.121Z'
    },
    'cereales-maiz-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:14.067Z'
    },
    'cereales-arroz-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:16.725Z'
    },
    'cereales-cebada-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:19.747Z'
    },
    'cereales-avena-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:21.662Z'
    },
    'cereales-colza-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for canola; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:24.495Z'
    },
    'cereales-sorgo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for grain sorghum; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:27.090Z'
    },
    'cereales-maiz-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del maíz pienso en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro de Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:12.026Z'
    },
    'lacteos-leche-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for all milk sold to plants (not Class III); USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:29.296Z'
    },
    'lacteos-leche-uk': {
      sourceId: 'defra', frequency: 'monthly',
      methodology: 'Defra (Open Government Licence v3.0): precio medio en granja de la leche en el Reino Unido, en GBP/100 kg. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null,
      status: 'pending', verifiedAt: null
    },
    'lacteos-leche-eu': {
      sourceId: 'european_commission', frequency: 'monthly',
      methodology: 'Comisión Europea, Milk Market Observatory (Agri-food Data Portal): precio mensual de la leche cruda de vaca pagada al productor en España, EUR/100 kg, último mes completo. Las cifras del último mes pueden ser provisionales. Es la referencia española; no es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-30', publicationDate: '2026-10-03',
      status: 'verified', verifiedAt: '2026-10-22T14:32:31.223Z'
    },
    'fertilizantes-urea-us': {
      sourceId: 'dtn_fertilizer', frequency: 'weekly',
      methodology: 'PENDIENTE: la ficha muestra 489 USD/ton corta, pero DTN publicó el 23/09/2026 un promedio de 659 USD/ton para urea, observado el 14–18/09/2026. DTN no define “ton” en ese registro; no equipararlo a tonelada métrica ni al valor visible sin reconciliar la unidad y el período.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'fertilizantes-urea-eu': {
      sourceId: 'world_bank', frequency: 'monthly',
      methodology: 'World Bank Urea, E. Europe international commodity reference; USD/metric ton.',
      comparability: 'not_comparable', observationDate: '2026-09-01', publicationDate: '2026-10-02',
      status: 'verified', verifiedAt: '2026-10-27T13:42:52Z'
    },
    'energia-gas_natural-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'Henry Hub natural gas spot price (EIA, daily); USD/MMBtu. Wholesale benchmark, not a farm-gate price.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-gas_natural-eu': {
      sourceId: 'world_bank', frequency: 'monthly',
      methodology: 'World Bank Pink Sheet, Natural gas, Europe (TTF); USD/MMBtu, monthly average (TTF from April 2015; earlier months are an import border price). Shown on the site in EUR/MWh, the TTF native unit, converting at the ECB monthly average of each month (1 MWh = 3.412142 MMBtu). Wholesale benchmark, not a farm-gate price.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-petroleo_wti-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'WTI crude oil spot price, Cushing, Oklahoma (EIA); USD/barrel. Global benchmark for US crude.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-petroleo_brent-eu': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'Brent crude oil spot price, Europe, FOB (EIA); USD/barrel. Global benchmark for European crude.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-cebada-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-avena-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-colza-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-maiz-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'lacteos-leche-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ganado-vaca-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'porcino-cerdo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ovino-cordero-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'avicultura-pollo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'avicultura-huevos-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-soja_grano-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for soybeans; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:41.141Z'
    },
    'cereales-lenteja-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for lentils; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:43.003Z'
    },
    'cereales-guisante_seco-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for dry edible peas; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:44.358Z'
    },
    'cereales-lino-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for flaxseed; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:46.201Z'
    },
    'ovino-cordero-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for lambs, live weight; USD/cwt. Not comparable with the EU heavy-lamb carcass price. Published in the September 2011 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2011-09', publicationDate: '2011-09-30', status: 'verified', verifiedAt: '2026-10-26T14:34:47.826Z'
    },
    'azucar-azucar-us': {
      sourceId: 'usda_ers', frequency: 'monthly',
      methodology: 'USDA ERS, Sugar and Sweeteners Yearbook, table 5: wholesale refined beet sugar price, Midwest markets, bulk, monthly average; USD/lb (ERS publishes cents/lb). Wholesale, not retail; the EU figure is the average ex-factory white sugar price.',
      comparability: 'directional', observationDate: '2026-09', publicationDate: null, status: 'verified', verifiedAt: '2026-10-21T17:19:54.000Z'
    },
    'cereales-soja_grano-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lenteja-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-guisante_seco-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lino-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-canola_elevador-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-cebada_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-avena_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo_cwrs_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lenteja_laird_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-guisante_verde_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ganado-novillo_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'porcino-cerdo_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-diesel-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'US national diesel fuel reference; USD/gallon. Observation dated 2026-10-19; EIA release dated 2026-10-19.',
      comparability: 'directional', observationDate: '2026-10-19', publicationDate: '2026-10-19', status: 'verified', verifiedAt: '2026-10-23T13:14:08.107Z'
    },
    'energia-diesel-eu': {
      sourceId: 'eu_oil_bulletin', frequency: 'weekly',
      methodology: 'Media ponderada de la UE de gasóleo de automoción, con impuestos, publicada en EUR/1.000 litros y almacenada sin convertir su precisión de origen. Es un precio semanal al consumidor; no equivale a una cotización agrícola en finca.',
      comparability: 'directional', observationDate: '2026-10-19', publicationDate: '2026-10-23', status: 'verified', verifiedAt: '2026-10-23T13:14:13.267915Z'
    },
    'porcino-cerdo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for all hogs, live weight; USD/cwt. Not comparable with the EU carcass price (class S). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:33.564Z'
    },
    'porcino-cerdo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cerdo clasificada S (≥60 % magro) en España, EUR/100 kg de canal. Es la referencia española; no es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:01.093Z'
    },
    'ganado-vaca-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for steers and heifers of 500 lb or more, live weight; USD/cwt. Not comparable with the EU carcass price (young bulls A-R3). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:36.259Z'
    },
    'ganado-vaca-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de macho joven (categoría A, conformación R3, la referencia UE) en España, EUR/100 kg de canal. No es vaca de desecho ni la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:03.982Z'
    },
    'ovino-cordero-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cordero pesado en España, EUR/100 kg de canal. No es la media de la UE ni cordero ligero. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:04.779Z'
    },
    'avicultura-pollo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for broilers, live weight; USD/lb. Not comparable with the EU whole-carcass price (65 % yield). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:37.671Z'
    },
    'avicultura-pollo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio de venta semanal del pollo broiler entero (65 % de rendimiento) en España; el portal lo da en moneda nacional (EUR) por 100 kg y se divide entre 100 para expresarlo en EUR/kg. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:05.390Z'
    },
    'azucar-azucar-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual medio del azúcar en la UE (contratos mensuales), EUR/tonelada. Es la media de la UE, no un precio de España. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-06', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-10-22T14:32:06.896Z'
    },
    'aceite-oliva-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio nacional del aceite de oliva virgen extra (hasta 0,8 %) en España, EUR/100 kg. No es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:08.596Z'
    },
    'cereales-arroz-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio del arroz cáscara (paddy) tipo japónica en España, EUR/tonelada. No es la media de la UE ni arroz índica. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:10.887Z'
    },
    'avicultura-huevos-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for table eggs (producer price, not retail); USD/dozen. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-10-26T14:34:31.223Z'
    },
    'avicultura-huevos-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de los huevos de gallinas en jaula (Cage) en España, EUR/100 kg de huevos (el portal no lo da por docena). No es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:06.383Z'
    },
    'fertilizantes-dap-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes fosfatados (P) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es DAP: la Comisión no especifica el producto, así que no es comparable con DAP ni con el índice DTN. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'not_comparable', observationDate: '2026-09', publicationDate: '2026-10-10',
      status: 'verified', verifiedAt: '2026-10-22T14:32:30.327Z'
    },
    'fertilizantes-potasa-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes potásicos (K) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es MOP: la Comisión no especifica el producto, así que no es comparable con MOP ni con el índice DTN. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'not_comparable', observationDate: '2026-09', publicationDate: '2026-10-10',
      status: 'verified', verifiedAt: '2026-10-22T14:32:30.745Z'
    },
    'pienso-harina_soja-us': {
      sourceId: 'usda_ams_mars', frequency: 'weekly',
      methodology: 'USDA AMS Market News (API MARS, informe 3511 «National Grain and Oilseed Processor Feedstuff Report», semanal): precio medio semanal de la harina de soja de 46,5-48 % de proteína en Iowa, FOB, cotización de venta (ask), en USD por tonelada. El informe solo indica «$ Per Ton»; se trata como tonelada corta (2.000 lb) porque el precio se expresa como base sobre el futuro de harina de soja de CBOT, que cotiza en toneladas cortas. Es un mercado regional, no un futuro ni la media nacional, y no es exactamente el mismo producto que la referencia europea (España, 40-50 % de proteína, salida de fábrica, EUR/t).',
      comparability: 'directional', observationDate: '2026-10-23', publicationDate: '2026-10-23', status: 'verified', verifiedAt: '2026-10-26T15:02:09.500Z'
    },
    'pienso-harina_soja-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la harina de soja de 40-50 % de proteína en España (media, salida de fábrica), EUR/tonelada. Sustituye a la referencia anterior de colza en Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:31.749Z'
    },
    'cereales-cebada-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la cebada pienso en el mercado de Lleida (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. El portal no publica cebada pienso en Zaragoza. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:15.102Z'
    },
    'cereales-avena-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de avena pienso en la fase «entrega al primer comprador» (silo o industria), EUR/tonelada. Desde agosto de 2026 la Comisión dejó de publicar la «media nacional» de los cereales; esta serie empieza el 9-8-2026 y no se empalma con la anterior. España no publica avena en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:20.150Z'
    },
    'cereales-centeno-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de centeno panificable en la fase «entrega al primer comprador» (silo o industria), EUR/tonelada. Desde agosto de 2026 la Comisión dejó de publicar la «media nacional» de los cereales; se usa esta fase, publicada desde 2023, sin empalmarla con la anterior. España no publica centeno en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:26.263Z'
    },
    'lacteos-mantequilla-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la mantequilla, agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:28.163Z'
    },
    'lacteos-leche_polvo-us': {
      sourceId: 'usda_ams_mars', frequency: 'weekly',
      methodology: 'USDA AMS Market News (API MARS, informe 1049 «Nonfat Dry Milk - East and Central U.S.», semanal): leche desnatada en polvo de calor bajo y medio, en USD por libra. El informe publica un rango semanal (mínimo y máximo) y el valor mostrado es el punto medio de ese rango, calculado por Dehesa Index. Es un mercado regional (Este y Centro de EE. UU.), no un futuro; el producto es equivalente en tipo al SMP europeo, pero no es idéntico.',
      comparability: 'directional', observationDate: '2026-10-23', publicationDate: '2026-10-23', status: 'verified', verifiedAt: '2026-10-26T15:02:09.578Z'
    },
    'lacteos-leche_polvo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la leche desnatada en polvo (SMP), agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:29.879Z'
    },
    'cereales-colza-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la colza en España (media nacional, salida de silo del agricultor), EUR/tonelada. No es la media de la UE ni el futuro de Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-22',
      status: 'verified', verifiedAt: '2026-10-22T14:32:21.052Z'
    },
    'cereales-trigo_duro-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del trigo duro en el mercado de Sevilla (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro. Italia, el mayor productor de la UE, publica sus propios mercados (Bolonia, Roma, Foggia…): se ven al elegir Italia y en la página de Europa. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-10-18', publicationDate: '2026-10-26',
      status: 'verified', verifiedAt: '2026-10-26T20:49:07.553Z'
    }
  };

  function buildTrustObservation(productId, region, raw, quote, meta) {
    var source = DATA_TRUST_SOURCES[meta.sourceId] || {};
    var isUS = region === 'us';
    var unit = isUS ? (raw.imperialUnitKey || null) : (raw.metricUnitKey || null);
    var kgPerUnit = raw.kgPerUnit || (isUS ? raw.imperialKgPerUnit : raw.metricKgPerUnit) || null;
    return {
      schemaVersion: DATA_TRUST_SCHEMA_VERSION,
      id: 'di_' + productId.replace(/[^a-z0-9]+/gi, '_') + '_' + region,
      productId: productId,
      region: region,
      value: raw.price,
      currency: raw.currency,
      unit: unit,
      kgPerUnit: kgPerUnit,
      quoteType: quote && quote.type ? quote.type : null,
      market: quote && quote.market ? quote.market : null,
      sourceId: meta.sourceId,
      source: source.name || null,
      sourceUrl: source.url || null,
      sourceAuthority: source.authority || 'unknown',
      frequency: meta.frequency || 'unknown',
      observationDate: meta.observationDate || null,
      publicationDate: meta.publicationDate || null,
      methodology: meta.methodology || null,
      comparability: meta.comparability || 'review',
      status: meta.status || 'sample',
      verifiedAt: meta.verifiedAt || null,
      validation: {
        value: true,
        source: !!source.url,
        observationDate: !!meta.observationDate,
        publicationDate: !!meta.publicationDate,
        frequency: meta.frequency !== 'unknown',
        methodology: !!meta.methodology
      }
    };
  }

  function buildPilotTrustRegistry() {
    var out = {};
    for (var catIndex = 0; catIndex < RAW.length; catIndex++) {
      var category = RAW[catIndex];
      for (var productIndex = 0; productIndex < category.products.length; productIndex++) {
        var product = category.products[productIndex];
        var productId = category.id + '-' + product.nameKey;
        ['us', 'eu', 'uk', 'ca'].forEach(function (region) {
          var raw = product[region];
          if (!raw) return;
          var key = productId + '-' + region;
          var meta = DATA_TRUST_PILOT[key];
          if (!meta) return;
          var quote = product.quoteTypes && product.quoteTypes[region];
          out[key] = buildTrustObservation(productId, region, {
            price: raw.price,
            currency: raw.currency,
            kgPerUnit: raw.kgPerUnit,
            imperialUnitKey: region === 'ca' ? null : product.imperialUnitKey,
            metricUnitKey: region === 'ca' ? product.caUnitKey : product.metricUnitKey,
            imperialKgPerUnit: product.imperialKgPerUnit,
            metricKgPerUnit: product.metricKgPerUnit
          }, quote, meta);
        });
      }
    }

    var diesel = [
      { region: 'us', raw: DIESEL_US_NATIONAL, quote: DIESEL_QUOTE_TYPES.us, key: 'energia-diesel-us' },
      { region: 'eu', raw: DIESEL_EU_NATIONAL, quote: DIESEL_QUOTE_TYPES.eu, key: 'energia-diesel-eu' }
    ];
    for (var i = 0; i < diesel.length; i++) {
      var d = diesel[i], meta = DATA_TRUST_PILOT[d.key];
      out[d.key] = buildTrustObservation('energia-diesel', d.region, {
        price: d.raw.price, currency: d.raw.currency, kgPerUnit: d.raw.kgPerUnit,
        imperialUnitKey: d.region === 'us' ? 'gal' : null,
        metricUnitKey: d.region === 'eu' ? 'litro' : null
      }, d.quote, meta);
    }
    return out;
  }

  // --- Canadá en el panel: abonos, energía, piensos y precios al por menor (se añade el 23-oct-2026) ---------
  // Una fila por producto: clave, categoría, nombre en es/en/fr/it, unidad y kg por unidad de Canadá, unidad imperial y su kg, unidad métrica y su kg,
  // emoticono, mercado/fuente (texto de la ficha) y sourceId. Las cifras las escribe scripts/build-ca-panel-obs.py (misma clave) en el snapshot; aquí solo
  // están el marcador de posición (price 0) y el registro de confianza en «pendiente»: la ficha no se ve hasta que latest.json trae una observación verificada.
  var CA_PANEL = [
    ['urea_ab', 'fertilizantes', 'Urea a granel (Alberta)', 'Urea, bulk (Alberta)', 'Urée en vrac (Alberta)', 'Urea sfusa (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['amoniaco_ab', 'fertilizantes', 'Amoníaco anhidro con aplicador (Alberta)', 'Anhydrous ammonia, applied (Alberta)', 'Ammoniac anhydre, épandu (Alberta)', 'Ammoniaca anidra applicata (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['potasa_ab', 'fertilizantes', 'Cloruro potásico 0-0-60 (Alberta)', 'Potassium chloride 0-0-60 (Alberta)', 'Chlorure de potassium 0-0-60 (Alberta)', 'Cloruro di potassio 0-0-60 (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['map_ab', 'fertilizantes', 'Fosfato monoamónico 11-52-0 (Alberta)', 'Monoammonium phosphate 11-52-0 (Alberta)', 'Phosphate monoammonique 11-52-0 (Alberta)', 'Fosfato monoammonico 11-52-0 (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['sulfato_amonico_ab', 'fertilizantes', 'Sulfato amónico 21-0-0-24 (Alberta)', 'Ammonium sulphate 21-0-0-24 (Alberta)', 'Sulfate d\'ammonium 21-0-0-24 (Alberta)', 'Solfato ammonico 21-0-0-24 (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['diesel_agr_ab', 'energia', 'Gasóleo agrícola marcado (Alberta)', 'Marked farm diesel (Alberta)', 'Gazole agricole coloré (Alberta)', 'Gasolio agricolo marcato (Alberta)', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['gasolina_agr_ab', 'energia', 'Gasolina agrícola marcada (Alberta)', 'Marked farm gasoline (Alberta)', 'Essence agricole colorée (Alberta)', 'Benzina agricola marcata (Alberta)', 'litro', 1, 'litro', 1, 'litro', 1, '⛽', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['propano_ab', 'energia', 'Propano agrícola (Alberta)', 'Farm propane (Alberta)', 'Propane agricole (Alberta)', 'Propano agricolo (Alberta)', 'litro', 1, 'litro', 1, 'litro', 1, '⛽', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['gas_natural_ab', 'energia', 'Gas natural de uso agrícola (Alberta)', 'Farm natural gas (Alberta)', 'Gaz naturel agricole (Alberta)', 'Gas naturale agricolo (Alberta)', 'gj', 1, 'gj', 1, 'gj', 1, '⛽', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['electricidad_ab', 'energia', 'Electricidad de uso agrícola (Alberta)', 'Farm electricity (Alberta)', 'Électricité agricole (Alberta)', 'Elettricità agricola (Alberta)', 'kwh', 1, 'kwh', 1, 'kwh', 1, '⚡', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['gasolina_ca', 'energia', 'Gasolina en surtidor (media de Canadá)', 'Pump gasoline (Canada average)', 'Essence à la pompe (moyenne du Canada)', 'Benzina alla pompa (media del Canada)', 'litro', 1, 'litro', 1, 'litro', 1, '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_calgary', 'energia', 'Diésel en surtidor, Calgary', 'Pump diesel, Calgary', 'Gazole à la pompe, Calgary', 'Gasolio alla pompa, Calgary', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_edmonton', 'energia', 'Diésel en surtidor, Edmonton', 'Pump diesel, Edmonton', 'Gazole à la pompe, Edmonton', 'Gasolio alla pompa, Edmonton', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_regina', 'energia', 'Diésel en surtidor, Regina', 'Pump diesel, Regina', 'Gazole à la pompe, Regina', 'Gasolio alla pompa, Regina', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_saskatoon', 'energia', 'Diésel en surtidor, Saskatoon', 'Pump diesel, Saskatoon', 'Gazole à la pompe, Saskatoon', 'Gasolio alla pompa, Saskatoon', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_winnipeg', 'energia', 'Diésel en surtidor, Winnipeg', 'Pump diesel, Winnipeg', 'Gazole à la pompe, Winnipeg', 'Gasolio alla pompa, Winnipeg', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_toronto', 'energia', 'Diésel en surtidor, Toronto', 'Pump diesel, Toronto', 'Gazole à la pompe, Toronto', 'Gasolio alla pompa, Toronto', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_montreal', 'energia', 'Diésel en surtidor, Montreal', 'Pump diesel, Montreal', 'Gazole à la pompe, Montréal', 'Gasolio alla pompa, Montreal', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['diesel_vancouver', 'energia', 'Diésel en surtidor, Vancouver', 'Pump diesel, Vancouver', 'Gazole à la pompe, Vancouver', 'Gasolio alla pompa, Vancouver', 'litro', 'LITRO_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'Statistics Canada (precio en surtidor, autoservicio)', 'statcan'],
    ['heno_ab', 'pienso', 'Heno de alfalfa (Alberta)', 'Alfalfa hay (Alberta)', 'Foin de luzerne (Alberta)', 'Fieno di erba medica (Alberta)', 'ton_corta', 907.185, 'ton_corta', 907.185, 'tonelada', 1000, '🌿', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'alberta_ag'],
    ['pienso_broiler_ab', 'pienso', 'Pienso de crecimiento para pollos (Alberta)', 'Broiler grower feed (Alberta)', 'Aliment croissance poulets de chair (Alberta)', 'Mangime accrescimento polli (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['leche_ternero_ab', 'pienso', 'Sustituto de leche para terneros (Alberta)', 'Calf milk replacer (Alberta)', 'Lait de remplacement pour veaux (Alberta)', 'Latte sostitutivo per vitelli (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['iniciador_ternero_ab', 'pienso', 'Pienso de arranque para terneros (Alberta)', 'Calf starter ration (Alberta)', 'Aliment de démarrage pour veaux (Alberta)', 'Mangime di avviamento per vitelli (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['suplemento_cebo_ab', 'pienso', 'Suplemento para cebadero (Alberta)', 'Feedlot supplement (Alberta)', 'Complément pour parc d\'engraissement (Alberta)', 'Integratore per feedlot (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['pienso_cerdo_ab', 'pienso', 'Pienso de crecimiento para cerdos (Alberta)', 'Hog grower ration (Alberta)', 'Aliment croissance porcs (Alberta)', 'Mangime accrescimento suini (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['suplemento_cerdo_ab', 'pienso', 'Suplemento porcino (Alberta)', 'Swine supplement (Alberta)', 'Complément porcin (Alberta)', 'Integratore suini (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['mineral_vacuno_ab', 'pienso', 'Mineral para vacuno (Alberta)', 'Cattle mineral (Alberta)', 'Minéral pour bovins (Alberta)', 'Minerale per bovini (Alberta)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada', 'alberta_ag'],
    ['leche_1l_ca', 'lacteos', 'Leche, 1 litro, al por menor', 'Milk, 1 litre, retail', 'Lait, 1 litre, au détail', 'Latte, 1 litro, al dettaglio', 'litro', 1, 'litro', 1, 'litro', 1, '🥛', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['leche_4l_ca', 'lacteos', 'Leche, envase de 4 litros, al por menor', 'Milk, 4-litre pack, retail', 'Lait, format 4 litres, au détail', 'Latte, confezione da 4 litri, al dettaglio', 'litro', 1, 'litro', 1, 'litro', 1, '🥛', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['mantequilla_ca', 'lacteos', 'Mantequilla, al por menor', 'Butter, retail', 'Beurre, au détail', 'Burro, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🧈', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['queso_bloque_ca', 'lacteos', 'Queso en bloque, al por menor', 'Block cheese, retail', 'Fromage en bloc, au détail', 'Formaggio in blocco, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🧀', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['yogur_ca', 'lacteos', 'Yogur, al por menor', 'Yogurt, retail', 'Yaourt, au détail', 'Yogurt, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🥛', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['ternera_picada_ca', 'ganado', 'Carne picada de vacuno, al por menor', 'Ground beef, retail', 'Bœuf haché, au détail', 'Carne macinata di manzo, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐄', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['ternera_guisar_ca', 'ganado', 'Vacuno para guisar, al por menor', 'Stewing beef, retail', 'Bœuf à ragoût, au détail', 'Spezzatino di manzo, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐄', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['ternera_lomo_ca', 'ganado', 'Lomo alto de vacuno, al por menor', 'Beef striploin, retail', 'Faux-filet de bœuf, au détail', 'Controfiletto di manzo, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐄', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['ternera_redondo_ca', 'ganado', 'Solomillo bajo de vacuno, al por menor', 'Beef top sirloin, retail', 'Surlonge de bœuf, au détail', 'Lombata di manzo, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐄', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['cerdo_lomo_ca', 'porcino', 'Lomo de cerdo, al por menor', 'Pork loin, retail', 'Longe de porc, au détail', 'Lonza di maiale, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐖', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['cerdo_paleta_ca', 'porcino', 'Paleta de cerdo, al por menor', 'Pork shoulder, retail', 'Épaule de porc, au détail', 'Spalla di maiale, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐖', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['bacon_ca', 'porcino', 'Bacon, al por menor', 'Bacon, retail', 'Bacon, au détail', 'Pancetta affumicata, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🥓', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['pollo_entero_ca', 'avicultura', 'Pollo entero, al por menor', 'Whole chicken, retail', 'Poulet entier, au détail', 'Pollo intero, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐔', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['pollo_pechuga_ca', 'avicultura', 'Pechugas de pollo, al por menor', 'Chicken breasts, retail', 'Poitrines de poulet, au détail', 'Petto di pollo, al dettaglio', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐔', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan'],
    ['huevos_docena_ca', 'avicultura', 'Huevos, docena, al por menor', 'Eggs, dozen, retail', 'Œufs, douzaine, au détail', 'Uova, dozzina, al dettaglio', 'docena', 1, 'docena', 1, 'docena', 1, '🥚', 'Statistics Canada (precio al consumidor, media nacional)', 'statcan']
  ];
  // --- Reino Unido en el panel: combustible (DESNZ), vacuno y cordero en canal de Irlanda del Norte (DAERA) y huevos (Defra) (se añade el 23-oct-2026) ---
  // Mismas columnas que CA_PANEL más una última con la frecuencia. Cifras: scripts/build-uk-panel-obs.py. Precio de mercado del Reino Unido de AHDB: no se usa (licencia).
  var NI_SRC = 'DAERA, informe semanal de mercados agrarios de Irlanda del Norte (precio medio en canal)';
  var UK_PANEL = [
    ['diesel_uk', 'energia', 'Gasóleo en surtidor (Reino Unido)', 'Pump diesel (UK)', 'Gazole à la pompe (Royaume-Uni)', 'Gasolio alla pompa (Regno Unito)', 'litro', 1, 'litro', 1, 'litro', 1, '⛽', 'DESNZ (precio medio semanal en surtidor, con impuestos)', 'desnz_fuel_prices', 'weekly'],
    ['gasolina_uk', 'energia', 'Gasolina sin plomo en surtidor (Reino Unido)', 'Pump unleaded petrol (UK)', 'Essence sans plomb à la pompe (Royaume-Uni)', 'Benzina senza piombo alla pompa (Regno Unito)', 'litro', 1, 'litro', 1, 'litro', 1, '⛽', 'DESNZ (precio medio semanal en surtidor, con impuestos)', 'desnz_fuel_prices', 'weekly'],
    ['vacas_ni', 'ganado', 'Vacas, en canal (Irlanda del Norte)', 'Cows, deadweight (Northern Ireland)', 'Vaches, en carcasse (Irlande du Nord)', 'Vacche, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['vacas_r3_ni', 'ganado', 'Vacas R3, en canal (Irlanda del Norte)', 'Cows grade R3, deadweight (Northern Ireland)', 'Vaches R3, en carcasse (Irlande du Nord)', 'Vacche R3, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['novillas_ni', 'ganado', 'Novillas, en canal (Irlanda del Norte)', 'Heifers, deadweight (Northern Ireland)', 'Génisses, en carcasse (Irlande du Nord)', 'Giovenche, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['novillas_r3_ni', 'ganado', 'Novillas R3, en canal (Irlanda del Norte)', 'Heifers grade R3, deadweight (Northern Ireland)', 'Génisses R3, en carcasse (Irlande du Nord)', 'Giovenche R3, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['novillos_ni', 'ganado', 'Novillos, en canal (Irlanda del Norte)', 'Steers, deadweight (Northern Ireland)', 'Bœufs, en carcasse (Irlande du Nord)', 'Manzi, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['novillos_r3_ni', 'ganado', 'Novillos R3, en canal (Irlanda del Norte)', 'Steers grade R3, deadweight (Northern Ireland)', 'Bœufs R3, en carcasse (Irlande du Nord)', 'Manzi R3, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['toros_ni', 'ganado', 'Toros jóvenes, en canal (Irlanda del Norte)', 'Young bulls, deadweight (Northern Ireland)', 'Jeunes taureaux, en carcasse (Irlande du Nord)', 'Giovani tori, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['toros_r3_ni', 'ganado', 'Toros jóvenes R3, en canal (Irlanda del Norte)', 'Young bulls grade R3, deadweight (Northern Ireland)', 'Jeunes taureaux R3, en carcasse (Irlande du Nord)', 'Giovani tori R3, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐄', NI_SRC, 'daera_ni', 'weekly'],
    ['corderos_ni', 'ovino', 'Corderos, en canal (Irlanda del Norte)', 'Lambs, deadweight (Northern Ireland)', 'Agneaux, en carcasse (Irlande du Nord)', 'Agnelli, a peso morto (Irlanda del Nord)', 'kg', 1, 'kg', 1, 'kg', 1, '🐑', NI_SRC, 'daera_ni', 'weekly'],
    ['huevos_todos_uk', 'avicultura', 'Huevos, precio al productor, todos los tipos (Reino Unido)', 'Eggs, packer-to-producer price, all types (UK)', 'Œufs, prix producteur, tous types (Royaume-Uni)', 'Uova, prezzo al produttore, tutti i tipi (Regno Unito)', 'docena', 1, 'docena', 1, 'docena', 1, '🥚', 'Defra (precio medio trimestral de la empaquetadora al productor)', 'defra', 'quarterly'],
    ['huevos_jaula_uk', 'avicultura', 'Huevos de jaula enriquecida, precio al productor (Reino Unido)', 'Eggs, enriched cages, producer price (UK)', 'Œufs, cages aménagées, prix producteur (Royaume-Uni)', 'Uova, gabbie arricchite, prezzo al produttore (Regno Unito)', 'docena', 1, 'docena', 1, 'docena', 1, '🥚', 'Defra (precio medio trimestral de la empaquetadora al productor)', 'defra', 'quarterly'],
    ['huevos_campero_uk', 'avicultura', 'Huevos camperos, precio al productor (Reino Unido)', 'Eggs, free range, producer price (UK)', 'Œufs plein air, prix producteur (Royaume-Uni)', 'Uova allevate all\'aperto, prezzo al produttore (Regno Unito)', 'docena', 1, 'docena', 1, 'docena', 1, '🥚', 'Defra (precio medio trimestral de la empaquetadora al productor)', 'defra', 'quarterly']
  ];
  // --- Colza física de la Comisión Europea (Rouen, Alemania, Polonia, Hungría), semanal, EUR/t (23-oct-2026). Mismas columnas que WB_PANEL. Cifras: scripts/build-eu-oilseeds-panel-obs.py ---
  var EUP_PANEL = [
    ['colza_fr', 'pienso', 'Colza, Rouen (Francia)', 'Rapeseed, Rouen (France)', 'Colza, Rouen (France)', 'Colza, Rouen (Francia)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌼', 'Comisión Europea, Agri-food Data Portal (precio físico semanal, no es el futuro de Euronext)', 'eu_agrifood', 'weekly'],
    ['colza_de', 'pienso', 'Colza, media nacional (Alemania)', 'Rapeseed, national average (Germany)', 'Colza, moyenne nationale (Allemagne)', 'Colza, media nazionale (Germania)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌼', 'Comisión Europea, Agri-food Data Portal (precio físico semanal, no es el futuro de Euronext)', 'eu_agrifood', 'weekly'],
    ['colza_pl', 'pienso', 'Colza, media nacional (Polonia)', 'Rapeseed, national average (Poland)', 'Colza, moyenne nationale (Pologne)', 'Colza, media nazionale (Polonia)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌼', 'Comisión Europea, Agri-food Data Portal (precio físico semanal, no es el futuro de Euronext)', 'eu_agrifood', 'weekly'],
    ['colza_hu', 'pienso', 'Colza, media nacional (Hungría)', 'Rapeseed, national average (Hungary)', 'Colza, moyenne nationale (Hongrie)', 'Colza, media nazionale (Ungheria)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌼', 'Comisión Europea, Agri-food Data Portal (precio físico semanal, no es el futuro de Euronext)', 'eu_agrifood', 'weekly']
  ];
  // --- Banco Mundial (Pink Sheet) en el panel: aceites vegetales, café, cacao, té, banana, algodón, caucho, carnes y arroz internacionales... (23-oct-2026) ---
  // Mismas columnas que UK_PANEL. Región 'eu' (como la urea y el gas del Banco Mundial), USD, mensual. Cifras: scripts/build-wb-panel-obs.py.
  var WB_PANEL = [
    ['aceite_palma', 'aceite', 'Aceite de palma', 'Palm oil', 'Huile de palme', 'Olio di palma', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌴', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_palmiste', 'aceite', 'Aceite de palmiste', 'Palm kernel oil', 'Huile de palmiste', 'Olio di palmisti', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌴', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_coco', 'aceite', 'Aceite de coco', 'Coconut oil', 'Huile de coco', 'Olio di cocco', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌴', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_cacahuete', 'aceite', 'Aceite de cacahuete', 'Groundnut oil', 'Huile d\'arachide', 'Olio di arachidi', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌴', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_soja', 'aceite', 'Aceite de soja', 'Soybean oil', 'Huile de soja', 'Olio di soia', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🫘', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_colza', 'aceite', 'Aceite de colza', 'Rapeseed oil', 'Huile de colza', 'Olio di colza', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌼', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['aceite_girasol', 'aceite', 'Aceite de girasol', 'Sunflower oil', 'Huile de tournesol', 'Olio di girasole', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌻', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['harina_pescado', 'pienso', 'Harina de pescado', 'Fish meal', 'Farine de poisson', 'Farina di pesce', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🐟', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['cacao', 'tropicales', 'Cacao', 'Cocoa', 'Cacao', 'Cacao', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍫', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['cafe_arabica', 'tropicales', 'Café arábica', 'Coffee, Arabica', 'Café arabica', 'Caffè arabica', 'kg', 1, 'lb', 0.453592, 'kg', 1, '☕', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['cafe_robusta', 'tropicales', 'Café robusta', 'Coffee, Robusta', 'Café robusta', 'Caffè robusta', 'kg', 1, 'lb', 0.453592, 'kg', 1, '☕', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['te_subastas', 'tropicales', 'Té (media de 3 subastas)', 'Tea (average of 3 auctions)', 'Thé (moyenne de 3 ventes)', 'Tè (media di 3 aste)', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍵', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['banana_ue', 'tropicales', 'Banana, Europa', 'Banana, Europe', 'Banane, Europe', 'Banana, Europa', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍌', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['banana_us', 'tropicales', 'Banana, EE. UU.', 'Banana, U.S.', 'Banane, États-Unis', 'Banana, Stati Uniti', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍌', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['naranja', 'tropicales', 'Naranja', 'Orange', 'Orange', 'Arancia', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍊', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['algodon_a', 'tropicales', 'Algodón (índice A)', 'Cotton (A Index)', 'Coton (indice A)', 'Cotone (indice A)', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🌱', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['caucho_rss3', 'tropicales', 'Caucho RSS3', 'Rubber RSS3', 'Caoutchouc RSS3', 'Gomma RSS3', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🌳', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['caucho_tsr20', 'tropicales', 'Caucho TSR20', 'Rubber TSR20', 'Caoutchouc TSR20', 'Gomma TSR20', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🌳', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['cacahuete', 'tropicales', 'Cacahuete', 'Groundnuts', 'Arachides', 'Arachidi', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🥜', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['tabaco_us', 'tropicales', 'Tabaco (valor unitario de importación de EE. UU.)', 'Tobacco (U.S. import unit value)', 'Tabac (valeur unitaire à l\'importation, É.-U.)', 'Tabacco (valore unitario d\'importazione USA)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌿', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['ternera_mundo', 'ganado', 'Vacuno, referencia internacional', 'Beef, international reference', 'Bœuf, référence internationale', 'Manzo, riferimento internazionale', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐄', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['cordero_mundo', 'ovino', 'Cordero, referencia internacional', 'Lamb, international reference', 'Agneau, référence internationale', 'Agnello, riferimento internazionale', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐑', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['pollo_mundo', 'avicultura', 'Pollo, referencia internacional', 'Chicken, international reference', 'Poulet, référence internationale', 'Pollo, riferimento internazionale', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🐔', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['tsp', 'fertilizantes', 'Superfosfato triple (TSP)', 'Triple superphosphate (TSP)', 'Superphosphate triple (TSP)', 'Perfosfato triplo (TSP)', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['roca_fosforica', 'fertilizantes', 'Roca fosfórica', 'Phosphate rock', 'Phosphate naturel', 'Roccia fosfatica', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🧪', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['trigo_srw_us', 'cereales', 'Trigo blando rojo de invierno de EE. UU. (SRW), exportación', 'U.S. soft red winter wheat (SRW), export', 'Blé tendre rouge d\'hiver américain (SRW), export', 'Grano tenero rosso invernale USA (SRW), export', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['trigo_hrw_us', 'cereales', 'Trigo duro rojo de invierno de EE. UU. (HRW), exportación', 'U.S. hard red winter wheat (HRW), export', 'Blé dur rouge d\'hiver américain (HRW), export', 'Grano duro rosso invernale USA (HRW), export', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🌾', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['arroz_tai_5', 'cereales', 'Arroz de Tailandia 5 %', 'Rice, Thai 5%', 'Riz thaï 5 %', 'Riso thailandese 5%', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🍚', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['arroz_tai_25', 'cereales', 'Arroz de Tailandia 25 %', 'Rice, Thai 25%', 'Riz thaï 25 %', 'Riso thailandese 25%', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🍚', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['arroz_tai_a1', 'cereales', 'Arroz de Tailandia A.1', 'Rice, Thai A.1', 'Riz thaï A.1', 'Riso thailandese A.1', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🍚', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['arroz_viet_5', 'cereales', 'Arroz de Vietnam 5 %', 'Rice, Vietnamese 5%', 'Riz vietnamien 5 %', 'Riso vietnamita 5%', 'tonelada', 1000, 'ton_corta', 907.185, 'tonelada', 1000, '🍚', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['azucar_mundo', 'azucar', 'Azúcar, precio mundial', 'Sugar, world price', 'Sucre, prix mondial', 'Zucchero, prezzo mondiale', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍬', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['azucar_ue', 'azucar', 'Azúcar, precio de la UE', 'Sugar, EU price', 'Sucre, prix UE', 'Zucchero, prezzo UE', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍬', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly'],
    ['azucar_us', 'azucar', 'Azúcar, precio de EE. UU.', 'Sugar, U.S. price', 'Sucre, prix américain', 'Zucchero, prezzo USA', 'kg', 1, 'lb', 0.453592, 'kg', 1, '🍬', 'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)', 'world_bank', 'monthly']
  ];
  // --- EE. UU. en el panel: lácteos de AMS (mantequilla, cheddar, suero) y bioenergía de ERS (gasolina base, DDGS, coste del maíz) (23-oct-2026) ---
  // Mismas columnas que UK_PANEL. Cifras: scripts/build-us-panel-obs.py. 'mantequilla' ya existe (Europa): se le añade la región EE. UU.
  var US_PANEL = [
    ['mantequilla', 'lacteos', 'Mantequilla', 'Butter', 'Beurre', 'Burro', 'lb', 0.453592, 'lb', 0.453592, '100kg', 100, '🧈', 'USDA AMS (National Dairy Products Sales Report, precio semanal medio ponderado)', 'usda_ams_mars', 'weekly'],
    ['cheddar', 'lacteos', 'Queso cheddar de bloque (40 lb)', 'Cheddar cheese, 40-lb block', 'Cheddar en bloc de 40 lb', 'Formaggio cheddar, blocco da 40 lb', 'lb', 0.453592, 'lb', 0.453592, '100kg', 100, '🧀', 'USDA AMS (National Dairy Products Sales Report, precio semanal medio ponderado)', 'usda_ams_mars', 'weekly'],
    ['suero', 'lacteos', 'Suero seco', 'Dry whey', 'Lactosérum sec', 'Siero di latte in polvere', 'lb', 0.453592, 'lb', 0.453592, '100kg', 100, '🥛', 'USDA AMS (National Dairy Products Sales Report, precio semanal medio ponderado)', 'usda_ams_mars', 'weekly'],
    ['gasolina_base_us', 'energia', 'Gasolina base para mezcla (RBOB, Los Ángeles)', 'Gasoline blendstock (RBOB, Los Angeles)', 'Essence de base pour mélange (RBOB, Los Angeles)', 'Benzina base per miscela (RBOB, Los Angeles)', 'gal', 'GAL_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '⛽', 'USDA ERS (estadísticas de bioenergía, mensual)', 'usda_ers', 'monthly'],
    ['ddgs_us', 'pienso', 'Granos secos de destilería (DDGS), Illinois', 'Distillers dried grains (DDGS), Illinois', 'Drêches de distillerie séchées (DDGS), Illinois', 'Distillers dried grains (DDGS), Illinois', 'ton_corta', 907.185, 'ton_corta', 907.185, 'tonelada', 1000, '🌽', 'USDA ERS (estadísticas de bioenergía, mensual)', 'usda_ers', 'monthly'],
    ['coste_maiz_etanol_us', 'energia', 'Coste del maíz por galón de etanol', 'Corn cost per gallon of ethanol', 'Coût du maïs par gallon d\'éthanol', 'Costo del mais per gallone di etanolo', 'gal', 'GAL_KG', 'gal', 'GAL_KG', 'litro', 'LITRO_KG', '🌽', 'USDA ERS (estadísticas de bioenergía, mensual)', 'usda_ers', 'monthly']
  ];
  var US_LMR_PANEL = [
    ['cutout_vacuno_choice', 'ganado', 'Corte de vacuno en caja, Choice', 'Boxed beef cutout, Choice', 'Découpe de bœuf en carton, Choice', 'Taglio di manzo in scatola, Choice', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥩', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['cutout_vacuno_select', 'ganado', 'Corte de vacuno en caja, Select', 'Boxed beef cutout, Select', 'Découpe de bœuf en carton, Select', 'Taglio di manzo in scatola, Select', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥩', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['novillo_vivo_us', 'ganado', 'Novillos de sacrificio, vivo (EE. UU., 5 zonas)', 'Slaughter steers, live (U.S., 5-area)', 'Bœufs d\'abattage, vif (É.-U., 5 zones)', 'Manzi da macello, vivo (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['novillo_canal_us', 'ganado', 'Novillos de sacrificio, en canal (EE. UU., 5 zonas)', 'Slaughter steers, dressed (U.S., 5-area)', 'Bœufs d\'abattage, en carcasse (É.-U., 5 zones)', 'Manzi da macello, in carcassa (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['novilla_vivo_us', 'ganado', 'Novillas de sacrificio, vivo (EE. UU., 5 zonas)', 'Slaughter heifers, live (U.S., 5-area)', 'Génisses d\'abattage, vif (É.-U., 5 zones)', 'Giovenche da macello, vivo (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['novilla_canal_us', 'ganado', 'Novillas de sacrificio, en canal (EE. UU., 5 zonas)', 'Slaughter heifers, dressed (U.S., 5-area)', 'Génisses d\'abattage, en carcasse (É.-U., 5 zones)', 'Giovenche da macello, in carcassa (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['vacuno_vivo_us', 'ganado', 'Vacuno de sacrificio, vivo (EE. UU., 5 zonas)', 'Slaughter cattle, live (U.S., 5-area)', 'Bovins d\'abattage, vif (É.-U., 5 zones)', 'Bovini da macello, vivo (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['vacuno_canal_us', 'ganado', 'Vacuno de sacrificio, en canal (EE. UU., 5 zonas)', 'Slaughter cattle, dressed (U.S., 5-area)', 'Bovins d\'abattage, en carcasse (É.-U., 5 zones)', 'Bovini da macello, in carcassa (USA, 5 aree)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐄', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['cutout_cerdo', 'porcino', 'Corte de cerdo (cutout), FOB planta', 'Pork cutout, FOB plant', 'Découpe de porc (cutout), FOB usine', 'Taglio di maiale (cutout), FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐖', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['lomo_cerdo', 'porcino', 'Lomo de cerdo, FOB planta', 'Pork loin, FOB plant', 'Longe de porc, FOB usine', 'Lombata di maiale, FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['paleta_cerdo', 'porcino', 'Aguja/paleta (butt) de cerdo, FOB planta', 'Pork butt, FOB plant', 'Échine de porc (butt), FOB usine', 'Spalla di maiale (butt), FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['picnic_cerdo', 'porcino', 'Paleta delantera (picnic) de cerdo, FOB planta', 'Pork picnic, FOB plant', 'Épaule de porc (picnic), FOB usine', 'Spalla anteriore di maiale (picnic), FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['costilla_cerdo', 'porcino', 'Costillar de cerdo, FOB planta', 'Pork ribs, FOB plant', 'Travers de porc, FOB usine', 'Costine di maiale, FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['jamon_cerdo', 'porcino', 'Jamón fresco de cerdo, FOB planta', 'Pork ham, FOB plant', 'Jambon frais de porc, FOB usine', 'Prosciutto fresco di maiale, FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['panceta_cerdo', 'porcino', 'Panceta de cerdo (belly), FOB planta', 'Pork belly, FOB plant', 'Poitrine de porc (belly), FOB usine', 'Pancetta di maiale (belly), FOB stabilimento', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🥓', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['cerdo_base_us', 'porcino', 'Cerdos sacrificados, precio base de la canal (EE. UU.)', 'Slaughtered hogs, carcass base price (U.S.)', 'Porcs abattus, prix de base de la carcasse (É.-U.)', 'Suini macellati, prezzo base della carcassa (USA)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐖', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily'],
    ['cerdo_neto_us', 'porcino', 'Cerdos sacrificados, precio neto de la canal (EE. UU.)', 'Slaughtered hogs, carcass net price (U.S.)', 'Porcs abattus, prix net de la carcasse (É.-U.)', 'Suini macellati, prezzo netto della carcassa (USA)', 'cwt', 45.359, 'cwt', 45.359, '100kg', 100, '🐖', 'USDA AMS (Livestock Mandatory Reporting, diario)', 'usda_ams_lmr', 'daily']
  ];
  US_PANEL = US_PANEL.concat(US_LMR_PANEL);
  var CA_PANEL_LABELS = { gj: { es: 'GJ', en: 'GJ', fr: 'GJ', it: 'GJ' }, kwh: { es: 'kWh', en: 'kWh', fr: 'kWh', it: 'kWh' } };
  (function () {
    var LK = LITRO_KG, GK = GAL_KG;
    ['es', 'en', 'fr', 'it'].forEach(function (l) { Object.keys(CA_PANEL_LABELS).forEach(function (u) { UNIT_LABELS[l][u] = CA_PANEL_LABELS[u][l]; }); });
    var nm = function (v) { return v === 'LITRO_KG' ? LK : v === 'GAL_KG' ? GK : v; };
    var TROP = { es: 'Café, cacao y otros', en: 'Coffee, cocoa & more', fr: 'Café, cacao et autres', it: 'Caffè, cacao e altro' };
    ['es', 'en', 'fr', 'it'].forEach(function (l) { NAMES[l].tropicales = TROP[l]; });
    var hasTrop = false; RAW.forEach(function (c) { if (c.id === 'tropicales') hasTrop = true; });
    if (!hasTrop) RAW.push({ id: 'tropicales', nameKey: 'tropicales', products: [] });
    [[CA_PANEL, 'ca', 'CAD'], [UK_PANEL, 'uk', 'GBP'], [WB_PANEL, 'eu', 'USD'], [EUP_PANEL, 'eu', 'EUR'], [US_PANEL, 'us', 'USD']].forEach(function (set) { set[0].forEach(function (row) {
      var key = row[0], catId = row[1], unit = row[6], kg = nm(row[7]);
      var cat = null; RAW.forEach(function (c) { if (c.id === catId) cat = c; });
      if (!cat) return;
      var prod = null; cat.products.forEach(function (x) { if (x.nameKey === key) prod = x; });
      if (!prod) {
        ['es', 'en', 'fr', 'it'].forEach(function (l, i) { NAMES[l][key] = row[2 + i]; });
        prod = { nameKey: key, caUnitKey: unit, caKgPerUnit: kg, imperialUnitKey: row[8], imperialKgPerUnit: nm(row[9]), metricUnitKey: row[10], metricKgPerUnit: nm(row[11]), quoteTypes: {} };
        cat.products.push(prod);
      }
      prod[set[1]] = { price: 0, changePct: 0, history: [0, 0], currency: set[2], kgPerUnit: kg }; prod.quoteTypes = prod.quoteTypes || {}; prod.quoteTypes[set[1]] = { type: 'referencia', market: row[13] };
      DATA_TRUST_PILOT[catId + '-' + key + '-' + set[1]] = { sourceId: row[14], frequency: row[15] || 'monthly',
        methodology: row[13] + '. Pendiente de la primera ejecución automática.',
        comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null };
    }); });
  })();

  var DATA_TRUST = buildPilotTrustRegistry();

  function validateDataTrustRegistry(registry) {
    var required = ['schemaVersion','id','productId','region','value','currency','unit','kgPerUnit','quoteType','market','sourceId','source','sourceUrl','frequency','methodology','comparability','status'];
    var errors = [], warnings = [], ids = Object.keys(registry);
    for (var i = 0; i < ids.length; i++) {
      var key = ids[i], o = registry[key];
      for (var j = 0; j < required.length; j++) {
        var field = required[j];
        if (o[field] === null || o[field] === undefined || o[field] === '') {
          errors.push(key + ': missing ' + field);
        }
      }
      if (o.status === 'verified' && (!o.observationDate || !o.publicationDate || !o.verifiedAt)) {
        errors.push(key + ': verified observations require observationDate, publicationDate and verifiedAt');
      }
      if (!o.observationDate) warnings.push(key + ': observationDate pending');
      if (!o.publicationDate) warnings.push(key + ': publicationDate pending');
      if (!o.sourceUrl) warnings.push(key + ': sourceUrl pending');
    }
    return {
      schemaVersion: DATA_TRUST_SCHEMA_VERSION,
      observations: ids.length,
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      pendingDates: ids.filter(function (id) { return !registry[id].observationDate || !registry[id].publicationDate; }).length
    };
  }

  var DATA_TRUST_HEALTH = validateDataTrustRegistry(DATA_TRUST);

  // Texto del mercado de cada fila del panel en en/fr/it (la fila lleva el español); precios.js lo elige según el idioma
  var MARKET_T = {
    'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)': ['Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices)'],
    'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); precio por saco pasado a tonelada': ['Alberta Agriculture and Irrigation (Alberta Farm Input Prices); price per bag converted to tonnes', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices) ; prix au sac converti en tonnes', 'Alberta Agriculture and Irrigation (Alberta Farm Input Prices); prezzo al sacco convertito in tonnellate'],
    'Statistics Canada (precio en surtidor, autoservicio)': ['Statistics Canada (pump price, self-serve)', 'Statistics Canada (prix à la pompe, libre-service)', 'Statistics Canada (prezzo alla pompa, self-service)'],
    'Statistics Canada (precio al consumidor, media nacional)': ['Statistics Canada (consumer price, national average)', 'Statistics Canada (prix à la consommation, moyenne nationale)', 'Statistics Canada (prezzo al consumo, media nazionale)'],
    'DESNZ (precio medio semanal en surtidor, con impuestos)': ['DESNZ (weekly average pump price, taxes included)', 'DESNZ (prix moyen hebdomadaire à la pompe, taxes comprises)', 'DESNZ (prezzo medio settimanale alla pompa, tasse incluse)'],
    'DAERA, informe semanal de mercados agrarios de Irlanda del Norte (precio medio en canal)': ['DAERA, weekly Northern Ireland farm markets report (average deadweight price)', 'DAERA, rapport hebdomadaire des marchés agricoles d’Irlande du Nord (prix moyen en carcasse)', 'DAERA, rapporto settimanale sui mercati agricoli dell’Irlanda del Nord (prezzo medio a carcassa)'],
    'Defra (precio medio trimestral de la empaquetadora al productor)': ['Defra (quarterly average price paid by packers to producers)', 'Defra (prix moyen trimestriel payé par le centre de conditionnement au producteur)', 'Defra (prezzo medio trimestrale pagato dal centro di confezionamento al produttore)'],
    'Banco Mundial, Pink Sheet (precio internacional de referencia en USD, no es el precio del agricultor)': ['World Bank, Pink Sheet (international reference price in USD, not the farmer’s price)', 'Banque mondiale, Pink Sheet (prix international de référence en USD, pas le prix payé à l’agriculteur)', 'Banca Mondiale, Pink Sheet (prezzo internazionale di riferimento in USD, non il prezzo dell’agricoltore)'],
    'USDA AMS (National Dairy Products Sales Report, precio semanal medio ponderado)': ['USDA AMS (National Dairy Products Sales Report, weighted weekly average price)', 'USDA AMS (National Dairy Products Sales Report, prix hebdomadaire moyen pondéré)', 'USDA AMS (National Dairy Products Sales Report, prezzo settimanale medio ponderato)'],
    'USDA ERS (estadísticas de bioenergía, mensual)': ['USDA ERS (bioenergy statistics, monthly)', 'USDA ERS (statistiques de bioénergie, mensuelles)', 'USDA ERS (statistiche sulla bioenergia, mensili)'],
    'Comisión Europea, Agri-food Data Portal (precio físico semanal, no es el futuro de Euronext)': ['European Commission, Agri-food Data Portal (weekly physical price, not the Euronext future)', 'Commission européenne, Agri-food Data Portal (prix physique hebdomadaire, pas le contrat à terme Euronext)', 'Commissione europea, Agri-food Data Portal (prezzo fisico settimanale, non il future Euronext)'],
    'USDA AMS (Livestock Mandatory Reporting, diario)': ['USDA AMS (Livestock Mandatory Reporting, daily)', 'USDA AMS (Livestock Mandatory Reporting, quotidien)', 'USDA AMS (Livestock Mandatory Reporting, giornaliero)']
  };
  function marketText(es, lang) { var i = { en: 0, fr: 1, it: 2 }[lang]; var t = MARKET_T[es]; return i != null && t ? t[i] : es; }

  global.DehesaData = {
    FX: FX, FX_DATE: FX_DATE, formatFxDate: formatFxDate, CCY_SYMBOL: CCY_SYMBOL, UNIT_LABELS: UNIT_LABELS, REGION: REGION,
    DATA_TRUST_SCHEMA_VERSION: DATA_TRUST_SCHEMA_VERSION, DATA_TRUST: DATA_TRUST, DATA_TRUST_SOURCES: DATA_TRUST_SOURCES, DATA_TRUST_HEALTH: DATA_TRUST_HEALTH, validateDataTrustRegistry: validateDataTrustRegistry,
    marketText: marketText,
    CA_PANEL: CA_PANEL,
    UK_PANEL: UK_PANEL,
    WB_PANEL: WB_PANEL,
    EUP_PANEL: EUP_PANEL,
    US_PANEL: US_PANEL,
    ENERGY_REGIONS: ENERGY_REGIONS, COUNTRY_ER_KEY: COUNTRY_ER_KEY, COUNTRY_FLAG: COUNTRY_FLAG,
    QUOTE_TYPES: QUOTE_TYPES, NAMES: NAMES, CATS: CATS, FOOT: FOOT, RAW: RAW,
    WOOD: WOOD,
    LITRO_KG: LITRO_KG, GAL_KG: GAL_KG,
    DIESEL_US_NATIONAL: DIESEL_US_NATIONAL, DIESEL_EU_NATIONAL: DIESEL_EU_NATIONAL, DIESEL_UK_NATIONAL: DIESEL_UK_NATIONAL,
    DIESEL_US_REGIONS: DIESEL_US_REGIONS, DIESEL_EU_COUNTRIES: DIESEL_EU_COUNTRIES,
    DIESEL_COUNTRY_TO_KEY: DIESEL_COUNTRY_TO_KEY, DIESEL_QUOTE_TYPES: DIESEL_QUOTE_TYPES,
    withSeps: withSeps,
    spark: spark, sparkShared: sparkShared, trendColor: trendColor, fmtChange: fmtChange, changeColor: changeColor,
    fmtNumber: fmtNumber, fmtTotal: fmtTotal, computeFactor: computeFactor, fxAt: fxAt, buildRegion: buildRegion,
    deriveCountryRaw: deriveCountryRaw,
    realHistory: realHistory, exportRealCsv: exportRealCsv, isoDate: isoDate,
    HISTORY_COMPARE_PRESETS: HISTORY_COMPARE_PRESETS
  };
})(window);
