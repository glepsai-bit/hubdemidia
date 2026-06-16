// Decide cor de texto (preto ou branco) com melhor contraste para um background hex.
// Usa luminância relativa (WCAG 2.1) — sem dependência externa.

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(srgbChannel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Retorna "#000000" ou "#ffffff" — o que oferecer maior contraste WCAG. */
export function bestTextColor(bgHex: string | null | undefined): string {
  if (!bgHex) return "#ffffff";
  const l = relativeLuminance(bgHex);
  // Limite ~0.179 maximiza contraste mínimo de 4.5:1 conforme WCAG.
  return l > 0.179 ? "#000000" : "#ffffff";
}
