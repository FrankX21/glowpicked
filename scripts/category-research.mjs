#!/usr/bin/env node
/**
 * GlowPicked — Category Research Tool
 *
 * Demande à Claude Haiku de lister les meilleurs produits d'une catégorie,
 * génère un GlowScore pour chacun, et sauvegarde les analyses.
 * ⚠ Les ASINs proviennent de la mémoire de Haiku — VÉRIFIER avant de publier
 *    (utilise le bookmarklet sur la page Amazon du produit).
 *
 * Usage:
 *   node scripts/category-research.mjs <category> <tier> [count]
 *
 * Exemples:
 *   node scripts/category-research.mjs eye-creams luxury 20
 *   node scripts/category-research.mjs cleansers budget 25
 *   node scripts/category-research.mjs serums luxury 30
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANALYSES_DIR = path.join(__dirname, '../site/data/analyses');
const TAG = 'glowpicked0c-20';
const MIN_REVIEWS = 500;

const CATEGORIES = [
  'face-moisturizers', 'serums', 'cleansers', 'eye-creams',
  'face-masks', 'lip-care', 'retinol-anti-aging', 'body-care',
  'sunscreen', 'skincare-tools',
];

// ── Utils ────────────────────────────────────────────────────────────────────
function log(msg)  { process.stdout.write(msg + '\n'); }
function dim(msg)  { process.stdout.write('\x1b[2m' + msg + '\x1b[0m\n'); }
function ok(msg)   { process.stdout.write('\x1b[32m✓ ' + msg + '\x1b[0m\n'); }
function warn(msg) { process.stdout.write('\x1b[33m⚠ ' + msg + '\x1b[0m\n'); }
function err(msg)  { process.stdout.write('\x1b[31m✗ ' + msg + '\x1b[0m\n'); }
function head(msg) { process.stdout.write('\n\x1b[35m' + msg + '\x1b[0m\n'); }

function resolveApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const tokenPath = path.join(process.env.HOME, '.claude/oauth-token');
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8').trim().split('\n')[0];
    if (token) return token;
  }
  return null;
}

async function callClaude(prompt, maxTokens = 4096) {
  const apiKey = resolveApiKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

// ── GlowScore (identique à process-import.mjs) ──────────────────────────────
function computeGlowScore(rating, reviewCount, aiScores) {
  const ratingNorm = Math.min(((rating - 3.5) / 1.5) * 40, 40);
  const volumeBonus = Math.min(Math.log10(Math.max(reviewCount, 1)) / Math.log10(100000) * 5, 5);
  const reviewsScore = Math.max(0, Math.round(ratingNorm + volumeBonus));
  const total = reviewsScore + (aiScores.ingredients || 0) + (aiScores.safety || 0) + (aiScores.value || 0);
  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      reviewsSatisfaction: reviewsScore,
      ingredientScience: aiScores.ingredients || 0,
      safetyProfile: aiScores.safety || 0,
      valueForMoney: aiScores.value || 0,
    },
  };
}

function getImageUrl(asin) {
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=${TAG}&language=en_US`;
}

// ── Prompts ──────────────────────────────────────────────────────────────────
function buildListPrompt(category, tier, count) {
  const tierDesc = tier === 'budget'
    ? 'budget/drugstore (under $30 USD)'
    : 'luxury/prestige (over $30 USD)';

  return `You are a skincare expert and Amazon marketplace specialist. List real, popular ${tier} ${category.replace(/-/g, ' ')} products sold on Amazon.com.

CRITICAL RULES:
1. Only real products from established brands you are highly confident about
2. Minimum ${MIN_REVIEWS} Amazon customer reviews per product
3. Rating 4.0 or higher
4. Tier: ${tierDesc}
5. ASIN: provide ONLY if you are highly confident (10-char starting with B) — otherwise use ""
6. Do NOT invent products or fabricate ASINs

Respond ONLY with a valid JSON array of exactly ${count} products, no markdown:

[{"name":"<full name>","brand":"<brand>","asin":"<B0XXXXXXXX or empty>","rating":<4.0-5.0>,"reviewCount":<number>,"price":"<$XX>"}]`;
}

function buildAnalysisPrompt(products, category, tier) {
  const list = products.map((p, i) =>
    `${i + 1}. ${p.name} by ${p.brand} (${p.rating}★, ${p.reviewCount} reviews)`
  ).join('\n');

  return `You are a skincare ingredient expert. Analyze these ${tier} ${category.replace(/-/g, ' ')} products for GlowPicked.com.

PRODUCTS:
${list}

For EACH product provide ingredient analysis. Respond ONLY with a valid JSON array (same order as input), no markdown:

[
  {
    "ingredients": <0-30 ingredient quality score>,
    "safety": <0-15 safety profile score>,
    "value": <0-15 value for ${tier} tier score>,
    "topIngredients": ["<ingredient 1>","<ingredient 2>","<ingredient 3>"],
    "verdict": "<2-3 expert sentences in English>",
    "pros": ["<pro 1>","<pro 2>","<pro 3>"],
    "con": "<main downside, one short sentence>"
  }
]`;
}

function buildResearchPrompt(category, tier, count) {
  // Legacy single-call prompt for small counts
  const tierDesc = tier === 'budget'
    ? 'budget/drugstore (under $30 USD)'
    : 'luxury/prestige (over $30 USD)';

  return `You are a skincare expert and Amazon marketplace specialist. Generate a list of real, popular ${tier} ${category.replace(/-/g, ' ')} products sold on Amazon.com.

CRITICAL RULES — non-negotiable:
1. Only include products you are HIGHLY CONFIDENT are real and currently sold on Amazon
2. Minimum ${MIN_REVIEWS} Amazon customer reviews per product
3. Only include products from established, well-known brands
4. For each product, provide the Amazon ASIN (10-char alphanumeric starting with B0 or B) ONLY if you are highly confident it is correct — otherwise leave "asin" as ""
5. Tier: ${tierDesc}
6. Rating must be 4.0 or higher
7. Do NOT invent products, exaggerate reviews, or fabricate ASINs

Generate exactly ${count} products. Respond ONLY with a valid JSON array, no markdown, no explanation:

[
  {
    "name": "<full product name>",
    "brand": "<brand name>",
    "asin": "<B0XXXXXXXX or empty string if not confident>",
    "rating": <4.0-5.0>,
    "reviewCount": <estimated number, must be >= ${MIN_REVIEWS}>,
    "price": "<$XX>",
    "ingredients": <score 0-30 for ingredient quality>,
    "safety": <score 0-15 for safety profile>,
    "value": <score 0-15 for value for the ${tier} tier>,
    "topIngredients": ["<ingredient 1>", "<ingredient 2>", "<ingredient 3>"],
    "verdict": "<2-3 expert sentences in English, analytical not marketing>",
    "pros": ["<pro 1>", "<pro 2>", "<pro 3>"],
    "con": "<main downside, one short sentence>"
  }
]`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const category = process.argv[2];
  const tier = process.argv[3];
  const count = parseInt(process.argv[4] || '20', 10);

  // Validation
  if (!category || !CATEGORIES.includes(category)) {
    err(`Catégorie invalide. Options: ${CATEGORIES.join(', ')}`);
    process.exit(1);
  }
  if (!['budget', 'luxury'].includes(tier)) {
    err('Tier invalide. Options: budget, luxury');
    process.exit(1);
  }
  if (count < 5 || count > 200) {
    err('Count doit être entre 5 et 200');
    process.exit(1);
  }

  head('══════════════════════════════════════════════════');
  head(`  GlowPicked — Category Research: ${category} (${tier})`);
  head('══════════════════════════════════════════════════');
  log(`\nRecherche de ${count} produits via Claude Haiku...`);
  warn('Les ASINs viennent de la mémoire de Haiku — VÉRIFIER avant de publier\n');

  // ── Helper : parse JSON robuste ──────────────────────────────────────────
  function parseJsonRobust(text) {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Pas de JSON array trouvé');
    let raw = match[0]
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(raw); } catch { /* continue */ }
    // Fallback : objets individuels
    const objs = raw.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g) || [];
    const parsed = [];
    for (const o of objs) { try { parsed.push(JSON.parse(o)); } catch { /* skip */ } }
    if (parsed.length === 0) throw new Error('Impossible de parser JSON');
    return parsed;
  }

  // ── Phase 1 : liste des produits (batches de 25) ────────────────────────
  const LIST_BATCH = 25;
  let productList = [];

  if (count <= 15) {
    // Passe unique avec analyse intégrée
    log(`\nPhase 1/1 — Analyse complète (${count} produits)...`);
    try {
      const response = await callClaude(buildResearchPrompt(category, tier, count), 6000);
      productList = parseJsonRobust(response);
      ok(`${productList.length} produits reçus`);
    } catch (e) {
      err(`Erreur: ${e.message}`); process.exit(1);
    }
  } else {
    const totalBatches = Math.ceil(count / LIST_BATCH);
    log(`\nPhase 1/${totalBatches + 1} — Liste des produits (${count} items en ${totalBatches} batches de ${LIST_BATCH})...`);
    const seen = new Set();

    for (let b = 0; b < totalBatches; b++) {
      const remaining = count - productList.length;
      const batchSize = Math.min(LIST_BATCH, remaining);
      const offset = b * LIST_BATCH;
      dim(`  Batch liste ${b + 1}/${totalBatches} (produits ${offset + 1}-${offset + batchSize})...`);

      // Modifier le prompt pour éviter les doublons
      const seenNames = productList.map(p => p.name).join(', ');
      const prompt = buildListPrompt(category, tier, batchSize) +
        (seenNames ? `\n\nDO NOT repeat these already-listed products: ${seenNames.substring(0, 500)}` : '');

      try {
        const response = await callClaude(prompt, 4096);
        const batch = parseJsonRobust(response);
        for (const p of batch) {
          const key = (p.name || '').toLowerCase().trim();
          if (!seen.has(key)) { seen.add(key); productList.push(p); }
        }
        ok(`  +${batch.length} produits (total: ${productList.length})`);
      } catch (e) {
        warn(`  Batch ${b + 1} échoué: ${e.message}`);
      }
    }
    ok(`Phase 1 terminée: ${productList.length} produits uniques listés`);

    // ── Phase 2 : analyse ingrédients (batches de 15) ──────────────────────
    const ANALYSIS_BATCH = 15;
    const analysisBatches = Math.ceil(productList.length / ANALYSIS_BATCH);
    let analyses = [];
    log(`\nPhase 2/${totalBatches + 1} — Analyse ingrédients (${analysisBatches} batches de ${ANALYSIS_BATCH})...`);

    for (let i = 0; i < productList.length; i += ANALYSIS_BATCH) {
      const batch = productList.slice(i, i + ANALYSIS_BATCH);
      dim(`  Batch analyse ${Math.floor(i / ANALYSIS_BATCH) + 1}/${analysisBatches}...`);
      try {
        const response = await callClaude(buildAnalysisPrompt(batch, category, tier), 4096);
        const batchAnalyses = parseJsonRobust(response);
        analyses.push(...batchAnalyses);
        ok(`  Batch ${Math.floor(i / ANALYSIS_BATCH) + 1} terminé`);
      } catch (e) {
        warn(`  Batch échoué, scores par défaut: ${e.message}`);
        batch.forEach(() => analyses.push({
          ingredients: 20, safety: 10, value: 10,
          topIngredients: [], verdict: '', pros: [], con: ''
        }));
      }
    }
    productList = productList.map((p, i) => ({ ...p, ...(analyses[i] || {}) }));
  }

  let products = productList;

  // ── Filtrage ──
  const valid = products.filter(p => {
    if (!p.name || !p.brand) return false;
    if ((p.reviewCount || 0) < MIN_REVIEWS) return false;
    if ((p.rating || 0) < 4.0) return false;
    return true;
  });

  const filtered = products.length - valid.length;
  if (filtered > 0) warn(`${filtered} produit(s) filtrés (< ${MIN_REVIEWS} avis ou note < 4.0)`);

  if (valid.length === 0) {
    err('Aucun produit valide après filtrage');
    process.exit(1);
  }

  // ── Calcul GlowScore + sauvegarde ──
  fs.mkdirSync(ANALYSES_DIR, { recursive: true });
  const results = [];
  let saved = 0;
  let noAsin = 0;

  for (const p of valid) {
    const { total: glowScore, breakdown } = computeGlowScore(
      p.rating,
      p.reviewCount,
      { ingredients: p.ingredients, safety: p.safety, value: p.value }
    );

    const asin = (p.asin || '').trim();
    const hasAsin = /^B0[A-Z0-9]{8}$/.test(asin) || /^B[0-9A-Z]{9}$/.test(asin);
    if (!hasAsin) noAsin++;

    const analysisData = {
      asin: hasAsin ? asin : `PENDING_${p.brand.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
      glowScore,
      breakdown,
      tier,
      topIngredients: p.topIngredients || [],
      verdict: p.verdict || '',
      glowAiTopPick: false,
      imageUrl: hasAsin ? getImageUrl(asin) : '',
      brand: p.brand || '',
      price: p.price || '',
      // Métadonnées de recherche
      _research: {
        name: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        pros: p.pros || [],
        con: p.con || '',
        asinVerified: false,
        asinFromHaiku: hasAsin,
        category,
      },
    };

    if (hasAsin) {
      const outPath = path.join(ANALYSES_DIR, `${asin}.json`);
      // Ne pas écraser un fichier existant (produit déjà importé manuellement)
      if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, JSON.stringify(analysisData, null, 2));
        saved++;
      }
    }

    results.push({ ...analysisData, _name: p.name, _hasAsin: hasAsin, _asin: asin });
  }

  // ── Classement par GlowScore ──
  results.sort((a, b) => b.glowScore - a.glowScore);

  // ── Rapport terminal ──
  head('\n══ CLASSEMENT ════════════════════════════════════');
  log('');
  log(`${'#'.padEnd(3)} ${'GlowScore'.padEnd(11)} ${'ASIN'.padEnd(12)} ${'Avis'.padEnd(8)} ${'Marque'.padEnd(20)} Produit`);
  log('─'.repeat(90));

  results.forEach((p, i) => {
    const rank = String(i + 1).padEnd(3);
    const score = String(p.glowScore + '/100').padEnd(11);
    const asinDisplay = p._hasAsin ? p._asin.padEnd(12) : '⚠ MANQUE   ';
    const reviews = String((p._research.reviewCount || 0).toLocaleString()).padEnd(8);
    const brand = (p.brand || '').substring(0, 18).padEnd(20);
    const name = (p._name || '').substring(0, 45);
    log(`${rank} ${score} ${asinDisplay} ${reviews} ${brand} ${name}`);
  });

  // ── Entrées .astro pour les top 3 ──
  head('\n══ TOP 3 — Coller dans ' + category + '.astro (' + tier + ':) ══');
  log('');
  results.slice(0, 3).forEach((p) => {
    const pros = p._research.pros || [];
    const con = p._research.con || '';
    log(`    {`);
    log(`      "name": "${(p._name || '').replace(/"/g, '\\"')}",`);
    log(`      "asin": "${p._hasAsin ? p._asin : 'VÉRIFIER_ASIN'}",`);
    log(`      "rating": ${p._research.rating},`);
    log(`      "reviewCount": ${p._research.reviewCount},`);
    log(`      "pros": [`);
    pros.forEach((pro, i) => log(`        "${pro.replace(/"/g, '\\"')}"${i < pros.length - 1 ? ',' : ''}`));
    log(`      ],`);
    log(`      "con": "${con.replace(/"/g, '\\"')}"`);
    log(`    },`);
    log('');
  });

  // ── Résumé ──
  head('\n══ RÉSUMÉ ═══════════════════════════════════════');
  ok(`${valid.length} produits analysés`);
  ok(`${saved} analyses sauvegardées dans data/analyses/`);
  if (noAsin > 0) warn(`${noAsin} produit(s) sans ASIN confirmé (⚠ dans le tableau ci-dessus)`);
  log('');
  warn('AVANT DE PUBLIER: Vérifie chaque ASIN avec le bookmarklet sur la page Amazon du produit');
  dim('  → ouvre scripts/amazon-importer/setup.html pour installer le bookmarklet');
  log('');
  ok('Recherche terminée. Lance "npm run build" dans site/ pour mettre à jour le manifeste images.');
  log('');
}

main().catch((e) => {
  err(e.message);
  process.exit(1);
});
