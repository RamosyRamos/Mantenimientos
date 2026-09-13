// ── Banner "Hay una versión nueva" (staleness de PWA, #2977) ──────────────────
// Montado en main.jsx, FUERA del Router para no depender del estado de la app.
// Arranca el detector de lib/version.js; cuando /version.json trae un build
// distinto al embebido muestra este banner discreto abajo. No recarga sola:
// el usuario elige "Actualizar" (o el detector recarga por su cuenta solo al
// volver de ≥ 4 h oculta en vista segura — ver lib/version.js).
// Estilo neutro (gris carbono, monospace) para que el invert del tema claro
// lo deje legible igual.
import { useEffect, useState } from 'react'
import { iniciarDetectorVersion, recargar, vistaSeguraMantenimientos } from './lib/version.js'

export default function ActualizacionBanner() {
  const [nueva, setNueva] = useState(false)
  const [oculto, setOculto] = useState(false)   // "Después": se esconde hasta el próximo id nuevo

  useEffect(() => iniciarDetectorVersion({
    esVistaSegura: vistaSeguraMantenimientos,
    onNuevaVersion: () => { setNueva(true); setOculto(false) },
  }), [])

  if (!nueva || oculto) return null
  return (
    <div role="status" style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 9000,
      margin: '0 auto', maxWidth: 520,
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      background: '#1a1a1e', border: '1px solid #55595f', borderRadius: 10,
      boxShadow: '0 6px 24px rgba(0,0,0,0.45)', color: '#e8e3d5', fontSize: 13, fontFamily: 'monospace',
    }}>
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        <b style={{ color: '#c9cdd2' }}>Hay una versión nueva</b> de la app. Actualizá cuando termines el checklist.
      </span>
      <button onClick={() => setOculto(true)} title="Recordar más tarde"
        style={{ background: 'transparent', border: '1px solid #33373c', color: '#8f949b', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
        Después
      </button>
      <button onClick={recargar}
        style={{ background: '#c9cdd222', border: '1px solid #c9cdd288', color: '#c9cdd2', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}>
        Actualizar
      </button>
    </div>
  )
}
