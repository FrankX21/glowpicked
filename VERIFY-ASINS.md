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

| # | Produit | ASIN original | ASIN corrigé | Page | Status |
|---|---------|---------------|--------------|------|--------|
| 1 | Fresh Soy Face Cleanser | B002PNPAFQ | B00AU9EBTC | cleansers.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 2 | Tatcha The Rice Polish | B00J455CKK | B092MTC96K | cleansers.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 3 | Kiehl's Creamy Eye Treatment | B000NZFPLM | B000S97MAY | eye-creams.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 4 | IT Cosmetics Bye Bye Under Eye | B00KBIYQBS | B01MXW3T2Y | eye-creams.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 5 | Ole Henriksen Banana Bright | B07MNPFQ59 | B0BW7V1QBL | eye-creams.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 6 | Augustinus Bader Body Cream | B07Z8P3R9L | Remplacé par Kiehl's Creme de Corps B000S97MUY | body-care.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 7 | Jo Malone Body Cream | B01NBRDXSL | Remplacé par L'Occitane Shea Butter B09JZRX753 | body-care.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 8 | La Roche-Posay Cicaplast B5 | B071XHNZPJ | B0F6CH7BQ1 | body-care.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 9 | SkinCeuticals C E Ferulic | B00JMKNHP4 | B01HJTA77A | serums.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 10 | Lancôme Advanced Génifique | B01MTUCAHY | Remplacé par Estée Lauder ANR B08DHQCGH9 | serums.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 11 | SK-II Facial Treatment Essence | B075F5TZRY | B000H723LU | serums.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 12 | Medik8 Retinol 0.3% | B086DLMJPX | Remplacé par Drunk Elephant A-Passioni B08TGGGZM5 | retinol-anti-aging.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 13 | Kiehl's Retinol Serum | B00JZVFG1Q | Remplacé par Paula's Choice 1% Retinol B00L5O2ZXK | retinol-anti-aging.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 14 | SkinCeuticals Retinol 0.3 | B07NSJNJY8 | Remplacé par Sunday Riley A+ B0B7JT39KP | retinol-anti-aging.astro (luxury) | ✅ Remplacé 2026-03-07 |
| 15 | Kiehl's Lip Balm #1 | B00E3YJHGY | B00GSH0KR2 | lip-care.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 16 | Drunk Elephant Lippe Balm | B07MQVQHPV | B0CN3QNN3T | lip-care.astro (luxury) | ✅ Corrigé 2026-03-07 |
| 17 | Fresh Sugar Lip Treatment | B00VHFWG9Y | B0B69CMXRB | lip-care.astro (luxury) | ✅ Corrigé 2026-03-07 |

---

## Résultat

**17/17 ASINs vérifiés et corrigés le 2026-03-07.**

Méthode utilisée : navigation directe Amazon via Chrome + WebSearch pour trouver les bons ASINs.
Build Astro validé (16 pages, 514ms) avant commit.

---

*Créé le 2026-03-06 | Complété le 2026-03-07*
