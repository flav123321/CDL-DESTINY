// Écusson original : blason à deux couleurs + sigle du club. Ne reprend aucun logo officiel.
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function contrast(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
}
export function crestSvg(club, size = 48) {
  const [c1, c2] = club.couleurs;
  const sigle = club.sigle ?? club.nom.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const fs = sigle.length > 3 ? 11 : sigle.length === 3 ? 13 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" width="${size}" height="${Math.round(size * 56 / 48)}" role="img" aria-label="${esc(club.nom)}">`
    + `<path d="M4 4h40v22c0 14-9 22-20 27C13 48 4 40 4 26z" fill="${c1}" stroke="${c2}" stroke-width="3"/>`
    + `<path d="M4 18h40v6H4z" fill="${c2}" opacity="0.9"/>`
    + `<text x="24" y="40" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="${fs}" fill="${contrast(c1)}">${esc(sigle)}</text>`
    + `</svg>`;
}
