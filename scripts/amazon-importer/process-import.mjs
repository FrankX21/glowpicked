#!/usr/bin/env node
/**
 * GlowPicked — Product Import Processor
 *
 * Usage:
 *   node scripts/amazon-importer/process-import.mjs <glow-import-ASIN.json> [category] [tier]
 *
 * Exemples:
 *   node scripts/amazon-importer/process-import.mjs ~/Downloads/glow-import-B00TTD9BRC.json
 *   node scripts/amazon-importer/process-import.mjs ~/Downloads/glow-import-B00TTD9BRC.json serums luxury
 *
 * Nécessite:
 *   ANTHROPIC_API_KEY dans l'environnement (ou ~/.env)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.join(__dirname, '../../site');
const ANALYSES_DIR = path.join(SITE_ROOT, 'data/analyses');

// ── Catégories disponibles ────────────────────────────────────────────────────
const CATEGORIES = [
  'face-moisturizers',
  'serums',
  'cleansers',
  'eye-creams',
  'face-masks',
  'lip-care',
  'retinol-anti-aging',
  'body-care',
  'sunscreen',
  'skincare-tools',
];

const PAGES_DIR = path.join(SITE_ROOT, 'src/pages/reviews');

// ── Utils ─────────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function log(msg) { process.stdout.write(msg + '\n'); }
function dim(msg) { process.stdout.write('\x1b[2m' + msg + '\x1b[0m\n'); }
function ok(msg)  { process.stdout.write('\x1b[32m✓ ' + msg + '\x1b[0m\n'); }
function err(msg) { process.stdout.write('\x1b[31m✗ ' + msg + '\x1b[0m\n'); }
function head(msg){ process.stdout.write('\n\x1b[35m' + msg + '\x1b[0m\n'); }

// ── Résolution de la clé API ──────────────────────────────────────────────────
function resolveApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // Fallback : token Claude Code local
  const tokenPath = path.join(process.env.HOME, '.claude/oauth-token');
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8').trim().split('\n')[0];
    if (token) return token;
  }
  return null;
}

// ── Claude API call ───────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const apiKey = resolveApiKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant. Définis-le ou assure-toi que ~/.claude/oauth-token existe.');

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// ── Calcul GlowScore ──────────────────────────────────────────────────────────
function computeGlowScore(rating, reviewCount, tier, aiScores) {
  // Reviews satisfaction (40%) — basé sur la note Amazon et le volume
  const ratingNorm = Math.min(((rating - 3.5) / 1.5) * 40, 40); // 3.5★ → 0, 5★ → 40
  const volumeBonus = Math.min(Math.log10(Math.max(reviewCount, 1)) / Math.log10(100000) * 5, 5);
  const reviewsScore = Math.max(0, Math.round(ratingNorm + volumeBonus));

  // Ingredients (30%), Safety (15%), Value (15%) — viennent de l'IA
  const total = reviewsScore + (aiScores.ingredients || 0) + (aiScores.safety || 0) + (aiScores.value || 0);

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      reviews: reviewsScore,
      ingredients: aiScores.ingredients || 0,
      safety: aiScores.safety || 0,
      value: aiScores.value || 0,
    },
  };
}

// ── Prompt Claude ─────────────────────────────────────────────────────────────
function buildPrompt(product, category, tier) {
  return `Tu es un expert en cosmétiques et en analyse d'ingrédients beauté pour le site GlowPicked.com.

Analyse ce produit Amazon et génère les données GlowPicked. Réponds UNIQUEMENT en JSON valide, sans markdown.

PRODUIT:
- Nom: ${product.title}
- Marque: ${product.brand}
- ASIN: ${product.asin}
- Note Amazon: ${product.rating}★ (${product.reviewCount?.toLocaleString()} avis)
- Prix: ${product.price}
- Catégorie: ${category}
- Tier: ${tier}
- Ingrédients: ${product.ingredients || 'Non fournis'}
- Description: ${product.bullets?.join(' | ') || 'Non fournie'}

Génère ce JSON (les scores DOIVENT totaliser au maximum 60 — le reste vient des avis Amazon):
{
  "ingredients": <score 0-30, basé sur la qualité des ingrédients actifs>,
  "safety": <score 0-15, basé sur l'absence d'irritants/allergènes>,
  "value": <score 0-15, basé sur le rapport qualité/prix pour le tier ${tier}>,
  "topIngredients": [
    {"name": "<ingrédient 1>", "benefit": "<bénéfice en anglais>"},
    {"name": "<ingrédient 2>", "benefit": "<bénéfice en anglais>"},
    {"name": "<ingrédient 3>", "benefit": "<bénéfice en anglais>"}
  ],
  "verdict": "<2-3 phrases expert en anglais, analytique et précis, sans marketing>",
  "pros": ["<avantage 1>", "<avantage 2>", "<avantage 3>"],
  "con": "<inconvénient principal (1 phrase courte)>"
}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  head('═══════════════════════════════════════════════');
  head('  GlowPicked — Amazon Product Importer v1.0   ');
  head('═══════════════════════════════════════════════');

  // ── Lecture du fichier d'import ──
  const importFile = process.argv[2];
  if (!importFile) {
    err('Usage: node process-import.mjs <glow-import-ASIN.json> [category] [tier]');
    process.exit(1);
  }

  const importPath = path.resolve(importFile);
  if (!fs.existsSync(importPath)) {
    err(`Fichier introuvable: ${importPath}`);
    process.exit(1);
  }

  const product = JSON.parse(fs.readFileSync(importPath, 'utf8'));
  log('');
  ok(`Produit chargé: ${product.title}`);
  dim(`  ASIN: ${product.asin} | ⭐ ${product.rating} | ${product.reviewCount?.toLocaleString()} avis | ${product.price}`);

  // ── Catégorie ──
  let category = process.argv[3];
  if (!category || !CATEGORIES.includes(category)) {
    log('\nCatégories disponibles:');
    CATEGORIES.forEach((c, i) => dim(`  ${i + 1}. ${c}`));
    const catInput = await ask('\nCatégorie (numéro ou nom): ');
    const catNum = parseInt(catInput, 10);
    category = catNum >= 1 && catNum <= CATEGORIES.length
      ? CATEGORIES[catNum - 1]
      : catInput.trim();
    if (!CATEGORIES.includes(category)) {
      err(`Catégorie invalide: ${category}`);
      process.exit(1);
    }
  }
  ok(`Catégorie: ${category}`);

  // ── Tier ──
  let tier = process.argv[4];
  if (!['budget', 'luxury'].includes(tier)) {
    const priceNum = parseFloat((product.price || '0').replace(/[^0-9.]/g, ''));
    const suggested = priceNum > 40 ? 'luxury' : 'budget';
    const tierInput = await ask(`\nTier [budget/luxury] (suggéré: ${suggested}): `);
    tier = ['budget', 'luxury'].includes(tierInput.trim()) ? tierInput.trim() : suggested;
  }
  ok(`Tier: ${tier}`);

  // ── Appel Claude ──
  head('\n⚙  Analyse IA en cours (Claude Haiku)...');
  let aiData;
  try {
    const prompt = buildPrompt(product, category, tier);
    const response = await callClaude(prompt);

    // Extrait le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse Claude invalide: pas de JSON trouvé');
    aiData = JSON.parse(jsonMatch[0]);
    ok('Analyse IA complète');
  } catch (e) {
    err(`Erreur Claude: ${e.message}`);
    process.exit(1);
  }

  // ── Calcul GlowScore ──
  const { total: glowScore, breakdown } = computeGlowScore(
    product.rating || 4.0,
    product.reviewCount || 0,
    tier,
    aiData
  );

  // ── Génère data/analyses/ASIN.json ──
  const analysisData = {
    asin: product.asin,
    glowScore,
    breakdown,
    tier,
    topIngredients: aiData.topIngredients || [],
    verdict: aiData.verdict || '',
    glowAiTopPick: false,
    imageUrl: product.imageUrl || '',
    brand: product.brand || '',
    price: product.price || '',
  };

  fs.mkdirSync(ANALYSES_DIR, { recursive: true });
  const analysisPath = path.join(ANALYSES_DIR, `${product.asin}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2));
  ok(`Fichier analyse créé: data/analyses/${product.asin}.json`);

  // ── Génère l'entrée produit à coller dans le .astro ──
  const pros = aiData.pros || product.bullets?.slice(0, 3) || [];
  const con = aiData.con || '';

  const productEntry = `    {
      name: "${product.title.replace(/"/g, '\\"')}",
      asin: "${product.asin}",
      rating: ${product.rating || 4.5},
      reviewCount: ${product.reviewCount || 0},
      pros: [
${pros.map((p) => `        "${p.replace(/"/g, '\\"')}"`).join(',\n')}
      ],
      con: "${con.replace(/"/g, '\\"')}"
    },`;

  // ── Résultat ──
  head('\n══ RÉSULTAT ══════════════════════════════════');
  log(`\n🌟 GlowScore: ${glowScore}/100`);
  dim(`   Reviews: ${breakdown.reviews}/40 | Ingredients: ${breakdown.ingredients}/30 | Safety: ${breakdown.safety}/15 | Value: ${breakdown.value}/15`);
  log(`\n📄 Colle ce bloc dans src/pages/reviews/${category}.astro`);
  log(`   (dans la section "${tier}:")\n`);
  log('─'.repeat(60));
  log(productEntry);
  log('─'.repeat(60));

  const astroPath = path.join(PAGES_DIR, `${category}.astro`);
  if (fs.existsSync(astroPath)) {
    log(`\n💡 Fichier cible: src/pages/reviews/${category}.astro`);
  }

  // ── Sauvegarde l'entrée produit dans un fichier tmp ──
  const outPath = path.join(__dirname, `out-${product.asin}.txt`);
  fs.writeFileSync(outPath, productEntry);
  dim(`\n(Entrée aussi sauvegardée dans: ${outPath})`);

  log('');
  ok('Import terminé ! Lance "npm run build" pour intégrer le produit.');
  log('');

  rl.close();
}

main().catch((e) => {
  err(e.message);
  process.exit(1);
});
