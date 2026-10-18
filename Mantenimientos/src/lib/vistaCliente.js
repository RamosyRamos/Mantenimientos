// ── Vistas del cliente: el rechazo es interno (decisión de Tavo, 18/10/2026) ──
//
// El informe público (/servicio/:slug, ClientReport) y el historial por placa
// (/historial, ClientHistory) leen la fila entera de `servicios` (select=*).
// Un servicio que se rechazó, se corrigió y se aprobó conserva motivo_rechazo,
// rechazado_por y rechazado_at como historial INTERNO: el cliente nunca los ve.
// Las dos vistas pasan cada fila por acá antes de guardarla en su estado, así
// ningún render puede mostrarlos por descuido.
//
// Puro, sin React ni red: lo prueba vistaCliente.test.mjs (npm test).

export const CAMPOS_RECHAZO = ["rechazado", "motivo_rechazo", "rechazado_por", "rechazado_at"];

export function sinRechazo(fila) {
  if (!fila || typeof fila !== "object") return fila;
  const copia = { ...fila };
  for (const campo of CAMPOS_RECHAZO) delete copia[campo];
  return copia;
}
