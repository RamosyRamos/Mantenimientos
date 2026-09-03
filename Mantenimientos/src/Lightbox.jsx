// ── Lightbox de fotos para las vistas PÚBLICAS de cliente ──
// (/servicio/:slug y /historial). Las fotos se abren acá adentro, nunca en
// una pestaña nueva: el cliente no necesita la URL del bucket. Sin librería.
// La vista interna de mecánicos (App.jsx) NO lo usa a propósito.
import { useEffect, useRef, useState } from "react";

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SWIPE_PX = 40;   // umbral de swipe horizontal en touch

const btnBase = {
  position: "absolute", width: 48, height: 48, minWidth: 44, minHeight: 44,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "50%", color: "#fff", fontSize: 22, lineHeight: 1,
  cursor: "pointer", fontFamily: "inherit", padding: 0, zIndex: 2,
  WebkitTapHighlightColor: "transparent",
};

export default function Lightbox({ fotos = [], indice = 0, onClose, onIndice }) {
  const total = fotos.length;
  const varias = total > 1;
  const touchX = useRef(null);
  const [angosta, setAngosta] = useState(() => typeof window !== "undefined" && window.innerWidth < 600);

  const ir = (delta) => {
    if (!varias) return;
    onIndice?.((indice + delta + total) % total);
  };

  // Teclado: Escape cierra, ← → navegan.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); ir(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); ir(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, total, onClose]);

  // Bloquear el scroll del body mientras está abierto; restaurar al cerrar.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Breakpoint 600 (el de esta app): en móvil las flechas van abajo, junto al
  // contador, para no tapar la foto a los lados.
  useEffect(() => {
    const onResize = () => setAngosta(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Precarga vecinas para que ‹ › no parpadee.
  useEffect(() => {
    if (!varias) return;
    [indice - 1, indice + 1].forEach((i) => {
      const src = fotos[(i + total) % total];
      if (src) { const im = new Image(); im.src = src; }
    });
  }, [indice, fotos, total, varias]);

  const onTouchStart = (e) => { touchX.current = e.touches?.[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE_PX) ir(dx < 0 ? 1 : -1);
  };

  const src = fotos[indice];
  if (!src) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Foto ${indice + 1} de ${total}`}
      onClick={onClose}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "pan-y", userSelect: "none" }}
    >
      <img
        src={src} alt={`Foto ${indice + 1} de ${total}`} draggable={false}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100vw", maxHeight: "100vh", width: "auto", height: "auto", objectFit: "contain", display: "block", boxShadow: "0 12px 48px rgba(0,0,0,0.6)" }}
      />

      <button type="button" onClick={(e) => { e.stopPropagation(); onClose?.(); }} aria-label="Cerrar" title="Cerrar"
        style={{ ...btnBase, top: "max(10px, env(safe-area-inset-top))", right: "max(10px, env(safe-area-inset-right))" }}>
        ✕
      </button>

      {varias && !angosta && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); ir(-1); }} aria-label="Anterior" title="Anterior"
            style={{ ...btnBase, left: 12, top: "50%", transform: "translateY(-50%)" }}>‹</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); ir(1); }} aria-label="Siguiente" title="Siguiente"
            style={{ ...btnBase, right: 12, top: "50%", transform: "translateY(-50%)" }}>›</button>
        </>
      )}

      {varias && (
        <div onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", left: 0, right: 0, bottom: "max(12px, env(safe-area-inset-bottom))", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          {angosta && (
            <button type="button" onClick={() => ir(-1)} aria-label="Anterior" title="Anterior"
              style={{ ...btnBase, position: "static" }}>‹</button>
          )}
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1, color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.45)", padding: "4px 10px", borderRadius: 12 }}>
            {indice + 1} / {total}
          </span>
          {angosta && (
            <button type="button" onClick={() => ir(1)} aria-label="Siguiente" title="Siguiente"
              style={{ ...btnBase, position: "static" }}>›</button>
          )}
        </div>
      )}
    </div>
  );
}
