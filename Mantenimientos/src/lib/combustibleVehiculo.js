// ── Combustible del checklist según el vehículo (feat/combustible-desde-vehiculo, 12/10) ──
//
// Decisión de Tavo (12/10/2026): si el vehículo de la placa tiene combustible
// cargado en Taller, el selector del paso 2 se autoselecciona con ese valor y
// queda BLOQUEADO. Sin vehículo o sin combustible, queda libre como siempre.
// Un servicio YA GUARDADO con otro combustible no se reescribe: se muestra el
// guardado, con un aviso de la diferencia, y el selector queda libre.
//
// vehiculos.combustible no tiene CHECK en la base. Medido el 12/10: solo
// 'gasolina' (157), 'diesel' (60), 'electrico' (1) y NULL (299). Cualquier otro
// valor (o uno que aparezca mañana: híbrido, GNC…) NO se adivina: cuenta como
// "sin dato" y el selector queda libre.

export const COMBUSTIBLES = ["gasolina", "diesel", "electrico"];

// Minúsculas, sin tildes ni espacios alrededor: "Diésel" → "diesel", "ELÉCTRICO" → "electrico".
export function normalizarCombustible(v) {
  const s = String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return COMBUSTIBLES.includes(s) ? s : null;
}

export const ETIQUETA_COMBUSTIBLE = { gasolina: "Gasolina", diesel: "Diesel", electrico: "Eléctrico" };

export const TEXTO_SEGUN_VEHICULO = "Según el vehículo · para corregir, editá el vehículo en Taller";

export const avisoCombustibleDistinto = ({ guardado, vehiculo }) =>
  `El servicio se guardó con ${ETIQUETA_COMBUSTIBLE[guardado] || guardado} y el vehículo en Taller dice ${ETIQUETA_COMBUSTIBLE[vehiculo] || vehiculo}. No se cambió solo: revisalo.`;

// combustibleVehiculo: el de vehiculos (crudo). combustibleActual: el del selector.
// servicioExistente: la fila se abrió ya guardada CON combustible (loadService).
// → delVehiculo     el valor normalizado del vehículo, o null
//   autoseleccionar el valor que hay que poner en el selector, o null (nada que cambiar)
//   bloqueado       el selector no se puede tocar
//   aviso           texto de la diferencia (solo servicio existente con otro valor), o null
export function estadoCombustible({ combustibleVehiculo, combustibleActual, servicioExistente = false }) {
  const delVehiculo = normalizarCombustible(combustibleVehiculo);
  const libre = { delVehiculo, autoseleccionar: null, bloqueado: false, aviso: null };
  if (!delVehiculo) return libre;
  if (combustibleActual === delVehiculo) return { ...libre, bloqueado: true };
  if (servicioExistente) return { ...libre, aviso: avisoCombustibleDistinto({ guardado: combustibleActual, vehiculo: delVehiculo }) };
  return { ...libre, autoseleccionar: delVehiculo, bloqueado: true };
}
