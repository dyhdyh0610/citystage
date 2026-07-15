/**
 * Strip the white background from every icon-*.png under
 * public/images/. The original generation prompts asked for
 * "white background", which left every icon on an opaque white
 * square. We replace the white with transparency using a soft
 * distance-from-white transform so anti-aliased edges (off-white
 * pixels around the icon stroke) become semi-transparent rather
 * than hard-edged halos.
 *
 * For each input:
 *   • Add an alpha channel.
 *   • Compute alpha = 1 - smoothstep(220, 250, mean(R, G, B)).
 *     This means pure white (>=250) is fully transparent, the
 *     edge band 220..250 ramps alpha from 1.0 → 0.0, and any
 *     non-white pixel keeps alpha 1.0.
 *   • Composite onto a transparent background, write back to
 *     disk as PNG.
 *
 * The script is idempotent.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '../public/images');

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^icon-.+\.png$/.test(f));

if (files.length === 0) {
  console.log('No icon-*.png files found.');
  process.exit(0);
}

/**
 * Build an alpha mask where bright (white-ish) pixels become
 * transparent and the rest stays opaque. We work on a raw
 * RGB buffer for speed.
 *
 *   alpha = 1 - smoothstep(L1, L2, luma)
 *
 * where luma is the per-pixel mean of R/G/B (matches the
 * perceived whiteness closely enough for an icon), L1 = 220
 * (start of soft fade), L2 = 250 (fully white).
 */
async function stripWhiteToAlpha(inputPath, outputPath) {
  const img = sharp(inputPath);
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const total = width * height;

  for (let i = 0; i < total; i++) {
    const r = data[i * channels + 0];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const luma = (r + g + b) / 3;

    let alpha = 255;
    if (luma >= 250) {
      alpha = 0;
    } else if (luma > 220) {
      // smoothstep 220 → 250, output 255 → 0
      const t = (luma - 220) / 30;
      const s = t * t * (3 - 2 * t);
      alpha = Math.round(255 * (1 - s));
    }
    // else: alpha stays 255 (opaque — non-white pixel)

    data[i * channels + 3] = alpha;
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);
}

(async () => {
  let total = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    try {
      const meta = await sharp(p).metadata();
      if (meta.hasAlpha) {
        // Already has alpha (e.g. chip-*.png with gradient).
        // We still want to fade any white edges into transparency,
        // so we re-run through the same pipeline.
      }
      await stripWhiteToAlpha(p, p);
      total++;
    } catch (e) {
      console.error('FAIL', f, e.message);
    }
  }
  console.log(`Processed ${total} icon(s).`);
})();
