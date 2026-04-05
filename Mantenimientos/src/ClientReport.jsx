import { useState, useEffect } from "react";

const JSONBIN_KEY = import.meta.env.VITE_JSONBIN_KEY;

// Logo base64 se inyecta desde App.jsx via localStorage o se importa
// Para simplificar, usamos el mismo fetch que App.jsx

export default function ClientReport({ binId }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          headers: { "X-Access-Key": JSONBIN_KEY }
        });
        const json = await res.json();
        setData(json.record);
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
    <div style={{ minHeight:"100vh", background:"#09090e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace" }}>
      <div style={{ width:48, height:48, border:"3px solid #C8A96E30", borderTop:"3px solid #C8A96E", borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:20 }} />
      <div style={{ color:"#555", fontSize:12, letterSpacing:2 }}>CARGANDO RESUMEN...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div style={{ minHeight:"100vh", background:"#09090e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:24, textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
      <div style={{ color:"#e0d8cc", fontSize:14, marginBottom:8 }}>No se encontró el resumen</div>
      <div style={{ color:"#555", fontSize:11 }}>El link puede haber expirado o ser incorrecto.</div>
      <div style={{ marginTop:16, fontSize:11, color:"#555" }}>Contactá a Ramos y Ramos para más información.</div>
    </div>
  );
}

function ReportView({ data }) {
  const {
    taller, fecha, mecanico, servicio, vehiculo,
    aceite, revisiones, observaciones, pendientes, progreso
  } = data;

  const totalOk     = Object.values(revisiones || {}).flat().filter(t => t.status === "ok").length;
  const totalIssue  = Object.values(revisiones || {}).flat().filter(t => t.status === "issue").length;
  const totalItems  = Object.values(revisiones || {}).flat().filter(t => !t.text?.startsWith("⚠")).length;

  return (
    <div style={{ minHeight:"100vh", background:"#09090e", fontFamily:"'Segoe UI', Arial, sans-serif", color:"#e0d8cc", paddingBottom:48 }}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,#0d0d16 0%,#09090e 100%)", borderBottom:"1px solid #1c1c2a", padding:"20px 20px 16px" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          {/* Logo + Nombre */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"#111", border:"2px solid #C8A96E40", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              ⭐
            </div>
            <div>
              <div style={{ fontWeight:"bold", fontSize:16, letterSpacing:2, color:"#e0d8cc" }}>RAMOS Y RAMOS</div>
              <div style={{ fontSize:10, color:"#555", letterSpacing:2 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
            </div>
          </div>

          {/* Título del reporte */}
          <div style={{ background:"#C8A96E10", border:"1px solid #C8A96E30", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:"#C8A96E", letterSpacing:3, marginBottom:6 }}>RESUMEN DE SERVICIO</div>
            <div style={{ fontSize:18, fontWeight:"bold", color:"#e0d8cc", marginBottom:4 }}>
              {vehiculo?.modelo || "Vehículo Mercedes-Benz"}
            </div>
            <div style={{ fontSize:12, color:"#888" }}>
              {vehiculo?.placa && <span style={{ background:"#1a1a2a", border:"1px solid #2a2a3a", borderRadius:4, padding:"2px 8px", marginRight:8, letterSpacing:2 }}>{vehiculo.placa}</span>}
              {vehiculo?.km && <span>{parseInt(vehiculo.km).toLocaleString()} km</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"0 16px" }}>

        {/* DATOS DEL SERVICIO */}
        <Section title="🔧 Datos del Servicio">
          <Row label="Código de servicio" value={<span style={{ color:"#C8A96E", fontWeight:"bold" }}>{servicio?.codigo} — {servicio?.descripcion}</span>} />
          <Row label="Mecánico responsable" value={mecanico} />
          <Row label="Fecha y hora" value={fecha} />
          <Row label="Motor" value={vehiculo?.motor} />
          <Row label="Combustible" value={vehiculo?.combustible === "diesel" ? "🛢️ Diesel" : "⛽ Gasolina"} />
          <Row label="Tracción" value={vehiculo?.traccion} />
          {aceite && <Row label="Aceite cargado" value={<span style={{ color:"#C8A96E" }}>🛢️ {aceite.litros} L — {aceite.especificacion}</span>} />}
        </Section>

        {/* PROGRESO */}
        <div style={{ margin:"16px 0", padding:"14px 16px", background:"#0f0f17", border:"1px solid #1c1c2a", borderRadius:10 }}>
          <div style={{ fontSize:10, color:"#555", letterSpacing:2, marginBottom:10 }}>RESUMEN DE REVISIONES</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Badge color="#4ade80" label={`✅ ${totalOk} OK`} />
            {totalIssue > 0 && <Badge color="#f87171" label={`⚠️ ${totalIssue} con detalle`} />}
            <Badge color="#C8A96E" label={`📋 ${totalItems} ítems revisados`} />
          </div>
          <div style={{ marginTop:10, height:4, background:"#1c1c2a", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${totalItems > 0 ? Math.round((totalOk+totalIssue)/totalItems*100) : 0}%`, background:"linear-gradient(90deg,#C8A96E,#4ade80)", borderRadius:2, transition:"width .5s" }} />
          </div>
        </div>

        {/* REVISIONES DETALLADAS */}
        {revisiones && Object.entries(revisiones).map(([grp, items]) => (
          <Section key={grp} title={grp} small>
            {items.map((item, i) => {
              if (item.text?.startsWith("⚠")) return null;
              const isOk    = item.status === "ok";
              const isIssue = item.status === "issue";
              const isPending = item.status === "pending";
              return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:4, borderRadius:8, background: isOk ? "#0a1a0a" : isIssue ? "#1a0a0a" : "#0c0c14", border:`1px solid ${isOk?"#4ade8030":isIssue?"#f8717130":"#1c1c2a"}` }}>
                  <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>
                    {isOk ? "✅" : isIssue ? "⚠️" : "○"}
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color: isOk ? "#86efac" : isIssue ? "#fca5a5" : "#666", textDecoration: isOk && !isIssue ? "none" : "none", lineHeight:1.5 }}>
                      {item.text}
                    </div>
                    {item.detail && (
                      <div style={{ fontSize:11, color:"#f87171", marginTop:4, padding:"4px 8px", background:"#2a0a0a", borderRadius:4, borderLeft:"2px solid #f87171" }}>
                        {item.detail}
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
          <div style={{ margin:"16px 0", padding:"14px 16px", background:"#1a0a0a", border:"1px solid #f8717130", borderRadius:10 }}>
            <div style={{ fontSize:10, color:"#f87171", letterSpacing:2, marginBottom:10 }}>⚠️ PUNTOS A ATENDER</div>
            {pendientes.map((p, i) => (
              <div key={i} style={{ fontSize:13, color:"#fca5a5", marginBottom:6, lineHeight:1.5, paddingLeft:8, borderLeft:"2px solid #f87171" }}>
                {p}
              </div>
            ))}
            <div style={{ fontSize:11, color:"#555", marginTop:10 }}>
              Recomendamos agendar una cita para atender estos puntos.
            </div>
          </div>
        )}

        {/* OBSERVACIONES */}
        {observaciones && (
          <Section title="📝 Observaciones del Mecánico">
            <div style={{ fontSize:13, color:"#aaa", lineHeight:1.8, whiteSpace:"pre-line" }}>{observaciones}</div>
          </Section>
        )}

        {/* FOOTER */}
        <div style={{ marginTop:24, padding:"16px", background:"#0f0f17", border:"1px solid #1c1c2a", borderRadius:10, textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#555", lineHeight:1.8 }}>
            <div style={{ color:"#C8A96E", fontWeight:"bold", marginBottom:4 }}>Ramos y Ramos Taller Especializado</div>
            <div>Este resumen fue generado automáticamente al finalizar el servicio.</div>
            <div style={{ marginTop:4, fontSize:10 }}>Servicio realizado por <strong style={{ color:"#e0d8cc" }}>{mecanico}</strong> · {fecha}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children, small }) {
  return (
    <div style={{ margin:"16px 0" }}>
      <div style={{ fontSize: small ? 10 : 11, color:"#C8A96E", letterSpacing:2, marginBottom:8, fontWeight:"bold" }}>
        {title.toUpperCase()}
      </div>
      <div style={{ background:"#0f0f17", border:"1px solid #1c1c2a", borderRadius:10, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid #1c1c2a", flexWrap:"wrap", gap:4 }}>
      <span style={{ fontSize:11, color:"#555" }}>{label}</span>
      <span style={{ fontSize:12, color:"#ccc", textAlign:"right" }}>{value || "—"}</span>
    </div>
  );
}

function Badge({ color, label }) {
  return (
    <div style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${color}40`, background:`${color}15`, fontSize:11, color, fontWeight:"bold" }}>
      {label}
    </div>
  );
}
