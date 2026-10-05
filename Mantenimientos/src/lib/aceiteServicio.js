// Aceite de un servicio: qué se muestra y qué se escribe en
// servicios.aceite_litros / aceite_spec.
//
// Decisiones del dueño (2026-10-05):
//  1. Si la receta lleva cambio de aceite, nunca se reemplaza un aceite
//     guardado por null: si el cálculo (fila del selector) da vacío, se
//     conserva lo guardado y se muestra con la etiqueta "guardado en el
//     servicio". Si la receta NO lleva aceite (A → RC), queda vacío a
//     propósito, como siempre.
//  2. En un servicio APROBADO el aceite queda congelado: ni el modo edición de
//     jefe ni la firma lo recalculan. Es lo que se le informó al cliente.
//
// Por qué: el cálculo sale de la categoría y el motor guardados como TEXTO en
// el servicio. Cuando el selector renombra o desactiva una categoría, el
// cálculo de un servicio viejo da vacío, y antes el autosave escribía null
// encima de los litros que ya estaban.

export const ETIQUETA_GUARDADO = "guardado en el servicio";

const litrosValidos = (v) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== "" && Number.isFinite(n) && n > 0 ? n : null;
};
const textoValido = (v) => (typeof v === "string" && v.trim() !== "" ? v : null);

// Lo que la fila de servicios ya tiene guardado.
export function aceiteGuardado(row) {
  return {
    litros: litrosValidos(row?.aceite_litros),
    spec: textoValido(row?.aceite_spec),
  };
}

// Lo que da el cálculo de hoy: solo si la receta lleva cambio de aceite.
export function aceiteCalculado({ litros, spec, llevaAceite }) {
  const l = litrosValidos(litros);
  if (!l || !llevaAceite) return { litros: null, spec: null };
  return { litros: l, spec: textoValido(spec) };
}

// Servicio aprobado = aceite congelado.
export const aceiteCongelado = (estadoOriginal) => estadoOriginal === "aprobado";

// Lo que va a la pantalla, al informe y a la base.
//   origen: 'calculo' | 'guardado' | null
//   etiqueta: ETIQUETA_GUARDADO cuando lo que se ve no sale del cálculo de hoy.
export function aceiteDelServicio({ litros, spec, llevaAceite, guardado, congelado }) {
  const calc = aceiteCalculado({ litros, spec, llevaAceite });
  const g = { litros: litrosValidos(guardado?.litros), spec: textoValido(guardado?.spec) };

  if (congelado) {
    const igual = calc.litros === g.litros && calc.spec === g.spec;
    const hay = g.litros !== null || g.spec !== null;
    return {
      litros: g.litros,
      spec: g.spec,
      origen: hay ? (igual ? "calculo" : "guardado") : null,
      etiqueta: hay && !igual ? ETIQUETA_GUARDADO : null,
    };
  }

  // Receta sin cambio de aceite (A → RC, por ejemplo): queda vacío a propósito,
  // también lo guardado. La regla de "no pisar con null" vale solo si lleva aceite.
  if (!llevaAceite) return { litros: null, spec: null, origen: null, etiqueta: null };

  if (calc.litros !== null) {
    // Un campo vacío del cálculo tampoco pisa lo guardado.
    return {
      litros: calc.litros,
      spec: calc.spec ?? g.spec,
      origen: "calculo",
      etiqueta: null,
    };
  }

  if (g.litros !== null || g.spec !== null) {
    return { litros: g.litros, spec: g.spec, origen: "guardado", etiqueta: ETIQUETA_GUARDADO };
  }
  return { litros: null, spec: null, origen: null, etiqueta: null };
}

// Las columnas de aceite para un INSERT / PATCH de servicios.
// Congelado: no viaja ninguna (el PATCH parcial deja lo guardado intacto).
export function camposAceite(entrada) {
  if (entrada.congelado) return {};
  const a = aceiteDelServicio(entrada);
  return { aceite_litros: a.litros, aceite_spec: a.spec };
}
