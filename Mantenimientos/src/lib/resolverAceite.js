// Aceite del vehículo desde la Edge Function `resolver-aceite` de Taller
// (rama feat/aceite-desde-resolver, 5/10/2026).
//
// La función corre el MISMO resolvedor que el cotizador de Taller (catálogo
// verificado: WIS → dato del taller → Ravenol → pendiente) y devuelve
//   { vehiculo_id, aceite, atf, avisos, build }
// con aceite = { estado, litros, spec, viscosidad, origen:{tipo,etiqueta},
// motivo, opciones:[{litros, spec, etiqueta, origen}], fuentes }.
//
// Decisiones del dueño (2026-10-05):
//  1. El aceite sale de acá: con orden_id si el servicio viene de una orden; si
//     no, con el vehiculo_id del vehículo encontrado por la placa.
//  2. Varias cantidades → el mecánico elige entre las opciones DOCUMENTADAS
//     (WIS, dato del taller, Ravenol), cada una con su condición.
//  3. Sin dato → lo guardado en el servicio, o "Aceite no disponible". NUNCA
//     las columnas viejas aceite_lt / especif_mb de vehiculos_modelos.
//
// Puro: no importa supabase ni import.meta.env. El llamador pasa la URL, los
// headers (JWT de la sesión + x-session-id) y, en los tests, un fetch falso.

export const RESOLVER_TIMEOUT_MS = 8000;

export const MENSAJE_SIN_DATO = "Aceite no disponible: identificá el vehículo (VIN)";

// origen.tipo del resolvedor → lo que se le muestra al mecánico.
export const ORIGEN_TEXTO = {
  catalogo: "WIS",
  taller: "Dato del taller",
  ravenol: "Ravenol",
};

// Solo estas opciones están documentadas. El resolvedor puede ofrecer además
// la cantidad "histórica" del vehículo (sale de vehiculos.aceite_lt) o una
// referencia sin verificar: esas NO se le ofrecen al mecánico.
const ORIGENES_DOCUMENTADOS = new Set(Object.keys(ORIGEN_TEXTO));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (v) => typeof v === "string" && UUID.test(v.trim());

const litrosValidos = (v) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== "" && Number.isFinite(n) && n > 0 ? n : null;
};
const textoValido = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

// La condición de una opción es su etiqueta sin la cantidad del final:
// el resolvedor la arma como "<condiciones>: <litros> L" ("Con código M005:
// 6.5 L" → "Con código M005"). Una etiqueta que es solo "7.5 L" no tiene
// condición; cualquier otro texto se devuelve entero.
export function condicionDeEtiqueta(etiqueta) {
  const e = textoValido(etiqueta);
  if (!e) return null;
  const m = e.match(/^(.*?):\s*\d+(?:[.,]\d+)?\s*L\s*$/i);
  if (m) return textoValido(m[1]);
  if (/^\d+(?:[.,]\d+)?\s*L$/i.test(e)) return null;
  return e;
}

/**
 * Llama a la función. Nunca lanza: devuelve
 *   { ok: true, datos }                       respuesta 200
 *   { ok: false, motivo, status?, error? }    motivo: 'sin_sesion' | 'no_encontrado'
 *                                             | 'entrada_invalida' | 'http' | 'red' | 'timeout'
 */
export async function llamarResolverAceite(entrada, { url, headers = {}, fetchImpl, timeoutMs = RESOLVER_TIMEOUT_MS } = {}) {
  const f = fetchImpl ?? globalThis.fetch;
  const body = entrada?.ordenId ? { orden_id: entrada.ordenId } : { vehiculo_id: entrada?.vehiculoId };
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  let vencido = false;
  const timer = setTimeout(() => { vencido = true; ctrl?.abort(); }, timeoutMs);
  let res;
  try {
    res = await f(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl?.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, motivo: vencido ? "timeout" : "red", error: e };
  }
  let datos = null;
  try { datos = await res.json(); } catch { datos = null; }
  clearTimeout(timer);
  if (vencido) return { ok: false, motivo: "timeout" };
  if (res.ok) return { ok: true, datos };
  const motivo =
    res.status === 401 ? "sin_sesion"
    : res.status === 404 ? "no_encontrado"
    : res.status === 400 ? "entrada_invalida"
    : "http";
  return { ok: false, motivo, status: res.status, error: datos?.error ?? null };
}

/**
 * De la respuesta de la función, lo que Mantenimientos necesita del aceite:
 *   tipo: 'cantidad' — hay litros (con o sin spec)
 *         'opciones' — varias cantidades documentadas, elige el mecánico
 *         'sin_dato' — nada que mostrar del resolvedor
 *   litros, spec, origen ('WIS' | 'Dato del taller' | 'Ravenol' | null),
 *   etiquetaOrigen (el detalle del resolvedor), motivo,
 *   opciones: [{ litros, spec, condicion, etiqueta, origen }]
 */
export function aceiteDeRespuesta(datos) {
  const a = datos?.aceite;
  const vacio = { tipo: "sin_dato", litros: null, spec: null, origen: null, etiquetaOrigen: null, motivo: null, opciones: [] };
  if (!a) return vacio;
  const spec = textoValido(a.spec);
  const motivo = textoValido(a.motivo);
  const litros = litrosValidos(a.litros);
  if (litros !== null) {
    return {
      tipo: "cantidad", litros, spec,
      origen: ORIGEN_TEXTO[a.origen?.tipo] ?? null,
      etiquetaOrigen: textoValido(a.origen?.etiqueta),
      motivo, opciones: [],
    };
  }
  const opciones = [];
  for (const o of (Array.isArray(a.opciones) ? a.opciones : [])) {
    const l = litrosValidos(o?.litros);
    if (l === null || !ORIGENES_DOCUMENTADOS.has(o?.origen)) continue;
    if (opciones.some(x => x.litros === l)) continue;
    opciones.push({
      litros: l,
      spec: textoValido(o.spec) ?? spec,
      condicion: condicionDeEtiqueta(o.etiqueta),
      etiqueta: textoValido(o.etiqueta) ?? `${l} L`,
      origen: ORIGEN_TEXTO[o.origen],
    });
  }
  if (opciones.length) return { ...vacio, tipo: "opciones", spec, motivo, opciones };
  return { ...vacio, spec, motivo };
}

// Lo que va como "cálculo" a aceiteDelServicio (lib/aceiteServicio.js):
// la cantidad del resolvedor, o la opción que eligió el mecánico. La elegida
// puede venir del estado de la pantalla o, al reabrir un servicio, ser la que
// ya está guardada (si coincide con una de las opciones).
export function aceiteCalculadoDeResolver(res, { elegida = null, guardado = null } = {}) {
  if (!res) return { litros: null, spec: null, origen: null, elegida: null };
  if (res.tipo === "cantidad") return { litros: res.litros, spec: res.spec, origen: res.origen, elegida: null };
  if (res.tipo === "opciones") {
    const buscar = (l) => res.opciones.find(o => o.litros === l) ?? null;
    const o = (elegida != null ? buscar(Number(elegida)) : null) ?? (guardado?.litros != null ? buscar(Number(guardado.litros)) : null);
    if (o) return { litros: o.litros, spec: o.spec, origen: o.origen, elegida: o.litros };
  }
  return { litros: null, spec: null, origen: null, elegida: null };
}
