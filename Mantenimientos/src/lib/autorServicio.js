// ── Autor de un servicio = la SESIÓN que crea la fila (19/10/2026) ──────────
//
// Decisión del dueño (feat/autor-por-sesion): el autor de un servicio es el
// usuario logueado que CREA la fila, no el técnico asignado de la orden ni el
// `?mecanico=` de un link viejo de Taller (Taller ya no lo manda; si llega, se
// ignora). Se guarda como nombre (`servicios.mecanico`) y como uuid
// (`servicios.mecanico_id`) UNA sola vez, en el primer guardado de la fila
// (autosave, confirmSig o enviarAOrden, el que ocurra primero), y después NUNCA
// se reescribe: ni el autosave, ni confirmSig, ni el modo edición de jefe, ni
// un borrador ajeno abierto por otra persona (sigue siendo de quien lo inició).
// Las filas viejas conservan el `mecanico` que tienen.
//
// Las reglas compartidas con Taller (cruces por id, descarte) viven en el
// gemelo servicioAutor.js.

import { camposAutorNuevo } from "./servicioAutor.js";

const limpio = (s) => String(s ?? "").trim();

// El autor con el que nace un servicio: SIEMPRE la sesión. `mecanicoLink` (el
// ?mecanico= de un link viejo) se acepta para no romper llamadas viejas, pero no
// se usa.
// eslint-disable-next-line no-unused-vars
export function autorInicial({ mecanicoLink, sessionNombre } = {}) {
  return limpio(sessionNombre);
}

// Qué va en el payload de un guardado de `servicios`. Solo una fila NUEVA (sin
// id todavía) lleva `mecanico` + `mecanico_id`, los de la sesión; un PATCH de
// una fila existente no los manda, así nunca se pisa lo que la fila ya tiene.
export function campoMecanico({ esFilaNueva, session } = {}) {
  return camposAutorNuevo({ esFilaNueva, sesion: session });
}

// Quién se muestra como encargado en pantalla y en el informe: el autor de la
// fila cargada (mecanicoFila) o, para un servicio que todavía no existe, la
// sesión.
export function autorMostrado({ mecanicoFila, sessionNombre } = {}) {
  return limpio(mecanicoFila) || limpio(sessionNombre);
}
