"""Extract surface paradigms for dictionary lemma lookup, Apertium cat GPL-2.0.
Usage: python3 build-morphology.py cat.metadix
Skips generation-only forms, regexes, compounds and clitic joins.
"""
import sys,json, functools
import xml.etree.ElementTree as E
from pathlib import Path
root=E.parse(sys.argv[1]).getroot(); defs={p.get('n'):p for p in root.findall('./pardefs/pardef')}
def literal(e):
 s=e.text or ''
 for c in e:
  if c.tag=='b': s+=' '
  elif c.tag=='s': pass
  else: raise ValueError(c.tag)
  s+=c.tail or ''
 return s
@functools.lru_cache(None)
def paradigm(name):
 return sorted(set(s for e in defs.get(name,[]) for s in expand(e)))
def expand(e):
 if e.get('r')=='RL' or e.get('i')=='yes':return []
 forms=['']
 try:
  for c in e:
   if c.tag=='i':parts=[literal(c)]
   elif c.tag=='p':
    if c.find('.//j') is not None:return []
    parts=[literal(c.find('l'))]
   elif c.tag=='par':parts=paradigm(c.get('n'))
   else:return []
   forms=[a+b for a in forms for b in parts]
  return forms
 except ValueError:return []
dictionary=json.loads(Path(__file__).with_name('dictionary.json').read_text())
# Keep complete surface forms; index only lemmas with bilingual entries.
forms={}
for e in root.findall('./section/e'):
 lemma=e.get('lm','').lower()
 if lemma not in dictionary:continue
 for form in expand(e):
  form=form.lower()
  if not form or ' ' in form or form==lemma:continue
  bucket=forms.setdefault(form,[])
  if lemma not in bucket:bucket.append(lemma)
# Split by initial character to avoid loading every conjugation for one lookup.
shards={}
for form,lemmas in forms.items():shards.setdefault(format(ord(form[0]),'x'),{})[form]=lemmas
out=Path(__file__).with_name('forms');out.mkdir(exist_ok=True)
for key,values in shards.items():(out/(key+'.json')).write_text(json.dumps(values,ensure_ascii=False,separators=(',',':')))
print(len(forms),'surface forms;',len(shards),'shards')
for word,lemma in [('escriviu','escriure'),('boniques','bonic'),('llops','llop'),('paraules','paraula'),('tenim','tenir')]:
 assert lemma in forms[word],(word,forms.get(word));print(word,forms[word])
assert 'inventadíssimaqq' not in forms
