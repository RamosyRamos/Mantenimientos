// ── Un servicio vigente por orden (decisión de Tavo, 8/10 y 18/10/2026) ──────
//
// Una orden tiene a lo sumo UN servicio vigente (no descartado). En la base lo
// garantiza el índice único parcial `servicios_un_vigente_por_orden` (Taller,
// migración 20261018000001): un segundo servicio para la misma orden choca con
// 23505 y PostgREST responde 409.
//
// Al abrir el link de una orden, Mantenimientos busca el servicio vigente de
// ESA orden —de cualquier mecánico y en cualquier estado no descartado— y lo
// abre según su estado. Nunca crea otro:
//   ninguno               → flujo de siempre (servicio nuevo)
//   borrador              → se continúa; si es de otro, aviso fijo "lo lleva X"
//                           y el autor (servicios.mecanico) NO cambia
//   borrador + rechazado  → se continúa con el motivo del rechazo arriba
//   pendiente             → solo lectura "Por aprobar"
//   aprobado              → informe público (/servicio/:slug)
// El modo edición del jefe (?servicio=) y su revisión de pendientes no pasan
// por acá.
//
// Puro, sin React ni red: lo prueba servicioVigente.test.mjs (npm test).

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const esVigente = (s) => !!s && s.estado !== "descartado";

// El vigente de una lista de servicios (los de una orden). Con el índice hay a
// lo sumo uno; si la lista trae más (datos de antes del índice), el más nuevo.
export function servicioVigente(servicios) {
  const lista = (Array.isArray(servicios) ? servicios : []).filter(esVigente);
  if (lista.length === 0) return null;
  return [...lista].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
}

export const ACCION = {
  NUEVO: "nuevo",
  CONTINUAR: "continuar",
  CORREGIR: "corregir",
  POR_APROBAR: "por_aprobar",
  APROBADO: "aprobado",
};

// ¿El servicio lo lleva otra persona? Sin autor guardado no se afirma nada.
export function esAjeno(servicio, nombreSesion) {
  const autor = norm(servicio?.mecanico);
  if (!autor) return false;
  return autor !== norm(nombreSesion);
}

// ── La marca de rechazo (decisión de Tavo, 18/10/2026) ──
// `rechazado` cuenta SOLO mientras el servicio está en borrador: al rechazar,
// la fila vuelve a 'borrador'; corregido y confirmado queda pendiente con la
// marca (es la corrección de un rechazo) y toda aprobación la limpia con
// LIMPIAR_RECHAZO. motivo_rechazo, rechazado_por y rechazado_at quedan como
// historial interno; las vistas del cliente nunca los muestran.
export const rechazoVigente = (s) => !!s && s.rechazado === true && s.estado === "borrador";
export const LIMPIAR_RECHAZO = Object.freeze({ rechazado: false });

// Qué hacer con el servicio vigente de la orden al abrir el link.
// La marca de rechazo vale solo sobre un borrador (rechazoVigente). Un estado
// desconocido se trata como "Por aprobar": solo lectura, nunca se edita ni se
// crea otro.
export function accionAlAbrir(servicio, { nombreSesion } = {}) {
  if (!esVigente(servicio)) return { accion: ACCION.NUEVO, servicio: null, ajeno: false, lleva: null };
  const ajeno = esAjeno(servicio, nombreSesion);
  const lleva = String(servicio.mecanico || "").trim() || null;
  const base = { servicio, ajeno, lleva };
  if (servicio.estado === "borrador") {
    if (rechazoVigente(servicio)) {
      return {
        ...base,
        accion: ACCION.CORREGIR,
        motivo: String(servicio.motivo_rechazo || "").trim() || null,
        rechazadoPor: String(servicio.rechazado_por || "").trim() || null,
      };
    }
    return { ...base, accion: ACCION.CONTINUAR };
  }
  if (servicio.estado === "aprobado") return { ...base, accion: ACCION.APROBADO };
  return { ...base, accion: ACCION.POR_APROBAR };
}

// URL del informe público de un servicio aprobado (/servicio/:slug, con el id
// de respaldo: ClientReport acepta los dos).
export function urlInformePublico(servicio, origen) {
  const clave = servicio?.slug || servicio?.id;
  if (!clave) return null;
  return `${String(origen || "").replace(/\/+$/, "")}/servicio/${clave}`;
}

// La elección que trae el link de Taller (?tipo=). Cualquier otra cosa = sin
// elección: se muestran todas las series, como siempre.
export const TIPO = { REVISION: "revision", MANTENIMIENTO: "mantenimiento" };
export function tipoDelLink(valor) {
  const v = norm(valor);
  if (v === TIPO.REVISION) return TIPO.REVISION;
  if (v === TIPO.MANTENIMIENTO) return TIPO.MANTENIMIENTO;
  return null;
}

// ¿Qué series se muestran en el paso 2? La serie C son las revisiones (RC/RG).
export function seriesVisibles(tipo, { verTodas = false } = {}) {
  if (verTodas || !tipo) return { mantenimiento: true, revision: true };
  if (tipo === TIPO.REVISION) return { mantenimiento: false, revision: true };
  return { mantenimiento: true, revision: false };
}

// ¿El error de un guardado es el choque con el índice de un servicio vigente?
// apiFetch lanza { tipo: 'http', status, body } con el cuerpo de PostgREST:
// {"code":"23505", ..., "message":"... servicios_un_vigente_por_orden ..."}.
export function esChoqueVigente(err) {
  if (!err || err.tipo !== "http" || err.status !== 409) return false;
  const body = String(err.body || "");
  return body.includes("23505") || body.includes("servicios_un_vigente_por_orden");
}

// Las marcas con contenido de un checklist local (el que chocó) que se pueden
// pasar a otro servicio: solo ítems con estado, detalle o fotos, y solo los que
// existen en el checklist destino (mismo id de tarea). Nunca pisa una marca
// que el destino ya tiene: ese ítem cuenta como `conflicto` y queda como está.
export function marcasParaPasar(crudo, { idsDestino, statusDestino = {} } = {}) {
  const ids = idsDestino instanceof Set ? idsDestino : new Set(idsDestino || []);
  const out = { status: {}, detail: {}, fotos: {}, pasan: 0, fuera: 0, conflicto: 0 };
  Object.values(crudo || {}).flat().forEach(it => {
    if (!it || !it.id) return;
    const conContenido = (it.status && it.status !== "pending") || it.detail || (Array.isArray(it.fotos) && it.fotos.length);
    if (!conContenido) return;
    if (!ids.has(it.id)) { out.fuera++; return; }
    const ya = statusDestino[it.id];
    if (ya && ya !== "pending") { out.conflicto++; return; }
    if (it.status && it.status !== "pending") out.status[it.id] = it.detail ? "issue" : it.status;
    else if (it.detail) out.status[it.id] = "issue";
    if (it.detail) out.detail[it.id] = it.detail;
    if (Array.isArray(it.fotos) && it.fotos.length) out.fotos[it.id] = it.fotos;
    out.pasan++;
  });
  return out;
}

// Copia local de lo cargado cuando un guardado chocó con el servicio vigente.
// Vive aparte del draft de siempre (ese se borra con el primer guardado OK del
// servicio que se abrió) y solo se borra cuando la persona pasa sus marcas o
// las descarta.
export const claveChoque = (ordenId) => (ordenId ? `ryr_mant_choque_${ordenId}` : null);
