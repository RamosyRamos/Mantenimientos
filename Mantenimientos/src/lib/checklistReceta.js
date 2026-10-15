// ── El checklist de un servicio a partir de su receta (feat/recetas-astra, 13-14/10) ──
//
// PURO (sin red, sin React, sin import.meta.env). La regla es la MISMA que
// `resolverItemsReceta` de Taller (src/lib/mantenimientoRecetas.js de ese repo):
// si cambia una, cambia la otra.
//
// Decisiones del dueño del 13/10/2026:
//   · mant_recetas + mant_items son la ÚNICA fuente (se retiraron DEFAULT_ITEMS y
//     DEFAULT_CODES): si la lectura falla, la app falla cerrado.
//   · FUEL → '11' en diésel, '12' en el resto.
//   · Diésel → GLOW_TEST (la PRUEBA de bujías de precalentamiento con XENTRY, sin
//     desmontar). La extracción y el cambio (GLOW) son ADICIONAL: solo si se elige.
//   · 4MATIC → 4M_INSP (la INSPECCIÓN de fugas de diferenciales y transferencia).
//     El cambio de aceite (4M_DIFF + 4M_FDIFF) es ADICIONAL.
//   · Serie C (RC, RG): sin GLOW_TEST, 4M_INSP ni adicionales. En un ELÉCTRICO,
//     RC → RC_EV y RG_PTS → RG_EV.
//   · Serie EV o combustible eléctrico: sin agregados.
//   · Candado: un código con fuel_lock no se puede elegir para otro combustible.
// "En un servicio guardado manda lo guardado": los adicionales se deducen de sus
// tareas (adicionalesDeTareas), también en la serie C de un borrador viejo que
// trae GLOW marcado (así no pierde las marcas).

// Prefijo "~" en mant_items.tasks = procedimiento interno del mecánico: se
// muestra la task sin el símbolo (lo filtra Taller en los documentos).
export const stripInterna = t => String(t || "").replace(/^~\s*/, "");

export const ITEM_GLOW_TEST = "GLOW_TEST";
export const ITEM_4M_INSP = "4M_INSP";
export const ADICIONALES = Object.freeze({
  glow:          Object.freeze(["GLOW"]),
  diferenciales: Object.freeze(["4M_DIFF", "4M_FDIFF"]),
});
// `legado`: los adicionales se dedujeron de un servicio GUARDADO (no de las
// casillas del paso 2). Solo así valen en la serie C (borradores viejos).
export const SIN_ADICIONALES = Object.freeze({ glow: false, diferenciales: false, legado: false });
export const REVISION_ELECTRICA = Object.freeze({ RC: "RC_EV", RG_PTS: "RG_EV" });

// El ítem de una tarea a partir de su id: se quita SOLO el último "_n".
// "3_0" → "3", "GLOW_1" → "GLOW", "GLOW_TEST_0" → "GLOW_TEST", "4M_INSP_0" →
// "4M_INSP". NUNCA por prefijo: "GLOW_TEST_0" empieza con "GLOW_".
export function itemDeTareaId(id) {
  const s = String(id ?? "");
  const i = s.lastIndexOf("_");
  if (i <= 0 || !/^\d+$/.test(s.slice(i + 1))) return null;
  return s.slice(0, i);
}

// Los adicionales que trae un checklist guardado (ids de sus tareas).
export function adicionalesDeTareas(ids) {
  const items = new Set((Array.isArray(ids) ? ids : []).map(itemDeTareaId).filter(Boolean));
  return {
    glow: ADICIONALES.glow.some(i => items.has(i)),
    diferenciales: ADICIONALES.diferenciales.some(i => items.has(i)),
    legado: true,
  };
}

// Los ids de las tareas de un `revisiones` guardado ({ grupo: [{ id, … }] }).
export function idsDeRevisiones(revisiones) {
  if (!revisiones || typeof revisiones !== "object") return [];
  return Object.values(revisiones).flat().map(t => t?.id).filter(Boolean);
}

// Los ítems del checklist para una receta y un vehículo.
//   def = { items, serie, ev } (de mant_recetas)
export function itemsDelServicio(def, { fuel = "gasolina", is4m = false, adicionales = SIN_ADICIONALES } = {}) {
  if (!def || !Array.isArray(def.items)) return [];
  const diesel = fuel === "diesel";
  const electrico = fuel === "electrico";
  const ids = def.items.map(id => id === "FUEL" ? (diesel ? "11" : "12") : id);
  if (def.serie === "C") {
    const out = ids.map(id => (electrico && REVISION_ELECTRICA[id]) || id);
    // Solo un borrador VIEJO puede traer adicionales en la serie C (antes GLOW
    // entraba solo en todo diésel): se conservan para no perder sus marcas.
    if (adicionales?.legado && adicionales.glow) out.push(...ADICIONALES.glow);
    if (adicionales?.legado && adicionales.diferenciales) out.push(...ADICIONALES.diferenciales);
    return out;
  }
  if (def.ev || def.serie === "EV" || electrico) return ids;
  if (diesel) {
    ids.push(ITEM_GLOW_TEST);
    if (adicionales?.glow) ids.push(...ADICIONALES.glow);
  }
  if (is4m) {
    ids.push(ITEM_4M_INSP);
    if (adicionales?.diferenciales) ids.push(...ADICIONALES.diferenciales);
  }
  return ids;
}

// Las tareas del checklist: { id: `${item}_${i}`, grp, icon, text, outOfAssyst }.
//   codes  = { [codigo]: { items, serie, ev, … } }
//   items  = { [clave]: { label, icon, tasks, outOfAssyst } }
//   soloItems: en un servicio que ya no es borrador (pendiente / aprobado), solo
//              los ítems que tiene guardados: lo que se muestra es lo que se hizo,
//              aunque la receta de hoy sume algo nuevo (GLOW_TEST, 4M_INSP).
export function buildTasks(code, fuel, is4m, codes, items, { adicionales = SIN_ADICIONALES, soloItems = null } = {}) {
  const def = codes?.[code];
  if (!def) return [];
  const result = [];
  for (const id of itemsDelServicio(def, { fuel, is4m, adicionales })) {
    if (soloItems && !soloItems.has(id)) continue;
    const block = items?.[id];
    if (block) block.tasks.forEach((text, i) =>
      result.push({ id: `${id}_${i}`, grp: block.label, icon: block.icon, text: stripInterna(text), outOfAssyst: !!block.outOfAssyst })
    );
  }
  return result;
}

// ⚠ Decisión 5 — candado de combustible. `fuelFijo` = el combustible ya NO se
// puede cambiar a mano (lo fija el vehículo o un servicio guardado). Con el
// combustible fijo, un código de otro combustible queda deshabilitado; si no,
// elegirlo pone el combustible del candado (se elige PARA ese combustible).
export function estadoCandado({ fuelLock, fuel, fuelFijo }) {
  if (!fuelLock || fuelLock === fuel) return { deshabilitado: false, ponerFuel: null };
  if (fuelFijo) return { deshabilitado: true, ponerFuel: null };
  return { deshabilitado: false, ponerFuel: fuelLock };
}

// Las casillas de adicionales del paso 2 (decisión 11), APAGADAS por defecto.
//   glow: solo diésel, no EV, no serie C.   diferenciales: solo con 4MATIC.
export function adicionalesOfrecidos(def, { fuel, is4m }) {
  if (!def || def.serie === "C" || def.ev || def.serie === "EV" || fuel === "electrico") return { glow: false, diferenciales: false };
  return { glow: fuel === "diesel", diferenciales: !!is4m };
}
