// ── apiFetch: helper ÚNICO para las ESCRITURAS a Supabase (sep 2026) ─────────
//
// Regla: cualquier escritor nuevo (PATCH/POST/DELETE a rest/v1 o storage/v1) va
// por acá. Las lecturas de catálogo siguen con fetch() crudo — no se tocaron.
//
// Qué hace:
//   · mete los headers de siempre (apikey + Authorization Bearer <anon>), los
//     mismos que antes iban inline en cada llamada;
//   · un fallo de RED (fetch rechaza: sin conexión, DNS, CORS, timeout del
//     navegador) → throw { tipo: 'red', causa };
//   · una respuesta HTTP no-ok → throw { tipo: 'http', status, body } con el
//     cuerpo recortado, para que el caller decida (4xx = permisos/conflicto, no
//     reintentar; 5xx = reintentar).
//   · si todo va bien devuelve el Response tal cual (el caller hace .json()).
//
// NO agrega supabase-js ni toca sesión/auth: independiente de la migración a Auth.

export const SURL = import.meta.env.VITE_SUPABASE_URL;
export const SKEY = import.meta.env.VITE_SUPABASE_KEY;

export const authHeaders = () => ({ apikey: SKEY, Authorization: `Bearer ${SKEY}` });

export async function apiFetch(url, opts = {}) {
  const { headers = {}, ...rest } = opts;
  let res;
  try {
    res = await fetch(url, { ...rest, headers: { ...authHeaders(), ...headers } });
  } catch (causa) {
    throw { tipo: 'red', causa };
  }
  if (!res.ok) {
    let body = '';
    try { body = (await res.text()).slice(0, 500); } catch { /* sin cuerpo */ }
    throw { tipo: 'http', status: res.status, body };
  }
  return res;
}

// ── Reintento ────────────────────────────────────────────────────────────────
// Backoff del autosave: 2 s / 5 s / 15 s, máximo 3 reintentos. Se reintenta
// ante RED y 5xx. NUNCA ante 4xx: 401/403 es permiso, 409 es conflicto — hay
// que avisar, no insistir.
export const BACKOFF_MS = [2000, 5000, 15000];
export const MAX_REINTENTOS = BACKOFF_MS.length;

export const esReintentable = (err) =>
  err?.tipo === 'red' || (err?.tipo === 'http' && err.status >= 500);

// Decide el siguiente paso tras un fallo: { reintentar: bool, esperaMs }.
// `intento` = cuántos reintentos ya se hicieron (0 en el primer fallo).
export const siguienteReintento = (err, intento) => {
  if (!esReintentable(err) || intento >= MAX_REINTENTOS) return { reintentar: false, esperaMs: null };
  return { reintentar: true, esperaMs: BACKOFF_MS[intento] };
};

// Texto corto para la persona (sin jerga HTTP salvo el número).
export const mensajeError = (err) => {
  if (!err) return 'Error desconocido';
  if (err.tipo === 'red') return 'Sin conexión';
  if (err.tipo === 'http') {
    if (err.status === 401 || err.status === 403) return `Sin permiso (${err.status})`;
    if (err.status === 409) return 'Conflicto (409): ya existe';
    if (err.status >= 500) return `Error del servidor (${err.status})`;
    return `Error ${err.status}`;
  }
  return err.message || String(err);
};

// "hace 5 s" / "hace 3 min" / "hace 2 h" — para el estado del guardado.
export const haceCorto = (iso) => {
  if (!iso) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!Number.isFinite(s)) return '';
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
};

// ── Draft local (red de seguridad) ───────────────────────────────────────────
// Mientras haya cambios sin guardar, el estado del checklist vive también en
// localStorage: `ryr_mant_draft_<servicio_id|orden_id>`. Guarda revisiones +
// observaciones + km/aceite, SIN fotos (ya están en el bucket; la URL viaja en
// revisiones). Se borra cuando un guardado tiene éxito.
export const draftKey = (servicioId, ordenId) => {
  const id = servicioId || ordenId;
  return id ? `ryr_mant_draft_${id}` : null;
};

export function guardarDraft(key, contenido, huella) {
  if (!key) return null;
  const d = { at: new Date().toISOString(), huella, contenido };
  try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* storage lleno o bloqueado */ }
  return d;
}

export function leerDraft(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.contenido && d.huella ? d : null;
  } catch { return null; }
}

export function borrarDraft(key) {
  if (!key) return;
  try { localStorage.removeItem(key); } catch { /* nada */ }
}

// ¿Hay algo que restaurar? Solo si el draft existe y su huella difiere de lo
// que vino de la base (huellaBase = huellaServicio(fila) o null si es nuevo).
// Igual huella = ya está guardado (o el draft quedó viejo): se descarta solo.
export const draftRestaurable = (draft, huellaBase) =>
  !!(draft && draft.huella && draft.huella !== huellaBase);
