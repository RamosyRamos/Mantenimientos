import { useState, useRef, useEffect } from "react";

// ─── ÍTEMS ASSYST ─────────────────────────────────────────────────────────
const ITEMS = {
  "1": { label:"Inspección A (menor)", icon:"🔍", tasks:[
    "Inspección visual del motor — fugas, correas, mangueras",
    "Revisión y corrección de todos los niveles de fluidos",
    "Inspección de pastillas y discos de freno",
    "Revisión de presión de neumáticos (incl. auxilio)",
    "Inspección visual de neumáticos — desgaste y daños",
    "Revisión de luces exteriores e interiores",
    "Revisión de limpiaparabrisas y lavadores",
    "Escaneo de fallas (Star Diagnosis / OBD)",
    "Reset del contador ASSYST — documentar en DSB",
  ]},
  "2": { label:"Inspección B (mayor)", icon:"🔍", tasks:[
    "Inspección visual del motor — fugas, correas, mangueras",
    "Revisión y corrección de todos los niveles de fluidos",
    "Inspección de pastillas y discos de freno (todos los ejes)",
    "Revisión del freno de estacionamiento",
    "Revisión de presión de neumáticos (incl. auxilio)",
    "Inspección visual de neumáticos — desgaste y daños",
    "Reemplazo del filtro de habitáculo / carbón activo",
    "Revisión de luces, alertas y sensores",
    "Inspección de sistema de escape",
    "Inspección de suspensión y dirección",
    "Inspección de correas accesorias",
    "Prueba de batería (carga y arranque)",
    "Actualización de software si disponible (Xentry)",
    "Escaneo completo de fallas (Star Diagnosis)",
    "Reset del contador ASSYST — documentar en DSB",
  ]},
  "3": { label:"Aceite y filtro de motor", icon:"⚙️", tasks:[
    "Drenaje del aceite de motor",
    "Reemplazo del filtro de aceite",
    "Carga de aceite nuevo — especificación MB aprobada",
    "Verificación de nivel y ausencia de fugas",
  ]},
  "4": { label:"Líquido de frenos", icon:"🛑", tasks:[
    "Extracción del líquido de frenos antiguo",
    "Carga de líquido de frenos nuevo DOT 4+ (MB 331.0)",
    "Sangrado de frenos — purga en los 4 tornillos de purga",
    "Verificación de hermeticidad del circuito",
  ]},
  "8": { label:"Filtro de aire del motor", icon:"🌀", tasks:[
    "Extracción del filtro de aire del motor",
    "Limpieza del alojamiento del filtro",
    "Instalación del filtro de aire nuevo (MB original)",
  ]},
  "10": { label:"Techo corredizo", icon:"🏠", tasks:[
    "Limpieza de guías y canales de drenaje del techo",
    "Lubricación de guías con grasa MB especificada",
    "Verificación del funcionamiento del techo corredizo",
  ]},
  "11": { label:"Filtro de combustible — Diesel", icon:"⛽", tasks:[
    "Extracción del filtro de combustible diesel",
    "Instalación del filtro de combustible nuevo (MB original)",
    "Purga del sistema de combustible si aplica",
    "Verificación de ausencia de fugas",
  ]},
  "12": { label:"Bujías de encendido — gasolina", icon:"⚡", tasks:[
    "Retiro de bobinas de encendido",
    "Extracción de bujías (inspección visual de electrodos)",
    "Instalación de bujías nuevas con torque especificado",
    "Reinstalación de bobinas de encendido",
    "Prueba de encendido en marcha",
  ]},
  "13": { label:"Líquido refrigerante", icon:"❄️", tasks:[
    "Drenaje completo del líquido refrigerante",
    "Enjuague del sistema de refrigeración",
    "Inspección de mangueras, conexiones y radiador",
    "Carga de refrigerante MB 325.0 — mezcla correcta",
    "Purga del sistema de refrigeración",
    "Verificación de temperatura operativa en marcha",
  ]},
  "15": { label:"Enganche de remolque", icon:"🔗", tasks:[
    "Lubricación del enganche de remolque",
    "Inspección visual del sistema de enganche",
    "Verificación del cableado eléctrico del enganche",
  ]},
  "20": { label:"Caja automática ATF", icon:"🔧", tasks:[
    "Drenaje del aceite de caja automática",
    "Reemplazo del filtro de caja y sello del cárter",
    "Carga de aceite ATF — especificación MB aprobada",
    "Adaptación de la caja automática (Star Diagnosis)",
    "Prueba de carretera — verificación de cambios",
  ]},
  "24": { label:"Correa de distribución", icon:"⛓️", tasks:[
    "Inspección visual de la correa de distribución",
    "Medición del desgaste según especificación MB",
    "Reemplazo de correa, bomba de agua, tensores y poleas",
    "Verificación de sincronización post-instalación",
  ]},
  // Fuera del ASSYST — siempre al final del checklist principal
  "GLOW": { label:"Bujías de precalentamiento — Solo diesel", icon:"🌡️", outOfAssyst:true, tasks:[
    "⚠ No pertenece al ASSYST — reemplazar por condición o ~150.000–200.000 km",
    "Verificación eléctrica de cada bujía (resistencia con multímetro)",
    "Inspección del controlador de bujías (glow plug relay/module)",
    "Descarbonar los alojamientos antes de extraer (motor caliente)",
    "Aplicar pasta cerámica en el cuerpo — NO en rosca ni punta",
    "Instalación con torque especificado según WIS del motor",
    "Verificación con Star Diagnosis (test de precalentamiento)",
  ]},
  "4M_DIFF": { label:"Diferencial trasero 4MATIC", icon:"🔩", outOfAssyst:true, tasks:[
    "⚠ No pertenece al ASSYST — inspección recomendada ~100.000 km",
    "Drenaje del aceite del diferencial trasero",
    "Carga de aceite hypoid 75w-90 aprobado MB",
    "Inspección de sellos y retenes del diferencial",
    "Verificación de ausencia de fugas post-servicio",
  ]},
  "4M_FDIFF": { label:"Diferencial delantero 4MATIC", icon:"🔩", outOfAssyst:true, tasks:[
    "⚠ No pertenece al ASSYST — verificar si es serviceable (consultar WIS)",
    "Drenaje del aceite del diferencial delantero si aplica",
    "Carga de aceite hypoid aprobado MB",
    "Inspección de sellos y retenes",
  ]},
};

// ─── CÓDIGOS ASSYST PLUS ──────────────────────────────────────────────────
const CODES = {
  "A":  { color:"#C8A96E", desc:"Inspección menor + aceite",                              items:["1","3"] },
  "A0": { color:"#C8A96E", desc:"A + techo corredizo",                                    items:["1","3","10"] },
  "A1": { color:"#D4A030", desc:"A + líquido de frenos",                                  items:["1","3","4"] },
  "A3": { color:"#B88A00", desc:"A + filtro aire + combustible/bujías",                   items:["1","3","8","FUEL"] },
  "A4": { color:"#A07800", desc:"A + filtro aire + techo + combustible/bujías",           items:["1","3","8","10","FUEL"] },
  "A5": { color:"#C8A96E", desc:"A + frenos + filtro aire + combustible/bujías",          items:["1","3","4","8","FUEL"] },
  "A6": { color:"#C8A96E", desc:"A + frenos + filtro aire + techo + comb./bujías",        items:["1","3","4","8","10","FUEL"] },
  "A7": { color:"#E8B820", desc:"A + ATF caja automática",                                items:["1","3","20"] },
  "A8": { color:"#D4A030", desc:"A + techo + ATF",                                       items:["1","3","10","20"] },
  "A9": { color:"#C08010", desc:"A + frenos + ATF",                                      items:["1","3","4","20"] },
  "AC": { color:"#C8A96E", desc:"A + frenos + techo + ATF",                              items:["1","3","4","10","20"] },
  "AF": { color:"#B88A00", desc:"A + frenos + filtro aire + bujías + ATF",               items:["1","3","4","8","12","20"], fuelLock:"gasolina" },
  "AG": { color:"#A07800", desc:"A + frenos + filtro aire + techo + comb. + ATF",        items:["1","3","4","8","10","11","20"], fuelLock:"diesel" },
  "AH": { color:"#FF8C42", desc:"A + refrigerante + correa distribución",                 items:["1","3","13","24"] },
  "AK": { color:"#FF8C42", desc:"A + refrigerante",                                      items:["1","3","13"] },
  "B":  { color:"#7EB8F7", desc:"Inspección mayor + aceite + filtro habitáculo",          items:["2","3"] },
  "B0": { color:"#7EB8F7", desc:"B + filtro de aire",                                    items:["2","3","8"] },
  "B1": { color:"#5AA0E8", desc:"B + líquido de frenos",                                 items:["2","3","4"] },
  "B2": { color:"#4488D4", desc:"B + frenos + techo corredizo",                          items:["2","3","4","10"] },
  "B3": { color:"#3878C0", desc:"B + filtro aire + combustible/bujías",                  items:["2","3","8","FUEL"] },
  "B4": { color:"#2868AC", desc:"B + filtro aire + techo + combustible/bujías",          items:["2","3","8","10","FUEL"] },
  "B5": { color:"#3878C0", desc:"B + frenos + filtro aire + combustible/bujías",         items:["2","3","4","8","FUEL"] },
  "B6": { color:"#1858A0", desc:"B + frenos + aire + techo + combustible/bujías",        items:["2","3","4","8","10","FUEL"] },
  "B7": { color:"#A0C8FF", desc:"B + ATF caja automática",                               items:["2","3","20"] },
  "B8": { color:"#80A8E8", desc:"B + techo + ATF",                                       items:["2","3","10","20"] },
  "B9": { color:"#6090D0", desc:"B + frenos + ATF",                                      items:["2","3","4","20"] },
  "BC": { color:"#FF6B6B", desc:"B + frenos + aire + techo + bujías + ATF (AMG gasolina)",  items:["2","3","4","8","10","12","20"], fuelLock:"gasolina" },
  "BD": { color:"#4878B8", desc:"B + filtro aire + combustible + ATF",                   items:["2","3","8","11","20"], fuelLock:"diesel" },
  "BE": { color:"#3060A0", desc:"B + filtro aire + techo + combustible + ATF",           items:["2","3","8","10","11","20"], fuelLock:"diesel" },
  "BH": { color:"#34D399", desc:"B + refrigerante",                                      items:["2","3","13"] },
  "BK": { color:"#10B981", desc:"B + frenos + refrigerante",                             items:["2","3","4","13"] },
  "BS": { color:"#059669", desc:"B + techo + refrigerante + ATF",                        items:["2","3","10","13","20"] },
};

const A_KEYS = ["A","A0","A1","A3","A4","A5","A6","A7","A8","A9","AC","AF","AG","AH","AK"];
const B_KEYS = ["B","B0","B1","B2","B3","B4","B5","B6","B7","B8","B9","BC","BD","BE","BH","BK","BS"];

// ─── REVISIONES ADICIONALES FUERA DEL ASSYST ─────────────────────────────
// fuel: "all" | "gasolina" | "diesel"
const EXTRAS = [
  {
    id:"EX_BAT", fuel:"all", icon:"🔋", label:"Batería 12V",
    interval:"Testear en cada servicio B · Reemplazar cada 4–5 años",
    tasks:[
      "Prueba de carga y arranque (voltaje en reposo y bajo carga)",
      "Inspección de bornes — limpieza y ajuste si hay corrosión",
      "Verificación del alternador y sistema de carga",
      "Si se reemplaza: adaptar batería nueva con Star Diagnosis",
    ]
  },
  {
    id:"EX_CHN", fuel:"all", icon:"⛓️", label:"Cadena de distribución",
    interval:"Inspección a los 150.000 km+ · O si hay ruido en arranques en frío",
    tasks:[
      "Escuchar traqueteo en arranque frío — síntoma de cadena elongada",
      "Inspección del tensor hidráulico (requiere presión de aceite correcta)",
      "Verificar presencia de virutas metálicas al cambiar aceite",
      "⚠ Ruido persistente o código de sincronización = reemplazar de inmediato",
    ]
  },
  {
    id:"EX_SRP", fuel:"all", icon:"🔁", label:"Correa serpentina / auxiliar",
    interval:"Inspección en cada servicio · Reemplazo ~80.000–100.000 km",
    tasks:[
      "Inspección visual — grietas, deshilachado, desgaste lateral",
      "Verificación de tensión y deflexión máxima según WIS",
      "Inspección de poleas tensoras y de desvío — juego radial, ruido",
      "Chirrido en frío o en marcha = reemplazar correa y/o tensor",
    ]
  },
  {
    id:"EX_ALN", fuel:"all", icon:"🎯", label:"Alineación y balanceo",
    interval:"Con cada cambio de neumáticos · O si hay desgaste irregular",
    tasks:[
      "Inspección del patrón de desgaste de neumáticos",
      "Balanceo de las 4 ruedas si hay vibración en marcha",
      "Alineación 4 ruedas si hay desvío o desgaste irregular",
      "Verificación de presión y estado del neumático de auxilio",
    ]
  },
  {
    id:"EX_SUS", fuel:"all", icon:"🏎️", label:"Suspensión y amortiguadores",
    interval:"Inspección en cada servicio B · Reemplazo por condición",
    tasks:[
      "Prueba de rebote de amortiguadores (máx. 1 rebote tras soltar)",
      "Inspección de bujes, rótulas y bieletas de suspensión",
      "Inspección de fuelles y mangueras de AIRMATIC si aplica",
      "Verificar compresor AIRMATIC / sistema ABC si tiene",
      "⚠ Ruidos en adoquines o pérdida de altura = inspeccionar AIRMATIC",
    ]
  },
  // ── EXCLUSIVOS gasolina ──
  {
    id:"EX_IGN", fuel:"gasolina", icon:"⚡", label:"Bobinas de encendido — gasolina",
    interval:"Por condición · Inspección si hay falla de cilindro",
    tasks:[
      "Escaneo de códigos de misfire por cilindro (P030X)",
      "Prueba de resistencia de bobinas con multímetro",
      "Intercambio de bobinas entre cilindros para confirmar falla",
      "Reemplazar bobina defectuosa + bujía del mismo cilindro",
    ]
  },
  {
    id:"EX_INJ_N", fuel:"gasolina", icon:"💉", label:"Inyectores de gasolina",
    interval:"Inspección / limpieza ~80.000–100.000 km",
    tasks:[
      "Prueba de caudal de inyectores con Star Diagnosis",
      "Limpieza si hay consumo elevado o marcha irregular",
      "Inspección de presión de riel de combustible",
      "Verificación de sellos O-ring de inyectores",
    ]
  },
  // ── EXCLUSIVOS DIESEL ──
  {
    id:"EX_EGR", fuel:"diesel", icon:"♻️", label:"Válvula EGR — Diesel",
    interval:"Limpieza / inspección ~80.000–120.000 km",
    tasks:[
      "Inspección de la válvula EGR con Star Diagnosis (apertura y cierre)",
      "Limpieza del conducto de admisión y válvula si hay depósitos",
      "Inspección del enfriador de EGR — fugas de refrigerante hacia admisión",
      "⚠ Marcha irregular, humo excesivo o pérdida de potencia = síntomas de EGR",
    ]
  },
  {
    id:"EX_DPF", fuel:"diesel", icon:"🌫️", label:"Filtro de partículas DPF / FAP — Diesel",
    interval:"Verificar estado ~60.000–80.000 km",
    tasks:[
      "Verificar contrapresión del DPF con Star Diagnosis",
      "Revisar historial de regeneraciones — frecuencia y duración",
      "Si saturado: intentar regeneración forzada con Star Diagnosis",
      "Si falla la regeneración: limpieza química o reemplazo del DPF",
      "⚠ Aceite incorrecto (no Low-SAPS ACEA C2/C3) satura el DPF",
    ]
  },
  {
    id:"EX_ADR", fuel:"diesel", icon:"🟦", label:"Sistema AdBlue / SCR — Diesel",
    interval:"Nivel: recargar anualmente · Mecánico: inspección ~60.000 km",
    tasks:[
      "Verificar nivel de AdBlue — recargar si queda menos del 20%",
      "Inspección de la bomba de dosificación de AdBlue",
      "Inspección del inyector de AdBlue en el tubo de escape",
      "Inspección del sensor de calidad y nivel de AdBlue",
      "Prueba del sistema NOx con Star Diagnosis",
      "⚠ Usar solo AdBlue certificado ISO 22241",
    ]
  },
  {
    id:"EX_INJ_D", fuel:"diesel", icon:"💉", label:"Inyectores CDI — Diesel",
    interval:"Inspección / limpieza ~100.000 km",
    tasks:[
      "Prueba de caudal con Star Diagnosis (valores IMA por cilindro)",
      "Verificar retorno de combustible — exceso indica desgaste",
      "Limpieza ultrasónica si corrección supera ±3 mg",
      "Inspección de arandelas de cobre al retirar inyectores",
      "⚠ Vibración en marcha mínima o misfire específico = señal de falla",
    ]
  },
];

// ─── MODELOS + MOTORES + ACEITE ──────────────────────────────────────────
// fuel: "gasolina" | "diesel" | "electrico"
// oil: litros con filtro
// spec: especificación MB recomendada
const MODEL_DATA = {
  // ── SEDANES / HATCHBACKS ──────────────────────────────────────────────
  "A-Class Hatchback / Sedan (W177)": [
    { name:"A 180 / A 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"A 220 / A 250 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"A 180d / A 200d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"A 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"A 45 / A 45S AMG 4MATIC (M139 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "B-Class (W247)": [
    { name:"B 180 / B 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"B 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"B 180d / B 200d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"B 250e (híbrido enchufable)", fuel:"gasolina", oil:5.1, spec:"MB 229.52" },
  ],
  "C-Class Sedan / Estate (W205 / S205)": [
    { name:"C 180 / C 200 (M274 2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5 / 229.52" },
    { name:"C 300 / C 350e (M274 2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5 / 229.52" },
    { name:"C 220d / C 250d (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"C 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"C 43 AMG (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"C 63 / C 63S AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.5 / 229.52" },
  ],
  "C-Class Sedan / Estate (W206 / S206)": [
    { name:"C 200 / C 300 (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"C 220d / C 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"C 300e / C 300de (híbrido enchufable)", fuel:"gasolina", oil:6.0, spec:"MB 229.52" },
    { name:"C 43 AMG 4MATIC (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"C 63 AMG E Performance (M139 2.0T PHEV)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "CLA Coupé / Shooting Brake (C117 / X117)": [
    { name:"CLA 180 / CLA 200 (M270 1.6T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5 / 229.52" },
    { name:"CLA 250 (M270 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5 / 229.52" },
    { name:"CLA 200d / CLA 220d (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"CLA 45 / CLA 45S AMG (M133 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5" },
  ],
  "CLA Coupé / Shooting Brake (C118 / X118)": [
    { name:"CLA 180 / CLA 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"CLA 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"CLA 200d / CLA 220d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"CLA 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
    { name:"CLA 45 / CLA 45S AMG 4MATIC (M139 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "CLE Coupé / Cabriolet (C236 / A236)": [
    { name:"CLE 200 / CLE 300 (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"CLE 220d / CLE 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"CLE 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
  ],
  "E-Class Sedan / Estate (W213 / S213)": [
    { name:"E 200 / E 300 (M274 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.5 / 229.52" },
    { name:"E 200d / E 220d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"E 300d / E 350d (OM654 2.0D / OM656 3.0D)", fuel:"diesel", oil:6.5, spec:"MB 229.52" },
    { name:"E 400d 4MATIC (OM656 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.52" },
    { name:"E 300e / E 300de (híbrido enchufable)", fuel:"gasolina", oil:6.5, spec:"MB 229.52" },
    { name:"E 43 AMG (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"E 63 / E 63S AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.5 / 229.52" },
  ],
  "E-Class Sedan / Estate (W214 / S214)": [
    { name:"E 200 / E 300 (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"E 220d / E 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"E 300e / E 300de (híbrido enchufable)", fuel:"gasolina", oil:6.0, spec:"MB 229.52" },
    { name:"E 450 4MATIC (M256 3.0T)", fuel:"gasolina", oil:9.9, spec:"MB 229.52" },
    { name:"E 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"E 63 / E 63S AMG S (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "E-Class Coupé / Cabriolet (C238 / A238)": [
    { name:"E 200 / E 300 (M274 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.5 / 229.52" },
    { name:"E 220d / E 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"E 400 (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"E 63 / E 63S AMG S (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "S-Class (W222)": [
    { name:"S 300d / S 350d (OM642 3.0D V6)", fuel:"diesel", oil:8.5, spec:"MB 229.51 / 229.52" },
    { name:"S 400d (OM656 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.52" },
    { name:"S 400 / S 450 (M276 3.0 V6T)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"S 500 / S 560 (M176 / M177 4.0 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5 / 229.52" },
    { name:"S 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 65 AMG (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "S-Class (W223)": [
    { name:"S 350d / S 400d (OM656 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.52 / 229.61" },
    { name:"S 450 / S 500 4MATIC (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"S 580 4MATIC (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"S 63 AMG E Performance (M177 PHEV)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"S 680 Maybach (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  // ── SUVs / CROSSOVERS ─────────────────────────────────────────────────
  "GLA (X156)": [
    { name:"GLA 200 / GLA 250 (M270 1.6-2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5 / 229.52" },
    { name:"GLA 200d / GLA 220d (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"GLA 45 / GLA 45S AMG (M133 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5" },
  ],
  "GLA (X247)": [
    { name:"GLA 180 / GLA 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"GLA 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"GLA 200d / GLA 220d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"GLA 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
    { name:"GLA 45 / GLA 45S AMG (M139 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "GLB (X247)": [
    { name:"GLB 180 / GLB 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"GLB 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"GLB 200d / GLB 220d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"GLB 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
  ],
  "GLC / GLC Coupé (X253 / C253)": [
    { name:"GLC 200 / GLC 300 (M274 2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5 / 229.52" },
    { name:"GLC 220d / GLC 250d (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"GLC 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"GLC 350e (M274 híbrido)", fuel:"gasolina", oil:7.0, spec:"MB 229.52" },
    { name:"GLC 43 AMG (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GLC 63 / GLC 63S AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "GLC / GLC Coupé (X254 / C254)": [
    { name:"GLC 200 / GLC 300 4MATIC (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"GLC 220d / GLC 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"GLC 300e / GLC 300de (híbrido)", fuel:"gasolina", oil:6.0, spec:"MB 229.52" },
    { name:"GLC 43 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"GLC 63 AMG E Performance (M139 PHEV)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "GLE / GLE Coupé (W166 / C166)": [
    { name:"GLE 250d / GLE 350d (OM651/OM642)", fuel:"diesel", oil:6.5, spec:"MB 229.51 / 229.52" },
    { name:"GLE 400 / GLE 500 (M276 / M278 V6-V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"GLE 43 AMG (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GLE 63 / GLE 63S AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GLE / GLE Coupé (W167 / C167)": [
    { name:"GLE 300d / GLE 350d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"GLE 350 / GLE 450 4MATIC (M254 / M256)", fuel:"gasolina", oil:6.0, spec:"MB 229.52" },
    { name:"GLE 400d 4MATIC (OM656 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.52" },
    { name:"GLE 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.0, spec:"MB 229.52" },
    { name:"GLE 580 4MATIC (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"GLE 63 / GLE 63S AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  "GLS (X166)": [
    { name:"GLS 350d (OM642 3.0D)", fuel:"diesel", oil:8.5, spec:"MB 229.51 / 229.52" },
    { name:"GLS 400 / GLS 500 (M276 / M278)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"GLS 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GLS (X167)": [
    { name:"GLS 350d / GLS 400d (OM656 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.52" },
    { name:"GLS 450 4MATIC (M256 3.0T)", fuel:"gasolina", oil:8.0, spec:"MB 229.52" },
    { name:"GLS 580 4MATIC (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"GLS 600 Maybach (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"GLS 63 AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  "G-Class (W463)": [
    { name:"G 350d (OM642 3.0D V6)", fuel:"diesel", oil:9.0, spec:"MB 229.51 / 229.52" },
    { name:"G 500 (M273 5.0 V8)", fuel:"gasolina", oil:9.0, spec:"MB 229.3 / 229.5" },
    { name:"G 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"G 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"G 65 AMG (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "G-Class (W464)": [
    { name:"G 400d (OM656 3.0D)", fuel:"diesel", oil:9.0, spec:"MB 229.52" },
    { name:"G 500 (M176 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"G 63 AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  // ── AMG / DEPORTIVOS ──────────────────────────────────────────────────
  "AMG GT Coupé / Roadster (C190 / R190)": [
    { name:"AMG GT / GTS (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.5 / 229.52" },
    { name:"AMG GT R / GT R Pro (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"AMG GT C (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG GT Coupé (C192)": [
    { name:"AMG GT 43 / GT 53 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"AMG GT 63 / GT 63S 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"AMG GT 63 SE Performance (M177 PHEV)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG GT 4-Door Coupé (X290)": [
    { name:"AMG GT 43 / GT 53 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"AMG GT 63 / GT 63S 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG SL (R232)": [
    { name:"SL 43 AMG (M139 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.52" },
    { name:"SL 55 AMG 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"SL 63 AMG 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  "AMG ONE (C298)": [
    { name:"AMG ONE (1.6 F1 híbrido)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
  ],
  // ── ELÉCTRICOS (EQ) ──────────────────────────────────────────────────
  "EQA (H243)": [
    { name:"EQA 250 / EQA 300 4MATIC (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQB (X243)": [
    { name:"EQB 250 / EQB 300 4MATIC (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQC (N293)": [
    { name:"EQC 400 4MATIC (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQE Sedan (V295)": [
    { name:"EQE 300 / EQE 350 / EQE 500 (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQE 43 / AMG EQE 53 (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQE SUV (X294)": [
    { name:"EQE 300 / EQE 350 / EQE 500 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQE 43 / AMG EQE 53 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQS Sedan (V297)": [
    { name:"EQS 450 / EQS 580 4MATIC (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQS 53 4MATIC+ (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQS SUV (X296)": [
    { name:"EQS 450 / EQS 580 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQS 53 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"Maybach EQS 680 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "EQT / Citan (W420)": [
    { name:"EQT (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"Citan 110 / 112 (OM622 1.5D)", fuel:"diesel", oil:5.0, spec:"MB 229.52" },
    { name:"Citan 108 / 110 (M282 1.0T gasolina)", fuel:"gasolina", oil:4.5, spec:"MB 229.52" },
  ],
  "EQV / V-Class / Vito (W447)": [
    { name:"EQV 300 (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"V 220d / V 250d / Vito 114-116 (OM651 2.1D)", fuel:"diesel", oil:7.0, spec:"MB 229.51 / 229.52" },
    { name:"V 300d / Vito 119 CDI (OM654 2.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.52" },
    { name:"Vito 114 / 116 gasolina (M274 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.52" },
  ],
  // ── MAYBACH ───────────────────────────────────────────────────────────
  "Mercedes-Maybach S-Class (W222)": [
    { name:"Maybach S 500 (M176 4.0 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5 / 229.52" },
    { name:"Maybach S 600 (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"Maybach S 650 (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "Mercedes-Maybach S-Class (W223)": [
    { name:"Maybach S 450 / S 500 (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"Maybach S 580 (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"Maybach S 680 (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "Mercedes-Maybach GLS (X167)": [
    { name:"Maybach GLS 600 (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  "Mercedes-Maybach EQS SUV (X296)": [
    { name:"Maybach EQS 680 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  // ── CLÁSICOS 1990–2008 ────────────────────────────────────────────────
  "E-Class (W124) 1990–1996": [
    { name:"E 200 / E 220 (M111 2.0-2.2)", fuel:"gasolina", oil:6.0, spec:"MB 229.1 / 229.3" },
    { name:"E 280 / E 320 (M104 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"E 420 (M119 4.2 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.1 / 229.3" },
    { name:"E 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.1 / 229.3" },
    { name:"E 300 Diesel (OM606 3.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.1" },
    { name:"E 300 Turbodiesel (OM606 3.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.1" },
    { name:"E 60 AMG (M119 6.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1" },
  ],
  "S-Class (W140) 1991–1998": [
    { name:"S 280 / S 320 (M104 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"S 350 Turbodiesel (OM603 3.5D)", fuel:"diesel", oil:8.0, spec:"MB 229.1" },
    { name:"S 420 (M119 4.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"S 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"S 600 (M120 6.0 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1 / 229.3" },
    { name:"S 60 / S 70 AMG (M120)", fuel:"gasolina", oil:10.5, spec:"MB 229.1" },
  ],
  "C-Class (W202) 1993–2000": [
    { name:"C 180 / C 200 (M111 1.8-2.0)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"C 220 (M111 2.2)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"C 280 (M104 2.8)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"C 220 CDI (OM604)", fuel:"diesel", oil:6.0, spec:"MB 229.1" },
    { name:"C 250 TD / C 250 Turbodiesel (OM605)", fuel:"diesel", oil:6.5, spec:"MB 229.1" },
    { name:"C 36 AMG (M104 3.6)", fuel:"gasolina", oil:7.5, spec:"MB 229.1" },
    { name:"C 43 AMG (M113 4.3 V8)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
  ],
  "SL-Class (R129) 1990–2001": [
    { name:"SL 280 / SL 320 (M104 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 600 (M120 6.0 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 60 AMG (M119 6.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1" },
    { name:"SL 73 AMG (M297 7.3 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1" },
  ],
  "SLK-Class (R170) 1996–2003": [
    { name:"SLK 200 (M111 2.0)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 200 Kompressor (M111 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 230 Kompressor (M111 2.3T)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"SLK 32 AMG (M112 supercharged)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
  ],
  "CLK-Class (C208) 1997–2003": [
    { name:"CLK 200 / CLK 230 Kompressor (M111)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"CLK 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"CLK 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
    { name:"CLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
  ],
  "CL-Class (C215) 1998–2006": [
    { name:"CL 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"CL 600 (M137 5.8 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.3 / 229.5" },
    { name:"CL 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"CL 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "A-Class (W168) 1997–2004": [
    { name:"A 140 / A 160 (M166 1.4-1.6)", fuel:"gasolina", oil:4.5, spec:"MB 229.1 / 229.3" },
    { name:"A 190 (M166 1.9)", fuel:"gasolina", oil:4.5, spec:"MB 229.1 / 229.3" },
    { name:"A 160 CDI / A 170 CDI (OM668)", fuel:"diesel", oil:4.5, spec:"MB 229.1" },
    { name:"A 210 AMG (M166 2.1)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
  ],
  "M-Class (W163) 1997–2004": [
    { name:"ML 230 (M111 2.3)", fuel:"gasolina", oil:5.5, spec:"MB 229.3" },
    { name:"ML 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"ML 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"ML 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"ML 270 CDI (OM612 2.7D)", fuel:"diesel", oil:6.5, spec:"MB 229.3" },
    { name:"ML 400 CDI (OM628 4.0D V8)", fuel:"diesel", oil:8.5, spec:"MB 229.3" },
    { name:"ML 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
  ],
  "S-Class (W220) 1998–2005": [
    { name:"S 280 / S 320 (M112 2.8-3.2 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.3 / 229.5" },
    { name:"S 320 CDI (OM613 3.2D)", fuel:"diesel", oil:8.5, spec:"MB 229.3" },
    { name:"S 400 CDI (OM628 4.0D V8)", fuel:"diesel", oil:9.5, spec:"MB 229.3" },
    { name:"S 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"S 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"S 600 (M137 5.8 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.3 / 229.5" },
    { name:"S 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "E-Class (W210) 1995–2002": [
    { name:"E 200 / E 220 (M111 2.0-2.2)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"E 280 / E 320 (M104/M112 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"E 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
    { name:"E 200 CDI / E 220 CDI (OM611 2.0-2.2D)", fuel:"diesel", oil:6.0, spec:"MB 229.1 / 229.3" },
    { name:"E 270 CDI / E 300 D (OM612/OM606)", fuel:"diesel", oil:6.5, spec:"MB 229.1 / 229.3" },
    { name:"E 55 AMG (M113 5.4 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.3 / 229.5" },
  ],
  "C-Class (W203) 2001–2007": [
    { name:"C 180 / C 200 Kompressor (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"C 230 / C 280 / C 350 (M272 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"C 220 CDI / C 270 CDI (OM611/OM612)", fuel:"diesel", oil:6.0, spec:"MB 229.3" },
    { name:"C 30 CDI AMG (OM612 turbo)", fuel:"diesel", oil:6.5, spec:"MB 229.3" },
    { name:"C 32 AMG (M112 supercharged)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"C 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "SL-Class (R230) 2001–2011": [
    { name:"SL 350 (M112/M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"SL 500 / SL 550 (M113/M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"SL 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"SL 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"SL 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "CLK-Class (C209) 2002–2009": [
    { name:"CLK 200 / CLK 240 (M271/M112)", fuel:"gasolina", oil:6.0, spec:"MB 229.3 / 229.5" },
    { name:"CLK 280 / CLK 320 (M272/M112 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLK 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLK 500 (M273 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLK 220 CDI / CLK 270 CDI (OM646/OM612)", fuel:"diesel", oil:6.0, spec:"MB 229.3" },
    { name:"CLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLK 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "CLS-Class (C219) 2004–2010": [
    { name:"CLS 300 / CLS 350 (M272 3.0-3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLS 500 / CLS 550 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 320 CDI / CLS 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"CLS 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "SLK-Class (R171) 2004–2010": [
    { name:"SLK 200 / SLK 280 Kompressor (M271)", fuel:"gasolina", oil:6.5, spec:"MB 229.3 / 229.5" },
    { name:"SLK 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"SLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "M-Class (W164) 2005–2011": [
    { name:"ML 280 CDI / ML 320 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"ML 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"ML 500 / ML 550 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"ML 420 CDI (OM629 4.0D V8)", fuel:"diesel", oil:9.0, spec:"MB 229.51" },
    { name:"ML 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GL-Class (X164) 2006–2012": [
    { name:"GL 320 CDI / GL 350 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"GL 450 / GL 500 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"GL 420 CDI (OM629 4.0D V8)", fuel:"diesel", oil:9.0, spec:"MB 229.51" },
    { name:"GL 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "R-Class (W251) 2005–2012": [
    { name:"R 280 / R 300 / R 350 (M272 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"R 280 CDI / R 320 CDI / R 350 CDI (OM642)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"R 500 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"R 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "B-Class (W245) 2005–2011": [
    { name:"B 150 / B 170 (M266 1.5-1.7)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"B 200 / B 200 Turbo (M266 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.3" },
    { name:"B 180 CDI / B 200 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
  ],
  "Vito (W638) 1996–2003": [
    { name:"Vito 108/110/112 D (OM601/OM611)", fuel:"diesel", oil:6.0, spec:"MB 229.1" },
    { name:"Vito 110/112 CDI (OM611 2.2D)", fuel:"diesel", oil:6.0, spec:"MB 229.1 / 229.3" },
    { name:"Vito 114/116 gasolina (M111 2.3)", fuel:"gasolina", oil:5.5, spec:"MB 229.1" },
  ],
  // ── 2008–2015 ─────────────────────────────────────────────────────────
  "C-Class Sedan / Estate (W204 / S204) 2007–2014": [
    { name:"C 180 / C 200 CGI Kompressor (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"C 230 / C 280 / C 300 (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"C 350 (M272 3.5 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"C 220 CDI / C 250 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"C 300 CDI / C 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"C 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
  ],
  "E-Class Sedan / Estate (W212 / S212) 2009–2016": [
    { name:"E 200 / E 250 CGI (M271/M274 1.8-2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"E 300 / E 350 (M276 3.0-3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 400 / E 500 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"E 200 CDI / E 220 CDI / E 250 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"E 300 CDI / E 350 CDI / E 350 BlueTEC (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"E 63 AMG / E 63S AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "E-Class Coupé / Cabriolet (C207 / A207) 2009–2016": [
    { name:"E 200 / E 250 CGI (M271/M274)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"E 300 / E 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 500 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"E 220 CDI / E 350 CDI (OM651/OM642)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"E 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "S-Class (W221) 2005–2013": [
    { name:"S 280 / S 300 / S 350 (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"S 320 CDI / S 350 CDI (OM642 3.0D)", fuel:"diesel", oil:8.5, spec:"MB 229.51" },
    { name:"S 400 / S 450 / S 500 (M273/M278 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"S 63 AMG (M156/M157)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 65 AMG (M275/M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "SL-Class (R231) 2012–2021": [
    { name:"SL 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5 / 229.52" },
    { name:"SL 400 / SL 450 (M276/M276 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.52" },
    { name:"SL 500 / SL 550 (M278 4.7 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5 / 229.52" },
    { name:"SL 600 (M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"SL 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"SL 65 AMG (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "SLC-Class (R172) 2011–2020": [
    { name:"SLK/SLC 200 (M271/M274 1.8-2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"SLK/SLC 250 (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"SLK/SLC 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"SLK/SLC 55 AMG (M152 5.5 V8)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
  ],
  "CL-Class (C216) 2006–2014": [
    { name:"CL 500 / CL 550 (M273/M278 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CL 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"CL 63 AMG (M156/M157)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CL 65 AMG (M275/M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "CLS-Class (C218) 2010–2017": [
    { name:"CLS 300 / CLS 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLS 500 / CLS 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 220 CDI / CLS 250 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"CLS 350 CDI / CLS 350 BlueTEC (OM642)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"CLS 63 AMG / CLS 63S AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GLK-Class (X204) 2008–2015": [
    { name:"GLK 200 CDI / GLK 220 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"GLK 250 (M274 2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"GLK 300 / GLK 350 (M272/M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GLK 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
  ],
  "A-Class (W169 / C169) 2004–2012": [
    { name:"A 150 (M266 1.5)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 170 (M266 1.7)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 200 (M266 2.0)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 200 Turbo (M266 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.3 / 229.5" },
    { name:"A 160 CDI / A 180 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
    { name:"A 200 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
  ],
  "A-Class (W176) 2012–2018": [
    { name:"A 160 / A 180 / A 200 (M270 1.6-2.0T)", fuel:"gasolina", oil:5.8, spec:"MB 229.5 / 229.52" },
    { name:"A 180 CDI / A 200 CDI / A 220 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"A 250 (M270 2.0T)", fuel:"gasolina", oil:5.8, spec:"MB 229.52" },
    { name:"A 45 AMG 4MATIC (M133 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "B-Class (W246) 2011–2018": [
    { name:"B 180 / B 200 (M270 1.6-2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5 / 229.52" },
    { name:"B 180 CDI / B 200 CDI / B 220 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"B 250 (M270 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
    { name:"B 250e (híbrido eléctrico)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "M-Class / GLE (W166) 2011–2015": [
    { name:"ML/GLE 250 BlueTEC (OM651 2.1D)", fuel:"diesel", oil:6.5, spec:"MB 229.51" },
    { name:"ML/GLE 350 BlueTEC / 350d (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"ML/GLE 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"ML/GLE 400 / 450 (M276 3.0T / M278 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"ML/GLE 500 / 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"ML/GLE 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GL-Class / GLS (X166) 2012–2015": [
    { name:"GL/GLS 320 CDI / 350d (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"GL/GLS 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GL/GLS 450 / 500 / 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"GL/GLS 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "Vito (W639) 2003–2014": [
    { name:"Vito 109/111/113 CDI (OM646 2.1D)", fuel:"diesel", oil:6.5, spec:"MB 229.3 / 229.51" },
    { name:"Vito 116 CDI (OM642 3.0D V6)", fuel:"diesel", oil:8.5, spec:"MB 229.51" },
    { name:"Vito 114/116 gasolina (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
  ],
  "Sprinter (W906) 1995–2018": [
    { name:"208/211/213/216 CDI (OM651 2.1D)", fuel:"diesel", oil:11.5, spec:"MB 229.51 / 229.52" },
    { name:"309/311/313/316 CDI (OM651 2.1D)", fuel:"diesel", oil:11.5, spec:"MB 229.51 / 229.52" },
    { name:"319/324 CDI (OM642 3.0D V6)", fuel:"diesel", oil:12.5, spec:"MB 229.51 / 229.52" },
  ],
  "Sprinter (W907)": [
    { name:"2.0L OM654 4-cil diesel", fuel:"diesel", oil:10.0, spec:"MB 229.52 / 229.71" },
    { name:"2.1L OM651 4-cil diesel", fuel:"diesel", oil:11.5, spec:"MB 229.51 / 229.52" },
    { name:"3.0L OM642 V6 diesel", fuel:"diesel", oil:12.5, spec:"MB 229.52" },
    { name:"2.0L M274 gasolina", fuel:"gasolina", oil:10.5, spec:"MB 229.52" },
  ],
  "Vito (W639)": [
    { name:"Vito 109/111/113 CDI (OM646 2.1D)", fuel:"diesel", oil:6.5, spec:"MB 229.51" },
    { name:"Vito 116 CDI (OM642 3.0D V6)", fuel:"diesel", oil:8.5, spec:"MB 229.51" },
    { name:"Vito gasolina (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
  ],
};

const MODEL_GROUPS = {
  "Clásicos 1990–2008": [
    "E-Class (W124) 1990–1996",
    "S-Class (W140) 1991–1998",
    "C-Class (W202) 1993–2000",
    "SL-Class (R129) 1990–2001",
    "SLK-Class (R170) 1996–2003",
    "CLK-Class (C208) 1997–2003",
    "CL-Class (C215) 1998–2006",
    "A-Class (W168) 1997–2004",
    "A-Class (W169 / C169) 2004–2012",
    "M-Class (W163) 1997–2004",
    "S-Class (W220) 1998–2005",
    "E-Class (W210) 1995–2002",
    "C-Class (W203) 2001–2007",
    "SL-Class (R230) 2001–2011",
    "CLK-Class (C209) 2002–2009",
    "CLS-Class (C219) 2004–2010",
    "SLK-Class (R171) 2004–2010",
    "M-Class (W164) 2005–2011",
    "GL-Class (X164) 2006–2012",
    "R-Class (W251) 2005–2012",
    "B-Class (W245) 2005–2011",
    "Vito (W638) 1996–2003",
  ],
  "2008–2015": [
    "C-Class Sedan / Estate (W204 / S204) 2007–2014",
    "E-Class Sedan / Estate (W212 / S212) 2009–2016",
    "E-Class Coupé / Cabriolet (C207 / A207) 2009–2016",
    "S-Class (W221) 2005–2013",
    "SL-Class (R231) 2012–2021",
    "SLC-Class (R172) 2011–2020",
    "CL-Class (C216) 2006–2014",
    "CLS-Class (C218) 2010–2017",
    "GLK-Class (X204) 2008–2015",
    "A-Class (W176) 2012–2018",
    "B-Class (W246) 2011–2018",
    "M-Class / GLE (W166) 2011–2015",
    "GL-Class / GLS (X166) 2012–2015",
    "Vito (W639) 2003–2014",
    "Sprinter (W906) 1995–2018",
  ],
  "Sedanes / Hatchbacks": [
    "A-Class Hatchback / Sedan (W177)",
    "B-Class (W247)",
    "C-Class Sedan / Estate (W205 / S205)",
    "C-Class Sedan / Estate (W206 / S206)",
    "CLA Coupé / Shooting Brake (C117 / X117)",
    "CLA Coupé / Shooting Brake (C118 / X118)",
    "CLE Coupé / Cabriolet (C236 / A236)",
    "E-Class Sedan / Estate (W213 / S213)",
    "E-Class Sedan / Estate (W214 / S214)",
    "E-Class Coupé / Cabriolet (C238 / A238)",
    "S-Class (W222)",
    "S-Class (W223)",
  ],
  "SUVs / Crossovers": [
    "GLA (X156)",
    "GLA (X247)",
    "GLB (X247)",
    "GLC / GLC Coupé (X253 / C253)",
    "GLC / GLC Coupé (X254 / C254)",
    "GLE / GLE Coupé (W166 / C166)",
    "GLE / GLE Coupé (W167 / C167)",
    "GLS (X166)",
    "GLS (X167)",
    "G-Class (W463)",
    "G-Class (W464)",
  ],
  "AMG / Deportivos": [
    "AMG GT Coupé / Roadster (C190 / R190)",
    "AMG GT Coupé (C192)",
    "AMG GT 4-Door Coupé (X290)",
    "AMG SL (R232)",
    "AMG ONE (C298)",
  ],
  "Eléctricos (EQ)": [
    "EQA (H243)",
    "EQB (X243)",
    "EQC (N293)",
    "EQE Sedan (V295)",
    "EQE SUV (X294)",
    "EQS Sedan (V297)",
    "EQS SUV (X296)",
    "EQT / Citan (W420)",
    "EQV / V-Class / Vito (W447)",
  ],
  "Maybach": [
    "Mercedes-Maybach S-Class (W222)",
    "Mercedes-Maybach S-Class (W223)",
    "Mercedes-Maybach GLS (X167)",
    "Mercedes-Maybach EQS SUV (X296)",
  ],
  "Vans / Comerciales": [
    "Sprinter (W906)",
    "Sprinter (W907)",
    "Vito (W639)",
    "EQV / V-Class / Vito (W447)",
  ],
};

const QUICK_NOTES = [
  "Sin novedades ✅","Pastillas al límite 🛑","Fugas detectadas 💧",
  "Desgaste irregular de neumáticos ⚠️","Software actualizado 💻",
  "Cliente notificado 📞","Repuesto en pedido 📦",
  "Recomendado próxima visita 📅","Diferencial revisado 🔩",
];

// ─── ALIASES DE BÚSQUEDA ─────────────────────────────────────────────────
// Mapea términos del mundo real → nombre del modelo en MODEL_DATA
// Permite buscar: "c240", "clase s", "gele", "300sel", "190e", etc.
const MODEL_ALIASES = {
  // ── Clase C ──
  "clase c": ["C-Class"],
  "c class": ["C-Class"],
  "c 180": ["W202","W203","W204","W205","W206"],
  "c180": ["W202","W203","W204","W205","W206"],
  "c 200": ["W202","W203","W204","W205","W206"],
  "c200": ["W202","W203","W204","W205","W206"],
  "c 220": ["W202","W203","W204","W205","W206"],
  "c220": ["W202","W203","W204","W205","W206"],
  "c 230": ["W203","W204"],
  "c230": ["W203","W204"],
  "c 240": ["W203"],
  "c240": ["W203"],
  "c 250": ["W204","W205","W206"],
  "c250": ["W204","W205","W206"],
  "c 280": ["W202","W203","W204"],
  "c280": ["W202","W203","W204"],
  "c 300": ["W204","W205","W206"],
  "c300": ["W204","W205","W206"],
  "c 320": ["W203","W204"],
  "c320": ["W203","W204"],
  "c 350": ["W203","W204","W205"],
  "c350": ["W203","W204","W205"],
  "c 36": ["W202"],
  "c36": ["W202"],
  "c 43": ["W202","W205","W206"],
  "c43": ["W202","W205","W206"],
  "c 55": ["W203","W204"],
  "c55": ["W203","W204"],
  "c 63": ["W204","W205","W206"],
  "c63": ["W204","W205","W206"],
  "kompressor": ["W202","W203","W204"],
  // ── Clase E ──
  "clase e": ["E-Class"],
  "e class": ["E-Class"],
  "e 200": ["W124","W210","W211","W212","W213","W214"],
  "e200": ["W124","W210","W211","W212","W213","W214"],
  "e 220": ["W124","W210","W211","W212","W213","W214"],
  "e220": ["W124","W210","W211","W212","W213","W214"],
  "e 230": ["W124","W210"],
  "e230": ["W124","W210"],
  "e 240": ["W210","W211"],
  "e240": ["W210","W211"],
  "e 250": ["W212","W213","W214"],
  "e250": ["W212","W213","W214"],
  "e 270": ["W210","W211"],
  "e270": ["W210","W211"],
  "e 280": ["W124","W210","W211","W212"],
  "e280": ["W124","W210","W211","W212"],
  "e 300": ["W124","W210","W211","W212","W213","W214"],
  "e300": ["W124","W210","W211","W212","W213","W214"],
  "e 320": ["W124","W210","W211","W212"],
  "e320": ["W124","W210","W211","W212"],
  "e 350": ["W211","W212","W213","W214"],
  "e350": ["W211","W212","W213","W214"],
  "e 400": ["W212","W213","W214"],
  "e400": ["W212","W213","W214"],
  "e 420": ["W124","W210"],
  "e420": ["W124","W210"],
  "e 430": ["W210","W211"],
  "e430": ["W210","W211"],
  "e 450": ["W214"],
  "e450": ["W214"],
  "e 500": ["W124","W210","W211","W212"],
  "e500": ["W124","W210","W211","W212"],
  "e 53": ["W213","W214"],
  "e53": ["W213","W214"],
  "e 55": ["W210","W211","W212"],
  "e55": ["W210","W211","W212"],
  "e 63": ["W212","W213","W214"],
  "e63": ["W212","W213","W214"],
  "e63 amg": ["W212","W213","W214"],
  // ── Clase S ──
  "clase s": ["S-Class","W140","W220","W221","W222","W223"],
  "s class": ["S-Class","W140","W220","W221","W222","W223"],
  "s 280": ["W140","W220","W221"],
  "s280": ["W140","W220","W221"],
  "s 300": ["W140","W220","W221","W222","W223"],
  "s300": ["W140","W220","W221","W222","W223"],
  "s 320": ["W140","W220","W221"],
  "s320": ["W140","W220","W221"],
  "s 350": ["W220","W221","W222","W223"],
  "s350": ["W220","W221","W222","W223"],
  "s 400": ["W140","W220","W221","W222","W223"],
  "s400": ["W140","W220","W221","W222","W223"],
  "s 420": ["W140"],
  "s420": ["W140"],
  "s 430": ["W220","W221"],
  "s430": ["W220","W221"],
  "s 450": ["W221","W222","W223"],
  "s450": ["W221","W222","W223"],
  "s 500": ["W140","W220","W221","W222","W223"],
  "s500": ["W140","W220","W221","W222","W223"],
  "s 550": ["W221","W222"],
  "s550": ["W221","W222"],
  "s 580": ["W222","W223"],
  "s580": ["W222","W223"],
  "s 600": ["W140","W220","W221","W222"],
  "s600": ["W140","W220","W221","W222"],
  "s 63": ["W221","W222","W223"],
  "s63": ["W221","W222","W223"],
  "s 65": ["W220","W221","W222","W223"],
  "s65": ["W220","W221","W222","W223"],
  // ── Clase A ──
  "clase a": ["A-Class","W168","W169","W176","W177"],
  "a class": ["A-Class","W168","W169","W176","W177"],
  "a 140": ["W168"],
  "a140": ["W168"],
  "a 150": ["W168","W169"],
  "a150": ["W168","W169"],
  "a 160": ["W168","W169","W176","W177"],
  "a160": ["W168","W169","W176","W177"],
  "a 170": ["W168","W169"],
  "a170": ["W168","W169"],
  "a 180": ["W169","W176","W177"],
  "a180": ["W169","W176","W177"],
  "a 190": ["W168"],
  "a190": ["W168"],
  "a 200": ["W169","W176","W177"],
  "a200": ["W169","W176","W177"],
  "a 220": ["W177"],
  "a220": ["W177"],
  "a 250": ["W176","W177"],
  "a250": ["W176","W177"],
  "a 35": ["W177"],
  "a35": ["W177"],
  "a 45": ["W176","W177"],
  "a45": ["W176","W177"],
  // ── Clase B ──
  "clase b": ["B-Class","W245","W246","W247"],
  "b class": ["B-Class","W245","W246","W247"],
  "b 150": ["W245"],
  "b150": ["W245"],
  "b 170": ["W245"],
  "b170": ["W245"],
  "b 180": ["W246","W247"],
  "b180": ["W246","W247"],
  "b 200": ["W245","W246","W247"],
  "b200": ["W245","W246","W247"],
  "b 220": ["W246","W247"],
  "b220": ["W246","W247"],
  "b 250": ["W246","W247"],
  "b250": ["W246","W247"],
  // ── GLC ──
  "glc 200": ["X253","X254"],
  "glc 220": ["X253","X254"],
  "glc 250": ["X253"],
  "glc 300": ["X253","X254"],
  "glc 350": ["X253","X254"],
  "glc 43": ["X253","X254"],
  "glc 63": ["X253","X254"],
  "glc200": ["X253","X254"],
  "glc300": ["X253","X254"],
  "glc63": ["X253","X254"],
  // ── GLE ──
  "clase gle": ["GLE","W166","W167"],
  "gle 300": ["W167"],
  "gle 350": ["W166","W167"],
  "gle 400": ["W166","W167"],
  "gle 450": ["W167"],
  "gle 500": ["W166"],
  "gle 53": ["W167"],
  "gle 63": ["W166","W167"],
  "gle300": ["W167"],
  "gle350": ["W166","W167"],
  "gle63": ["W166","W167"],
  "ml 250": ["W166"],
  "ml 320": ["W163"],
  "ml 350": ["W163","W164","W166"],
  "ml 430": ["W163"],
  "ml 500": ["W163","W164"],
  "ml 55": ["W163"],
  "ml 63": ["W164","W166"],
  "ml250": ["W166"],
  "ml350": ["W163","W164","W166"],
  "ml63": ["W164","W166"],
  // ── GLA ──
  "gla 180": ["X247"],
  "gla 200": ["X156","X247"],
  "gla 220": ["X156","X247"],
  "gla 250": ["X156","X247"],
  "gla 45": ["X156","X247"],
  "gla180": ["X247"],
  "gla200": ["X156","X247"],
  "gla45": ["X156","X247"],
  // ── GLS / GL ──
  "gl 320": ["X164"],
  "gl 350": ["X164","X166"],
  "gl 450": ["X164","X166"],
  "gl 500": ["X164","X166"],
  "gl 63": ["X164","X166"],
  "gl320": ["X164"],
  "gl500": ["X164","X166"],
  "gls 350": ["X166","X167"],
  "gls 400": ["X166","X167"],
  "gls 450": ["X167"],
  "gls 580": ["X167"],
  "gls 63": ["X166","X167"],
  "gls450": ["X167"],
  // ── G-Class ──
  "g class": ["G-Class","W463","W464"],
  "clase g": ["G-Class","W463","W464"],
  "g wagon": ["G-Class","W463","W464"],
  "gwagon": ["G-Class","W463","W464"],
  "geländewagen": ["G-Class","W463","W464"],
  "g 350": ["W463","W464"],
  "g 400": ["W464"],
  "g 500": ["W463","W464"],
  "g 55": ["W463"],
  "g 63": ["W463","W464"],
  "g 65": ["W463"],
  "g350": ["W463","W464"],
  "g500": ["W463","W464"],
  "g63": ["W463","W464"],
  // ── CLK / CLE ──
  "clk 200": ["C208","C209"],
  "clk 230": ["C208"],
  "clk 240": ["C209"],
  "clk 270": ["C209"],
  "clk 280": ["C209"],
  "clk 320": ["C208","C209"],
  "clk 350": ["C209"],
  "clk 430": ["C208"],
  "clk 500": ["C209"],
  "clk 55": ["C208","C209"],
  "clk 63": ["C209"],
  "clk200": ["C208","C209"],
  "clk320": ["C208","C209"],
  "clk63": ["C209"],
  // ── CLS ──
  "cls 300": ["C218","C219"],
  "cls 350": ["C218","C219"],
  "cls 500": ["C218","C219"],
  "cls 550": ["C218"],
  "cls 55": ["C219"],
  "cls 63": ["C218","C219"],
  "cls300": ["C218","C219"],
  "cls350": ["C218","C219"],
  "cls63": ["C218","C219"],
  // ── SL ──
  "sl 280": ["R129"],
  "sl 320": ["R129","R230"],
  "sl 350": ["R230","R231"],
  "sl 400": ["R231"],
  "sl 500": ["R129","R230","R231"],
  "sl 550": ["R230","R231"],
  "sl 600": ["R129","R230"],
  "sl 55": ["R230"],
  "sl 63": ["R231"],
  "sl 65": ["R230","R231"],
  "sl500": ["R129","R230","R231"],
  "sl63": ["R231"],
  // ── SLK / SLC ──
  "slk 200": ["R170","R171"],
  "slk 230": ["R170"],
  "slk 250": ["R172"],
  "slk 280": ["R171"],
  "slk 320": ["R170"],
  "slk 350": ["R171","R172"],
  "slk 55": ["R171","R172"],
  "slk200": ["R170","R171"],
  "slk350": ["R171","R172"],
  "slk55": ["R171","R172"],
  "slc 200": ["R172"],
  "slc 350": ["R172"],
  "slc 55": ["R172"],
  // ── CL ──
  "cl 500": ["C215","C216"],
  "cl 600": ["C215","C216"],
  "cl 55": ["C215"],
  "cl 63": ["C216"],
  "cl 65": ["C215","C216"],
  "cl500": ["C215","C216"],
  "cl63": ["C216"],
  // ── Sprinter / Vito ──
  "sprinter 208": ["W906"],
  "sprinter 211": ["W906","W907"],
  "sprinter 313": ["W906","W907"],
  "sprinter 316": ["W906","W907"],
  "sprinter 319": ["W906","W907"],
  "sprinter 515": ["W906","W907"],
  "sprinter gasolina": ["W907"],
  "vito 109": ["W638","W639"],
  "vito 111": ["W638","W639"],
  "vito 113": ["W638","W639"],
  "vito 116": ["W639","W447"],
  "vito 119": ["W447"],
  // ── AMG ──
  "amg gt": ["C190","C192","X290"],
  "amg sl": ["R232"],
  "amg one": ["C298"],
  // ── Eléctricos ──
  "eqa": ["H243"],
  "eqb": ["X243"],
  "eqc": ["N293"],
  "eqe": ["V295","X294"],
  "eqs": ["V297","X296"],
  "electrico": ["H243","X243","N293","V295","X294","V297","X296"],
  "eléctrico": ["H243","X243","N293","V295","X294","V297","X296"],
  // ── Maybach ──
  "maybach": ["Maybach"],
  "s 680": ["W223"],
  "s680": ["W223"],
};

// Función de búsqueda inteligente
function smartSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null; // null = mostrar todos

  // 1. Buscar alias exacto
  const aliasKeys = Object.keys(MODEL_ALIASES).filter(k => {
    if (q === k) return true;                          // coincidencia exacta siempre
    if (k.startsWith(q) && q.length >= 2) return true; // alias empieza con la búsqueda (mín 2 chars)
    if (q.startsWith(k) && k.length >= 3) return true; // búsqueda empieza con alias (mín 3 chars — evita "c" matcheando "c230")
    return false;
  });
  const chassisTags = new Set(aliasKeys.flatMap(k => MODEL_ALIASES[k]));

  // 2. Construir lista de modelos que coinciden
  const results = [];
  Object.entries(MODEL_GROUPS).forEach(([grp, models]) => {
    models.forEach(m => {
      const mLow = m.toLowerCase();
      // Coincidencia directa en el nombre
      const directMatch = mLow.includes(q);
      // Coincidencia por chassis tag
      const chassisMatch = [...chassisTags].some(tag => m.includes(tag));
      if (directMatch || chassisMatch) {
        results.push({ m, grp });
      }
    });
  });

  // 3. Si encontramos algo con alias, ordenar: chassis matches primero
  if (chassisTags.size > 0 && results.length > 0) {
    results.sort((a, b) => {
      const aHas = [...chassisTags].some(t => a.m.includes(t)) ? 0 : 1;
      const bHas = [...chassisTags].some(t => b.m.includes(t)) ? 0 : 1;
      return aHas - bHas;
    });
  }

  return results;
}
// ─── BUILD FUNCTIONS ──────────────────────────────────────────────────────
function buildTasks(code, fuel, is4m) {
  const def = CODES[code];
  const fuelItem = fuel === "diesel" ? "11" : "12";
  const result = [];
  def.items.forEach(id => {
    const resolved = id === "FUEL" ? fuelItem : id;
    const block = ITEMS[resolved];
    if (block) block.tasks.forEach((text, i) =>
      result.push({ id:`${resolved}_${i}`, grp:block.label, icon:block.icon, text, outOfAssyst:!!block.outOfAssyst })
    );
  });
  // Bujías de precalentamiento — SOLO diesel
  if (fuel === "diesel") {
    const glow = ITEMS["GLOW"];
    glow.tasks.forEach((text, i) =>
      result.push({ id:`GLOW_${i}`, grp:glow.label, icon:glow.icon, text, outOfAssyst:true })
    );
  }
  // 4MATIC — diferencial
  if (is4m) {
    ["4M_DIFF","4M_FDIFF"].forEach(key => {
      const block = ITEMS[key];
      block.tasks.forEach((text, i) =>
        result.push({ id:`${key}_${i}`, grp:block.label, icon:block.icon, text, outOfAssyst:true })
      );
    });
  }
  return result;
}

function getExtras(fuel) {
  return EXTRAS.filter(e => e.fuel === "all" || e.fuel === fuel);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────
const bg = "#09090e", card = "#0f0f17", line = "#1c1c2a";
const CORRECT_PIN = "1252";

function PinScreen({ onUnlock }) {
  const [pin, setPin]     = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) {
          onUnlock();
        } else {
          setShake(true);
          setError(true);
          setTimeout(() => { setPin(""); setShake(false); }, 600);
        }
      }, 150);
    }
  };

  const handleDelete = () => { setPin(p => p.slice(0,-1)); setError(false); };

  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:24 }}>
      {/* Logo */}
      <div style={{ width:64, height:64, borderRadius:"50%", border:"2px solid #C8A96E", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:"#C8A96E", marginBottom:16 }}>★</div>
      <div style={{ fontSize:15, fontWeight:"bold", letterSpacing:3, color:"#e0d8cc", marginBottom:4 }}>MERCEDES-BENZ</div>
      <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:40 }}>SISTEMA DE MANTENIMIENTO</div>

      {/* Dots */}
      <div style={{ display:"flex", gap:16, marginBottom:40, animation: shake ? "shake 0.4s ease" : "none" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:16, height:16, borderRadius:"50%",
            background: error ? "#ef4444" : pin.length > i ? "#C8A96E" : "transparent",
            border: `2px solid ${error ? "#ef4444" : pin.length > i ? "#C8A96E" : "#2a2a3a"}`,
            transition:"all 0.15s"
          }} />
        ))}
      </div>

      {error && <div style={{ fontSize:11, color:"#ef4444", marginBottom:20, letterSpacing:1 }}>PIN incorrecto</div>}

      {/* Keypad */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 72px)", gap:12 }}>
        {digits.map((d, i) => (
          <button key={i} onClick={() => d === "⌫" ? handleDelete() : d !== "" ? handleDigit(d) : null}
            style={{
              width:72, height:72, borderRadius:12,
              border: d === "" ? "none" : `1px solid ${d==="⌫"?"#2a2a3a":"#2a2a3a"}`,
              background: d === "" ? "transparent" : d==="⌫" ? "#111118" : "#111118",
              color: d==="⌫" ? "#555" : "#e0d8cc",
              fontSize: d==="⌫" ? 20 : 24,
              fontFamily:"monospace",
              cursor: d==="" ? "default" : "pointer",
              fontWeight:"500",
              opacity: d==="" ? 0 : 1,
            }}>
            {d}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;

  return <MainApp />;
}

function MainApp() {
  const [sel, setSel]       = useState("A");
  const [fuel, setFuel]     = useState("gasolina");
  const [is4m, setIs4m]     = useState(false);
  const [model, setModel]   = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [modelOpen, setModelOpen]     = useState(false);
  const [engine, setEngine] = useState("");
  const [plate, setPlate]   = useState("");
  const [km, setKm]         = useState("");
  const [checked, setChk]   = useState({});
  const [taskStatus, setTaskStatus] = useState({}); // id -> "ok" | "issue"
  const [taskIssue, setTaskIssue]   = useState({}); // id -> texto del detalle
  const [activeIssue, setActiveIssue] = useState(null); // id del ítem abierto
  const [exChk, setExChk]   = useState({});
  const [notes, setNotes]   = useState("");
  const [tab, setTab]       = useState("check");
  const [showEx, setShowEx] = useState(false);
  const [mechName, setMechName] = useState("");
  const [hasSig, setHasSig]     = useState(false);
  const [sigDate, setSigDate]   = useState("");
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x:0, y:0 });

  const svc          = CODES[sel];
  const G            = svc.color;
  const fuelLock     = svc.fuelLock || null;
  const fuelMismatch = fuelLock && fuelLock !== fuel;

  // Motor seleccionado y capacidad de aceite
  const availableEngines = model && MODEL_DATA[model] ? MODEL_DATA[model] : [];
  const engineInfo = availableEngines.find(e => e.name === engine) || null;
  const oilLiters = engineInfo ? engineInfo.oil : null;
  const oilSpec   = engineInfo ? engineInfo.spec : null;
  const isEV      = engineInfo ? engineInfo.fuel === "electrico" : false;

  // Auto-set fuel when engine selected
  const handleEngineChange = (e) => {
    const eng = availableEngines.find(x => x.name === e.target.value);
    setEngine(e.target.value);
    if (eng && eng.fuel !== "electrico") setFuel(eng.fuel);
  };
  const handleModelChange = (e) => {
    setModel(e.target.value);
    setModelSearch(e.target.value);
    setEngine("");
  };
  const tasks        = buildTasks(sel, fuel, is4m);
  const extras       = getExtras(fuel);

  const doneN  = tasks.filter(t => checked[t.id] || taskStatus[t.id]).length;
  const total  = tasks.length;
  const pct    = total ? Math.round(doneN / total * 100) : 0;
  const isComplete = pct === 100;
  const exDoneN = extras.reduce((n,e) => n + e.tasks.filter((_,i) => exChk[`${e.id}_${i}`]).length, 0);
  const exTotal = extras.reduce((n,e) => n + e.tasks.length, 0);

  const toggle   = id  => setChk(p => ({ ...p, [id]: !p[id] }));
  const toggleEx = id  => setExChk(p => ({ ...p, [id]: !p[id] }));
  const markAll  = ()  => { const u={}; tasks.forEach(t => u[t.id]=true); setChk(p=>({...p,...u})); };
  const resetAll = ()  => {
    const u={}; tasks.forEach(t => u[t.id]=false); setChk(p=>({...p,...u}));
    setTaskStatus({}); setTaskIssue({}); setActiveIssue(null);
  };
  const addNote  = q   => setNotes(n => n ? n+"\n• "+q : "• "+q);

  const setStatus = (id, status, text, taskText) => {
    setTaskStatus(p => ({ ...p, [id]: status }));
    setChk(p => ({ ...p, [id]: true }));
    if (status === "ok") {
      setActiveIssue(null);
      // Remove previous issue note if exists
      if (taskIssue[id]) {
        setTaskIssue(p => { const n={...p}; delete n[id]; return n; });
      }
    }
    if (status === "issue") {
      setActiveIssue(id);
    }
  };

  const confirmIssue = (id, taskText) => {
    const txt = taskIssue[id] || "";
    if (txt.trim()) {
      const line = `⚠️ ${taskText}: ${txt.trim()}`;
      setNotes(n => n ? n + "\n• " + line : "• " + line);
    }
    setActiveIssue(null);
  };

  // ── Firma helpers ──
  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };
  const startDraw = e => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  };
  const draw = e => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#C8A96E";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };
  const stopDraw = () => { drawing.current = false; };
  const clearSig = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };
  // ── TRELLO ──────────────────────────────────────────────────────────────
  const TRELLO_KEY   = import.meta.env.VITE_TRELLO_KEY;
  const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN;
  const TRELLO_BOARD = import.meta.env.VITE_TRELLO_BOARD;

  const [trelloStatus, setTrelloStatus] = useState("idle"); // idle | sending | done | error
  const [trelloUrl, setTrelloUrl]       = useState("");

  // Genera el resumen HTML para la tarjeta de Trello
  const buildTrelloDesc = () => {
    const issues = Object.entries(taskIssue).filter(([,v])=>v);
    const issueLines = issues.map(([,v]) => `⚠️ ${v}`).join("\n");

    // Tareas completadas con OK
    const okTasks = tasks.filter(t => taskStatus[t.id]==="ok").map(t => `✅ ${t.text}`);
    // Tareas con detalle
    const issueTasks = tasks.filter(t => taskStatus[t.id]==="issue").map(t => {
      const detail = taskIssue[t.id] ? ` → ${taskIssue[t.id]}` : "";
      return `⚠️ ${t.text}${detail}`;
    });
    // Tareas sin estado (pendientes)
    const pendingTasks = tasks.filter(t => !taskStatus[t.id] && !checked[t.id]).map(t => `○ ${t.text}`);

    // Agrupar por categoría
    const byGrpMap = {};
    tasks.forEach(t => {
      if (!byGrpMap[t.grp]) byGrpMap[t.grp] = [];
      byGrpMap[t.grp].push(t);
    });

    let taskSection = "";
    Object.entries(byGrpMap).forEach(([grp, ts]) => {
      taskSection += `\n**${grp}**\n`;
      ts.forEach(t => {
        const s = taskStatus[t.id];
        const detail = taskIssue[t.id] ? ` → _${taskIssue[t.id]}_` : "";
        const icon = s==="ok" ? "✅" : s==="issue" ? "⚠️" : checked[t.id] ? "✅" : "○";
        taskSection += `${icon} ${t.text}${detail}\n`;
      });
    });

    return `## 🚗 Resumen de Servicio — ${model || "Vehículo"}

---

### 📋 Datos del Vehículo
| Campo | Detalle |
|-------|---------|
| **Modelo** | ${model || "—"} |
| **Motor** | ${engine || "—"} |
| **Placa** | ${plate || "—"} |
| **Kilometraje** | ${km ? parseInt(km).toLocaleString()+" km" : "—"} |
| **Combustible** | ${fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"} |
| **Tracción** | ${is4m?"⚙️ 4MATIC":"RWD"} |
${oilLiters > 0 ? `| **Aceite cargado** | 🛢️ ${oilLiters} L — ${oilSpec} |` : ""}

---

### 🔧 Servicio Realizado
| Campo | Detalle |
|-------|---------|
| **Código** | **${sel}** |
| **Descripción** | ${svc.desc} |
| **Mecánico** | ${mechName} |
| **Fecha** | ${sigDate} |
| **Progreso** | ${doneN}/${total} ítems (${pct}%) |

---

### 📝 Observaciones del Mecánico
${notes || "_Sin observaciones adicionales_"}

---

### ✅ Detalle de Revisiones
${taskSection}
${issues.length > 0 ? `\n---\n\n### ⚠️ Puntos Pendientes\n${issueLines}` : ""}

---
_Servicio certificado por ${mechName} · ${sigDate}_
_Sistema de Gestión de Taller — Mercedes-Benz_`;
  };

  const sendToTrello = async () => {
    setTrelloStatus("sending");
    try {
      // 1. Obtener listas del tablero
      const listsRes = await fetch(
        `https://api.trello.com/1/boards/${TRELLO_BOARD}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
      );
      const lists = await listsRes.json();

      // Buscar lista "Servicios" o "Gestión de Taller" o usar la primera
      let listId = lists[0]?.id;
      const preferred = lists.find(l =>
        l.name.toLowerCase().includes("servicio") ||
        l.name.toLowerCase().includes("taller") ||
        l.name.toLowerCase().includes("completado") ||
        l.name.toLowerCase().includes("listo")
      );
      if (preferred) listId = preferred.id;

      // 2. Crear tarjeta
      const title = `🔧 ${model || "Vehículo"} | Placa: ${plate || "—"} | Servicio ${sel} | ${mechName}`;
      const desc  = buildTrelloDesc();

      const cardRes = await fetch(
        `https://api.trello.com/1/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idList: listId,
            name: title,
            desc: desc,
            due: null,
          })
        }
      );
      const card = await cardRes.json();

      if (card.url) {
        setTrelloUrl(card.url);
        setTrelloStatus("done");
      } else {
        setTrelloStatus("error");
      }
    } catch (e) {
      console.error(e);
      setTrelloStatus("error");
    }
  };

  const confirmSig = () => {
    const now = new Date();
    setSigDate(now.toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " + now.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" }));
  };

  const byGrp = tasks.reduce((a,t) => {
    if (!a[t.grp]) a[t.grp] = { icon:t.icon, outOfAssyst:t.outOfAssyst, tasks:[] };
    a[t.grp].tasks.push(t);
    return a;
  }, {});

  const pill = (active, color, fn, label) => (
    <button onClick={fn} style={{ padding:"5px 13px", borderRadius:20, fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:active?"bold":"normal", border:active?`1.5px solid ${color}`:`1px solid ${line}`, background:active?color+"22":card, color:active?color:"#555" }}>
      {label}
    </button>
  );

  const inp = { background:card, border:`1px solid ${line}`, color:"#e0d8cc", borderRadius:6, padding:"7px 10px", fontSize:12, fontFamily:"monospace", outline:"none" };

  return (
    <div style={{ background:bg, minHeight:"100vh", fontFamily:"monospace", color:"#e0d8cc" }}>
      {/* Overlay para cerrar el buscador */}
      {modelOpen && <div onClick={()=>setModelOpen(false)} style={{ position:"fixed", inset:0, zIndex:40 }} />}

      {/* HEADER */}
      <div style={{ background:"#0d0d16", borderBottom:`1px solid ${line}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:9 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #C8A96E", display:"flex", alignItems:"center", justifyContent:"center", color:"#C8A96E", fontWeight:"bold", fontSize:16, flexShrink:0 }}>★</div>
        <div>
          <div style={{ fontWeight:"bold", letterSpacing:2, fontSize:13 }}>MERCEDES-BENZ</div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:3 }}>ASSYST PLUS · MANTENIMIENTO</div>
        </div>
        {doneN > 0 && (
          <div style={{ marginLeft:"auto", fontSize:10, padding:"3px 11px", borderRadius:20, border:`1px solid ${isComplete?"#4ade80":G}`, color:isComplete?"#4ade80":G, background:isComplete?"#14532d":"#1a1a2a" }}>
            {isComplete ? "✓ COMPLETO" : pct+"%"}
          </div>
        )}
      </div>

      {/* DATOS VEHÍCULO */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${line}`, background:"#0c0c14" }}>
        <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8 }}>DATOS DEL VEHÍCULO</div>

        {/* Buscador de modelo */}
        <div style={{ position:"relative", marginBottom:6 }}>
          <input
            value={modelSearch}
            onChange={e => { setModelSearch(e.target.value); setModelOpen(true); }}
            onFocus={() => setModelOpen(true)}
            placeholder="🔍 Buscar — ej: C300, clase s, W204, GLE63..."
            style={{ ...inp, width:"100%", boxSizing:"border-box", paddingLeft:10 }}
          />
          {model && !modelOpen && (
            <div style={{ marginTop:4, fontSize:10, color:"#C8A96E", paddingLeft:2 }}>
              ✓ {model}
              <button onClick={()=>{ setModel(""); setEngine(""); setModelSearch(""); }} style={{ marginLeft:8, background:"transparent", border:"none", color:"#555", cursor:"pointer", fontSize:10 }}>✕ cambiar</button>
            </div>
          )}
          {modelOpen && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:"#0f0f17", border:`1px solid ${line}`, borderRadius:6, maxHeight:220, overflowY:"auto", marginTop:2, boxShadow:"0 8px 24px #00000080" }}>
              {(() => {
                const q = modelSearch.toLowerCase().trim();
                const searched = q ? smartSearch(q) : null;
                const allModels = searched !== null ? [
                  ...searched,
                  ...(q.includes("otro") ? [{ m:"Otro / No listado", grp:"" }] : []),
                ] : [
                  ...Object.entries(MODEL_GROUPS).flatMap(([grp, ms]) => ms.map(m => ({ m, grp }))),
                  { m:"Otro / No listado", grp:"" },
                ];

                if (!allModels.length) return (
                  <div style={{ padding:"10px 12px", fontSize:11, color:"#555" }}>
                    Sin resultados para "<span style={{ color:"#C8A96E" }}>{modelSearch}</span>"
                    <div style={{ fontSize:10, color:"#444", marginTop:4 }}>Intentá con el chassis (ej: W204) o modelo (ej: C300)</div>
                  </div>
                );
                let lastGrp = null;
                return allModels.map(({ m, grp }, i) => {
                  const showGrp = grp && grp !== lastGrp;
                  lastGrp = grp;
                  return (
                    <div key={m+i}>
                      {showGrp && (
                        <div style={{ padding:"5px 10px 2px", fontSize:8, color:"#444", letterSpacing:2, background:"#0c0c12", borderTop:i>0?`1px solid ${line}`:"none" }}>
                          {grp.toUpperCase()}
                        </div>
                      )}
                      <div
                        onClick={() => { setModel(m); setEngine(""); setModelSearch(m); setModelOpen(false); }}
                        style={{ padding:"9px 12px", fontSize:12, color: model===m?"#C8A96E":"#ccc", background: model===m?"#C8A96E12":"transparent", cursor:"pointer", borderLeft: model===m?"2px solid #C8A96E":"2px solid transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background="#1a1a2a"}
                        onMouseLeave={e => e.currentTarget.style.background = model===m?"#C8A96E12":"transparent"}
                      >
                        {m}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Motor — aparece justo debajo del modelo */}
        {availableEngines.length > 0 && (
          <select value={engine} onChange={handleEngineChange} style={{ ...inp, width:"100%", color:engine?"#e0d8cc":"#555", marginBottom:6 }}>
            <option value="">— Seleccionar motor —</option>
            {availableEngines.map(e => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>
        )}

        {/* Patente + KM */}
        <div style={{ display:"flex", gap:6, marginBottom:6 }}>
          <input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="PLACA" maxLength={8} style={{ ...inp, flex:1, letterSpacing:2, textTransform:"uppercase" }} />
          <input value={km} onChange={e=>setKm(e.target.value)} placeholder="KM" type="number" style={{ ...inp, flex:1 }} />
        </div>

        {/* Capacidad de aceite */}
        {engineInfo && (
          <div style={{ marginTop:8, padding:"8px 12px", borderRadius:6, border:`1px solid ${isEV?"#3b82f6":oilLiters>0?"#C8A96E60":line}`, background:isEV?"#0a0a1f":oilLiters>0?"#C8A96E0c":"#0c0c14", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
            <div>
              <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:2 }}>CAPACIDAD DE ACEITE CON FILTRO</div>
              {isEV ? (
                <div style={{ fontSize:14, fontWeight:"bold", color:"#3b82f6" }}>⚡ Vehículo eléctrico — Sin aceite de motor</div>
              ) : (
                <div style={{ fontSize:18, fontWeight:"bold", color:"#C8A96E" }}>{oilLiters} L <span style={{ fontSize:11, color:"#888", fontWeight:"normal" }}>— {oilSpec}</span></div>
              )}
            </div>
            {!isEV && oilLiters > 0 && (
              <div style={{ fontSize:10, color:"#555", background:card, border:`1px solid ${line}`, borderRadius:4, padding:"3px 8px" }}>
                🛢️ Verificar varilla de nivel de aceite al finalizar
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOTOR + TRACCIÓN */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, color:"#555", letterSpacing:2 }}>MOTOR:</span>
        {pill(fuel==="gasolina","#C8A96E",()=>setFuel("gasolina"),"⛽ Gasolina")}
        {pill(fuel==="diesel","#C8A96E",()=>setFuel("diesel"),"🛢️ Diesel")}
        <div style={{ width:1, height:16, background:"#2a2a3a", margin:"0 4px" }} />
        <span style={{ fontSize:9, color:"#555", letterSpacing:2 }}>TRACCIÓN:</span>
        {pill(!is4m,"#7EB8F7",()=>setIs4m(false),"RWD")}
        {pill(is4m,"#7EB8F7",()=>setIs4m(true),"4MATIC")}
      </div>

      {/* SELECTOR SERIE A */}
      <div style={{ padding:"10px 16px 4px" }}>
        <div style={{ fontSize:9, color:"#C8A96E80", letterSpacing:3, marginBottom:6 }}>SERIE A — INSPECCIÓN MENOR</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {A_KEYS.map(k => { const s=CODES[k],on=sel===k; return (
            <button key={k} onClick={()=>setSel(k)} style={{ padding:"5px 11px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":card, color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, fontWeight:on?"bold":"normal", cursor:"pointer" }}>{k}</button>
          );})}
        </div>
      </div>

      {/* SELECTOR SERIE B */}
      <div style={{ padding:"4px 16px 10px", borderBottom:`1px solid ${line}` }}>
        <div style={{ fontSize:9, color:"#7EB8F780", letterSpacing:3, marginBottom:6, marginTop:4 }}>SERIE B — INSPECCIÓN MAYOR</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {B_KEYS.map(k => { const s=CODES[k],on=sel===k; return (
            <button key={k} onClick={()=>setSel(k)} style={{ padding:"5px 11px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":card, color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, fontWeight:on?"bold":"normal", cursor:"pointer" }}>{k}</button>
          );})}
        </div>
      </div>

      {/* BANNER */}
      <div style={{ margin:"10px 16px 0", padding:"10px 14px", borderRadius:8, border:`1px solid ${fuelMismatch?"#ef4444":G}40`, background:`${fuelMismatch?"#ef4444":G}0c` }}>
        <div style={{ fontWeight:"bold", color:fuelMismatch?"#ef4444":G, fontSize:15 }}>Servicio {sel}</div>
        <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{svc.desc}</div>
        {fuelMismatch && (
          <div style={{ marginTop:8, padding:"7px 10px", borderRadius:6, background:"#2a0a0a", border:"1px solid #ef4444", fontSize:11, color:"#ef4444", lineHeight:1.6 }}>
            ⚠️ El servicio <strong>{sel}</strong> es exclusivo de motor <strong>{fuelLock==="gasolina"?"Gasolina":"DIESEL"}</strong>. Verificar con el cliente antes de continuar.
          </div>
        )}
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
          {fuel==="diesel"
            ? <span style={{ fontSize:9, background:"#1a1a0a", border:"1px solid #5a4a00", color:"#C8A96E", borderRadius:4, padding:"2px 7px" }}>🛢️ Diesel</span>
            : <span style={{ fontSize:9, background:"#0a0a1a", border:"1px solid #2a2a5a", color:"#7EB8F7", borderRadius:4, padding:"2px 7px" }}>⛽ Gasolina</span>}
          {fuelLock && <span style={{ fontSize:9, background:"#1a0a1a", border:"1px solid #4a1a4a", color:"#c084fc", borderRadius:4, padding:"2px 7px" }}>🔒 Solo {fuelLock==="gasolina"?"Gasolina":"Diesel"}</span>}
          {is4m && <span style={{ fontSize:9, background:"#0a1a0a", border:"1px solid #1a4a1a", color:"#4ade80", borderRadius:4, padding:"2px 7px" }}>⚙️ 4MATIC</span>}
        </div>
      </div>

      {/* PROGRESO */}
      <div style={{ padding:"10px 16px 8px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:5 }}>
          <span style={{ color:"#555", letterSpacing:2 }}>PROGRESO</span>
          <span style={{ color:G }}>{doneN} / {total}</span>
        </div>
        <div style={{ height:3, background:line, borderRadius:2 }}>
          <div style={{ height:"100%", width:pct+"%", background:isComplete?"#4ade80":G, borderRadius:2, transition:"width .3s" }} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", borderBottom:`1px solid ${line}`, padding:"0 16px" }}>
        {[["check","📋 CHECKLIST"],["notes","📝 NOTAS"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setTab(v)} style={{ flex:1, padding:"9px 0", background:"transparent", border:"none", borderBottom:tab===v?`2px solid ${G}`:"2px solid transparent", color:tab===v?G:"#444", fontSize:11, fontFamily:"monospace", letterSpacing:2, cursor:"pointer", fontWeight:tab===v?"bold":"normal" }}>{lbl}</button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ padding:"10px 16px" }}>
        {tab==="check" ? (
          <>
            {/* CHECKLIST ASSYST */}
            {Object.entries(byGrp).map(([grp, {icon, outOfAssyst, tasks:gtasks}]) => {
              const isGlow    = grp.includes("precalentamiento");
              const is4mSec  = grp.includes("4MATIC");
              const isManual = outOfAssyst;
              const secColor = isGlow ? "#7dd3fc" : is4mSec ? "#4ade80" : G;
              return (
                <div key={grp} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:secColor+"cc", letterSpacing:1, marginBottom:6, fontWeight:"bold" }}>
                    <span>{icon}</span>
                    <span>{grp.toUpperCase()}</span>
                    {isManual && (
                      <span style={{ fontSize:8, background:`${secColor}18`, border:`1px solid ${secColor}40`, color:secColor, borderRadius:3, padding:"1px 5px" }}>
                        FUERA DEL ASSYST
                      </span>
                    )}
                    <div style={{ flex:1, height:1, background:`${secColor}30` }} />
                  </div>
                  {gtasks.map(({id,text}) => {
                    const status  = taskStatus[id]; // "ok" | "issue" | undefined
                    const isInfo  = text.startsWith("⚠");
                    const isOpen  = activeIssue === id;
                    const rowBg   = status==="ok" ? "#0a1a0a"
                                  : status==="issue" ? "#1a0a0a"
                                  : isInfo ? "#0c0c12" : card;
                    const rowBdr  = status==="ok" ? "#4ade8040"
                                  : status==="issue" ? "#f8717140"
                                  : line;
                    return (
                      <div key={id} style={{ marginBottom: isOpen ? 8 : 3 }}>
                        {/* Fila principal */}
                        <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 10px", borderRadius: isOpen?"6px 6px 0 0":6, background:rowBg, border:`1px solid ${rowBdr}`, userSelect:"none", opacity:isInfo?0.55:1 }}>
                          {isInfo
                            ? <span style={{ fontSize:11, color:"#666", flexShrink:0, marginTop:2 }}>ℹ</span>
                            : <span style={{ fontSize:12, color: status==="ok"?"#4ade80": status==="issue"?"#f87171":"#666", flexShrink:0, marginTop:2, width:14, textAlign:"center" }}>
                                {status==="ok" ? "✓" : status==="issue" ? "!" : "·"}
                              </span>
                          }
                          <span style={{ flex:1, fontSize:12, color: status==="ok"?"#4a6a4a": status==="issue"?"#8a4a4a":isInfo?"#666":"#ccc", textDecoration: status==="ok"?"line-through":"none", lineHeight:1.5 }}>{text}</span>

                          {/* Botones OK / Detalle */}
                          {!isInfo && (
                            <div style={{ display:"flex", gap:4, flexShrink:0, marginTop:1 }}>
                              <button
                                onClick={()=> status==="ok" ? (setTaskStatus(p=>({...p,[id]:undefined})), setChk(p=>({...p,[id]:false}))) : setStatus(id,"ok","",text)}
                                style={{ padding:"3px 8px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="ok"?"#4ade8060":"#2a3a2a"}`, background:status==="ok"?"#4ade8020":"transparent", color:status==="ok"?"#4ade80":"#3a5a3a", fontWeight:status==="ok"?"bold":"normal" }}
                              >✓ OK</button>
                              <button
                                onClick={()=> status==="issue" && !isOpen ? setActiveIssue(id) : setStatus(id,"issue","",text)}
                                style={{ padding:"3px 8px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="issue"?"#f8717160":"#3a2a2a"}`, background:status==="issue"?"#f8717120":"transparent", color:status==="issue"?"#f87171":"#5a3a3a", fontWeight:status==="issue"?"bold":"normal" }}
                              >⚠ Detalle</button>
                            </div>
                          )}
                        </div>

                        {/* Panel de detalle inline */}
                        {isOpen && (
                          <div style={{ padding:"8px 10px", borderRadius:"0 0 6px 6px", background:"#1a0808", border:`1px solid #f8717140`, borderTop:"none" }}>
                            <div style={{ fontSize:9, color:"#f87171", letterSpacing:2, marginBottom:5 }}>DESCRIPCIÓN DEL DETALLE</div>
                            <textarea
                              autoFocus
                              value={taskIssue[id]||""}
                              onChange={e=>setTaskIssue(p=>({...p,[id]:e.target.value}))}
                              placeholder="Ej: Pastillas al 20%, se recomienda reemplazo..."
                              rows={2}
                              style={{ width:"100%", background:"#0c0808", border:"1px solid #f8717130", borderRadius:4, color:"#f0c0c0", fontSize:12, fontFamily:"monospace", padding:"6px 8px", resize:"none", boxSizing:"border-box", outline:"none", lineHeight:1.5 }}
                            />
                            <div style={{ display:"flex", gap:6, marginTop:6 }}>
                              <button onClick={()=>{ setTaskStatus(p=>({...p,[id]:undefined})); setActiveIssue(null); }}
                                style={{ flex:1, padding:"6px", borderRadius:4, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
                                Cancelar
                              </button>
                              <button onClick={()=>confirmIssue(id,text)}
                                style={{ flex:2, padding:"6px", borderRadius:4, border:"1px solid #f8717150", background:"#f8717118", color:"#f87171", fontFamily:"monospace", fontSize:10, cursor:"pointer", fontWeight:"bold" }}>
                                ⚠ Guardar en notas
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Resumen del detalle guardado */}
                        {status==="issue" && !isOpen && taskIssue[id] && (
                          <div onClick={()=>setActiveIssue(id)} style={{ padding:"4px 10px", borderRadius:"0 0 6px 6px", background:"#1a0808", border:`1px solid #f8717140`, borderTop:"none", fontSize:11, color:"#f87171", cursor:"pointer" }}>
                            ✎ {taskIssue[id]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* BOTONES */}
            <div style={{ display:"flex", gap:8, marginTop:10, marginBottom:16 }}>
              <button onClick={resetAll} style={{ flex:1, padding:10, borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:11, letterSpacing:2, cursor:"pointer" }}>↺ REINICIAR</button>
              <button onClick={markAll} style={{ flex:1, padding:10, borderRadius:6, border:`1px solid ${G}50`, background:G+"18", color:G, fontFamily:"monospace", fontSize:11, letterSpacing:2, cursor:"pointer" }}>✓ MARCAR TODO</button>
            </div>

            {/* REVISIONES ADICIONALES */}
            <div style={{ borderTop:"1px dashed #2a2a3a", paddingTop:14, marginBottom:24 }}>
              <button onClick={()=>setShowEx(p=>!p)} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #a855f730", background:showEx?"#a855f712":card, color:"#a855f7", fontFamily:"monospace", fontSize:11, letterSpacing:1, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>🔎 REVISIONES ADICIONALES</span>
                <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {/* Etiqueta del tipo de motor activo */}
                  <span style={{ fontSize:9, background: fuel==="diesel"?"#1a1a0a":"#0a0a1a", border:`1px solid ${fuel==="diesel"?"#5a4a00":"#2a2a5a"}`, color: fuel==="diesel"?"#C8A96E":"#7EB8F7", borderRadius:10, padding:"1px 7px" }}>
                    {fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"} · {extras.length} categorías
                  </span>
                  {exDoneN > 0 && <span style={{ fontSize:9, background:"#a855f720", border:"1px solid #a855f750", color:"#a855f7", borderRadius:10, padding:"1px 7px" }}>{exDoneN}/{exTotal}</span>}
                  <span>{showEx?"▲":"▼"}</span>
                </span>
              </button>

              {showEx && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:10, color:"#a855f7", letterSpacing:1, marginBottom:12, lineHeight:1.6, padding:"8px 10px", borderRadius:6, background:"#a855f710", border:"1px solid #a855f730" }}>
                    ⚠️ Componentes <strong>fuera del ASSYST</strong> — no aparecen en el tablero. Basados en experiencia de taller y recomendaciones de especialistas MB. Se muestran ítems para motor <strong>{fuel==="diesel"?"Diesel":"Gasolina"}</strong>.
                  </div>

                  {extras.map(ex => (
                    <div key={ex.id} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#a855f7cc", letterSpacing:1, marginBottom:5, fontWeight:"bold" }}>
                        <span>{ex.icon}</span>
                        <span>{ex.label.toUpperCase()}</span>
                        <div style={{ flex:1, height:1, background:"#a855f730" }} />
                      </div>
                      <div style={{ fontSize:9, color:"#555", marginBottom:6 }}>🕐 {ex.interval}</div>
                      {ex.tasks.map((text, i) => {
                        const eid = `${ex.id}_${i}`;
                        const d = !!exChk[eid];
                        const isInfo = text.startsWith("⚠");
                        return (
                          <div key={eid} onClick={()=>!isInfo && toggleEx(eid)}
                            style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px", marginBottom:3, borderRadius:6, background:d?"#a855f712":isInfo?"#0c0c12":card, border:`1px solid ${d?"#a855f735":line}`, cursor:isInfo?"default":"pointer", userSelect:"none", opacity:isInfo?0.55:1 }}>
                            {!isInfo && (
                              <div style={{ width:16, height:16, borderRadius:3, border:d?"2px solid #a855f7":"1.5px solid #333", background:d?"#a855f7":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                                {d && <span style={{ fontSize:9, color:"#fff", fontWeight:"bold" }}>✓</span>}
                              </div>
                            )}
                            {isInfo && <span style={{ fontSize:10, color:"#666", flexShrink:0, marginTop:2 }}>ℹ</span>}
                            <span style={{ fontSize:12, color:d?"#555":isInfo?"#666":"#bbb", textDecoration:d?"line-through":"none", lineHeight:1.5 }}>{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* NOTAS */
          <div style={{ paddingBottom:24 }}>
            <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8 }}>OBSERVACIONES</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder={"Ej: Pastillas traseras al 20%\nEj: Sin fugas detectadas\nEj: EGR con depósitos — programar limpieza"}
              style={{ width:"100%", minHeight:180, background:card, border:`1px solid ${line}`, borderRadius:8, color:"#ccc", fontSize:13, fontFamily:"monospace", padding:12, resize:"vertical", lineHeight:1.6, boxSizing:"border-box", outline:"none" }} />
            <div style={{ fontSize:10, color:"#333", textAlign:"right", marginTop:4 }}>{notes.length} car.</div>

            {/* Resumen */}
            <div style={{ margin:"14px 0 8px", padding:"10px 12px", borderRadius:8, border:`1px solid ${G}30`, background:`${G}08` }}>
              <div style={{ fontSize:9, color:G, letterSpacing:3, marginBottom:6 }}>RESUMEN DEL SERVICIO</div>
              <div style={{ fontSize:11, color:"#888", lineHeight:2 }}>
                <div>🔧 <span style={{ color:G, fontWeight:"bold" }}>Servicio {sel}</span></div>
                {model && <div>🚗 {model}</div>}
                {engine && <div>⚙️ {engine}</div>}
                {oilLiters > 0 && <div>🛢️ Aceite: <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{oilLiters} L</span> · {oilSpec}</div>}
                {plate && <div>📋 <span style={{ letterSpacing:2 }}>{plate}</span></div>}
                {km    && <div>📍 {parseInt(km).toLocaleString()} km</div>}
                <div>{fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"} {is4m?"· ⚙️ 4MATIC":""}</div>
                <div>✅ Progreso ASSYST: <span style={{ color:isComplete?"#4ade80":G }}>{doneN}/{total} ({pct}%)</span></div>
                {exDoneN > 0 && <div>🔎 Revisiones adicionales: <span style={{ color:"#a855f7" }}>{exDoneN}/{exTotal}</span></div>}
              </div>
            </div>

            {/* ── FIRMA DEL MECÁNICO ── */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px dashed #2a2a3a", paddingBottom:32 }}>
              <div style={{ fontSize:9, color:"#C8A96E", letterSpacing:3, marginBottom:12 }}>✍️ FIRMA DEL MECÁNICO RESPONSABLE</div>

              {/* Nombre — lista predefinida */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:5 }}>MECÁNICO RESPONSABLE</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {["Fabián Araya","Benjamin Corrales","Gustavo Ramos","Otto Ramos","Arturo Ramos"].map(name => (
                    <button key={name} onClick={()=>setMechName(name)}
                      style={{ padding:"8px 12px", borderRadius:6, fontFamily:"monospace", fontSize:12, cursor:"pointer", border:`1px solid ${mechName===name?"#C8A96E60":line}`, background:mechName===name?"#C8A96E18":card, color:mechName===name?"#C8A96E":"#888", fontWeight:mechName===name?"bold":"normal" }}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen del servicio */}
              <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:8, border:`1px solid ${line}`, background:"#0c0c14" }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 }}>SERVICIO A CERTIFICAR</div>
                <div style={{ fontSize:11, color:"#888", lineHeight:1.9 }}>
                  <div>🔧 <span style={{ color:"#C8A96E", fontWeight:"bold" }}>Servicio {sel}</span> — {svc.desc}</div>
                  {model && <div>🚗 {model}</div>}
                  {plate && <div>📋 <span style={{ letterSpacing:2, color:"#ccc" }}>{plate}</span></div>}
                  {km    && <div>📍 {parseInt(km).toLocaleString()} km</div>}
                  <div>{fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"} {is4m?"· ⚙️ 4MATIC":""}</div>
                  <div>✅ Progreso: <span style={{ color:isComplete?"#4ade80":"#C8A96E" }}>{doneN}/{total} tareas ({pct}%)</span></div>
                </div>
              </div>

              {/* Pad de firma */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 }}>FIRMA DIGITAL</div>
                <div style={{ position:"relative", borderRadius:8, overflow:"hidden", border:`1.5px solid ${hasSig?"#C8A96E":line}`, background:"#0c0c14" }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={160}
                    style={{ width:"100%", height:160, display:"block", cursor:"crosshair", touchAction:"none" }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  {!hasSig && (
                    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:12, color:"#2a2a3a", pointerEvents:"none", letterSpacing:2 }}>
                      ✍ FIRMAR AQUÍ
                    </div>
                  )}
                </div>
                <div style={{ fontSize:9, color:"#333", marginTop:4, textAlign:"center" }}>Usá el dedo o el mouse para firmar</div>
              </div>

              {/* Botones */}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <button onClick={clearSig} style={{ flex:1, padding:"10px", borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                  🗑 Borrar
                </button>
                <button
                  onClick={confirmSig}
                  disabled={!hasSig || !mechName.trim()}
                  style={{ flex:2, padding:"10px", borderRadius:6, border:`1px solid ${hasSig && mechName.trim()?"#C8A96E60":"#2a2a3a"}`, background:hasSig && mechName.trim()?"#C8A96E20":card, color:hasSig && mechName.trim()?"#C8A96E":"#444", fontFamily:"monospace", fontSize:11, letterSpacing:1, cursor:hasSig && mechName.trim()?"pointer":"default", fontWeight:"bold" }}
                >
                  ✓ CONFIRMAR Y CERTIFICAR
                </button>
              </div>

              {/* Indicador de pasos */}
              {!sigDate && (
                <div style={{ fontSize:10, color:"#444", textAlign:"center", padding:"6px", borderRadius:6, border:"1px dashed #2a2a3a" }}>
                  {!mechName.trim() && !hasSig ? "① Seleccioná el mecánico  ②  Firmá  ③ Confirmá"
                  : !mechName.trim() ? "① Seleccioná el mecánico responsable"
                  : !hasSig ? "② Falta la firma"
                  : "③ Presioná Confirmar para certificar"}
                </div>
              )}

              {/* ── PANTALLA DE FINALIZACIÓN ── */}
              {sigDate && mechName.trim() && hasSig && (
                <div style={{ marginTop:4 }}>
                  {/* Declaración principal */}
                  <div style={{ padding:"20px 16px", borderRadius:10, border:"2px solid #C8A96E60", background:"linear-gradient(180deg,#C8A96E0a 0%,#09090e 100%)", textAlign:"center", marginBottom:14 }}>
                    <div style={{ fontSize:22, marginBottom:10 }}>⭐</div>
                    <div style={{ fontSize:13, color:"#C8A96E", fontWeight:"bold", letterSpacing:2, marginBottom:12 }}>SERVICIO COMPLETADO</div>
                    <div style={{ fontSize:14, color:"#e0d8cc", lineHeight:1.8, marginBottom:16, fontStyle:"italic" }}>
                      "Confirmo que se ha realizado la lista de revisiones previas a la entrega"
                    </div>
                    <div style={{ fontSize:12, color:"#888", lineHeight:2 }}>
                      <div>👤 <span style={{ color:"#e0d8cc", fontWeight:"bold" }}>{mechName}</span></div>
                      <div>🗓 <span style={{ color:"#ccc" }}>{sigDate}</span></div>
                      {plate && <div>🚗 Placa: <span style={{ color:"#ccc", letterSpacing:2 }}>{plate}</span></div>}
                      {model && <div>🔎 {model}</div>}
                      <div>🔧 Servicio <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{sel}</span> · {doneN}/{total} ítems revisados</div>
                    </div>
                  </div>

                  {/* Issues encontrados */}
                  {Object.entries(taskIssue).filter(([,v])=>v).length > 0 && (
                    <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:8, border:"1px solid #f8717130", background:"#1a080808" }}>
                      <div style={{ fontSize:9, color:"#f87171", letterSpacing:2, marginBottom:8 }}>⚠️ DETALLES PENDIENTES</div>
                      {Object.entries(taskIssue).filter(([,v])=>v).map(([id,txt])=>(
                        <div key={id} style={{ fontSize:11, color:"#f0c0c0", marginBottom:4, lineHeight:1.5 }}>• {txt}</div>
                      ))}
                    </div>
                  )}

                  {/* Botón Trello */}
                  {trelloStatus === "done" ? (
                    <div style={{ padding:"12px 14px", borderRadius:8, border:"1px solid #4ade8050", background:"#0a1a0a", marginBottom:10 }}>
                      <div style={{ fontSize:9, color:"#4ade80", letterSpacing:2, marginBottom:6 }}>✅ ENVIADO A TRELLO</div>
                      <div style={{ fontSize:11, color:"#888", marginBottom:10 }}>La tarjeta fue creada en el tablero <strong style={{ color:"#ccc" }}>Gestión de Taller</strong></div>
                      <a href={trelloUrl} target="_blank" rel="noreferrer"
                        style={{ display:"block", textAlign:"center", padding:"10px", borderRadius:6, border:"1px solid #4ade8050", background:"#4ade8015", color:"#4ade80", fontFamily:"monospace", fontSize:11, textDecoration:"none", letterSpacing:1 }}>
                        🔗 Ver tarjeta en Trello
                      </a>
                    </div>
                  ) : trelloStatus === "error" ? (
                    <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid #f8717150", background:"#1a0a0a", marginBottom:10 }}>
                      <div style={{ fontSize:11, color:"#f87171" }}>❌ Error al enviar a Trello. Verificá tu conexión e intentá de nuevo.</div>
                      <button onClick={sendToTrello} style={{ marginTop:8, width:"100%", padding:"8px", borderRadius:6, border:"1px solid #f8717150", background:"#f8717115", color:"#f87171", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                        🔄 Reintentar
                      </button>
                    </div>
                  ) : (
                    <button onClick={sendToTrello} disabled={trelloStatus==="sending"}
                      style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${trelloStatus==="sending"?"#2a2a3a":"#0052cc80"}`, background:trelloStatus==="sending"?"#0a0a14":"#0052cc18", color:trelloStatus==="sending"?"#444":"#4c9aff", fontFamily:"monospace", fontSize:12, cursor:trelloStatus==="sending"?"default":"pointer", fontWeight:"bold", marginBottom:10, letterSpacing:1 }}>
                      {trelloStatus==="sending" ? "⏳ Enviando a Trello..." : "📋 Enviar resumen a Trello"}
                    </button>
                  )}

                  <button onClick={()=>{ clearSig(); setSigDate(""); setMechName(""); setTrelloStatus("idle"); setTrelloUrl(""); }} style={{ width:"100%", padding:"10px", borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
                    ↺ Nuevo servicio
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
