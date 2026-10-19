import urllib.request, os, hashlib
P = "https://www.statistics.gr/en/statistics?p_p_id=documents_WAR_publicationsportlet_INSTANCE_%s&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=4&p_p_col_pos=%d&_documents_WAR_publicationsportlet_INSTANCE_%s_javax.faces.resource=document&_documents_WAR_publicationsportlet_INSTANCE_%s_ln=downloadResources&_documents_WAR_publicationsportlet_INSTANCE_%s_documentID=%d&_documents_WAR_publicationsportlet_INSTANCE_%s_locale=en"
def u(inst, pos, doc): return P % (inst, pos, inst, inst, inst, doc, inst)
T = {"ts01": u("Mr0GiQJSgPHd", 3, 114677), "ts04": u("Mr0GiQJSgPHd", 3, 114681), "ts05": u("Mr0GiQJSgPHd", 3, 114682),
     "regional": u("VBZOni0vs5VJ", 2, 579762), "press": u("qDQ8fBKKo4lN", 1, 602705)}
for k, url in T.items():
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}), timeout=120)
        b = r.read(); ct = r.headers.get("Content-Type"); cd = r.headers.get("Content-Disposition")
        ext = "xls" if b[:4] == b"\xd0\xcf\x11\xe0" else "xlsx" if b[:2] == b"PK" else "pdf" if b[:4] == b"%PDF" else "bin"
        open("probe/el-out/%s.%s" % (k, ext), "wb").write(b)
        print(k, len(b), ct, cd, ext)
    except Exception as e:
        print(k, "ERROR", e)
