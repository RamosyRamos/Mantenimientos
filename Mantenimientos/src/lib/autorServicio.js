// ── Autor de un servicio = el ENCARGADO, fijado cuando nace la fila (8/10/2026) ──
//
// Decisión del dueño: Mantenimientos ya no tiene "firma" (la lista de cinco
// nombres). `servicios.mecanico` es el encargado: el nombre que trae el link de
// Taller (`?mecanico=`, el técnico asignado o el elegido en el Piso) o, si el
// link no lo trae, `session.nombre` de quien crea el servicio. Se escribe UNA
// sola vez, en el primer guardado de la fila (autosave o confirmSig, el que
// ocurra primero), y después NUNCA se reescribe: ni el autosave, ni confirmSig,
// ni el modo edición de jefe, ni un borrador ajeno abierto por otra persona.
// Los servicios ya guardados conservan el `mecanico` que tienen, aunque esté
// vacío (los dos sin nombre desde Auth se dejan como están).

const limpio = (s) => String(s ?? "").trim();

// El autor con el que nace un servicio: el del link si vino, si no la sesión.
export function autorInicial({ mecanicoLink, sessionNombre } = {}) {
  return limpio(mecanicoLink) || limpio(sessionNombre);
}

// Qué va en el payload de un guardado de `servicios`. Solo una fila NUEVA
// (sin id todavía) lleva `mecanico`; un PATCH de una fila existente no lo
// manda, así nunca se pisa lo que la fila ya tiene.
export function campoMecanico({ esFilaNueva, autor } = {}) {
  if (!esFilaNueva) return {};
  const a = limpio(autor);
  return a ? { mecanico: a } : {};
}

// Quién se muestra como encargado en pantalla y en el informe: lo que trajo
// la fila o el link (mechName), si no la sesión.
export const autorMostrado = autorInicial;
