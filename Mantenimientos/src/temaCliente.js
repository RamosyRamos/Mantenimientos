// ── Identidad visual de las vistas de cliente (tema CLARO editorial,
// alineado con las cotizaciones). Fuente única de la paleta: ClientReport y
// ClientHistory importan de acá para que los tonos no vuelvan a divergir.
export const T = {
  fondo:'#E6E4DB', card:'#FCFBF8', card2:'#F2F0E9', borde:'#D6D3C8', line2:'#E4E1D8',
  texto:'#1A1A1D', muted:'#8A8C86', dim:'#5C5C62',
  rojo:'#B83A2E', navy:'#15225F', success:'#1F7A4D',
};
// Estados suaves (checklist + dictamen)
export const OK   = { bg:'#E0F0E6', border:'#9BCBAE', text:'#1F7A4D' };
export const CRIT = { bg:'#F7E0DC', border:'#D99B92', text:'#B83A2E' };
export const WARN = { bg:'#FBF3E0', border:'#D9B870', text:'#8A5A0A' };
export const FONT  = "'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const SERIF = "'Cormorant', Georgia, 'Times New Roman', serif";
export const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Inter:wght@700&family=Titillium+Web:wght@300;400;600;700;900&display=swap";

// Inyección única de las Google Fonts (mismo id en todas las vistas de cliente)
export function ensureClientFonts() {
  if (document.getElementById("ryr-fonts")) return;
  const l = document.createElement("link");
  l.id = "ryr-fonts"; l.rel = "stylesheet"; l.href = FONTS_HREF;
  document.head.appendChild(l);
}
