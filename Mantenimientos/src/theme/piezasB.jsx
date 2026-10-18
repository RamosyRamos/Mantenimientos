// Piezas del tema B en Mantenimientos (feat/tema-b-mantenimientos, 18/10/2026).
// El mismo lenguaje que la vista del mecánico de Taller (InsigniaIcono,
// CajaModalB, la placa del tema): se arman con los tokens gemelos (tokensB.js)
// y los estilos copiados de Taller (estilosB.js). Solo dibujo: ninguna pieza
// guarda estado propio ni decide nada.
import { T } from './tokensB.js'
import { monoB, botonB, hoverBotonB, insigniaB, cerrarB, sobretituloB, etiquetaB, campoTactilB, segmentoB } from './estilosB.js'
import { X, TriangleAlert, Info, CircleAlert, CircleCheck } from './iconos.jsx'

// Un número (placa, km, litros, fechas, fracciones): Plex Mono con tabular-nums.
export function Num({ children, style, ...rest }) {
  return <span {...rest} style={{ ...monoB, ...style }}>{children}</span>
}

// Placa del tema B: chip claro, 19 de alto, Plex Mono 10.5/600. Solo el número.
export const placaB = {
  ...monoB, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: 19, padding: '0 6px', boxSizing: 'border-box', borderRadius: T.radio.plate,
  background: T.plateBg, color: T.plateText, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4,
  lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'uppercase', verticalAlign: 'middle',
}
export function Placa({ placa, style, ...rest }) {
  const txt = String(placa || '').trim()
  if (!txt) return null
  return <span data-placa {...rest} style={{ ...placaB, ...style }}>{txt}</span>
}

// Insignia: el color del significado en el texto, sobre ese color al 12 %
// (sufijo 1F), radio 5, padding 2 7. Con ícono SVG opcional.
export function Insignia({ color = T.neutral, icono: Icono, children, title, style, ...rest }) {
  return (
    <span title={title} {...rest} style={{ ...insigniaB(color), ...style }}>
      {Icono && <Icono size={12} />}
      {children}
    </span>
  )
}

// Botón del tema B. jerarquia: 'principal' (uno por pantalla), 'secundario',
// 'peligro' (texto crit, nunca rojo sólido). tam: 'movil' 44 · 'modal' 40.
// `color` pinta solo el texto (y el borde si es semántico) de un secundario.
export function Boton({ jerarquia = 'secundario', tam = 'movil', icono: Icono, iconoFin: IconoFin, color, ancho, children, style, disabled, type = 'button', ...rest }) {
  const base = botonB(jerarquia, tam)
  const semantico = color && color !== T.textSoft && color !== T.text
  const st = {
    ...base,
    ...(ancho ? { width: '100%' } : null),
    ...(color ? { color, ...(semantico ? { border: `1px solid ${color}A6` } : null) } : null),
    ...(disabled ? { background: 'transparent', border: `1px solid ${T.borderDefault}`, color: T.textDisabled, cursor: 'not-allowed' } : null),
    whiteSpace: 'normal', textAlign: 'center',
    ...style,
  }
  return (
    <button type={type} disabled={disabled} {...(disabled ? null : hoverBotonB)} {...rest} style={st}>
      {Icono && <Icono size={16} />}
      {children}
      {IconoFin && <IconoFin size={16} />}
    </button>
  )
}

// Botón cuadrado de 44 con un ícono (cabecera, cerrar, quitar). `contador`
// dibuja la pastilla del acento arriba a la derecha.
export function BotonIcono({ icono: Icono, title, contador, color = T.textSoft, tam = 44, iconoTam = 19, style, ...rest }) {
  return (
    <button type="button" title={title} aria-label={title} {...hoverBotonB} {...rest}
      style={{ position: 'relative', width: tam, height: tam, minHeight: tam, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: T.radio.control, color, cursor: 'pointer', padding: 0, ...style }}>
      <Icono size={iconoTam} />
      {contador > 0 && (
        <span style={{ ...monoB, position: 'absolute', top: 5, right: 4, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 8, background: T.accent, color: T.plateText, fontSize: 10, fontWeight: 600, lineHeight: '16px', textAlign: 'center', pointerEvents: 'none' }}>
          {contador > 9 ? '9+' : contador}
        </span>
      )}
    </button>
  )
}

// Sobretítulo (10.5, mayúsculas por CSS, letterSpacing 1.3, textMuted) y
// etiqueta de campo (12/500 textSoft, encima del campo).
export function Sobretitulo({ children, style, ...rest }) {
  return <div {...rest} style={{ ...sobretituloB, fontSize: 10.5, letterSpacing: 1.3, ...style }}>{children}</div>
}
export function Etiqueta({ children, requerido, style, ...rest }) {
  return (
    <label {...rest} style={{ ...etiquetaB, ...style }}>
      {children}{requerido && <span style={{ color: T.crit }}> *</span>}
    </label>
  )
}
export const tituloB = { fontSize: 14, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.35 }

// Campo de 44 con letra de 16 (el foco y el error los da index.html / campoErrorB).
export const campoMB = { ...campoTactilB, fontFamily: T.sans }

// Mensaje debajo de un campo: error en crit 11.5 con ícono; ayuda en textMuted.
export function MensajeCampo({ error, children, style, ...rest }) {
  return (
    <div {...rest} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 6, fontSize: 11.5, lineHeight: 1.45, color: error ? T.crit : T.textMuted, ...style }}>
      {error && <CircleAlert size={13} style={{ marginTop: 1 }} />}
      <span style={{ minWidth: 0 }}>{children}</span>
    </div>
  )
}

// Aviso en caja: el color del significado al 12 % de fondo, el título en ese
// color con su ícono y el texto en text. `accion` va a la derecha (o abajo si
// no entra). Sin bordes laterales de color.
const ICONO_TONO = { [T.crit]: TriangleAlert, [T.warn]: TriangleAlert, [T.ok]: CircleCheck, [T.info]: Info }
export function Aviso({ color = T.info, icono, titulo, children, accion, style, ...rest }) {
  const Icono = icono === null ? null : (icono || ICONO_TONO[color] || Info)
  return (
    <div {...rest} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', background: color + '1F', borderRadius: T.radio.control, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, color: T.text, fontFamily: T.sans, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: '999 1 200px', minWidth: 0 }}>
        {Icono && <Icono size={16} color={color} style={{ marginTop: 2 }} />}
        <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {titulo && <div style={{ color, fontWeight: 600, fontSize: 13 }}>{titulo}</div>}
          {children}
        </div>
      </div>
      {accion && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>{accion}</div>}
    </div>
  )
}

// Fondo de modal (overlay único) y caja: panel con borde borderStrong, radio
// 14, sombra 0 24px 60px; título 18/600 y cerrar de 40; pie con Cancelar y la
// acción principal a la derecha.
export function FondoModal({ onClick, zIndex = 500, children, style, ...rest }) {
  return (
    <div {...rest} onClick={onClick}
      style={{ position: 'fixed', inset: 0, zIndex, background: T.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: T.sans, ...style }}>
      {children}
    </div>
  )
}
export const cajaModalB = { background: T.panel, border: `1px solid ${T.borderStrong}`, borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }
export function CajaModal({ titulo, subtitulo, icono: Icono, colorIcono = T.accentMuted, onCerrar, ancho = 420, pie, children, style, cuerpoStyle, ...rest }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={typeof titulo === 'string' ? titulo : undefined} {...rest}
      onClick={e => e.stopPropagation()}
      style={{ ...cajaModalB, width: '100%', maxWidth: ancho, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', fontFamily: T.sans, color: T.text, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '18px 20px 0', flexShrink: 0 }}>
        {Icono && <Icono size={20} color={colorIcono} style={{ marginTop: 3 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ color: T.text, fontSize: 18, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{titulo}</h2>
          {subtitulo && <div style={{ color: T.textSoft, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{subtitulo}</div>}
        </div>
        {onCerrar && (
          <button type="button" onClick={onCerrar} aria-label="Cerrar" title="Cerrar" style={{ ...cerrarB, minHeight: 40 }} {...hoverBotonB}>
            <X size={18} />
          </button>
        )}
      </div>
      <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0, flex: '1 1 auto', fontSize: 13, lineHeight: 1.55, color: T.textSoft, ...cuerpoStyle }}>{children}</div>
      {pie && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', padding: '12px 20px', borderTop: `1px solid ${T.borderSubtle}`, flexShrink: 0 }}>{pie}</div>
      )}
    </div>
  )
}

// Panel lateral (pendientes, servicios realizados, borradores, centro de
// mando): el mismo fondo de modal y la caja pegada a la derecha.
export function PanelLateral({ titulo, subtitulo, icono: Icono, onCerrar, children, pie, cabeceraExtra, zIndex = 200, ...rest }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, background: T.overlay, fontFamily: T.sans }} onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label={typeof titulo === 'string' ? titulo : undefined} {...rest} onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, right: 0, width: 'min(400px,100vw)', height: '100vh', background: T.panel, borderLeft: `1px solid ${T.borderStrong}`, boxShadow: '0 24px 60px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', color: T.text }}>
        <div style={{ padding: '14px 12px 12px 18px', borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
          {Icono && <Icono size={20} color={T.accentMuted} style={{ marginTop: 3 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{titulo}</h2>
            {subtitulo && <div style={{ color: T.textMuted, fontSize: 12.5, marginTop: 3 }}>{subtitulo}</div>}
          </div>
          <BotonIcono icono={X} title="Cerrar" onClick={onCerrar} color={T.textMuted} iconoTam={18} />
        </div>
        {cabeceraExtra}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>{children}</div>
        {pie && <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.borderSubtle}`, flexShrink: 0 }}>{pie}</div>}
      </div>
    </div>
  )
}

// Vacío / cargando de una lista: texto textMuted centrado.
export function Vacio({ children, style }) {
  return <div style={{ textAlign: 'center', color: T.textMuted, padding: '36px 12px', fontSize: 13, ...style }}>{children}</div>
}

// Opción excluyente (segmento o tarjeta de 44): elegida con fondo card y
// borde accent + '73'.
export const opcionB = (activa, extra) => ({ ...segmentoB(activa), fontFamily: T.sans, ...extra })
