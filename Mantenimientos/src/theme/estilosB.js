// Copia de los estilos del tema B de Taller (src/theme/estilosB.js) para que
// Mantenimientos hable el mismo lenguaje (feat/tema-b-mantenimientos,
// 18/10/2026). Si cambian en Taller, se copian acá. Debajo de este comentario,
// el archivo de Taller tal cual.
//
// Estilos del tema B (rediseño de Repuestos). Mismo papel que styles.js para la
// paleta de siempre: objetos y funciones de estilo, sin componentes. Lenguaje:
// sobrio, sin degradados ni tramas, sin bordes laterales de color; el color va
// solo donde significa algo.
import { T } from './tokensB'

const BORDE_CAMPO = 'rgba(255,255,255,0.08)'

// Familia de los números: montos, placas, COT-####, #orden, contadores, fechas
// cortas y fracciones.
export const monoB = { fontFamily: T.mono, fontVariantNumeric: 'tabular-nums' }

// Campo de texto: 40 de alto (minHeight, así sirve también para textarea).
export const campoB = {
  width: '100%', minHeight: 40, boxSizing: 'border-box',
  background: T.field, border: `1px solid ${BORDE_CAMPO}`, borderRadius: T.radio.control,
  padding: '9px 12px', color: T.text, fontSize: 13, lineHeight: '20px',
  fontFamily: 'inherit', outline: 'none', boxShadow: 'none',
  // Controles nativos (flechas del número, calendario, lista del select) en oscuro.
  colorScheme: 'dark',
}
// Foco: borde acento + anillo. Error: borde crítico.
export const focoB = e => { e.target.style.borderColor = T.accent + '8C'; e.target.style.boxShadow = `0 0 0 3px ${T.accent}1F` }
export const desenfocoB = e => { e.target.style.borderColor = BORDE_CAMPO; e.target.style.boxShadow = 'none' }
export const campoErrorB = { border: `1px solid ${T.crit}A6` }
// Campo táctil (vista del mecánico): 44 de alto y letra de 16, así iOS no hace
// zoom al enfocar.
export const campoTactilB = { ...campoB, minHeight: 44, fontSize: 16, lineHeight: '22px', padding: '10px 12px' }

// Panel (columna, sección, tarjeta de saldos) y tarjeta.
export const panelB = { background: T.panel, border: `1px solid ${T.borderDefault}`, borderRadius: T.radio.panel, boxShadow: 'none' }
export const tarjetaB = { background: T.card, border: `1px solid ${T.borderDefault}`, borderRadius: T.radio.card }

// Fondo y caja de un modal. El fondo es un único valor dentro del alcance.
export const overlayB = (zIndex = 1000) => ({
  position: 'fixed', inset: 0, background: T.overlay, zIndex,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  fontFamily: T.sans,
})
// Visor de imágenes (lightbox): el fondo va más cerrado que el de un modal,
// porque lo que importa es la foto.
export const visorB = {
  position: 'fixed', inset: 0, background: 'rgba(5,6,7,0.92)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans,
}
export const modalB = { background: T.panel, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }
export const modalCabeceraB = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px 0' }
export const modalTituloB = { color: T.text, fontSize: 18, fontWeight: 600, lineHeight: 1.3, margin: 0 }
export const modalSubtituloB = { color: T.textSoft, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }
export const modalCuerpoB = { padding: '16px 24px 22px', display: 'flex', flexDirection: 'column', gap: 18 }
export const modalPieB = { display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }
export const cerrarB = {
  width: 40, height: 40, flexShrink: 0, marginLeft: 'auto', marginTop: -8, marginRight: -10,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', borderRadius: T.radio.control, color: T.textMuted, cursor: 'pointer', padding: 0,
}

// Botones. jerarquia: 'principal' (control + borde acento), 'secundario'
// (transparente, borde fuerte), 'peligro' (crítico). tam: 'card' 30, 'modal' 40,
// 'movil' 44.
const ALTO = { card: 30, modal: 40, movil: 44 }
export function botonB(jerarquia = 'secundario', tam = 'modal') {
  const alto = ALTO[tam] || 40
  const base = {
    minHeight: alto, padding: tam === 'card' ? '0 10px' : '0 16px', borderRadius: tam === 'card' ? T.radio.small : T.radio.control,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'inherit', fontSize: tam === 'card' ? 12 : tam === 'movil' ? 14 : 13, fontWeight: 600,
    lineHeight: 1.2, whiteSpace: 'nowrap', cursor: 'pointer', boxSizing: 'border-box',
  }
  if (jerarquia === 'principal') return { ...base, background: T.control, border: `1px solid ${T.accent}66`, color: T.text }
  if (jerarquia === 'peligro') return { ...base, background: T.crit + '1F', border: `1px solid ${T.crit}A6`, color: T.crit }
  return { ...base, background: 'transparent', border: `1px solid ${T.borderStrong}`, color: T.textSoft }
}
// Hover de los botones del tema B (se esparce en el botón: {...hoverBotonB}).
// Guarda el fondo de reposo mientras dura el hover y lo devuelve al salir.
export const hoverBotonB = {
  onMouseEnter: e => {
    const el = e.currentTarget
    if (el.disabled) return
    el.dataset.fondoReposo = el.style.background
    el.style.background = T.raisedHover
  },
  onMouseLeave: e => {
    const el = e.currentTarget
    if (el.dataset.fondoReposo === undefined) return
    el.style.background = el.dataset.fondoReposo
    delete el.dataset.fondoReposo
  },
}

// Insignia: color semántico sobre su fondo al 12 % (sufijo 1F).
export const insigniaB = color => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
  fontSize: 10.5, fontWeight: 500, lineHeight: 1.35, whiteSpace: 'nowrap',
  color, background: color + '1F', borderRadius: T.radio.badge, padding: '2px 7px',
})
export const puntoB = (color, tam = 5) => ({ width: tam, height: tam, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' })

// Chip de filtro (estados en el teléfono) y segmento / tarjeta de opción excluyente.
export const chipB = activo => ({
  flexShrink: 0, minHeight: 36, padding: '0 14px', borderRadius: 18,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  border: `1px solid ${activo ? T.accent + '73' : T.borderDefault}`,
  background: activo ? T.card : 'transparent', color: activo ? T.text : T.textSoft,
  fontSize: 13, fontWeight: activo ? 600 : 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
})
export const segmentoB = activo => ({
  minHeight: 44, padding: '0 12px', borderRadius: T.radio.control, boxSizing: 'border-box',
  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
  border: `1px solid ${activo ? T.accent + '73' : T.borderDefault}`,
  background: activo ? T.card : 'transparent', color: activo ? T.text : T.textSoft,
  fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
})

// Textos.
export const sobretituloB = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.4, color: T.textMuted }
export const etiquetaB = { display: 'block', fontSize: 12, fontWeight: 500, color: T.textSoft, marginBottom: 6 }
export const tituloSeccionB = { fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }
export const cabeceraTablaB = { fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.9, color: T.textMuted }

// Menú desplegable (⋯ de la tarjeta).
export const menuB = { background: T.raised, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, boxShadow: '0 14px 32px rgba(0,0,0,0.45)', padding: 4 }
export const itemMenuB = (color = T.text) => ({
  minHeight: 34, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 9,
  fontSize: 13, color, cursor: 'pointer', whiteSpace: 'nowrap',
})
export const divisorMenuB = { height: 1, background: T.borderDefault, margin: '4px 2px' }

// Toast (abajo, centrado): superficie elevada y el color del aviso en el texto.
export function toastB(color = T.text) {
  return { background: T.raised, border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 14px 32px rgba(0,0,0,0.45)', color, fontFamily: T.sans }
}

// Equivalente B de accionBtnStyle(token, jerarquia): el token deja de ser el
// color del borde y solo pinta el texto cuando significa algo.
export function accionB(token, jerarquia = 'secundario') {
  if (jerarquia === 'primario')    return { background: T.control, border: `1px solid ${T.accent}66`, color: T.text, '--glowh': 'none' }
  if (jerarquia === 'destructivo') return { background: 'transparent', border: `1px solid ${T.crit}A6`, color: T.crit, '--glowh': 'none' }
  return { background: 'transparent', border: `1px solid ${T.borderStrong}`, color: token || T.textSoft, '--glowh': 'none' }
}
