#!/usr/bin/env node
/**
 * Ajoute imageUrl officielle Amazon Associates (SiteStripe format) à tous les JSON existants.
 * URL 100% légale pour les affiliés Amazon — générée par le programme Associates.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANALYSES_DIR = path.join(__dirname, '../site/data/analyses');
const TAG = 'glowpicked0c-20';

// Format officiel Amazon Associates SiteStripe image
function getAmazonImageUrl(asin) {
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=${TAG}&language=en_US`;
}

const files = fs.readdirSync(ANALYSES_DIR).filter(f => f.endsWith('.json'));
let updated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(ANALYSES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (data.imageUrl && !data.imageUrl.includes('amazon-adsystem')) {
    // Déjà une image custom (ex: m.media-amazon.com) → on garde
    skipped++;
    continue;
  }

  data.imageUrl = getAmazonImageUrl(data.asin);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  updated++;
  console.log(`✓ ${data.asin} → imageUrl ajoutée`);
}

console.log(`\nTerminé: ${updated} mis à jour, ${skipped} déjà avec image custom.`);
