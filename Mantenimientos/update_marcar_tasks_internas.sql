-- ═══════════════════════════════════════════════════════════════
-- Marcado de tasks internas con prefijo "~" en mant_items — 2026-08-14
--
-- Convención: una task que empieza con "~" es procedimiento interno del
-- mecánico. Taller la filtra de las viñetas de documentos al cliente; la
-- app Mantenimientos la muestra normal (el "~" se stripea en runtime).
--
-- Quirúrgico: transforma elementos puntuales del jsonb preservando el
-- resto y el orden. Reejecutable: el matching es por IGUALDAD EXACTA del
-- string completo SIN "~" — una task ya marcada ("~Verificación…") no
-- vuelve a matchear, así que no se duplica el prefijo. Igualdad exacta
-- también evita el problema del "~100.000 km" interno de las tasks 4M_*
-- (nada mira "contiene ~", solo el inicio implícito en la igualdad).
--
-- ⚠ NO aplicado por Claude — lo corre Tavo en el SQL Editor.
-- Independiente de update_editorial_recetas.sql (toca elementos
-- distintos); pueden correrse en cualquier orden.
-- ═══════════════════════════════════════════════════════════════

-- ─── GLOW: 5 tasks internas ──────────────────────────────────────────────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' IN (
             'Verificación eléctrica de cada bujía (resistencia con multímetro)',
             'Inspección del controlador de bujías (glow plug relay/module)',
             'Descarbonar los alojamientos antes de extraer (motor caliente)',
             'Aplicar pasta cerámica en el cuerpo — NO en rosca ni punta',
             'Instalación con torque especificado según WIS del motor'
           )
           THEN to_jsonb('~' || (elem #>> '{}'))
           ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = 'GLOW';

-- ─── 4M_DIFF: nota de advertencia ────────────────────────────────────────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' = '⚠ No pertenece al ASSYST — inspección recomendada ~100.000 km'
           THEN to_jsonb('~' || (elem #>> '{}'))
           ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = '4M_DIFF';

-- ─── 4M_FDIFF: nota de advertencia ───────────────────────────────────────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' = '⚠ No pertenece al ASSYST — verificar si es serviceable (consultar WIS)'
           THEN to_jsonb('~' || (elem #>> '{}'))
           ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = '4M_FDIFF';

-- ─── Verificación ────────────────────────────────────────────────────────────
DO $$
DECLARE v_marcadas int; v_glow int; v_4md int; v_4mf int;
BEGIN
  SELECT COUNT(*) INTO v_marcadas
    FROM mant_items, jsonb_array_elements_text(tasks) AS e
   WHERE left(e, 1) = '~';
  SELECT COUNT(*) INTO v_glow FROM mant_items, jsonb_array_elements_text(tasks) AS e
   WHERE clave = 'GLOW' AND left(e, 1) = '~';
  SELECT COUNT(*) INTO v_4md  FROM mant_items, jsonb_array_elements_text(tasks) AS e
   WHERE clave = '4M_DIFF' AND left(e, 1) = '~';
  SELECT COUNT(*) INTO v_4mf  FROM mant_items, jsonb_array_elements_text(tasks) AS e
   WHERE clave = '4M_FDIFF' AND left(e, 1) = '~';
  RAISE NOTICE 'Tasks internas (~) totales: % (esperado 7) — GLOW: % de 5, 4M_DIFF: % de 1, 4M_FDIFF: % de 1',
    v_marcadas, v_glow, v_4md, v_4mf;
END $$;
