import { useState, useRef, useEffect } from "react";

// ─── ÍTEMS ASSYST ─────────────────────────────────────────────────────────
const ITEMS = {
  "1": { label:"Inspección A (menor)", icon:"🔍", tasks:[
    "Inspección visual del motor — fugas, correas, mangueras",
    "Revisión y corrección de todos los niveles de fluidos",
    "Inspección de pastillas y discos de freno",
    "Inspección de presión de llantas (Incluida llanta de repuesto)",
    "Inspección visual de llantas — desgaste y daños",
    "Revisión de luces exteriores e interiores",
    "Revisión de limpiaparabrisas y lavadores",
    "Escaneo de fallas (Star Diagnosis / OBD)",
    "Reiniciar intervalo de mantenimiento",
  ]},
  "2": { label:"Inspección B (mayor)", icon:"🔍", tasks:[
    "Inspección visual del motor — fugas, correas, mangueras",
    "Revisión y corrección de todos los niveles de fluidos",
    "Inspección de pastillas y discos de freno (todos los ejes)",
    "Revisión del freno de estacionamiento",
    "Inspección de presión de llantas (Incluida llanta de repuesto)",
    "Inspección visual de llantas — desgaste y daños",
    "Reemplazo del filtro de habitáculo / carbón activo",
    "Revisión de luces, alertas y sensores",
    "Inspección de sistema de escape",
    "Inspección de suspensión y dirección",
    "Inspección de faja de accesorios",
    "Prueba de batería con analizador de batería (Anotar estado de salud y carga)",
    "Escaneo completo de fallas (Star Diagnosis)",
    "Prueba en carretera",
    "Reiniciar intervalo de mantenimiento",
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
    "Purga del sistema de frenos — purga en los 4 tornillos de purga",
    "Verificación de hermeticidad del circuito",
  ]},
  "8": { label:"Filtro de aire del motor", icon:"🌀", tasks:[
    "Extracción del filtro de aire del motor",
    "Limpieza del alojamiento del filtro",
    "Instalación del filtro de aire nuevo",
  ]},
  "10": { label:"Techo corredizo", icon:"🏠", tasks:[
    "Limpieza de guías y canales de drenaje del techo",
    "Lubricación de guías con grasa MB especificada",
    "Verificación del funcionamiento del techo corredizo",
  ]},
  "11": { label:"Filtro de combustible — Diesel", icon:"⛽", tasks:[
    "Extracción del filtro de combustible diesel",
    "Instalación del filtro de combustible nuevo",
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
    "Verificación de nivel y ausencia de fugas",
    "Drenaje del aceite de caja automática",
    "Reemplazo del filtro de caja y empaque del cárter",
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
    interval:"Con cada cambio de llantas · O si hay desgaste irregular",
    tasks:[
      "Inspección del patrón de desgaste de llantas",
      "Balanceo de las 4 ruedas si hay vibración en marcha",
      "Alineación 4 ruedas si hay desvío o desgaste irregular",
      "Verificación de presión y estado del llanta de auxilio",
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
    { name:"G 300 D / G 320 (OM606/M112 3.0-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"G 300 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"G 350 d (OM642 3.0D V6)", fuel:"diesel", oil:9.0, spec:"MB 229.51 / 229.52" },
    { name:"G 500 (M113 5.0 V8) 1998–2012", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"G 500 (M273 5.5 V8) 2012–2018", fuel:"gasolina", oil:9.0, spec:"MB 229.3 / 229.5" },
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
    { name:"C 230 Kompressor (M111 2.3T)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"C 240 (M112 2.4 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"C 280 (M104/M112 2.8 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"C 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"C 220 CDI (OM604)", fuel:"diesel", oil:6.0, spec:"MB 229.1" },
    { name:"C 250 TD / C 250 Turbodiesel (OM605)", fuel:"diesel", oil:6.5, spec:"MB 229.1" },
    { name:"C 36 AMG (M104 3.6)", fuel:"gasolina", oil:7.5, spec:"MB 229.1" },
    { name:"C 43 AMG (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
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
    { name:"E 200 / E 220 (M111 2.0-2.2 4cil)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"E 240 (M112 2.4 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"E 280 (M104/M112 2.8 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"E 320 (M104/M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"E 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"E 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"E 200 CDI / E 220 CDI (OM611 2.0-2.2D)", fuel:"diesel", oil:6.0, spec:"MB 229.1 / 229.3" },
    { name:"E 270 CDI (OM612 2.7D)", fuel:"diesel", oil:7.0, spec:"MB 229.3" },
    { name:"E 300 D / E 290 TD (OM606 3.0D)", fuel:"diesel", oil:6.5, spec:"MB 229.1" },
    { name:"E 320 CDI (OM613 3.2D)", fuel:"diesel", oil:7.5, spec:"MB 229.3" },
    { name:"E 55 AMG (M113 5.4 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
  ],
  "E-Class (W211 / S211) 2002–2009": [
    { name:"E 200 / E 200 Kompressor (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"E 240 (M112 2.6 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"E 280 (M272 3.0 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"E 320 (M112/M272 3.2-3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"E 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"E 500 / E 550 (M113/M273 5.0-5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"E 200 CDI / E 220 CDI (OM646 2.0-2.2D)", fuel:"diesel", oil:6.5, spec:"MB 229.3 / 229.51" },
    { name:"E 270 CDI (OM647 2.7D)", fuel:"diesel", oil:7.0, spec:"MB 229.3" },
    { name:"E 320 CDI (OM648 3.2D)", fuel:"diesel", oil:7.5, spec:"MB 229.3 / 229.51" },
    { name:"E 280 CDI / E 300 CDI (OM642 3.0D V6)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"E 420 CDI (OM629 4.0D V8)", fuel:"diesel", oil:9.5, spec:"MB 229.51" },
    { name:"E 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"E 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],

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
  "Clase A": [
    "A-Class (W168) 1997–2004",
    "A-Class (W169 / C169) 2004–2012",
    "A-Class (W176) 2012–2018",
    "A-Class Hatchback / Sedan (W177)",
  ],
  "Clase B": [
    "B-Class (W245) 2005–2011",
    "B-Class (W246) 2011–2018",
    "B-Class (W247)",
  ],
  "Clase C": [
    "C-Class (W202) 1993–2000",
    "C-Class (W203) 2001–2007",
    "C-Class Sedan / Estate (W204 / S204) 2007–2014",
    "C-Class Sedan / Estate (W205 / S205)",
    "C-Class Sedan / Estate (W206 / S206)",
  ],
  "Clase CL": [
    "CL-Class (C215) 1998–2006",
    "CL-Class (C216) 2006–2014",
  ],
  "Clase CLA": [
    "CLA Coupé / Shooting Brake (C117 / X117)",
    "CLA Coupé / Shooting Brake (C118 / X118)",
  ],
  "Clase CLE": [
    "CLE Coupé / Cabriolet (C236 / A236)",
  ],
  "Clase CLK": [
    "CLK-Class (C208) 1997–2003",
    "CLK-Class (C209) 2002–2009",
  ],
  "Clase CLS": [
    "CLS-Class (C219) 2004–2010",
    "CLS-Class (C218) 2010–2017",
  ],
  "Clase E": [
    "E-Class (W124) 1990–1996",
    "E-Class (W210) 1995–2002",
    "E-Class (W211 / S211) 2002–2009",
    "E-Class Sedan / Estate (W212 / S212) 2009–2016",
    "E-Class Coupé / Cabriolet (C207 / A207) 2009–2016",
    "E-Class Sedan / Estate (W213 / S213)",
    "E-Class Sedan / Estate (W214 / S214)",
    "E-Class Coupé / Cabriolet (C238 / A238)",
  ],
  "Clase G": [
    "G-Class (W463)",
    "G-Class (W464)",
  ],
  "Clase GLA": [
    "GLA (X156)",
    "GLA (X247)",
  ],
  "Clase GLB": [
    "GLB (X247)",
  ],
  "Clase GLC / GLK": [
    "GLK-Class (X204) 2008–2015",
    "GLC / GLC Coupé (X253 / C253)",
    "GLC / GLC Coupé (X254 / C254)",
  ],
  "Clase GLE / ML": [
    "M-Class (W163) 1997–2004",
    "M-Class (W164) 2005–2011",
    "M-Class / GLE (W166) 2011–2015",
    "GLE / GLE Coupé (W166 / C166)",
    "GLE / GLE Coupé (W167 / C167)",
  ],
  "Clase GLS / GL": [
    "GL-Class (X164) 2006–2012",
    "GL-Class / GLS (X166) 2012–2015",
    "GLS (X166)",
    "GLS (X167)",
  ],
  "Clase R": [
    "R-Class (W251) 2005–2012",
  ],
  "Clase S": [
    "S-Class (W140) 1991–1998",
    "S-Class (W220) 1998–2005",
    "S-Class (W221) 2005–2013",
    "S-Class (W222)",
    "S-Class (W223)",
  ],
  "Clase SL": [
    "SL-Class (R129) 1990–2001",
    "SL-Class (R230) 2001–2011",
    "SL-Class (R231) 2012–2021",
    "AMG SL (R232)",
  ],
  "Clase SLK / SLC": [
    "SLK-Class (R170) 1996–2003",
    "SLK-Class (R171) 2004–2010",
    "SLC-Class (R172) 2011–2020",
  ],
  "AMG GT": [
    "AMG GT Coupé / Roadster (C190 / R190)",
    "AMG GT Coupé (C192)",
    "AMG GT 4-Door Coupé (X290)",
    "AMG ONE (C298)",
  ],
  "Maybach": [
    "Mercedes-Maybach S-Class (W222)",
    "Mercedes-Maybach S-Class (W223)",
    "Mercedes-Maybach GLS (X167)",
    "Mercedes-Maybach EQS SUV (X296)",
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
  "Vans / Comerciales": [
    "Sprinter (W906) 1995–2018",
    "Sprinter (W906)",
    "Sprinter (W907)",
    "Vito (W638) 1996–2003",
    "Vito (W639) 2003–2014",
    "Vito (W639)",
    "EQV / V-Class / Vito (W447)",
  ],
};

const QUICK_NOTES = [
  "Sin novedades ✅","Pastillas al límite 🛑","Fugas detectadas 💧",
  "Desgaste irregular de llantas ⚠️","Software actualizado 💻",
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
  "g 500": ["G-Class (W463)","G-Class (W464)"],
  "g 55": ["W463"],
  "g 63": ["W463","W464"],
  "g 65": ["W463"],
  "g350": ["W463","W464"],
  "g500": ["G-Class (W463)","G-Class (W464)"],
  "m113": ["G-Class (W463)","E-Class (W210) 1995–2002","E-Class (W211 / S211) 2002–2009","S-Class (W220) 1998–2005","CL-Class (C215) 1998–2006","SL-Class (R230) 2001–2011"],
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
const CORRECT_PIN = import.meta.env.VITE_APP_PIN || "1252";
const LOGO_SRC = "data:image/png;base64,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";

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
        if (next === CORRECT_PIN) { onUnlock(); }
        else {
          setShake(true); setError(true);
          setTimeout(() => { setPin(""); setShake(false); }, 600);
        }
      }, 150);
    }
  };

  const handleDelete = () => { setPin(p => p.slice(0,-1)); setError(false); };
  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{ minHeight:"100vh", background:"#09090e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:24 }}>
      <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:100, height:100, borderRadius:"50%", marginBottom:16, objectFit:"cover" }} />
      <div style={{ fontSize:15, fontWeight:"bold", letterSpacing:3, color:"#e0d8cc", marginBottom:4 }}>RAMOS Y RAMOS</div>
      <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:40 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>

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

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 72px)", gap:12 }}>
        {digits.map((d, i) => (
          <button key={i} onClick={() => d === "⌫" ? handleDelete() : d !== "" ? handleDigit(d) : null}
            style={{
              width:72, height:72, borderRadius:12,
              border: d === "" ? "none" : "1px solid #2a2a3a",
              background: d === "" ? "transparent" : "#111118",
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
  const [showRecent, setShowRecent] = useState(false);
  const [recentList, setRecentList] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

  const fetchRecent = async () => {
    setRecentLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/servicios?select=*&order=created_at.desc&limit=15`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      setRecentList(Array.isArray(data) ? data : []);
    } catch(e) { setRecentList([]); }
    setRecentLoading(false);
  };

  const makeRecentPanel = (sr, setsr, rl, rload) => sr ? (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={() => setsr(false)}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#0f0f17", borderLeft:"1px solid #1c1c2a", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #1c1c2a", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>🕐 Recientes</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>ÚLTIMOS 15 SERVICIOS</div>
          </div>
          <button onClick={() => setsr(false)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #1c1c2a", background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {rload && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>Cargando...</div>}
          {!rload && rl.length === 0 && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>No hay servicios registrados.</div>}
          {!rload && rl.map(s => {
            const d = s.datos || {};
            const fecha = s.created_at ? new Date(s.created_at).toLocaleDateString("es-CR", { day:"2-digit", month:"short", year:"numeric" }) : "—";
            const url = `${window.location.origin}/servicio/${s.id}`;
            return (
              <div key={s.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:8, background:"#0c0c14", border:"1px solid #1c1c2a" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:"bold", color:"#C8A96E" }}>{d.vehiculo?.placa || "Sin placa"}</span>
                  <span style={{ fontSize:9, color:"#555" }}>{fecha}</span>
                </div>
                <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>{d.vehiculo?.modelo || "—"}</div>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                  <span style={{ fontSize:9, background:"#C8A96E20", border:"1px solid #C8A96E40", color:"#C8A96E", borderRadius:4, padding:"1px 6px" }}>{d.servicio || "—"}</span>
                  <span style={{ fontSize:9, color:"#555" }}>{d.mecanico || ""}</span>
                </div>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ display:"block", marginTop:8, padding:"6px 10px", borderRadius:6, border:"1px solid #2a2a3a", background:"#1a1a2a", color:"#888", fontSize:10, textDecoration:"none", fontFamily:"monospace", textAlign:"center", letterSpacing:1 }}>
                  🔗 Abrir resumen
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  if (!unlocked) return (
    <>
      <PinScreen onUnlock={() => setUnlocked(true)} />
    </>
  );

  return <MainApp makeRecentPanel={makeRecentPanel} showRecent={showRecent} setShowRecent={setShowRecent} fetchRecent={fetchRecent} recentList={recentList} recentLoading={recentLoading} />;
}

function MainApp({ makeRecentPanel, showRecent, setShowRecent, fetchRecent, recentList, recentLoading }) {
  const [step, setStep]     = useState(1);
  const [editingId, setEditingId] = useState(null); // ID del servicio en edición
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
  const trackable   = tasks.filter(t => !t.text?.startsWith("⚠"));
  const doneN  = trackable.filter(t => checked[t.id] || taskStatus[t.id]).length;
  const naN    = trackable.filter(t => taskStatus[t.id] === "na").length;
  const total  = trackable.length;
  const pct    = total ? Math.round(doneN / total * 100) : 0;
  const isComplete = pct === 100;
  const exDoneN = extras.reduce((n,e) => n + e.tasks.filter((_,i) => exChk[`${e.id}_${i}`]).length, 0);
  const exTotal = extras.reduce((n,e) => n + e.tasks.length, 0);

  const toggle   = id  => setChk(p => ({ ...p, [id]: !p[id] }));
  const toggleEx = id  => setExChk(p => ({ ...p, [id]: !p[id] }));
  const markAll  = ()  => {
    const newStatus = {};
    trackable.forEach(t => { newStatus[t.id] = "ok"; });
    setTaskStatus(p => ({ ...p, ...newStatus }));
  };
  const resetAll = ()  => {
    const u={}; tasks.forEach(t => u[t.id]=false); setChk(p=>({...p,...u}));
    setTaskStatus({}); setTaskIssue({}); setActiveIssue(null);
    setNotes(""); setMechName(""); setHasSig(false); setSigDate("");
    setModel(""); setModelSearch(""); setEngine(""); setPlate(""); setKm("");
    setSel("A"); setFuel("gasolina"); setIs4m(false);
    setTrelloStatus("idle"); setTrelloUrl(""); setClientUrl("");
    setTab("check"); setStep(1); setEditingId(null);
  };
  const addNote  = q   => setNotes(n => n ? n+"\n• "+q : "• "+q);

  const setStatus = (id, status, text, taskText) => {
    setTaskStatus(p => ({ ...p, [id]: status }));
    setChk(p => ({ ...p, [id]: true }));
    if (status === "ok") {
      setActiveIssue(null);
      if (taskIssue[id]) {
        setTaskIssue(p => { const n={...p}; delete n[id]; return n; });
      }
    }
    if (status === "issue") {
      setActiveIssue(id);
    }
    if (status === "na") {
      setActiveIssue(null);
      if (taskIssue[id]) {
        setTaskIssue(p => { const n={...p}; delete n[id]; return n; });
      }
    }
  };

  const confirmIssue = (id, taskText) => {
    const txt = taskIssue[id] || "";
    if (txt.trim()) {
      // Agregar a notas solo si no está ya incluido
      const line = `⚠️ ${taskText}: ${txt.trim()}`;
      setNotes(n => {
        if (n && n.includes(txt.trim())) return n; // evitar duplicados
        return n ? n + "\n• " + line : "• " + line;
      });
    }
    setTaskStatus(p => ({ ...p, [id]: "issue" }));
    setChk(p => ({ ...p, [id]: true }));
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
  const TRELLO_KEY    = import.meta.env.VITE_TRELLO_KEY;
  const TRELLO_TOKEN  = import.meta.env.VITE_TRELLO_TOKEN;
  const TRELLO_BOARD  = import.meta.env.VITE_TRELLO_BOARD;
  const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_KEY;

  const loadService = (s) => {
    // Cargar datos del vehículo
    setModel(s.modelo || "");
    setModelSearch(s.modelo || "");
    setEngine(s.motor || "");
    setPlate(s.placa || "");
    setKm(s.km || "");
    setFuel(s.combustible || "gasolina");
    setIs4m(s.traccion === "4MATIC");

    // Cargar código de servicio
    setSel(s.servicio_codigo || "A");

    // Cargar mecánico y notas
    setMechName(s.mecanico || "");
    setNotes(s.observaciones || "");

    // Reconstruir estados del checklist desde revisiones guardadas
    if (s.revisiones) {
      const newStatus = {};
      const newIssue  = {};
      Object.values(s.revisiones).flat().forEach(item => {
        // Buscar el task por texto para encontrar su id
        const taskId = Object.keys(ITEMS).flatMap(k =>
          ITEMS[k].tasks.map((t,i) => ({ id:`${k}_${i}`, text:t }))
        ).find(t => t.text === item.text)?.id;
        if (taskId && item.status && item.status !== "pending") {
          newStatus[taskId] = item.status;
          if (item.detail) newIssue[taskId] = item.detail;
        }
      });
      setTaskStatus(newStatus);
      setTaskIssue(newIssue);
    }

    // Marcar que estamos editando este servicio
    setEditingId(s.id);
    setShowRecent(false);
    setStep(3); // Ir directo al checklist
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const APP_URL       = import.meta.env.VITE_APP_URL || window.location.origin;

  const [trelloStatus, setTrelloStatus] = useState("idle");
  const [trelloUrl, setTrelloUrl]       = useState("");
  const [clientUrl, setClientUrl]       = useState("");

  // Genera el resumen para la tarjeta de Trello — solo puntos a atender
  const buildTrelloDesc = () => {
    const issueTasks  = tasks.filter(t => taskStatus[t.id] === "issue");
    const pendingTasks = tasks.filter(t => !taskStatus[t.id] && !checked[t.id] && !t.text?.startsWith("⚠"));

    let atenderSection = "";
    if (issueTasks.length > 0) {
      atenderSection += `### ⚠️ Detalles a atender\n`;
      issueTasks.forEach(t => {
        const detail = taskIssue[t.id] ? ` → ${taskIssue[t.id]}` : "";
        atenderSection += `⚠️ ${t.text}${detail}\n`;
      });
      atenderSection += "\n";
    }
    if (pendingTasks.length > 0) {
      atenderSection += `### ○ Sin revisar\n`;
      pendingTasks.forEach(t => { atenderSection += `○ ${t.text}\n`; });
      atenderSection += "\n";
    }
    if (!atenderSection) {
      atenderSection = "✅ _Todas las revisiones completadas sin observaciones._\n";
    }

    return `## 🚗 ${model || "Vehículo"} · Servicio ${sel}

| Campo | Detalle |
|-------|---------|
| **Placa** | ${plate || "—"} |
| **Motor** | ${engine || "—"} |
| **Kilometraje** | ${km ? parseInt(km).toLocaleString()+" km" : "—"} |
| **Combustible** | ${fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"}${is4m?" · ⚙️ 4MATIC":""} |
${oilLiters > 0 ? `| **Aceite** | 🛢️ ${oilLiters} L — ${oilSpec} |` : ""}
| **Mecánico** | ${mechName} |
| **Fecha** | ${sigDate} |

---

${atenderSection}
${notes ? "" : ""}
_Progreso: ${doneN}/${total} ítems (${pct}%)_`;
  };

  // Construye el objeto de datos del servicio para JSONBin
  const buildServiceData = () => {
    const byGrpMap = {};
    tasks.forEach(t => {
      if (!byGrpMap[t.grp]) byGrpMap[t.grp] = [];
      byGrpMap[t.grp].push({
        text: t.text,
        status: taskStatus[t.id] || (checked[t.id] ? "ok" : "pending"),
        detail: taskIssue[t.id] || null,
        outOfAssyst: t.outOfAssyst || false,
      });
    });
    return {
      taller: "Ramos y Ramos",
      fecha: sigDate,
      mecanico: mechName,
      servicio: { codigo: sel, descripcion: svc.desc },
      vehiculo: { modelo: model, motor: engine, placa: plate, km: km, combustible: fuel, traccion: is4m ? "4MATIC" : "RWD" },
      aceite: oilLiters > 0 ? { litros: oilLiters, especificacion: oilSpec } : null,
      revisiones: byGrpMap,
      observaciones: notes,
      pendientes: Object.entries(taskIssue).filter(([,v])=>v).map(([,v])=>v),
      progreso: { completadas: doneN, total },
    };
  };

  const sendToTrello = async () => {
    setTrelloStatus("sending");
    try {
      // 1. Guardar en Supabase → obtener ID único para el link del cliente
      let serviceId = null;
      let generatedClientUrl = "";
      try {
        const svcData = buildServiceData();

        // Generar slug legible: PLACA-SERVICIO-DDMMYYYY
        const now = new Date();
        const dd   = String(now.getDate()).padStart(2,"0");
        const mm   = String(now.getMonth()+1).padStart(2,"0");
        const yyyy = now.getFullYear();
        const plateClean = (plate || "XX").replace(/[^A-Z0-9]/gi,"").toUpperCase();
        const baseSlug = `${plateClean}-${sel}-${dd}${mm}${yyyy}`;
        // Sufijo corto para evitar duplicados (misma placa mismo día)
        const suffix = Math.random().toString(36).slice(2,5).toUpperCase();
        const slug = `${baseSlug}-${suffix}`;

        const sbRes = await fetch(
          editingId
            ? `${SUPABASE_URL}/rest/v1/servicios?id=eq.${editingId}`
            : `${SUPABASE_URL}/rest/v1/servicios`,
          {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
          },
          body: JSON.stringify({
            slug,
            placa:           plate,
            modelo:          svcData.vehiculo.modelo,
            motor:           svcData.vehiculo.motor,
            mecanico:        svcData.mecanico,
            fecha:           svcData.fecha,
            servicio_codigo: svcData.servicio.codigo,
            servicio_desc:   svcData.servicio.descripcion,
            km:              svcData.vehiculo.km,
            combustible:     svcData.vehiculo.combustible,
            traccion:        svcData.vehiculo.traccion,
            aceite_litros:   svcData.aceite?.litros || null,
            aceite_spec:     svcData.aceite?.especificacion || null,
            revisiones:      svcData.revisiones,
            observaciones:   svcData.observaciones,
            pendientes:      svcData.pendientes,
            progreso:        svcData.progreso,
          }),
        });
        const sbData = await sbRes.json();
        serviceId = sbData?.[0]?.id;
        if (serviceId) {
          generatedClientUrl = `${APP_URL}/servicio/${slug}`;
          setClientUrl(generatedClientUrl);
        }
      } catch(e) { console.warn("Supabase error:", e); }

      // 2. Obtener listas del tablero Trello
      const listsRes = await fetch(
        `https://api.trello.com/1/boards/${TRELLO_BOARD}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
      );
      const lists = await listsRes.json();
      let listId = lists[0]?.id;
      const preferred = lists.find(l =>
        l.name.toLowerCase().includes("prontos a salir") ||
        l.name.toLowerCase().includes("pronto a salir") ||
        l.name.toLowerCase().includes("prontos") ||
        l.name.toLowerCase().includes("trabajos prontos") ||
        l.name.toLowerCase().includes("listo para entregar") ||
        l.name.toLowerCase().includes("listo")
      );
      if (preferred) listId = preferred.id;

      // 3. Crear tarjeta en Trello con el link del cliente
      const clientLinkSection = generatedClientUrl
        ? `\n\n---\n\n## 💬 Mensaje para el cliente\n\nHola! Te compartimos el resumen de tu mantenimiento más reciente realizado en Taller Ramos y Ramos:\n${generatedClientUrl}`
        : "";

      const title = `🔧 ${model || "Vehículo"} | Placa: ${plate || "—"} | Servicio ${sel} | ${mechName}`;
      const desc  = buildTrelloDesc() + clientLinkSection;

      const cardRes = await fetch(
        `https://api.trello.com/1/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idList: listId, name: title, desc, due: null })
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

  /* ── PASO 1: DATOS DEL VEHÍCULO ── */
  if (step === 1) return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"monospace", color:"var(--text)" }}>

      {/* Overlay para cerrar el buscador — PRIMERO para que quede detrás */}
      {modelOpen && <div onClick={()=>setModelOpen(false)} style={{ position:"fixed", inset:0, zIndex:40, background:"transparent" }} />}

      {/* Header */}
      <div style={{ background:"var(--header)", borderBottom:`1px solid ${line}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:9 }}>
        <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"bold", letterSpacing:2, fontSize:13, color:"var(--text)" }}>RAMOS Y RAMOS</div>
          <div style={{ fontSize:9, color:"var(--sub)", letterSpacing:3 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
        </div>
        <button onClick={() => { setShowRecent(true); fetchRecent(); }} title="Mantenimientos recientes"
          style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
          🕐
        </button>
        <button className="theme-toggle" onClick={() => {
          const root = document.getElementById('root');
          const isLight = root.style.filter.includes('invert');
          if (isLight) { root.style.filter = ''; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = ''); try { localStorage.setItem('theme', 'dark'); } catch(e) {} }
          else { root.style.filter = 'invert(1) hue-rotate(180deg)'; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = 'invert(1) hue-rotate(180deg)'); try { localStorage.setItem('theme', 'light'); } catch(e) {} }
        }}>☀️</button>
      </div>

      {makeRecentPanel(showRecent, setShowRecent, recentList, recentLoading)}

      <div style={{ padding:"24px 16px", maxWidth:480, margin:"0 auto", width:"100%" }}>
        {/* Indicador de pasos */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:28 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:G, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold" }}>1</div>
          <div style={{ flex:1, height:2, background:line }} />
          <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${line}`, color:"#444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>2</div>
          <div style={{ flex:1, height:2, background:line }} />
          <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${line}`, color:"#444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>3</div>
        </div>

        <div style={{ fontSize:9, color:G, letterSpacing:3, marginBottom:16 }}>PASO 1 · DATOS DEL VEHÍCULO</div>

        {/* Buscador de modelo */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>MODELO <span style={{ color:"#f87171" }}>*</span></div>
          <div style={{ position:"relative", zIndex:50 }}>
            <input
              value={modelSearch}
              onChange={e => { setModelSearch(e.target.value); setModelOpen(true); }}
              onFocus={() => setModelOpen(true)}
              placeholder="🔍 Buscar — ej: C300, clase s, W204..."
              style={{ ...inp, width:"100%", boxSizing:"border-box" }}
            />
            {model && !modelOpen && (
              <div style={{ marginTop:4, fontSize:10, color:"#C8A96E" }}>✓ {model}</div>
            )}
            {modelOpen && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:card, border:`1px solid ${line}`, borderRadius:6, zIndex:50, maxHeight:260, overflowY:"auto", marginTop:2, boxShadow:"0 8px 24px #00000080" }}>
                {(() => {
                  const q = modelSearch.toLowerCase().trim();
                  const results = q ? smartSearch(q) : Object.entries(MODEL_GROUPS).flatMap(([grp, ms]) => ms.map(m => ({ m, grp })));
                  if (!results.length) return <div style={{ padding:"12px", fontSize:11, color:"#444", textAlign:"center" }}>Sin resultados</div>;
                  let lastGrp = null;
                  return results.map(({ m, grp }, i) => {
                    const showGrp = !q && grp && grp !== lastGrp;
                    lastGrp = grp;
                    return (
                      <div key={m+i}>
                        {showGrp && <div style={{ padding:"4px 10px 2px", fontSize:8, color:"#444", letterSpacing:2, background:"#0c0c12" }}>{grp.toUpperCase()}</div>}
                        <div onClick={() => { setModel(m); setEngine(""); setModelSearch(m); setModelOpen(false); }}
                          style={{ padding:"9px 12px", cursor:"pointer", borderBottom:`1px solid ${line}20`, fontSize:11, color:model===m?"#C8A96E":"#ccc", background:model===m?"#C8A96E08":"transparent" }}>
                          {m}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Motor */}
        {model && availableEngines.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>MOTOR</div>
            <select value={engine} onChange={e=>setEngine(e.target.value)} style={{ ...inp, width:"100%", boxSizing:"border-box" }}>
              <option value="">— Seleccionar motor —</option>
              {availableEngines.map(e => (
                <option key={e.name} value={e.name}>{e.name} · {e.oil}L</option>
              ))}
            </select>
          </div>
        )}

        {/* Badge de aceite — aparece al seleccionar motor */}
        {oilLiters > 0 && (
          <div style={{ marginBottom:12, padding:"12px 14px", borderRadius:8, background:"#C8A96E12", border:"1px solid #C8A96E40", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>🛢️</span>
            <div>
              <div style={{ fontSize:11, color:"#888", letterSpacing:1, marginBottom:2 }}>CAPACIDAD DE ACEITE</div>
              <div style={{ fontSize:20, fontWeight:"bold", color:"#C8A96E", lineHeight:1 }}>{oilLiters} L</div>
              <div style={{ fontSize:10, color:"#777", marginTop:3 }}>{oilSpec}</div>
            </div>
          </div>
        )}
        {isEV && engine && (
          <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:8, background:"#4ade8010", border:"1px solid #4ade8030", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <div style={{ fontSize:11, color:"#4ade80" }}>Vehículo eléctrico — sin aceite de motor</div>
          </div>
        )}

        {/* Placa */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>PLACA</div>
          <input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="Ej: ABC123" maxLength={8}
            style={{ ...inp, width:"100%", boxSizing:"border-box", letterSpacing:2, textTransform:"uppercase" }} />
        </div>

        {/* Kilometraje */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>KILOMETRAJE</div>
          <input value={km} onChange={e=>setKm(e.target.value.replace(/\D/g,""))} placeholder="Ej: 85000" type="text"
            style={{ ...inp, width:"100%", boxSizing:"border-box" }} />
        </div>

        <button
          onClick={() => { if (model) { setModelOpen(false); setStep(2); } }}
          disabled={!model}
          style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${model?G+"60":"#2a2a3a"}`, background:model?G+"18":"transparent", color:model?G:"#333", fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:model?"pointer":"default" }}>
          CONTINUAR → TIPO DE SERVICIO
        </button>
        {!model && <div style={{ textAlign:"center", fontSize:10, color:"#444", marginTop:8 }}>Seleccioná un modelo para continuar</div>}
      </div>
    </div>
  );

  /* ── PASO 2: TIPO DE SERVICIO ── */
  if (step === 2) return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"monospace", color:"var(--text)" }}>
      {/* Header con resumen del vehículo */}
      <div style={{ background:"var(--header)", borderBottom:`1px solid ${line}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:9 }}>
        <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"bold", letterSpacing:2, fontSize:13, color:"var(--text)" }}>RAMOS Y RAMOS</div>
          <div style={{ fontSize:9, color:"var(--sub)", letterSpacing:3 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
        </div>
        <button onClick={()=>setStep(1)} style={{ fontSize:10, color:"#555", background:"transparent", border:`1px solid ${line}`, borderRadius:6, padding:"4px 8px", cursor:"pointer", fontFamily:"monospace" }}>← Vehículo</button>
        <button onClick={() => { setShowRecent(true); fetchRecent(); }} title="Mantenimientos recientes"
          style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
          🕐
        </button>
        <button className="theme-toggle" onClick={() => {
          const root = document.getElementById('root');
          const isLight = root.style.filter.includes('invert');
          if (isLight) { root.style.filter = ''; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = ''); try { localStorage.setItem('theme', 'dark'); } catch(e) {} }
          else { root.style.filter = 'invert(1) hue-rotate(180deg)'; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = 'invert(1) hue-rotate(180deg)'); try { localStorage.setItem('theme', 'light'); } catch(e) {} }
        }}>☀️</button>
      </div>

      {makeRecentPanel(showRecent, setShowRecent, recentList, recentLoading)}

      {/* Resumen vehículo seleccionado */}
      <div style={{ padding:"10px 16px", background:"#0c0c14", borderBottom:`1px solid ${line}` }}>
        <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:4 }}>VEHÍCULO SELECCIONADO</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ color:"#C8A96E", fontWeight:"bold", fontSize:12 }}>{model.split("(")[0].trim()}</span>
          {engine && <span style={{ fontSize:10, color:"#888" }}>· {engine}</span>}
          {plate && <span style={{ fontSize:10, background:"#1a1a2a", border:`1px solid ${line}`, borderRadius:4, padding:"1px 7px", letterSpacing:2, color:"#aaa" }}>{plate}</span>}
          {km && <span style={{ fontSize:10, color:"#555" }}>{parseInt(km).toLocaleString()} km</span>}
        </div>
      </div>

      <div style={{ padding:"24px 16px", maxWidth:480, margin:"0 auto", width:"100%" }}>
        {/* Indicador de pasos */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:28 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"#4ade80", color:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold" }}>✓</div>
          <div style={{ flex:1, height:2, background:G }} />
          <div style={{ width:28, height:28, borderRadius:"50%", background:G, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold" }}>2</div>
          <div style={{ flex:1, height:2, background:line }} />
          <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${line}`, color:"#444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>3</div>
        </div>

        <div style={{ fontSize:9, color:G, letterSpacing:3, marginBottom:16 }}>PASO 2 · TIPO DE SERVICIO</div>

        {/* Selector de código de servicio */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:10 }}>CÓDIGO DE SERVICIO ASSYST <span style={{ color:"#f87171" }}>*</span></div>
          <div style={{ fontSize:9, color:"#C8A96E80", letterSpacing:2, marginBottom:6 }}>SERIE A — INSPECCIÓN MENOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            {A_KEYS.map(k => { const s=CODES[k],on=sel===k; return (
              <button key={k} onClick={()=>setSel(k)}
                style={{ padding:"7px 12px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":"transparent", color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:on?"bold":"normal" }}>
                {k}
              </button>
            );})}
          </div>
          <div style={{ fontSize:9, color:"#7EB8F780", letterSpacing:2, marginBottom:6 }}>SERIE B — INSPECCIÓN MAYOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {B_KEYS.map(k => { const s=CODES[k],on=sel===k; return (
              <button key={k} onClick={()=>setSel(k)}
                style={{ padding:"7px 12px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":"transparent", color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:on?"bold":"normal" }}>
                {k}
              </button>
            );})}
          </div>
          {svc && <div style={{ marginTop:8, fontSize:10, color:"#888" }}>{svc.desc}</div>}
        </div>

        {/* Combustible */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:8 }}>COMBUSTIBLE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["gasolina","⛽ Gasolina"],["diesel","🛢️ Diesel"]].map(([v,lbl])=>(
              <button key={v} onClick={()=>setFuel(v)}
                style={{ flex:1, padding:"10px", borderRadius:6, border:`1px solid ${fuel===v?"#C8A96E60":line}`, background:fuel===v?"#C8A96E15":"transparent", color:fuel===v?"#C8A96E":"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:fuel===v?"bold":"normal" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* 4MATIC */}
        <div style={{ marginBottom:28 }}>
          <button onClick={()=>setIs4m(p=>!p)}
            style={{ width:"100%", padding:"10px", borderRadius:6, border:`1px solid ${is4m?"#4ade8050":line}`, background:is4m?"#4ade8010":"transparent", color:is4m?"#4ade80":"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", textAlign:"left" }}>
            {is4m?"✓":"○"} Tracción 4MATIC
          </button>
        </div>

        <button onClick={()=>setStep(3)}
          style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${G}60`, background:G+"18", color:G, fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:"pointer" }}>
          INICIAR INSPECCIÓN →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"monospace", color:"var(--text)" }}>
      {/* Overlay para cerrar el buscador */}
      {modelOpen && <div onClick={()=>setModelOpen(false)} style={{ position:"fixed", inset:0, zIndex:40 }} />}

      {/* HEADER */}
      <div style={{ background:"var(--header)", borderBottom:`1px solid var(--line)`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:9 }}>
        <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, objectFit:"cover" }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"bold", letterSpacing:2, fontSize:13, color:"var(--text)" }}>RAMOS Y RAMOS</div>
          <div style={{ fontSize:9, color:"var(--sub)", letterSpacing:3 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
        </div>
        {editingId && (
          <div style={{ fontSize:9, padding:"3px 8px", borderRadius:10, background:"#1a1a0a", border:"1px solid #C8A96E50", color:"#C8A96E", letterSpacing:1 }}>
            ✏️ EDITANDO
          </div>
        )}
        {!editingId && doneN > 0 && (
          <div style={{ fontSize:10, padding:"3px 11px", borderRadius:20, border:`1px solid ${isComplete?"#4ade80":G}`, color:isComplete?"#4ade80":G, background:isComplete?"#14532d":"#1a1a2a" }}>
            {isComplete ? "✓ COMPLETO" : pct+"%"}
          </div>
        )}
        <button onClick={() => { setShowRecent(true); fetchRecent(); }} title="Mantenimientos recientes"
          style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
          🕐
        </button>
        <button className="theme-toggle" onClick={() => {
          const root = document.getElementById('root');
          const isLight = root.style.filter.includes('invert');
          if (isLight) {
            root.style.filter = '';
            root.querySelectorAll('img, canvas').forEach(el => el.style.filter = '');
            try { localStorage.setItem('theme', 'dark'); } catch(e) {}
          } else {
            root.style.filter = 'invert(1) hue-rotate(180deg)';
            root.querySelectorAll('img, canvas').forEach(el => el.style.filter = 'invert(1) hue-rotate(180deg)');
            try { localStorage.setItem('theme', 'light'); } catch(e) {}
          }
        }}>
          ☀️
        </button>
      </div>

      {makeRecentPanel(showRecent, setShowRecent, recentList, recentLoading)}

      {/* RESUMEN COMPACTO — vehículo + servicio seleccionados */}
      <div style={{ padding:"8px 16px", background:"#0c0c14", borderBottom:`1px solid ${line}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{model.split("(")[0].trim()}</span>
            {plate && <span style={{ color:"#aaa", letterSpacing:1 }}>· {plate}</span>}
            <span style={{ fontSize:10, background:G+"20", border:`1px solid ${G}40`, color:G, borderRadius:4, padding:"1px 7px" }}>{sel}</span>
            <span style={{ fontSize:10, color:"#555" }}>{fuel==="diesel"?"🛢️":"⛽"}{is4m?" · 4MATIC":""}</span>
          </div>
          <button onClick={()=>setStep(2)} style={{ fontSize:10, color:"#555", background:"transparent", border:`1px solid ${line}`, borderRadius:6, padding:"3px 7px", cursor:"pointer", fontFamily:"monospace", flexShrink:0 }}>✏️ editar</button>
        </div>
        {oilLiters > 0 && (
          <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:6, background:"#C8A96E10", border:"1px solid #C8A96E30" }}>
            <span style={{ fontSize:14 }}>🛢️</span>
            <span style={{ fontSize:12, fontWeight:"bold", color:"#C8A96E" }}>{oilLiters} L</span>
            <span style={{ fontSize:10, color:"#888" }}>{oilSpec}</span>
          </div>
        )}
      </div>

      {/* MINI BAR en pestaña Notas */}
      {tab === "notes" && (
        <div style={{ padding:"8px 16px", borderBottom:`1px solid ${line}`, background:"var(--datos)", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
          onClick={() => setTab("check")}>
          <div style={{ fontSize:11, color:"#888", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{model.split("(")[0].trim()}</span>
            {plate && <span style={{ color:"#aaa", letterSpacing:1 }}>· {plate}</span>}
            <span style={{ fontSize:10, background:"#C8A96E20", border:"1px solid #C8A96E40", color:"#C8A96E", borderRadius:4, padding:"1px 6px" }}>{sel}</span>
          </div>
          <span style={{ fontSize:10, color:"#555" }}>📋 checklist</span>
        </div>
      )}

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
                    const status  = taskStatus[id]; // "ok" | "issue" | "na" | undefined
                    const isInfo  = text.startsWith("⚠");
                    const isOpen  = activeIssue === id;
                    const rowBg   = status==="ok"    ? "#0a1a0a"
                                  : status==="issue" ? "#1a0a0a"
                                  : status==="na"    ? "#0c0c0c"
                                  : isInfo ? "#0c0c12" : card;
                    const rowBdr  = status==="ok"    ? "#4ade8040"
                                  : status==="issue" ? "#f8717140"
                                  : status==="na"    ? "#33333360"
                                  : line;
                    return (
                      <div key={id} style={{ marginBottom: isOpen ? 8 : 3 }}>
                        {/* Fila principal */}
                        <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 10px", borderRadius: isOpen?"6px 6px 0 0":6, background:rowBg, border:`1px solid ${rowBdr}`, userSelect:"none", opacity:isInfo?0.55:1 }}>
                          {isInfo
                            ? <span style={{ fontSize:11, color:"#666", flexShrink:0, marginTop:2 }}>ℹ</span>
                            : <span style={{ fontSize:12, color: status==="ok"?"#4ade80": status==="issue"?"#f87171": status==="na"?"#555":"#555", flexShrink:0, marginTop:2, width:14, textAlign:"center" }}>
                                {status==="ok" ? "✓" : status==="issue" ? "!" : status==="na" ? "—" : "·"}
                              </span>
                          }
                          <span style={{ flex:1, fontSize:12, color: status==="ok"?"#4a6a4a": status==="issue"?"#8a4a4a": status==="na"?"#444":isInfo?"#666":"#ccc", textDecoration: status==="ok"||status==="na" ? "line-through":"none", lineHeight:1.5 }}>{text}</span>

                          {/* Botones OK / Detalle / N/A */}
                          {!isInfo && (
                            <div style={{ display:"flex", gap:4, flexShrink:0, marginTop:1 }}>
                              <button
                                onClick={()=> status==="ok" ? (setTaskStatus(p=>({...p,[id]:undefined})), setChk(p=>({...p,[id]:false}))) : setStatus(id,"ok","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="ok"?"#4ade8060":"#2a3a2a"}`, background:status==="ok"?"#4ade8020":"transparent", color:status==="ok"?"#4ade80":"#3a5a3a", fontWeight:status==="ok"?"bold":"normal" }}
                              >✓ OK</button>
                              <button
                                onClick={()=> status==="issue" && !isOpen ? setActiveIssue(id) : setStatus(id,"issue","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="issue"?"#f8717160":"#3a2a2a"}`, background:status==="issue"?"#f8717120":"transparent", color:status==="issue"?"#f87171":"#5a3a3a", fontWeight:status==="issue"?"bold":"normal" }}
                              >⚠ Det.</button>
                              <button
                                onClick={()=> status==="na" ? (setTaskStatus(p=>({...p,[id]:undefined})), setChk(p=>({...p,[id]:false}))) : setStatus(id,"na","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="na"?"#55555560":"#2a2a2a"}`, background:status==="na"?"#33333320":"transparent", color:status==="na"?"#666":"#3a3a3a", fontWeight:status==="na"?"bold":"normal" }}
                              >— N/A</button>
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

            {/* BOTÓN CONTINUAR */}
            <button
              onClick={() => { setTab("notes"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${G}60`, background:`linear-gradient(135deg, ${G}20, ${G}10)`, color:G, fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:"pointer", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              📝 CONTINUAR → NOTAS Y FIRMA
            </button>
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
                <div>✅ Progreso ASSYST: <span style={{ color:isComplete?"#4ade80":G }}>{doneN}/{total} ({pct}%)</span>{naN > 0 && <span style={{ color:"#555", fontSize:10 }}> · {naN} N/A</span>}</div>
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
                      {trelloStatus==="sending" ? "⏳ Enviando..." : editingId ? "💾 Actualizar en Trello" : "📋 Enviar resumen a Trello"}
                    </button>
                  )}

                  <button onClick={()=>{ clearSig(); resetAll(); window.scrollTo({top:0,behavior:"smooth"}); }} style={{ width:"100%", padding:"10px", borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
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
