// ── Banner "Hay una versión nueva" (staleness de PWA, #2977) ──────────────────
// Montado en main.jsx, FUERA del Router para no depender del estado de la app.
// Arranca el detector de lib/version.js; cuando /version.json trae un build
// distinto al embebido muestra este banner discreto abajo. No recarga sola:
// el usuario elige "Actualizar" (o el detector recarga por su cuenta solo al
// volver de ≥ 4 h oculta en vista segura — ver lib/version.js).
// Tema B (feat/tema-b-mantenimientos): la caja de los modales del tema, con
// "Después" secundario y "Actualizar" como botón principal.
import { useEffect, useState } from 'react'
import { iniciarDetectorVersion, recargar, vistaSeguraMantenimientos } from './lib/version.js'
import { T } from './theme/tokensB.js'
import { botonB, hoverBotonB } from './theme/estilosB.js'
import { RefreshCw } from './theme/iconos.jsx'

export default function ActualizacionBanner() {
  const [nueva, setNueva] = useState(false)
  const [oculto, setOculto] = useState(false)   // "Después": se esconde hasta el próximo id nuevo

  useEffect(() => iniciarDetectorVersion({
    esVistaSegura: vistaSeguraMantenimientos,
    onNuevaVersion: () => { setNueva(true); setOculto(false) },
  }), [])

  if (!nueva || oculto) return null
  return (
    <div role="status" data-banner-version style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 9000,
      margin: '0 auto', maxWidth: 520, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 14px',
      background: T.panel, border: `1px solid ${T.borderStrong}`, borderRadius: 14,
      boxShadow: '0 24px 60px rgba(0,0,0,0.55)', color: T.textSoft, fontSize: 13, fontFamily: T.sans,
    }}>
      <span style={{ flex: '1 1 200px', minWidth: 0, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <RefreshCw size={16} color={T.accentMuted} style={{ flexShrink: 0, marginTop: 2 }} />
        <span><b style={{ color: T.text, fontWeight: 600 }}>Hay una versión nueva</b> de la app. Actualizá cuando termines el checklist.</span>
      </span>
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        <button type="button" onClick={() => setOculto(true)} title="Recordar más tarde" {...hoverBotonB}
          style={{ ...botonB('secundario', 'modal'), fontFamily: T.sans }}>
          Después
        </button>
        <button type="button" onClick={recargar} {...hoverBotonB}
          style={{ ...botonB('principal', 'modal'), fontFamily: T.sans }}>
          Actualizar
        </button>
      </div>
    </div>
  )
}
