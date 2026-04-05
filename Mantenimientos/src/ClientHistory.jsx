import { useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || window.location.origin;

const bg   = "#09090e";
const card = "#0f0f17";
const line = "#1c1c2a";
const gold = "#C8A96E";

export default function ClientHistory() {
  const [placa, setPlaca]       = useState("");
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState("");

  const search = async () => {
    const q = placa.trim().toUpperCase();
    if (!q) return;
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
    <div style={{ minHeight:"100vh", background:bg, fontFamily:"monospace", color:"#e0d8cc", paddingBottom:48 }}>

      {/* HEADER */}
      <div style={{ background:"#0d0d16", borderBottom:`1px solid ${line}`, padding:"16px 20px" }}>
        <div style={{ maxWidth:560, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", border:`2px solid ${gold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:gold, flexShrink:0 }}>★</div>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, letterSpacing:2 }}>RAMOS Y RAMOS</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>HISTORIAL DE MANTENIMIENTOS</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"24px 16px" }}>

        {/* BUSCADOR */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:10 }}>BUSCAR POR PLACA</div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={placa}
              onChange={e => setPlaca(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="Ej: ABC123"
              maxLength={8}
              style={{ flex:1, background:card, border:`1px solid ${line}`, color:"#e0d8cc", borderRadius:8, padding:"12px 14px", fontSize:16, fontFamily:"monospace", outline:"none", letterSpacing:3, textAlign:"center" }}
            />
            <button
              onClick={search}
              disabled={loading || !placa.trim()}
              style={{ padding:"12px 20px", borderRadius:8, border:`1px solid ${gold}50`, background:gold+"18", color:gold, fontFamily:"monospace", fontSize:12, fontWeight:"bold", cursor:"pointer", letterSpacing:1, opacity: !placa.trim() ? 0.4 : 1 }}
            >
              {loading ? "⏳" : "🔍 BUSCAR"}
            </button>
          </div>
          <div style={{ fontSize:10, color:"#333", marginTop:6, textAlign:"center" }}>
            Ingresá la placa de tu vehículo para ver el historial completo de servicios
          </div>
        </div>

        {/* RESULTADOS */}
        {loading && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ width:36, height:36, border:`3px solid ${gold}30`, borderTop:`3px solid ${gold}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontSize:11, color:"#555", letterSpacing:2 }}>BUSCANDO...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && results !== null && results.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 16px", background:card, borderRadius:10, border:`1px solid ${line}` }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:14, color:"#888", marginBottom:8 }}>No se encontraron servicios</div>
            <div style={{ fontSize:11, color:"#555" }}>
              No hay registros para la placa <strong style={{ color:gold }}>{searched}</strong>
            </div>
            <div style={{ fontSize:10, color:"#444", marginTop:8 }}>
              Si crees que esto es un error, contactá a Ramos y Ramos.
            </div>
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <>
            {/* Info del vehículo */}
            <div style={{ padding:"12px 16px", background:`${gold}0c`, border:`1px solid ${gold}30`, borderRadius:10, marginBottom:16 }}>
              <div style={{ fontSize:9, color:gold, letterSpacing:2, marginBottom:6 }}>VEHÍCULO ENCONTRADO</div>
              <div style={{ fontSize:16, fontWeight:"bold", color:"#e0d8cc" }}>{results[0].modelo || "Mercedes-Benz"}</div>
              <div style={{ fontSize:11, color:"#888", marginTop:4 }}>
                <span style={{ background:"#1a1a2a", border:`1px solid ${line}`, borderRadius:4, padding:"2px 8px", letterSpacing:2, marginRight:8 }}>{searched}</span>
                {results[0].motor && <span>{results[0].motor}</span>}
              </div>
              <div style={{ fontSize:11, color:"#555", marginTop:6 }}>
                {results.length} servicio{results.length > 1 ? "s" : ""} registrado{results.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Lista de servicios */}
            <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:10 }}>HISTORIAL</div>
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

  const pendientes = s.pendientes || [];
  const hasPendientes = pendientes.length > 0;
  const progreso = s.progreso || {};

  return (
    <div style={{ marginBottom:10, borderRadius:10, border:`1px solid ${hasPendientes ? "#f8717130" : "#1c1c2a"}`, overflow:"hidden" }}>

      {/* Encabezado */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{ padding:"14px 16px", background:card, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}
      >
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:"bold", color:gold }}>Servicio {s.servicio_codigo}</span>
            {hasPendientes && <span style={{ fontSize:9, background:"#f8717120", border:"1px solid #f8717140", color:"#f87171", borderRadius:4, padding:"1px 6px" }}>⚠️ PENDIENTE</span>}
            {!hasPendientes && <span style={{ fontSize:9, background:"#4ade8015", border:"1px solid #4ade8030", color:"#4ade80", borderRadius:4, padding:"1px 6px" }}>✅ OK</span>}
          </div>
          <div style={{ fontSize:11, color:"#888" }}>{s.servicio_desc}</div>
          <div style={{ fontSize:10, color:"#555", marginTop:4 }}>
            📅 {s.fecha} · 👤 {s.mecanico}
            {s.km && ` · 📍 ${parseInt(s.km).toLocaleString()} km`}
          </div>
        </div>
        <div style={{ fontSize:14, color:"#444", flexShrink:0 }}>{open ? "▲" : "▼"}</div>
      </div>

      {/* Detalle expandible */}
      {open && (
        <div style={{ background:"#0c0c14", borderTop:`1px solid ${line}`, padding:"14px 16px" }}>

          {/* Aceite */}
          {s.aceite_litros && (
            <div style={{ marginBottom:12, padding:"8px 12px", background:"#C8A96E0a", border:"1px solid #C8A96E20", borderRadius:8 }}>
              <span style={{ fontSize:11, color:gold }}>🛢️ Aceite cargado: <strong>{s.aceite_litros} L</strong> — {s.aceite_spec}</span>
            </div>
          )}

          {/* Revisiones */}
          {s.revisiones && Object.entries(s.revisiones).map(([grp, items]) => (
            <div key={grp} style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 }}>{grp.toUpperCase()}</div>
              {items.map((item, i) => {
                if (item.text?.startsWith("⚠")) return null;
                const isOk    = item.status === "ok";
                const isIssue = item.status === "issue";
                return (
                  <div key={i} style={{ display:"flex", gap:8, padding:"7px 10px", marginBottom:3, borderRadius:6, background: isOk?"#0a1a0a": isIssue?"#1a0a0a":"#0c0c12", border:`1px solid ${isOk?"#4ade8025":isIssue?"#f8717125":"#1c1c2a"}` }}>
                    <span style={{ flexShrink:0, fontSize:12 }}>{isOk?"✅":isIssue?"⚠️":"○"}</span>
                    <div>
                      <div style={{ fontSize:12, color: isOk?"#86efac":isIssue?"#fca5a5":"#555", lineHeight:1.4 }}>{item.text}</div>
                      {item.detail && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>→ {item.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Pendientes */}
          {hasPendientes && (
            <div style={{ marginBottom:12, padding:"10px 12px", background:"#1a0a0a", border:"1px solid #f8717130", borderRadius:8 }}>
              <div style={{ fontSize:9, color:"#f87171", letterSpacing:2, marginBottom:8 }}>⚠️ PUNTOS A ATENDER</div>
              {pendientes.map((p, i) => (
                <div key={i} style={{ fontSize:12, color:"#fca5a5", marginBottom:4, paddingLeft:8, borderLeft:"2px solid #f87171" }}>{p}</div>
              ))}
            </div>
          )}

          {/* Observaciones */}
          {s.observaciones && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 }}>OBSERVACIONES</div>
              <div style={{ fontSize:12, color:"#888", lineHeight:1.7, whiteSpace:"pre-line" }}>{s.observaciones}</div>
            </div>
          )}

          {/* Link al resumen completo */}
          <a
            href={`${APP_URL}/servicio/${s.id}`}
            style={{ display:"block", textAlign:"center", padding:"10px", borderRadius:8, border:`1px solid ${gold}40`, background:`${gold}0c`, color:gold, fontSize:11, textDecoration:"none", fontFamily:"monospace", letterSpacing:1 }}
          >
            📋 Ver resumen completo
          </a>
        </div>
      )}
    </div>
  );
}
