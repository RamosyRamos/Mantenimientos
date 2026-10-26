// ── Los puntos de un checklist: identidad, cierre de una revisión y dictamen ──
// (fix/revisiones-fase1, 25/10/2026)
//
// ⚠ ARCHIVO GEMELO — vive DUPLICADO, byte a byte, en los dos repos:
//     Taller          → src/lib/revisionPuntos.js
//     Mantenimientos  → Mantenimientos/src/lib/revisionPuntos.js
//   TODO cambio acá se copia al otro repo en el mismo movimiento (los dos deben
//   dar el MISMO sha256). Puro: sin React, sin red, sin imports.
//
// IDENTIDAD DE LOS PUNTOS (decisión de Tavo del 25/10):
// - Cada tarea de `mant_items.tasks` tiene una clave estable `<ítem>:<n>` en
//   `mant_items.tareas_claves` (RC:19, RG_PTS:17, 3:1). `n` nunca se reutiliza.
//   El id de un punto guardado es esa clave.
// - Los servicios viejos tienen ids POR POSICIÓN (`<ítem>_<índice>`): ese número
//   NUNCA se usa para emparejar (la receta se movió y el índice miente). Solo
//   sirve para saber de qué ítem es el punto.
// - Un punto que al reabrir no calza con ninguna tarea de hoy queda como
//   "Puntos de la versión anterior": se conserva tal cual, con su id viejo y
//   `version_anterior: true`, en solo lectura, y no cuenta para el cierre.
//
// CIERRE DE UNA REVISIÓN DE COMPRA O GENERAL (RC / RG):
// - No se manda a aprobar ni se aprueba mientras quede algún punto sin estado
//   (OK, hallazgo o N/A) o falte el dictamen. Vale para TODOS los caminos:
//   confirmar en Mantenimientos, "Revisión de aprobación", "Enviar a orden" y
//   aprobar en Taller. No existe un estado "no revisado".

// ── Identidad ────────────────────────────────────────────────────────────────

export const RE_CLAVE_ESTABLE = /^([A-Za-z0-9_]+):([1-9][0-9]*)$/;

export const esClaveEstable = (id) => RE_CLAVE_ESTABLE.test(String(id ?? ""));

// El ítem de un punto a partir de su id. Clave estable: lo que va antes de los
// dos puntos ("RC:19" → "RC"). Id viejo: se quita SOLO el último "_n", nunca
// por prefijo ("GLOW_TEST_0" → "GLOW_TEST", "3_0" → "3"). Sin forma → null.
export function itemDeIdPunto(id) {
  const s = String(id ?? "");
  const m = RE_CLAVE_ESTABLE.exec(s);
  if (m) return m[1];
  const i = s.lastIndexOf("_");
  if (i <= 0 || !/^\d+$/.test(s.slice(i + 1))) return null;
  return s.slice(0, i);
}

export const esVersionAnterior = (p) => !!p && p.version_anterior === true;

// Las filas informativas (texto que abre con ⚠) no se marcan ni cuentan.
export const esFilaInformativa = (p) => String(p?.text ?? "").startsWith("⚠");

// ¿Cuenta para el progreso y para el cierre?
export const puntoSeguible = (p) => !!p && typeof p === "object" && !esVersionAnterior(p) && !esFilaInformativa(p);

export const ESTADOS_CERRADOS = Object.freeze(["ok", "issue", "na"]);

export const puntoCerrado = (p) => ESTADOS_CERRADOS.includes(p?.status);

// Texto comparable: sin el "~" de procedimiento interno, sin tildes ni
// mayúsculas, y sin nada que no sea letra o número.
export const normalizarTextoPunto = (s) => String(s ?? "")
  .replace(/^\s*~\s*/, "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

// Los puntos de `servicios.revisiones` ({ grupo: [puntos] }) en orden.
export function puntosDeRevisiones(revisiones) {
  const out = [];
  if (!revisiones || typeof revisiones !== "object" || Array.isArray(revisiones)) return out;
  for (const [grupo, lista] of Object.entries(revisiones)) {
    for (const p of (Array.isArray(lista) ? lista : [])) {
      if (p && typeof p === "object") out.push({ grupo, punto: p });
    }
  }
  return out;
}

// ── Cierre de una revisión RC / RG ───────────────────────────────────────────

// 'compra' | 'general' | null, por el código EXACTO del servicio.
export function tipoRevision(codigo) {
  const c = String(codigo ?? "").trim().toUpperCase();
  return c === "RC" ? "compra" : c === "RG" ? "general" : null;
}

export const DICTAMEN_TEXTO = Object.freeze({
  compra: Object.freeze({
    apto: "Apto para compra",
    apto_reparaciones: "Apto con reparaciones",
    no_recomendable: "No recomendable",
  }),
  general: Object.freeze({
    excelente: "Excelente",
    bueno: "Bueno, atención menor",
    requiere_reparaciones: "Requiere reparaciones",
    critico: "Estado crítico",
  }),
});

export const textoDictamen = (tipo, clave) => DICTAMEN_TEXTO[tipo]?.[clave] || null;

export const dictamenElegido = (tipo, clave) => !!textoDictamen(tipo, clave);

// Los puntos que cuentan y no tienen estado, en orden: [{ grupo, texto, id }].
export function faltantesDeRevisiones(revisiones) {
  return puntosDeRevisiones(revisiones)
    .filter(({ punto }) => puntoSeguible(punto) && !puntoCerrado(punto))
    .map(({ grupo, punto }) => ({ grupo, texto: String(punto.text ?? "").replace(/^\s*~\s*/, ""), id: punto.id ?? null }));
}

const listaNatural = (nombres) => {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
};

export const MAX_FALTANTES_EN_MENSAJE = 5;

export function mensajeCierre({ tipo, faltantes = [], sinDictamen = false }) {
  const partes = [];
  if (faltantes.length) {
    const nombres = faltantes.slice(0, MAX_FALTANTES_EN_MENSAJE).map(f => f.texto || "(sin texto)");
    const resto = faltantes.length - nombres.length;
    const lista = resto > 0 ? `${nombres.join(", ")} y ${resto} más` : listaNatural(nombres);
    partes.push(faltantes.length === 1
      ? `Falta 1 punto sin marcar (OK, hallazgo o N/A): ${lista}.`
      : `Faltan ${faltantes.length} puntos sin marcar (OK, hallazgo o N/A): ${lista}.`);
  }
  if (sinDictamen) {
    partes.push(tipo === "general"
      ? "Falta el dictamen: elegí el estado del vehículo."
      : "Falta el dictamen: elegí la recomendación de compra.");
  }
  return partes.length ? `La revisión no se puede cerrar. ${partes.join(" ")}` : "";
}

// null si la revisión se puede cerrar (o si el servicio no es RC / RG);
// si no, { tipo, faltantes, sinDictamen, mensaje }.
export function problemaCierreRevision({ codigo, revisiones, dictamen }) {
  const tipo = tipoRevision(codigo);
  if (!tipo) return null;
  const faltantes = faltantesDeRevisiones(revisiones);
  const sinDictamen = !dictamenElegido(tipo, dictamen?.recomendacion);
  if (!faltantes.length && !sinDictamen) return null;
  return { tipo, faltantes, sinDictamen, mensaje: mensajeCierre({ tipo, faltantes, sinDictamen }) };
}

// ── Reparaciones sugeridas del dictamen ──────────────────────────────────────
// Cada una tiene un `id` propio: el precio (que pone Taller, tabla
// servicio_reparacion_precios) cuelga de ese id, nunca de la posición. El
// mecánico solo escribe la descripción: ningún monto sale de Mantenimientos.

const azar = () => {
  try {
    const c = globalThis.crypto;
    if (c?.getRandomValues) {
      const a = new Uint32Array(2);
      c.getRandomValues(a);
      return a[0].toString(36) + a[1].toString(36);
    }
  } catch { /* sin crypto: Math.random */ }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
};

export const nuevaReparacion = () => ({ id: `r${azar()}`.slice(0, 24), descripcion: "" });

export const RE_ID_REPARACION = /^[A-Za-z0-9_-]{1,64}$/;

// Las reparaciones de un dictamen, con el id que ya tienen: el válido y la
// primera vez que aparece; si no, null. Nunca inventa uno.
function conIdGuardado(lista) {
  const usados = new Set();
  return (Array.isArray(lista) ? lista : [])
    .filter(r => r && typeof r === "object")
    .map(r => {
      const id = typeof r.id === "string" && RE_ID_REPARACION.test(r.id) && !usados.has(r.id) ? r.id : null;
      if (id) usados.add(id);
      return { id, descripcion: String(r.descripcion ?? "") };
    });
}

// Las reparaciones como las guarda Mantenimientos: { id, descripcion }, con id
// para las que no lo tenían, y sin ningún monto (costo_estimado se descarta).
// Es el ÚNICO lugar que da ids (bug 3, 26/10): se llama al crear una reparación
// o al cargar una sin id, y lo que devuelve se persiste. Nunca para mostrar.
export function reparacionesParaGuardar(lista) {
  const usados = new Set();
  return conIdGuardado(lista).map(r => {
    let id = r.id && !usados.has(r.id) ? r.id : null;
    while (!id || usados.has(id)) id = nuevaReparacion().id;
    usados.add(id);
    return { id, descripcion: r.descripcion };
  });
}

// ¿Alguna reparación sin id válido, o con el id repetido? Entonces hay que
// dárselo (reparacionesParaGuardar) y guardarlo.
export const reparacionesSinId = (lista) => conIdGuardado(lista).some(r => !r.id);

// Las que tienen texto (las vacías no se muestran ni se cotizan), con su id
// guardado o null: una sin id se muestra sin precio. No inventa ids (bug 3).
export const reparacionesConTexto = (lista) =>
  conIdGuardado(lista).filter(r => r.descripcion.trim() !== "");

export const formatoColones = (n) => {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return "";
  return `₡${String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
};

// ── El bloque del dictamen en el informe de la orden ─────────────────────────
// (ordenes.informe_mantenimiento). Va DESPUÉS del encabezado (mecánico,
// aprobado por, kilometraje) y antes de los detalles. Los montos salen SOLO de
// `precios` ({ [id de la reparación]: monto }), que lee Taller; desde
// Mantenimientos el bloque se arma sin montos.

export const MARCA_DICTAMEN = "📋 Dictamen:";

export function bloqueDictamenInforme({ codigo, dictamen, precios = null }) {
  const tipo = tipoRevision(codigo);
  const texto = textoDictamen(tipo, dictamen?.recomendacion);
  if (!texto) return "";
  const reps = reparacionesConTexto(dictamen?.reparaciones);
  let total = 0, conPrecio = 0;
  const lineas = [`${MARCA_DICTAMEN} ${texto}`];
  if (reps.length) {
    lineas.push("Reparaciones sugeridas:");
    for (const r of reps) {
      const monto = r.id ? Number(precios?.[r.id]) : 0;   // sin id no hay precio
      const desc = r.descripcion.trim().replace(/\s*\n+\s*/g, "; ");
      if (monto > 0) { total += monto; conPrecio++; lineas.push(`- ${desc} — ${formatoColones(monto)}`); }
      else lineas.push(`- ${desc}`);
    }
    if (conPrecio > 0) lineas.push(`Total estimado: ${formatoColones(total)}`);
  }
  return lineas.join("\n");
}

// El informe con el bloque del dictamen al día: reemplaza el que tenga o lo
// pone después del encabezado. Un bloque vacío lo saca.
export function conBloqueDictamen(informe, bloque) {
  const secciones = String(informe ?? "").split("\n\n");
  const sinBloque = secciones.filter(s => !s.startsWith(MARCA_DICTAMEN));
  if (!bloque) return sinBloque.join("\n\n");
  const pos = Math.min(2, sinBloque.length);
  return [...sinBloque.slice(0, pos), bloque, ...sinBloque.slice(pos)].join("\n\n");
}
