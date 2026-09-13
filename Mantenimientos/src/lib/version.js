/* global __BUILD_ID__ */
// ── Staleness de PWA (#2977): detección de versión nueva y recarga segura ──
// Mismo mecanismo que Taller/src/lib/version.js (no es gemelo byte a byte: el
// criterio de vista segura es propio de cada app).
//
// Problema: la app queda abierta días en el teléfono del mecánico con un bundle
// viejo. Con la Sesión E es peor: cuando se cierre la vía compat (F6), un bundle
// viejo pierde la identidad y las lecturas devuelven [] en silencio.
//
// Mecanismo:
//   · En build, vite.config.js define __BUILD_ID__ (commit de Vercel o git) y
//     emite /version.json con el MISMO id.
//   · En runtime se consulta /version.json con cache: 'no-store' cada
//     INTERVALO_MS, al volver a visible y al recuperar red. Si el id difiere
//     del embebido hay versión nueva → banner "Hay una versión nueva —
//     Actualizar" (src/ActualizacionBanner.jsx). NUNCA se recarga sola por
//     esto: un mecánico a mitad de checklist no puede perder estado (el draft
//     local ayuda, pero no es excusa).
//   · Recarga automática SOLO al volver de una pestaña que estuvo oculta
//     ≥ HORAS_OCULTA_PARA_RECARGAR, con versión nueva confirmada en ese momento
//     y `vistaSeguraMantenimientos()` true — antes de que el usuario toque nada.
//   · Chunk perdido: un bundle viejo pide /assets/<hash-viejo>.js, Vercel lo
//     rewritea a index.html (200 text/html) y el import() dinámico falla con
//     `vite:preloadError`. Se recarga UNA vez (guard en sessionStorage).
//
// Sin dependencias; jamás lanza: cualquier fallo de red deja todo como estaba.

export const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'

const INTERVALO_MS = 10 * 60 * 1000          // chequeo periódico
const HORAS_OCULTA_PARA_RECARGAR = 4         // umbral de "volvió después de mucho"
const GUARD_CHUNK = 'ryr_recarga_chunk_at'   // sessionStorage: última recarga por chunk perdido
const GUARD_CHUNK_MS = 60 * 1000             // no recargar dos veces en 60 s

// ── Consulta ─────────────────────────────────────────────────────────────────
export async function leerVersionPublicada() {
  try {
    // credentials: 'same-origin' (NO 'omit'): las previews de Vercel exigen la cookie de
    // Vercel Authentication; sin cookie /version.json responde 302 al SSO y el chequeo
    // devolvía null en silencio (13/9: el banner nunca salió en la preview). En prod no
    // hay cookie que mandar, así que no cambia nada.
    const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('json')) return null
    const j = await res.json()
    return typeof j?.build === 'string' && j.build ? j.build : null
  } catch { return null }
}

export const hayVersionNueva = publicado => !!publicado && BUILD_ID !== 'dev' && publicado !== BUILD_ID

export function recargar() {
  try { window.location.reload() } catch { /* nada */ }
}

// ── Vista segura (Mantenimientos) ────────────────────────────────────────────
// Conservador a propósito: recargar solo cuando perder el estado no cuesta nada.
//   1. La app interna avisa en qué pantalla está vía
//      document.documentElement.dataset.vistaSegura ('1' = paso 1, elegir
//      vehículo, sin servicio en edición; '0' = checklist/resumen abierto —
//      lo escribe MainApp en App.jsx). Sin el atributo NO es seguro.
//      Las vistas de cliente (/servicio/:id, /historial, /cliente) son de solo
//      lectura: seguras siempre.
//   2. Ningún overlay modal montado (divs inline con position: fixed; inset: 0).
//   3. Ningún input/textarea/select/contenteditable con foco.
export function hayOverlayModal() {
  try {
    if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return true
    for (const el of document.body.querySelectorAll('div')) {
      const st = el.style
      if (st && st.position === 'fixed' && (st.inset === '0px' || st.inset === '0')) return true
    }
  } catch { return true }   // ante la duda, no es seguro
  return false
}

export function hayCampoConFoco() {
  try {
    const a = document.activeElement
    if (!a || a === document.body) return false
    const tag = a.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable === true
  } catch { return true }
}

export function vistaSeguraMantenimientos() {
  try {
    const p = window.location.pathname
    const esVistaCliente = p.startsWith('/servicio/') || p === '/historial' || p === '/cliente'
    if (!esVistaCliente && document.documentElement.dataset.vistaSegura !== '1') return false
    if (hayOverlayModal()) return false
    if (hayCampoConFoco()) return false
    return true
  } catch { return false }
}

// ── Detector ─────────────────────────────────────────────────────────────────
// iniciarDetectorVersion({ onNuevaVersion, esVistaSegura }) → función para parar.
export function iniciarDetectorVersion({ onNuevaVersion, esVistaSegura = () => false, intervaloMs = INTERVALO_MS, horasOculta = HORAS_OCULTA_PARA_RECARGAR } = {}) {
  if (BUILD_ID === 'dev' || typeof window === 'undefined') return () => {}
  let avisado = null
  let ocultaDesde = document.hidden ? Date.now() : null
  let corriendo = false

  async function chequear({ recargarSiSeguro = false } = {}) {
    if (corriendo) return
    corriendo = true
    try {
      const publicado = await leerVersionPublicada()
      if (!hayVersionNueva(publicado)) return
      if (recargarSiSeguro && !document.hidden && esVistaSegura()) { recargar(); return }
      if (avisado !== publicado) { avisado = publicado; try { onNuevaVersion?.(publicado) } catch { /* nada */ } }
    } finally { corriendo = false }
  }

  function onVisibilidad() {
    if (document.hidden) { ocultaDesde = Date.now(); return }
    const horas = ocultaDesde ? (Date.now() - ocultaDesde) / 3_600_000 : 0
    ocultaDesde = null
    // Volvió: si estuvo oculta mucho tiempo y hay versión nueva, recargar antes
    // de que toque nada (solo en vista segura); si no, solo avisar.
    chequear({ recargarSiSeguro: horas >= horasOculta })
  }

  const timer = setInterval(() => { if (!document.hidden) chequear() }, intervaloMs)
  document.addEventListener('visibilitychange', onVisibilidad)
  window.addEventListener('online', () => chequear())
  // Primer chequeo diferido: no competir con la carga inicial.
  const primero = setTimeout(() => chequear(), 45_000)

  return () => {
    clearInterval(timer); clearTimeout(primero)
    document.removeEventListener('visibilitychange', onVisibilidad)
  }
}

// ── Chunk perdido → una recarga ──────────────────────────────────────────────
// Vite dispara `vite:preloadError` en window cuando falla un import() dinámico
// (chunk con hash viejo que ya no existe en el deploy nuevo). Guard: una sola
// vez por minuto por pestaña, para no entrar en bucle si el fallo es otro.
export function instalarRecargaPorChunkPerdido() {
  if (typeof window === 'undefined') return
  window.addEventListener('vite:preloadError', (ev) => {
    try {
      const ultima = Number(sessionStorage.getItem(GUARD_CHUNK) || 0)
      if (Date.now() - ultima < GUARD_CHUNK_MS) return   // ya se intentó: dejar que el error siga su curso
      sessionStorage.setItem(GUARD_CHUNK, String(Date.now()))
      ev.preventDefault?.()
      recargar()
    } catch { /* nada */ }
  })
}
