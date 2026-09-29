#!/usr/bin/env python3
"""Dehesa Index automated news pipeline: RSS/Atom -> normalize -> classify -> score -> JSON/JS."""
from __future__ import annotations
import hashlib, html, json, re, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"data"; JS=ROOT/"js"
DATA.mkdir(exist_ok=True)
DAYS=14; MAX_ITEMS=120; UA="DehesaIndex-NewsBot/1.0"

def google(q,gl="US"):
    return "https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":q,"hl":"en-US","gl":gl,"ceid":f"{gl}:en"})
FEEDS=[
    # General news / wire services
    ("Reuters","global",google("site:reuters.com agriculture commodities farmers fertilizer corn wheat soybean dairy")),
    ("Reuters","global",google("site:reuters.com energy oil diesel agriculture fertilizer")),
    ("Associated Press","global",google("site:apnews.com agriculture commodities farmers fertilizer corn wheat soybean dairy")),
    ("AFP","global",google("site:afp.com agriculture commodities food fertilizer grains dairy")),
    ("EFE","global",google("site:efe.com agricultura cereales trigo maiz soja fertilizantes leche energia comercio")),
    ("Bloomberg","global",google("site:bloomberg.com agriculture commodities grains fertilizer soybean corn wheat dairy")),
    ("Financial Times","global",google("site:ft.com agriculture commodities food grains fertilizer energy trade")),
    ("Wall Street Journal","us",google("site:wsj.com agriculture commodities farmers grains fertilizer energy")),
    ("CNBC","us",google("site:cnbc.com agriculture commodities grains fertilizer oil food")),
    ("POLITICO","us",google("site:politico.com agriculture farm bill USDA tariffs agriculture")),
    ("Euractiv","eu",google("site:euractiv.com agriculture CAP food trade fertilizer energy")),
    ("Xinhua","global",google("site:english.news.cn agriculture grains food fertilizer trade soybean corn wheat")),

    # Agriculture / commodity specialist media
    ("DTN","us",google("site:dtnpf.com agriculture grains fertilizer energy livestock markets")),
    ("AgWeb","us",google("site:agweb.com agriculture corn soybean wheat fertilizer dairy livestock")),
    ("Farm Progress","us",google("site:farmprogress.com agriculture corn soybean wheat fertilizer dairy feed")),
    ("Successful Farming","us",google("site:agriculture.com farming corn soybean wheat fertilizer markets")),
    ("World Grain","global",google("site:world-grain.com grains wheat corn soybean rice trade supply")),
    ("Feed Strategy","global",google("site:feedstrategy.com animal feed grains soybean meal corn wheat dairy")),
    ("Dairy Herd","us",google("site:dairyherd.com dairy milk feed fertilizer energy markets")),
    ("Fastmarkets","global",google("site:fastmarkets.com agriculture grains oilseeds biofuels feedstocks sugar fertilizer")),
    ("S&P Global","global",google("site:spglobal.com agriculture food commodities grains fertilizer soybean sugar biofuels")),
    ("Argus Media","global",google("site:argusmedia.com agriculture fertilizer grains biofuels vegetable oils")),
    ("FoodNavigator","global",google("site:foodnavigator.com food commodity prices agriculture dairy sugar grains supply")),
    ("Farmers Weekly","uk",google("site:fwi.co.uk agriculture farmers crops wheat barley fertilizer dairy trade")),
    ("Farmers Guardian","uk",google("site:farmersguardian.com agriculture crops wheat barley fertilizer dairy livestock")),
    ("Agriland","eu",google("site:agriland.ie agriculture dairy grain fertilizer trade")),
    ("AGRA","eu",google("site:agra.fr agriculture CAP cereals dairy fertilizer trade")),
    ("Agroeuropa","eu",google("site:agroeuropa.es agroalimentario Unión Europea PAC cereales lácteos fertilizantes comercio")),
    ("ABC Rural","global",google("site:abc.net.au/news/rural agriculture grain wheat cattle dairy fertilizer")),
    ("Grain Central","global",google("site:graincentral.com wheat grains sorghum barley canola Australia agriculture")),
    ("The Land","global",google("site:theland.com.au agriculture grain wheat cattle dairy fertilizer")),

    # United Kingdom agriculture / policy sources
    ("DEFRA","uk",google("site:gov.uk/defra agriculture farming food trade fertilizer livestock crops")),
    ("AHDB","uk",google("site:ahdb.org.uk agriculture wheat barley dairy livestock cereals market")),
    ("NFU","uk",google("site:nfuonline.com farming agriculture food trade policy wheat dairy livestock")),

    # Institutional / official market and policy sources
    ("USDA","us",google("site:usda.gov/news agriculture corn wheat soybean dairy fertilizer livestock")),
    ("USDA ERS","us",google("site:ers.usda.gov agriculture commodity food prices farm costs trade")),
    ("European Commission","eu",google("site:agriculture.ec.europa.eu agriculture agri-food trade cereals dairy fertilizer","BE")),
    ("FAO","global",google("site:fao.org news agriculture food prices cereals fertilizer livestock")),
    ("OECD","global",google("site:oecd.org agriculture trade commodity food fertilizer farm policy")),
    ("WTO","global",google("site:wto.org agriculture trade tariffs food commodities")),
    ("EIA","us",google("site:eia.gov energy oil diesel natural gas agriculture fertilizer")),
    ("IEA","global",google("site:iea.org oil gas energy agriculture fertilizer food")),
    ("International Grains Council","global",google("site:igc.int grain wheat maize rice soybean market supply trade")),
]
PRODUCTS={
 "maiz":["corn","maize","maíz","maïs"],"trigo":["wheat","trigo","blé"],
 "soja":["soybean","soybeans","soy","soja"],"arroz":["rice","arroz","riz"],
 "cebada":["barley","cebada","orge"],"azucar":["sugar","sugarcane","azúcar"],
 "fertilizantes":["fertilizer","fertiliser","urea","nitrogen","potash","ammonia"],
 "diesel":["diesel","gasoil"],"energia":["oil","crude","energy","natural gas","fuel","petróleo"],
 "leche":["milk","dairy","lácteo","laitier"],"feed":["feed","animal feed","livestock feed","pienso"],
 "costes":["farm costs","input costs","farm input","costs","costes agrícolas"],
 "pac":["common agricultural policy","agricultural policy","subsidy","farm subsidies"]
}
TOPICS={
 "clima":["weather","rain","drought","flood","heat","el nino","la nina","climate","lluvia","sequía"],
 "comercio":["tariff","tariffs","trade","export","imports","china","customs","arancel"],
 "oferta":["harvest","crop","production","yield","supply","stocks","inventory","cosecha"],
 "energia":["oil","diesel","gas","energy","fuel","crude"],"costes":["cost","input","fertilizer","diesel","fuel","inflation"],
 "politica":["government","policy","minister","commission","regulation","subsidy"]
}
REGIONS={"us":["united states","u.s.","u.s.a.","corn belt","iowa","illinois","indiana","kansas"],
"uk":["united kingdom","u.k.","britain","british","england","scotland","wales","northern ireland","london","defra","ahdb","nfu"],
"eu":["european union","europe","brussels","spain","france","germany","italy"]}

def clean(s):
    return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",html.unescape(s or ""))).strip()

def date_of(s):
    try:return parsedate_to_datetime(s).date().isoformat()
    except Exception:
        try:return datetime.fromisoformat(s.replace("Z","+00:00")).date().isoformat()
        except Exception:return datetime.now(timezone.utc).date().isoformat()

def parse(raw):
    root=ET.fromstring(raw); out=[]
    for n in root.iter():
        if not n.tag.lower().endswith(("item","entry")): continue
        vals={}
        for c in n:
            tag=c.tag.lower(); txt=clean(c.text or "")
            if tag.endswith("title"): vals["title"]=txt
            elif tag.endswith(("pubdate","published","updated","date")): vals["date"]=date_of(txt)
            elif tag.endswith(("description","summary","content")): vals["desc"]=txt
            elif tag.endswith("link") and txt: vals["link"]=txt
            elif tag.endswith("link") and c.attrib.get("href"): vals["link"]=c.attrib["href"]
        if vals.get("title") and vals.get("link"): out.append(vals)
    return out

CHANNEL_PRIORITY=["input_cost","trade","weather","supply","energy","policy","market_impact"]

def build_market_links(products, topics, title, desc):
    text=f"{title} {desc}".lower()
    links=[]
    def add(market,channel,relation=None):
        key=(market,channel,relation or "")
        if any((x["market"],x["channel"],x.get("relation") or "")==key for x in links): return
        links.append({"market":market,"channel":channel,"relation":relation,"direction":"uncertain"})
    market_products=[p for p in products if p not in ("costes","pac","energia","diesel")]
    if "clima" in topics:
        for p in market_products: add(p,"weather")
    if "oferta" in topics:
        for p in market_products: add(p,"supply")
    if "comercio" in topics:
        for p in market_products: add(p,"trade")
    fertilizer_hit=("fertilizante" in text or "fertilizer" in text or "fertiliser" in text or "urea" in text or "nitrogen" in text or "potash" in text)
    energy_hit=("diesel" in text or "energy" in text or "oil" in text or "crude" in text or "fuel" in text or "natural gas" in text)
    if fertilizer_hit or "fertilizantes" in products:
        for p in ("maiz","trigo","cebada","arroz"): add(p,"input_cost","fertilizer-cereals")
        if "leche" in market_products or "leche" in products: add("leche","input_cost","fertilizer-milk")
    if energy_hit or any(p in products for p in ("energia","diesel")):
        for p in ("maiz","trigo","cebada","arroz"): add(p,"input_cost","energy-cereals")
        if "leche" in market_products or "leche" in products: add("leche","input_cost","energy-milk")
    if "energia" in topics and not energy_hit:
        add("energia","energy")
    if "politica" in topics:
        for p in market_products: add(p,"policy")
    if not links:
        for p in market_products[:4]: add(p,"market_impact")
    return sorted(links,key=lambda x: (CHANNEL_PRIORITY.index(x["channel"]) if x["channel"] in CHANNEL_PRIORITY else 99, x["market"]))

def classify(title,desc,source_region):
    text=f"{title} {desc}".lower()
    hits={p:sum(t.lower() in text for t in terms) for p,terms in PRODUCTS.items()}
    products=[p for p,v in sorted(hits.items(),key=lambda x:x[1],reverse=True) if v]
    topics=[t for t,terms in TOPICS.items() if any(x.lower() in text for x in terms)]
    region=source_region
    # Source geography is the default; explicit country/region language can
    # override it. UK is checked before the broader Europe bucket.
    for r in ("us","uk","eu"):
        terms=REGIONS[r]
        if any(x.lower() in text for x in terms): region=r; break
    relevance=min(100,35+12*len(products)+8*len(topics)+(10 if source_region in ("global","us","eu") else 0))
    return products[:4] or ["pac"],topics or ["oferta"],region,relevance

def main():
    cutoff=(datetime.now(timezone.utc)-timedelta(days=DAYS)).date()
    rows=[]
    for source,region,url in FEEDS:
        try:
            req=urllib.request.Request(url,headers={"User-Agent":UA})
            with urllib.request.urlopen(req,timeout=20) as r: items=parse(r.read())
            for x in items:
                try:
                    d=datetime.fromisoformat(x["date"]).date()
                except Exception:
                    continue
                if d<cutoff: continue
                products,topics,reg,score=classify(x["title"],x.get("desc",""),region)
                links=build_market_links(products,topics,x["title"],x.get("desc",""))
                primary_channel=links[0]["channel"] if links else "market_impact"
                rows.append({"id":"auto-"+hashlib.sha1((source+x["title"]+x["link"]).encode()).hexdigest()[:10],
                    "date":x["date"],"region":reg,"topic":topics[0],"topics":topics,"products":products,
                    "source":source,"headline":{"en":x["title"],"es":x["title"],"fr":x["title"],"it":x["title"]},
                    "description":x.get("desc","")[:280],"url":x["link"],"relevance":score,"auto":True,"impactChannel":primary_channel,"marketLinks":links})
        except Exception as e: print(f"[WARN] {source}: {e}")
    dedup={}
    for x in rows:
        k=re.sub(r"[^a-z0-9]+","",x["headline"]["en"].lower())[:180]
        if k not in dedup or x["relevance"]>dedup[k]["relevance"]: dedup[k]=x
    rows=sorted(dedup.values(),key=lambda x:(x["date"],x["relevance"]),reverse=True)[:MAX_ITEMS]
    (DATA/"news.json").write_text(json.dumps({"generatedAt":datetime.now(timezone.utc).isoformat(),"count":len(rows),"items":rows},ensure_ascii=False,indent=2),encoding="utf-8")
    idx={}
    for x in rows:
        keys=set(x["products"])
        keys.update(link["market"] for link in x.get("marketLinks",[]))
        for p in sorted(keys): idx.setdefault(p,[]).append(x)
    (JS/"news-index.js").write_text(
        "/* AUTO-GENERATED by scripts/update_news.py */\\n"
        "(function(global){'use strict';global.DehesaNewsIndex="
        + json.dumps(idx, ensure_ascii=False, indent=2)
        + ";})(window);\\n",
        encoding="utf-8"
    )
    print(f"[OK] {len(rows)} stories generated")
if __name__=="__main__": main()
