(function () {
  'use strict';

  // ── 1. Vérifie qu'on est sur une page produit Amazon ──────────────────────
  const asinMatch = location.href.match(/\/dp\/([A-Z0-9]{10})/);
  if (!asinMatch) {
    alert('GlowPicked Importer :\nNavigue vers une page produit Amazon (URL contenant /dp/ASIN).');
    return;
  }
  const asin = asinMatch[1];

  // ── 2. Extraction des données ──────────────────────────────────────────────

  // Titre
  const title = (
    document.getElementById('productTitle') ||
    document.querySelector('h1.product-title-word-break')
  )?.textContent?.trim() || '';

  // Marque
  let brand = (
    document.getElementById('bylineInfo') ||
    document.querySelector('.po-brand .po-break-word') ||
    document.querySelector('#brand')
  )?.textContent?.trim() || '';
  brand = brand
    .replace(/^(Visit the |Visiter le magasin |Brand: |Marque : )/i, '')
    .replace(/\s+Store$/i, '')
    .replace(/\s+Boutique$/i, '')
    .trim();

  // Note / étoiles
  const ratingEl =
    document.getElementById('acrPopover') ||
    document.querySelector('[data-hook="average-star-rating"] span');
  const ratingText = ratingEl?.getAttribute('title') || ratingEl?.textContent || '';
  const rating = parseFloat(ratingText.replace(',', '.')) || null;

  // Nombre d'avis
  const reviewEl =
    document.getElementById('acrCustomerReviewText') ||
    document.querySelector('[data-hook="total-review-count"]');
  const reviewText = reviewEl?.textContent?.trim() || '0';
  const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, ''), 10) || 0;

  // Prix
  const priceEl =
    document.querySelector('.a-price .a-offscreen') ||
    document.getElementById('priceblock_ourprice') ||
    document.querySelector('[data-asin] .a-price .a-offscreen') ||
    document.querySelector('#apex_offerDisplay_desktop .a-price .a-offscreen');
  const price = priceEl?.textContent?.trim() || '';

  // Image principale (haute résolution si disponible)
  const imgEl =
    document.getElementById('landingImage') ||
    document.getElementById('imgBlkFront') ||
    document.querySelector('#main-image-container img');
  const imageUrl =
    imgEl?.getAttribute('data-old-hires') ||
    imgEl?.getAttribute('data-a-dynamic-image')?.match(/"(https[^"]+)"/)?.[1] ||
    imgEl?.getAttribute('src') ||
    '';

  // Points forts (bullets)
  const bullets = Array.from(
    document.querySelectorAll('#feature-bullets li span:not(.aok-hidden)')
  )
    .map((el) => el.textContent.trim())
    .filter((t) => t.length > 10)
    .slice(0, 8);

  // Ingrédients (section détails produit)
  let ingredients = '';
  const allRows = document.querySelectorAll(
    '#productDetails_techSpec_section_1 tr, ' +
    '#productDetails_db_sections tr, ' +
    '#prodDetails tr, ' +
    '.a-expander-content tr'
  );
  allRows.forEach((row) => {
    const label = (
      row.querySelector('th') ||
      row.querySelector('td:first-child')
    )?.textContent?.trim() || '';
    if (/ingredient|ingrédient/i.test(label)) {
      ingredients = row.querySelector('td:last-child')?.textContent?.trim() || '';
    }
  });

  // Catégorie détectée depuis les breadcrumbs
  const breadcrumbs = Array.from(document.querySelectorAll('#wayfinding-breadcrumbs_feature_div a'))
    .map((a) => a.textContent.trim())
    .join(' > ');

  // ── 3. Construit l'objet JSON ──────────────────────────────────────────────
  const data = {
    asin,
    title,
    brand,
    rating,
    reviewCount,
    price,
    imageUrl,
    bullets,
    ingredients,
    breadcrumbs,
    sourceUrl: location.href,
    importedAt: new Date().toISOString(),
  };

  // ── 4. Télécharge le fichier JSON ──────────────────────────────────────────
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `glow-import-${asin}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);

  // ── 5. Confirmation visuelle ───────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'top:20px', 'right:20px', 'z-index:2147483647',
    'background:linear-gradient(135deg,#e91e63,#9c27b0)',
    'color:white', 'padding:14px 18px', 'border-radius:12px',
    'font-size:14px', 'font-family:-apple-system,sans-serif',
    'box-shadow:0 6px 24px rgba(0,0,0,0.35)', 'max-width:320px',
    'line-height:1.5',
  ].join(';');
  overlay.innerHTML = `
    <div style="font-weight:700;font-size:16px;margin-bottom:4px">✨ GlowPicked — Importé !</div>
    <div style="opacity:.9">${title.substring(0, 50)}${title.length > 50 ? '…' : ''}</div>
    <div style="opacity:.7;font-size:12px;margin-top:6px">
      ASIN: ${asin} &nbsp;·&nbsp; ⭐ ${rating ?? '?'} &nbsp;·&nbsp; ${reviewCount.toLocaleString()} avis
    </div>
    <div style="opacity:.7;font-size:12px">Fichier: glow-import-${asin}.json téléchargé</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 5000);
})();
