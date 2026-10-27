import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings.store';

// ── Color utilities ─────────────────────────────────────────────────────────

function parseColor(raw: string): [number, number, number] | null {
  raw = raw.trim();
  if (!raw || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)') return null;

  // rgb / rgba
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(raw);
  if (rgb) return [parseFloat(rgb[1]), parseFloat(rgb[2]), parseFloat(rgb[3])];

  // #rrggbb or #rgb
  const hex6 = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(raw);
  if (hex6) return [parseInt(hex6[1], 16), parseInt(hex6[2], 16), parseInt(hex6[3], 16)];

  const hex3 = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(raw);
  if (hex3)
    return [
      parseInt(hex3[1] + hex3[1], 16),
      parseInt(hex3[2] + hex3[2], 16),
      parseInt(hex3[3] + hex3[3], 16),
    ];

  return null;
}

function rgbToHslStr(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBackground(rgb: [number, number, number]) {
  const hsl = rgbToHslStr(...rgb);
  const [h, s, lRaw] = hsl.split(' ');
  const l = parseFloat(lRaw);
  const root = document.documentElement;

  root.style.setProperty('--background', `${h} ${s} ${l}%`);
  root.style.setProperty('--surface', `${h} ${s} ${Math.min(l + 3, 94)}%`);
  root.style.setProperty('--surface-elevated', `${h} ${s} ${Math.min(l + 6, 94)}%`);
  root.style.setProperty('--border', `${h} ${s} ${Math.min(l + 13, 94)}%`);
  root.style.setProperty('--border-subtle', `${h} ${s} ${Math.min(l + 9, 94)}%`);
}

// ── Hook ────────────────────────────────────────────────────────────────────

const FONT_SIZE_MAP = { sm: '13px', md: '15px', lg: '17px' } as const;

export function useApplySettings() {
  const accentColor = useSettingsStore((s) => s.settings.accentColor);
  const backgroundColor = useSettingsStore((s) => s.settings.backgroundColor ?? '#0d1117');
  const fontSize = useSettingsStore((s) => s.settings.fontSize);
  const compactMode = useSettingsStore((s) => s.settings.compactMode);

  // Apply user-chosen background color
  useEffect(() => {
    const rgb = parseColor(backgroundColor) ?? parseColor('#0d1117')!;
    applyBackground(rgb);
  }, [backgroundColor]);

  useEffect(() => {
    try {
      const hsl = hexToHsl(accentColor);
      const [h, s, lRaw] = hsl.split(' ');
      const l = parseFloat(lRaw);
      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty(
        '--accent-hover',
        `${h} ${s} ${Math.min(l + 6, 95)}%`
      );
    } catch {
      /* ignore */
    }
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '15px';
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle('compact', compactMode);
  }, [compactMode]);
}
