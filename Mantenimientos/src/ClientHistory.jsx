import { useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || window.location.origin;

const LOGO_SRC = "data:image/png;base64,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";

const bg   = "#09090e";
const card = "#0f0f17";
const line = "#1c1c2a";
const gold = "#C8A96E";

// v2.1
export default function ClientHistory() {
  const [placa, setPlaca]       = useState("");
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState("");

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
    <div id="history-root" style={{ minHeight:"100vh", background:bg, fontFamily:"monospace", color:"#e0d8cc", paddingBottom:48 }}>

      {/* HEADER */}
      <div style={{ background:"#0d0d16", borderBottom:`1px solid ${line}`, padding:"16px 20px" }}>
        <div style={{ maxWidth:560, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:"bold", fontSize:13, letterSpacing:2 }}>RAMOS Y RAMOS</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>HISTORIAL DE MANTENIMIENTOS</div>
          </div>
          <button onClick={() => {
            const root = document.getElementById('history-root');
            const isLight = root.style.filter.includes('invert');
            root.style.filter = isLight ? '' : 'invert(1) hue-rotate(180deg)';
            root.style.transition = 'filter 0.2s';
            root.querySelectorAll('img, canvas').forEach(el => {
              el.style.filter = isLight ? '' : 'invert(1) hue-rotate(180deg)';
            });
          }} style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${line}`, background:"#0f0f17", color:"#555", fontSize:15, cursor:"pointer", flexShrink:0 }}>
            ☀️
          </button>
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

  const progreso = s.progreso || {};
  const hasIssues = Object.values(s.revisiones || {}).flat().some(item => item.status === "issue");

  return (
    <div style={{ marginBottom:10, borderRadius:10, border:`1px solid ${hasIssues ? "#f8717130" : "#1c1c2a"}`, overflow:"hidden" }}>

      {/* Encabezado */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{ padding:"14px 16px", background:card, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}
      >
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:"bold", color:gold }}>Servicio {s.servicio_codigo}</span>
            {hasIssues && <span style={{ fontSize:9, background:"#f8717120", border:"1px solid #f8717140", color:"#f87171", borderRadius:4, padding:"1px 6px" }}>⚠️ Con detalles</span>}
            {!hasIssues && <span style={{ fontSize:9, background:"#4ade8015", border:"1px solid #4ade8030", color:"#4ade80", borderRadius:4, padding:"1px 6px" }}>✅ OK</span>}
          </div>
          <div style={{ fontSize:11, color:"#888" }}>{s.servicio_desc}</div>
          <div style={{ fontSize:10, color:"#555", marginTop:4 }}>
            📅 {s.fecha} · 👤 {s.mecanico}
            {s.aprobado_por && <span style={{ color:"#4ade80" }}> · ✅ {s.aprobado_por}</span>}
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
                const isNA    = item.status === "na";
                return (
                  <div key={i} style={{ display:"flex", gap:8, padding:"7px 10px", marginBottom:3, borderRadius:6, background: isOk?"#0a1a0a": isIssue?"#1a0a0a": isNA?"#0c0c0c":"#0c0c12", border:`1px solid ${isOk?"#4ade8025":isIssue?"#f8717125":isNA?"#33333335":"#1c1c2a"}` }}>
                    <span style={{ flexShrink:0, fontSize:12 }}>{isOk?"✅":isIssue?"⚠️":isNA?"—":"○"}</span>
                    <div>
                      <div style={{ fontSize:12, color: isOk?"#86efac":isIssue?"#fca5a5":isNA?"#444":"#555", textDecoration:isNA?"line-through":"none", lineHeight:1.4 }}>
                        {item.text}{isNA && <span style={{ fontSize:10, color:"#444", marginLeft:6 }}>No aplica</span>}
                      </div>
                      {item.detail && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>→ {item.detail}</div>}
                      {item.fotos?.length > 0 && (
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
                          {item.fotos.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt="" style={{ width:52, height:52, objectFit:"cover", borderRadius:4, border:"1px solid #f8717130" }} />
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
