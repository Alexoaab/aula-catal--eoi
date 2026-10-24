"""Extract surface paradigms for dictionary lemma lookup, Apertium cat GPL-2.0.
Usage: python3 build-morphology.py cat.metadix
Skips generation-only forms, regexes, compounds and clitic joins.
"""
import sys,json, functools
import xml.etree.ElementTree as E
from pathlib import Path
import gzip
root=E.parse(gzip.open(Path(__file__).parent.parent/'translate/cat.metadix.gz')).getroot(); defs={p.get('n'):p for p in root.findall('./pardefs/pardef')}
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
def all_forms(wanted):
 forms={}
 for e in root.findall('./section/e'):
  lemma=e.get('lm','').lower()
  if lemma not in wanted:continue
  for form in expand(e):
   form=form.lower()
   if not form or ' ' in form or form==lemma:continue
   if lemma.endswith('ment') and any('__adv' in p.get('n','') for p in e.findall('par')) and not form.endswith('ment'):continue
   bucket=forms.setdefault(form,[])
   if lemma not in bucket:bucket.append(lemma)
 return forms
