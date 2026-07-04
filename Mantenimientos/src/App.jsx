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
const bg = "#0B0B0D", card = "#16181c", line = "#2f363b";
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
  const fieldStyle = { background:"#121316", border:"1px solid #2f363b", color:"#e0d8cc", borderRadius:8, padding:"12px 14px", fontSize:13, fontFamily:"monospace", outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", background:"#0B0B0D", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:24 }}>
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
          style={{ marginTop:4, padding:"13px", borderRadius:8, border:`1px solid ${active ? "#C8A96E60" : "#2f363b"}`, background: active ? "#C8A96E20" : "#121316", color: active ? "#C8A96E" : "#444", fontFamily:"monospace", fontSize:12, letterSpacing:2, fontWeight:"bold", cursor: active ? "pointer" : "default" }}>
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

// ── Revisión serie 'C': distinción fina RC (compra) / RG (general) ──
// esRC = pertenece a la serie 'C' (comparten todo: sin aceite, dictamen,
// informe al comprador/dueño). tipoRevision distingue, por código exacto,
// el set de opciones del dictamen y los textos de branding.
const tipoRevision = (codigo) => {
  const c = (codigo || "").toUpperCase();
  return c === "RG" ? "general" : c === "RC" ? "compra" : null;
};
const DICTAMEN_OPCIONES = {
  compra: [
    { key:"apto",              label:"✅ Apto para compra",       color:"#4ade80" },
    { key:"apto_reparaciones", label:"⚠️ Apto con reparaciones",  color:"#fbbf24" },
    { key:"no_recomendable",   label:"❌ No recomendable",        color:"#f87171" },
  ],
  general: [
    { key:"excelente",             label:"✅ Excelente",                color:"#4ade80" },
    { key:"bueno",                 label:"🟡 Bueno, atención menor",    color:"#a3e635" },
    { key:"requiere_reparaciones", label:"🟠 Requiere reparaciones",    color:"#fb923c" },
    { key:"critico",               label:"🔴 Estado crítico",           color:"#f87171" },
  ],
};

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
  const [activeCKeys, setActiveCKeys] = useState([]);          // serie 'C' — Revisión de Compra
  const [dictamenRec,  setDictamenRec]  = useState("");        // clave del dictamen — RC: apto/apto_reparaciones/no_recomendable · RG: excelente/bueno/requiere_reparaciones/critico
  const [reparaciones, setReparaciones] = useState([]);        // [{ descripcion, costo_estimado }]

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
      const newCKeys = recetas.filter(r => r.serie === 'C').map(r => r.codigo);
      setActiveItems(newItems);
      setActiveCodes(newCodes);
      setActiveAKeys(newAKeys);
      setActiveBKeys(newBKeys);
      setActiveCKeys(newCKeys);
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
  const esRC           = activeCKeys.includes(sel);                                   // serie 'C' (Revisión de Compra o General)
  const tipoRev        = tipoRevision(sel);                                           // 'compra' | 'general' | null
  const revisionLabel  = tipoRev === "general" ? "Revisión General" : "Revisión de Compra";
  const dictamenOpciones = DICTAMEN_OPCIONES[tipoRev] || DICTAMEN_OPCIONES.compra;
  const llevaAceite    = Array.isArray(svc.items) && svc.items.includes("3");         // la receta incluye cambio de aceite (ítem "3")
  const servicioTitulo = esRC ? revisionLabel : `Servicio ${sel}`;
  const dictamenTotal  = reparaciones.reduce((s, r) => s + (Number(r.costo_estimado) || 0), 0);
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
  autoSaveRef.current = { tasks, taskStatus, taskIssue, taskPhotos, checked, plate, model, engine, mechName, sel, svc, km, fuel, is4m, oilLiters, oilSpec, notes, doneN, total, sigDate, ordenId, ordenNumero, vehAnio, vehVersion, esRC, llevaAceite, dictamenRec, reparaciones, dictamenTotal };

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
          aceite_litros: (d.oilLiters > 0 && d.llevaAceite) ? d.oilLiters : null,
          aceite_spec:   (d.oilLiters > 0 && d.llevaAceite) ? d.oilSpec  : null,
          revisiones: byGrpMap, observaciones: d.notes,
          pendientes: Object.entries(d.taskIssue).filter(([,v]) => v).map(([,v]) => v),
          progreso: { completadas: d.doneN, total: d.total },
          aprobado: false, fotos: d.taskPhotos,
          dictamen: d.esRC ? { recomendacion: d.dictamenRec, reparaciones: d.reparaciones, total_estimado: d.dictamenTotal } : null,
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
  }, [step, taskStatus, taskIssue, taskPhotos, mechName, notes, exChk, dictamenRec, reparaciones]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setDictamenRec(s.dictamen?.recomendacion || "");
    setReparaciones(Array.isArray(s.dictamen?.reparaciones) ? s.dictamen.reparaciones : []);

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
      <div key={s.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:8, background:"#101113", border:`1px solid ${line}` }}>
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
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#16181c", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
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
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#16181c", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>📋 Servicios realizados</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>
              {completedList.length === 100 ? "MOSTRANDO LOS 100 MÁS RECIENTES" : `${completedList.length} REGISTRO${completedList.length !== 1 ? "S" : ""}`}
            </div>
          </div>
          <button onClick={() => setShowCompleted(false)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {completedLoading && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>Cargando...</div>}
          {!completedLoading && completedList.length === 0 && <div style={{ textAlign:"center", color:"#555", padding:40, fontSize:12 }}>No hay servicios completados todavía.</div>}
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
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#16181c", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
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
              <div key={b.id} style={{ marginBottom:8, padding:"10px 12px", borderRadius:8, background:"#101113", border:`1px solid ${esViejo ? '#555' : line}`, opacity: esViejo ? 0.65 : 1 }}>
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
          <div style={{ background:"#16181c", border:"1px solid #d3333380", borderRadius:10, padding:"20px 18px", maxWidth:360, width:"100%", fontFamily:"monospace" }}>
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
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(380px,100vw)", height:"100vh", background:"#16181c", borderLeft:`1px solid ${line}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc" }}>🛠 Centro de Mando</div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>CATÁLOGO DE SERVICIOS</div>
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
              {[["Serie A", activeAKeys],["Serie B", activeBKeys],...(activeCKeys.length > 0 ? [["Serie C — Revisiones", activeCKeys]] : [])].map(([titulo, keys]) => (
                <div key={titulo} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${line}` }}>{titulo.toUpperCase()}</div>
                  {keys.map(k => {
                    const def = activeCodes[k];
                    if (!def) return null;
                    const isOpen = openCode === k;
                    return (
                      <div key={k} style={{ marginBottom: isOpen ? 8 : 3 }}>
                        <div onClick={() => setOpenCode(isOpen ? null : k)}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius: isOpen ? "6px 6px 0 0" : 6, background:"#101113", border:`1px solid ${isOpen ? def.color+"60" : line}`, cursor:"pointer", userSelect:"none" }}>
                          <span style={{ fontSize:10, fontWeight:"bold", color:def.color, background:`${def.color}18`, border:`1px solid ${def.color}40`, borderRadius:4, padding:"1px 6px", flexShrink:0 }}>{k}</span>
                          <span style={{ flex:1, fontSize:11, color:"#aaa" }}>{def.desc}</span>
                          <span style={{ fontSize:9, color:"#555" }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                        {isOpen && (
                          <div style={{ padding:"8px 10px", borderRadius:"0 0 6px 6px", background:"#0B0B0D", border:`1px solid ${def.color}60`, borderTop:"none" }}>
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
              <div style={{ marginTop:4, padding:"10px 12px", borderRadius:6, background:"#101113", border:`1px solid ${line}`, fontSize:10, color:"#555", lineHeight:1.6 }}>
                ℹ️ Los vehículos diesel suman <span style={{ color:"#7dd3fc" }}>GLOW</span> (bujías de precalentamiento) y los 4MATIC suman los diferenciales automáticamente; no aparecen en la receta.
              </div>
            </>
          )}
          {cmTab === "items" && (
            <div>
              <div style={{ fontSize:9, color:"#555", letterSpacing:3, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${line}` }}>CATÁLOGO COMPLETO</div>
              {Object.entries(activeItems).map(([key, block]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", marginBottom:3, borderRadius:6, background:"#101113", border:`1px solid ${line}` }}>
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
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#0B0B0D", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${line}`, display:"flex", alignItems:"center", gap:12, flexShrink:0, flexWrap:"wrap" }}>
        <button onClick={() => setShowVerTodos(false)}
          style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${line}`, background:"transparent", color:"#888", fontSize:12, fontFamily:"monospace", cursor:"pointer", letterSpacing:1, flexShrink:0 }}>
          ✕ CERRAR
        </button>
        <div style={{ flexShrink:0 }}>
          <div style={{ fontWeight:"bold", fontSize:13, color:"#e0d8cc", letterSpacing:1 }}>TODOS LOS SERVICIOS</div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>{verTodosFiltered.length} REGISTROS{verTodosSearch ? " (filtrados)" : ""}</div>
        </div>
        <input
          value={verTodosSearch}
          onChange={e => { setVerTodosSearch(e.target.value); setVerTodosPage(0); }}
          placeholder="Buscar placa, modelo o mecánico…"
          style={{ marginLeft:"auto", background:"#101113", border:`1px solid ${line}`, color:"#e0d8cc", borderRadius:6, padding:"7px 12px", fontSize:12, fontFamily:"monospace", outline:"none", width:"min(260px,100%)", flexShrink:0 }}
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
            {verTodosSearch ? "Sin resultados." : "No hay servicios registrados."}
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
      aceite: (oilLiters > 0 && llevaAceite) ? { litros: oilLiters, especificacion: oilSpec } : null,
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
    return `## 🚗 ${model || "Vehículo"} · ${servicioTitulo}

| Campo | Detalle |
|-------|---------|
| **Placa** | ${plate || "—"} |
| **Motor** | ${engine || "—"} |
| **Kilometraje** | ${km ? parseInt(km).toLocaleString()+" km" : "—"} |
| **Combustible** | ${fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"}${is4m?" · ⚙️ 4MATIC":""} |
${(oilLiters > 0 && llevaAceite) ? `| **Aceite** | 🛢️ ${oilLiters} L — ${oilSpec} |` : ""}
| **Mecánico** | ${mechName} |
| **Fecha** | ${sigDate} |

---

${combinedSection}
_Progreso: ${doneN}/${total} ítems (${pct}%)_`;
  };

  // ── Markdown builder for ordenes.informe_mantenimiento ──
  const buildInformeMarkdown = (overrideClientUrl) => {
    const issueTasks = tasks.filter(t => taskStatus[t.id] === "issue" || taskIssue[t.id]);
    let txt = `🔧 ${servicioTitulo} — ${sigDate}\n\n`;
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
    const tipoFrase = tipoRev === "general" ? "de la revisión general" : tipoRev === "compra" ? "de la revisión de compra" : "del mantenimiento";
    txt += `\n\n🔗 Detalle completo ${tipoFrase}:\n${finalUrl || "(enlace pendiente)"}`;
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
        const ok = confirm("⚠️ Esta orden ya tiene un informe guardado. ¿Sobrescribir?");
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
    if (esRC && !dictamenRec) {
      alert(tipoRev === "general"
        ? "⚠️ Seleccioná el estado del vehículo (Excelente / Bueno / Requiere reparaciones / Crítico) antes de firmar la revisión."
        : "⚠️ Seleccioná una recomendación de compra (Apto / Apto con reparaciones / No recomendable) antes de firmar la revisión.");
      return;
    }
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
        aceite_litros:   (oilLiters > 0 && llevaAceite) ? oilLiters : null,
        aceite_spec:     (oilLiters > 0 && llevaAceite) ? oilSpec : null,
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
        dictamen:        esRC ? { recomendacion: dictamenRec, reparaciones, total_estimado: dictamenTotal } : null,
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
        esRC ? `${revisionLabel} pendiente de aprobación` : "Servicio pendiente de aprobación",
        `${mechName} — ${plate} (${model})`
      );
      setSigDate(fecha);
    } catch(e) {
      console.error("[confirmSig] save failed:", e.message);
      alert(`⚠️ ERROR al guardar el informe:\n\n${e.message}\n\nPor favor reintentá. Si persiste, contactá soporte. NO cierres la app.`);
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
              <div style={{ fontSize:13, color:"#C8A96E", fontWeight:"bold" }}>📝 Tus servicios en progreso ({pendingDrafts.length})</div>
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
                <div key={draft.id || idx} style={{ border:`1px solid ${isOld ? '#f97316' : line}`, borderRadius:8, padding:"10px 12px", marginBottom:10, background:"#16181c" }}>
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
              <div key={d.id || idx} style={{ border:`1px solid ${line}`, borderRadius:6, padding:"10px 12px", marginBottom:8, background:"#16181c" }}>
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
          <button onClick={() => setDraftPrompt(true)} title="Ver mis servicios no finalizados"
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
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Servicios realizados"
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
      <div style={{ padding:"3px 16px", background:"#0B0B0D", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

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
                          <div style={{ padding:"4px 10px 2px", fontSize:8, color:"#444", letterSpacing:2, background:"#101113" }}>
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
            style={{ width:"100%", padding:"14px", borderRadius:8, border:`1px solid ${model?G+"60":"#2f363b"}`, background:model?G+"18":"transparent", color:model?G:"#333", fontFamily:"monospace", fontSize:13, fontWeight:"bold", letterSpacing:2, cursor:model?"pointer":"default" }}>
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
          <button onClick={() => setDraftPrompt(true)} title="Ver mis servicios no finalizados"
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
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Servicios realizados"
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
      <div style={{ padding:"3px 16px", background:"#0B0B0D", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

      {notificationsPanel}
      {completedPanel}
      {borradoresPanel}
      {centroMandoPanel}
      {verTodosPanel}

      {/* Resumen vehículo seleccionado */}
      <div style={{ padding:"10px 16px", background:"#101113", borderBottom:`1px solid ${line}` }}>
        <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:4 }}>VEHÍCULO SELECCIONADO</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ color:"#C8A96E", fontWeight:"bold", fontSize:12 }}>{model.split("(")[0].trim()}</span>
          {engine && <span style={{ fontSize:10, color:"#888" }}>· {engine}</span>}
          {plate && <span style={{ fontSize:10, background:"#16181c", border:`1px solid ${line}`, borderRadius:4, padding:"1px 7px", letterSpacing:2, color:"#aaa" }}>{plate}</span>}
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
          {activeCKeys.length > 0 && (
            <>
              <div style={{ fontSize:9, color:"#a78bfa80", letterSpacing:2, margin:"12px 0 6px" }}>REVISIONES</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {activeCKeys.map(k => { const s=activeCodes[k]||{},on=sel===k; return (
                  <button key={k} onClick={()=>setSel(k)} className="svc-btn"
                    style={{ padding:"7px 12px", borderRadius:6, border:on?`1.5px solid ${s.color}`:`1px solid ${line}`, background:on?s.color+"22":"transparent", color:on?s.color:"#555", fontFamily:"monospace", fontSize:11, cursor:"pointer", fontWeight:on?"bold":"normal" }}>
                    {k}
                  </button>
                );})}
              </div>
            </>
          )}
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
              <div style={{ fontSize:13, color:"#C8A96E", fontWeight:"bold" }}>📝 Tus servicios en progreso ({pendingDrafts.length})</div>
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
                <div key={draft.id || idx} style={{ border:`1px solid ${isOld ? '#f97316' : line}`, borderRadius:8, padding:"10px 12px", marginBottom:10, background:"#16181c" }}>
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
              <div key={d.id || idx} style={{ border:`1px solid ${line}`, borderRadius:6, padding:"10px 12px", marginBottom:8, background:"#16181c" }}>
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
          <div style={{ fontSize:10, padding:"3px 11px", borderRadius:20, border:`1px solid ${isComplete?"#4ade80":G}`, color:isComplete?"#4ade80":G, background:isComplete?"#14532d":"#16181c" }}>
            {isComplete ? "✓ COMPLETO" : pct+"%"}
          </div>
        )}
        {pendingDrafts.length > 0 && (
          <button onClick={() => setDraftPrompt(true)} title="Ver mis servicios no finalizados"
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
          <button onClick={() => { setShowCompleted(true); fetchCompleted(); }} title="Servicios realizados"
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
      <div style={{ padding:"3px 16px", background:"#0B0B0D", borderBottom:`1px solid ${line}`, fontSize:9, color:"#555", letterSpacing:1, textAlign:"right" }}>👤 {session.nombre}</div>

      {notificationsPanel}
      {completedPanel}
      {borradoresPanel}
      {centroMandoPanel}
      {verTodosPanel}

      {/* RESUMEN COMPACTO — vehículo + servicio seleccionados */}
      <div style={{ padding:"8px 16px", background:"#101113", borderBottom:`1px solid ${line}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{model.split("(")[0].trim()}</span>
            {plate && <span style={{ color:"#aaa", letterSpacing:1 }}>· {plate}</span>}
            <span style={{ fontSize:10, background:G+"20", border:`1px solid ${G}40`, color:G, borderRadius:4, padding:"1px 7px" }}>{sel}</span>
            <span style={{ fontSize:10, color:"#555" }}>{fuel==="diesel"?"🛢️":"⛽"}{is4m?" · 4MATIC":""}</span>
          </div>
          <button onClick={()=>setStep(2)} style={{ fontSize:10, color:"#555", background:"transparent", border:`1px solid ${line}`, borderRadius:6, padding:"3px 7px", cursor:"pointer", fontFamily:"monospace", flexShrink:0 }}>✏️ editar</button>
        </div>
        {oilLiters > 0 && llevaAceite && (
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
                                  : status==="na"    ? "#0B0B0D"
                                  : isInfo ? "#101113" : card;
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
                                style={{ padding:"3px 7px", borderRadius:4, fontSize:10, fontFamily:"monospace", cursor:"pointer", border:`1px solid ${status==="na"?"#55555560":"#2f363b"}`, background:status==="na"?"#33333320":"transparent", color:status==="na"?"#666":"#3a3a3a", fontWeight:status==="na"?"bold":"normal" }}
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
                <div>🔧 <span style={{ color:G, fontWeight:"bold" }}>{servicioTitulo}</span></div>
                {model && <div>🚗 {model}</div>}
                {engine && <div>⚙️ {engine}</div>}
                {oilLiters > 0 && llevaAceite && <div>🛢️ Aceite: <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{oilLiters} L</span> · {oilSpec}</div>}
                {plate && <div>📋 <span style={{ letterSpacing:2 }}>{plate}</span></div>}
                {km    && <div>📍 {parseInt(km).toLocaleString()} km</div>}
                <div>{fuel==="diesel"?"🛢️ Diesel":"⛽ Gasolina"} {is4m?"· ⚙️ 4MATIC":""}</div>
                <div>✅ Progreso ASSYST: <span style={{ color:isComplete?"#4ade80":G }}>{doneN}/{total} ({pct}%)</span>{naN > 0 && <span style={{ color:"#555", fontSize:10 }}> · {naN} N/A</span>}</div>
                {exDoneN > 0 && <div>🔎 Revisiones adicionales: <span style={{ color:"#a855f7" }}>{exDoneN}/{exTotal}</span></div>}
              </div>
            </div>

            {/* ── DICTAMEN (solo Revisión de Compra / General — serie 'C') ── */}
            {esRC && (
              <div style={{ marginTop:20, paddingTop:16, borderTop:"1px dashed #2f363b" }}>
                <div style={{ fontSize:11, color:"#a78bfa", letterSpacing:3, marginBottom:12 }}>📋 DICTAMEN DE {revisionLabel.toUpperCase()}</div>

                {/* Recomendación / estado */}
                <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:8 }}>{tipoRev === "general" ? "ESTADO DEL VEHÍCULO" : "RECOMENDACIÓN GENERAL"} <span style={{ color:"#f87171" }}>*</span></div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                  {dictamenOpciones.map(o => { const on = dictamenRec === o.key; return (
                    <button key={o.key} onClick={()=>setDictamenRec(o.key)}
                      style={{ padding:"12px 14px", borderRadius:8, textAlign:"left", cursor:"pointer", fontFamily:"monospace", fontSize:13, fontWeight:on?"bold":"normal", border:`1.5px solid ${on?o.color:line}`, background:on?o.color+"18":card, color:on?o.color:"#888" }}>
                      {on ? "●" : "○"}  {o.label}
                    </button>
                  );})}
                </div>

                {/* Reparaciones sugeridas */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>REPARACIONES SUGERIDAS</div>
                  <button onClick={()=>setReparaciones(p=>[...p, { descripcion:"", costo_estimado:"" }])}
                    style={{ fontSize:11, color:"#a78bfa", background:"transparent", border:"1px solid #a78bfa60", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"monospace" }}>
                    + Agregar
                  </button>
                </div>
                {reparaciones.length === 0 && (
                  <div style={{ fontSize:11, color:"#444", fontStyle:"italic", marginBottom:12 }}>Sin reparaciones sugeridas.</div>
                )}
                {reparaciones.map((r, i) => (
                  <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                    <input value={r.descripcion} placeholder="Descripción de la reparación"
                      onChange={e=>setReparaciones(p=>p.map((x,j)=>j===i?{...x, descripcion:e.target.value}:x))}
                      style={{ flex:1, minWidth:0, background:card, border:`1px solid ${line}`, borderRadius:6, color:"#ccc", fontSize:12, fontFamily:"monospace", padding:"8px 10px", boxSizing:"border-box", outline:"none" }} />
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      <span style={{ fontSize:12, color:"#555" }}>₡</span>
                      <input value={r.costo_estimado} placeholder="0" inputMode="numeric"
                        onChange={e=>setReparaciones(p=>p.map((x,j)=>j===i?{...x, costo_estimado:e.target.value.replace(/[^\d]/g,"")}:x))}
                        style={{ width:90, background:card, border:`1px solid ${line}`, borderRadius:6, color:"#C8A96E", fontSize:12, fontFamily:"monospace", padding:"8px 10px", boxSizing:"border-box", outline:"none", textAlign:"right" }} />
                    </div>
                    <button onClick={()=>setReparaciones(p=>p.filter((_,j)=>j!==i))}
                      style={{ flexShrink:0, background:"transparent", border:`1px solid ${line}`, borderRadius:6, color:"#f87171", fontSize:14, cursor:"pointer", padding:"6px 9px", lineHeight:1 }}>
                      ×
                    </button>
                  </div>
                ))}
                {reparaciones.length > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, padding:"8px 12px", borderRadius:8, background:"#a78bfa10", border:"1px solid #a78bfa30" }}>
                    <span style={{ fontSize:11, color:"#888", letterSpacing:1 }}>TOTAL ESTIMADO</span>
                    <span style={{ fontSize:13, fontWeight:"bold", color:"#a78bfa" }}>₡{dictamenTotal.toLocaleString("es-CR")}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── FIRMA DEL MECÁNICO ── */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px dashed #2f363b", paddingBottom:32 }}>
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
              <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:8, border:`1px solid ${line}`, background:"#101113" }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 }}>SERVICIO A CERTIFICAR</div>
                <div style={{ fontSize:11, color:"#888", lineHeight:1.9 }}>
                  <div>🔧 <span style={{ color:"#C8A96E", fontWeight:"bold" }}>{servicioTitulo}</span> — {svc.desc}</div>
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
                  style={{ width:"100%", padding:"14px", borderRadius:6, border:`1px solid ${mechName.trim()?"#C8A96E60":"#2f363b"}`, background:mechName.trim()?"#C8A96E20":card, color:mechName.trim()?"#C8A96E":"#444", fontFamily:"monospace", fontSize:13, letterSpacing:1, cursor:mechName.trim()?"pointer":"default", fontWeight:"bold" }}
                >
                  ✓ CONFIRMAR Y GUARDAR
                </button>
              </div>

              {/* Indicador */}
              {!sigDate && !mechName.trim() && (
                <div style={{ fontSize:10, color:"#444", textAlign:"center", padding:"6px", borderRadius:6, border:"1px dashed #2f363b" }}>
                  ① Seleccioná el mecánico  ② Confirmá
                </div>
              )}

              {/* ── PANTALLA DE FINALIZACIÓN ── */}
              {sigDate && mechName.trim() && (
                <div style={{ marginTop:4 }}>
                  {/* Declaración principal */}
                  <div style={{ padding:"20px 16px", borderRadius:10, border:"2px solid #C8A96E60", background:"linear-gradient(180deg,#C8A96E0a 0%,#0B0B0D 100%)", textAlign:"center", marginBottom:14 }}>
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
                            style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${ordenEnvioStatus==="sending"?"#2f363b":"#C8A96E80"}`, background:ordenEnvioStatus==="sending"?"#0B0B0D":"#C8A96E18", color:ordenEnvioStatus==="sending"?"#444":"#C8A96E", fontFamily:"monospace", fontSize:12, cursor:ordenEnvioStatus==="sending"?"default":"pointer", fontWeight:"bold", marginBottom:10, letterSpacing:1 }}>
                            {ordenEnvioStatus === "sending" ? "⏳ Enviando..." : "📋 Enviar a la orden de trabajo"}
                          </button>
                        )
                      ) : (
                        <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid #2f363b", background:"#101113", marginBottom:10, fontSize:11, color:"#555", lineHeight:1.6 }}>
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
