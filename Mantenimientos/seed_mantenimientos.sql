-- ─── SEED MANTENIMIENTOS ─────────────────────────────────────────────────────
-- Fuente: src/App.jsx — objetos ITEMS, CODES, A_KEYS, B_KEYS
-- Reejecutable: usa ON CONFLICT DO NOTHING

-- ─── TABLAS ──────────────────────────────────────────────────────────────────

create table if not exists mant_items (
  clave        text primary key,
  label        text not null,
  icon         text,
  tasks        jsonb not null default '[]'::jsonb,
  out_of_assyst boolean not null default false,
  orden        int
);

create table if not exists mant_recetas (
  codigo      text primary key,
  serie       text not null,
  color       text,
  descripcion text,
  items       jsonb not null default '[]'::jsonb,
  fuel_lock   text,
  orden       int
);

-- ─── ITEMS ───────────────────────────────────────────────────────────────────

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('1', 'Inspección A (menor)', '🔍',
 '["Inspección visual del motor — fugas, correas, mangueras","Revisión y corrección de todos los niveles de fluidos","Inspección de pastillas y discos de freno","Inspección de presión de llantas (Incluida llanta de repuesto)","Inspección visual de llantas — desgaste y daños","Revisión de luces exteriores e interiores","Revisión de limpiaparabrisas y lavadores","Escaneo de fallas (Star Diagnosis / OBD)","Reiniciar intervalo de mantenimiento"]'::jsonb,
 false, 1)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('2', 'Inspección B (mayor)', '🔍',
 '["Inspección visual del motor — fugas, correas, mangueras","Revisión y corrección de todos los niveles de fluidos","Inspección de pastillas y discos de freno (todos los ejes)","Revisión del freno de estacionamiento","Inspección de presión de llantas (Incluida llanta de repuesto)","Inspección visual de llantas — desgaste y daños","Reemplazo del filtro de habitáculo / carbón activo","Revisión de luces, alertas y sensores","Revisión de escobillas limpiaparabrisas y lavadores","Inspección de sistema de escape","Inspección de suspensión y dirección","Inspección de faja de accesorios","Prueba de batería con analizador de batería (Anotar estado de salud y carga)","Escaneo completo de fallas (Star Diagnosis)","Prueba en carretera","Reiniciar intervalo de mantenimiento"]'::jsonb,
 false, 2)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('3', 'Aceite y filtro de motor', '⚙️',
 '["Drenaje del aceite de motor","Reemplazo del filtro de aceite","Carga de aceite nuevo — especificación MB aprobada","Verificación de nivel y ausencia de fugas"]'::jsonb,
 false, 3)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('4', 'Líquido de frenos', '🛑',
 '["Extracción del líquido de frenos antiguo","Carga de líquido de frenos nuevo DOT 4+ (MB 331.0)","Purga del sistema de frenos — purga en los 4 tornillos de purga","Verificación de hermeticidad del circuito"]'::jsonb,
 false, 4)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('8', 'Filtro de aire del motor', '🌀',
 '["Extracción del filtro de aire del motor","Limpieza del alojamiento del filtro","Instalación del filtro de aire nuevo"]'::jsonb,
 false, 5)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('10', 'Techo corredizo', '🏠',
 '["Limpieza de guías y canales de drenaje del techo","Lubricación de guías con grasa MB especificada","Verificación del funcionamiento del techo corredizo"]'::jsonb,
 false, 6)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('11', 'Filtro de combustible — Diesel', '⛽',
 '["Extracción del filtro de combustible diesel","Instalación del filtro de combustible nuevo","Purga del sistema de combustible si aplica","Verificación de ausencia de fugas"]'::jsonb,
 false, 7)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('12', 'Bujías de encendido — gasolina', '⚡',
 '["Retiro de bobinas de encendido","Extracción de bujías (inspección visual de electrodos)","Instalación de bujías nuevas con torque especificado","Reinstalación de bobinas de encendido","Prueba de encendido en marcha"]'::jsonb,
 false, 8)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('13', 'Líquido refrigerante', '❄️',
 '["Drenaje completo del líquido refrigerante","Enjuague del sistema de refrigeración","Inspección de mangueras, conexiones y radiador","Carga de refrigerante MB 325.0 — mezcla correcta","Purga del sistema de refrigeración","Verificación de temperatura operativa en marcha"]'::jsonb,
 false, 9)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('15', 'Enganche de remolque', '🔗',
 '["Lubricación del enganche de remolque","Inspección visual del sistema de enganche","Verificación del cableado eléctrico del enganche"]'::jsonb,
 false, 10)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('20', 'Caja automática ATF', '🔧',
 '["Verificación de nivel y ausencia de fugas","Drenaje del aceite de caja automática","Reemplazo del filtro de caja y empaque del cárter","Carga de aceite ATF — especificación MB aprobada","Adaptación de la caja automática (Star Diagnosis)","Prueba de carretera — verificación de cambios"]'::jsonb,
 false, 11)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('24', 'Correa de distribución', '⛓️',
 '["Inspección visual de la correa de distribución","Medición del desgaste según especificación MB","Reemplazo de correa, bomba de agua, tensores y poleas","Verificación de sincronización post-instalación"]'::jsonb,
 false, 12)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('GLOW', 'Bujías de precalentamiento — Solo diesel', '🌡️',
 '["Extracción de bujías de precalentamiento","~Verificación eléctrica de cada bujía (resistencia con multímetro)","~Inspección del controlador de bujías (glow plug relay/module)","~Descarbonar los alojamientos antes de extraer (motor caliente)","~Aplicar pasta cerámica en el cuerpo — NO en rosca ni punta","~Instalación con torque especificado según WIS del motor","Verificación con Star Diagnosis (test de precalentamiento)"]'::jsonb,
 true, 13)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('4M_DIFF', 'Diferencial trasero 4MATIC', '🔩',
 '["~⚠ No pertenece al ASSYST — inspección recomendada ~100.000 km","Drenaje del aceite del diferencial trasero","Carga de aceite hypoid 75w-90 aprobado MB","Inspección de sellos y retenes del diferencial","Verificación de ausencia de fugas post-servicio"]'::jsonb,
 true, 14)
on conflict (clave) do nothing;

insert into mant_items (clave, label, icon, tasks, out_of_assyst, orden) values
('4M_FDIFF', 'Diferencial delantero 4MATIC', '🔩',
 '["~⚠ No pertenece al ASSYST — verificar si es serviceable (consultar WIS)","Drenaje del aceite del diferencial delantero si aplica","Carga de aceite hypoid aprobado MB","Inspección de sellos y retenes"]'::jsonb,
 true, 15)
on conflict (clave) do nothing;

-- ─── RECETAS — SERIE A ───────────────────────────────────────────────────────

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A', 'A', '#C8A96E', 'Inspección menor + aceite',
 '["1","3"]'::jsonb, null, 1)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A0', 'A', '#C8A96E', 'A + techo corredizo',
 '["1","3","10"]'::jsonb, null, 2)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A1', 'A', '#D4A030', 'A + líquido de frenos',
 '["1","3","4"]'::jsonb, null, 3)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A2', 'A', '#C8A020', 'A + frenos + techo corredizo',
 '["1","3","4","10"]'::jsonb, null, 4)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A3', 'A', '#B88A00', 'A + filtro aire + combustible/bujías',
 '["1","3","8","FUEL"]'::jsonb, null, 5)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A4', 'A', '#A07800', 'A + filtro aire + techo + combustible/bujías',
 '["1","3","8","10","FUEL"]'::jsonb, null, 6)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A5', 'A', '#C8A96E', 'A + frenos + filtro aire + combustible/bujías',
 '["1","3","4","8","FUEL"]'::jsonb, null, 7)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A6', 'A', '#C8A96E', 'A + frenos + filtro aire + techo + comb./bujías',
 '["1","3","4","8","10","FUEL"]'::jsonb, null, 8)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A7', 'A', '#E8B820', 'A + ATF caja automática',
 '["1","3","20"]'::jsonb, null, 9)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A8', 'A', '#D4A030', 'A + techo + ATF',
 '["1","3","10","20"]'::jsonb, null, 10)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('A9', 'A', '#C08010', 'A + frenos + ATF',
 '["1","3","4","20"]'::jsonb, null, 11)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AC', 'A', '#C8A96E', 'A + frenos + techo + ATF',
 '["1","3","4","10","20"]'::jsonb, null, 12)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AF', 'A', '#B88A00', 'A + frenos + filtro aire + bujías + ATF',
 '["1","3","4","8","12","20"]'::jsonb, 'gasolina', 13)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AG', 'A', '#A07800', 'A + frenos + filtro aire + techo + comb. + ATF',
 '["1","3","4","8","10","11","20"]'::jsonb, 'diesel', 14)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AH', 'A', '#FF8C42', 'A + refrigerante + correa distribución',
 '["1","3","13","24"]'::jsonb, null, 15)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('AK', 'A', '#FF8C42', 'A + refrigerante',
 '["1","3","13"]'::jsonb, null, 16)
on conflict (codigo) do nothing;

-- ─── RECETAS — SERIE B ───────────────────────────────────────────────────────

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B', 'B', '#7EB8F7', 'Inspección mayor + aceite + filtro habitáculo',
 '["2","3"]'::jsonb, null, 1)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B0', 'B', '#7EB8F7', 'B + filtro de aire',
 '["2","3","8"]'::jsonb, null, 2)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B1', 'B', '#5AA0E8', 'B + líquido de frenos',
 '["2","3","4"]'::jsonb, null, 3)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B2', 'B', '#4488D4', 'B + frenos + techo corredizo',
 '["2","3","4","10"]'::jsonb, null, 4)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B3', 'B', '#3878C0', 'B + filtro aire + combustible/bujías',
 '["2","3","8","FUEL"]'::jsonb, null, 5)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B4', 'B', '#2868AC', 'B + filtro aire + techo + combustible/bujías',
 '["2","3","8","10","FUEL"]'::jsonb, null, 6)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B5', 'B', '#3878C0', 'B + frenos + filtro aire + combustible/bujías',
 '["2","3","4","8","FUEL"]'::jsonb, null, 7)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B6', 'B', '#1858A0', 'B + frenos + aire + techo + combustible/bujías',
 '["2","3","4","8","10","FUEL"]'::jsonb, null, 8)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B7', 'B', '#A0C8FF', 'B + ATF caja automática',
 '["2","3","20"]'::jsonb, null, 9)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B8', 'B', '#80A8E8', 'B + techo + ATF',
 '["2","3","10","20"]'::jsonb, null, 10)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('B9', 'B', '#6090D0', 'B + frenos + ATF',
 '["2","3","4","20"]'::jsonb, null, 11)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BC', 'B', '#FF6B6B', 'B + frenos + aire + techo + bujías + ATF (AMG gasolina)',
 '["2","3","4","8","10","12","20"]'::jsonb, 'gasolina', 12)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BD', 'B', '#4878B8', 'B + filtro aire + combustible + ATF',
 '["2","3","8","11","20"]'::jsonb, 'diesel', 13)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BE', 'B', '#3060A0', 'B + filtro aire + techo + combustible + ATF',
 '["2","3","8","10","11","20"]'::jsonb, 'diesel', 14)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BF', 'B', '#B88A00', 'B + frenos + filtro aire + bujías + ATF',
 '["2","3","4","8","12","20"]'::jsonb, 'gasolina', 15)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BH', 'B', '#34D399', 'B + refrigerante',
 '["2","3","13"]'::jsonb, null, 16)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BK', 'B', '#10B981', 'B + frenos + refrigerante',
 '["2","3","4","13"]'::jsonb, null, 17)
on conflict (codigo) do nothing;

insert into mant_recetas (codigo, serie, color, descripcion, items, fuel_lock, orden) values
('BS', 'B', '#059669', 'B + techo + refrigerante + ATF',
 '["2","3","10","13","20"]'::jsonb, null, 18)
on conflict (codigo) do nothing;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table mant_items enable row level security;
alter table mant_recetas enable row level security;

create policy "mant_items_sel"   on mant_items   for select to anon, authenticated using (true);
create policy "mant_recetas_sel" on mant_recetas for select to anon, authenticated using (true);

-- ─── Revisión de Compra (serie C) ────────────────────────────────────────────
-- Ya aplicado a mano en la DB de producción; se documenta acá para reproducibilidad.
-- Idempotente: mant_items.clave y mant_recetas.codigo son PRIMARY KEY (ON CONFLICT),
-- y la columna dictamen usa ADD COLUMN IF NOT EXISTS.

INSERT INTO mant_items (clave, label, icon, tasks, out_of_assyst, orden) VALUES (
  'RC', 'Revisión de compra', '🔍',
  '["Carrocería y pintura: indicios de choques o repintado","Chasis y puntos de fijación: deformaciones o soldaduras","Interior y tapicería: desgaste coherente con el kilometraje","Electrónica y testigos: escaneo de códigos de falla","Prueba de ruta: caja, dirección, frenado y ruidos","Llantas: estado y fecha de fabricación (DOT)","Kilometraje: coherencia entre odómetro, desgaste y registros"]'::jsonb,
  true, 100
)
ON CONFLICT (clave) DO NOTHING;

INSERT INTO mant_recetas (codigo, color, descripcion, items, fuel_lock, serie, orden) VALUES (
  'RC', '#C9CDD2', 'Revisión de Compra', '["2","RC"]'::jsonb, NULL, 'C', 1
)
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE servicios ADD COLUMN IF NOT EXISTS dictamen jsonb;
