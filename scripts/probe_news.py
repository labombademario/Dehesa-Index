#!/usr/bin/env python3
"""Sondeo de fuentes RSS candidatas: estado, nº de artículos, fecha más reciente y un titular. Salida: data/probe-news.txt"""
import sys, urllib.request, ssl
sys.path.insert(0, 'scripts')
from update_news import parse
C = """
FAO|https://www.fao.org/newsroom/rss/en/
FAO2|https://www.fao.org/news/rss-feed/en/
USDA releases|https://www.usda.gov/rss/latest-releases.xml
USDA FAS|https://www.fas.usda.gov/rss.xml
USDA AMS|https://www.ams.usda.gov/rss.xml
USDA NASS|https://www.nass.usda.gov/Newsroom/rss.xml
USDA ERS|https://www.ers.usda.gov/rss/
Defra|https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom
WTO|https://www.wto.org/library/rss/latest_news_e.xml
EIA|https://www.eia.gov/rss/todayinenergy.xml
EC press|https://ec.europa.eu/commission/presscorner/api/rss?language=en
EC agri|https://agriculture.ec.europa.eu/rss_en
Eurostat|https://ec.europa.eu/eurostat/api/dissemination/catalogue/rss/en/statistics-update.rss
IGC|https://www.igc.int/en/rss.aspx
Euractiv agrifood|https://www.euractiv.com/sections/agriculture-food/feed/
Euronews|https://www.euronews.com/rss?format=mrss&level=theme&name=green
Agriland|https://www.agriland.ie/feed/
Farmers Journal|https://www.farmersjournal.ie/rss
Farmers Weekly|https://www.fwi.co.uk/feed
Farmers Guardian|https://www.fginsight.com/rss
Farmdoc daily|https://farmdocdaily.illinois.edu/feed
Farm Policy News|https://farmpolicynews.illinois.edu/feed/
Brownfield|https://brownfieldagnews.com/feed/
Agri-Pulse|https://www.agri-pulse.com/rss
AgWeb|https://www.agweb.com/rss.xml
Farm Progress|https://www.farmprogress.com/rss
DTN|https://www.dtnpf.com/agriculture/web/ag/rss/news
Successful Farming|https://www.agriculture.com/feeds/news
Hoards|https://hoards.com/rss
Dairy Herd|https://www.dairyherd.com/rss
Pig Progress|https://www.pigprogress.net/rss
The Pig Site|https://www.thepigsite.com/rss
Feedstuffs|https://www.feedstuffs.com/rss
WATTAgNet|https://www.wattagnet.com/rss
Drovers|https://www.drovers.com/rss
Beef Central|https://www.beefcentral.com/feed/
Grain Central|https://www.graincentral.com/feed/
ABC Rural|https://www.abc.net.au/news/feed/2942460/rss.xml
Western Producer|https://www.producer.com/feed/
RealAgriculture|https://www.realagriculture.com/feed/
World Grain|https://www.world-grain.com/rss
Feed Strategy|https://www.feedstrategy.com/rss
Agroinformacion|https://agroinformacion.com/feed/
Agropopular|https://www.agropopular.com/feed/
Efeagro|https://efeagro.com/feed/
Agrodigital|https://www.agrodigital.com/feed/
Agronews CyL|https://www.agronewscastillayleon.com/feed
Interempresas agro|https://www.interempresas.net/Agricola/rss.xml
Terre-net|https://www.terre-net.fr/rss
Web-agri|https://www.web-agri.fr/rss
Pleinchamp|https://www.pleinchamp.com/rss
La France Agricole|https://www.lafranceagricole.fr/rss
Reussir|https://www.reussir.fr/rss
Agronotizie|https://agronotizie.imagelinenetwork.com/rss
Terra e Vita|https://terraevita.edagricole.it/feed/
Agricolae|https://www.agricolae.eu/feed/
Informatore Agrario|https://www.informatoreagrario.it/feed/
Infocampo|https://www.infocampo.com.ar/feed/
UkrAgroConsult|https://ukragroconsult.com/en/news/feed/
Latifundist|https://latifundist.com/en/rss
Hindu BusinessLine agri|https://www.thehindubusinessline.com/economy/agri-business/feeder/default.rss
Reuters google|https://news.google.com/rss/search?q=site:reuters.com+wheat+corn+soybean&hl=en-US&gl=US&ceid=US:en
GoogleNews BlackSea|https://news.google.com/rss/search?q=Black+Sea+wheat+exports+Ukraine+Russia&hl=en-US&gl=US&ceid=US:en
GoogleNews Brazil|https://news.google.com/rss/search?q=Brazil+soybean+corn+harvest+exports&hl=en-US&gl=US&ceid=US:en
GoogleNews avian flu|https://news.google.com/rss/search?q=avian+influenza+African+swine+fever+livestock&hl=en-US&gl=US&ceid=US:en
GoogleNews ES|https://news.google.com/rss/search?q=precios+cereales+trigo+maiz+lonja&hl=es&gl=ES&ceid=ES:es
GoogleNews FR|https://news.google.com/rss/search?q=prix+bl%C3%A9+ma%C3%AFs+march%C3%A9+c%C3%A9r%C3%A9ales&hl=fr&gl=FR&ceid=FR:fr
GoogleNews IT|https://news.google.com/rss/search?q=prezzi+grano+mais+mercato+cereali&hl=it&gl=IT&ceid=IT:it
"""
ctx = ssl.create_default_context()
out = []
for line in C.strip().splitlines():
    name, url = line.split('|', 1)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex-NewsBot/1.0)"})
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            raw = r.read(); st = r.status
        items = parse(raw)
        dates = sorted([i.get('date', '') for i in items], reverse=True)
        out.append(f"OK   {name} | {st} | items={len(items)} | newest={dates[0] if dates else '-'} | {(items[0]['title'][:70] if items else '')}")
    except Exception as e:
        out.append(f"FAIL {name} | {str(e)[:80]}")
open('data/probe-news.txt', 'w').write('\n'.join(out) + '\n')
print('\n'.join(out))
