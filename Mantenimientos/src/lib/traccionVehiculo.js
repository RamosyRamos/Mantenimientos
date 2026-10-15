// ── 4MATIC del checklist según el vehículo (feat/recetas-astra, 13-14/10) ──
//
// Calcado de combustibleVehiculo.js. El dato sale de la Edge Function
// `resolver-aceite` de Taller (campo `traccion`), con la regla SOLO POSITIVA de
// Taller (src/lib/catalogo/traccion.js): tarjeta del EPC con M005, todas las
// variantes de Astra, nombre del EPC o versión de la fila, texto del vehículo.
// Ninguna fuente dice "no es 4MATIC": sin un "sí" el interruptor queda LIBRE y
// apagado por defecto, como siempre.
//
// Decisión 10 del dueño (13/10): con un "sí" el interruptor se prende solo y
// queda BLOQUEADO ("🔒 Según el vehículo"). En un servicio guardado manda lo
// guardado: si difiere del vehículo, aviso sin cambiarlo solo.

export const TEXTO_TRACCION_SEGUN_VEHICULO = "Según el vehículo · para corregir, editá el vehículo en Taller";

export const avisoTraccionDistinta = () =>
  "El servicio se guardó sin 4MATIC y el vehículo en Taller es 4MATIC. No se cambió solo: revisalo.";

// La respuesta de resolver-aceite → true (sí) o null (no se sabe). Nunca false.
export function es4maticDeRespuesta(datos) {
  return datos?.traccion?.es_4matic === true ? true : null;
}

// es4maticVehiculo: true | null.  is4mActual: el interruptor.
// servicioExistente: la fila se abrió ya guardada (loadService).
// → { delVehiculo, autoseleccionar, bloqueado, aviso }
export function estadoTraccion({ es4maticVehiculo, is4mActual, servicioExistente = false }) {
  const delVehiculo = es4maticVehiculo === true ? true : null;
  const libre = { delVehiculo, autoseleccionar: null, bloqueado: false, aviso: null };
  if (!delVehiculo) return libre;
  if (is4mActual === true) return { ...libre, bloqueado: true };
  if (servicioExistente) return { ...libre, aviso: avisoTraccionDistinta() };
  return { ...libre, autoseleccionar: true, bloqueado: true };
}
