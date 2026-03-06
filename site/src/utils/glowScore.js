/**
 * GlowScore System — GlowPicked
 *
 * Formula: Reviews satisfaction 40% + Ingredient science 30% + Safety profile 15% + Value for money 15%
 *
 * Scores are loaded from data/analyses/[asin].json
 * This module provides helpers to retrieve and compute display data.
 */

import fs from 'fs';
import path from 'path';

const ANALYSES_DIR = path.join(process.cwd(), 'data/analyses');

/**
 * Load GlowScore analysis for a given ASIN.
 * Returns null if no file found.
 * @param {string} asin
 * @returns {Object|null}
 */
export function getGlowScore(asin) {
  const filePath = path.join(ANALYSES_DIR, `${asin}.json`);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Enrich a list of products with their GlowScore data.
 * Products without a matching analysis file are returned as-is
 * with a null glowData field.
 * @param {Array} products
 * @returns {Array}
 */
export function enrichWithGlowScores(products) {
  return products.map(p => ({
    ...p,
    glowData: getGlowScore(p.asin)
  }));
}

/**
 * Determine the Top Pick in a tier based on glowScore.
 * Falls back to first item if no scores available.
 * @param {Array} products - Products enriched with glowData
 * @returns {number} index of the top pick
 */
export function getTopPickIndex(products) {
  let bestIdx = 0;
  let bestScore = -1;
  products.forEach((p, i) => {
    const score = p.glowData ? p.glowData.glowScore : 0;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });
  return bestIdx;
}

/**
 * Return the CSS color class for a given GlowScore value.
 * < 70    → orange
 * 70-84   → blue
 * 85+     → gradient pink-purple (premium)
 * @param {number} score
 * @returns {string}
 */
export function getScoreColorClass(score) {
  if (score >= 85) return 'score-premium';
  if (score >= 70) return 'score-good';
  return 'score-average';
}

/**
 * Compute the visual gradient for the score bar.
 * @param {number} score
 * @returns {string} CSS gradient string
 */
export function getScoreGradient(score) {
  if (score >= 85) return 'linear-gradient(90deg, #e91e63, #9c27b0)';
  if (score >= 70) return 'linear-gradient(90deg, #1976d2, #42a5f5)';
  return 'linear-gradient(90deg, #f57c00, #ffb74d)';
}
