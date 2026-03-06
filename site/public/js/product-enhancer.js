/**
 * GlowPicked Product Enhancer
 *
 * Priority:
 * 1. window.GLOW_IMAGES manifest (generated at build from data/analyses/*.json)
 * 2. PA-API via /api/amazon-product (requires Amazon credentials)
 *
 * Gracefully degrades if neither is available.
 */
(function () {
  'use strict';

  var cards = document.querySelectorAll('[data-asin]');
  if (cards.length === 0) return;

  var asins = Array.from(cards).map(function (c) { return c.getAttribute('data-asin'); }).filter(Boolean);
  if (asins.length === 0) return;

  function injectImage(card, imageUrl, altText) {
    if (!imageUrl || card.querySelector('.product-image')) return;
    var wrap = document.createElement('div');
    wrap.className = 'product-image';
    wrap.style.cssText = 'text-align:center;margin-bottom:1rem;';
    var img = document.createElement('img');
    img.src = imageUrl;
    img.alt = altText || 'Product image';
    img.loading = 'lazy';
    img.style.cssText = 'max-height:200px;max-width:100%;border-radius:8px;object-fit:contain;transition:transform .2s;';
    img.onmouseover = function () { this.style.transform = 'scale(1.04)'; };
    img.onmouseout  = function () { this.style.transform = 'scale(1)'; };
    wrap.appendChild(img);
    card.insertBefore(wrap, card.firstChild);
  }

  function injectPrice(card, price) {
    if (!price || card.querySelector('.product-price')) return;
    var el = document.createElement('div');
    el.className = 'product-price';
    el.style.cssText = 'font-size:1.3rem;font-weight:700;color:#e91e63;text-align:center;margin:0.5rem 0;';
    el.textContent = price;
    var cta = card.querySelector('.cta-button');
    if (cta) card.insertBefore(el, cta);
  }

  // ── 1. Manifeste local (build-time, instantané) ───────────────────────────
  var manifest = window.GLOW_IMAGES || {};
  var missing = [];

  asins.forEach(function (asin) {
    var card = document.querySelector('[data-asin="' + asin + '"]');
    if (!card) return;
    if (manifest[asin]) {
      injectImage(card, manifest[asin], card.querySelector('.product-name')?.textContent);
    } else {
      missing.push(asin);
    }
  });

  if (missing.length === 0) return; // Tout est couvert par le manifeste

  // ── 2. Fallback PA-API pour les ASINs sans image dans le manifeste ─────────
  var batches = [];
  for (var i = 0; i < missing.length; i += 10) {
    batches.push(missing.slice(i, i + 10));
  }

  batches.forEach(function (batch) {
    fetch('/api/amazon-product?asins=' + batch.join(','))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.products) return;
        data.products.forEach(function (product) {
          var card = document.querySelector('[data-asin="' + product.asin + '"]');
          if (!card) return;
          if (product.imageUrl) injectImage(card, product.imageUrl, product.title);
          if (product.price) injectPrice(card, product.price);
        });
      })
      .catch(function () { /* Silently degrade */ });
  });
})();
