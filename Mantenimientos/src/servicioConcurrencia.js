// ── Concurrencia y trazabilidad de un servicio de mantenimiento ──────────────
//
// ⚠ ARCHIVO GEMELO — vive DUPLICADO, byte a byte, en los dos repos:
//     Taller          → src/lib/servicioConcurrencia.js
//     Mantenimientos  → Mantenimientos/src/servicioConcurrencia.js
//   Las dos apps escriben la MISMA fila de `servicios` desde superficies
//   distintas (el autosave del checklist en Mantenimientos, el modal "Detalle
//   de mantenimiento" de OrdenDetail en Taller). Si las reglas divergen, la
//   guarda deja de guardar y los sellos dejan de significar lo mismo.
//   TODO cambio acá se copia al otro repo en el mismo movimiento; no hay
//   paquete compartido entre ambos (repos separados, sin monorepo).
//   Verificación: los dos archivos deben dar el MISMO sha256.
//
// EL PROBLEMA: el autosave de Mantenimientos PATCHea la fila COMPLETA cada 2 s.
// Dos personas con el mismo servicio abierto se pisan enteras — gana el último
// que guarda. Y `servicios` NO tiene `updated_at` (columnas de sello reales:
// created_at / editado_por / editado_at), así que no hay timestamp de fila que
// comparar: la detección va por HUELLA DEL CONTENIDO.

// Serialización estable (claves ordenadas): jsonb reordena las claves al
// guardar, así que comparar JSON.stringify crudo daría diferencias falsas.
export const stableStr = (v) => {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStr).join(",")}]`;
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stableStr(v[k])}`).join(",")}}`;
};

// Solo el contenido editable de un ítem — los sellos (marcado_por/at) quedan
// fuera para que un re-sello propio no se lea como cambio ajeno.
export const contenidoItem = (it) => ({
  id: it?.id ?? null, status: it?.status ?? null,
  detail: it?.detail ?? null, fotos: it?.fotos ?? null,
});

// vacío y null son la misma cosa acá: el servidor guarda null donde el cliente
// tiene "" o {}, y esa diferencia no es un cambio de nadie.
export const vacioANull = (v) => {
  if (v === "" || v === undefined) return null;
  if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return null;
  return v ?? null;
};

// Huella de la fila: lo que dos personas se pueden pisar entre sí.
export const huellaServicio = (row) => stableStr({
  revisiones: Object.fromEntries(
    Object.entries(row?.revisiones || {}).map(([g, arr]) => [g, (arr || []).map(contenidoItem)])
  ),
  observaciones: vacioANull(row?.observaciones),
  fotos: vacioANull(row?.fotos),
});

// Firma de UN ítem: cambia si cambió su estado, su detalle o sus fotos.
export const firmaItem = (it) => `${it?.status ?? ""}|${it?.detail ?? ""}|${(it?.fotos || []).join(",")}`;

// Un ítem intacto (pendiente, sin detalle ni fotos) no se sella con nadie.
export const itemTieneContenido = (it) => !!(it && ((it.status && it.status !== "pending") || it.detail || it.fotos?.length));

// Estado persistido de la fila, para las dos comparaciones que vienen después:
// `snap` = firma por ítem (¿cambió?), `stamps` = autor por ítem (¿quién lo marcó?).
export const instantaneaServicio = (row) => {
  const snap = {}, stamps = {};
  Object.values(row?.revisiones || {}).flat().forEach(it => {
    if (!it?.id) return;
    snap[it.id] = firmaItem(it);
    if (it.marcado_por || it.marcado_at) stamps[it.id] = { por: it.marcado_por || null, at: it.marcado_at || null };
  });
  return { snap, stamps };
};

// TRAZABILIDAD — regla única de sellado, la misma en las dos apps:
// el ítem que CAMBIÓ respecto de lo último persistido se sella con quien está
// logueado AHORA (nunca con el mecánico de la orden); el que no cambió conserva
// el sello de quien lo marcó originalmente.
export const sellarRevisiones = (revisiones, snap, stamps, quien, ahora) => {
  const out = {};
  Object.entries(revisiones || {}).forEach(([grp, items]) => {
    out[grp] = (items || []).map(it => {
      const item = { ...it };
      delete item.marcado_por; delete item.marcado_at;
      const cambio = firmaItem(item) !== snap?.[item.id];
      if (cambio && itemTieneContenido(item)) {
        item.marcado_por = quien || null; item.marcado_at = ahora;
      } else if (stamps?.[item.id]) {
        item.marcado_por = stamps[item.id].por || null; item.marcado_at = stamps[item.id].at || null;
      }
      return item;
    });
  });
  return out;
};

// "Revisiones completadas: N/M" — mismo criterio que el contador del checklist
// de Mantenimientos: las filas informativas (texto que abre con ⚠) no cuentan,
// y 'na' cuenta como resuelto.
export const progresoDeRevisiones = (revisiones) => {
  const trackable = Object.values(revisiones || {}).flat().filter(it => it && !(it.text || "").startsWith("⚠"));
  return {
    completadas: trackable.filter(it => it.status && it.status !== "pending").length,
    total: trackable.length,
  };
};

export const hace = (iso) => {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "recién";
  const min = Math.floor(ms / 60000);
  if (min < 1)  return "hace menos de un minuto";
  if (min < 60) return `hace ${min} minuto${min !== 1 ? "s" : ""}`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `hace ${h} hora${h !== 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d !== 1 ? "s" : ""}`;
};

// Última actividad registrada en la fila: el sello más reciente del checklist;
// si el servicio es anterior a los sellos, el mecánico y la fecha de creación.
export const ultimaActividad = (row) => {
  let quien = null, at = null;
  Object.values(row?.revisiones || {}).flat().forEach(it => {
    if (it?.marcado_at && (!at || it.marcado_at > at)) { at = it.marcado_at; quien = it.marcado_por || null; }
  });
  if (!at) return { quien: row?.mecanico || null, at: row?.created_at || null, estimado: true };
  return { quien, at, estimado: false };
};

// Normalización de nombres para comparar autores (tildes/mayúsculas).
export const normalizarNombre = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
