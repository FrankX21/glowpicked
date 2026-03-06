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

---

## Si l'ASIN est incorrect
1. Récupère le bon ASIN via le bookmarklet
2. Mets à jour dans la page `.astro` concernée
3. Mets à jour le fichier `site/data/analyses/ASIN.json` (renommer + corriger le champ asin)
4. Lance `npm run build` dans `site/`
5. Coche ✅ dans ce fichier

---

*Créé le 2026-03-06*
