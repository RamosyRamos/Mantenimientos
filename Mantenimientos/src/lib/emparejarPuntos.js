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

import { esClaveEstable, itemDeIdPunto, normalizarTextoPunto, puntosDeRevisiones } from "./revisionPuntos.js";
import { stripInterna, idDeTarea } from "./checklistReceta.js";
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
// → { asignados: [{ id, grupo, punto }], anteriores: [{ grupo, punto }] }
//   `id` = el de la tarea de hoy; `punto` = el guardado, sin tocar.
export function emparejarPuntos(revisiones, items) {
  const tareas = indiceDeTareas(items);
  const porId = new Map(tareas.map(t => [t.id, t]));
  const usadas = new Set();
  const entradas = puntosDeRevisiones(revisiones).map(e => ({ ...e, id: null }));

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
    if (e.id) asignados.push({ id: e.id, grupo: e.grupo, punto: e.punto });
    else anteriores.push({ grupo: e.grupo, punto: e.punto });
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

// Lo que va a "Puntos de la versión anterior": lo que no calzó, más lo que
// calzó con una tarea que el checklist de hoy no muestra (un ítem que la receta
// ya no tiene para este código). Esos se conservan con su id guardado.
export function anterioresVisibles({ asignados, anteriores }, idsTareas) {
  const enPantalla = idsTareas instanceof Set ? idsTareas : new Set(idsTareas || []);
  return [
    ...anteriores,
    ...asignados.filter(a => !enPantalla.has(a.id)).map(a => ({ grupo: a.grupo, punto: a.punto })),
  ];
}

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
//   idsTareas = ids del checklist que se muestra; asignados = los emparejados.
export function fotosParaGuardar({ taskPhotos, idsTareas, asignados = [], colFotosCargada = null }) {
  const enPantalla = idsTareas instanceof Set ? idsTareas : new Set(idsTareas || []);
  const movidos = new Set(asignados.filter(a => enPantalla.has(a.id)).map(a => a.punto?.id).filter(id => id != null && id !== ""));
  const out = {};
  const base = colFotosCargada && typeof colFotosCargada === "object" && !Array.isArray(colFotosCargada) ? colFotosCargada : {};
  for (const [k, v] of Object.entries(base)) {
    if (movidos.has(k) || enPantalla.has(k)) continue;
    if (Array.isArray(v) && v.length) out[k] = v;
  }
  const fueraDePantalla = new Set(asignados.filter(a => !enPantalla.has(a.id)).map(a => a.id));
  for (const [k, v] of Object.entries(taskPhotos || {})) {
    if (fueraDePantalla.has(k) && !enPantalla.has(k)) continue;
    if (Array.isArray(v) && v.length) out[k] = v;
  }
  return out;
}
