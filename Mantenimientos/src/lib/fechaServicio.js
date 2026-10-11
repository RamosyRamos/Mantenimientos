// ── Fecha de un servicio: la columna `servicios.fecha` o, si está vacía, created_at ──
//
// `servicios.fecha` es TEXT con el formato "dd/mm/aaaa hh:mm" (hora de Costa Rica).
// Dejó de escribirse en abril de 2026 y desde el 8/10 confirmSig la vuelve a
// escribir; en el medio quedaron filas con la columna vacía. Quien muestre la
// fecha de un servicio usa estas funciones: la columna si está, si no
// created_at formateado IGUAL (UTC-6 fijo: CR no tiene horario de verano).
//
// ⚠ ARCHIVO GEMELO: Taller src/lib/fechaServicio.js y
// Mantenimientos/src/lib/fechaServicio.js tienen la misma lógica. Un cambio va
// en los dos.

const dos = (n) => String(n).padStart(2, '0');

// "dd/mm/aaaa hh:mm" en hora de Costa Rica a partir de un Date, un ISO o un
// timestamptz de PostgREST. Inválido o vacío → null.
export function formatoFechaCR(valor) {
  if (valor == null || valor === '') return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  const cr = new Date(d.getTime() - 6 * 60 * 60 * 1000);
  return `${dos(cr.getUTCDate())}/${dos(cr.getUTCMonth() + 1)}/${cr.getUTCFullYear()} ${dos(cr.getUTCHours())}:${dos(cr.getUTCMinutes())}`;
}

// La fecha del servicio para mostrar: la columna tal cual si tiene texto
// ("dd/mm/aaaa hh:mm"); si no, SOLO EL DÍA de created_at ("dd/mm/aaaa",
// decisión del dueño del 11/10: created_at es cuándo nació la fila, no cuándo
// se cerró el servicio, y la hora diría lo que no es). Sin ninguna → null.
export function fechaServicioTexto(servicio) {
  const f = String(servicio?.fecha ?? '').trim();
  if (f) return f;
  const c = formatoFechaCR(servicio?.created_at);
  return c ? c.split(' ')[0] : null;
}

// Solo el día ("dd/mm/aaaa"), para las listas compactas.
export function fechaServicioCorta(servicio) {
  const t = fechaServicioTexto(servicio);
  return t ? t.split(' ')[0] : null;
}
