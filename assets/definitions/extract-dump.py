import bz2,xml.etree.ElementTree as E,json,re,collections,sys
ns='{http://www.mediawiki.org/xml/export-0.11/}'
pages={};templates=collections.Counter()
for _,e in E.iterparse(bz2.open(sys.argv[1]),events=['end']):
 if e.tag!=ns+'page':continue
 title=e.findtext(ns+'title');txt=e.findtext('.//'+ns+'text') or '';nsnum=e.findtext(ns+'ns')
 if nsnum=='0':
  match=re.search(r'^==\s*\{\{-ca-\}\}\s*==\s*$',txt,re.M)
  if match:
   section=re.split(r'^==[^=].*?==\s*$',txt[match.end():],maxsplit=1,flags=re.M)[0]
   pages[title]=section
   for line in section.splitlines():
    if re.match(r'^#+[^:*#]',line):
     for name in re.findall(r'\{\{([^|}]+)',line):templates[name]+=1
 e.clear()
json.dump(pages,open(sys.argv[2],'w'),ensure_ascii=False)
print(len(pages));print(templates.most_common(45))
