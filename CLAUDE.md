# Mantenimientos — app de mecánicos (Taller Ramos y Ramos)

App React (Vite) en la subcarpeta `Mantenimientos/`, monolito `src/App.jsx`. URL: mantenimientos.ramosyramoscr.com. Mismo backend Supabase que el sistema Taller. El contexto general del ecosistema vive en el CLAUDE.md del repo Taller (`C:\Users\gusta\Taller`).

## Correcciones de aceite (mecánico propone → jefe aprueba)

- Tabla `correcciones_aceite` + RPC `aprobar_correccion_aceite(p_correccion_id, p_aprobador, p_aprobar)` — ambos creados a mano en Supabase (no hay migración en repo). El RPC aplica el valor a `vehiculos_modelos` al aprobar.
- El catálogo (`loadModelsFromDB`) trae `id` de `vehiculos_modelos` y lo propaga a `modelData`/`engineInfo` — `engineInfo.id` es el `modelo_id` de la propuesta (null si se está en el catálogo hardcodeado de fallback).
- UI mecánico: en el badge "CAPACIDAD DE ACEITE" (aparece al elegir motor), link "¿Valor incorrecto?" → mini-form inline (litros + comentario opcional) → INSERT REST a `correcciones_aceite` con `propuesto_por` = `session.nombre` (id nullable: las sesiones lanzadas desde Taller vienen sin uuid). 409 del índice único = "ya hay una corrección pendiente para este modelo". Tras proponer: "⏳ corrección propuesta". El form se resetea al cambiar modelo/motor.
- Bandeja jefe: la campana 🔔 (gate existente `showAdminButtons` = rol admin/jefe y no venir del Taller) suma la sección "🛢️ CORRECCIONES DE ACEITE" — card con nombre/categoría, "X L → Y L", proponente y comentario; botones de aprobador (Otto/Gustavo/Arturo, mismo patrón que la aprobación de servicios) + Rechazar; ambos van al RPC y refrescan la bandeja.
- El flujo de aprobación de SERVICIOS (`servicios.estado/aprobado/aprobado_por`) no se tocó.

## Convenciones

- Identidad git: `RamosyRamos` / `contacto@ramosyramoscr.com`. Branch `main`. Commits en español.
- Verificación post-push: `git fetch origin && git log origin/main --oneline -3`.
