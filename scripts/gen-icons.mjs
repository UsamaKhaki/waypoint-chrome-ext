import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'public/icon.svg'), 'utf8');

const sizes = [16, 32, 48, 128];

mkdirSync(join(root, 'public/icons'), { recursive: true });

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const png = resvg.render().asPng();
  const out = join(root, 'public/icons', `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`✓ icon-${size}.png`);
}

// Also write 128 as icon.png for manifest default
writeFileSync(join(root, 'public/icon.png'), (() => {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 128 } });
  return resvg.render().asPng();
})());
console.log('✓ icon.png (128px)');
