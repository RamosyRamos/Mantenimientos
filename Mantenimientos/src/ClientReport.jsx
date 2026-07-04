import { useState, useEffect } from "react";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// ── Identidad visual (tema CLARO, alineado con las cotizaciones del cliente) ──
const T = {
  fondo:'#E6E4DB', card:'#FCFBF8', card2:'#F2F0E9', borde:'#D6D3C8', line2:'#E4E1D8',
  texto:'#1A1A1D', muted:'#8A8C86', dim:'#5C5C62',
  rojo:'#B83A2E', navy:'#15225F', success:'#1F7A4D',
};
// Estados suaves (checklist + dictamen)
const OK   = { bg:'#E0F0E6', border:'#9BCBAE', text:'#1F7A4D' };
const CRIT = { bg:'#F7E0DC', border:'#D99B92', text:'#B83A2E' };
const WARN = { bg:'#FBF3E0', border:'#D9B870', text:'#8A5A0A' };
const FONT  = "'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const SERIF = "'Cormorant', Georgia, 'Times New Roman', serif";
const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Inter:wght@700&family=Titillium+Web:wght@300;400;600;700;900&display=swap";
const PRINT_CSS = `
@page { margin: 1cm; }
@media print {
  .ryr-noprint { display: none !important; }
  html, body, #root { background: #fff !important; }
  .ryr-root { background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .ryr-card, .ryr-section, .ryr-dictamen { break-inside: avoid; page-break-inside: avoid; }
  .ryr-header { position: static !important; }
}
`;

// ─── Revisión de Compra ───────────────────────────────────────────────────
// Una RC se guarda con servicio_codigo === "RC" (serie 'C'). Detección única
// para todos los textos de cara al cliente: no repetir esta lógica inline.
// ⚠️ OJO: si algún día existe una receta A/B cuyo código empiece con "C",
// habría que refinar esta detección (hoy ningún código A/B empieza con "C").
// tipoRevision distingue, por código exacto, la serie 'C': 'RG' → general,
// 'RC' (o cualquier código de serie C) → compra. esRC = pertenece a serie 'C'.
const tipoRevision = (svc) => {
  const c = (svc?.codigo || svc?.servicio_codigo || "").toUpperCase();
  if (c === "RG") return "general";
  if (c === "RC" || c.startsWith("C")) return "compra";
  return null;
};
const esRC = (svc) => tipoRevision(svc) !== null;

export default function ClientReport({ binId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Compatibilidad: UUID para registros viejos, slug para nuevos
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(binId);
        const query = isUUID
          ? `${SUPABASE_URL}/rest/v1/servicios?id=eq.${binId}&select=*`
          : `${SUPABASE_URL}/rest/v1/servicios?slug=eq.${binId}&select=*`;
        const res = await fetch(query, {
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`,
            }
          }
        );
        const json = await res.json();
        if (json?.[0]) {
          // Mapear columnas de Supabase al formato que espera ReportView
          const r = json[0];
          // La fecha se deriva de created_at (timestamp confiable); la columna
          // `fecha` ya no se escribe. Fallback a r.fecha por compatibilidad; si
          // ambos faltan queda undefined y el Row muestra "—".
          const fechaFmt = r.created_at
            ? new Date(r.created_at).toLocaleDateString("es-CR", { day:"2-digit", month:"short", year:"numeric" })
              + " · " + new Date(r.created_at).toLocaleTimeString("es-CR", { hour:"2-digit", minute:"2-digit" })
            : (r.fecha || undefined);
          setData({
            taller:       "Ramos y Ramos",
            created_at:   r.created_at,
            fecha:        fechaFmt,
            mecanico:     r.mecanico,
            aprobado_por: r.aprobado_por || null,
            servicio:     { codigo: r.servicio_codigo, descripcion: r.servicio_desc },
            vehiculo:     { modelo: r.modelo, motor: r.motor, placa: r.placa, km: r.km, combustible: r.combustible, traccion: r.traccion, version: r.version, anio: r.anio },
            aceite:       r.aceite_litros ? { litros: r.aceite_litros, especificacion: r.aceite_spec } : null,
            revisiones:   r.revisiones,
            observaciones:  r.observaciones,
            pendientes:     r.pendientes,
            progreso:       r.progreso,
            rechazado:      r.rechazado,
            rechazado_por:  r.rechazado_por,
            motivo_rechazo: r.motivo_rechazo,
            dictamen:       r.dictamen || null,
          });
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [binId]);

  if (loading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen />;
  return <ReportView data={data} />;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:T.fondo, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>
      <div style={{ width:48, height:48, border:`3px solid ${T.borde}`, borderTop:`3px solid ${T.rojo}`, borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:20 }} />
      <div style={{ color:T.muted, fontSize:12, letterSpacing:2, fontWeight:600 }}>CARGANDO RESUMEN...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div style={{ minHeight:"100vh", background:T.fondo, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:FONT, padding:24, textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
      <div style={{ color:T.texto, fontSize:16, fontWeight:700, marginBottom:8 }}>No se encontró el resumen</div>
      <div style={{ color:T.muted, fontSize:12 }}>El link puede haber expirado o ser incorrecto.</div>
      <div style={{ marginTop:16, fontSize:12, color:T.muted }}>Contactá a Ramos y Ramos para más información.</div>
    </div>
  );
}

function ReportView({ data }) {
  const {
    taller, fecha, mecanico, aprobado_por, servicio, vehiculo,
    aceite, revisiones, observaciones, pendientes, progreso,
    rechazado, rechazado_por, motivo_rechazo, dictamen,
  } = data;

  const RECO_MAP = {
    // Revisión de Compra (RC)
    apto:              { label:"Apto para compra",      icon:"✅", color:OK.text },
    apto_reparaciones: { label:"Apto con reparaciones", icon:"⚠️", color:WARN.text },
    no_recomendable:   { label:"No recomendable",       icon:"❌", color:CRIT.text },
    // Revisión General (RG) — estado del vehículo
    excelente:             { label:"Excelente",              icon:"✅", color:OK.text },
    bueno:                 { label:"Bueno, atención menor",  icon:"🟡", color:WARN.text },
    requiere_reparaciones: { label:"Requiere reparaciones",  icon:"🟠", color:WARN.text },
    critico:               { label:"Estado crítico",         icon:"🔴", color:CRIT.text },
  };
  const reco = dictamen ? (RECO_MAP[dictamen.recomendacion] || null) : null;

  const totalOk     = Object.values(revisiones || {}).flat().filter(t => t.status === "ok").length;
  const totalIssue  = Object.values(revisiones || {}).flat().filter(t => t.status === "issue").length;
  const totalItems  = Object.values(revisiones || {}).flat().filter(t => !t.text?.startsWith("⚠")).length;

  // Serie 'C' (Revisión de Compra): el comprador no debe ver "servicio"/"mantenimiento".
  const tipoRev  = tipoRevision(servicio);                                    // 'compra' | 'general' | null
  const rc       = tipoRev !== null;
  const revLabel = tipoRev === "general" ? "Revisión General" : "Revisión de Compra";

  // Línea de modelo estilo cotización: limpia el año colgante del modelo y compone "modelo · versión · año"
  const modeloLimpio = (vehiculo?.modelo || "").replace(/\s*\d{4}\s*[-–]\s*(\d{4}|presente|present|actual|hoy)?\s*$/i, "").trim();
  const modeloLinea  = [modeloLimpio, vehiculo?.version, vehiculo?.anio].filter(Boolean).join(" · ");

  useEffect(() => {
    document.title = rc ? `Ramos y Ramos | ${revLabel}` : "Ramos y Ramos | Mantenimiento";
  }, [rc, revLabel]);

  // Cargar Titillium Web + Cormorant (identidad de las cotizaciones)
  useEffect(() => {
    if (document.getElementById("ryr-fonts")) return;
    const l = document.createElement("link");
    l.id = "ryr-fonts"; l.rel = "stylesheet"; l.href = FONTS_HREF;
    document.head.appendChild(l);
  }, []);

  return (
    <div id="client-root" className="ryr-root" style={{ minHeight:"100vh", background:T.fondo, fontFamily:FONT, color:T.texto, paddingBottom:0 }}>
      <style>{PRINT_CSS}</style>

      {/* HEADER */}
      <div className="ryr-header" style={{ position:"sticky", top:0, zIndex:100, background:T.card, padding:"16px 20px" }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", alignItems:"center", gap:14 }}>
          <img src="/logo-1x.png" srcSet="/logo-1x.png 1x, /logo-2x.png 2x, /logo-3x.png 3x" alt="Taller Ramos y Ramos" width="44" height="44" style={{ borderRadius:10, objectFit:"contain", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FONT, fontWeight:700, fontSize:18, letterSpacing:1, color:T.texto, lineHeight:1.1 }}>Taller Ramos y Ramos</div>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginTop:2 }}>Taller Especializado · Mercedes-Benz</div>
          </div>
        </div>
        {/* línea inferior degradada de marca */}
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:3, background:`linear-gradient(90deg, ${T.navy}, ${T.rojo} 55%, transparent)` }} />
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px 48px" }}>

        {/* Título del reporte + bloque de vehículo (estilo cotización) */}
        <div style={{ background:T.card, border:`1px solid ${T.borde}`, borderRadius:14, padding:"18px", marginBottom:18 }}>
          <div style={{ fontSize:10, color:T.rojo, letterSpacing:3, marginBottom:10, fontWeight:700 }}>{rc ? `INFORME DE ${revLabel.toUpperCase()}` : "RESUMEN DE SERVICIO"}</div>
          <div style={{ fontFamily:SERIF, fontSize:22, fontWeight:600, color:T.dim, lineHeight:1.15 }}>Mercedes-Benz</div>
          <div style={{ fontFamily:SERIF, fontSize:"clamp(24px, 6vw, 30px)", fontWeight:500, color:T.texto, lineHeight:1.15 }}>{modeloLinea || "Vehículo Mercedes-Benz"}</div>
          <div style={{ display:"flex", justifyContent:"flex-start", alignItems:"flex-end", gap:12, marginTop:16, flexWrap:"wrap" }}>
            <Placa patente={vehiculo?.placa} />
          </div>
          {vehiculo?.km && <div style={{ fontSize:12, color:T.dim, marginTop:8 }}>📍 {parseInt(vehiculo.km).toLocaleString()} km</div>}
          {vehiculo?.vin && <div style={{ marginTop:14, fontFamily:FONT, fontSize:11, letterSpacing:1, color:T.muted }}>VIN · <span style={{ color:T.dim, fontWeight:600, letterSpacing:0.5 }}>{vehiculo.vin}</span></div>}
        </div>

        {/* DICTAMEN — Revisión de Compra (prominente, antes del detalle por sistema) */}
        {dictamen && (
          <div className="ryr-dictamen" style={{ margin:"16px 0" }}>
            {reco && (
              <div style={{ background:reco.color+"18", border:`1px solid ${reco.color}55`, borderRadius:14, padding:"18px" }}>
                <div style={{ fontSize:10, color:reco.color, letterSpacing:2, marginBottom:8, fontWeight:700 }}>DICTAMEN DEL VEHÍCULO</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:32, flexShrink:0 }}>{reco.icon}</span>
                  <span style={{ fontSize:20, fontWeight:700, color:reco.color, lineHeight:1.2 }}>{reco.label}</span>
                </div>
              </div>
            )}
            {dictamen.reparaciones?.length > 0 && (
              <div style={{ marginTop:12, background:T.card2, border:`1px solid ${T.borde}`, borderRadius:10, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:T.muted, letterSpacing:2, marginBottom:10, fontWeight:700 }}>REPARACIONES SUGERIDAS</div>
                {dictamen.reparaciones.map((r, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"8px 0", borderBottom: i < dictamen.reparaciones.length - 1 ? `1px solid ${T.borde}` : "none" }}>
                    <span style={{ fontSize:13, color:T.texto, flex:1 }}>{r.descripcion || "—"}</span>
                    <span style={{ fontSize:13, color:T.success, fontWeight:700, flexShrink:0 }}>₡{Number(r.costo_estimado || 0).toLocaleString("es-CR")}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:10, borderTop:`2px solid ${T.borde}` }}>
                  <span style={{ fontSize:12, color:T.dim, letterSpacing:1, fontWeight:700 }}>TOTAL ESTIMADO</span>
                  <span style={{ fontSize:16, color:T.texto, fontWeight:700 }}>₡{Number(dictamen.total_estimado || 0).toLocaleString("es-CR")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECHAZADO */}
        {rechazado === true && (
          <div style={{ margin:"16px 0", background:CRIT.bg, border:`1px solid ${CRIT.border}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:CRIT.text, fontWeight:700, fontSize:13, marginBottom:6 }}>❌ {rc ? `${revLabel} rechazada` : "Servicio rechazado"}</div>
            {rechazado_por && (
              <div style={{ color:T.dim, fontSize:12 }}>Por: <strong style={{ color:T.texto }}>{rechazado_por}</strong></div>
            )}
            {motivo_rechazo && (
              <div style={{ color:T.dim, fontSize:12, marginTop:4 }}>Motivo: <em>{motivo_rechazo}</em></div>
            )}
          </div>
        )}

        {/* DATOS DEL SERVICIO */}
        <Section title={rc ? `🔧 Datos de la ${revLabel}` : "🔧 Datos del Servicio"}>
          <Row label={rc ? "Código de revisión" : "Código de servicio"} value={<span style={{ color:T.rojo, fontWeight:700 }}>{servicio?.codigo}{servicio?.descripcion && servicio.descripcion.toUpperCase() !== "PENDIENTE" ? ` — ${servicio.descripcion}` : ""}</span>} />
          <Row label="Realizado por" value={mecanico} />
          {aprobado_por && <Row label="Aprobado por" value={<span style={{ color:T.success, fontWeight:600 }}>✅ {aprobado_por}</span>} />}
          <Row label="Fecha y hora" value={fecha} />
          <Row label="Motor" value={vehiculo?.motor} />
          <Row label="Combustible" value={vehiculo?.combustible === "diesel" ? "🛢️ Diesel" : "⛽ Gasolina"} />
          <Row label="Tracción" value={vehiculo?.traccion} />
          {aceite && <Row label="Aceite cargado" value={<span style={{ color:T.rojo }}>🛢️ {aceite.litros} L — {aceite.especificacion}</span>} />}
        </Section>

        {/* PROGRESO */}
        <div className="ryr-card" style={{ margin:"16px 0", padding:"14px 16px", background:T.card, border:`1px solid ${T.borde}`, borderRadius:14 }}>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:2, marginBottom:10, fontWeight:700 }}>RESUMEN DE REVISIONES</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Badge color={T.success} label={`✅ ${totalOk} OK`} />
            {totalIssue > 0 && <Badge color={T.rojo} label={`⚠️ ${totalIssue} con detalle`} />}
            <Badge color={T.dim} label={`📋 ${totalItems} ítems revisados`} />
          </div>
          <div style={{ marginTop:10, height:6, background:T.card2, borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${totalItems > 0 ? Math.round((totalOk+totalIssue)/totalItems*100) : 0}%`, background:`linear-gradient(90deg,${T.navy},${T.success})`, borderRadius:3, transition:"width .5s" }} />
          </div>
        </div>

        {/* REVISIONES DETALLADAS */}
        {revisiones && Object.entries(revisiones).map(([grp, items]) => (
          <Section key={grp} title={grp} small>
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
                  <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>
                    {isOk ? "✅" : isIssue ? "⚠️" : isNA ? "—" : "○"}
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:txtCol, textDecoration: isNA ? "line-through" : "none", lineHeight:1.5, fontWeight:500 }}>
                      {item.text}
                      {isNA && <span style={{ fontSize:10, color:T.muted, marginLeft:8 }}>No aplica</span>}
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
          </Section>
        ))}

        {/* PENDIENTES */}
        {pendientes?.length > 0 && (
          <div className="ryr-card" style={{ margin:"16px 0", padding:"14px 16px", background:CRIT.bg, border:`1px solid ${CRIT.border}`, borderRadius:14 }}>
            <div style={{ fontSize:10, color:CRIT.text, letterSpacing:2, marginBottom:10, fontWeight:700 }}>⚠️ PUNTOS A ATENDER</div>
            {pendientes.map((p, i) => (
              <div key={i} style={{ fontSize:13, color:T.texto, marginBottom:6, lineHeight:1.5, paddingLeft:10, borderLeft:`2px solid ${T.rojo}` }}>
                {p}
              </div>
            ))}
            <div style={{ fontSize:11, color:T.dim, marginTop:10 }}>
              Recomendamos agendar una cita para atender estos puntos.
            </div>
          </div>
        )}

        {/* OBSERVACIONES */}
        {observaciones && (
          <Section title="📝 Observaciones del Mecánico">
            <div style={{ fontSize:13, color:T.dim, lineHeight:1.8, whiteSpace:"pre-line", padding:"12px 14px" }}>{observaciones}</div>
          </Section>
        )}

        {/* FOOTER */}
        <div className="ryr-card" style={{ marginTop:24, padding:"20px 18px", background:T.card, border:`1px solid ${T.borde}`, borderRadius:14, textAlign:"center" }}>
          {/* CTA de contacto */}
          <div className="ryr-noprint">
            <div style={{ fontSize:15, fontWeight:700, color:T.texto }}>¿Tenés dudas sobre {rc ? "tu revisión" : "tu servicio"}?</div>
            <div style={{ fontSize:12.5, color:T.muted, marginTop:4 }}>Escribinos y con gusto te ayudamos.</div>
            <div style={{ marginTop:14 }}>
              <a href="https://wa.me/50683439257" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:T.navy, color:"#fff", padding:"11px 20px", minHeight:44, boxSizing:"border-box", borderRadius:10, fontWeight:700, fontSize:13, textDecoration:"none" }}>
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.524 5.847L0 24l6.302-1.502A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.733.89.923-3.636-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                Escribir al taller
              </a>
            </div>
          </div>

          {/* Firma / generado */}
          <div style={{ fontSize:11, color:T.muted, lineHeight:1.8, marginTop:18, paddingTop:14, borderTop:`1px solid ${T.borde}` }}>
            <div style={{ color:T.rojo, fontWeight:700, marginBottom:4 }}>Ramos y Ramos Taller Especializado</div>
            <div>Este informe se generó automáticamente al finalizar {rc ? `la ${revLabel.toLowerCase()}` : "el servicio"}.</div>
            <div style={{ marginTop:4, fontSize:10 }}>{rc ? "Revisión realizada por" : "Servicio realizado por"} <strong style={{ color:T.texto }}>{mecanico}</strong> · {fecha}</div>
          </div>

          {/* Nota del sistema + link historial */}
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${T.borde}` }}>
            <div style={{ fontSize:10, color:T.muted, lineHeight:1.7, marginBottom:10 }}>
              ℹ️ Ramos y Ramos implementó este registro digital de servicios y revisiones en <strong style={{ color:T.dim }}>abril del 2026</strong>. Los registros anteriores a esa fecha no aparecen en el historial digital.
            </div>
            <a
              href={`${window.location.origin}/historial`}
              style={{ display:"inline-block", padding:"8px 18px", borderRadius:8, border:`1px solid ${T.rojo}55`, background:`${T.rojo}0F`, color:T.rojo, fontSize:11, textDecoration:"none", fontWeight:700, letterSpacing:0.5 }}>
              📋 Ver historial completo del vehículo
            </a>
            <div style={{ fontSize:10, color:T.muted, marginTop:6, letterSpacing:0.5 }}>
              mantenimientos.ramosyramoscr.com/historial
            </div>
            <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>
              Ingresá la placa de tu vehículo para ver todos sus registros.
            </div>

            {/* BOTÓN IMPRIMIR / GUARDAR PDF */}
            <button
              className="ryr-noprint"
              onClick={() => window.print()}
              style={{ marginTop:16, width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${T.borde}`, background:T.card2, color:T.dim, fontSize:12, letterSpacing:1, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              🖨️ Imprimir / Guardar como PDF
            </button>
          </div>

          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, color:T.muted, marginTop:16 }}>
            Taller Ramos y Ramos · San José, Costa Rica
          </div>
        </div>

      </div>
    </div>
  );
}

// Placa costarricense vectorial (portada del bloque de vehículo de las cotizaciones)
function Placa({ patente }) {
  const p = (patente || "").trim();
  const AZUL = "#1B2A7A";
  const F = "'Inter','Titillium Web',sans-serif";
  if (!p) {
    return (
      <span style={{ position:"relative", display:"inline-flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#DDDDD6", border:"2.5px solid #9aa0a6", borderRadius:6, padding:"8px 28px 9px", minWidth:130, lineHeight:1, whiteSpace:"nowrap", verticalAlign:"middle" }}>
        <span style={{ fontFamily:F, fontSize:6.5, letterSpacing:2.2, color:"#8a8a8a", fontWeight:700, marginBottom:3 }}>COSTA RICA</span>
        <span style={{ fontFamily:F, fontSize:24, fontWeight:700, color:"#8a8a8a", letterSpacing:2.5, textTransform:"uppercase" }}>S/P</span>
        <span style={{ fontFamily:F, fontSize:6, letterSpacing:1.6, color:"#8a8a8a", fontWeight:700, marginTop:3 }}>CENTROAMÉRICA</span>
      </span>
    );
  }
  return (
    <span style={{ position:"relative", display:"inline-flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(180deg,#E6E6E0 0%,#D5D5CE 100%)", opacity:0.95, border:`2.5px solid ${AZUL}`, borderRadius:6, boxShadow:"0 0 0 1px #9aa0a6", padding:"8px 28px 9px", minWidth:130, lineHeight:1, whiteSpace:"nowrap", verticalAlign:"middle" }}>
      <span style={{ position:"absolute", top:5, left:"20%", width:11, height:3.5, borderRadius:2, background:"#C9CCC9", boxShadow:"inset 0 1px 1.5px rgba(0,0,0,0.45)" }} />
      <span style={{ position:"absolute", top:5, right:"20%", width:11, height:3.5, borderRadius:2, background:"#C9CCC9", boxShadow:"inset 0 1px 1.5px rgba(0,0,0,0.45)" }} />
      <svg viewBox="0 0 9 6" preserveAspectRatio="none" style={{ position:"absolute", top:5, right:5, width:16, height:10, borderRadius:1.5, boxShadow:"0 0 0 0.5px rgba(0,0,0,0.18)", overflow:"hidden", display:"block" }}>
        <rect width="9" height="6" fill="#002B7F" />
        <rect y="1" width="9" height="4" fill="#FFFFFF" />
        <rect y="2" width="9" height="2" fill="#CE1126" />
      </svg>
      <span style={{ fontFamily:F, fontSize:6.5, letterSpacing:2.2, color:AZUL, fontWeight:700, marginBottom:3 }}>COSTA RICA</span>
      <span style={{ fontFamily:F, fontSize:24, fontWeight:700, color:AZUL, letterSpacing:2.5, textTransform:"uppercase", textShadow:"0 1px 0 rgba(255,255,255,0.8),0 -1px 0 rgba(0,0,0,0.2)" }}>{p.toUpperCase()}</span>
      <span style={{ fontFamily:F, fontSize:6, letterSpacing:1.6, color:AZUL, fontWeight:700, marginTop:3 }}>CENTROAMÉRICA</span>
    </span>
  );
}

function Section({ title, children, small }) {
  return (
    <div className="ryr-section" style={{ margin:"16px 0", breakInside:"avoid" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize: small ? 11 : 12, color:T.rojo, letterSpacing:1.5, marginBottom:8, fontWeight:700 }}>
        <span style={{ width:3, height:14, background:T.rojo, borderRadius:2, flexShrink:0, display:"inline-block" }} />
        {title.toUpperCase()}
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.borde}`, borderRadius:14, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", borderBottom:`1px solid ${T.line2}`, flexWrap:"wrap", gap:4 }}>
      <span style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:12.5, color:T.texto, textAlign:"right" }}>{value || "—"}</span>
    </div>
  );
}

function Badge({ color, label }) {
  return (
    <div style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${color}55`, background:`${color}18`, fontSize:11, color, fontWeight:700 }}>
      {label}
    </div>
  );
}
