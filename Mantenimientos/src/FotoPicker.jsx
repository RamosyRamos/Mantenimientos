// ── FotoPicker: los dos caminos para subir una foto ──────────────────────────
// Port del FotoPicker de Taller (057670a) — apps separadas, cada una su copia
// (mismo criterio que useIsMobile). Motivo: en Android un input con capture
// forzado BLOQUEA la galería, y uno sin capture no abre cámara directo; acá
// van los dos: cámara (input con capture) y galería (picker normal), ambos al
// MISMO onFile(file). En desktop capture se ignora y ambos abren el picker.
// El value del input se resetea tras cada selección: se puede repetir la misma
// foto o encadenar varias seguidas sin fricción.
// Props (mismas que Taller): onFile, facing ('environment' default — trasera),
// variant ('row' con labels / 'compact' solo íconos), busy, disabled, style.
// Tema B (feat/tema-b-mantenimientos): botones secundarios de 44 con los
// íconos SVG de cámara y galería (antes emojis, en azul).
import { useRef } from "react";
import { T } from "./theme/tokensB.js";
import { botonB, hoverBotonB } from "./theme/estilosB.js";
import { Camera, Image, Loader } from "./theme/iconos.jsx";

export default function FotoPicker({ onFile, disabled = false, busy = false, busyLabel = "Subiendo…", facing = "environment", variant = "row", style = {} }) {
  const camRef = useRef(null);
  const galRef = useRef(null);
  const off = disabled || busy;
  const handle = (e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; };
  const compacto = variant === "compact";

  const btn = {
    ...botonB("secundario", "movil"),
    ...(compacto ? { width: 44, padding: 0 } : { flex: 1 }),
    fontFamily: T.sans,
    cursor: off ? "default" : "pointer",
    opacity: off ? 0.5 : 1,
  };

  if (busy) {
    return (
      <div style={{ ...btn, width: "auto", flex: compacto ? "0 0 auto" : 1, padding: "0 12px", cursor: "default", opacity: 1, color: T.textMuted, ...style }}>
        <Loader size={16} />{busyLabel}
      </div>
    );
  }

  return (
    <>
      <input ref={camRef} type="file" accept="image/*" capture={facing} style={{ display: "none" }} onChange={handle} disabled={off} />
      <input ref={galRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} disabled={off} />
      <button type="button" onClick={(e) => { e.stopPropagation(); camRef.current?.click(); }} disabled={off} title="Tomar foto con la cámara" aria-label="Tomar foto con la cámara" {...(off ? null : hoverBotonB)} style={{ ...btn, ...style }}>
        <Camera size={17} />{!compacto && "Cámara"}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); galRef.current?.click(); }} disabled={off} title="Elegir de la galería" aria-label="Elegir de la galería" {...(off ? null : hoverBotonB)} style={{ ...btn, ...style }}>
        <Image size={17} />{!compacto && "Galería"}
      </button>
    </>
  );
}
