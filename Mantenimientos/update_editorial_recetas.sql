-- ═══════════════════════════════════════════════════════════════
-- Corrección editorial de recetas (mant_items) — 2026-08-14
--
-- Quirúrgico: cada UPDATE transforma elementos puntuales del jsonb
-- preservando el resto y el orden; nada reescribe filas completas.
-- Reejecutable: cada paso tiene guard (segunda corrida = 0 filas).
--
-- ⚠ NO aplicado por Claude — lo corre Tavo en el SQL Editor.
--
-- Nota de alcance: los textos de tasks son la clave de re-mapeo al
-- EDITAR borradores/servicios viejos (textToId en App.jsx matchea por
-- texto). Renombrar una task hace que, al reabrir un borrador viejo,
-- el estado de ESA task no se re-mapee (queda pendiente). Los informes
-- ya aprobados no cambian: renderizan su propio snapshot.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. "plumillas" → "escobillas limpiaparabrisas" (toda fila, toda serie) ──
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           to_jsonb(regexp_replace(elem #>> '{}', 'plumillas?', 'escobillas limpiaparabrisas', 'gi'))
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE tasks::text ~* 'plumilla';

-- ─── 2. Item 2: agregar escobillas junto a la revisión de luces ──────────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(x ORDER BY ord, sub)
  FROM (
    SELECT elem AS x, ord, 0 AS sub
    FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
    UNION ALL
    SELECT to_jsonb('Revisión de escobillas limpiaparabrisas y lavadores'::text), ord, 1
    FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
    WHERE elem #>> '{}' = 'Revisión de luces, alertas y sensores'
  ) s
)
WHERE clave = '2'
  AND NOT tasks::text LIKE '%Revisión de escobillas limpiaparabrisas y lavadores%';

-- ─── 3. Item 2: tildes en "Revision de soportes de motor y transmision" ──────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' = 'Revision de soportes de motor y transmision'
                THEN to_jsonb('Revisión de soportes de motor y transmisión'::text)
                ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = '2'
  AND tasks::text LIKE '%Revision de soportes de motor y transmision%';

-- ─── 4. Item 19: redacción DPF ───────────────────────────────────────────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' = 'Inpseccion de estado de filtro de particulas por medio de escaner'
                THEN to_jsonb('Inspección del estado del filtro de partículas (DPF) con escáner'::text)
                ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = '19'
  AND tasks::text LIKE '%Inpseccion%';

-- ─── 5. RC y RG_PTS: quitar el duplicado "Prueba en carretera" ───────────────
-- (se conserva "Prueba de ruta: caja, dirección, frenado y ruidos")
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(elem ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
  WHERE elem #>> '{}' <> 'Prueba en carretera'
)
WHERE clave IN ('RC', 'RG_PTS')
  AND tasks::text LIKE '%"Prueba en carretera"%';

-- ─── 6. GLOW: la primera task era una nota ⚠ que quedó blanqueada a "-" ──────
-- Se restaura con el paso de extracción, que faltaba en el procedimiento.
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(
           CASE WHEN elem #>> '{}' = '-'
                THEN to_jsonb('Extracción de bujías de precalentamiento'::text)
                ELSE elem END
           ORDER BY ord)
  FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
)
WHERE clave = 'GLOW'
  AND tasks::text LIKE '%"-"%';

-- ─── 7. (Opcional aprobado con este SQL) escobillas en RC y RG_PTS ───────────
UPDATE mant_items
SET tasks = (
  SELECT jsonb_agg(x ORDER BY ord, sub)
  FROM (
    SELECT elem AS x, ord, 0 AS sub
    FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
    UNION ALL
    SELECT to_jsonb('Revisión de escobillas limpiaparabrisas y lavadores'::text), ord, 1
    FROM jsonb_array_elements(tasks) WITH ORDINALITY AS t(elem, ord)
    WHERE elem #>> '{}' = 'Revisión de luces, alertas y sensores'
  ) s
)
WHERE clave IN ('RC', 'RG_PTS')
  AND NOT tasks::text LIKE '%Revisión de escobillas limpiaparabrisas y lavadores%';

-- ─── Verificación ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_plumilla   int;
  v_esc2       boolean;
  v_soportes   boolean;
  v_19         text;
  v_rc_dup     int;
  v_rg_dup     int;
  v_glow1      text;
  v_esc_rc     boolean;
  v_esc_rg     boolean;
BEGIN
  SELECT COUNT(*) INTO v_plumilla FROM mant_items WHERE tasks::text ~* 'plumilla';
  SELECT tasks::text LIKE '%Revisión de escobillas limpiaparabrisas y lavadores%' INTO v_esc2      FROM mant_items WHERE clave = '2';
  SELECT tasks::text LIKE '%Revisión de soportes de motor y transmisión%'         INTO v_soportes  FROM mant_items WHERE clave = '2';
  SELECT tasks ->> 0 INTO v_19    FROM mant_items WHERE clave = '19';
  SELECT (SELECT COUNT(*) FROM jsonb_array_elements_text(tasks) e WHERE e = 'Prueba en carretera') INTO v_rc_dup FROM mant_items WHERE clave = 'RC';
  SELECT (SELECT COUNT(*) FROM jsonb_array_elements_text(tasks) e WHERE e = 'Prueba en carretera') INTO v_rg_dup FROM mant_items WHERE clave = 'RG_PTS';
  SELECT tasks ->> 0 INTO v_glow1 FROM mant_items WHERE clave = 'GLOW';
  SELECT tasks::text LIKE '%Revisión de escobillas limpiaparabrisas y lavadores%' INTO v_esc_rc FROM mant_items WHERE clave = 'RC';
  SELECT tasks::text LIKE '%Revisión de escobillas limpiaparabrisas y lavadores%' INTO v_esc_rg FROM mant_items WHERE clave = 'RG_PTS';

  RAISE NOTICE '1) Filas con "plumilla" restantes: % (debe ser 0)', v_plumilla;
  RAISE NOTICE '2) Item 2 con escobillas: % (debe ser t)', v_esc2;
  RAISE NOTICE '3) Item 2 soportes con tildes: % (debe ser t)', v_soportes;
  RAISE NOTICE '4) Item 19 task: % (debe decir DPF con tildes)', v_19;
  RAISE NOTICE '5) "Prueba en carretera" en RC: % / en RG_PTS: % (deben ser 0)', v_rc_dup, v_rg_dup;
  RAISE NOTICE '6) GLOW primera task: % (debe ser Extracción de bujías de precalentamiento)', v_glow1;
  RAISE NOTICE '7) Escobillas en RC: % / RG_PTS: % (deben ser t)', v_esc_rc, v_esc_rg;
END $$;
