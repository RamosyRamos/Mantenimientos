// ⚠ ARCHIVO GEMELO — vive DUPLICADO en los dos repos (como servicioConcurrencia.js):
//     Taller          → src/lib/authOtp.js
//     Mantenimientos  → Mantenimientos/src/lib/authOtp.js
//   Mismo login por teléfono + OTP en las dos apps; todo cambio se copia al otro
//   repo en el mismo movimiento. La REGLA DE APP difiere y por eso NO vive acá:
//   Taller usa APPS_TALLER (motivoRechazo); Mantenimientos acepta cualquier app
//   (la decisión está en App.jsx de cada repo).

// ── Login por teléfono + OTP (Supabase Auth) — helpers puros (F3 Sesión E) ───
//
// Sin dependencias: lo importa LoginScreen (App.jsx) y lo cubre authOtp.test.js.
// El objeto `session` que consume toda la app NO cambia de forma: lo arma
// `sesionDesdeUsuario` desde la fila que devuelve el RPC mi_usuario().

export const PREFIJO_CR = '506'

// Canal por el que se PIDE el código (signInWithOtp options.channel: 'sms' | 'whatsapp').
// 'sms' por defecto: WhatsApp verificado NO entregado en CR el 13/9 (cuenta Twilio en
// revisión de compliance — Twilio acepta el envío pero el mensaje no llega, así que el
// fallback por error nunca dispara). Pasar a 'whatsapp' cuando Twilio entregue y esté
// probado con un número real. El fallback whatsapp→sms de LoginScreen sigue vivo para
// ese momento. El `type` de verifyOtp es 'sms' en ambos casos.
export const CANAL_OTP = 'sms'
export const CANAL_FALLBACK = 'sms'

export const TEXTOS_CANAL = {
  sms:      { pedir: 'Ingresá tu número de teléfono', boton: 'ENVIARME CÓDIGO POR SMS',      enviado: 'Te enviamos un SMS a' },
  whatsapp: { pedir: 'Ingresá tu número de WhatsApp',  boton: 'ENVIARME CÓDIGO POR WHATSAPP', enviado: 'Te enviamos un WhatsApp a' },
}

// Apps que admite el login de Taller — la MISMA regla que login_usuario en prod:
//   WHERE (app = p_app OR app = 'ambas') con p_app = 'taller'
export const APPS_TALLER = ['taller', 'ambas']

export const soloDigitos = (s) => String(s || '').replace(/\D/g, '')

// 8 dígitos locales → "8888 8888" para mostrar en el input.
export const formatearTel = (digitos) => {
  const d = soloDigitos(digitos).slice(0, 8)
  return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d
}

export const telValido = (digitos) => /^\d{8}$/.test(soloDigitos(digitos))

// Formato que espera Supabase Auth para `phone` (E.164 sin '+').
export const telE164 = (digitos) => `${PREFIJO_CR}${soloDigitos(digitos)}`

// Fila de mi_usuario() → session de la app (misma forma y claves que el login viejo).
export const sesionDesdeUsuario = (u) => ({
  id: u.id,
  username: u.username ?? null,
  nombre: u.nombre,
  rol: u.rol,
  app: u.app,
  saludo_prefs: (u.saludo_prefs && typeof u.saludo_prefs === 'object') ? u.saludo_prefs : {},
})

// ¿Por qué NO entra a Taller? null = entra.
//   'sin_enlace'          → mi_usuario devolvió null (cuenta Auth sin usuarios.auth_id, o inactivo)
//   'solo_mantenimientos' → app = 'mantenimientos'
//   'sin_acceso'          → app = 'ninguno' u otro valor no admitido
export const motivoRechazo = (u) => {
  if (!u || !u.id) return 'sin_enlace'
  if (APPS_TALLER.includes(u.app)) return null
  if (u.app === 'mantenimientos') return 'solo_mantenimientos'
  return 'sin_acceso'
}

export const MENSAJE_RECHAZO = {
  sin_enlace:          'Este número no está registrado en el sistema. Hablá con Gustavo.',
  solo_mantenimientos: 'Esta cuenta es solo de Mantenimientos.',
  sin_acceso:          'Esta cuenta no tiene acceso al sistema Taller. Hablá con Gustavo.',
}

// ¿El error de signInWithOtp es del CANAL (WhatsApp no disponible para ese
// número / proveedor)? Entonces se reintenta por SMS.
export const esErrorCanal = (err) => {
  if (!err) return false
  const txt = `${err.code || ''} ${err.message || ''}`.toLowerCase()
  if (/whatsapp|channel|canal|provider|proveedor|unsupported|not enabled|invalid parameter/.test(txt)) return true
  return err.status === 422 || err.status === 400
}

// Texto en español para la persona (nunca el mensaje crudo del proveedor).
export const mapearErrorOtp = (err) => {
  if (!err) return 'Error inesperado. Intentá de nuevo.'
  const code = String(err.code || '').toLowerCase()
  const msg  = String(err.message || '').toLowerCase()
  const status = Number(err.status) || 0
  if (err.name === 'AuthRetryableFetchError' || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
    return 'Sin conexión. Revisá la red e intentá de nuevo.'
  }
  if (status === 429 || code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many')) {
    return 'Demasiados intentos. Esperá unos minutos antes de pedir otro código.'
  }
  if (code === 'otp_expired' || code === 'otp_disabled' || msg.includes('expired') || msg.includes('invalid') && msg.includes('token')) {
    return 'Código incorrecto o vencido. Pedí uno nuevo.'
  }
  if (status === 403 || status === 401) return 'Código incorrecto o vencido. Pedí uno nuevo.'
  if (code === 'signup_disabled' || msg.includes('signups not allowed')) {
    return MENSAJE_RECHAZO.sin_enlace
  }
  if (msg.includes('phone') && (msg.includes('invalid') || msg.includes('format'))) {
    return 'El número no es válido. Son los 8 dígitos, sin el 506.'
  }
  return 'No se pudo completar. Intentá de nuevo.'
}
