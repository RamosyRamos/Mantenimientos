// SECURITY DEBT: The ordenes table has an open RLS policy ("acceso_app" — public ALL).
// This means the anon key can read/write/delete any row. Same situation likely exists for
// other tables (cotizaciones, clientes, finanzas, etc).
//
// TODO: Migrate to Supabase Auth + role-based RLS policies. Planned for next weekend's session.
// Until then, the app trusts client-side discipline. Do NOT expose this app's anon key beyond
// what's already in the bundle, and do NOT enable public sign-up.

import { useState, useEffect, useRef } from "react";
import imageCompression from 'browser-image-compression';

// ─── ÍTEMS ASSYST ─────────────────────────────────────────────────────────
const DEFAULT_ITEMS = {
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
    "-",
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
const DEFAULT_CODES = {
  "A":  { color:"#C8A96E", desc:"Inspección menor + aceite",                              items:["1","3"] },
  "A0": { color:"#C8A96E", desc:"A + techo corredizo",                                    items:["1","3","10"] },
  "A1": { color:"#D4A030", desc:"A + líquido de frenos",                                  items:["1","3","4"] },
  "A2": { color:"#C8A020", desc:"A + frenos + techo corredizo",                           items:["1","3","4","10"] },
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
  "BF": { color:"#B88A00", desc:"B + frenos + filtro aire + bujías + ATF",               items:["2","3","4","8","12","20"], fuelLock:"gasolina" },
  "BH": { color:"#34D399", desc:"B + refrigerante",                                      items:["2","3","13"] },
  "BK": { color:"#10B981", desc:"B + frenos + refrigerante",                             items:["2","3","4","13"] },
  "BS": { color:"#059669", desc:"B + techo + refrigerante + ATF",                        items:["2","3","10","13","20"] },
};

const DEFAULT_A_KEYS = ["A","A0","A1","A2","A3","A4","A5","A6","A7","A8","A9","AC","AF","AG","AH","AK"];
const DEFAULT_B_KEYS = ["B","B0","B1","B2","B3","B4","B5","B6","B7","B8","B9","BC","BD","BE","BF","BH","BK","BS"];

// ─── REVISIONES ADICIONALES FUERA DEL ASSYST ─────────────────────────────
// fuel: "all" | "gasolina" | "diesel"
const EXTRAS = [
  {
    id:"EX_BAT", fuel:"all", icon:"🔋", label:"Batería 12V",
    interval:"-",
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
    interval:"-",
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
    interval:"-",
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
    interval:"-",
    tasks:[
      "Inspección de la válvula EGR con Star Diagnosis (apertura y cierre)",
      "Limpieza del conducto de admisión y válvula si hay depósitos",
      "Inspección del enfriador de EGR — fugas de refrigerante hacia admisión",
      "⚠ Marcha irregular, humo excesivo o pérdida de potencia = síntomas de EGR",
    ]
  },
  {
    id:"EX_DPF", fuel:"diesel", icon:"🌫️", label:"Filtro de partículas DPF / FAP — Diesel",
    interval:"-",
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

// ─── DB loaders (Sub-fase 2B) ────────────────────────────────────────────
let _modelsCache = null
let _modelsCachePromise = null

function extractEngineCode(nombre) {
  return nombre.match(/\(([^()]+)\)(?:\s+\d{4}[-–]\d{4})?\s*$/)?.[1] ?? nombre
}

function extractYearRange(nombre) {
  return nombre.match(/\(([^()]+)\)\s+(\d{4}[-–]\d{4})\s*$/)?.[2] ?? null
}

function buildEntriesFromSource(rawGrouped) {
  const out = {}
  for (const [cat, items] of Object.entries(rawGrouped)) {
    const chassis = cat.match(/\(([^()]+)\)(?:\s+\d{4}[-–]\d{4})?\s*$/)?.[1] ?? ''
    for (const item of items) {
      const nombre     = item.nombre ?? item.name ?? ''
      const fuel       = item.combustible ?? item.fuel ?? 'gasolina'
      const oil        = item.aceite_lt ?? item.oil ?? null
      const spec       = item.especif_mb ?? item.spec ?? ''
      const clase      = item.clase ?? null
      const engineMatch = nombre.match(/\(([^()]+)\)(?:\s+(\d{4}[-–]\d{4}))?\s*$/)
      const engineCode  = engineMatch?.[1] ?? nombre
      const yearRange   = engineMatch?.[2] ?? null
      const trimPart    = nombre.replace(/\s*\([^()]+\)(?:\s+\d{4}[-–]\d{4})?\s*$/, '').trim() || nombre
      const rawTrims   = trimPart.split(' / ').map(t => t.trim()).filter(Boolean)
      const trims = []
      let lastPrefix = ''
      for (const t of rawTrims) {
        const prefixMatch = t.match(/^([A-Za-z][A-Za-z\/]*)/)
        const hasDigitAfter = prefixMatch && /\d/.test(t.slice(prefixMatch[0].length))
        if (prefixMatch && hasDigitAfter) {
          lastPrefix = prefixMatch[1]
          trims.push(t)
        } else if (/^\d/.test(t) && lastPrefix) {
          trims.push(`${lastPrefix} ${t}`)
        } else {
          trims.push(t)
        }
      }
      for (const trim of trims) {
        const trimLabel = yearRange ? `${trim} (${yearRange})` : trim
        const groupKey = clase ?? cat
        if (!out[groupKey]) out[groupKey] = []
        out[groupKey].push({
          display:     chassis ? `${trimLabel} · ${chassis}` : trimLabel,
          version:     trim,
          motor:       engineCode,
          combustible: fuel,
          aceite_lt:   oil != null ? Number(oil) : null,
          especif_mb:  spec,
          categoria:   cat,
        })
      }
    }
  }
  return out
}

function buildModelsFromRows(rows) {
  const modelData = {}
  const modelGroups = {}
  const groupedForEntries = {}
  for (const r of rows) {
    if (!modelData[r.categoria]) modelData[r.categoria] = []
    const code = extractEngineCode(r.nombre)
    if (!modelData[r.categoria].some(e => e.name === code)) {
      modelData[r.categoria].push({
        name: code,
        fuel: r.combustible,
        oil: r.aceite_lt != null ? Number(r.aceite_lt) : null,
        spec: r.especif_mb,
      })
    }
    if (!modelGroups[r.clase]) modelGroups[r.clase] = []
    if (!modelGroups[r.clase].includes(r.categoria)) {
      modelGroups[r.clase].push(r.categoria)
    }
    if (!groupedForEntries[r.categoria]) groupedForEntries[r.categoria] = []
    groupedForEntries[r.categoria].push({ ...r })
  }
  const modelEntries = buildEntriesFromSource(groupedForEntries)
  return { modelData, modelGroups, modelEntries }
}

function loadModelsFromDB() {
  if (_modelsCache) return Promise.resolve(_modelsCache)
  if (_modelsCachePromise) return _modelsCachePromise
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/vehiculos_modelos?activo=eq.true&select=clase,categoria,nombre,combustible,aceite_lt,especif_mb,orden&order=clase.asc,categoria.asc,orden.asc`
  _modelsCachePromise = fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
    },
  })
    .then(r => r.ok ? r.json() : null)
    .then(rows => {
      if (!rows?.length) return null
      _modelsCache = buildModelsFromRows(rows)
      return _modelsCache
    })
    .catch(() => null)
  return _modelsCachePromise
}

async function loadVehiculoByPlaca(placa) {
  if (!placa) return null
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/vehiculos?patente=eq.${encodeURIComponent(placa.toUpperCase())}&select=motor,combustible,aceite_lt,especif_mb,version,modelo&limit=1`
    const res = await fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data[0] || null
  } catch {
    return null
  }
}

// ─── MODELOS + MOTORES + ACEITE ──────────────────────────────────────────
// fuel: "gasolina" | "diesel" | "electrico"
// oil: litros con filtro
// spec: especificación MB recomendada
const MODEL_DATA = {
  // ── A-Class ──────────────────────────────────────────────────────────────────
  "A-Class (W168) 1997-2004": [
    { name:"A 140 / A 160 (M166 1.4-1.6)", fuel:"gasolina", oil:4.5, spec:"MB 229.1 / 229.3" },
    { name:"A 190 (M166 1.9)", fuel:"gasolina", oil:4.5, spec:"MB 229.1 / 229.3" },
    { name:"A 160 CDI / A 170 CDI (OM668)", fuel:"diesel", oil:4.5, spec:"MB 229.1" },
    { name:"A 210 AMG (M166 2.1)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
  ],
  "A-Class (W169 / C169) 2004-2012": [
    { name:"A 150 (M266 1.5)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 170 (M266 1.7)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 200 (M266 2.0)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"A 200 Turbo (M266 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.3 / 229.5" },
    { name:"A 160 CDI / A 180 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
    { name:"A 200 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
  ],
  "A-Class (W176) 2012-2018": [
    { name:"A 160 / A 180 / A 200 (M270 1.6-2.0T)", fuel:"gasolina", oil:5.8, spec:"MB 229.5 / 229.52" },
    { name:"A 180 CDI / A 200 CDI / A 220 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"A 250 (M270 2.0T)", fuel:"gasolina", oil:5.8, spec:"MB 229.52" },
    { name:"A 45 AMG 4MATIC (M133 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  "A-Class Hatchback / Sedan (W177)": [
    { name:"A 180 / A 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"A 220 / A 250 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"A 180d / A 200d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"A 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"A 45 / A 45S AMG 4MATIC (M139 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  // ── AMG GT ───────────────────────────────────────────────────────────────────
  "AMG GT Coupé / Roadster (C190 / R190)": [
    { name:"AMG GT / GTS (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.5 / 229.52" },
    { name:"AMG GT R / GT R Pro (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"AMG GT C (M178 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG GT 4-Door Coupé (X290)": [
    { name:"AMG GT 43 / GT 53 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"AMG GT 63 / GT 63S 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG GT Coupé (C192)": [
    { name:"AMG GT 43 / GT 53 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"AMG GT 63 / GT 63S 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
    { name:"AMG GT 63 SE Performance (M177 PHEV)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "AMG ONE (C298)": [
    { name:"AMG ONE (1.6 F1 híbrido)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
  ],
  "AMG SL (R232)": [
    { name:"SL 43 AMG (M139 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.52" },
    { name:"SL 55 AMG 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"SL 63 AMG 4MATIC+ (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  // ── B-Class ──────────────────────────────────────────────────────────────────
  "B-Class (W245) 2005-2011": [
    { name:"B 150 / B 170 (M266 1.5-1.7)", fuel:"gasolina", oil:5.0, spec:"MB 229.3" },
    { name:"B 200 / B 200 Turbo (M266 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.3" },
    { name:"B 180 CDI / B 200 CDI (OM640 2.0D)", fuel:"diesel", oil:4.5, spec:"MB 229.3" },
  ],
  "B-Class (W246) 2011-2018": [
    { name:"B 180 / B 200 (M270 1.6-2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.5 / 229.52" },
    { name:"B 180 CDI / B 200 CDI / B 220 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51 / 229.52" },
    { name:"B 250 (M270 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
    { name:"B 250e (híbrido eléctrico)", fuel:"gasolina", oil:5.5, spec:"MB 229.52" },
  ],
  // ── B-Class ──────────────────────────────────────────────────────────────────
  "B-Class (W247)": [
    { name:"B 180 / B 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"B 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"B 180d / B 200d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"B 250e (híbrido enchufable)", fuel:"gasolina", oil:5.1, spec:"MB 229.52" },
  ],
  // ── C-Class / 190 ────────────────────────────────────────────────────────────
  "C-Class / 190 (W201) 1982-1993": [
    { name:"190 E 1.8 / 2.0 / 2.3 (M102)", fuel:"gasolina", oil:5.5, spec:"MB 229.0 / 229.1" },
    { name:"190 E 2.5-16 / 2.3-16 (M102 16v)", fuel:"gasolina", oil:6.0, spec:"MB 229.1" },
    { name:"190 D / 190 D 2.5 (OM601/OM602)", fuel:"diesel", oil:5.5, spec:"MB 229.0" },
  ],
  "C-Class (W202) 1993-2000": [
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
  "C-Class (W203) 2001-2007": [
    { name:"C 180 / C 200 Kompressor (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"C 230 / C 280 / C 350 (M272 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"C 220 CDI / C 270 CDI (OM611/OM612)", fuel:"diesel", oil:6.0, spec:"MB 229.3" },
    { name:"C 30 CDI AMG (OM612 turbo)", fuel:"diesel", oil:6.5, spec:"MB 229.3" },
    { name:"C 32 AMG (M112 supercharged)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"C 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "C-Class Sedan / Estate (W204 / S204) 2007-2014": [
    { name:"C 180 / C 200 CGI Kompressor (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"C 230 / C 280 / C 300 (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"C 350 (M272 3.5 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"C 220 CDI / C 250 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"C 300 CDI / C 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"C 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
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
  // ── CL-Class ─────────────────────────────────────────────────────────────────
  "CL-Class (C215) 1998-2006": [
    { name:"CL 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"CL 600 (M137 5.8 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.3 / 229.5" },
    { name:"CL 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"CL 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "CL-Class (C216) 2006-2014": [
    { name:"CL 500 / CL 550 (M273/M278 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CL 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"CL 63 AMG (M156/M157)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CL 65 AMG (M275/M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  // ── CLA ──────────────────────────────────────────────────────────────────────
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
  // ── CLE ──────────────────────────────────────────────────────────────────────
  "CLE Coupé / Cabriolet (C236 / A236)": [
    { name:"CLE 200 / CLE 300 (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"CLE 220d / CLE 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"CLE 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
  ],
  // ── CLK-Class ────────────────────────────────────────────────────────────────
  "CLK-Class (C208) 1997-2003": [
    { name:"CLK 200 / CLK 230 Kompressor (M111)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"CLK 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"CLK 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
    { name:"CLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
  ],
  "CLK-Class (C209) 2002-2009": [
    { name:"CLK 200 / CLK 240 (M271/M112)", fuel:"gasolina", oil:6.0, spec:"MB 229.3 / 229.5" },
    { name:"CLK 280 / CLK 320 (M272/M112 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLK 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLK 500 (M273 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLK 220 CDI / CLK 270 CDI (OM646/OM612)", fuel:"diesel", oil:6.0, spec:"MB 229.3" },
    { name:"CLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLK 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── CLS-Class ────────────────────────────────────────────────────────────────
  "CLS-Class (C219) 2004-2010": [
    { name:"CLS 300 / CLS 350 (M272 3.0-3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLS 500 / CLS 550 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 320 CDI / CLS 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"CLS 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "CLS-Class (C218) 2010-2017": [
    { name:"CLS 300 / CLS 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"CLS 500 / CLS 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"CLS 220 CDI / CLS 250 CDI (OM651)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"CLS 350 CDI / CLS 350 BlueTEC (OM642)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"CLS 63 AMG / CLS 63S AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── E-Class ──────────────────────────────────────────────────────────────────
  "E-Class (W114 / W115) 1968-1976": [
    { name:"200 / 220 (M115 2.0-2.2)", fuel:"gasolina", oil:5.5, spec:"MB 229.0" },
    { name:"230 / 250 (M115/M114 2.3-2.5)", fuel:"gasolina", oil:5.5, spec:"MB 229.0" },
    { name:"280 / 280 C (M110 2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"200 D / 220 D / 240 D (OM615/OM616)", fuel:"diesel", oil:5.5, spec:"MB 229.0" },
    { name:"300 D (OM617 3.0D)", fuel:"diesel", oil:6.5, spec:"MB 229.0" },
  ],
  "E-Class (W123) 1976-1984": [
    { name:"200 / 230 E (M115/M102 2.0-2.3)", fuel:"gasolina", oil:5.5, spec:"MB 229.0" },
    { name:"250 / 280 E (M123/M110 2.5-2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"300 D / 300 TD (OM617 3.0D)", fuel:"diesel", oil:6.5, spec:"MB 229.0" },
    { name:"230 CE / 280 CE Coupé", fuel:"gasolina", oil:6.0, spec:"MB 229.0" },
  ],
  "E-Class (W124) 1984-1996": [
    { name:"E 200 / 230 E (M102 2.0-2.3)", fuel:"gasolina", oil:6.0, spec:"MB 229.1" },
    { name:"E 260 / 280 E (M103 2.6-2.8)", fuel:"gasolina", oil:7.5, spec:"MB 229.1" },
    { name:"E 320 (M104 3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"E 420 (M119 4.2 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.1" },
    { name:"E 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.1" },
    { name:"E 300 D / E 300 TD (OM606 3.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.1" },
    { name:"E 60 AMG (M119 6.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1" },
  ],
  "E-Class (W210) 1995-2002": [
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
  "E-Class (W211 / S211) 2002-2009": [
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
  "E-Class Sedan / Estate (W212 / S212) 2009-2016": [
    { name:"E 200 / E 250 CGI (M271/M274 1.8-2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"E 300 / E 350 (M276 3.0-3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 400 / E 500 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"E 200 CDI / E 220 CDI / E 250 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"E 300 CDI / E 350 CDI / E 350 BlueTEC (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
    { name:"E 63 AMG / E 63S AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "E-Class Coupé / Cabriolet (C207 / A207) 2009-2016": [
    { name:"E 200 / E 250 CGI (M271/M274)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"E 300 / E 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 500 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"E 220 CDI / E 350 CDI (OM651/OM642)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"E 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
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
  "E-Class Coupé / Cabriolet (C238 / A238)": [
    { name:"E 200 / E 300 (M274 2.0T)", fuel:"gasolina", oil:6.5, spec:"MB 229.5 / 229.52" },
    { name:"E 220d / E 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52" },
    { name:"E 400 (M276 3.0 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"E 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"E 63 / E 63S AMG S (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  "E-Class Sedan / Estate (W214 / S214)": [
    { name:"E 200 / E 300 (M254 2.0T)", fuel:"gasolina", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"E 220d / E 300d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"E 300e / E 300de (híbrido enchufable)", fuel:"gasolina", oil:6.0, spec:"MB 229.52" },
    { name:"E 450 4MATIC (M256 3.0T)", fuel:"gasolina", oil:9.9, spec:"MB 229.52" },
    { name:"E 53 AMG 4MATIC+ (M256 3.0T)", fuel:"gasolina", oil:8.5, spec:"MB 229.52" },
    { name:"E 63 / E 63S AMG S (M177 4.0 V8T)", fuel:"gasolina", oil:9.0, spec:"MB 229.52" },
  ],
  // ── EQ Eléctricos ────────────────────────────────────────────────────────────
  "EQE SUV (X294)": [
    { name:"EQE 300 / EQE 350 / EQE 500 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQE 43 / AMG EQE 53 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
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
  // ── G-Class ──────────────────────────────────────────────────────────────────
  "G-Class (W460) 1979-1991": [
    { name:"230 G / 240 GD (M115/OM616)", fuel:"gasolina", oil:5.5, spec:"MB 229.0" },
    { name:"280 GE (M110 2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"300 GD (OM617 3.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.0" },
  ],
  "G-Class (W463)": [
    { name:"G 300 D / G 320 (OM606/M112 3.0-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"G 300 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"G 350 d (OM642 3.0D V6)", fuel:"diesel", oil:9.0, spec:"MB 229.51 / 229.52" },
    { name:"G 400 CDI (OM628 4.0D V8)", fuel:"diesel", oil:9.0, spec:"MB 229.51" },
    { name:"G 500 (M113 5.0 V8) 1998-2012", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"G 500 (M273 5.5 V8) 2012-2018", fuel:"gasolina", oil:9.0, spec:"MB 229.3 / 229.5" },
    { name:"G 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"G 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"G 65 AMG (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "G-Class (W464)": [
    { name:"G 400d (OM656 3.0D)", fuel:"diesel", oil:9.0, spec:"MB 229.52" },
    { name:"G 500 (M176 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
    { name:"G 63 AMG (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
  // ── GLA ──────────────────────────────────────────────────────────────────────
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
  // ── GLB ──────────────────────────────────────────────────────────────────────
  "GLB (X247)": [
    { name:"GLB 180 / GLB 200 (M282 1.3T)", fuel:"gasolina", oil:5.1, spec:"MB 229.52 / 229.61" },
    { name:"GLB 220 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52 / 229.61" },
    { name:"GLB 200d / GLB 220d (OM654 2.0D)", fuel:"diesel", oil:6.0, spec:"MB 229.52 / 229.61" },
    { name:"GLB 35 AMG 4MATIC (M260 2.0T)", fuel:"gasolina", oil:5.0, spec:"MB 229.52" },
  ],
  // ── GLC ──────────────────────────────────────────────────────────────────────
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
  // ── GL-Class ─────────────────────────────────────────────────────────────────
  "GL-Class (X164) 2006-2012": [
    { name:"GL 320 CDI / GL 350 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"GL 450 / GL 500 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"GL 420 CDI (OM629 4.0D V8)", fuel:"diesel", oil:9.0, spec:"MB 229.51" },
    { name:"GL 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "GL-Class / GLS (X166) 2012-2015": [
    { name:"GL/GLS 320 CDI / 350d (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"GL/GLS 350 (M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GL/GLS 450 / 500 / 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"GL/GLS 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── GLS ──────────────────────────────────────────────────────────────────────
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
  // ── GLK-Class ────────────────────────────────────────────────────────────────
  "GLK-Class (X204) 2008-2015": [
    { name:"GLK 200 CDI / GLK 220 CDI (OM651 2.1D)", fuel:"diesel", oil:6.0, spec:"MB 229.51" },
    { name:"GLK 250 (M274 2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"GLK 300 / GLK 350 (M272/M276 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"GLK 350 CDI (OM642 3.0D)", fuel:"diesel", oil:7.5, spec:"MB 229.51" },
  ],
  // ── GLE / M-Class ────────────────────────────────────────────────────────────
  "M-Class (W163) 1997-2004": [
    { name:"ML 230 (M111 2.3)", fuel:"gasolina", oil:5.5, spec:"MB 229.3" },
    { name:"ML 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"ML 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"ML 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
    { name:"ML 270 CDI (OM612 2.7D)", fuel:"diesel", oil:6.5, spec:"MB 229.3" },
    { name:"ML 400 CDI (OM628 4.0D V8)", fuel:"diesel", oil:8.5, spec:"MB 229.3" },
    { name:"ML 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3" },
  ],
  "M-Class (W164) 2005-2011": [
    { name:"ML 280 CDI / ML 320 CDI (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"ML 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"ML 500 / ML 550 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"ML 420 CDI (OM629 4.0D V8)", fuel:"diesel", oil:9.0, spec:"MB 229.51" },
    { name:"ML 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  "M-Class / GLE (W166) 2011-2015": [
    { name:"ML/GLE 250 BlueTEC (OM651 2.1D)", fuel:"diesel", oil:6.5, spec:"MB 229.51" },
    { name:"ML/GLE 350 BlueTEC / 350d (OM642 3.0D)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"ML/GLE 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"ML/GLE 400 / 450 (M276 3.0T / M278 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"ML/GLE 500 / 550 (M278 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"ML/GLE 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── Maybach ──────────────────────────────────────────────────────────────────
  "Mercedes-Maybach EQS SUV (X296)": [
    { name:"Maybach EQS 680 SUV (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  "Mercedes-Maybach GLS (X167)": [
    { name:"Maybach GLS 600 (M177 4.0 V8T)", fuel:"gasolina", oil:9.5, spec:"MB 229.52" },
  ],
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
  // ── R-Class ──────────────────────────────────────────────────────────────────
  "R-Class (W251) 2005-2012": [
    { name:"R 280 / R 300 / R 350 (M272 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"R 280 CDI / R 320 CDI / R 350 CDI (OM642)", fuel:"diesel", oil:8.0, spec:"MB 229.51" },
    { name:"R 500 (M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"R 63 AMG (M156 6.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── S-Class ──────────────────────────────────────────────────────────────────
  "S-Class (W108 / W109) 1967-1972": [
    { name:"280 S / 280 SE (M130 2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"300 SEL (M189 3.0)", fuel:"gasolina", oil:7.0, spec:"MB 229.0" },
    { name:"300 SEL 6.3 (M100 6.3 V8)", fuel:"gasolina", oil:10.0, spec:"MB 229.0" },
  ],
  "S-Class (W116) 1972-1979": [
    { name:"280 S / 280 SE (M110 2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"350 SE (M116 3.5 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.0" },
    { name:"450 SE / 450 SEL (M117 4.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.0" },
    { name:"450 SEL 6.9 (M100 6.9 V8)", fuel:"gasolina", oil:10.0, spec:"MB 229.0" },
    { name:"300 SD (OM617 3.0D turbo)", fuel:"diesel", oil:7.0, spec:"MB 229.0" },
  ],
  "S-Class (W126) 1979-1991": [
    { name:"260 SE / 280 SE (M103 2.6-2.8)", fuel:"gasolina", oil:7.5, spec:"MB 229.0 / 229.1" },
    { name:"300 SE / 300 SEL (M103 3.0)", fuel:"gasolina", oil:7.5, spec:"MB 229.1" },
    { name:"380 SE / 420 SE (M116 3.8-4.2 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.0 / 229.1" },
    { name:"500 SE / 500 SEL (M117 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.0 / 229.1" },
    { name:"560 SE / 560 SEL (M117 5.6 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1" },
    { name:"300 SD Turbodiesel (OM617 3.0D)", fuel:"diesel", oil:7.0, spec:"MB 229.0" },
  ],
  "S-Class (W140) 1991-1998": [
    { name:"S 280 / S 320 (M104 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"S 350 Turbodiesel (OM603 3.5D)", fuel:"diesel", oil:8.0, spec:"MB 229.1" },
    { name:"S 420 (M119 4.2 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"S 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"S 600 (M120 6.0 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1 / 229.3" },
    { name:"S 60 / S 70 AMG (M120)", fuel:"gasolina", oil:10.5, spec:"MB 229.1" },
  ],
  "S-Class (W220) 1998-2005": [
    { name:"S 280 / S 320 (M112 2.8-3.2 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.3 / 229.5" },
    { name:"S 320 CDI (OM613 3.2D)", fuel:"diesel", oil:8.5, spec:"MB 229.3" },
    { name:"S 400 CDI (OM628 4.0D V8)", fuel:"diesel", oil:9.5, spec:"MB 229.3" },
    { name:"S 430 (M113 4.3 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"S 500 (M113 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"S 600 (M137 5.8 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.3 / 229.5" },
    { name:"S 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "S-Class (W221) 2005-2013": [
    { name:"S 280 / S 300 / S 350 (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.5" },
    { name:"S 320 CDI / S 350 CDI (OM642 3.0D)", fuel:"diesel", oil:8.5, spec:"MB 229.51" },
    { name:"S 400 / S 450 / S 500 (M273/M278 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"S 63 AMG (M156/M157)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"S 65 AMG (M275/M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
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
  // ── SL-Class ─────────────────────────────────────────────────────────────────
  "SL-Class (R107) 1971-1989": [
    { name:"280 SL (M110 2.8)", fuel:"gasolina", oil:6.5, spec:"MB 229.0" },
    { name:"350 SL (M116 3.5 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.0" },
    { name:"380 SL (M116 3.8 V8)", fuel:"gasolina", oil:8.0, spec:"MB 229.0" },
    { name:"450 SL (M117 4.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.0" },
    { name:"500 SL / 560 SL (M117 5.0-5.6 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.0 / 229.1" },
  ],
  "SL-Class (R129) 1990-2001": [
    { name:"SL 280 / SL 320 (M104 2.8-3.2)", fuel:"gasolina", oil:7.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 500 (M119 5.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 600 (M120 6.0 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1 / 229.3" },
    { name:"SL 60 AMG (M119 6.0 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.1" },
    { name:"SL 73 AMG (M297 7.3 V12)", fuel:"gasolina", oil:10.5, spec:"MB 229.1" },
  ],
  "SL-Class (R230) 2001-2011": [
    { name:"SL 350 (M112/M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3 / 229.5" },
    { name:"SL 500 / SL 550 (M113/M273 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.3 / 229.5" },
    { name:"SL 600 (M275 5.5 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"SL 55 AMG (M113 supercharged)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"SL 65 AMG (M275 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  "SL-Class (R231) 2012-2021": [
    { name:"SL 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5 / 229.52" },
    { name:"SL 400 / SL 450 (M276 V6T)", fuel:"gasolina", oil:7.5, spec:"MB 229.52" },
    { name:"SL 500 / SL 550 (M278 4.7 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5 / 229.52" },
    { name:"SL 600 (M279 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
    { name:"SL 63 AMG (M157 5.5 V8T)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
    { name:"SL 65 AMG (M279 6.0 V12T)", fuel:"gasolina", oil:10.5, spec:"MB 229.5" },
  ],
  // ── SLC-Class ────────────────────────────────────────────────────────────────
  "SLC-Class (R172) 2011-2020": [
    { name:"SLK/SLC 200 (M271/M274 1.8-2.0T)", fuel:"gasolina", oil:7.0, spec:"MB 229.3 / 229.5" },
    { name:"SLK/SLC 250 (M271 1.8T)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
    { name:"SLK/SLC 350 (M276 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"SLK/SLC 55 AMG (M152 5.5 V8)", fuel:"gasolina", oil:7.0, spec:"MB 229.5" },
  ],
  // ── SLK-Class ────────────────────────────────────────────────────────────────
  "SLK-Class (R170) 1996-2003": [
    { name:"SLK 200 (M111 2.0)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 200 Kompressor (M111 2.0T)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 230 Kompressor (M111 2.3T)", fuel:"gasolina", oil:5.5, spec:"MB 229.1 / 229.3" },
    { name:"SLK 320 (M112 3.2 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
    { name:"SLK 32 AMG (M112 supercharged)", fuel:"gasolina", oil:7.5, spec:"MB 229.3" },
  ],
  "SLK-Class (R171) 2004-2010": [
    { name:"SLK 200 / SLK 280 Kompressor (M271)", fuel:"gasolina", oil:6.5, spec:"MB 229.3 / 229.5" },
    { name:"SLK 350 (M272 3.5 V6)", fuel:"gasolina", oil:7.5, spec:"MB 229.5" },
    { name:"SLK 55 AMG (M113 5.5 V8)", fuel:"gasolina", oil:8.5, spec:"MB 229.5" },
  ],
  // ── EQ Eléctricos ────────────────────────────────────────────────────────────
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
  "EQS Sedan (V297)": [
    { name:"EQS 450 / EQS 580 4MATIC (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
    { name:"AMG EQS 53 4MATIC+ (eléctrico)", fuel:"electrico", oil:0, spec:"Sin aceite de motor" },
  ],
  // ── Sprinter ─────────────────────────────────────────────────────────────────
  "Sprinter (W906) 1995-2018": [
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
  // ── Vito ─────────────────────────────────────────────────────────────────────
  "Vito (W638) 1996-2003": [
    { name:"Vito 108/110/112 D (OM601/OM611)", fuel:"diesel", oil:6.0, spec:"MB 229.1" },
    { name:"Vito 110/112 CDI (OM611 2.2D)", fuel:"diesel", oil:6.0, spec:"MB 229.1 / 229.3" },
    { name:"Vito 114/116 gasolina (M111 2.3)", fuel:"gasolina", oil:5.5, spec:"MB 229.1" },
  ],
  "Vito (W639) 2003-2014": [
    { name:"Vito 109/111/113 CDI (OM646 2.1D)", fuel:"diesel", oil:6.5, spec:"MB 229.3 / 229.51" },
    { name:"Vito 116 CDI (OM642 3.0D V6)", fuel:"diesel", oil:8.5, spec:"MB 229.51" },
    { name:"Vito 114/116 gasolina (M272 V6)", fuel:"gasolina", oil:8.0, spec:"MB 229.3" },
  ],
};

// Sub-fase 2B.1: normalize hardcoded fallback to match DB-derived shape
const MODEL_DATA_NORMALIZED = (() => {
  const out = {}
  for (const [cat, engines] of Object.entries(MODEL_DATA)) {
    const seen = new Set()
    out[cat] = []
    for (const e of engines) {
      const code = extractEngineCode(e.name)
      if (seen.has(code)) continue
      seen.add(code)
      out[cat].push({ ...e, name: code })
    }
  }
  return out
})()


const MODEL_GROUPS = {
  "Clase A": [
    "A-Class (W168) 1997-2004",
    "A-Class (W169 / C169) 2004-2012",
    "A-Class (W176) 2012-2018",
    "A-Class Hatchback / Sedan (W177)",
  ],
  "Clase AMG GT": [
    "AMG GT Coupé / Roadster (C190 / R190)",
    "AMG GT 4-Door Coupé (X290)",
    "AMG GT Coupé (C192)",
    "AMG ONE (C298)",
    "AMG SL (R232)",
  ],
  "Clase B": [
    "B-Class (W245) 2005-2011",
    "B-Class (W246) 2011-2018",
    "B-Class (W247)",
  ],
  "Clase C / 190": [
    "C-Class / 190 (W201) 1982-1993",
    "C-Class (W202) 1993-2000",
    "C-Class (W203) 2001-2007",
    "C-Class Sedan / Estate (W204 / S204) 2007-2014",
    "C-Class Sedan / Estate (W205 / S205)",
    "C-Class Sedan / Estate (W206 / S206)",
  ],
  "Clase CL": [
    "CL-Class (C215) 1998-2006",
    "CL-Class (C216) 2006-2014",
  ],
  "Clase CLA": [
    "CLA Coupé / Shooting Brake (C117 / X117)",
    "CLA Coupé / Shooting Brake (C118 / X118)",
  ],
  "Clase CLE": [
    "CLE Coupé / Cabriolet (C236 / A236)",
  ],
  "Clase CLK": [
    "CLK-Class (C208) 1997-2003",
    "CLK-Class (C209) 2002-2009",
  ],
  "Clase CLS": [
    "CLS-Class (C219) 2004-2010",
    "CLS-Class (C218) 2010-2017",
  ],
  "Clase E": [
    "E-Class (W114 / W115) 1968-1976",
    "E-Class (W123) 1976-1984",
    "E-Class (W124) 1984-1996",
    "E-Class (W210) 1995-2002",
    "E-Class (W211 / S211) 2002-2009",
    "E-Class Sedan / Estate (W212 / S212) 2009-2016",
    "E-Class Coupé / Cabriolet (C207 / A207) 2009-2016",
    "E-Class Sedan / Estate (W213 / S213)",
    "E-Class Sedan / Estate (W214 / S214)",
    "E-Class Coupé / Cabriolet (C238 / A238)",
  ],
  "Clase G": [
    "G-Class (W460) 1979-1991",
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
    "GLK-Class (X204) 2008-2015",
    "GLC / GLC Coupé (X253 / C253)",
    "GLC / GLC Coupé (X254 / C254)",
  ],
  "Clase GLE / ML": [
    "M-Class (W163) 1997-2004",
    "M-Class (W164) 2005-2011",
    "M-Class / GLE (W166) 2011-2015",
    "GLE / GLE Coupé (W166 / C166)",
    "GLE / GLE Coupé (W167 / C167)",
  ],
  "Clase GLS / GL": [
    "GL-Class (X164) 2006-2012",
    "GL-Class / GLS (X166) 2012-2015",
    "GLS (X166)",
    "GLS (X167)",
  ],
  "Clase R": [
    "R-Class (W251) 2005-2012",
  ],
  "Clase S": [
    "S-Class (W108 / W109) 1967-1972",
    "S-Class (W116) 1972-1979",
    "S-Class (W126) 1979-1991",
    "S-Class (W140) 1991-1998",
    "S-Class (W220) 1998-2005",
    "S-Class (W221) 2005-2013",
    "S-Class (W222)",
    "S-Class (W223)",
  ],
  "Clase SL": [
    "SL-Class (R107) 1971-1989",
    "SL-Class (R129) 1990-2001",
    "SL-Class (R230) 2001-2011",
    "SL-Class (R231) 2012-2021",
  ],
  "Clase SLK / SLC": [
    "SLK-Class (R170) 1996-2003",
    "SLK-Class (R171) 2004-2010",
    "SLC-Class (R172) 2011-2020",
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
    "Sprinter (W906) 1995-2018",
    "Sprinter (W907)",
    "Vito (W638) 1996-2003",
    "Vito (W639) 2003-2014",
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
  "m113": ["G-Class (W463)","-","-","-","-","-"],
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

const MODEL_ENTRIES_FALLBACK = (() => {
  const claseByCat = {}
  for (const [clase, cats] of Object.entries(MODEL_GROUPS)) {
    for (const cat of cats) claseByCat[cat] = clase
  }
  const enriched = {}
  for (const [cat, engines] of Object.entries(MODEL_DATA)) {
    enriched[cat] = engines.map(e => ({ ...e, clase: claseByCat[cat] }))
  }
  return buildEntriesFromSource(enriched)
})()

const normalize = s => s?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '') ?? ''

// Función de búsqueda inteligente
function smartSearch(query, modelGroups = MODEL_GROUPS) {
  const q = normalize(query);
  if (!q) return null; // null = mostrar todos

  // 1. Buscar alias exacto
  const aliasKeys = Object.keys(MODEL_ALIASES).filter(k => {
    const nk = normalize(k);
    if (q === nk) return true;                           // coincidencia exacta siempre
    if (nk.startsWith(q) && q.length >= 2) return true; // alias empieza con la búsqueda (mín 2 chars)
    if (q.startsWith(nk) && nk.length >= 3) return true; // búsqueda empieza con alias (mín 3 chars — evita "c" matcheando "c230")
    return false;
  });
  const chassisTags = new Set(aliasKeys.flatMap(k => MODEL_ALIASES[k]));

  // 2. Construir lista de modelos que coinciden
  const results = [];
  Object.entries(modelGroups).forEach(([grp, models]) => {
    models.forEach(m => {
      const mNorm = normalize(m);
      // Coincidencia directa en el nombre
      const directMatch = mNorm.includes(q);
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
function buildTasks(code, fuel, is4m, codes, items) {
  const def = codes[code];
  if (!def) return [];
  const fuelItem = fuel === "diesel" ? "11" : "12";
  const result = [];
  def.items.forEach(id => {
    const resolved = id === "FUEL" ? fuelItem : id;
    const block = items[resolved];
    if (block) block.tasks.forEach((text, i) =>
      result.push({ id:`${resolved}_${i}`, grp:block.label, icon:block.icon, text, outOfAssyst:!!block.outOfAssyst })
    );
  });
  // Bujías de precalentamiento — SOLO diesel
  if (fuel === "diesel") {
    const glow = items["GLOW"];
    if (glow) glow.tasks.forEach((text, i) =>
      result.push({ id:`GLOW_${i}`, grp:glow.label, icon:glow.icon, text, outOfAssyst:true })
    );
  }
  // 4MATIC — diferencial
  if (is4m) {
    ["4M_DIFF","4M_FDIFF"].forEach(key => {
      const block = items[key];
      if (block) block.tasks.forEach((text, i) =>
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
const SESSION_KEY = "ryr_session";

const LOGO_SRC = "data:image/png;base64,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";

function LoginScreen({ onLogin }) {
  const [nombre,   setNombre]   = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(`${SURL}/rest/v1/rpc/login_mantenimientos`, {
        method: 'POST',
        headers: {
          "apikey": SKEY,
          "Authorization": `Bearer ${SKEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_nombre: nombre.trim(), p_password: password }),
      });
      const data = await res.json();
      if (!res.ok || !data || data.error || !data.success) {
        setError(data?.error === 'invalid_credentials'
          ? 'Nombre o contraseña incorrectos'
          : 'Error al iniciar sesión');
        setLoading(false);
        return;
      }
      const user = data.user;
      const session = { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol, app: user.app };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch(err) {
      console.error("[Auth] Exception:", err);
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  const active = !loading && nombre.trim() && password;
  const fieldStyle = { background:"#111118", border:"1px solid #2a2a3a", color:"#e0d8cc", borderRadius:8, padding:"12px 14px", fontSize:13, fontFamily:"monospace", outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", background:"#09090e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:24 }}>
      <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:100, height:100, borderRadius:"50%", marginBottom:16, objectFit:"cover" }} />
      <div style={{ fontSize:15, fontWeight:"bold", letterSpacing:3, color:"#e0d8cc", marginBottom:4 }}>RAMOS Y RAMOS</div>
      <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:36 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
      <form onSubmit={submit} style={{ width:"100%", maxWidth:300, display:"flex", flexDirection:"column", gap:12 }}>
        <input type="text" value={nombre} onChange={e => { setNombre(e.target.value); setError(""); }}
          placeholder="Ej: Gustavo Ramos" autoCapitalize="words" autoComplete="name" spellCheck={false}
          style={fieldStyle} />
        <div style={{ position:"relative" }}>
          <input type={showPwd ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña" autoComplete="current-password"
            style={{ ...fieldStyle, paddingRight:44 }} />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", fontSize:16, cursor:"pointer", padding:4, lineHeight:1 }}>
            {showPwd ? "🙈" : "👁"}
          </button>
        </div>
        {error && <div style={{ fontSize:11, color:"#ef4444", textAlign:"center", letterSpacing:0.5 }}>{error}</div>}
        <button type="submit" disabled={!active}
          style={{ marginTop:4, padding:"13px", borderRadius:8, border:`1px solid ${active ? "#C8A96E60" : "#2a2a3a"}`, background: active ? "#C8A96E20" : "#111118", color: active ? "#C8A96E" : "#444", fontFamily:"monospace", fontSize:12, letterSpacing:2, fontWeight:"bold", cursor: active ? "pointer" : "default" }}>
          {loading ? "Verificando..." : "INICIAR SESIÓN"}
        </button>
      </form>
    </div>
  );
}

function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  // Note: auto-session logic runs synchronously in the initializer so the login guard
  // never fires for Taller-launched sessions — a useEffect would render LoginScreen first.
  const [session, setSession] = useState(() => {
    try {
      const params   = new URLSearchParams(window.location.search);
      const mecanico = params.get('mecanico')?.trim() || '';
      const ordenId  = params.get('orden_id')?.trim() || '';

      // If a previous auto-session exists but this visit has no orden_id, clear it
      const source = localStorage.getItem('ryr_session_source');
      if (source === 'taller' && !ordenId) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('ryr_session_source');
        return null;
      }

      // Auto-create session when launched from Taller (both params required)
      if (mecanico && ordenId) {
        const synth = { id: null, username: null, nombre: mecanico, rol: 'mecanico', app: 'mantenimientos', source: 'taller' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(synth));
        localStorage.setItem('ryr_session_source', 'taller');
        return synth;
      }

      // Normal session restore
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  });
  if (!session) return <LoginScreen onLogin={setSession} />;
  return <MainApp session={session} onLogout={() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('ryr_session_source');
    setSession(null);
  }} />;
}

function MainApp({ session, onLogout }) {
  const isMobile = useIsMobile();
  const [step, setStep]     = useState(1);
  const [cameFromTaller] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return !!(p.get('orden_id') || p.get('mecanico'));
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifList, setNotifList]                 = useState([]);
  const [notifLoading, setNotifLoading]           = useState(false);
  const [notifCount, setNotifCount]               = useState(0);
  const [showBorradores, setShowBorradores]       = useState(false);
  const [adminDrafts, setAdminDrafts]             = useState([]);
  const [adminDraftsLoading, setAdminDraftsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete]         = useState(null);
  const [showCompleted, setShowCompleted]         = useState(false);
  const [completedList, setCompletedList]         = useState([]);
  const [completedLoading, setCompletedLoading]   = useState(false);
  // TODO: orphaned — was triggered by removed "VER TODOS" button. Remove in cleanup commit.
  const [showVerTodos, setShowVerTodos] = useState(false);
  const [verTodosList, setVerTodosList] = useState([]);
  const [showCentroMando, setShowCentroMando] = useState(false);
  const [openCode, setOpenCode] = useState(null);
  const [cmTab, setCmTab] = useState("recetas");
  const [verTodosLoading, setVerTodosLoading] = useState(false);
  const [verTodosSearch, setVerTodosSearch] = useState("");
  const [verTodosPage, setVerTodosPage] = useState(0);
  const [editingId, setEditingId] = useState(null); // ID del servicio en edición
  const [editingTrelloCardId, setEditingTrelloCardId] = useState(null); // ID de la tarjeta Trello
  const [aprobado, setAprobado] = useState(false);
  const [aprobadoPor, setAprobadoPor] = useState("");
  const [modoRevision, setModoRevision] = useState(false); // true = jefe revisando, false = mecánico editando // Quién aprobó
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
  const [taskPhotos, setTaskPhotos] = useState({}); // id -> string[] (URLs ImgBB)
  const [activeIssue, setActiveIssue] = useState(null); // id del ítem abierto
  const [exChk, setExChk]   = useState({});
  const [notes, setNotes]   = useState("");
  const [tab, setTab]       = useState("check");
  const [showEx, setShowEx] = useState(false);
  const [mechName, setMechName] = useState("");
  const [sigDate, setSigDate]   = useState("");
  const [trelloStatus, setTrelloStatus] = useState("idle");
  const [trelloUrl, setTrelloUrl]       = useState("");
  const [clientUrl, setClientUrl]       = useState("");
  const [ordenId,       setOrdenId]       = useState("");
  const [ordenNumero,   setOrdenNumero]   = useState("");
  const [ordenFalla,    setOrdenFalla]    = useState("");
  const [vehAnio,       setVehAnio]       = useState("");
  const [vehVersion,    setVehVersion]    = useState("");
  const [ordenEnvioStatus, setOrdenEnvioStatus] = useState("idle"); // 'idle'|'sending'|'done'
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [draftPrompt, setDraftPrompt]   = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [differentOrdenPrompt, setDifferentOrdenPrompt] = useState(null);
  const autoSaveTimer = useRef(null);
  const editingIdRef  = useRef(null);
  const autoSaveRef   = useRef({});

  const [activeItems, setActiveItems] = useState(DEFAULT_ITEMS);
  const [activeCodes, setActiveCodes] = useState(DEFAULT_CODES);
  const [activeAKeys, setActiveAKeys] = useState(DEFAULT_A_KEYS);
  const [activeBKeys, setActiveBKeys] = useState(DEFAULT_B_KEYS);

  useEffect(() => {
    const SURL = import.meta.env.VITE_SUPABASE_URL;
    const SKEY = import.meta.env.VITE_SUPABASE_KEY;
    if (!SURL || !SKEY) return;
    const headers = { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` };
    Promise.all([
      fetch(`${SURL}/rest/v1/mant_recetas?select=*&order=serie,orden`, { headers }).then(r => r.json()),
      fetch(`${SURL}/rest/v1/mant_items?select=*&order=orden`,         { headers }).then(r => r.json()),
    ]).then(([recetas, itemsArr]) => {
      if (!Array.isArray(recetas) || !Array.isArray(itemsArr)) {
        console.warn("[mant] fetch returned non-array", { recetas, itemsArr }); return;
      }
      if (recetas.length === 0 || itemsArr.length === 0) {
        console.warn("[mant] fetch returned empty arrays — keeping defaults"); return;
      }
      const newItems = Object.fromEntries(
        itemsArr.map(i => [i.clave, { label: i.label, icon: i.icon, tasks: i.tasks, outOfAssyst: !!i.out_of_assyst }])
      );
      const newCodes = Object.fromEntries(
        recetas.map(r => [r.codigo, { color: r.color, desc: r.descripcion, items: r.items, fuelLock: r.fuel_lock || null }])
      );
      const newAKeys = recetas.filter(r => r.serie === 'A').map(r => r.codigo);
      const newBKeys = recetas.filter(r => r.serie === 'B').map(r => r.codigo);
      setActiveItems(newItems);
      setActiveCodes(newCodes);
      setActiveAKeys(newAKeys);
      setActiveBKeys(newBKeys);
    }).catch(e => console.warn("[mant] error cargando recetas/items de Supabase:", e));
  }, []);

  const [dbModels, setDbModels] = useState(null);
  useEffect(() => {
    loadModelsFromDB().then(data => { if (data) setDbModels(data) })
  }, []);
  const modelData    = dbModels?.modelData    ?? MODEL_DATA_NORMALIZED;
  const modelGroups  = dbModels?.modelGroups  ?? MODEL_GROUPS;
  const modelEntries = dbModels?.modelEntries ?? MODEL_ENTRIES_FALLBACK;

  const svc          = activeCodes[sel] || {};
  const G            = svc.color || '#C8A96E';
  const fuelLock     = svc.fuelLock || null;
  const fuelMismatch = fuelLock && fuelLock !== fuel;

  // Motor seleccionado y capacidad de aceite
  const availableEngines = model && modelData[model] ? modelData[model] : [];
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
  const tasks        = buildTasks(sel, fuel, is4m, activeCodes, activeItems);
  const extras       = getExtras(fuel);
  const trackable   = tasks.filter(t => !t.text?.startsWith("⚠"));
  const doneN  = trackable.filter(t => checked[t.id] || taskStatus[t.id]).length;
  const naN    = trackable.filter(t => taskStatus[t.id] === "na").length;
  const total  = trackable.length;
  const pct    = total ? Math.round(doneN / total * 100) : 0;
  const isComplete = pct === 100;
  const exDoneN = extras.reduce((n,e) => n + e.tasks.filter((_,i) => exChk[`${e.id}_${i}`]).length, 0);
  const exTotal = extras.reduce((n,e) => n + e.tasks.length, 0);

  const showAdminButtons = !cameFromTaller && (session?.rol === 'admin' || session?.rol === 'jefe');
  const normalizar = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const esTavo = normalizar(session?.nombre) === normalizar('Gustavo Ramos');

  // Keep ref current so debounced timer always reads latest values
  autoSaveRef.current = { tasks, taskStatus, taskIssue, taskPhotos, checked, plate, model, engine, mechName, sel, svc, km, fuel, is4m, oilLiters, oilSpec, notes, doneN, total, sigDate, ordenId, ordenNumero, vehAnio, vehVersion };

  const toggle   = id  => setChk(p => ({ ...p, [id]: !p[id] }));
  const toggleEx = id  => setExChk(p => ({ ...p, [id]: !p[id] }));
  const markAll  = ()  => {
    const newStatus = {};
    trackable.forEach(t => { newStatus[t.id] = "ok"; });
    setTaskStatus(p => ({ ...p, ...newStatus }));
  };
  const resetAll = ()  => {
    const u={}; tasks.forEach(t => u[t.id]=false); setChk(p=>({...p,...u}));
    setTaskStatus({}); setTaskIssue({}); setTaskPhotos({}); setActiveIssue(null);
    setNotes(""); setMechName(""); setSigDate("");
    setModel(""); setModelSearch(""); setEngine(""); setPlate(""); setKm("");
    setSel("A"); setFuel("gasolina"); setIs4m(false);
    setTrelloStatus("idle"); setTrelloUrl(""); setClientUrl("");
    setOrdenEnvioStatus("idle");
    setOrdenId(""); setOrdenNumero(""); setOrdenFalla(""); setVehAnio(""); setVehVersion("");
    setEditingTrelloCardId(null);
    setAprobado(false);
    setAprobadoPor("");
    setModoRevision(false);
    setTab("check"); setStep(1); setEditingId(null);
    setAutoSaveStatus(null);
  };
  const continuarDraft = (draft) => {
    loadService(draft);
    setDraftPrompt(false);
  };

  const descartarDraft = async (draft) => {
    const SURL = import.meta.env.VITE_SUPABASE_URL;
    const SKEY = import.meta.env.VITE_SUPABASE_KEY;
    try {
      const res = await fetch(`${SURL}/rest/v1/servicios?id=eq.${draft.id}`, {
        method: 'PATCH',
        headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ estado: 'descartado' }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('[descartarDraft] failed:', res.status, errText);
        alert('⚠️ Error al descartar borrador. Reintentá.');
        return;
      }
      setPendingDrafts(prev => prev.filter(d => d.id !== draft.id));
    } catch(e) { console.error('[descartarDraft]', e); alert('⚠️ Error al descartar borrador. Reintentá.'); }
  };

  const handleReset = async () => {
    if (editingId && !sigDate) {
      if (!window.confirm('Tenés un servicio en progreso sin firmar. ¿Seguro que querés empezar uno nuevo?')) return;
      const discard = window.confirm('¿Descartar el borrador? Presioná Cancelar para guardarlo y continuar más tarde.');
      if (discard) {
        const SURL = import.meta.env.VITE_SUPABASE_URL;
        const SKEY = import.meta.env.VITE_SUPABASE_KEY;
        try {
          const res = await fetch(`${SURL}/rest/v1/servicios?id=eq.${editingId}`, {
            method: 'PATCH',
            headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ estado: 'descartado' }),
          });
          if (!res.ok) console.error('[handleReset discard] failed:', res.status, await res.text());
        } catch(e) { console.error('[handleReset discard]', e); }
      }
    }
    resetAll();
  };

  const addNote  = q   => setNotes(n => n ? n+"\n• "+q : "• "+q);

  // Keep editingIdRef in sync so the async save callback always has the latest ID
  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

  // On mount: check for an unfinished draft from today
  useEffect(() => {
    if (!session?.nombre) return;
    const SURL = import.meta.env.VITE_SUPABASE_URL;
    const SKEY = import.meta.env.VITE_SUPABASE_KEY;
    const mechFilter = encodeURIComponent(session.nombre);
    fetch(`${SURL}/rest/v1/servicios?estado=eq.borrador&mecanico=eq.${mechFilter}&order=created_at.desc`, {
      headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPendingDrafts(data);
          // Draft modal is NOT auto-shown — mechanic opens it via the header button
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill from URL params — never auto-advances step
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pPlaca    = params.get('placa')?.toUpperCase().trim() || '';
    const pModelo   = params.get('modelo')?.trim()              || '';
    const pMecanico = params.get('mecanico')?.trim()            || '';
    const pOrdenId  = params.get('orden_id')?.trim()            || '';
    const pNumero   = params.get('numero')?.trim()              || '';
    const pFalla    = params.get('falla')?.trim()               || '';
    const pAnio     = params.get('anio')?.trim()                || '';
    const pVersion  = params.get('version')?.trim()             || '';
    if (pPlaca)    setPlate(pPlaca);
    if (pModelo) {
      setModelSearch(pModelo);
      // Only lock the model selection if it exactly matches a key in MODEL_DATA
      if (MODEL_DATA[pModelo]) setModel(pModelo);
    }
    if (pMecanico) setMechName(pMecanico);
    if (pOrdenId)  setOrdenId(pOrdenId);
    if (pNumero)   setOrdenNumero(pNumero);
    if (pFalla)    setOrdenFalla(pFalla);
    if (pAnio)     setVehAnio(pAnio);
    if (pVersion)  setVehVersion(pVersion);
    // Registered vehicle data wins over URL params
    if (pPlaca) {
      loadVehiculoByPlaca(pPlaca).then(veh => {
        if (!veh) return
        if (veh.modelo)      { setModel(veh.modelo); setModelSearch(veh.modelo) }
        if (veh.version)       setVehVersion(veh.version)
        if (veh.motor)         setEngine(veh.motor)
        if (veh.combustible)   setFuel(veh.combustible)
      }).catch(() => {})
    }
    // step intentionally NOT changed — mechanic must verify and fill kilometraje first
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart draft auto-load: runs after mount when both URL params and draft list are ready
  useEffect(() => {
    if (!cameFromTaller) return;
    if (!ordenId) return;
    if (!pendingDrafts.length) return;
    if (editingId) return; // already loaded a draft, don't double-load

    const exactMatch = pendingDrafts.find(d => d.orden_id === ordenId);
    if (exactMatch) {
      loadService(exactMatch);
      return;
    }

    const samePlacaDifferentOrden = pendingDrafts.filter(d =>
      d.placa === plate && d.orden_id !== ordenId
    );
    if (samePlacaDifferentOrden.length > 0) {
      setDifferentOrdenPrompt({ drafts: samePlacaDifferentOrden, currentOrden: ordenNumero });
    }
  }, [cameFromTaller, ordenId, plate, pendingDrafts, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save: debounce 2 s whenever checklist state changes while in step 3
  useEffect(() => {
    if (step !== 3) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const d  = autoSaveRef.current;
      if (d.sigDate) return; // Already signed — don't overwrite estado to borrador
      const id = editingIdRef.current;
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      setAutoSaveStatus("saving");
      try {
        const byGrpMap = {};
        d.tasks.forEach(t => {
          if (!byGrpMap[t.grp]) byGrpMap[t.grp] = [];
          const hasDetail = !!d.taskIssue[t.id];
          const rawStatus = d.taskStatus[t.id] || (d.checked[t.id] ? "ok" : "pending");
          byGrpMap[t.grp].push({ id: t.id, text: t.text, status: hasDetail ? "issue" : rawStatus, detail: d.taskIssue[t.id] || null, fotos: d.taskPhotos[t.id] || null });
        });
        const draftSlug = id ? undefined : `draft-${(d.plate || "XX").replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        const payload = {
          ...(draftSlug ? { slug: draftSlug } : {}),
          estado: "borrador",
          placa: d.plate, modelo: d.model, motor: d.engine,
          mecanico: d.mechName, servicio_codigo: d.sel, servicio_desc: d.svc?.desc || "",
          km: d.km, combustible: d.fuel, traccion: d.is4m ? "4MATIC" : "RWD",
          aceite_litros: d.oilLiters > 0 ? d.oilLiters : null,
          aceite_spec:   d.oilLiters > 0 ? d.oilSpec  : null,
          revisiones: byGrpMap, observaciones: d.notes,
          pendientes: Object.entries(d.taskIssue).filter(([,v]) => v).map(([,v]) => v),
          progreso: { completadas: d.doneN, total: d.total },
          aprobado: false, fotos: d.taskPhotos,
          orden_id: d.ordenId || null, orden_numero: d.ordenNumero || null,
          anio: d.vehAnio || null, version: d.vehVersion || null,
        };
        const res = await fetch(
          id ? `${SURL}/rest/v1/servicios?id=eq.${id}` : `${SURL}/rest/v1/servicios`,
          { method: id ? "PATCH" : "POST", headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}`, "Content-Type": "application/json", "Prefer": "return=representation" }, body: JSON.stringify(payload) }
        );
        if (!res.ok) {
          const errText = await res.text();
          console.error("[autoSave] Supabase error", res.status, errText.slice(0, 200));
          throw new Error(`autoSave ${res.status}`);
        }
        const saved = await res.json();
        if (!id) { const newId = saved?.[0]?.id; if (newId) setEditingId(newId); }
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(s => s === "saved" ? null : s), 3000);
      } catch(e) {
        console.warn("Auto-save failed:", e);
        setAutoSaveStatus("error");
        setTimeout(() => setAutoSaveStatus(s => s === "error" ? null : s), 5000);
      }
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [step, taskStatus, taskIssue, taskPhotos, mechName, notes, exChk]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setTaskStatus(p => ({ ...p, [id]: "issue" }));
    setChk(p => ({ ...p, [id]: true }));
    setActiveIssue(null);
  };

  const uploadPhoto = (id) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes'); return; }
      if (file.size > 25 * 1024 * 1024) { alert('La imagen supera los 25 MB'); return; }
      const comprimida = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });
      const path = `servicios/${id}/${crypto.randomUUID()}.jpg`;
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(
        `${SURL}/storage/v1/object/fotos-servicios/${path}`,
        { method: 'POST',
          headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY,
                     'Content-Type': 'image/jpeg', 'x-upsert': 'false' },
          body: comprimida }
      );
      if (!res.ok) { alert('Error al subir la imagen. Intentá de nuevo.'); return; }
      const url = `${SURL}/storage/v1/object/public/fotos-servicios/${path}`;
      setTaskPhotos(p => ({ ...p, [id]: [...(p[id] || []), url] }));
    };
    input.click();
  };

  // ── Firma helpers ──

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

  const notifyPush = async (userNombres, title, body) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ to_user_nombres: userNombres, title, body }),
      });
    } catch(e) { console.warn('notifyPush failed:', e); }
  };

  const loadService = (s) => {
    const d = s.datos || {};
    const v = d.vehiculo || {};
    const modelo      = v.modelo      || s.modelo      || "";
    const motor       = v.motor       || s.motor       || "";
    const placa       = v.placa       || s.placa       || "";
    const km          = v.km          || s.km          || "";
    const combustible = v.combustible || s.combustible || "gasolina";
    const traccion    = v.traccion    || s.traccion    || "";
    const servCodigo  = d.servicio?.codigo || s.servicio_codigo || "A";
    const mecanico    = d.mecanico    || s.mecanico    || "";
    const observaciones = d.observaciones || s.observaciones || "";
    const revisiones  = d.revisiones  || s.revisiones  || null;

    setModel(modelo); setModelSearch(modelo);
    setEngine(motor); setPlate(placa); setKm(km);
    setFuel(combustible); setIs4m(traccion === "4MATIC");
    setSel(servCodigo); setMechName(mecanico); setNotes(observaciones);

    if (revisiones) {
      const newStatus  = {};
      const newIssue   = {};
      const newChecked = {};
      const textToId   = {};
      Object.keys(activeItems).forEach(k => {
        activeItems[k].tasks.forEach((t, i) => { textToId[t] = `${k}_${i}`; });
      });
      const newPhotos = {};
      Object.values(revisiones).flat().forEach(item => {
        const taskId = item.id || textToId[item.text] || null;
        if (taskId && item.status && item.status !== "pending") {
          newStatus[taskId]  = item.status;
          newChecked[taskId] = true;
          if (item.detail) newIssue[taskId] = item.detail;
          if (item.fotos?.length) newPhotos[taskId] = item.fotos;
        }
      });
      setTaskStatus(newStatus);
      setTaskIssue(newIssue);
      setTaskPhotos(newPhotos);
      setChk(newChecked);
    }

    const existingSlug = s.slug || "";
    setSigDate("");
    if (!existingSlug) setClientUrl("");
    if (!revisiones) { setTaskStatus({}); setTaskIssue({}); setTaskPhotos({}); setChk({}); }
    setEditingId(s.id);
    setEditingTrelloCardId(d.trello_card_id || null);
    setAprobado(s.aprobado || false);
    setAprobadoPor(s.aprobado_por || "");
    if (existingSlug) setClientUrl(`${import.meta.env.VITE_APP_URL || window.location.origin}/servicio/${existingSlug}`);
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrdenId = urlParams.get('orden_id')?.trim() || '';
    const urlOrdenNumero = urlParams.get('numero')?.trim() || '';
    setOrdenId(urlOrdenId || s.orden_id || "");
    setOrdenNumero(urlOrdenNumero || s.orden_numero || "");
    setShowNotifications(false);
    setShowCompleted(false);
    setShowBorradores(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(`${SURL}/rest/v1/servicios?estado=eq.pendiente&aprobado=eq.false&order=created_at.desc`, {
        headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` }
      });
      if (!res.ok) {
        console.error("[fetchNotifications] failed:", res.status, await res.text());
        setNotifLoading(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setNotifList(list);
      setNotifCount(list.length);
    } catch(e) { console.error("[fetchNotifications]", e); }
    setNotifLoading(false);
  };

  const fetchBorradores = async () => {
    setAdminDraftsLoading(true);
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(
        `${SURL}/rest/v1/servicios?estado=eq.borrador&select=id,placa,modelo,mecanico,slug,orden_id,orden_numero,revisiones,created_at,updated_at&order=created_at.desc`,
        { headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` } }
      );
      const data = await res.json();
      setAdminDrafts(Array.isArray(data) ? data : []);
    } catch(e) { console.error('[fetchBorradores]', e); }
    setAdminDraftsLoading(false);
  };

  const fetchCompleted = async () => {
    setCompletedLoading(true);
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(`${SURL}/rest/v1/servicios?estado=eq.aprobado&order=created_at.desc&limit=100`, {
        headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` }
      });
      if (!res.ok) {
        console.error("[fetchCompleted] failed:", res.status, await res.text());
        setCompletedLoading(false);
        return;
      }
      const data = await res.json();
      setCompletedList(Array.isArray(data) ? data : []);
    } catch(e) { console.error("[fetchCompleted]", e); }
    setCompletedLoading(false);
  };

  useEffect(() => {
    if (showAdminButtons) fetchNotifications();
  }, [showAdminButtons]);

  const fetchVerTodos = async () => {
    setVerTodosLoading(true);
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;
      const res = await fetch(`${SURL}/rest/v1/servicios?select=*&order=created_at.desc&limit=500`, {
        headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[fetchVerTodos] error", res.status, errText);
        setVerTodosList([]);
      } else {
        const data = await res.json();
        setVerTodosList(Array.isArray(data) ? data : []);
      }
    } catch(e) {
      console.error("[fetchVerTodos] fetch failed:", e.message);
      setVerTodosList([]);
    }
    setVerTodosLoading(false);
  };

  const serviceRow = (s, actionBtn) => {
    const d = s.datos || {};
    const placa    = d.vehiculo?.placa  || s.placa  || "Sin placa";
    const modelo   = d.vehiculo?.modelo || s.modelo || "—";
    const servicio = d.servicio?.codigo || s.servicio_codigo || "—";
    const mecanico = d.mecanico         || s.mecanico || "";
    const fecha    = s.created_at ? new Date(s.created_at).toLocaleDateString("es-CR", { day:"2-digit", month:"short", year:"numeric" }) : "—";
    return (
      <div key={s.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:8, background:"#0c0c14", border:`1px solid ${line}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:11, fontWeight:"bold", color:"#C8A96E" }}>{placa}</span>
          <span style={{ fontSize:9, color:"#555" }}>{fecha}</span>
        </div>
        <div style={{ fontSize:11, color:"#aaa", marginBottom:4 }}>{modelo}</div>
        <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:9, background:"#C8A96E20", border:"1px solid #C8A96E40", color:"#C8A96E", borderRadius:4, padding:"1px 6px" }}>{servicio}</span>
          <span style={{ fontSize:9, color:"#555" }}>{mecanico}</span>
        </div>
        {actionBtn}
      </div>
    );
  };

  const notificationsPanel = showNotifications ? (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={() => setShowNotifications(false)}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#0f0f17", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>🔔 Pendientes de aprobación</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>{notifList.length} SERVICIO{notifList.length !== 1 ? "S" : ""}</div>
          </div>
          <button onClick={() => setShowNotifications(false)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {notifLoading && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>Cargando...</div>}
          {!notifLoading && notifList.length === 0 && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>No hay servicios pendientes de aprobación.</div>}
          {notifList.map(s => serviceRow(s,
            <button onClick={() => { setModoRevision(true); loadService(s); }}
              style={{ width:"100%", padding:"7px", borderRadius:6, border:"1px solid #C8A96E60", background:"#C8A96E18", color:"#C8A96E", fontSize:10, fontFamily:"monospace", cursor:"pointer", fontWeight:"bold", letterSpacing:1 }}>
              ▶ Ver / Aprobar
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const completedPanel = showCompleted ? (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={() => setShowCompleted(false)}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#0f0f17", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>📋 Mantenimientos realizados</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>
              {completedList.length === 100 ? "MOSTRANDO LOS 100 MÁS RECIENTES" : `${completedList.length} REGISTRO${completedList.length !== 1 ? "S" : ""}`}
            </div>
          </div>
          <button onClick={() => setShowCompleted(false)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {completedLoading && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>Cargando...</div>}
          {!completedLoading && completedList.length === 0 && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>No hay mantenimientos completados todavía.</div>}
          {completedList.map(s => serviceRow(s,
            <button onClick={() => { setModoRevision(true); loadService(s); }}
              style={{ width:"100%", padding:"7px", borderRadius:6, border:"1px solid #4ade8040", background:"#4ade8012", color:"#4ade80", fontSize:10, fontFamily:"monospace", cursor:"pointer", letterSpacing:1 }}>
              👁 Ver
            </button>
          ))}
        </div>
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${line}`, flexShrink:0 }}>
          <button
            onClick={() => { setShowVerTodos(true); fetchVerTodos(); setShowCompleted(false); }}
            style={{ width:"100%", padding:"9px", borderRadius:6, border:"1px solid #C8A96E40", background:"#C8A96E10", color:"#C8A96E", fontSize:11, fontFamily:"monospace", cursor:"pointer", letterSpacing:1, fontWeight:"bold" }}>
            🔍 VER TODOS / BUSCAR
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const borradoresPanel = showBorradores ? (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={() => setShowBorradores(false)}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#0f0f17", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>📝 Borradores sin finalizar</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>{adminDrafts.length} BORRADOR{adminDrafts.length !== 1 ? "ES" : ""}</div>
          </div>
          <button onClick={() => setShowBorradores(false)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {adminDraftsLoading && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>Cargando...</div>}
          {!adminDraftsLoading && adminDrafts.length === 0 && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>✅ No hay borradores pendientes.</div>}
          {!adminDraftsLoading && adminDrafts.map(b => {
            const fechaRef = new Date(b.updated_at || b.created_at).getTime();
            const diasAtras = Math.floor((Date.now() - fechaRef) / (24 * 60 * 60 * 1000));
            const esViejo = diasAtras >= 7;
            const allItems = Object.values(b.revisiones || {}).flat();
            const completados = allItems.filter(i => i.status === 'ok' || i.status === 'issue').length;
            const total = allItems.length;
            return (
              <div key={b.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:8, background:"#0c0c14", border:`1px solid ${esViejo ? '#555' : line}`, opacity: esViejo ? 0.65 : 1 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:"bold", color:"#C8A96E" }}>
                      {b.placa || '(sin placa)'} · {b.modelo ? b.modelo.split(' ').slice(0,3).join(' ') : '(sin modelo)'}
                    </div>
                    <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>
                      {b.mecanico || '(sin mecánico)'} · {diasAtras === 0 ? 'hoy' : `hace ${diasAtras} día${diasAtras !== 1 ? 's' : ''}`}
                    </div>
                    <div style={{ fontSize:10, color:"#666", marginTop:1 }}>
                      {b.orden_numero ? `📋 ${b.orden_numero}` : '⚠️ Sin orden'}{total > 0 ? ` · ${completados}/${total} ítems` : ''}
                      {esViejo ? <span style={{ marginLeft:6 }}>⚪ +7 días</span> : ''}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, marginLeft:8, flexShrink:0, alignItems:"center" }}>
                    <button onClick={() => { loadService(b); setShowBorradores(false); }}
                      style={{ padding:"5px 9px", background:"#C8A96E", color:"#000", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>
                      ▶
                    </button>
                    <button onClick={() => setConfirmDelete(b)}
                      style={{ padding:"5px 9px", background:"transparent", color:"#d33", border:"1px solid #d3333360", borderRadius:4, cursor:"pointer", fontSize:11 }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background:"#0f0f17", border:"1px solid #d3333380", borderRadius:10, padding:"20px 18px", maxWidth:360, width:"100%", fontFamily:"monospace" }}>
            <div style={{ fontSize:13, color:"#d33", fontWeight:"bold", marginBottom:10 }}>⚠️ Eliminar borrador</div>
            <div style={{ fontSize:11, color:"#aaa", lineHeight:1.6, marginBottom:4 }}>
              ¿Eliminar el borrador de <strong style={{ color:"#C8A96E" }}>{confirmDelete.placa || '(sin placa)'}</strong> de <strong>{confirmDelete.mecanico || '(sin mecánico)'}</strong>?
            </div>
            <div style={{ fontSize:10, color:"#666", marginBottom:14 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding:"7px 12px", background:"transparent", color:"#aaa", border:`1px solid ${line}`, borderRadius:4, cursor:"pointer", fontSize:11, fontFamily:"monospace" }}>
                Cancelar
              </button>
              <button onClick={async () => {
                const SURL = import.meta.env.VITE_SUPABASE_URL;
                const SKEY = import.meta.env.VITE_SUPABASE_KEY;
                await fetch(`${SURL}/rest/v1/servicios?id=eq.${confirmDelete.id}`, {
                  method: 'DELETE',
                  headers: { "apikey": SKEY, "Authorization": `Bearer ${SKEY}` }
                });
                setAdminDrafts(prev => prev.filter(d => d.id !== confirmDelete.id));
                setConfirmDelete(null);
              }}
                style={{ padding:"7px 12px", background:"#d33", color:"#fff", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:"bold", fontFamily:"monospace" }}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const centroMandoPanel = showCentroMando ? (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={() => setShowCentroMando(false)}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#0f0f17", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>🛠 Centro de Mando</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>CATÁLOGO DE MANTENIMIENTOS</div>
          </div>
          <button onClick={() => setShowCentroMando(false)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:6, padding:"10px 12px", borderBottom:`1px solid ${line}`, flexShrink:0 }}>
          {[["recetas","RECETAS"],["items","ÍTEMS"]].map(([v,lbl]) => (
            <button key={v} onClick={() => setCmTab(v)}
              style={{ flex:1, padding:"7px", borderRadius:6, border:`1px solid ${cmTab===v?"#C8A96E60":line}`, background:cmTab===v?"#C8A96E15":card, color:cmTab===v?"#C8A96E":"#555", fontSize:11, fontFamily:"monospace", cursor:"pointer", fontWeight:cmTab===v?"bold":"normal", letterSpacing:1 }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {cmTab === "recetas" && (
            <>
              {[["Serie A", activeAKeys],["Serie B", activeBKeys]].map(([titulo, keys]) => (
                <div key={titulo} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${line}` }}>{titulo.toUpperCase()}</div>
                  {keys.map(k => {
                    const def = activeCodes[k];
                    if (!def) return null;
                    const isOpen = openCode === k;
                    return (
                      <div key={k} style={{ marginBottom: isOpen ? 8 : 3 }}>
                        <div onClick={() => setOpenCode(isOpen ? null : k)}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius: isOpen ? "6px 6px 0 0" : 6, background:"#0c0c14", border:`1px solid ${isOpen ? def.color+"60" : line}`, cursor:"pointer", userSelect:"none" }}>
                          <span style={{ fontSize:10, fontWeight:"bold", color:def.color, background:`${def.color}18`, border:`1px solid ${def.color}40`, borderRadius:4, padding:"1px 6px", flexShrink:0 }}>{k}</span>
                          <span style={{ flex:1, fontSize:11, color:"#aaa" }}>{def.desc}</span>
                          <span style={{ fontSize:9, color:"#555" }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                        {isOpen && (
                          <div style={{ padding:"8px 10px", borderRadius:"0 0 6px 6px", background:"#0a0a12", border:`1px solid ${def.color}60`, borderTop:"none" }}>
                            {def.items.map((id, idx) => (
                              <div key={idx} style={{ display:"flex", gap:8, padding:"4px 0", borderBottom:`1px solid ${line}`, alignItems:"flex-start" }}>
                                <span style={{ fontSize:9, color:def.color, background:`${def.color}12`, borderRadius:3, padding:"1px 5px", flexShrink:0, fontFamily:"monospace" }}>{id}</span>
                                <span style={{ fontSize:11, color:"#888" }}>{id === "FUEL" ? "Combustible/Bujías (según motor)" : activeItems[id]?.label ?? id}</span>
                              </div>
                            ))}
                            {def.fuelLock && (
                              <div style={{ marginTop:8, fontSize:9, color:"#C8A96E", background:"#C8A96E12", border:"1px solid #C8A96E30", borderRadius:4, padding:"3px 8px", display:"inline-flex", alignItems:"center", gap:4 }}>
                                🔒 {def.fuelLock}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ marginTop:4, padding:"10px 12px", borderRadius:6, background:"#0c0c14", border:`1px solid ${line}`, fontSize:10, color:"#555", lineHeight:1.6 }}>
                ℹ️ Los vehículos diesel suman <span style={{ color:"#7dd3fc" }}>GLOW</span> (bujías de precalentamiento) y los 4MATIC suman los diferenciales automáticamente; no aparecen en la receta.
              </div>
            </>
          )}
          {cmTab === "items" && (
            <div>
              <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${line}` }}>CATÁLOGO COMPLETO</div>
              {Object.entries(activeItems).map(([key, block]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", marginBottom:3, borderRadius:6, background:"#0c0c14", border:`1px solid ${line}` }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{block.icon}</span>
                  <span style={{ fontSize:9, color:"#C8A96E", background:"#C8A96E12", border:"1px solid #C8A96E30", borderRadius:3, padding:"1px 5px", flexShrink:0, fontFamily:"monospace" }}>{key}</span>
                  <span style={{ flex:1, fontSize:11, color:"#aaa" }}>{block.label}</span>
                  {block.outOfAssyst && (
                    <span style={{ fontSize:8, color:"#888", background:"#88888818", border:"1px solid #88888840", borderRadius:3, padding:"1px 5px", flexShrink:0, letterSpacing:0.5 }}>FUERA DEL ASSYST</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  // ── Ver Todos Panel ──
  const VT_PAGE_SIZE = 30;
  const verTodosFiltered = verTodosList.filter(s => {
    if (!verTodosSearch.trim()) return true;
    const q = verTodosSearch.trim().toLowerCase();
    const placa   = (s.placa   || s.datos?.vehiculo?.placa  || "").toLowerCase();
    const modelo  = (s.modelo  || s.datos?.vehiculo?.modelo || "").toLowerCase();
    const mec     = (s.mecanico || "").toLowerCase();
    return placa.includes(q) || modelo.includes(q) || mec.includes(q);
  });
  const verTodosPages = Math.max(1, Math.ceil(verTodosFiltered.length / VT_PAGE_SIZE));
  const verTodosPaged = verTodosFiltered.slice(verTodosPage * VT_PAGE_SIZE, (verTodosPage + 1) * VT_PAGE_SIZE);

  const verTodosPanel = showVerTodos ? (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#09090e", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", gap:12, flexShrink:0, flexWrap:"wrap" }}>
        <button onClick={() => setShowVerTodos(false)}
          style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#888", fontSize:12, fontFamily:"monospace", cursor:"pointer", letterSpacing:1, flexShrink:0 }}>
          ✕ CERRAR
        </button>
        <div style={{ flexShrink:0 }}>
          <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc", letterSpacing:1 }}>TODOS LOS MANTENIMIENTOS</div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>{verTodosFiltered.length} REGISTROS{verTodosSearch ? " (filtrados)" : ""}</div>
        </div>
        <input
          value={verTodosSearch}
          onChange={e => { setVerTodosSearch(e.target.value); setVerTodosPage(0); }}
          placeholder="Buscar placa, modelo o mecánico…"
          style={{ marginLeft:"auto", background:"#0c0c14", border:`1px solid ${line}`, color:"#e0d8cc", borderRadius:6, padding:"7px 12px", fontSize:12, fontFamily:"monospace", outline:"none", width:"min(260px,100%)", flexShrink:0 }}
        />
      </div>

      {/* Table header — desktop only */}
      {!isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"100px 90px 1fr 110px 60px 90px 28px", gap:8, padding:"8px 20px", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:2, flexShrink:0 }}>
          <span>FECHA</span><span>PLACA</span><span>MODELO</span><span>MECÁNICO</span><span>SERV.</span><span>ESTADO</span><span></span>
        </div>
      )}

      {/* Rows */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {verTodosLoading && verTodosPaged.length === 0 && (
          <div style={{ textAlign:"center", color:"#555", padding:60, fontSize:12 }}>Cargando...</div>
        )}
        {!verTodosLoading && verTodosFiltered.length === 0 && (
          <div style={{ textAlign:"center", color:"#555", padding:60, fontSize:12 }}>
            {verTodosSearch ? "Sin resultados." : "No hay mantenimientos registrados."}
          </div>
        )}
        {verTodosPaged.map((s, i) => {
          const placa    = s.placa   || s.datos?.vehiculo?.placa   || "Sin placa";
          const modelo   = s.modelo  || s.datos?.vehiculo?.modelo  || "—";
          const mecanico = s.mecanico || "—";
          const servCod  = s.servicio_codigo || s.datos?.servicio?.codigo || "—";
          const fecha    = s.created_at
            ? new Date(s.created_at).toLocaleDateString("es-CR", { day:"2-digit", month:"short", year:"numeric" })
            : "—";
          const estadoColor = s.aprobado ? "#4ade80" : s.estado === "pendiente" ? "#C8A96E" : "#888";
          const estadoLabel = s.aprobado ? "Aprobado" : s.estado === "pendiente" ? "Pendiente" : (s.estado || "Borrador");
          const slug = s.slug || s.id;
          const url  = `${window.location.origin}/servicio/${slug}`;
          if (isMobile) {
            return (
              <div key={s.id}
                style={{ padding:"12px 16px", borderBottom:`1px solid ${line}20`, cursor:"pointer", background: i % 2 === 0 ? "transparent" : "#ffffff04", display:"flex", flexDirection:"column", gap:6 }}
                onClick={() => { setModoRevision(false); loadService(s); setShowVerTodos(false); }}
              >
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:"bold", color:"#C8A96E", letterSpacing:1 }}>{placa}</span>
                  <span style={{ fontSize:9, color:estadoColor, background:estadoColor+"18", border:`1px solid ${estadoColor}40`, borderRadius:4, padding:"2px 8px", letterSpacing:1, fontFamily:"monospace" }}>{estadoLabel.toUpperCase()}</span>
                </div>
                <div style={{ fontSize:12, color:"#bbb" }}>{modelo}</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"#555" }}>{fecha}</span>
                  <span style={{ fontSize:10, color:"#666" }}>· {mecanico}</span>
                  <span style={{ fontSize:9, background:"#C8A96E20", border:"1px solid #C8A96E40", color:"#C8A96E", borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>{servCod}</span>
                  <a href={url} target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize:10, color:"#555", textDecoration:"none", marginLeft:"auto" }}
                    title="Ver resumen">🔗</a>
                </div>
              </div>
            );
          }
          return (
            <div key={s.id}
              style={{ display:"grid", gridTemplateColumns:"100px 90px 1fr 110px 60px 90px 28px", gap:8, padding:"11px 20px", borderBottom:`1px solid ${line}20`, cursor:"pointer", background: i % 2 === 0 ? "transparent" : "#ffffff04", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background = "#C8A96E10"}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#ffffff04"}
              onClick={() => { setModoRevision(false); loadService(s); setShowVerTodos(false); }}
            >
              <span style={{ fontSize:10, color:"#666" }}>{fecha}</span>
              <span style={{ fontSize:11, fontWeight:"bold", color:"#C8A96E", letterSpacing:1 }}>{placa}</span>
              <span style={{ fontSize:11, color:"#bbb", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{modelo}</span>
              <span style={{ fontSize:10, color:"#888", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mecanico}</span>
              <span style={{ fontSize:9, background:"#C8A96E20", border:"1px solid #C8A96E40", color:"#C8A96E", borderRadius:4, padding:"2px 6px", letterSpacing:1, textAlign:"center" }}>{servCod}</span>
              <span style={{ fontSize:9, color:estadoColor, background:estadoColor+"18", border:`1px solid ${estadoColor}40`, borderRadius:4, padding:"2px 6px", letterSpacing:1, textAlign:"center", fontFamily:"monospace" }}>{estadoLabel.toUpperCase()}</span>
              <a href={url} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize:10, color:"#555", textDecoration:"none", textAlign:"center" }}
                title="Ver resumen">🔗</a>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {verTodosPages > 1 && (
        <div style={{ padding:"10px 20px", borderTop:`1px solid ${line}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, justifyContent:"center" }}>
          <button onClick={() => setVerTodosPage(p => Math.max(0, p - 1))} disabled={verTodosPage === 0}
            style={{ padding:"5px 14px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color: verTodosPage === 0 ? "#333" : "#888", fontSize:12, fontFamily:"monospace", cursor: verTodosPage === 0 ? "default" : "pointer" }}>
            ← Anterior
          </button>
          <span style={{ fontSize:11, color:"#555", fontFamily:"monospace", minWidth:120, textAlign:"center" }}>
            Página {verTodosPage + 1} de {verTodosPages}
          </span>
          <button onClick={() => setVerTodosPage(p => Math.min(verTodosPages - 1, p + 1))} disabled={verTodosPage === verTodosPages - 1}
            style={{ padding:"5px 14px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color: verTodosPage === verTodosPages - 1 ? "#333" : "#888", fontSize:12, fontFamily:"monospace", cursor: verTodosPage === verTodosPages - 1 ? "default" : "pointer" }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  ) : null;

  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

  const buildServiceData = () => {
    const byGrpMap = {};
    tasks.forEach(t => {
      if (!byGrpMap[t.grp]) byGrpMap[t.grp] = [];
      const hasDetail = !!taskIssue[t.id];
      const rawStatus = taskStatus[t.id] || (checked[t.id] ? "ok" : "pending");
      byGrpMap[t.grp].push({
        id: t.id, text: t.text,
        status: hasDetail ? "issue" : rawStatus,
        detail: taskIssue[t.id] || null,
        fotos: taskPhotos[t.id] || null,
        outOfAssyst: t.outOfAssyst || false,
      });
    });
    return {
      taller: "Ramos y Ramos", fecha: sigDate, mecanico: mechName,
      servicio: { codigo: sel, descripcion: svc.desc },
      vehiculo: { modelo: model, motor: engine, placa: plate, km, combustible: fuel, traccion: is4m ? "4MATIC" : "RWD" },
      aceite: oilLiters > 0 ? { litros: oilLiters, especificacion: oilSpec } : null,
      revisiones: byGrpMap,
      observaciones: notes,
      pendientes: Object.entries(taskIssue).filter(([,v])=>v).map(([,v])=>v),
      progreso: { completadas: doneN, total },
    };
  };

  const buildTrelloDesc = () => {
    const issueTasks = tasks.filter(t => taskStatus[t.id] === "issue" || taskIssue[t.id]);
    let atenderSection = "";
    if (issueTasks.length > 0) {
      issueTasks.forEach(t => {
        const detail = taskIssue[t.id] ? ` → ${taskIssue[t.id]}` : "";
        atenderSection += `⚠️ ${t.text}${detail}\n`;
      });
    }
    if (notes) { if (atenderSection) atenderSection += "\n"; atenderSection += notes; }
    const combinedSection = atenderSection
      ? `### 📋 Detalles a atender y observaciones del mecánico:\n${atenderSection}\n`
      : "✅ _Todas las revisiones completadas sin observaciones._\n";
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

${combinedSection}
_Progreso: ${doneN}/${total} ítems (${pct}%)_`;
  };

  // ── Markdown builder for ordenes.informe_mantenimiento ──
  const buildInformeMarkdown = (overrideClientUrl) => {
    const issueTasks = tasks.filter(t => taskStatus[t.id] === "issue" || taskIssue[t.id]);
    let txt = `🔧 Servicio ${sel} — ${sigDate}\n\n`;
    txt += `Mecánico: ${mechName}\n`;
    txt += `Aprobado por: ${aprobadoPor}\n`;
    txt += `Kilometraje: ${km ? parseInt(km).toLocaleString() : "—"} km`;
    if (issueTasks.length > 0) {
      txt += `\n\n⚠️ Detalles marcados en el checklist:\n`;
      issueTasks.forEach(t => {
        const detail = taskIssue[t.id] ? ` → ${taskIssue[t.id]}` : " (sin detalle escrito)";
        txt += `- ${t.text}${detail}\n`;
      });
    }
    if (notes.trim()) {
      txt += `\n\n📝 Observaciones del mecánico:\n${notes.trim()}`;
    }
    const finalUrl = overrideClientUrl || clientUrl;
    txt += `\n\n🔗 Detalle completo del mantenimiento:\n${finalUrl || "(enlace pendiente)"}`;
    return txt;
  };

  // ── Save informe to ordenes.informe_mantenimiento ──
  const enviarAOrden = async () => {
    setOrdenEnvioStatus("sending");
    try {
      // 1. Check if already filled
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ordenes?id=eq.${ordenId}&select=informe_mantenimiento`,
        { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
      );
      const checkData = await checkRes.json();
      if (checkData?.[0]?.informe_mantenimiento) {
        const ok = confirm("⚠️ Esta orden ya tiene un informe de mantenimiento guardado. ¿Sobrescribir?");
        if (!ok) { setOrdenEnvioStatus("idle"); return; }
      }

      // 2. Save/update servicios to get the client link slug
      let finalClientUrl = clientUrl || "";
      let slug = "";
      if (editingId && clientUrl) slug = clientUrl.split("/servicio/")[1] || "";
      if (!slug) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        const plateClean = (plate || "XX").replace(/[^A-Z0-9]/gi, "").toUpperCase();
        slug = `${plateClean}-${sel}-${dd}${mm}${yyyy}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      }
      try {
        const svcData = buildServiceData();
        const sbRes = await fetch(
          editingId ? `${SUPABASE_URL}/rest/v1/servicios?id=eq.${editingId}` : `${SUPABASE_URL}/rest/v1/servicios`,
          { method: editingId ? "PATCH" : "POST",
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
            body: JSON.stringify({
              slug, placa: plate, modelo: svcData.vehiculo.modelo, motor: svcData.vehiculo.motor,
              mecanico: svcData.mecanico, servicio_codigo: svcData.servicio.codigo,
              servicio_desc: svcData.servicio.descripcion, km, combustible: fuel, traccion: is4m ? "4MATIC" : "RWD",
              aceite_litros: svcData.aceite?.litros || null, aceite_spec: svcData.aceite?.especificacion || null,
              revisiones: svcData.revisiones, observaciones: svcData.observaciones,
              pendientes: svcData.pendientes, progreso: svcData.progreso, aprobado: true, estado: 'aprobado', fotos: taskPhotos,
              orden_id: ordenId || null, orden_numero: ordenNumero || null,
            }),
          }
        );
        if (sbRes.ok) {
          const sbData = await sbRes.json();
          const savedId = sbData?.[0]?.id;
          finalClientUrl = `${APP_URL}/servicio/${slug}`;
          setClientUrl(finalClientUrl);
          if (!editingId && savedId) setEditingId(savedId);
        } else {
          console.error("[enviarAOrden] servicios save failed:", await sbRes.text());
        }
      } catch(e) { console.error("[enviarAOrden] servicios save exception:", e.message); }

      // 3. PATCH ordenes.informe_mantenimiento
      const markdown = buildInformeMarkdown(finalClientUrl);
      const ordenRes = await fetch(`${SUPABASE_URL}/rest/v1/ordenes?id=eq.${ordenId}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ informe_mantenimiento: markdown }),
      });
      if (!ordenRes.ok) {
        const errText = await ordenRes.text();
        console.error("[enviarAOrden] ordenes patch failed:", ordenRes.status, errText);
        throw new Error(`ordenes patch ${ordenRes.status}`);
      }

      setOrdenEnvioStatus("done");
    } catch(e) {
      console.error("[enviarAOrden]", e);
      alert("Error al enviar el informe a la orden. Intentá de nuevo.");
      setOrdenEnvioStatus("idle");
    }
  };

  const confirmSig = async () => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = null;
    const now = new Date();
    const fecha = now.toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " + now.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" });

    // Guardar en Supabase — usar variables locales, no estado (aún no actualizado)
    try {
      const SURL = import.meta.env.VITE_SUPABASE_URL;
      const SKEY = import.meta.env.VITE_SUPABASE_KEY;

      // Construir revisiones con los datos actuales del estado
      const byGrpMap = {};
      tasks.forEach(t => {
        if (!byGrpMap[t.grp]) byGrpMap[t.grp] = [];
        const hasDetail = !!taskIssue[t.id];
        const rawStatus = taskStatus[t.id] || (checked[t.id] ? "ok" : "pending");
        byGrpMap[t.grp].push({
          id: t.id,
          text: t.text,
          status: hasDetail ? "issue" : rawStatus,
          detail: taskIssue[t.id] || null,
          fotos: taskPhotos[t.id] || null,
        });
      });

      // Generar o reutilizar slug
      let slug = "";
      if (editingId && clientUrl) {
        slug = clientUrl.split("/servicio/")[1] || "";
      }
      if (!slug) {
        const dd   = String(now.getDate()).padStart(2,"0");
        const mm2  = String(now.getMonth()+1).padStart(2,"0");
        const yyyy = now.getFullYear();
        const plateClean = (plate || "XX").replace(/[^A-Z0-9]/gi,"").toUpperCase();
        const suffix = Math.random().toString(36).slice(2,5).toUpperCase();
        slug = `${plateClean}-${sel}-${dd}${mm2}${yyyy}-${suffix}`;
      }

      const payload = {
        slug,
        placa:           plate,
        modelo:          model,
        motor:           engine,
        mecanico:        mechName,
        servicio_codigo: sel,
        servicio_desc:   svc?.desc || "",
        km,
        combustible:     fuel,
        traccion:        is4m ? "4MATIC" : "RWD",
        aceite_litros:   oilLiters > 0 ? oilLiters : null,
        aceite_spec:     oilLiters > 0 ? oilSpec : null,
        revisiones:      byGrpMap,
        observaciones:   notes,
        pendientes:      Object.entries(taskIssue).filter(([,v])=>v).map(([,v])=>v),
        progreso:        { completadas: doneN, total },
        estado:          "pendiente",
        aprobado:        false,
        fotos:           taskPhotos,
        orden_id:        ordenId     || null,
        orden_numero:    ordenNumero || null,
        anio:            vehAnio     || null,
        version:         vehVersion  || null,
      };

      console.log("[confirmSig] payload:", JSON.stringify(payload).slice(0, 300));
      const url = editingId
        ? `${SURL}/rest/v1/servicios?id=eq.${editingId}`
        : `${SURL}/rest/v1/servicios`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "apikey": SKEY,
          "Authorization": `Bearer ${SKEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[confirmSig] Supabase error", res.status, errText);
        throw new Error(`Supabase ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("[confirmSig] saved:", data?.[0]?.id);
      const savedId = data?.[0]?.id;
      const clientUrlVal = `${import.meta.env.VITE_APP_URL || window.location.origin}/servicio/${slug}`;
      setClientUrl(clientUrlVal);
      if (!editingId && savedId) setEditingId(savedId);
      notifyPush(
        ["Otto Ramos","Gustavo Ramos","Arturo Ramos"],
        "Servicio pendiente de aprobación",
        `${mechName} — ${plate} (${model})`
      );
      setSigDate(fecha);
    } catch(e) {
      console.error("[confirmSig] save failed:", e.message);
      alert(`⚠️ ERROR al guardar el mantenimiento:\n\n${e.message}\n\nPor favor reintentá. Si persiste, contactá soporte. NO cierres la app.`);
    }
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

  const inp = { background:card, border:`1px solid ${line}`, color:"#e0d8cc", borderRadius:6, padding:"10px 12px", fontSize:16, fontFamily:"monospace", outline:"none" };

  /* ── PASO 1: DATOS DEL VEHÍCULO ── */
  if (step === 1) return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"monospace", color:"var(--text)" }}>

      {/* Borradores panel */}
      {draftPrompt && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:card, border:`1px solid ${line}`, borderRadius:10, padding:"20px 18px", maxWidth:420, width:"100%", fontFamily:"monospace", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, color:"#C8A96E", fontWeight:"bold" }}>📝 Tus mantenimientos en progreso ({pendingDrafts.length})</div>
              <button onClick={() => setDraftPrompt(false)} style={{ background:"transparent", border:"none", fontSize:20, cursor:"pointer", color:"#666", lineHeight:1 }}>×</button>
            </div>
            {pendingDrafts.length === 0 ? (
              <div style={{ textAlign:"center", padding:24, color:"#666", fontSize:12 }}>No tenés borradores pendientes.</div>
            ) : pendingDrafts.map((draft, idx) => {
              const draftDate = draft.created_at ? new Date(draft.created_at) : null;
              const ageDays = draftDate ? Math.floor((Date.now() - draftDate.getTime()) / 86400000) : 0;
              const isOld = ageDays >= 15;
              const ageText = ageDays === 0 ? 'hoy' : ageDays === 1 ? 'ayer' : `hace ${ageDays} días`;
              const progreso = draft.progreso?.completadas != null && draft.progreso?.total != null
                ? `${draft.progreso.completadas}/${draft.progreso.total} items` : null;
              return (
                <div key={draft.id || idx} style={{ border:`1px solid ${isOld ? '#f97316' : line}`, borderRadius:8, padding:"10px 12px", marginBottom:10, background:"#161622" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                    <div style={{ fontSize:15, fontWeight:"bold", letterSpacing:1, color:"#e0d8cc" }}>{draft.placa || '—'}</div>
                    {isOld && (
                      <span style={{ fontSize:9, fontWeight:"bold", color:"#f97316", background:"rgba(249,115,22,0.15)", padding:"2px 7px", borderRadius:4, letterSpacing:1 }}>
                        ⚠️ {ageDays} DÍAS
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:"#C8A96E", marginBottom:3 }}>
                    {draft.orden_numero ? `📋 Orden ${draft.orden_numero}` : '⚠️ Sin orden vinculada'}
                    {' · '}Serv. {draft.servicio_codigo || '—'}
                  </div>
                  <div style={{ fontSize:10, color:"#666", marginBottom:9 }}>
                    👤 {draft.mecanico || '—'} · {ageText}{progreso ? ` · ✓ ${progreso}` : ''}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => continuarDraft(draft)}
                      style={{ flex:1, padding:"8px", borderRadius:6, border:"1px solid #C8A96E60", background:"#C8A96E18", color:"#C8A96E", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:"bold" }}>
                      ▶ Continuar
                    </button>
                    <button onClick={() => descartarDraft(draft)}
                      style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ff444460", background:"#ff444418", color:"#ff6666", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Borrador de otra orden — mismo placa */}
      {differentOrdenPrompt && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:card, border:`1px solid ${line}`, borderRadius:10, padding:"20px 18px", maxWidth:400, width:"100%", fontFamily:"monospace" }}>
            <div style={{ fontSize:13, color:"#f97316", fontWeight:"bold", marginBottom:10 }}>⚠️ Borrador de otra orden</div>
            <div style={{ fontSize:11, color:"#aaa", lineHeight:1.6, marginBottom:12 }}>
              Estás abriendo la <strong style={{ color:"#C8A96E" }}>{differentOrdenPrompt.currentOrden}</strong> pero
              ya tenés un borrador de la misma placa para otra orden:
            </div>
            {differentOrdenPrompt.drafts.map((d, idx) => (
              <div key={d.id || idx} style={{ border:`1px solid ${line}`, borderRadius:6, padding:"10px 12px", marginBottom:8, background:"#161622" }}>
                <div style={{ fontSize:13, fontWeight:"bold", color:"#e0d8cc", marginBottom:3 }}>
                  {d.orden_numero ? `Orden ${d.orden_numero}` : 'Sin orden vinculada'}
                </div>
                <div style={{ fontSize:10, color:"#666", marginBottom:8 }}>Serv. {d.servicio_codigo} · {d.mecanico}</div>
                <button onClick={() => { setDifferentOrdenPrompt(null); continuarDraft(d); }}
                  style={{ padding:"7px 12px", borderRadius:6, background:"#C8A96E18", color:"#C8A96E", border:"1px solid #C8A96E60", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                  ▶ Continuar este borrador
                </button>
              </div>
            ))}
            <div style={{ marginTop:14 }}>
              <button onClick={() => setDifferentOrdenPrompt(null)}
                style={{ width:"100%", padding:"10px", borderRadius:6, background:"#4ade8022", color:"#4ade80", border:"1px solid #4ade8060", fontFamily:"monospace", fontSize:12, fontWeight:"bold", cursor:"pointer" }}>
                + Empezar {differentOrdenPrompt.currentOrden}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar el buscador — PRIMERO para que quede detrás */}
      {modelOpen && <div onClick={()=>setModelOpen(false)} style={{ position:"fixed", inset:0, zIndex:40, background:"transparent" }} />}

      {/* Header */}
      <div style={{ background:"var(--header)", borderBottom:`1px solid ${line}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:9 }}>
        <img src={LOGO_SRC} alt="Ramos y Ramos" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"bold", letterSpacing:2, fontSize:13, color:"var(--text)" }}>RAMOS Y RAMOS</div>
          <div style={{ fontSize:9, color:"var(--sub)", letterSpacing:3 }}>TALLER ESPECIALIZADO · MERCEDES-BENZ</div>
        </div>
        {pendingDrafts.length > 0 && (
          <button onClick={() => setDraftPrompt(true)} title="Ver mis mantenimientos no finalizados"
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 8px", borderRadius:8, border:`1px solid #C8A96E60`, background:"#C8A96E18", color:"#C8A96E", fontSize:11, fontWeight:"bold", cursor:"pointer", lineHeight:1, fontFamily:"monospace", flexShrink:0 }}>
            📝 {pendingDrafts.length}
          </button>
        )}
        {showAdminButtons && (<>
          <button onClick={() => { setShowNotifications(true); fetchNotifications(); }} title="Pendientes de aprobación"
            style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🔔
            {notifCount > 0 && (
              <span style={{ position:"absolute", top:-5, right:-5, background:"#ef4444", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Mantenimientos realizados"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            📋
          </button>
          <button onClick={() => setShowCentroMando(true)} title="Centro de Mando de Mantenimientos"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🛠
          </button>
          {esTavo && (
            <button onClick={() => { setShowBorradores(true); fetchBorradores(); }} title="Borradores sin finalizar"
              style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
              🗂
              {adminDrafts.length > 0 && (
                <span style={{ position:"absolute", top:-5, right:-5, background:"#888", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                  {adminDrafts.length > 9 ? "9+" : adminDrafts.length}
                </span>
              )}
            </button>
          )}
        </>)}
        <button className="theme-toggle" onClick={() => {
          const root = document.getElementById('root');
          const isLight = root.style.filter.includes('invert');
          if (isLight) { root.style.filter = ''; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = ''); try { localStorage.setItem('theme', 'dark'); } catch(e) {} }
          else { root.style.filter = 'invert(1) hue-rotate(180deg)'; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = 'invert(1) hue-rotate(180deg)'); try { localStorage.setItem('theme', 'light'); } catch(e) {} }
        }}>☀️</button>
        <button onClick={onLogout} title="Cerrar sesión" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:11, cursor:"pointer", fontFamily:"monospace", lineHeight:1, flexShrink:0 }}>→|</button>
      </div>
      <div style={{ padding:"3px 16px", background:"#09090e", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

      {notificationsPanel}
      {completedPanel}
      {borradoresPanel}
      {centroMandoPanel}
      {verTodosPanel}

      <div style={{ padding:"24px 16px", maxWidth:480, margin:"0 auto", width:"100%" }}>
        {/* Indicador de pasos */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:28 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:G, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold" }}>1</div>
          <div style={{ flex:1, height:2, background:line }} />
          <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${line}`, color:"#444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>2</div>
          <div style={{ flex:1, height:2, background:line }} />
          <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${line}`, color:"#444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>3</div>
        </div>

        <div style={{ fontSize:11, color:G, letterSpacing:3, marginBottom:16 }}>PASO 1 · DATOS DEL VEHÍCULO</div>

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
                  const q = normalize(modelSearch);
                  const flat = []
                  for (const [clase, entries] of Object.entries(modelEntries)) {
                    for (const entry of entries) flat.push({ ...entry, clase })
                  }
                  const filtered = q
                    ? flat.filter(e =>
                        normalize(e.display).includes(q) ||
                        normalize(e.categoria).includes(q) ||
                        normalize(e.clase).includes(q)
                      )
                    : flat
                  if (!filtered.length) return <div style={{ padding:"12px", fontSize:11, color:"#444", textAlign:"center" }}>Sin resultados</div>;
                  let lastClase = null;
                  return filtered.map((entry, i) => {
                    const showHeader = entry.clase !== lastClase;
                    lastClase = entry.clase;
                    return (
                      <div key={`${entry.categoria}-${entry.version}-${i}`}>
                        {showHeader && (
                          <div style={{ padding:"4px 10px 2px", fontSize:8, color:"#444", letterSpacing:2, background:"#0c0c12" }}>
                            {entry.clase.toUpperCase()}
                          </div>
                        )}
                        <div
                          onClick={() => {
                            setModel(entry.categoria);
                            setModelSearch(entry.display);
                            setVehVersion(entry.version);
                            setEngine(entry.motor);
                            setFuel(entry.combustible);
                            setModelOpen(false);
                          }}
                          style={{ padding:"7px 12px", cursor:"pointer", borderBottom:`1px solid ${line}20`, fontSize:11, display:"flex", alignItems:"center", gap:8, color:engine===entry.motor&&model===entry.categoria?"#C8A96E":"#ccc", background:engine===entry.motor&&model===entry.categoria?"#C8A96E08":"transparent" }}
                        >
                          <span style={{ flex:1 }}>{entry.display}</span>
                          {entry.aceite_lt != null && <span style={{ color:"#666", fontSize:10 }}>{entry.aceite_lt}L</span>}
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

        {/* Año */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, color:"#888", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>AÑO</label>
          <input
            value={vehAnio}
            onChange={e => setVehAnio(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 2018"
            type="text"
            inputMode="numeric"
            maxLength={4}
            style={{ ...inp, width:"100%", boxSizing:"border-box" }}
          />
        </div>

        {/* Versión */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, color:"#888", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>VERSIÓN</label>
          <input
            value={vehVersion}
            onChange={e => setVehVersion(e.target.value)}
            placeholder="Ej: B 180 CDI BlueEfficiency"
            type="text"
            style={{ ...inp, width:"100%", boxSizing:"border-box" }}
          />
        </div>

        {/* Placa */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>PLACA</div>
          <input value={plate} onChange={e=>setPlate(e.target.value.replace(/[^A-Z0-9]/gi,"").toUpperCase())} placeholder="Ej: ABC123" maxLength={8}
            style={{ ...inp, width:"100%", boxSizing:"border-box", letterSpacing:2, textTransform:"uppercase" }} />
        </div>

        {/* Kilometraje */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>KILOMETRAJE</div>
          <input value={km} onChange={e=>setKm(e.target.value.replace(/\D/g,""))} placeholder="Ej: 85000" type="text" inputMode="numeric"
            style={{ ...inp, width:"100%", boxSizing:"border-box" }} />
        </div>

        <div className="sticky-action">
          <button
            onClick={() => { if (model) { setModelOpen(false); setStep(2); } }}
            disabled={!model}
            style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${model?G+"60":"#2a2a3a"}`, background:model?G+"18":"transparent", color:model?G:"#333", fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:model?"pointer":"default" }}>
            CONTINUAR → TIPO DE SERVICIO
          </button>
          {!model && <div style={{ textAlign:"center", fontSize:10, color:"#444", marginTop:8 }}>Seleccioná un modelo para continuar</div>}
        </div>
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
        {pendingDrafts.length > 0 && (
          <button onClick={() => setDraftPrompt(true)} title="Ver mis mantenimientos no finalizados"
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 8px", borderRadius:8, border:`1px solid #C8A96E60`, background:"#C8A96E18", color:"#C8A96E", fontSize:11, fontWeight:"bold", cursor:"pointer", lineHeight:1, fontFamily:"monospace", flexShrink:0 }}>
            📝 {pendingDrafts.length}
          </button>
        )}
        {showAdminButtons && (<>
          <button onClick={() => { setShowNotifications(true); fetchNotifications(); }} title="Pendientes de aprobación"
            style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🔔
            {notifCount > 0 && (
              <span style={{ position:"absolute", top:-5, right:-5, background:"#ef4444", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Mantenimientos realizados"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            📋
          </button>
          <button onClick={() => setShowCentroMando(true)} title="Centro de Mando de Mantenimientos"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🛠
          </button>
          {esTavo && (
            <button onClick={() => { setShowBorradores(true); fetchBorradores(); }} title="Borradores sin finalizar"
              style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
              🗂
              {adminDrafts.length > 0 && (
                <span style={{ position:"absolute", top:-5, right:-5, background:"#888", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                  {adminDrafts.length > 9 ? "9+" : adminDrafts.length}
                </span>
              )}
            </button>
          )}
        </>)}
        <button className="theme-toggle" onClick={() => {
          const root = document.getElementById('root');
          const isLight = root.style.filter.includes('invert');
          if (isLight) { root.style.filter = ''; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = ''); try { localStorage.setItem('theme', 'dark'); } catch(e) {} }
          else { root.style.filter = 'invert(1) hue-rotate(180deg)'; root.querySelectorAll('img, canvas').forEach(el => el.style.filter = 'invert(1) hue-rotate(180deg)'); try { localStorage.setItem('theme', 'light'); } catch(e) {} }
        }}>☀️</button>
        <button onClick={onLogout} title="Cerrar sesión" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:11, cursor:"pointer", fontFamily:"monospace", lineHeight:1, flexShrink:0 }}>→|</button>
      </div>
      <div style={{ padding:"3px 16px", background:"#09090e", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

      {notificationsPanel}
      {completedPanel}
      {borradoresPanel}
      {centroMandoPanel}
      {verTodosPanel}

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

        <div style={{ fontSize:11, color:G, letterSpacing:3, marginBottom:16 }}>PASO 2 · TIPO DE SERVICIO</div>

        {/* Selector de código de servicio */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:10 }}>CÓDIGO DE SERVICIO ASSYST <span style={{ color:"#f87171" }}>*</span></div>
          <div style={{ fontSize:9, color:"#C8A96E80", letterSpacing:2, marginBottom:6 }}>SERIE A — INSPECCIÓN MENOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            {activeAKeys.map(k => { const s=activeCodes[k]||{},on=sel===k; return (
              <button key={k} onClick={()=>setSel(k)} className="svc-btn"
                style={{ padding:"7px 12px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":"transparent", color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:on?"bold":"normal" }}>
                {k}
              </button>
            );})}
          </div>
          <div style={{ fontSize:9, color:"#7EB8F780", letterSpacing:2, marginBottom:6 }}>SERIE B — INSPECCIÓN MAYOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {activeBKeys.map(k => { const s=activeCodes[k]||{},on=sel===k; return (
              <button key={k} onClick={()=>setSel(k)} className="svc-btn"
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

        <div className="sticky-action">
          <button onClick={()=>setStep(3)}
            style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${G}60`, background:G+"18", color:G, fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:"pointer" }}>
            INICIAR INSPECCIÓN →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"monospace", color:"var(--text)" }}>
      {/* Borradores panel (step 3) */}
      {draftPrompt && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:card, border:`1px solid ${line}`, borderRadius:10, padding:"20px 18px", maxWidth:420, width:"100%", fontFamily:"monospace", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, color:"#C8A96E", fontWeight:"bold" }}>📝 Tus mantenimientos en progreso ({pendingDrafts.length})</div>
              <button onClick={() => setDraftPrompt(false)} style={{ background:"transparent", border:"none", fontSize:20, cursor:"pointer", color:"#666", lineHeight:1 }}>×</button>
            </div>
            {pendingDrafts.length === 0 ? (
              <div style={{ textAlign:"center", padding:24, color:"#666", fontSize:12 }}>No tenés borradores pendientes.</div>
            ) : pendingDrafts.map((draft, idx) => {
              const draftDate = draft.created_at ? new Date(draft.created_at) : null;
              const ageDays = draftDate ? Math.floor((Date.now() - draftDate.getTime()) / 86400000) : 0;
              const isOld = ageDays >= 15;
              const ageText = ageDays === 0 ? 'hoy' : ageDays === 1 ? 'ayer' : `hace ${ageDays} días`;
              const progreso = draft.progreso?.completadas != null && draft.progreso?.total != null
                ? `${draft.progreso.completadas}/${draft.progreso.total} items` : null;
              return (
                <div key={draft.id || idx} style={{ border:`1px solid ${isOld ? '#f97316' : line}`, borderRadius:8, padding:"10px 12px", marginBottom:10, background:"#161622" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                    <div style={{ fontSize:15, fontWeight:"bold", letterSpacing:1, color:"#e0d8cc" }}>{draft.placa || '—'}</div>
                    {isOld && (
                      <span style={{ fontSize:9, fontWeight:"bold", color:"#f97316", background:"rgba(249,115,22,0.15)", padding:"2px 7px", borderRadius:4, letterSpacing:1 }}>
                        ⚠️ {ageDays} DÍAS
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:"#C8A96E", marginBottom:3 }}>
                    {draft.orden_numero ? `📋 Orden ${draft.orden_numero}` : '⚠️ Sin orden vinculada'}
                    {' · '}Serv. {draft.servicio_codigo || '—'}
                  </div>
                  <div style={{ fontSize:10, color:"#666", marginBottom:9 }}>
                    👤 {draft.mecanico || '—'} · {ageText}{progreso ? ` · ✓ ${progreso}` : ''}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => continuarDraft(draft)}
                      style={{ flex:1, padding:"8px", borderRadius:6, border:"1px solid #C8A96E60", background:"#C8A96E18", color:"#C8A96E", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:"bold" }}>
                      ▶ Continuar
                    </button>
                    <button onClick={() => descartarDraft(draft)}
                      style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ff444460", background:"#ff444418", color:"#ff6666", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Borrador de otra orden — mismo placa (step 3) */}
      {differentOrdenPrompt && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:card, border:`1px solid ${line}`, borderRadius:10, padding:"20px 18px", maxWidth:400, width:"100%", fontFamily:"monospace" }}>
            <div style={{ fontSize:13, color:"#f97316", fontWeight:"bold", marginBottom:10 }}>⚠️ Borrador de otra orden</div>
            <div style={{ fontSize:11, color:"#aaa", lineHeight:1.6, marginBottom:12 }}>
              Estás abriendo la <strong style={{ color:"#C8A96E" }}>{differentOrdenPrompt.currentOrden}</strong> pero
              ya tenés un borrador de la misma placa para otra orden:
            </div>
            {differentOrdenPrompt.drafts.map((d, idx) => (
              <div key={d.id || idx} style={{ border:`1px solid ${line}`, borderRadius:6, padding:"10px 12px", marginBottom:8, background:"#161622" }}>
                <div style={{ fontSize:13, fontWeight:"bold", color:"#e0d8cc", marginBottom:3 }}>
                  {d.orden_numero ? `Orden ${d.orden_numero}` : 'Sin orden vinculada'}
                </div>
                <div style={{ fontSize:10, color:"#666", marginBottom:8 }}>Serv. {d.servicio_codigo} · {d.mecanico}</div>
                <button onClick={() => { setDifferentOrdenPrompt(null); continuarDraft(d); }}
                  style={{ padding:"7px 12px", borderRadius:6, background:"#C8A96E18", color:"#C8A96E", border:"1px solid #C8A96E60", fontFamily:"monospace", fontSize:11, cursor:"pointer" }}>
                  ▶ Continuar este borrador
                </button>
              </div>
            ))}
            <div style={{ marginTop:14 }}>
              <button onClick={() => setDifferentOrdenPrompt(null)}
                style={{ width:"100%", padding:"10px", borderRadius:6, background:"#4ade8022", color:"#4ade80", border:"1px solid #4ade8060", fontFamily:"monospace", fontSize:12, fontWeight:"bold", cursor:"pointer" }}>
                + Empezar {differentOrdenPrompt.currentOrden}
              </button>
            </div>
          </div>
        </div>
      )}

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
        {pendingDrafts.length > 0 && (
          <button onClick={() => setDraftPrompt(true)} title="Ver mis mantenimientos no finalizados"
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 8px", borderRadius:8, border:`1px solid #C8A96E60`, background:"#C8A96E18", color:"#C8A96E", fontSize:11, fontWeight:"bold", cursor:"pointer", lineHeight:1, fontFamily:"monospace", flexShrink:0 }}>
            📝 {pendingDrafts.length}
          </button>
        )}
        {showAdminButtons && (<>
          <button onClick={() => { setShowNotifications(true); fetchNotifications(); }} title="Pendientes de aprobación"
            style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🔔
            {notifCount > 0 && (
              <span style={{ position:"absolute", top:-5, right:-5, background:"#ef4444", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Mantenimientos realizados"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            📋
          </button>
          <button onClick={() => setShowCentroMando(true)} title="Centro de Mando de Mantenimientos"
            style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
            🛠
          </button>
          {esTavo && (
            <button onClick={() => { setShowBorradores(true); fetchBorradores(); }} title="Borradores sin finalizar"
              style={{ position:"relative", padding:"5px 8px", borderRadius:8, border:`1px solid ${line}`, background:card, color:"#888", fontSize:13, cursor:"pointer", lineHeight:1 }}>
              🗂
              {adminDrafts.length > 0 && (
                <span style={{ position:"absolute", top:-5, right:-5, background:"#888", color:"#fff", borderRadius:"50%", fontSize:9, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontWeight:"bold", padding:"0 2px" }}>
                  {adminDrafts.length > 9 ? "9+" : adminDrafts.length}
                </span>
              )}
            </button>
          )}
        </>)}
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
        <button onClick={onLogout} title="Cerrar sesión" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:11, cursor:"pointer", fontFamily:"monospace", lineHeight:1, flexShrink:0 }}>→|</button>
      </div>
      <div style={{ padding:"3px 16px", background:"#09090e", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

      {notificationsPanel}
      {completedPanel}
      {borradoresPanel}
      {centroMandoPanel}
      {verTodosPanel}

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

      {/* Auto-save indicator */}
      {autoSaveStatus && (
        <div style={{ padding:"3px 16px", textAlign:"right", fontSize:9, letterSpacing:1, color: autoSaveStatus === "saved" ? "#4ade80" : autoSaveStatus === "error" ? "#f87171" : "#888" }}>
          {autoSaveStatus === "saving" ? "⏳ Guardando..." : autoSaveStatus === "saved" ? "💾 Guardado" : "⚠️ Error al guardar"}
        </div>
      )}

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
                              <button className="chk-btn"
                                onClick={()=> status==="ok" ? (setTaskStatus(p=>({...p,[id]:undefined})), setChk(p=>({...p,[id]:false}))) : setStatus(id,"ok","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="ok"?"#4ade8060":"#2a3a2a"}`, background:status==="ok"?"#4ade8020":"transparent", color:status==="ok"?"#4ade80":"#3a5a3a", fontWeight:status==="ok"?"bold":"normal" }}
                              >{isMobile ? "✓" : "✓ OK"}</button>
                              <button className="chk-btn"
                                onClick={()=> status==="issue" && !isOpen ? setActiveIssue(id) : setStatus(id,"issue","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="issue"?"#f8717160":"#3a2a2a"}`, background:status==="issue"?"#f8717120":"transparent", color:status==="issue"?"#f87171":"#5a3a3a", fontWeight:status==="issue"?"bold":"normal" }}
                              >{isMobile ? "⚠" : "⚠ Det."}</button>
                              <button className="chk-btn"
                                onClick={()=> status==="na" ? (setTaskStatus(p=>({...p,[id]:undefined})), setChk(p=>({...p,[id]:false}))) : setStatus(id,"na","",text)}
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="na"?"#55555560":"#2a2a2a"}`, background:status==="na"?"#33333320":"transparent", color:status==="na"?"#666":"#3a3a3a", fontWeight:status==="na"?"bold":"normal" }}
                              >{isMobile ? "—" : "— N/A"}</button>
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
                            {/* Fotos de evidencia */}
                            {taskPhotos[id]?.length > 0 && (
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                                {taskPhotos[id].map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt={`Evidencia ${idx+1}`} style={{ width:60, height:60, objectFit:"cover", borderRadius:4, border:"1px solid #f8717140" }} />
                                  </a>
                                ))}
                              </div>
                            )}
                            <div style={{ display:"flex", gap:6, marginTop:6 }}>
                              <button onClick={()=>{ setTaskStatus(p=>({...p,[id]:undefined})); setActiveIssue(null); }}
                                style={{ flex:1, padding:"6px", borderRadius:4, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
                                Cancelar
                              </button>
                              <button onClick={()=>uploadPhoto(id)}
                                style={{ flex:1, padding:"6px", borderRadius:4, border:"1px solid #60a5fa60", background:"#60a5fa18", color:"#60a5fa", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
                                📷 Foto
                              </button>
                              <button onClick={()=>confirmIssue(id,text)}
                                style={{ flex:2, padding:"6px", borderRadius:4, border:"1px solid #f8717150", background:"#f8717118", color:"#f87171", fontFamily:"monospace", fontSize:10, cursor:"pointer", fontWeight:"bold" }}>
                                ⚠ Guardar en notas
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Resumen del detalle guardado */}
                        {status==="issue" && !isOpen && (taskIssue[id] || taskPhotos[id]?.length > 0) && (
                          <div onClick={()=>setActiveIssue(id)} style={{ padding:"6px 10px", borderRadius:"0 0 6px 6px", background:"#1a0808", border:`1px solid #f8717140`, borderTop:"none", cursor:"pointer" }}>
                            {taskIssue[id] && <div style={{ fontSize:11, color:"#f87171" }}>✎ {taskIssue[id]}</div>}
                            {taskPhotos[id]?.length > 0 && (
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop: taskIssue[id] ? 6 : 0 }}>
                                {taskPhotos[id].map((url, idx) => (
                                  <img key={idx} src={url} alt="" style={{ width:40, height:40, objectFit:"cover", borderRadius:3, border:"1px solid #f8717130" }} onClick={e=>{ e.stopPropagation(); window.open(url,"_blank"); }} />
                                ))}
                              </div>
                            )}
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
              <button onClick={handleReset} style={{ flex:1, padding:10, borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:11, letterSpacing:2, cursor:"pointer" }}>↺ REINICIAR</button>
              <button onClick={markAll} style={{ flex:1, padding:10, borderRadius:6, border:`1px solid ${G}50`, background:G+"18", color:G, fontFamily:"monospace", fontSize:11, letterSpacing:2, cursor:"pointer" }}>✓ MARCAR TODO</button>
            </div>

            {/* BOTÓN CONTINUAR */}
            <div className="sticky-action">
              <button
                onClick={() => { setTab("notes"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${G}60`, background:`linear-gradient(135deg, ${G}20, ${G}10)`, color:G, fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                📝 CONTINUAR → NOTAS Y FIRMA
              </button>
            </div>
          </>
        ) : (
          /* NOTAS */
          <div style={{ paddingBottom:24 }}>
            <div style={{ fontSize:11, color:"#555", letterSpacing:3, marginBottom:8 }}>OBSERVACIONES</div>
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

              {/* Botón confirmar */}
              <div className="sticky-action">
                <button
                  onClick={confirmSig}
                  disabled={!mechName.trim()}
                  style={{ width:"100%", padding:"14px", borderRadius:6, border:`1px solid ${mechName.trim()?"#C8A96E60":"#2a2a3a"}`, background:mechName.trim()?"#C8A96E20":card, color:mechName.trim()?"#C8A96E":"#444", fontFamily:"monospace", fontSize:13, letterSpacing:1, cursor:mechName.trim()?"pointer":"default", fontWeight:"bold" }}
                >
                  ✓ CONFIRMAR Y GUARDAR
                </button>
              </div>

              {/* Indicador */}
              {!sigDate && !mechName.trim() && (
                <div style={{ fontSize:10, color:"#444", textAlign:"center", padding:"6px", borderRadius:6, border:"1px dashed #2a2a3a" }}>
                  ① Seleccioná el mecánico  ② Confirmá
                </div>
              )}

              {/* ── PANTALLA DE FINALIZACIÓN ── */}
              {sigDate && mechName.trim() && (
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

                  {/* Flujo de aprobación */}
                  {modoRevision && !aprobado && (
                    <div style={{ marginBottom:10, padding:"14px", borderRadius:8, border:"1px solid #4ade8040", background:"#4ade8006" }}>
                      <div style={{ fontSize:10, color:"#4ade80", letterSpacing:1, marginBottom:10, textAlign:"center" }}>📋 REVISIÓN DE APROBACIÓN</div>
                      <div style={{ fontSize:9, color:"#555", marginBottom:10, textAlign:"center" }}>Seleccioná quién realiza la aprobación:</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {["Otto Ramos","Gustavo Ramos","Arturo Ramos"].map(nombre => (
                          <button key={nombre} onClick={async () => {
                            try {
                              await fetch(`${SUPABASE_URL}/rest/v1/servicios?id=eq.${editingId}`, {
                                method: "PATCH",
                                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ aprobado: true, aprobado_por: nombre }),
                              });
                              setAprobado(true);
                              setAprobadoPor(nombre);
                              if (mechName) notifyPush([mechName], "Servicio aprobado", `Aprobado por ${nombre} — ${plate} (${model})`);
                            } catch(e) { console.error(e); }
                          }}
                            style={{ width:"100%", padding:"10px", borderRadius:6, border:"1px solid #4ade8040", background:"#4ade8010", color:"#4ade80", fontFamily:"monospace", fontSize:11, cursor:"pointer", letterSpacing:1, textAlign:"center" }}>
                            ✅ Revisión de aprobación — {nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!modoRevision && !aprobado && (
                    <div style={{ padding:"10px 14px", borderRadius:8, border:"1px solid #C8A96E30", background:"#C8A96E06", marginBottom:10, textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#C8A96E", letterSpacing:1 }}>⏳ PENDIENTE DE APROBACIÓN</div>
                    </div>
                  )}
                  {aprobado && (
                    <>
                      <div style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #4ade8030", background:"#4ade8008", marginBottom:10, textAlign:"center", fontSize:10, color:"#4ade80" }}>
                        ✅ Aprobado por {aprobadoPor}
                      </div>
                      {/* Enviar a la orden — solo visible si está aprobado */}
                      {ordenId ? (
                        ordenEnvioStatus === "done" ? (
                          <div style={{ padding:"12px 14px", borderRadius:8, border:"1px solid #4ade8050", background:"#0a1a0a", marginBottom:10 }}>
                            <div style={{ fontSize:9, color:"#4ade80", letterSpacing:2, marginBottom:6 }}>✅ ENVIADO A LA ORDEN {ordenNumero}</div>
                            <div style={{ fontSize:11, color:"#888", marginBottom:10 }}>El informe fue guardado en la orden de trabajo.</div>
                            <a href="https://taller.ramosyramoscr.com" target="_blank" rel="noreferrer"
                              style={{ display:"block", textAlign:"center", padding:"10px", borderRadius:6, border:"1px solid #4ade8050", background:"#4ade8015", color:"#4ade80", fontFamily:"monospace", fontSize:11, textDecoration:"none", letterSpacing:1 }}>
                              🔗 Ver orden →
                            </a>
                          </div>
                        ) : (
                          <button onClick={enviarAOrden} disabled={ordenEnvioStatus === "sending"}
                            style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${ordenEnvioStatus==="sending"?"#2a2a3a":"#C8A96E80"}`, background:ordenEnvioStatus==="sending"?"#0a0a14":"#C8A96E18", color:ordenEnvioStatus==="sending"?"#444":"#C8A96E", fontFamily:"monospace", fontSize:12, cursor:ordenEnvioStatus==="sending"?"default":"pointer", fontWeight:"bold", marginBottom:10, letterSpacing:1 }}>
                            {ordenEnvioStatus === "sending" ? "⏳ Enviando..." : "📋 Enviar a la orden de trabajo"}
                          </button>
                        )
                      ) : (
                        <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid #2a2a3a", background:"#0c0c14", marginBottom:10, fontSize:11, color:"#555", lineHeight:1.6 }}>
                          ℹ️ Este servicio fue creado manualmente. Para asociarlo a una orden, abrilo desde el sistema del Taller.
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={()=>{ handleReset(); window.scrollTo({top:0,behavior:"smooth"}); }} style={{ width:"100%", padding:"10px", borderRadius:6, border:`1px solid ${line}`, background:card, color:"#555", fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>
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
