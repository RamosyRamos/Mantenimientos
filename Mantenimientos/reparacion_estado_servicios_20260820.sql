-- ════════════════════════════════════════════════════════════════════════════
-- REPARACIÓN DE ESTADO — servicios desaprobados por el autosave (hallazgo R1)
-- Auditoría AUDITORIA_CONCURRENCIA_SERVICIOS.md (Taller, commit 2907de9)
-- Causa cerrada en Mantenimientos 12d7388 (corte por estado en el autosave)
--
-- Fecha del análisis: 2026-08-20 · Universo revisado: las 75 filas de `servicios`
-- NO EJECUTADO POR CLAUDE. Correr a mano en el SQL Editor de Supabase.
--
-- QUÉ REPARA: 1 (UNA) fila. El barrido completo encontró un solo caso real de
-- servicio aprobado que el autosave devolvió a borrador. Los otros 3 candidatos
-- son cierres LEGÍTIMOS y quedan explícitamente excluidos (ver sección 4).
--
-- TIPOS VERIFICADOS contra prod (operador @> vía PostgREST): `revisiones`,
-- `pendientes` y `fotos` son jsonb -> jsonb_set/|| de la sección 3 aplican.
--
-- CÓMO SE IDENTIFICÓ EL UNIVERSO (3 barridos independientes, todos convergen):
--   a) filas con `aprobado_por` seteado pero `aprobado = false`          -> 3 filas
--   b) filas en 'borrador' con slug FINAL (patrón PLACA-COD-DDMMYYYY-XXX,
--      que solo generan confirmSig/enviarAOrden; el autosave genera 'draft-…') -> 2 filas
--   c) cruce de los 28 slugs publicados en `ordenes.informe_mantenimiento`
--      contra el estado actual de cada fila (= links vivos en manos de un
--      cliente que hoy no resuelven, porque /servicio/:slug filtra
--      estado = 'aprobado')                                              -> 2 rotos
--   Unión de los tres: 4 filas candidatas. Solo 1 está dañada.
--
-- CRITERIO QUE SEPARA DAÑO DE CIERRE LEGÍTIMO — `rechazado`:
--   `handleRechazar` (Taller/ServicioReviewPage) es el ÚNICO camino legítimo que
--   devuelve una fila a 'borrador', y SIEMPRE sella las cuatro columnas
--   rechazado / rechazado_por / motivo_rechazo / rechazado_at en el mismo UPDATE.
--   El repo Mantenimientos NO CONTIENE la palabra "rechazado" en ninguna parte
--   (verificado por grep sobre todo src/): ni el autosave, ni confirmSig, ni
--   enviarAOrden pueden escribir esas columnas. Por lo tanto:
--        rechazado_at IS NOT NULL  <=>  el 'borrador' es un rechazo deliberado.
--   Es un criterio de certeza, no heurístico: no hay ningún escritor capaz de
--   producir un falso positivo ni un falso negativo.
-- ════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VERIFICACIÓN PREVIA — aborta si la realidad ya no es la que se auditó
-- ─────────────────────────────────────────────────────────────────────────────
-- Si alguien reaprobó la fila a mano, la rechazó, la descartó, o el checklist
-- cambió desde el análisis, este bloque LANZA EXCEPCIÓN y no se ejecuta nada.
-- Correrlo junto con el UPDATE de la sección 2 (misma transacción implícita del
-- SQL Editor) o al menos inmediatamente antes.

DO $$
DECLARE
  r         record;
  v_esperado_slug  text := 'BBD687-A-08052026-XOJ';
BEGIN
  SELECT * INTO r FROM public.servicios
   WHERE id = '5c94b419-46d6-4ec4-8bb5-436f922a3e4b';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: la fila 5c94b419 ya no existe.';
  END IF;

  IF r.estado <> 'borrador' THEN
    RAISE EXCEPTION 'ABORTA: se esperaba estado=borrador y hay "%". Alguien ya la tocó — reauditar antes de seguir.', r.estado;
  END IF;

  IF r.aprobado IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'ABORTA: se esperaba aprobado=false y hay "%".', r.aprobado;
  END IF;

  -- La evidencia que prueba que ESTUVO aprobada. Si falta, no es el caso auditado.
  IF r.aprobado_por IS DISTINCT FROM 'Gustavo Ramos' THEN
    RAISE EXCEPTION 'ABORTA: se esperaba aprobado_por="Gustavo Ramos" y hay "%".', coalesce(r.aprobado_por,'(null)');
  END IF;

  IF r.slug IS DISTINCT FROM v_esperado_slug THEN
    RAISE EXCEPTION 'ABORTA: se esperaba slug="%" y hay "%". El link publicado al cliente ya no es el mismo.', v_esperado_slug, coalesce(r.slug,'(null)');
  END IF;

  -- Guarda de seguridad: si apareciera un rechazo, NO es daño y no se restaura.
  IF r.rechazado_at IS NOT NULL OR r.rechazado IS TRUE THEN
    RAISE EXCEPTION 'ABORTA: la fila tiene sello de RECHAZO (%, por %). Un rechazo es un cierre legítimo — no se restaura.', r.rechazado_at, coalesce(r.rechazado_por,'?');
  END IF;

  RAISE NOTICE 'OK — fila 5c94b419 (BBD687, orden #2701) en el estado dañado esperado. Procede la reparación.';
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. LA REPARACIÓN — por id explícito, una fila, dos columnas
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.servicios
   SET estado   = 'aprobado',
       aprobado = true
 WHERE id = '5c94b419-46d6-4ec4-8bb5-436f922a3e4b'
   -- Cinturón además del tirante: aunque el bloque 1 ya lo verificó, la
   -- condición viaja en el propio UPDATE para que sea idempotente y para que
   -- ejecutarlo suelto (sin el DO) tampoco pueda pisar un rechazo.
   AND estado = 'borrador'
   AND aprobado = false
   AND rechazado_at IS NULL;

-- ── EVIDENCIA DE ESTA FILA ───────────────────────────────────────────────────
-- id           5c94b419-46d6-4ec4-8bb5-436f922a3e4b
-- placa        BBD687 · orden #2701 (4c5c41ff-7afc-4ec7-817f-7a5570380578)
-- servicio     A · mecánico Fabián Araya · 140.550 km · creada 2026-05-08 16:56Z
--
-- 1. slug FINAL 'BBD687-A-08052026-XOJ' -> pasó por confirmSig/enviarAOrden.
--    El autosave nunca genera este patrón (genera 'draft-BBD687-XXXX').
-- 2. aprobado_por = 'Gustavo Ramos' con aprobado = false. Ningún camino escribe
--    esa combinación: la aprobación setea los dos juntos; solo el autosave de
--    Mantenimientos escribe aprobado=false sin tocar aprobado_por.
-- 3. rechazado = false y rechazado_at = NULL -> NO fue rechazada. Descarta el
--    único camino legítimo hacia 'borrador'.
-- 4. editado_por/editado_at = 'Gustavo Ramos' 2026-05-08 17:27Z, coherente con
--    el informe publicado, que dice "Editado por: Gustavo Ramos antes de aprobar".
-- 5. PRUEBA DIRECTA — el informe ya publicado al cliente en
--    ordenes.informe_mantenimiento de la #2701 dice literalmente
--    "Aprobado por: Gustavo Ramos" y lista DOS ítems con detalle. La fila hoy
--    tiene TRES. El tercero (1_7, detalle "S") se escribió DESPUÉS de aprobar:
--    es la huella del PATCH que la desaprobó. Ver sección 3.
-- 6. IMPACTO EN EL CLIENTE — ese informe publica
--       https://mantenimientos.ramosyramoscr.com/servicio/BBD687-A-08052026-XOJ
--    y /servicio/:slug filtra estado='aprobado'. El link, ya enviado al cliente,
--    HOY DA ErrorScreen. Restaurar el estado lo revive.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. OPCIONAL — limpiar el ítem espurio que dejó el mismo PATCH
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠ DECISIÓN DE TAVO. La sección 2 arregla el ESTADO; esto arregla el CONTENIDO.
--
-- El PATCH que desaprobó la fila también escribió, en el ítem 1_7
-- "Escaneo de fallas (Star Diagnosis / OBD)":
--       status: "issue"   detail: "S"
-- y metió "S" en la columna `pendientes`. Es una tecla suelta, no un hallazgo:
-- es el único `detail` de ≤3 caracteres en TODA la tabla (75 filas).
--
-- POR QUÉ IMPORTA: /servicio/:slug renderiza `revisiones` EN VIVO, no el informe.
-- Al revivir el link de la sección 2, el cliente de la orden #2701 vería
-- "Escaneo de fallas: S" listado como hallazgo del mantenimiento. El texto del
-- informe en `ordenes` está limpio (es un snapshot de antes del daño) — la
-- basura vive solo en la fila.
--
-- LÍMITE HONESTO: se sabe con certeza que 1_7 NO era 'issue' ni tenía detalle al
-- aprobar (el informe lista todo ítem con status='issue' O detail no nulo, y no
-- lo lista). NO se puede saber si era 'ok', 'na' o 'pending'. Se propone 'ok'
-- porque los otros 12 ítems están resueltos y el progreso guardado era 13/13.
-- Si preferís no adivinar, dejalo en 'pending' cambiando el valor de abajo.

/*  ── DESCOMENTAR PARA APLICAR ──
DO $$
DECLARE v_item jsonb;
BEGIN
  SELECT i INTO v_item
    FROM public.servicios s,
         jsonb_array_elements(s.revisiones -> 'Inspección A (menor)') i
   WHERE s.id = '5c94b419-46d6-4ec4-8bb5-436f922a3e4b'
     AND i ->> 'id' = '1_7';

  IF v_item IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no se encontró el ítem 1_7 en el grupo esperado.';
  END IF;
  IF v_item ->> 'detail' IS DISTINCT FROM 'S' THEN
    RAISE EXCEPTION 'ABORTA: el detalle de 1_7 ya no es "S" (es "%"). Alguien lo tocó.', coalesce(v_item ->> 'detail','(null)');
  END IF;

  UPDATE public.servicios
     SET revisiones = jsonb_set(
           revisiones,
           -- path como array[] y no como literal '{...}': el nombre del grupo
           -- lleva espacios y paréntesis, y así no depende del parseo de
           -- array literals.
           array['Inspección A (menor)'],
           (SELECT jsonb_agg(
                     CASE WHEN i ->> 'id' = '1_7'
                          THEN i || '{"status":"ok","detail":null}'::jsonb
                          ELSE i END
                     ORDER BY ord)
              FROM jsonb_array_elements(revisiones -> 'Inspección A (menor)')
                   WITH ORDINALITY AS t(i, ord))
         ),
         -- `pendientes` es snapshot legacy (derivarPendientes lo ignora cuando
         -- los ítems tienen status), pero se deja coherente igual.
         pendientes = '["Discos traseros marcados y con desgaste","Restablecer presion de llantas y reiniciar supervision"]'::jsonb
   WHERE id = '5c94b419-46d6-4ec4-8bb5-436f922a3e4b';

  RAISE NOTICE 'Ítem 1_7 limpiado (status=ok, detail=null) y pendientes recortado a 2.';
END $$;
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. NO TOCAR — los 3 candidatos que son cierres LEGÍTIMOS
-- ─────────────────────────────────────────────────────────────────────────────
-- Aparecen en el barrido (a) "aprobado_por seteado con aprobado=false" y podrían
-- confundirse con daño. NINGUNO se restaura.
--
-- ▸ b109e990-ae16-4ba1-a3a8-1746b467b19b — GBN000, orden #2756
--     RECHAZO LEGÍTIMO: rechazado=true, rechazado_por='Gustavo Ramos',
--     motivo='Copia', rechazado_at=2026-06-01 15:03Z. Era un servicio duplicado.
--     Su `aprobado_por='Arturo Ramos'` sobrevive porque handleRechazar no limpia
--     la aprobación previa (hallazgo A5 de la auditoría, sin corregir) — es
--     residuo, no evidencia. Restaurarlo resucitaría un duplicado rechazado.
--     ⚠ OJO APARTE: su link 'draft-GBN000-MPPLO55E' TAMBIÉN está publicado en el
--     informe de la #2756 y también está roto. Pero es OTRO problema (informe
--     emitido con slug 'draft-' porque se aprobó desde Taller sin pasar por
--     confirmSig) y el servicio está rechazado a propósito: NO se arregla
--     aprobándolo. Requiere decisión de producto — regenerar o retirar el link.
--
-- ▸ 9fb44b18-14be-438a-b4c7-9e7e73f18cf0 — TSM009, orden #2762
--     RECHAZO LEGÍTIMO: rechazado=true, motivo='Prueba',
--     rechazado_at=2026-05-30 02:48Z. Nunca tuvo aprobado_por. Su único ítem con
--     detalle dice "Hsbd" — es una prueba, no un servicio real.
--
-- ▸ 80d42bce-… — BCJ594, SIN orden vinculada
--     DESCARTE DELIBERADO (estado='descartado'). Tiene slug final y
--     aprobado_por='Gustavo Ramos' con aprobado=false, así que probablemente
--     SÍ pasó por el bug antes de descartarse — pero el descarte es una acción
--     explícita y POSTERIOR de una persona, y sin orden vinculada no hay ningún
--     link publicado que reparar. Se deja como está; restaurarla revertiría una
--     decisión humana en base a una inferencia.


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VERIFICACIÓN POSTERIOR — correr después del UPDATE
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.a La fila reparada
SELECT id, placa, orden_numero, estado, aprobado, aprobado_por, slug
  FROM public.servicios
 WHERE id = '5c94b419-46d6-4ec4-8bb5-436f922a3e4b';
-- Esperado: estado='aprobado', aprobado=true, slug intacto.

-- 5.b ¿Queda alguna otra fila con evidencia de cierre y estado incoherente?
--     Esperado tras la reparación: solo las 3 de la sección 4.
SELECT id, placa, orden_numero, estado, aprobado, aprobado_por, rechazado_at,
       CASE WHEN rechazado_at IS NOT NULL THEN 'rechazo legítimo'
            WHEN estado = 'descartado'    THEN 'descarte deliberado'
            ELSE '*** REVISAR — posible daño nuevo ***' END AS veredicto
  FROM public.servicios
 WHERE (aprobado_por IS NOT NULL AND aprobado = false)
    OR (estado = 'borrador' AND slug IS NOT NULL AND slug NOT LIKE 'draft-%')
 ORDER BY created_at;

-- 5.c El link del cliente vuelve a resolver (esto es lo que consulta la vista
--     pública /servicio/:slug — debe devolver exactamente 1 fila).
SELECT count(*) AS resuelve
  FROM public.servicios
 WHERE slug = 'BBD687-A-08052026-XOJ' AND estado = 'aprobado';
-- Esperado: 1
