"""Extract Catalan senses for the site's complete text corpus.
Source: Catalan Wiktionary pages-articles dump, CC BY-SA 4.0.
Input: JSON mapping page titles to Catalan wikitext sections (extract-dump.py).
Unknown templates are audited, never shown as broken markup.
"""
from pathlib import Path
import json,re,html,collections,sys,unicodedata
HERE=Path(__file__).parent;BOOK=HERE.parent
pages=json.load(open(sys.argv[1]));unknown=collections.Counter(); definitions={};aliases={}
def template(body):
 parts=body.split('|');name=parts[0].strip();args=[p for p in parts[1:] if '=' not in p]
 if name in ['marca','marca-nocat']:return '('+', '.join(args[1:])+') '
 if name=='q':return '('+', '.join(args)+')'
 if name in ['e','m','trad']:return args[1] if len(args)>1 else ''
 if name=='w':return args[-1] if args else ''
 if name=='sinònim':return 'Sinònim de '+(args[1] if len(args)>1 else '')+'.'
 if name=='def-meta':return '|'.join(parts[1:])
 if name=='sigles de':return 'Sigles de '+(args[-1] if args else '')+'.'
 if name=='cognom':return 'Cognom'+(' '+args[1] if len(args)>1 else '')+'.'
 if name=='prenom':return 'Nom de persona.'
 if name in ['sense accepcions','manquen accepcions','falten accepcions','cal atestar']:raise ValueError(name)
 unknown[name]+=1;raise ValueError(name)
def clean(s):
 s=re.sub(r'\[\[(?:Fitxer|File|Imatge):[^\]]*\]\]','',s,flags=re.I)
 s=re.sub(r'<ref\b[^>]*>.*?</ref>|<ref\b[^>]*/>','',s,flags=re.S)
 s=re.sub(r'<!--.*?-->','',s,flags=re.S)
 for _ in range(10):
  if '{{' not in s:break
  s=re.sub(r'\{\{([^{}]*)\}\}',lambda m:template(m[1]),s)
 if '{{' in s or '}}' in s:raise ValueError('template')
 s=re.sub(r'\[\[([^\]]+)\]\]',lambda m:m[1].split('|')[-1].split('#')[0],s)
 s=re.sub(r'\[https?://\S+\s+([^]]+)\]',r'\1',s)
 s=re.sub(r'<[^>]*>','',s);s=re.sub(r"'{2,5}",'',s)
 return re.sub(r'\s+',' ',html.unescape(s)).strip()
for word,section in pages.items():
 senses=[];pos='';gender='';bases=[]
 for line in section.splitlines():
  h=re.match(r'^={3,4}\s*(.*?)\s*={3,4}$',line)
  if h:pos=h[1].lower();gender=''
  g=re.match(r'\{\{ca-(?:nom|adj)\|([mf])(?:[|}])',line)
  if g:gender={'m':'masculí','f':'femení'}[g[1]]
  if not re.match(r'^#+[^:#*]',line):continue
  raw=re.sub(r'^#+\s*','',line)
  form=re.search(r'\{\{(ca-forma-conj|forma-p|forma-f|forma-a|forma-|forma-super|grafia)\|([^{}]+)\}\}',raw)
  if form:
   args=form[2].split('|');base=args[0] if form[1]=='ca-forma-conj' else (args[2] if form[1]=='grafia' and len(args)>2 else args[1] if len(args)>1 else '')
   if base and '=' not in base and base not in bases:bases.append(base)
   continue
  if pos not in ['nom','nom propi','adjectiu','adverbi','verb','pronom','preposició','conjunció','interjecció','article','numeral','locució','locució adverbial','locució nominal','locució verbal','símbol','sigla','contracció','prefix','sufix']:continue
  try:text=clean(raw)
  except ValueError:continue
  if not text:continue
  category=pos+(' '+gender if pos=='nom' and gender else '')
  sense={'pos':category,'definition':text}
  if sense not in senses:senses.append(sense)
 if senses and (word.lower() not in definitions or word==word.lower()):definitions[word.lower()]={'word':word,'senses':senses}
 if bases:aliases[word.lower()]=list(dict.fromkeys(aliases.get(word.lower(),[])+[x.lower() for x in bases]))
# Editorial additions address frequent teaching vocabulary missing from the source.
for word,items in json.loads(HERE.joinpath('editorial.json').read_text()).items():
 definitions[word]={'word':word,'source':'editorial','senses':[{'pos':pos,'definition':text} for pos,text in items]}
# Extract every textual value from B2/B2.1/exams, excluding implementation metadata.
s=BOOK.joinpath('index.html').read_text();base=json.JSONDecoder().raw_decode(s[s.index('const base=')+11:])[0]
book=json.JSONDecoder().raw_decode(BOOK.joinpath('book-b2.js').read_text().split('=',1)[1])[0]
texts=[]
ignore={'id','type','area','section','source','image','sourcePages','number','sourceNumber','topicNumber','kind','docImage','layout'}
def walk(x,key=''):
 if isinstance(x,dict):
  for k,v in x.items():
   if k not in ignore:walk(v,k)
 elif isinstance(x,list):
  for v in x:walk(v,key)
 elif isinstance(x,str) and not x.startswith('data:'):texts.append(re.sub('<[^>]*>','',re.sub(r'</?(?:p|div|li|td|th|tr|h[1-6]|br|section|table|ul|ol)\b[^>]*>',' ',html.unescape(x),flags=re.I)))
walk(base);walk(book)
words=collections.Counter(re.findall(r"[^\W\d_]+(?:[·'’-][^\W\d_]+)*",' '.join(texts).lower(),re.U))
words={unicodedata.normalize('NFC',w.replace('’',"'")):n for w,n in words.items()}
from morphology import all_forms
forms=all_forms(definitions)
for form,lemma in {'pardalets':'pardalet','musicassets':'musicasset','rodolons':'rodoló','entravessa':'entravessar','jaguis':'jaure','distragui':'distreure','distraguis':'distreure','queixen':'queixar','queixava':'queixar','queixeu':'queixar','guixant':'guixar','esporguem':'esporgar','tramitadors':'tramitador','tramitadora':'tramitador','llarguíssim':'llarg','llarguíssima':'llarg','tardíssim':'tard','tarongers':'taronger','faroles':'farola','nominals':'nominal'}.items():
 if lemma in definitions:forms.setdefault(form,[]).append(lemma)
# Recursively follow attested inflections and redirects, preserving alternative lemmas.
def resolve(word,seen=None):
 seen=set() if seen is None else seen
 if word in seen or len(seen)>12:return []
 seen.add(word);out=[word] if word in definitions else []
 # Never analyse a lemma again as another word's surface form.
 for lemma in aliases.get(word,[]):
  if lemma in definitions:out.append(lemma)
  else:out.extend(resolve(lemma,seen.copy()))
 for lemma in forms.get(word,[]):
  if lemma in definitions:out.append(lemma)
 if not out:
  clitic=re.match(r"^(.+?)(?:-(?:me|te|se|lo|la|los|les|li|ho|ne|hi|nos|vos|us|m|t|s|l|n)|'(?:m|t|s|l|ls|n|ns|ho|hi))+$",word)
  if clitic:
   for lemma in resolve(clitic[1],seen):
    if any(s['pos'].startswith('verb') for s in definitions[lemma]['senses']):out.append(lemma)
 if not out and re.match(r"^(l|d|n|s|m|t)'",word):out.extend(resolve(word.split("'",1)[1],seen))
 if not out and '-' in word and "'" not in word:out.extend(resolve(word.replace('-',''),seen))
 return list(dict.fromkeys(out))
needed=set();index={};missing={}
for word,count in words.items():
 found=resolve(word)
 if found:index[word]=found;needed.update(found)
 else:missing[word]=count
# Include named example and useful complete entries irrespective of occurrence.
for word in ['altressí','taula','escriure','llop','bonic','escrit','judicial']:
 found=resolve(word);index[word]=found;needed.update(found)
# All source-backed definitions remain available when exploring related terms.
for lemma in needed:index.setdefault(lemma,[lemma])
shards={}
for lemma in sorted(needed):shards.setdefault(format(ord(lemma[0]),'x'),{})[lemma]=definitions[lemma]
out=HERE/'data';out.mkdir(exist_ok=True)
for k,v in shards.items():(out/(k+'.json')).write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')))
HERE.joinpath('index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
report={'topics':len(base)+len(book),'exercises':sum(len(t.get('exercises',[])) for t in base+book),'distinctTokens':len(words),'coveredTokens':len(words)-len(missing),'entries':len(needed),'senses':sum(len(definitions[w]['senses']) for w in needed),'unresolved':dict(sorted(missing.items(),key=lambda x:-x[1])),'unhandledTemplates':dict(unknown)}
HERE.joinpath('coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print({k:v for k,v in report.items() if k not in ['unresolved','unhandledTemplates']})
print('Common unresolved:',list(report['unresolved'].items())[:80]);print('Unhandled:',unknown.most_common(15))
assert len(definitions['altressí']['senses'])==2
assert any(s['pos']=='nom masculí' for s in definitions['altressí']['senses'])
assert 'escriure' in index['escriviu']
