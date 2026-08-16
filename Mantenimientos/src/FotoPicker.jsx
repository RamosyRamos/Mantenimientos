// ── FotoPicker: los dos caminos para subir una foto ──────────────────────────
// Port del FotoPicker de Taller (057670a) — apps separadas, cada una su copia
// (mismo criterio que useIsMobile). Motivo: en Android un input con capture
// forzado BLOQUEA la galería, y uno sin capture no abre cámara directo; acá
// van los dos: "📷" (input con capture) y "🖼" (picker normal), ambos al MISMO
// onFile(file). En desktop capture se ignora y ambos abren el picker.
// El value del input se resetea tras cada selección: se puede repetir la misma
// foto o encadenar varias seguidas sin fricción.
// Props (mismas que Taller): onFile, facing ('environment' default — trasera),
// variant ('row' con labels / 'compact' solo íconos), busy, disabled, style.
// Look adaptado a esta app: monospace + acento azul #60a5fa (no el Carbon).
import { useRef } from "react";

export default function FotoPicker({ onFile, disabled = false, busy = false, busyLabel = "⏳ Subiendo…", facing = "environment", variant = "row", style = {} }) {
  const camRef = useRef(null);
  const galRef = useRef(null);
  const off = disabled || busy;
  const handle = (e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; };

  const btn = {
    flex: 1, padding: "6px", borderRadius: 4,
    border: "1px solid #60a5fa60", background: "#60a5fa18", color: "#60a5fa",
    fontFamily: "monospace", fontSize: 10, cursor: off ? "default" : "pointer",
    opacity: off ? 0.5 : 1,
  };

  if (busy) {
    return <div style={{ ...btn, textAlign: "center", flex: variant === "compact" ? 2 : 1, ...style }}>{busyLabel}</div>;
  }

  return (
    <>
      <input ref={camRef} type="file" accept="image/*" capture={facing} style={{ display: "none" }} onChange={handle} disabled={off} />
      <input ref={galRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} disabled={off} />
      <button type="button" onClick={(e) => { e.stopPropagation(); camRef.current?.click(); }} disabled={off} title="Tomar foto con la cámara" style={{ ...btn, ...style }}>
        {variant === "compact" ? "📷" : "📷 Cámara"}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); galRef.current?.click(); }} disabled={off} title="Elegir de la galería" style={{ ...btn, ...style }}>
        {variant === "compact" ? "🖼" : "🖼 Galería"}
      </button>
    </>
  );
}
