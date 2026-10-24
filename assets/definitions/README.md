# Diccionari d’accepcions de l’aula

Definicions en català del Viccionari (https://ca.wiktionary.org), obra dels seus
col·laboradors, disponibles sota CC BY-SA 4.0:
https://creativecommons.org/licenses/by-sa/4.0/
Cada entrada enllaça amb la seva pàgina, on es pot consultar l’historial d’autoria.

Font descarregada el 24-10-2026:
https://dumps.wikimedia.org/cawiktionary/latest/cawiktionary-latest-pages-articles.xml.bz2

Adaptacions: extracció de la secció catalana, conversió de marques de wikitext a
text pla, selecció de les entrades del material, categories gramaticals i remissions
a les formes base. Es conserva l’ordre de les accepcions de cada entrada.
No és una còpia del GDLC ni del DIEC i no pretén recollir totes les accepcions
possibles d’una paraula. No es copia el contingut de diccionari.cat.

`editorial.json` conté un complement didàctic de redacció pròpia, identificat
separadament a la interfície i ofert també sota CC BY-SA 4.0. Són explicacions
seleccionades per a l’estudi, no entrades normatives exhaustives.

Reproducció:

    python3 extract-dump.py cawiktionary-latest-pages-articles.xml.bz2 ca-pages.json
    python3 build.py ca-pages.json

El segon pas requereix els fitxers index.html, book-b2.js i translate/forms del
projecte. `coverage.json` audita el text de tots els temes i exercicis de B2,
B2.1 i l’examen. Els elements sense entrada inclouen fragments, grafies errònies
proposades pels exercicis, sigles, noms propis i paraules pendents. No es dedueix
que una grafia sigui incorrecta pel fet de no tenir entrada. Les imatges no són
text seleccionable i no s’han incorporat al recompte.
