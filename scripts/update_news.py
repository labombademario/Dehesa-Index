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
DAYS=14; MAX_ITEMS=80; UA="DehesaIndex-NewsBot/1.0"

def google(q,gl="US"):
    return "https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":q,"hl":"en-US","gl":gl,"ceid":f"{gl}:en"})
FEEDS=[
 ("Reuters","global",google("site:reuters.com agriculture commodities farmers fertilizer corn wheat soybean dairy")),
 ("Reuters","global",google("site:reuters.com energy oil diesel agriculture fertilizer")),
 ("USDA","us",google("site:usda.gov/news agriculture corn wheat soybean dairy fertilizer")),
 ("European Commission","eu",google("site:agriculture.ec.europa.eu agriculture agri-food trade cereals dairy fertilizer","BE")),
 ("FAO","global",google("site:fao.org news agriculture food prices cereals fertilizer livestock")),
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
REGIONS={"us":["united states","u.s.","corn belt","iowa","illinois","indiana","kansas"],
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

def classify(title,desc,source_region):
    text=f"{title} {desc}".lower()
    hits={p:sum(t.lower() in text for t in terms) for p,terms in PRODUCTS.items()}
    products=[p for p,v in sorted(hits.items(),key=lambda x:x[1],reverse=True) if v]
    topics=[t for t,terms in TOPICS.items() if any(x.lower() in text for x in terms)]
    region=source_region
    for r,terms in REGIONS.items():
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
                rows.append({"id":"auto-"+hashlib.sha1((source+x["title"]+x["link"]).encode()).hexdigest()[:10],
                    "date":x["date"],"region":reg,"topic":topics[0],"topics":topics,"products":products,
                    "source":source,"headline":{"en":x["title"],"es":x["title"],"fr":x["title"],"it":x["title"]},
                    "description":x.get("desc","")[:280],"url":x["link"],"relevance":score,"auto":True})
        except Exception as e: print(f"[WARN] {source}: {e}")
    dedup={}
    for x in rows:
        k=re.sub(r"[^a-z0-9]+","",x["headline"]["en"].lower())[:180]
        if k not in dedup or x["relevance"]>dedup[k]["relevance"]: dedup[k]=x
    rows=sorted(dedup.values(),key=lambda x:(x["date"],x["relevance"]),reverse=True)[:MAX_ITEMS]
    (DATA/"news.json").write_text(json.dumps({"generatedAt":datetime.now(timezone.utc).isoformat(),"count":len(rows),"items":rows},ensure_ascii=False,indent=2),encoding="utf-8")
    idx={}
    for x in rows:
        for p in x["products"]: idx.setdefault(p,[]).append(x)
    (JS/"news-index.js").write_text("/* AUTO-GENERATED by scripts/update_news.py */\n(function(global){'use strict';global.DehesaNewsIndex="+json.dumps(idx,ensure_ascii=False,indent=2)+";})(window);\n",encoding="utf-8")
    print(f"[OK] {len(rows)} stories generated")
if __name__=="__main__": main()
