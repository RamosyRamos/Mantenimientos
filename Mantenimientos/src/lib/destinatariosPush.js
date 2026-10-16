// ── Destinatarios de los avisos a quienes aprueban (feat/push-aprobadores-admin, 16/10) ──
//
// "Servicio pendiente de aprobación" va a los jefes Y al admin: desde el 16/10/2026
// el admin aprueba también en Gestión de taller (en Taller, canGestionTaller) y acá
// ve los botones de aprobación (showAdminButtons). Decisión de Tavo del 16/10.
//
// Por NOMBRE, como en Taller (src/lib/push.js, APROBADORES_Y_ADMIN): send-push
// resuelve las suscripciones por to_user_nombres. No es identidad: si cambia el
// equipo, se cambia acá y en Taller en el mismo movimiento.
export const JEFES = ["Otto Ramos", "Gustavo Ramos", "Arturo Ramos"];
export const ADMIN = ["Joseline Guzman"];
export const APROBADORES_Y_ADMIN = [...JEFES, ...ADMIN];
