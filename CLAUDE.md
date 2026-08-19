# Mantenimientos — app de mecánicos (Taller Ramos y Ramos)

App React (Vite) en la subcarpeta `Mantenimientos/`, monolito `src/App.jsx`. URL: mantenimientos.ramosyramoscr.com. Mismo backend Supabase que el sistema Taller. El contexto general del ecosistema vive en el CLAUDE.md del repo Taller (`C:\Users\gusta\Taller`).

## Correcciones de aceite (mecánico propone → jefe aprueba)

- Tabla `correcciones_aceite` + RPC `aprobar_correccion_aceite(p_correccion_id, p_aprobador, p_aprobar)` — ambos creados a mano en Supabase (no hay migración en repo). El RPC aplica el valor a `vehiculos_modelos` al aprobar.
- El catálogo (`loadModelsFromDB`) trae `id` de `vehiculos_modelos` y lo propaga a `modelData`/`engineInfo` — `engineInfo.id` es el `modelo_id` de la propuesta (null si se está en el catálogo hardcodeado de fallback).
- UI mecánico: en el badge "CAPACIDAD DE ACEITE" (aparece al elegir motor), link "¿Valor incorrecto?" → mini-form inline (litros + comentario opcional) → INSERT REST a `correcciones_aceite` con `propuesto_por` = `session.nombre` (id nullable: las sesiones lanzadas desde Taller vienen sin uuid). 409 del índice único = "ya hay una corrección pendiente para este modelo". Tras proponer: "⏳ corrección propuesta". El form se resetea al cambiar modelo/motor.
- Bandeja jefe: la campana 🔔 (gate existente `showAdminButtons` = rol admin/jefe y no venir del Taller) suma la sección "🛢️ CORRECCIONES DE ACEITE" — card con nombre/categoría, "X L → Y L", proponente y comentario; botones de aprobador (Otto/Gustavo/Arturo, mismo patrón que la aprobación de servicios) + Rechazar; ambos van al RPC y refrescan la bandeja.
- El flujo de aprobación de SERVICIOS (`servicios.estado/aprobado/aprobado_por`) no se tocó.

## FotoPicker (ago 2026)

`src/FotoPicker.jsx` — port del FotoPicker de Taller (057670a), copia propia como useIsMobile. Dos caminos: "📷" (input con `capture`, cámara directa en móvil) y "🖼" (galería) al mismo `onFile`; el input viejo creado a mano forzaba `capture="environment"` y en Android bloqueaba la galería. Única superficie de fotos de la app: evidencia por tarea de revisión (`subirFotoTarea(id, file)` — compresión + bucket `fotos-servicios` intactos). Devuelve un Fragment con los DOS botones (sin wrapper) a propósito: se integran a la fila flex existente del panel de detalle. Look monospace/azul propio, no el Carbon de Taller.

## Apertura por id: jefes continuando un servicio en progreso (ago 2026)

- **`?servicio=<uuid>`** — segundo camino de entrada, además del link de mecánicos (`?placa=&orden_id=&mecanico=`, que arranca uno NUEVO y sintetiza sesión). El de jefes NO lleva `mecanico`: exige estar logueado y abre la fila existente (`select=*` → `loadService`) para continuarla. Lo dispara el botón "🔧 Abrir mantenimiento" de `OrdenDetail` en Taller (gate `canManageTaller`). `cameFromTaller` sigue en false con este parámetro, así que el jefe conserva sus botones de admin. Espera a `recetasReady` antes de cargar: sin catálogo `tasks` viene vacío y el autosave escribiría un checklist en blanco. Si el servicio no existe, o su `estado` no es `borrador`, no carga nada y muestra un banner (un servicio aprobado no se continúa acá: el autosave lo devolvería a borrador y le quitaría la aprobación).

## ⚠ Concurrencia del autosave — overwrite total (ago 2026)

- **El autosave PATCHea la fila completa** (`revisiones`, `observaciones`, `fotos`, `progreso`…) cada 2 s. Dos personas con el mismo servicio abierto se pisan enteras: gana el último que guarda. **`servicios` NO tiene `updated_at`** (columnas reales: `created_at`, `editado_por`, `editado_at`), así que la detección se hace por **huella de contenido** (`huellaServicio` — stringify estable de revisiones/observaciones/fotos, sin los sellos): `baselineRef` guarda la fila tal como la devolvió el servidor la última vez que la vimos.
- Tres piezas, en este orden dentro del autosave: (1) **no-op** — si la huella local es igual a la baseline no se escribe nada (abrir un servicio ya no lo re-guarda; sin esto dos pestañas se pelean sin que nadie toque nada); (2) **guarda anti-pisado** — GET de la fila y comparación contra la baseline; si cambió, se ABORTA el guardado y sale el modal "⚠️ Servicio modificado" con quién y cuándo, y dos salidas explícitas (`recargarServicio` = manda el servidor / `forzarGuardado` = manda lo mío, re-baselinea y reintenta vía `saveNonce`); (3) recién ahí el PATCH. `conflictoRef` congela el autosave mientras el conflicto esté sin resolver. **No hay merge ni realtime** — a propósito.
- Guarda extra: el autosave sale temprano si `tasks` está vacío (catálogo aún cargando ⇒ borraría el checklist del mecánico).
- Banner al abrir un servicio existente: quién lo actualizó y hace cuánto (`ultimaActividad` + `hace`), para que el jefe sepa que el mecánico puede estar adentro AHORA.

## Trazabilidad por ítem: `marcado_por` / `marcado_at` (ago 2026)

- El checklist NO tenía autoría por ítem (el `marcado_por_nombre` que existía era el de la **revisión de entrega de Taller**, otra tabla). Ahora cada ítem de `revisiones` lleva `marcado_por` + `marcado_at` — dentro del jsonb, **sin migración**.
- El sellado se hace en UN solo lugar (el autosave), comparando la firma del ítem (`status|detail|fotos`) contra `itemSnapRef` (lo último persistido): **lo que cambió se sella con `session.nombre`** — quien está logueado, NO el mecánico de la orden — y **lo que no cambió conserva el sello original**. Cubre todos los caminos de mutación (botones OK/Detalle/N-A, textarea, fotos) sin tocar cada handler.
- En el checklist se pinta "✎ Nombre" solo cuando el autor difiere del mecánico de la orden (la intervención del jefe se ve; lo del mecánico queda limpio).

## Bandeja de borradores del jefe — bug de select (ago 2026)

- `fetchBorradores` pedía `updated_at`, que **no existe**: PostgREST devolvía 42703 y el panel salía SIEMPRE vacío. Además el select parcial dejaba fuera `observaciones`/`fotos`/`anio`/`version`, así que abrir un borrador desde ahí y tocarlo los **borraba**. Ahora es `select=*` y la fecha sale de `ultimaActividad`.
- Ojo: el botón 🗂 de esa bandeja está gateado a `esTavo` (solo Gustavo). Otto/Arturo llegan al borrador **solo** por el deep link desde Taller.

## Convenciones

- Identidad git: `RamosyRamos` / `contacto@ramosyramoscr.com`. Branch `main`. Commits en español.
- Verificación post-push: `git fetch origin && git log origin/main --oneline -3`.
