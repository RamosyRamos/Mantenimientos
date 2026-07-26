import { useState, useEffect } from "react";
import { T, OK, CRIT, FONT, SERIF, ensureClientFonts } from "./temaCliente.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || window.location.origin;

// ─── Revisión de Compra ───────────────────────────────────────────────────
// Una RC se guarda con servicio_codigo === "RC" (serie 'C'). Detección única
// para etiquetar cada fila del historial mixto según su tipo.
// ⚠️ OJO: si algún día existe una receta A/B cuyo código empiece con "C",
// habría que refinar esta detección (hoy ningún código A/B empieza con "C").
const esRC = (svc) => {
  const c = (svc?.codigo || svc?.servicio_codigo || "").toUpperCase();
  return c === "RC" || c.startsWith("C");
};

// La fecha se deriva de created_at (timestamp confiable); la columna `fecha`
// ya no se escribe. Fallback a s.fecha por compatibilidad con registros viejos.
const fechaServicio = (s) =>
  s.created_at
    ? new Date(s.created_at).toLocaleDateString("es-CR", { day:"2-digit", month:"short", year:"numeric" })
      + " · " + new Date(s.created_at).toLocaleTimeString("es-CR", { hour:"2-digit", minute:"2-digit" })
    : (s.fecha || "—");

// v3 — tema claro editorial compartido con ClientReport (temaCliente.js)
export default function ClientHistory() {
  const [placa, setPlaca]       = useState("");
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState("");

  useEffect(() => {
    document.title = "Ramos y Ramos | Historial del vehículo";
    ensureClientFonts();
  }, []);

  const search = async () => {
    const q = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); // sanitizar
    if (!q || q.length < 3 || q.length > 8) return;
    setLoading(true);
    setResults(null);
    setSearched(q);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/servicios?placa=eq.${q}&select=*&order=created_at.desc`,
        {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
          }
        }
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") search(); };

  return (
    <div id="history-root" style={{ minHeight:"100vh", background:T.fondo, fontFamily:FONT, color:T.texto, paddingBottom:48 }}>

      {/* El CSS global de index.html fuerza inputs oscuros con !important
          (input { background: var(--inp-bg) !important }); los inline no
          alcanzan. Se pisa con mayor especificidad, scopeado a esta vista. */}
      <style>{`
        #history-root input {
          background: ${T.card} !important;
          color: ${T.texto} !important;
          border-color: ${T.borde} !important;
        }
        #history-root input::placeholder { color: ${T.muted} !important; }
        #history-root input:focus { border-color: ${T.navy} !important; }
      `}</style>

      {/* HEADER (misma gramática que ClientReport) */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:T.card, padding:"16px 20px" }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", alignItems:"center", gap:14 }}>
          <img src="/logo-1x.png" srcSet="/logo-1x.png 1x, /logo-2x.png 2x, /logo-3x.png 3x" alt="Taller Ramos y Ramos" width="44" height="44" style={{ borderRadius:10, objectFit:"contain", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FONT, fontWeight:700, fontSize:18, letterSpacing:1, color:T.texto, lineHeight:1.1 }}>Taller Ramos y Ramos</div>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginTop:2 }}>Historial del Vehículo · Mercedes-Benz</div>
          </div>
        </div>
        {/* línea inferior degradada de marca */}
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:3, background:`linear-gradient(90deg, ${T.navy}, ${T.rojo} 55%, transparent)` }} />
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px 48px" }}>

        {/* BUSCADOR */}
        <div style={{ background:T.card, border:`1px solid ${T.borde}`, borderRadius:14, padding:"18px", marginBottom:18 }}>
          <div style={{ fontSize:10, color:T.rojo, letterSpacing:3, marginBottom:10, fontWeight:700 }}>BUSCAR POR PLACA</div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={placa}
              onChange={e => setPlaca(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="Ej: ABC123"
              maxLength={8}
              style={{ flex:1, minWidth:0, background:T.card, border:`1px solid ${T.borde}`, color:T.texto, borderRadius:8, padding:"12px 14px", fontSize:16, fontFamily:FONT, outline:"none", letterSpacing:3, textAlign:"center" }}
            />
            <button
              onClick={search}
              disabled={loading || !placa.trim()}
              style={{ padding:"12px 18px", borderRadius:8, border:"none", background:T.navy, color:"#fff", fontFamily:FONT, fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:1, opacity: !placa.trim() ? 0.4 : 1, flexShrink:0 }}
            >
              {loading ? "⏳" : "🔍 Buscar"}
            </button>
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:8, textAlign:"center" }}>
            Ingresá la placa para ver el historial completo de tu vehículo
          </div>
        </div>

        {/* RESULTADOS */}
        {loading && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ width:36, height:36, border:`3px solid ${T.borde}`, borderTop:`3px solid ${T.rojo}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontSize:11, color:T.muted, letterSpacing:2, fontWeight:600 }}>BUSCANDO...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && results !== null && results.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 16px", background:T.card, borderRadius:14, border:`1px solid ${T.borde}` }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:15, color:T.texto, fontWeight:700, marginBottom:8 }}>No se encontraron registros</div>
            <div style={{ fontSize:12, color:T.dim }}>
              No hay registros para la placa <strong style={{ color:T.rojo }}>{searched}</strong>
            </div>
            <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>
              Si crees que esto es un error, contactá a Ramos y Ramos.
            </div>
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <>
            {/* Info del vehículo (misma jerarquía que el bloque de vehículo de ClientReport) */}
            <div style={{ background:T.card, border:`1px solid ${T.borde}`, borderRadius:14, padding:"18px", marginBottom:18 }}>
              <div style={{ fontSize:10, color:T.rojo, letterSpacing:3, marginBottom:10, fontWeight:700 }}>VEHÍCULO ENCONTRADO</div>
              <div style={{ fontFamily:SERIF, fontSize:22, fontWeight:600, color:T.dim, lineHeight:1.15 }}>Mercedes-Benz</div>
              <div style={{ fontFamily:SERIF, fontSize:"clamp(22px, 6vw, 28px)", fontWeight:500, color:T.texto, lineHeight:1.15 }}>{results[0].modelo || "Vehículo Mercedes-Benz"}</div>
              <div style={{ fontSize:12, color:T.dim, marginTop:10 }}>
                <span style={{ background:T.card2, border:`1px solid ${T.borde}`, borderRadius:4, padding:"2px 10px", letterSpacing:2, marginRight:8, fontWeight:600 }}>{searched}</span>
                {results[0].motor && <span>{results[0].motor}</span>}
              </div>
              <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>
                {results.length} registro{results.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Lista de servicios */}
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.rojo, letterSpacing:1.5, marginBottom:8, fontWeight:700 }}>
              <span style={{ width:3, height:14, background:T.rojo, borderRadius:2, flexShrink:0, display:"inline-block" }} />
              HISTORIAL
            </div>
            {results.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} total={results.length} />
            ))}
          </>
        )}

      </div>
    </div>
  );
}

function ServiceCard({ service: s, index, total }) {
  const [open, setOpen] = useState(index === 0);

  const progreso = s.progreso || {};
  const hasIssues = Object.values(s.revisiones || {}).flat().some(item => item.status === "issue");

  return (
    <div style={{ marginBottom:10, borderRadius:14, border:`1px solid ${hasIssues ? CRIT.border : T.borde}`, overflow:"hidden", background:T.card }}>

      {/* Encabezado */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{ padding:"14px 16px", background:T.card, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}
      >
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:700, color:T.rojo }}>{esRC(s) ? "Revisión de Compra" : `Servicio ${s.servicio_codigo}`}</span>
            {s.rechazado === true ? (
              <span style={{ fontSize:9, background:CRIT.bg, border:`1px solid ${CRIT.border}`, color:CRIT.text, borderRadius:4, padding:"1px 6px", fontWeight:700 }}>❌ Rechazado</span>
            ) : (
              <>
                {hasIssues && (
                  <span style={{ fontSize:9, background:CRIT.bg, border:`1px solid ${CRIT.border}`, color:CRIT.text, borderRadius:4, padding:"1px 6px", fontWeight:700 }}>⚠️ Con detalles</span>
                )}
                {!hasIssues && (
                  <span style={{ fontSize:9, background:OK.bg, border:`1px solid ${OK.border}`, color:OK.text, borderRadius:4, padding:"1px 6px", fontWeight:700 }}>✅ OK</span>
                )}
              </>
            )}
          </div>
          <div style={{ fontSize:12, color:T.dim }}>{s.servicio_desc}</div>
          {s.rechazado === true && (
            <div style={{ background:CRIT.bg, border:`1px solid ${CRIT.border}`, borderRadius:6, padding:"8px 10px", margin:"8px 0", fontSize:12 }}>
              <div style={{ color:CRIT.text, fontWeight:700, marginBottom:4 }}>❌ {esRC(s) ? "Revisión de Compra rechazada" : "Servicio rechazado"}</div>
              {s.rechazado_por && (
                <div style={{ color:T.dim, fontSize:11 }}>Por: <strong style={{ color:T.texto }}>{s.rechazado_por}</strong></div>
              )}
              {s.motivo_rechazo && (
                <div style={{ color:T.dim, fontSize:11, marginTop:3 }}>Motivo: <em>{s.motivo_rechazo}</em></div>
              )}
            </div>
          )}
          <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>
            📅 {fechaServicio(s)} · 👤 {s.mecanico}
            {s.aprobado_por && <span style={{ color:T.success }}> · ✅ {s.aprobado_por}</span>}
            {s.km && ` · 📍 ${parseInt(s.km).toLocaleString()} km`}
          </div>
        </div>
        <div style={{ fontSize:14, color:T.muted, flexShrink:0 }}>{open ? "▲" : "▼"}</div>
      </div>

      {/* Detalle expandible */}
      {open && (
        <div style={{ background:T.card, borderTop:`1px solid ${T.line2}`, padding:"14px 16px" }}>

          {/* Aceite */}
          {s.aceite_litros && (
            <div style={{ marginBottom:12, padding:"8px 12px", background:T.card2, border:`1px solid ${T.borde}`, borderRadius:8 }}>
              <span style={{ fontSize:12, color:T.rojo }}>🛢️ Aceite cargado: <strong>{s.aceite_litros} L</strong> — {s.aceite_spec}</span>
            </div>
          )}

          {/* Revisiones (misma gramática de ítems que ClientReport) */}
          {s.revisiones && Object.entries(s.revisiones).map(([grp, items]) => (
            <div key={grp} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:T.rojo, letterSpacing:1.5, marginBottom:6, fontWeight:700 }}>
                <span style={{ width:3, height:12, background:T.rojo, borderRadius:2, flexShrink:0, display:"inline-block" }} />
                {grp.toUpperCase()}
              </div>
              {items.map((item, i) => {
                if (item.text?.startsWith("⚠")) return null;
                const isOk    = item.status === "ok";
                const isIssue = item.status === "issue";
                const isNA    = item.status === "na";
                const bg     = isOk ? OK.bg     : isIssue ? CRIT.bg     : isNA ? T.card2 : T.card;
                const bd     = isOk ? OK.border : isIssue ? CRIT.border : T.borde;
                const txtCol = isOk ? OK.text   : isIssue ? CRIT.text   : isNA ? T.muted : T.dim;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:6, borderRadius:8, background:bg, border:`1px solid ${bd}` }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{isOk?"✅":isIssue?"⚠️":isNA?"—":"○"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:txtCol, textDecoration:isNA?"line-through":"none", lineHeight:1.5, fontWeight:500 }}>
                        {item.text}{isNA && <span style={{ fontSize:10, color:T.muted, marginLeft:8 }}>No aplica</span>}
                      </div>
                      {item.detail && (
                        <div style={{ fontSize:12, color:CRIT.text, marginTop:6, padding:"6px 10px", background:CRIT.bg, borderRadius:4, borderLeft:`2px solid ${T.rojo}` }}>
                          {item.detail}
                        </div>
                      )}
                      {item.fotos?.length > 0 && (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                          {item.fotos.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={`Evidencia ${idx+1}`} style={{ width:64, height:64, objectFit:"cover", borderRadius:8, border:`1px solid ${T.borde}` }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Observaciones */}
          {s.observaciones && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:T.rojo, letterSpacing:1.5, marginBottom:6, fontWeight:700 }}>
                <span style={{ width:3, height:12, background:T.rojo, borderRadius:2, flexShrink:0, display:"inline-block" }} />
                OBSERVACIONES
              </div>
              <div style={{ fontSize:13, color:T.dim, lineHeight:1.8, whiteSpace:"pre-line" }}>{s.observaciones}</div>
            </div>
          )}

          {/* Link al resumen completo */}
          <a
            href={`${APP_URL}/servicio/${s.id}`}
            style={{ display:"block", textAlign:"center", padding:"10px", borderRadius:8, border:`1px solid ${T.rojo}55`, background:`${T.rojo}0F`, color:T.rojo, fontSize:12, textDecoration:"none", fontWeight:700, letterSpacing:0.5 }}
          >
            📋 Ver resumen completo
          </a>
        </div>
      )}
    </div>
  );
}
