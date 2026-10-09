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

const dos = (n) => String(n).padStart(2, "0");

// "dd/mm/aaaa hh:mm" en hora de Costa Rica a partir de un Date, un ISO o un
// timestamptz de PostgREST. Inválido o vacío → null.
export function formatoFechaCR(valor) {
  if (valor == null || valor === "") return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  const cr = new Date(d.getTime() - 6 * 60 * 60 * 1000);
  return `${dos(cr.getUTCDate())}/${dos(cr.getUTCMonth() + 1)}/${cr.getUTCFullYear()} ${dos(cr.getUTCHours())}:${dos(cr.getUTCMinutes())}`;
}

// La fecha del servicio completa ("dd/mm/aaaa hh:mm"): la columna si tiene
// texto, si no created_at formateado; sin ninguna de las dos → null.
export function fechaServicioTexto(servicio) {
  const f = String(servicio?.fecha ?? "").trim();
  if (f) return f;
  return formatoFechaCR(servicio?.created_at);
}

// Solo el día ("dd/mm/aaaa"), para las listas compactas.
export function fechaServicioCorta(servicio) {
  const t = fechaServicioTexto(servicio);
  return t ? t.split(" ")[0] : null;
}
