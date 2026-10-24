# Catalan–Spanish lookup dictionary

Extracted on 2026-10-23 from https://github.com/apertium/apertium-spa-cat (master).
Copyright: Apertium contributors, as recorded in the upstream project.
License: GNU GPL version 2; see COPYING. The extracted dictionary is covered by the same license.

Complete downloaded XML source: source.metadix.gz. Rebuild:

    gzip -dc source.metadix.gz > source.metadix
    python3 build-dictionary.py source.metadix

The local interface uses lexical entries, not machine translation. Direction-restricted Spanish-only mappings and entries requiring lexical paradigm expansion are excluded. Inflected forms without explicit entries are not guessed. Multiple equivalents are shown without claiming contextual disambiguation.

## Morphological lookup (2026-10-24)

Catalan surface forms from https://github.com/apertium/apertium-cat,
GPL-2.0 (MORPHOLOGY-COPYING). Complete source snapshot: cat.metadix.gz.
Rebuild with `gzip -dc cat.metadix.gz > cat.metadix` then
`python3 build-morphology.py cat.metadix`. The forms directory maps attested
surface forms to bilingual dictionary lemmas. Lemma equivalents are explicitly
labelled in the UI; they are not presented as conjugated Spanish translations.
