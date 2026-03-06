# ASINs à vérifier avant le prochain push

Ces produits ont été ajoutés manuellement. Vérifie chaque ASIN avec le bookmarklet
sur la page Amazon du produit (scripts/amazon-importer/setup.html).

## Comment vérifier
1. Ouvre `scripts/amazon-importer/setup.html` dans Chrome
2. Installe le bookmarklet (drag vers la barre de favoris)
3. Va sur la page Amazon du produit
4. Clique le bookmarklet — il affiche l'ASIN réel en haut de la page
5. Compare avec l'ASIN dans le tableau ci-dessous

---

## Produits à vérifier

| # | Produit | ASIN actuel | Page | Status |
|---|---------|-------------|------|--------|
| 1 | Fresh Soy Face Cleanser | B002PNPAFQ | cleansers.astro (luxury) | ⬜ À vérifier |
| 2 | Tatcha The Rice Polish Foaming Enzyme Powder | B00J455CKK | cleansers.astro (luxury) | ⬜ À vérifier |
| 3 | Kiehl's Creamy Eye Treatment with Avocado | B000NZFPLM | eye-creams.astro (luxury) | ⬜ À vérifier |
| 4 | IT Cosmetics Bye Bye Under Eye Eye Cream | B00KBIYQBS | eye-creams.astro (luxury) | ⬜ À vérifier |
| 5 | Ole Henriksen Banana Bright Eye Crème | B07MNPFQ59 | eye-creams.astro (luxury) | ⬜ À vérifier |
| 6 | Augustinus Bader The Rich Body Cream | B07Z8P3R9L | body-care.astro (luxury) | ⬜ À vérifier |
| 7 | Jo Malone English Oak & Hazelnut Body Cream | B01NBRDXSL | body-care.astro (luxury) | ⬜ À vérifier |
| 8 | La Roche-Posay Cicaplast Balm B5 Body | B071XHNZPJ | body-care.astro (luxury) | ⬜ À vérifier |
| 9 | SkinCeuticals C E Ferulic Serum | B00JMKNHP4 | serums.astro (luxury) | ⬜ À vérifier |
| 10 | Lancôme Advanced Génifique Youth Activating Serum | B01MTUCAHY | serums.astro (luxury) | ⬜ À vérifier |
| 11 | SK-II Facial Treatment Essence | B075F5TZRY | serums.astro (luxury) | ⬜ À vérifier |
| 12 | Medik8 Retinol 0.3% + TR Serum | B086DLMJPX | retinol-anti-aging.astro (luxury) | ⬜ À vérifier |
| 13 | Kiehl's Retinol Skin-Renewing Serum | B00JZVFG1Q | retinol-anti-aging.astro (luxury) | ⬜ À vérifier |
| 14 | SkinCeuticals Retinol 0.3 Night Cream | B07NSJNJY8 | retinol-anti-aging.astro (luxury) | ⬜ À vérifier |
| 15 | Kiehl's Lip Balm #1 | B00E3YJHGY | lip-care.astro (luxury) | ⬜ À vérifier |
| 16 | Drunk Elephant Lippe Balm | B07MQVQHPV | lip-care.astro (luxury) | ⬜ À vérifier |
| 17 | Fresh Sugar Advanced Therapy Lip Treatment | B00VHFWG9Y | lip-care.astro (luxury) | ⬜ À vérifier |

---

## Si l'ASIN est incorrect
1. Récupère le bon ASIN via le bookmarklet
2. Mets à jour dans la page `.astro` concernée
3. Mets à jour le fichier `site/data/analyses/ASIN.json` (renommer + corriger le champ asin)
4. Lance `npm run build` dans `site/`
5. Coche ✅ dans ce fichier

---

*Créé le 2026-03-06*
