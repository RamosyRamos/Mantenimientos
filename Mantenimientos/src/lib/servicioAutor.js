// ── Autor de un servicio y descarte de un borrador (feat/autor-por-sesion, 19/10/2026) ──
//
// ⚠ ARCHIVO GEMELO — vive DUPLICADO, byte a byte, en los dos repos:
//     Taller          → src/lib/servicioAutor.js
//     Mantenimientos  → Mantenimientos/src/lib/servicioAutor.js
//   TODO cambio acá se copia al otro repo en el mismo movimiento (los dos deben
//   dar el MISMO sha256). Puro: sin React, sin red, sin imports.
//
// Decisiones de Tavo (19/10/2026):
// - El AUTOR de un servicio es el usuario de la SESIÓN que crea la fila (no el
//   técnico asignado ni el ?mecanico= de un link viejo). Se escribe una sola
//   vez, al nacer la fila, como nombre (`servicios.mecanico`) y como uuid
//   (`servicios.mecanico_id`). Ningún PATCH lo cambia.
// - Los cruces van por `mecanico_id`; el nombre es solo el respaldo de las
//   filas viejas (mecanico_id null), comparado sin tildes ni mayúsculas.
// - Un borrador (también el rechazado, que es borrador con la marca) se puede
//   DESCARTAR: lo hace su autor o un jefe/admin, por la RPC descartar_servicio.
//   La fila no se borra: estado = 'descartado'.

export const ESTADO_DESCARTADO = 'descartado';
export const ROLES_DESCARTE = ['jefe', 'admin'];

const limpio = (s) => String(s ?? '').trim();
export const normalizarNombreAutor = (s) => limpio(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Los campos de autor con que NACE una fila: siempre la sesión. Una fila
// existente (esFilaNueva false) no lleva ninguno: un PATCH nunca los manda.
export function camposAutorNuevo({ esFilaNueva, sesion } = {}) {
  if (!esFilaNueva) return {};
  const nombre = limpio(sesion?.nombre);
  const id = limpio(sesion?.id);
  const out = {};
  if (nombre) out.mecanico = nombre;
  if (id) out.mecanico_id = id;
  return out;
}

// ¿`persona` ({ id, nombre }) es el autor del servicio? Por mecanico_id si la
// fila lo tiene; si no (filas viejas), por el nombre normalizado. Sin autor
// guardado de ninguna forma → false.
export function esAutorDelServicio(servicio, persona) {
  if (!servicio || !persona) return false;
  const idFila = limpio(servicio.mecanico_id);
  if (idFila) return !!limpio(persona.id) && idFila === limpio(persona.id);
  const autor = normalizarNombreAutor(servicio.mecanico);
  return !!autor && autor === normalizarNombreAutor(persona.nombre);
}

// ¿El servicio lo lleva otra persona? Sin autor guardado no se afirma nada.
export function servicioEsDeOtro(servicio, sesion) {
  if (!servicio) return false;
  if (!limpio(servicio.mecanico_id) && !normalizarNombreAutor(servicio.mecanico)) return false;
  return !esAutorDelServicio(servicio, sesion);
}

// A quién va un push sobre el servicio (aprobado, rechazado): al autor por id;
// a las filas viejas, por nombre. Sin autor → null (no se manda).
export function destinoPushAutor(servicio) {
  const id = limpio(servicio?.mecanico_id);
  if (id) return { to_user_id: id };
  const nombre = limpio(servicio?.mecanico);
  return nombre ? { to_user_nombre: nombre } : null;
}

// ── Descarte ────────────────────────────────────────────────────────────────

// Solo un borrador se descarta (el rechazado también es borrador). Nunca uno
// por aprobar ni uno aprobado.
export const esDescartable = (servicio) => !!servicio && servicio.estado === 'borrador';

// ¿La sesión puede descartar el servicio? { ok, motivo } con motivo
// 'sin_sesion' | 'estado' | 'permiso' cuando no. La RPC vuelve a decidirlo.
export function puedeDescartarServicio(servicio, sesion) {
  if (!sesion || (!limpio(sesion.id) && !limpio(sesion.nombre))) return { ok: false, motivo: 'sin_sesion' };
  if (!esDescartable(servicio)) return { ok: false, motivo: 'estado' };
  if (ROLES_DESCARTE.includes(sesion.rol)) return { ok: true, motivo: null };
  if (esAutorDelServicio(servicio, sesion)) return { ok: true, motivo: null };
  return { ok: false, motivo: 'permiso' };
}

// Ítems marcados de un checklist (servicios.revisiones = { grupo: [ítems] }):
// los que tienen un estado distinto de 'pending' (ok, issue, na…), o el
// `done` de los checklists viejos.
export function itemsMarcados(revisiones) {
  if (!revisiones || typeof revisiones !== 'object') return 0;
  let n = 0;
  for (const grupo of Object.values(revisiones)) {
    if (!Array.isArray(grupo)) continue;
    for (const it of grupo) {
      if (!it || typeof it !== 'object') continue;
      const st = limpio(it.status);
      if ((st && st !== 'pending') || (!st && it.done === true)) n++;
    }
  }
  return n;
}

// La confirmación fuerte: solo cuando hay ítems marcados (null si no hay).
export function preguntaDescarte(marcados) {
  const n = Number(marcados) || 0;
  if (n <= 0) return null;
  return n === 1
    ? 'Tiene 1 ítem marcado; se perderá del informe. ¿Descartar?'
    : `Tiene ${n} ítems marcados; se perderán del informe. ¿Descartar?`;
}

// El motivo que viaja a la RPC: recortado, vacío → null, hasta 500 caracteres.
export function motivoDescarte(texto) {
  const t = limpio(texto);
  return t ? Array.from(t).slice(0, 500).join('') : null;
}

// Cuerpo de la llamada a la RPC (los dos repos la llaman distinto: Taller con
// supabase-js, Mantenimientos con apiFetch; los parámetros son los mismos).
export function argumentosDescarte(servicioId, motivo) {
  return { p_servicio_id: servicioId, p_motivo: motivoDescarte(motivo) };
}

// Textos de los códigos de error de la RPC descartar_servicio.
const MENSAJES_DESCARTE = {
  sin_sesion: 'Tu sesión venció: cerrá sesión y volvé a entrar.',
  no_encontrado: 'Ese servicio ya no existe.',
  no_es_borrador: 'Solo se descarta un borrador: este servicio ya se envió, se aprobó o ya estaba descartado.',
  no_autorizado: 'Solo quien lo inició o un jefe o admin puede descartarlo.',
  estado: 'Solo se descarta un borrador.',
  permiso: 'Solo quien lo inició o un jefe o admin puede descartarlo.',
};
export function mensajeDescarte(codigo) {
  return MENSAJES_DESCARTE[codigo] || `No se pudo descartar el servicio${codigo ? ` (${codigo})` : ''}.`;
}

// La respuesta de la RPC ({ ok, error }) normalizada.
export function resultadoDescarte(data) {
  if (data && data.ok === true) return { ok: true, error: null };
  return { ok: false, error: mensajeDescarte(data && data.error) };
}
