-- ─── SEED SERIE EV (AEV / BEV) ───────────────────────────────────────────────
-- Fuente: src/App.jsx — items EV_A / EV_B y códigos AEV / BEV (serie 'EV')
-- Reejecutable: usa ON CONFLICT DO NOTHING
--
-- ⚠ NO aplicada por Claude — la corre Tavo a mano en Supabase.
-- Sin estas filas la serie EV NO aparece en la app (las recetas de la DB
-- reemplazan los defaults del JS al cargar).
--
-- Nota: se usaron los códigos AEV/BEV en vez de AE/BE porque "BE" ya existe
-- como código ASSYST diesel real (B + filtro aire + techo + combustible + ATF).
-- Mismos códigos que el cotizador de Taller (commit a2ce416 en RamosyRamos/Taller).

-- ─── ITEMS EV ────────────────────────────────────────────────────────────────

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('EV_A', 'Inspección A Eléctrico (menor EV)', '⚡',
 '["Cambio de filtro de habitáculo (combinado / HEPA según modelo)","Inspección visual sistema de alto voltaje (cables y conectores)","Chequeo de batería 12V (test de carga)","Chequeo de estado de salud (SoH) de batería HV con XENTRY","Revisión de frenos (discos, pastillas, oxidación)","Revisión de llantas y rotación","Revisión de suspensión y dirección","Luces, plumillas y nivel de lavaparabrisas","Verificación de nivel y condición de refrigerante (circuitos térmicos)","Reset de ASSYST y verificación de actualizaciones de software"]'::jsonb,
 false, 30)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('EV_B', 'Adicionales B Eléctrico', '🔌',
 '["Servicio de mordazas (limpieza y lubricación de pines/guías)","Prueba de resistencia de aislamiento HV con XENTRY","Chequeo de sistema A/C y bomba de calor","Inspección de eATS (motor eléctrico/reductora): fugas y ruidos"]'::jsonb,
 false, 31)
on conflict (clave) do nothing;

-- ─── CÓDIGOS SERIE EV ────────────────────────────────────────────────────────
-- BEV duplica los items de AEV (patrón de duplicación, igual que las series A/B).
-- El líquido de frenos reusa el item "4" existente.

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AEV', 'EV', '#4ade80', 'Servicio A Eléctrico — filtro habitáculo + inspección HV + SoH batería',
 '["EV_A"]'::jsonb, 'electrico', 1)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BEV', 'EV', '#22c55e', 'Servicio B Eléctrico — AEV + líq. frenos + aislamiento HV + eATS',
 '["EV_A","4","EV_B"]'::jsonb, 'electrico', 2)
on conflict (codigo) do nothing;

-- ─── VERIFICACIÓN ────────────────────────────────────────────────────────────

do $$
declare v_items int; v_codes int;
begin
  select count(*) into v_items from mant_items   where clave  in ('EV_A','EV_B');
  select count(*) into v_codes from mant_recetas where codigo in ('AEV','BEV');
  raise notice 'Serie EV: % de 2 items, % de 2 códigos', v_items, v_codes;
end $$;
