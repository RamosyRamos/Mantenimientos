// ── Reabrir un checklist guardado: cada punto a su tarea (fix/revisiones-fase1, 25/10) ──
//
// PURO (sin red, sin React). Mantenimientos es la única app que vuelve a ARMAR
// el checklist desde la receta de hoy (buildTasks) y le vuelca encima lo que
// se guardó. Hasta hoy el vuelco iba por el id del punto, que era su POSICIÓN
// en la receta: al agregar, borrar o reordenar tareas en Configuraciones, la
// marca de una tarea caía sobre otra (en la #2905 la prueba de batería quedaba
// sobre el escaneo).
//
// Orden del emparejamiento (decisión de Tavo del 25/10):
//   1. Clave estable (`<ítem>:<n>`) → la tarea con esa clave. Una clave que ya
//      no existe NO se busca por texto: va a la versión anterior.
//   2. Id viejo (`<ítem>_<i>`) → por el TEXTO guardado, solo entre las tareas
//      de ese ítem: primero exacto, después normalizado (sin tildes, mayúsculas
//      ni signos). El número del id viejo nunca se usa.
//   3. Sin id → por texto entre todas las tareas (exacto, después normalizado).
// Uno a uno y EN ORDEN: cada tarea recibe un solo punto, y dos puntos con el
// mismo texto toman las dos tareas iguales en el orden en que están.
// Lo que no calza va a "Puntos de la versión anterior" (solo lectura, con su
// estado, detalle y fotos), y al guardar se conserva tal cual, con su id viejo
// y `version_anterior: true`. Nunca se pega por posición.
//
// Adicionales (decisión de Tavo del 26/10): los puntos de un adicional
// DESMARCADO (GLOW, 4M_DIFF, 4M_FDIFF) no van a la versión anterior: quedan
// OCULTOS, se guardan aparte (servicios.puntos_ocultos, nunca en `revisiones`,
// así el cliente no los ve ni los cuenta) y vuelven al checklist con sus marcas
// si se vuelve a marcar el adicional. Lo elegido se guarda en
// servicios.adicionales: al reabrir manda la columna, nunca los puntos.

import { esClaveEstable, itemDeIdPunto, normalizarTextoPunto, puntosDeRevisiones, esVersionAnterior, esFilaInformativa } from "./revisionPuntos.js";
import { stripInterna, idDeTarea, ADICIONALES, adicionalesDeTareas } from "./checklistReceta.js";
import { firmaItem } from "../servicioConcurrencia.js";

// Todas las tareas posibles de hoy, con el id que les da buildTasks.
//   items = { [clave]: { tasks, claves } } (mant_items cargado)
export function indiceDeTareas(items) {
  const out = [];
  for (const [clave, block] of Object.entries(items || {})) {
    const tasks = Array.isArray(block?.tasks) ? block.tasks : [];
    tasks.forEach((t, i) => {
      const texto = stripInterna(t);
      out.push({ id: idDeTarea(clave, block, i), item: clave, texto, norm: normalizarTextoPunto(texto) });
    });
  }
  return out;
}

//   revisiones = servicios.revisiones ({ grupo: [puntos] })
//   items      = mant_items cargado ({ clave: { tasks, claves } })
//   ocultos    = servicios.puntos_ocultos (misma forma que revisiones) o null
// → { asignados: [{ id, grupo, punto }], anteriores: [{ grupo, punto }] }
//   `id` = el de la tarea de hoy; `punto` = el guardado, sin tocar. Lo que vino
//   de puntos_ocultos lleva además `deOcultos: true`.
export function emparejarPuntos(revisiones, items, { ocultos = null } = {}) {
  const tareas = indiceDeTareas(items);
  const porId = new Map(tareas.map(t => [t.id, t]));
  const usadas = new Set();
  const entradas = [
    ...puntosDeRevisiones(revisiones).map(e => ({ ...e, id: null })),
    ...puntosDeRevisiones(ocultos).map(e => ({ ...e, id: null, deOcultos: true })),
  ];

  const tomar = (e, t) => { e.id = t.id; usadas.add(t.id); };
  const buscar = (pred) => tareas.find(t => !usadas.has(t.id) && pred(t));

  // 1. Clave estable.
  for (const e of entradas) {
    const id = e.punto.id;
    if (!esClaveEstable(id)) continue;
    const t = porId.get(id);
    if (t && !usadas.has(t.id)) tomar(e, t);
  }
  // 2. Id viejo: por texto, dentro de su ítem. 3. Sin id: por texto, en todos.
  const viejo = (e) => !e.id && e.punto.id != null && e.punto.id !== "" && !esClaveEstable(e.punto.id);
  const sinId = (e) => !e.id && (e.punto.id == null || e.punto.id === "");
  const texto = (e) => stripInterna(e.punto.text);
  for (const modo of ["exacto", "normalizado"]) {
    for (const e of entradas) {
      if (!viejo(e)) continue;
      const item = itemDeIdPunto(e.punto.id);
      if (!item) continue;
      const tx = texto(e), nx = normalizarTextoPunto(tx);
      const t = buscar(t => t.item === item && (modo === "exacto" ? t.texto === tx : (nx !== "" && t.norm === nx)));
      if (t) tomar(e, t);
    }
  }
  for (const modo of ["exacto", "normalizado"]) {
    for (const e of entradas) {
      if (!sinId(e)) continue;
      const tx = texto(e), nx = normalizarTextoPunto(tx);
      const t = buscar(t => modo === "exacto" ? t.texto === tx : (nx !== "" && t.norm === nx));
      if (t) tomar(e, t);
    }
  }

  const asignados = [], anteriores = [];
  for (const e of entradas) {
    const marca = e.deOcultos ? { deOcultos: true } : {};
    if (e.id) asignados.push({ id: e.id, grupo: e.grupo, punto: e.punto, ...marca });
    else anteriores.push({ grupo: e.grupo, punto: e.punto, ...marca });
  }
  return { asignados, anteriores };
}

// El estado del checklist (por id de la tarea de hoy) a partir de lo emparejado.
//   colFotos = columna `fotos` de la fila ({ [id guardado]: [urls] }) o null.
export function estadoDesdeAsignados(asignados, colFotos) {
  const status = {}, issue = {}, checked = {}, fotos = {};
  const base = colFotos && typeof colFotos === "object" && !Array.isArray(colFotos) ? colFotos : null;
  for (const { id, punto } of asignados) {
    const deColumna = base && punto.id != null ? base[punto.id] : null;
    if (Array.isArray(deColumna) && deColumna.length) fotos[id] = deColumna;
    if (punto.status && punto.status !== "pending") {
      status[id] = punto.status;
      checked[id] = true;
      if (punto.detail) issue[id] = punto.detail;
      if (Array.isArray(punto.fotos) && punto.fotos.length) fotos[id] = punto.fotos;
    }
  }
  return { status, issue, checked, fotos };
}

// Firma y autor por id, para que abrir un servicio viejo no vuelva a sellar a
// nadie: lo emparejado conserva la firma con que se guardó, bajo el id de hoy.
export function instantaneaEmparejada(asignados, anteriores) {
  const snap = {}, stamps = {};
  const poner = (id, p) => {
    if (id == null) return;
    snap[id] = firmaItem(p);
    if (p.marcado_por || p.marcado_at) stamps[id] = { por: p.marcado_por || null, at: p.marcado_at || null };
  };
  for (const { id, punto } of asignados) poner(id, punto);
  for (const { punto } of anteriores) poner(punto.id, punto);
  return { snap, stamps };
}

// Un punto de la versión anterior, como se guarda: tal cual, con la marca.
export const puntoDeVersionAnterior = (punto) => ({ ...punto, version_anterior: true });

const comoSet = (ids) => ids instanceof Set ? ids : new Set(ids || []);

// Los ítems que esconde un adicional apagado ({ glow, diferenciales }).
export function itemsOcultosPorAdicionales(adicionales) {
  const out = new Set();
  for (const [k, items] of Object.entries(ADICIONALES)) if (!adicionales?.[k]) items.forEach(i => out.add(i));
  return out;
}

// Un punto emparejado que el checklist no muestra: ¿lo esconde un adicional
// apagado (o ya venía de puntos_ocultos)? Entonces no es de la versión anterior.
const esOculto = (a, apagados) => a.deOcultos === true || apagados.has(itemDeIdPunto(a.id));

// Lo que va a "Puntos de la versión anterior": lo que no calzó, más lo que
// calzó con una tarea que el checklist de hoy no muestra (un ítem que la receta
// ya no tiene para este código). Esos se conservan con su id guardado.
// Lo de un adicional desmarcado NO: queda oculto (ocultosParaGuardar).
//   adicionales = los elegidos en el paso 2 ({ glow, diferenciales }).
export function anterioresVisibles({ asignados, anteriores }, idsTareas, adicionales = null) {
  const enPantalla = comoSet(idsTareas);
  const apagados = itemsOcultosPorAdicionales(adicionales);
  return [
    ...anteriores.filter(a => !a.deOcultos).map(a => ({ grupo: a.grupo, punto: a.punto })),
    ...asignados.filter(a => !enPantalla.has(a.id) && !esOculto(a, apagados)).map(a => ({ grupo: a.grupo, punto: a.punto })),
  ];
}

// Las tareas que esconde un adicional apagado y tienen algo marcado (estado,
// detalle o fotos): se arman como las del checklist (armarCrudo) y se guardan
// en puntos_ocultos. Mismo { id, grp, icon, text } que buildTasks.
export function tareasOcultas({ items, adicionales, idsTareas, taskStatus = {}, taskIssue = {}, taskPhotos = {}, checked = {} }) {
  const enPantalla = comoSet(idsTareas);
  const out = [];
  for (const item of itemsOcultosPorAdicionales(adicionales)) {
    const block = items?.[item];
    const tasks = Array.isArray(block?.tasks) ? block.tasks : [];
    tasks.forEach((t, i) => {
      const id = idDeTarea(item, block, i);
      if (enPantalla.has(id)) return;
      const st = taskStatus?.[id];
      const fotos = taskPhotos?.[id];
      const marcado = (st && st !== "pending") || !!checked?.[id] || !!taskIssue?.[id] || (Array.isArray(fotos) && fotos.length > 0);
      if (marcado) out.push({ id, grp: block.label, icon: block.icon, text: stripInterna(t) });
    });
  }
  return out;
}

// servicios.puntos_ocultos para guardar ({ grupo: [puntos] } o null):
//   · las tareas ocultas marcadas, armadas y selladas por el caller (crudoOcultos);
//   · lo que vino de puntos_ocultos y hoy no tiene una tarea donde caer (o cae en
//     una que el checklist no muestra por otra razón), tal cual.
export function ocultosParaGuardar({ crudoOcultos, emparejado, idsTareas, adicionales }) {
  const enPantalla = comoSet(idsTareas);
  const apagados = itemsOcultosPorAdicionales(adicionales);
  const out = {};
  for (const [g, lista] of Object.entries(crudoOcultos || {})) if (Array.isArray(lista) && lista.length) out[g] = [...lista];
  const fijos = [
    ...(emparejado?.anteriores || []).filter(a => a.deOcultos),
    ...(emparejado?.asignados || []).filter(a => a.deOcultos && !enPantalla.has(a.id) && !apagados.has(itemDeIdPunto(a.id))),
  ];
  for (const { grupo, punto } of fijos) (out[grupo] ||= []).push(punto);
  return Object.keys(out).length ? out : null;
}

// Los adicionales al abrir un servicio guardado. Manda la columna
// servicios.adicionales; sin columna (guardado antes del 26/10) se deducen como
// lo hacía main: de las tareas que tiene, sin la versión anterior ni lo oculto.
export function adicionalesAlAbrir({ columna, emparejado }) {
  if (columna && typeof columna === "object" && !Array.isArray(columna)) {
    return { glow: !!columna.glow, diferenciales: !!columna.diferenciales, legado: true };
  }
  const ids = (emparejado?.asignados || []).filter(a => !a.deOcultos && !esVersionAnterior(a.punto)).map(a => a.id);
  return adicionalesDeTareas(ids);
}

// La columna servicios.adicionales como se guarda.
export const adicionalesParaGuardar = (a) => ({ glow: !!a?.glow, diferenciales: !!a?.diferenciales });

// Los puntos con hallazgo de lo que se guarda (revisiones, con la versión
// anterior): el cliente los ve como antes. Las filas informativas (⚠) no cuentan.
const tieneTexto = (d) => d != null && String(d).trim() !== "";
const conHallazgo = (revisiones) => puntosDeRevisiones(revisiones).map(e => e.punto)
  .filter(p => !esFilaInformativa(p) && (p.status === "issue" || tieneTexto(p.detail)));

// servicios.pendientes: el detalle de cada hallazgo, como lo armaba main.
export const pendientesDeRevisiones = (revisiones) => conHallazgo(revisiones)
  .map(p => p.detail).filter(tieneTexto);

// Los hallazgos para el informe de la orden: { text, detail } por punto.
export const detallesDeRevisiones = (revisiones) => conHallazgo(revisiones)
  .map(p => ({ text: stripInterna(p.text), detail: tieneTexto(p.detail) ? p.detail : null }));

// Revisiones para guardar: lo armado desde el checklist de hoy + los puntos de
// la versión anterior, cada uno en su grupo, sin cambiarles nada.
export function conAnteriores(crudo, anteriores) {
  const out = {};
  for (const [g, lista] of Object.entries(crudo || {})) out[g] = [...lista];
  for (const { grupo, punto } of anteriores || []) {
    (out[grupo] ||= []).push(puntoDeVersionAnterior(punto));
  }
  return out;
}

// La columna `fotos` para guardar ({ [id]: [urls] }):
//   · lo que la fila cargada tenía bajo un id que NO pasó a una tarea de hoy
//     (los puntos de la versión anterior y cualquier otra clave) queda como estaba;
//   · las fotos del checklist de hoy salen del estado (borrar una foto la saca);
//   · lo emparejado con una tarea que no se muestra conserva su id guardado.
//   · lo oculto por un adicional apagado no va a la columna: sus fotos viajan
//     dentro del punto, en puntos_ocultos.
//   idsTareas = ids del checklist que se muestra; asignados = los emparejados.
export function fotosParaGuardar({ taskPhotos, idsTareas, asignados = [], colFotosCargada = null, adicionales = null }) {
  const enPantalla = comoSet(idsTareas);
  const apagados = itemsOcultosPorAdicionales(adicionales);
  const conId = (id) => id != null && id !== "";
  const movidos = new Set(asignados.filter(a => enPantalla.has(a.id)).map(a => a.punto?.id).filter(conId));
  const ocultos = new Set(asignados.filter(a => !enPantalla.has(a.id) && esOculto(a, apagados)).map(a => a.punto?.id).filter(conId));
  const out = {};
  const base = colFotosCargada && typeof colFotosCargada === "object" && !Array.isArray(colFotosCargada) ? colFotosCargada : {};
  for (const [k, v] of Object.entries(base)) {
    if (movidos.has(k) || enPantalla.has(k) || ocultos.has(k) || apagados.has(itemDeIdPunto(k))) continue;
    if (Array.isArray(v) && v.length) out[k] = v;
  }
  // Las del checklist de hoy salen del estado. Las de una tarea que no se
  // muestra no: quedan con su id guardado (versión anterior) o en su punto (oculto).
  for (const [k, v] of Object.entries(taskPhotos || {})) {
    if (!enPantalla.has(k)) continue;
    if (Array.isArray(v) && v.length) out[k] = v;
  }
  return out;
}
