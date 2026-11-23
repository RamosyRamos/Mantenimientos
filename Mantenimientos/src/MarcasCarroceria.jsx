// ── Detalles de carrocería sobre la lámina (feat/marcas-carroceria, 23/11/2026) ──
// En una revisión de compra o general (RC / RG) el mecánico marca los detalles
// del carro: golpe, rayón, quebradura u "otro", cada uno con foto y descripción
// opcionales. Con lámina, toca el lugar y queda un punto numerado; sin lámina,
// el detalle es la foto con su descripción (el método de las fotos adicionales
// de la recepción).
//
// Las marcas viven en `carroceria_marcas` (una fila por marca, una lista por
// orden) y se escriben por las funciones de la base, no por el autosave del
// checklist: no entran en la huella del servicio ni en su borrador local.
// Las reglas (tipos, numeración, qué punto se dibuja, quién puede) están en el
// gemelo lib/marcasCarroceria.js.
//
// Este componente no conoce la red: recibe `leer`, `rpc` y `subirFoto`.
//   leer(filtro)        → { filas, error }      filtro = el `or=` de PostgREST
//   rpc(nombre, args)   → { data, error }
//   subirFoto(file)     → url | null            (avisa por su cuenta si falla)
//   asegurarServicio()  → id del servicio, guardándolo si todavía no existe
//
// data-tema-fijo: la lámina y sus puntos se ven IGUAL en los dos temas (ver la
// regla en CLAUDE.md, "La lámina técnica de la carrocería en el checklist").
//
// El panel a pantalla completa va por un portal a <body>, FUERA de #root: el tema
// claro es un `filter` sobre #root, y un filtro vuelve a su elemento el marco de
// todo `position: fixed` que tenga adentro (el panel mediría lo que mide la
// página, no la pantalla). Fuera de #root el panel no hereda el tema, así que lo
// replica él mismo: lleva el mismo filtro cuando el tema es claro, y la lámina y
// las fotos se vuelven a invertir para verse normales.
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import FotoPicker from "./FotoPicker.jsx";
import { T } from "./theme/tokensB.js";
import * as Ic from "./theme/iconos.jsx";
import { Boton, BotonIcono, Insignia, Etiqueta, tituloB, campoMB, MensajeCampo, opcionB } from "./theme/piezasB.jsx";
import {
  TIPOS_MARCA, ETIQUETA_TIPO, ORIGEN_REVISION, ORIGEN_RECEPCION, MAX_OTRO, MAX_DESCRIPCION,
  etiquetaMarca, marcasVigentes, laminaDeUrl, puntoDeMarca, tienePuntoGuardado, puntoDesdeToque,
  borradorMarca, problemaMarca, argumentosAgregar, argumentosEditar, resultadoMarca, filtroMarcas,
  puedeModificarMarca, puedeAgregarEnRevision, resumenMarcas,
} from "./lib/marcasCarroceria.js";

const INVERTIR = "invert(1) hue-rotate(180deg)";
const temaClaro = () => { try { return !!document.getElementById("root")?.style.filter.includes("invert"); } catch { return false; } };

// El punto numerado. Va dentro de un bloque data-tema-fijo, así que sus colores
// no se invierten en el tema claro.
function Punto({ x, y, numero, tam = 26, pendiente = false, activo = false, onClick }) {
  return (
    <button type="button" data-marca-punto data-numero={numero ?? ""} data-pendiente={pendiente ? "1" : undefined}
      onClick={onClick} tabIndex={onClick ? 0 : -1} aria-label={pendiente ? "Punto nuevo" : `Detalle ${numero}`}
      style={{
        position:"absolute", left:`${x * 100}%`, top:`${y * 100}%`, transform:"translate(-50%, -50%)",
        // minHeight / minWidth en 0: index.html les pone 44 de alto a todos los botones en
        // el teléfono, y el punto tiene que ser un círculo del tamaño pedido.
        width:tam, height:tam, minWidth:0, minHeight:0, borderRadius:"50%", padding:0, boxSizing:"border-box",
        background: pendiente ? T.plateBg : T.crit,
        border: `2px ${pendiente ? "dashed" : "solid"} ${T.plateText}`,
        boxShadow: activo ? `0 0 0 3px ${T.accent}` : "0 1px 3px rgba(0,0,0,0.45)",
        color:T.plateText, fontFamily:T.mono, fontVariantNumeric:"tabular-nums", fontWeight:700,
        fontSize: tam >= 24 ? 12.5 : 10, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center",
        cursor: onClick ? "pointer" : "default", pointerEvents: onClick ? "auto" : "none",
      }}>
      {pendiente ? "+" : numero}
    </button>
  );
}

export default function MarcasCarroceria({ laminaUrl, ordenId, servicioId, estadoServicio = "borrador", session, leer, rpc, subirFoto, asegurarServicio }) {
  const [filas, setFilas] = useState([]);
  const [errorCarga, setErrorCarga] = useState(null);
  const [laminaEstado, setLaminaEstado] = useState({ url: null, estado: "cargando" });
  const [abierto, setAbierto] = useState(false);
  const [claro, setClaro] = useState(false);
  const [edicion, setEdicion] = useState(null); // { modo:'nueva'|'editar', id, punto, mover, borrador }
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [errorForm, setErrorForm] = useState(null);
  const formRef = useRef(null);
  const vivoRef = useRef(true);
  useEffect(() => { vivoRef.current = true; return () => { vivoRef.current = false; }; }, []);
  // Las cuatro funciones llegan nuevas en cada render del padre: se guardan en un
  // ref para que la lectura dependa solo de QUÉ se lee, no de cuándo se redibuja.
  const api = useRef({ leer, rpc, subirFoto, asegurarServicio });
  api.current = { leer, rpc, subirFoto, asegurarServicio };

  // La lámina de hoy. Si su imagen falla se trata como "sin lámina": los
  // detalles se siguen pudiendo agregar, con foto y descripción.
  const laminaInfo = laminaDeUrl(laminaUrl);
  const estadoLamina = laminaInfo ? (laminaEstado.url === laminaInfo.url ? laminaEstado.estado : "cargando") : "sin";
  const lamina = estadoLamina === "error" ? null : laminaInfo;
  const laminaLista = !!lamina && estadoLamina === "ok";

  const filtro = filtroMarcas({ ordenId, servicioIds: [servicioId] });
  const cargar = useCallback(async () => {
    if (!filtro) { setFilas([]); setErrorCarga(null); return; }
    const r = await api.current.leer(filtro);
    if (!vivoRef.current) return;
    if (r?.error) { setErrorCarga(String(r.error)); return; }
    setErrorCarga(null);
    setFilas(Array.isArray(r?.filas) ? r.filas : []);
  }, [filtro]);
  useEffect(() => { cargar(); }, [cargar]);

  const marcas = marcasVigentes(filas);
  const rol = session?.rol;
  const puedeAgregar = puedeAgregarEnRevision({ rol, estadoServicio });
  const permisoDe = (m) => puedeModificarMarca(m, { sessionId: session?.id, rol, estadoServicio });

  const abrir = () => { setClaro(temaClaro()); setAbierto(true); };
  // Con el panel abierto la página de atrás no se desplaza.
  useEffect(() => {
    if (!abierto) return undefined;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, [abierto]);
  const reinvertir = claro ? { filter: INVERTIR } : null;

  const cerrarForm = () => { setEdicion(null); setErrorForm(null); };
  const cerrarPanel = () => { if (guardando || subiendo) return; cerrarForm(); setAbierto(false); };
  const nueva = (punto) => { setErrorForm(null); setEdicion({ modo: "nueva", id: null, punto: punto || null, mover: false, borrador: borradorMarca() }); };
  const editar = (m) => { setErrorForm(null); setEdicion({ modo: "editar", id: m.id, punto: puntoDeMarca(m, lamina?.codigo), mover: false, borrador: borradorMarca(m) }); };
  const cambiar = (campos) => setEdicion(e => (e ? { ...e, borrador: { ...e.borrador, ...campos } } : e));

  useEffect(() => {
    if (edicion && formRef.current?.scrollIntoView) formRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [edicion?.modo, edicion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toque sobre la lámina: mueve el punto de lo que se está editando o, si no
  // hay nada abierto, empieza un detalle nuevo en ese lugar.
  const tocarLamina = (e) => {
    if (!laminaLista) return;
    const img = e.currentTarget.querySelector("img");
    const punto = puntoDesdeToque(e, img?.getBoundingClientRect());
    if (!punto) return;
    if (edicion?.modo === "nueva") { setEdicion(ed => ({ ...ed, punto })); return; }
    if (edicion?.modo === "editar") { if (edicion.mover) setEdicion(ed => ({ ...ed, punto })); return; }
    if (puedeAgregar) nueva(punto);
  };

  const tomarFoto = async (file) => {
    setSubiendo(true); setErrorForm(null);
    const url = await api.current.subirFoto(file);
    if (!vivoRef.current) return;
    setSubiendo(false);
    if (url) cambiar({ foto_url: url });
  };

  const guardar = async () => {
    if (!edicion || guardando) return;
    const problema = problemaMarca(edicion.borrador);
    if (problema) { setErrorForm(problema); return; }
    setGuardando(true); setErrorForm(null);
    let r;
    if (edicion.modo === "nueva") {
      const sid = await api.current.asegurarServicio();
      if (!sid) {
        if (vivoRef.current) { setGuardando(false); setErrorForm("El servicio todavía no se pudo guardar. Revisá la conexión y probá de nuevo."); }
        return;
      }
      r = await api.current.rpc("carroceria_marca_agregar", argumentosAgregar({ origen: ORIGEN_REVISION, servicioId: sid, borrador: edicion.borrador, punto: edicion.punto, lamina }));
    } else {
      r = await api.current.rpc("carroceria_marca_editar", argumentosEditar({ id: edicion.id, borrador: edicion.borrador, mover: edicion.mover, punto: edicion.punto, lamina }));
    }
    if (!vivoRef.current) return;
    const res = resultadoMarca(r?.data, r?.error);
    setGuardando(false);
    if (!res.ok) { setErrorForm(res.mensaje); return; }
    // Solo lo que devolvió la base entra a la lista.
    if (res.marca?.id) setFilas(f => [...f.filter(x => x.id !== res.marca.id), res.marca]);
    else cargar();
    cerrarForm();
  };

  const quitar = async () => {
    if (!edicion?.id || guardando) return;
    if (!window.confirm("¿Quitar este detalle de la lista?")) return;
    setGuardando(true); setErrorForm(null);
    const r = await api.current.rpc("carroceria_marca_quitar", { p_id: edicion.id });
    if (!vivoRef.current) return;
    const res = resultadoMarca(r?.data, r?.error);
    setGuardando(false);
    if (!res.ok) { setErrorForm(res.mensaje); return; }
    const id = edicion.id;
    setFilas(f => f.filter(x => x.id !== id));
    cerrarForm();
  };

  // Los puntos que se dibujan sobre la lámina de hoy.
  const puntos = lamina ? marcas.map(m => ({ m, p: puntoDeMarca(m, lamina.codigo) })).filter(x => x.p) : [];
  const idEditando = edicion?.modo === "editar" ? edicion.id : null;

  const dibujo = (grande) => (
    <span style={grande
      ? { position:"relative", display:"block", width:"100%", maxWidth:900, lineHeight:0 }
      : { position:"relative", display:"inline-block", lineHeight:0, maxWidth:"100%" }}>
      <img src={lamina.url} alt="Lámina técnica del vehículo" draggable={false}
        onLoad={() => setLaminaEstado({ url: lamina.url, estado: "ok" })}
        onError={() => setLaminaEstado({ url: lamina.url, estado: "error" })}
        style={grande
          ? { display:"block", width:"100%", height:"auto", userSelect:"none" }
          : { display:"block", maxWidth:"100%", width:"auto", height:"auto", maxHeight:220, userSelect:"none" }} />
      {laminaLista && puntos.map(({ m, p }) => (idEditando === m.id && edicion.mover) ? null : (
        <Punto key={m.id} x={p.x} y={p.y} numero={m.numero} tam={grande ? 26 : 16} activo={grande && idEditando === m.id}
          onClick={grande && permisoDe(m) && !edicion ? (ev) => { ev.stopPropagation(); editar(m); } : undefined} />
      ))}
      {grande && laminaLista && edicion?.punto && (edicion.modo === "nueva" || edicion.mover) && (
        <Punto x={edicion.punto.x} y={edicion.punto.y} pendiente tam={26} />
      )}
    </span>
  );

  const b = edicion?.borrador;
  const formulario = edicion && (
    <div ref={formRef} data-marca-form data-modo={edicion.modo} style={{ padding:14, borderRadius:12, border:`1px solid ${T.borderStrong}`, background:T.card, display:"flex", flexDirection:"column", gap:12 }}>
      <h3 style={{ ...tituloB }}>{edicion.modo === "nueva" ? "Detalle nuevo" : "Editar detalle"}</h3>
      <div>
        <Etiqueta requerido>Tipo</Etiqueta>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TIPOS_MARCA.map(t => (
            <button key={t} type="button" data-marca-tipo={t} aria-pressed={b.tipo === t} onClick={() => cambiar({ tipo: t })}
              style={opcionB(b.tipo === t, { minHeight:44, padding:"0 14px", flex:"1 1 90px" })}>
              {ETIQUETA_TIPO[t]}
            </button>
          ))}
        </div>
      </div>
      {b.tipo === "otro" && (
        <div>
          <Etiqueta requerido>¿Qué es?</Etiqueta>
          <input data-marca-otro value={b.tipo_otro} maxLength={MAX_OTRO} placeholder="Por ejemplo: óxido, pintura saltada"
            onChange={e => cambiar({ tipo_otro: e.target.value })} style={{ ...campoMB, width:"100%", boxSizing:"border-box" }} />
        </div>
      )}
      <div>
        <Etiqueta>Descripción</Etiqueta>
        <textarea data-marca-descripcion value={b.descripcion} maxLength={MAX_DESCRIPCION} rows={2} placeholder="Opcional: dónde está y cómo se ve"
          onChange={e => cambiar({ descripcion: e.target.value })} style={{ ...campoMB, width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      </div>
      <div>
        <Etiqueta>Foto</Etiqueta>
        {b.foto_url ? (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <a href={b.foto_url} target="_blank" rel="noreferrer" style={{ lineHeight:0 }}>
              <img data-marca-foto src={b.foto_url} alt="Foto del detalle" style={{ ...reinvertir, width:72, height:72, objectFit:"cover", borderRadius:8, border:`1px solid ${T.borderDefault}`, display:"block" }} />
            </a>
            <button type="button" data-marca-quitar-foto onClick={() => cambiar({ foto_url: null })}
              style={{ background:"none", border:"none", color:T.crit, fontFamily:T.sans, fontSize:13, minHeight:44, padding:"0 8px", cursor:"pointer" }}>
              Quitar foto
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8 }}>
            <FotoPicker onFile={tomarFoto} busy={subiendo} disabled={guardando} />
          </div>
        )}
      </div>
      {edicion.modo === "editar" && laminaLista && (
        <label style={{ display:"flex", alignItems:"center", gap:10, minHeight:44, fontSize:13.5, color:T.textSoft, cursor:"pointer" }}>
          <input type="checkbox" data-marca-mover checked={edicion.mover} onChange={e => setEdicion(ed => ({ ...ed, mover: e.target.checked }))}
            style={{ width:20, height:20, accentColor:T.accent }} />
          Cambiar el punto: tocá la lámina en el lugar nuevo
        </label>
      )}
      {edicion.modo === "nueva" && laminaLista && (
        <div style={{ fontSize:12.5, color:T.textMuted, lineHeight:1.45 }}>
          {edicion.punto ? "Punto marcado. Si no quedó bien, tocá la lámina de nuevo." : "Sin punto en la lámina. Si querés marcarlo, tocá la lámina."}
        </div>
      )}
      {errorForm && <MensajeCampo error data-marca-error>{errorForm}</MensajeCampo>}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <Boton jerarquia="principal" icono={Ic.Check} data-marca-guardar onClick={guardar} disabled={guardando || subiendo} style={{ flex:"1 1 150px" }}>
          {guardando ? "Guardando…" : "Guardar detalle"}
        </Boton>
        <Boton data-marca-cancelar onClick={cerrarForm} disabled={guardando}>Cancelar</Boton>
        {edicion.modo === "editar" && (
          <button type="button" data-marca-quitar onClick={quitar} disabled={guardando}
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:"none", border:"none", color:T.crit, fontFamily:T.sans, fontSize:13, minHeight:44, padding:"0 8px", cursor:"pointer" }}>
            <Ic.Trash2 size={15} />Quitar detalle
          </button>
        )}
      </div>
    </div>
  );

  const lista = (
    <div data-marcas-lista style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {marcas.length === 0 && (
        <div data-marcas-vacio style={{ fontSize:13.5, color:T.textMuted, padding:"10px 2px", lineHeight:1.45 }}>
          Todavía no hay detalles marcados.
        </div>
      )}
      {marcas.map(m => {
        const dibujado = !!puntoDeMarca(m, lamina?.codigo);
        return (
          <div key={m.id} data-marca data-numero={m.numero} data-tipo={m.tipo} data-origen={m.origen}
            style={{ display:"flex", gap:10, alignItems:"flex-start", padding:10, borderRadius:10, border:`1px solid ${idEditando === m.id ? T.accent : T.borderDefault}`, background:T.panel }}>
            <span style={{ flexShrink:0, width:26, height:26, borderRadius:"50%", background:T.crit, color:T.plateText, fontFamily:T.mono, fontVariantNumeric:"tabular-nums", fontWeight:700, fontSize:12.5, display:"flex", alignItems:"center", justifyContent:"center" }}>{m.numero}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <span data-marca-nombre style={{ fontSize:14, fontWeight:600, color:T.text, overflowWrap:"anywhere" }}>{etiquetaMarca(m)}</span>
                {m.origen === ORIGEN_RECEPCION && <Insignia color={T.info}>Recepción</Insignia>}
                {lamina && !dibujado && <Insignia color={T.neutral} title={tienePuntoGuardado(m) ? "Se marcó sobre otra lámina" : "Sin punto en la lámina"}>Sin punto</Insignia>}
              </div>
              {m.descripcion && <div data-marca-detalle style={{ fontSize:13.5, color:T.textSoft, marginTop:3, lineHeight:1.45, overflowWrap:"anywhere", whiteSpace:"pre-wrap" }}>{m.descripcion}</div>}
              {m.creado_por && <div style={{ fontSize:11.5, color:T.textMuted, marginTop:4 }}>{m.creado_por}</div>}
            </div>
            {m.foto_url && (
              <a href={m.foto_url} target="_blank" rel="noreferrer" style={{ flexShrink:0, lineHeight:0 }}>
                <img src={m.foto_url} alt={`Foto del detalle ${m.numero}`} loading="lazy" style={{ ...reinvertir, width:56, height:56, objectFit:"cover", borderRadius:8, border:`1px solid ${T.borderDefault}`, display:"block" }} />
              </a>
            )}
            {permisoDe(m) && (
              <BotonIcono icono={Ic.Pencil} title={`Editar el detalle ${m.numero}`} data-marca-editar onClick={() => editar(m)} disabled={!!edicion} style={{ flexShrink:0 }} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div data-marcas-carroceria style={{ marginTop:8 }}>
      {/* La lámina, con los puntos. Nace oculta y se muestra cuando la imagen
          cargó; si la URL falla, queda oculta (como antes de las marcas). */}
      {lamina && (
        <div key={lamina.url} data-lamina-carroceria data-tema-fijo role="button" tabIndex={0} aria-label="Abrir los detalles de carrocería"
          onClick={abrir} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } }}
          style={{ background:T.plateBg, borderRadius:T.radio.control, padding:6, display: laminaLista ? "flex" : "none", justifyContent:"center", cursor:"pointer" }}>
          {dibujo(false)}
        </div>
      )}
      <button type="button" data-marcas-abrir onClick={abrir}
        style={{ marginTop: lamina && laminaLista ? 6 : 0, width:"100%", minHeight:44, display:"flex", alignItems:"center", gap:8, padding:"0 12px", borderRadius:T.radio.control, border:`1px solid ${T.borderDefault}`, background:T.card, color:T.text, fontFamily:T.sans, fontSize:14, cursor:"pointer", textAlign:"left" }}>
        <Ic.MapPin size={16} color={T.accentMuted} />
        <span style={{ flex:1, minWidth:0 }}>Detalles de carrocería</span>
        <span data-marcas-resumen style={{ fontSize:13, color: marcas.length ? T.text : T.textMuted, fontFamily:T.mono, fontVariantNumeric:"tabular-nums" }}>{resumenMarcas(marcas)}</span>
        <Ic.ChevronRight size={16} color={T.textMuted} />
      </button>
      {errorCarga && (
        <MensajeCampo error data-marcas-error-carga>
          No se pudieron leer los detalles ({errorCarga}). <button type="button" onClick={cargar} style={{ background:"none", border:"none", color:T.accent, fontFamily:T.sans, fontSize:"inherit", cursor:"pointer", padding:0, textDecoration:"underline" }}>Reintentar</button>
        </MensajeCampo>
      )}

      {abierto && createPortal(
        <div data-marcas-panel data-tema={claro ? "claro" : "oscuro"} role="dialog" aria-modal="true" aria-label="Detalles de carrocería"
          style={{ position:"fixed", inset:0, zIndex:600, background:T.shell, color:T.text, fontFamily:T.sans, overflowY:"auto", WebkitOverflowScrolling:"touch", ...(claro ? { filter: INVERTIR } : null) }}>
          <div style={{ position:"sticky", top:0, zIndex:2, display:"flex", alignItems:"center", gap:8, padding:"8px 8px 8px 16px", background:T.panel, borderBottom:`1px solid ${T.borderSubtle}` }}>
            <h2 style={{ ...tituloB, fontSize:16, flex:1, minWidth:0 }}>Detalles de carrocería</h2>
            <span style={{ fontSize:13, color:T.textMuted, fontFamily:T.mono, fontVariantNumeric:"tabular-nums" }}>{resumenMarcas(marcas)}</span>
            <BotonIcono icono={Ic.X} title="Cerrar" data-marcas-cerrar onClick={cerrarPanel} />
          </div>
          <div style={{ maxWidth:920, margin:"0 auto", padding:"12px 12px 28px", display:"flex", flexDirection:"column", gap:12 }}>
            {lamina && (
              <div data-marcas-lamina data-tema-fijo onClick={tocarLamina}
                style={{ ...reinvertir, background:T.plateBg, borderRadius:T.radio.control, padding:8, display: laminaLista ? "flex" : "none", justifyContent:"center", touchAction:"manipulation", cursor: (puedeAgregar && !edicion) || edicion?.modo === "nueva" || edicion?.mover ? "crosshair" : "default" }}>
                {dibujo(true)}
              </div>
            )}
            {!lamina && (
              <div data-marcas-sin-lamina style={{ fontSize:13, color:T.textMuted, lineHeight:1.5 }}>
                Este vehículo no tiene lámina: los detalles se registran con su foto y su descripción. Si se identifica el vehículo con el VIN en Taller, aparece la lámina.
              </div>
            )}
            {puedeAgregar ? (
              !edicion && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {laminaLista && <div data-marcas-ayuda style={{ fontSize:13.5, color:T.textSoft, lineHeight:1.45 }}>Tocá la lámina donde está el detalle.</div>}
                  <Boton icono={Ic.Plus} data-marcas-agregar onClick={() => nueva(null)} ancho>
                    {laminaLista ? "Agregar un detalle sin marcar en la lámina" : "Agregar detalle"}
                  </Boton>
                </div>
              )
            ) : (
              <div data-marcas-solo-lectura style={{ fontSize:13, color:T.textMuted, lineHeight:1.5 }}>
                La revisión ya se cerró: los detalles los cambia un jefe.
              </div>
            )}
            {formulario}
            {lista}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
