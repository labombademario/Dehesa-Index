#!/usr/bin/env python3
"""Las notas de la API estan en es/en/fr/it, las traducciones no dejan frases en espanol y la guarda funciona (frase desconocida = sin traduccion)."""
import glob, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from api_notes_i18n import translate_note, split_sentences
fails = 0
def ok(n, c):
    global fails
    print(('OK     ' if c else 'FALLA  ') + n); fails += 0 if c else 1
ES = re.compile(r'\b(precio|semanal|mensual|España|salida de|Es un mercado|No es la|la API|se registra|Canadá|oferta de|informe)\b', re.I)
docs = [json.load(open(f)) for f in sorted(glob.glob(str(ROOT / 'data/api/v1/series/*/*.json')))]
withn = [d for d in docs if d.get('note')]
ok('hay series con nota (%d)' % len(withn), len(withn) > 40)
ok('todas las notas estan en es, en, fr e it', all(set(d['note']) == {'es', 'en', 'fr', 'it'} for d in withn))
ok('ninguna traduccion es igual que el texto espanol (salvo la nota que nace en ingles)', all(d['note'][l] != d['note']['es'] for d in withn if d['id'] != 'eu/diesel' for l in ('fr', 'it')))
bad = [(d['id'], l) for d in withn for l in ('en', 'fr', 'it') if ES.search(d['note'][l])]
ok('las traducciones no contienen frases en espanol %s' % bad[:3], not bad)
ok('cifras y fechas se conservan (9-8-2026, 0,8 %, 1,03)', all(('9-8-2026' in d['note'][l]) for d in withn if d['id'] == 'eu/avena' for l in ('en', 'fr', 'it')) and all(('1.03' in d['note']['en'] and '1,03' in d['note']['fr'] and '1,03' in d['note']['it']) for d in withn if d['id'] in ('ca/leche', 'uk/leche')))
ok('mismo numero de frases en los cuatro idiomas', all(len({len(split_sentences(d['note'][l])) for l in ('es', 'en', 'fr', 'it')}) == 1 for d in withn))
tr, miss = translate_note('Comisión Europea, Agri-food Data Portal: precio semanal de algo inventado. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.')
ok('una frase desconocida no se traduce a medias: sin traduccion y se avisa de la frase', tr == {} and len(miss) == 1 and 'inventado' in miss[0])
print('%s' % ('OK' if not fails else '%d fallos' % fails)); sys.exit(1 if fails else 0)
