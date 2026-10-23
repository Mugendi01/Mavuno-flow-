import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.resolve(__dirname, "../public/icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function drawFarmPulseIcon(size) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * 0.46;
  const cornerRadius = size * 0.2;

  // Colors
  const darkGreen = { r: 27, g: 67, b: 50, a: 255 };    // #1B4332
  const medGreen = { r: 45, g: 106, b: 79, a: 255 };    // #2D6A4F
  const emerald = { r: 82, g: 183, b: 136, a: 255 };    // #52B788
  const lightMint = { r: 116, g: 198, b: 157, a: 255 }; // #74C69D
  const gold = { r: 234, g: 179, b: 8, a: 255 };        // #EAB308 (Golden ear of wheat)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Rounded rectangle test for base background
      const dxRect = Math.max(Math.abs(x - center) - (center - cornerRadius), 0);
      const dyRect = Math.max(Math.abs(y - center) - (center - cornerRadius), 0);
      const distToCorner = Math.sqrt(dxRect * dxRect + dyRect * dyRect);

      if (distToCorner > cornerRadius) {
        // Transparent outside rounded corner
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Inside base rounded rectangle: default dark green #1B4332
      let color = darkGreen;

      // Inner circular badge
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius * 0.85) {
        color = medGreen;
      }

      // Sprout / leaf shape in center
      // Leaf body: centered at (center, center + size * 0.05)
      const leafDx = (x - center) / (size * 0.32);
      const leafDy = (y - (center + size * 0.02)) / (size * 0.42);
      
      // Heart/drop/leaf parametric approximation: x^2 + (y - sqrt(|x|))^2 <= R^2
      const inLeaf = (leafDx * leafDx + Math.pow(leafDy + Math.abs(leafDx) * 0.5, 2)) < 0.65 && leafDy < 0.7 && leafDy > -0.7;

      if (inLeaf) {
        color = emerald;

        // Central stem line
        if (Math.abs(x - center) <= Math.max(1, size * 0.015)) {
          color = darkGreen;
        }

        // Leaf vein angles
        const veinY1 = center - size * 0.05;
        const veinY2 = center + size * 0.1;
        if (
          (Math.abs((y - veinY1) - (x - center) * 0.6) < Math.max(1, size * 0.012) && x > center && x < center + size * 0.18) ||
          (Math.abs((y - veinY2) + (x - center) * 0.6) < Math.max(1, size * 0.012) && x < center && x > center - size * 0.18)
        ) {
          color = darkGreen;
        }
      }

      // Sun / Golden harvest pulse orb in top right
      const sunDx = x - (center + size * 0.24);
      const sunDy = y - (center - size * 0.22);
      const sunDist = Math.sqrt(sunDx * sunDx + sunDy * sunDy);
      if (sunDist < size * 0.08) {
        color = gold;
      } else if (sunDist < size * 0.10) {
        color = lightMint;
      }

      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = color.a;
    }
  }

  return png;
}

const sizes = [192, 512];

for (const size of sizes) {
  const png = drawFarmPulseIcon(size);
  const outPath = path.resolve(iconsDir, `icon-${size}.png`);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated ${outPath} (${size}x${size}, ${buffer.length} bytes)`);
}

console.log("🌾 All PWA icons generated successfully!");
