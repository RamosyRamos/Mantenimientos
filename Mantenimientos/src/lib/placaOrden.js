// ── Placa del servicio contra la placa de la orden vinculada (fix/servicio-placa-orden, 8/10) ──
//
// Incidente #3049 / #3050 (8/10): un servicio de la placa 347559 quedó guardado con
// el orden_id de la #3050 (MFC090), porque la placa del paso 1 se podía tipear
// encima sin soltar la orden que traía el link; Taller aprobó y escribió el informe
// en la orden equivocada.
//
// REGLA: un servicio solo escribe informe_mantenimiento (o se aprueba) en una orden
// cuya placa coincida con la suya, comparadas NORMALIZADAS (mayúsculas, sin espacios
// ni guiones). Con orden del link, confirmar una placa distinta pregunta si
// desvincular. Misma normalización que Taller (src/lib/placaServicio.js): cambiar
// una obliga a cambiar la otra.

export const normalizarPlaca = (s) => String(s ?? "").toUpperCase().replace(/[\s-]+/g, "");

export const placasCoinciden = (a, b) => {
  const na = normalizarPlaca(a), nb = normalizarPlaca(b);
  return !!na && !!nb && na === nb;
};

// Guard de escritura del informe. `incompleto` = no hay con qué comparar (orden sin
// vehículo, lectura fallida, servicio sin placa): el caller decide (enviarAOrden deja
// pasar las órdenes viejas sin vehículo, como siempre); nunca cuenta como coincidencia.
export function verificarPlacaOrden({ placaServicio, ordenRow }) {
  const veh = Array.isArray(ordenRow?.vehiculos) ? ordenRow.vehiculos[0] : ordenRow?.vehiculos;
  const placaOrden = normalizarPlaca(veh?.patente);
  const ps = normalizarPlaca(placaServicio);
  if (!ordenRow || !ordenRow.vehiculo_id || !placaOrden || !ps) return { estado: "incompleto", placaOrden, placaServicio: ps };
  return { estado: placaOrden === ps ? "coincide" : "distinta", placaOrden, placaServicio: ps };
}

const rotulo = (ordenNumero, sinNumero) => {
  const n = String(ordenNumero ?? "").trim().replace(/^#/, "");
  return n ? `#${n}` : sinNumero;
};

export const mensajePlacaDistinta = ({ placaServicio, placaOrden, ordenNumero }) =>
  `⛔ El servicio es de la placa ${placaServicio} pero la orden ${rotulo(ordenNumero, "destino")} es del vehículo con placa ${placaOrden}.\n\nNo se guardó nada. Revisá que estés en el servicio correcto antes de reintentar.`;

export const preguntaDesvincular = ({ placaServicio, placaOrden, ordenNumero }) =>
  `Esta placa (${placaServicio}) no es la de la orden ${rotulo(ordenNumero, "del link")} (${placaOrden}). ¿Desvincular el servicio de esa orden?\n\nAceptar: el servicio sigue sin orden.\nCancelar: se vuelve a la placa anterior y la orden queda vinculada.`;

// Decisión del guard del paso 1: con orden vinculada y placa de la orden conocida,
// una placa distinta pide confirmar. `seguir` = no hay nada que preguntar.
export function decidirPlacaPaso1({ ordenId, placaOrden, placa }) {
  if (!ordenId || !normalizarPlaca(placaOrden)) return { accion: "seguir" };
  const ps = normalizarPlaca(placa);
  if (!ps || ps === normalizarPlaca(placaOrden)) return { accion: "seguir" };
  return { accion: "preguntar", placaServicio: ps, placaOrden: normalizarPlaca(placaOrden) };
}

// Placa a la que se vuelve si se cancela: la de antes de editar, si coincidía con
// la orden; si no (ya venía mal), la de la orden, para que el vínculo quede coherente.
export function placaAlCancelar({ placaAnterior, placaOrden }) {
  const prev = normalizarPlaca(placaAnterior), po = normalizarPlaca(placaOrden);
  return prev && prev === po ? prev : po;
}
