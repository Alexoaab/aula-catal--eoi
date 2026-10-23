"""Build the lemma dictionary from Apertium spa-cat (GPL-2.0).
Usage: python3 build-dictionary.py source.metadix
Only complete lexical pairs usable in the Catalan → Spanish direction.
No automatic stemming or machine translations.
"""
import sys, json, unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
root=ET.parse(sys.argv[1]).getroot()
entries={}
def spelling(el):
    text=el.text or ''
    for child in el:
        if child.tag=='b': text+=' '
        elif child.tag=='g': text+=spelling(child)
        elif child.tag not in ('s',): raise ValueError(child.tag)
        text+=child.tail or ''
    return unicodedata.normalize('NFC',text).strip()
for e in root.findall('./section/e'):
    if e.get('r')=='LR' or e.get('i')=='yes': continue
    p=e.find('p')
    if p is None or len(e.findall('p'))!=1: continue
    # Paradigms with lexical material need expansion; never publish partial words.
    if any(not x.get('n','').startswith('v:') for x in e.findall('par')): continue
    try: ca,es=spelling(p.find('r')),spelling(p.find('l'))
    except ValueError: continue
    if not ca or not es or '_' in ca+es: continue
    tags=p.find('r').findall('.//s')
    pos=tags[0].get('n') if tags else ''
    value=[es,pos]
    bucket=entries.setdefault(ca.lower(),[])
    if value not in bucket: bucket.append(value)
Path(__file__).with_name('dictionary.json').write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')))
print(len(entries),'entries')
for word in ['brut','llop','loció','jutge','taula','escriure']:
    print(word,entries.get(word))
assert ['sucio','adj'] in entries['brut']
assert ['lobo','n'] in entries['llop']
assert any(v[0]=='loción' for v in entries['loció'])
