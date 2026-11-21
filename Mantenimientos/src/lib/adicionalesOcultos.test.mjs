// npm test  (= node --test; sin dependencias)
// fix/revisiones-fase1, decisiones de Tavo del 26/10/2026 (bugs 1 y 2 del paso D):
//   · los puntos de un adicional DESMARCADO no van a "Puntos de la versión anterior":
//     quedan ocultos (servicios.puntos_ocultos) y, al reabrir, el adicional sigue
//     desmarcado (servicios.adicionales). El estado del adicional no se deduce de
//     la presencia de puntos;
//   · lo que ve el cliente: los puntos de la versión anterior salen y cuentan como
//     antes (pendientes e informe los incluyen); los ocultos nunca se ven.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emparejarPuntos, estadoDesdeAsignados, anterioresVisibles, conAnteriores, fotosParaGuardar,
  itemsOcultosPorAdicionales, tareasOcultas, ocultosParaGuardar, adicionalesAlAbrir,
  adicionalesParaGuardar, pendientesDeRevisiones, detallesDeRevisiones,
} from "./emparejarPuntos.js";
import { buildTasks } from "./checklistReceta.js";

// Una receta A de diésel con el adicional de bujías de precalentamiento (GLOW).
const ITEMS = {
  "3": { label: "Aceite", icon: "·", tasks: ["Cambio de aceite", "Cambio de filtro"], claves: ["3:1", "3:2"] },
  "11": { label: "Combustible", icon: "·", tasks: ["Filtro de combustible"], claves: ["11:1"] },
  GLOW_TEST: { label: "Prueba de bujías", icon: "·", tasks: ["Prueba con XENTRY"], claves: ["GLOW_TEST:1"] },
  GLOW: { label: "Bujías de precalentamiento", icon: "·", tasks: ["Extraer bujías", "Instalar bujías nuevas"], claves: ["GLOW:1", "GLOW:2"] },
  "19": { label: "Filtro de partículas", icon: "·", tasks: ["Inspección DPF"], claves: ["19:1"] },
};
const CODES = { A: { items: ["3", "FUEL"], serie: "A" } };
const conGlow = { glow: true, diferenciales: false, legado: false };
const sinGlow = { glow: false, diferenciales: false, legado: false };
const ids = (tasks) => new Set(tasks.map(t => t.id));
// Lo que arma el checklist de hoy desde el estado (el armarCrudo de App.jsx).
const crudoDe = (tasks, st) => {
  const out = {};
  for (const t of tasks) (out[t.grp] ||= []).push({ id: t.id, text: t.text, status: st.issue?.[t.id] ? "issue" : (st.status?.[t.id] || "pending"), detail: st.issue?.[t.id] || null, fotos: st.fotos?.[t.id] || null });
  return out;
};
const FOTO = ["https://ejemplo.supabase.co/storage/v1/object/public/fotos-servicios/glow.jpg"];

test("bug 1: un adicional desmarcado NO manda sus puntos a la versión anterior", () => {
  const rev = { "Bujías de precalentamiento": [{ id: "GLOW:1", text: "Extraer bujías", status: "ok" }] };
  const emp = emparejarPuntos(rev, ITEMS);
  const tasks = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: sinGlow });
  assert.deepEqual(anterioresVisibles(emp, ids(tasks), sinGlow), [], "quedan ocultos, no en la versión anterior");
  // El ítem que la receta de hoy no tiene (no es un adicional) sigue yendo a la versión anterior.
  const rev19 = { "Filtro de partículas": [{ id: "19:1", text: "Inspección DPF", status: "ok" }] };
  const emp19 = emparejarPuntos(rev19, ITEMS);
  assert.deepEqual(anterioresVisibles(emp19, ids(tasks), sinGlow), [{ grupo: "Filtro de partículas", punto: rev19["Filtro de partículas"][0] }]);
});

test("bug 1: los puntos ocultos se guardan aparte con su estado, detalle y fotos", () => {
  const tasks = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: sinGlow });
  const st = { status: { "3:1": "ok", "GLOW:1": "ok", "GLOW:2": "issue" }, issue: { "GLOW:2": "rosca dañada" }, fotos: { "GLOW:2": FOTO } };
  const ocultas = tareasOcultas({ items: ITEMS, adicionales: sinGlow, idsTareas: ids(tasks), taskStatus: st.status, taskIssue: st.issue, taskPhotos: st.fotos });
  assert.deepEqual(ocultas.map(t => t.id), ["GLOW:1", "GLOW:2"]);
  const crudoOcultos = crudoDe(ocultas, st);
  const guardar = ocultosParaGuardar({ crudoOcultos, emparejado: { asignados: [], anteriores: [] }, idsTareas: ids(tasks), adicionales: sinGlow });
  assert.deepEqual(guardar, { "Bujías de precalentamiento": [
    { id: "GLOW:1", text: "Extraer bujías", status: "ok", detail: null, fotos: null },
    { id: "GLOW:2", text: "Instalar bujías nuevas", status: "issue", detail: "rosca dañada", fotos: FOTO },
  ] });
  // Nada marcado en el adicional apagado: no hay nada oculto que guardar.
  assert.equal(ocultosParaGuardar({ crudoOcultos: {}, emparejado: { asignados: [], anteriores: [] }, idsTareas: ids(tasks), adicionales: sinGlow }), null);
  // Las revisiones que se guardan no los traen.
  const revisiones = conAnteriores(crudoDe(tasks, st), []);
  assert.equal(Object.values(revisiones).flat().some(p => String(p.id).startsWith("GLOW:")), false);
});

test("bug 1: al reabrir, el adicional sigue desmarcado aunque haya puntos de ese adicional", () => {
  const rev = { "Bujías de precalentamiento": [{ id: "GLOW:1", text: "Extraer bujías", status: "ok", version_anterior: true }] };
  const emp = emparejarPuntos(rev, ITEMS);
  assert.deepEqual(adicionalesAlAbrir({ columna: { glow: false, diferenciales: false }, emparejado: emp }), { glow: false, diferenciales: false, legado: true });
  assert.deepEqual(adicionalesAlAbrir({ columna: { glow: true, diferenciales: false }, emparejado: { asignados: [], anteriores: [] } }), { glow: true, diferenciales: false, legado: true });
  // Un servicio guardado antes de la columna (null): manda lo que se veía en main
  // (los adicionales que tenía marcados), sin contar los puntos de la versión anterior.
  const viejo = emparejarPuntos({ "Bujías de precalentamiento": [{ id: "GLOW_0", text: "Extraer bujías", status: "ok" }] }, ITEMS);
  assert.equal(adicionalesAlAbrir({ columna: null, emparejado: viejo }).glow, true);
  assert.equal(adicionalesAlAbrir({ columna: null, emparejado: emp }).glow, false, "un punto marcado de versión anterior no prende el adicional");
  assert.deepEqual(adicionalesParaGuardar({ glow: 1, diferenciales: 0, legado: true }), { glow: true, diferenciales: false });
});

test("bug 1: puntos_ocultos se emparejan al reabrir y vuelven al checklist al marcar el adicional", () => {
  const ocultos = { "Bujías de precalentamiento": [{ id: "GLOW:2", text: "Instalar bujías nuevas", status: "issue", detail: "rosca dañada", fotos: FOTO, marcado_por: "Fabián" }] };
  const rev = { Aceite: [{ id: "3:1", text: "Cambio de aceite", status: "ok" }] };
  const emp = emparejarPuntos(rev, ITEMS, { ocultos });
  const oculto = emp.asignados.find(a => a.id === "GLOW:2");
  assert.ok(oculto && oculto.deOcultos === true, "el punto oculto se empareja y queda marcado como oculto");
  assert.equal(emp.asignados.find(a => a.id === "3:1").deOcultos, undefined);
  // Desmarcado: ni en el checklist ni en la versión anterior.
  const sin = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: sinGlow });
  assert.deepEqual(anterioresVisibles(emp, ids(sin), sinGlow), []);
  // El estado lo trae: al volver a marcar el adicional reaparece con su detalle y su foto.
  const est = estadoDesdeAsignados(emp.asignados, null);
  assert.equal(est.status["GLOW:2"], "issue");
  assert.equal(est.issue["GLOW:2"], "rosca dañada");
  const con = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: conGlow });
  assert.ok(ids(con).has("GLOW:2"));
  const revisiones = conAnteriores(crudoDe(con, est), anterioresVisibles(emp, ids(con), conGlow));
  assert.deepEqual(revisiones["Bujías de precalentamiento"][1], { id: "GLOW:2", text: "Instalar bujías nuevas", status: "issue", detail: "rosca dañada", fotos: FOTO });
  // Marcado otra vez el adicional, ya no queda nada oculto.
  assert.equal(ocultosParaGuardar({ crudoOcultos: {}, emparejado: emp, idsTareas: ids(con), adicionales: conGlow }), null);
});

test("bug 1: un punto oculto que hoy no tiene tarea se conserva tal cual en puntos_ocultos", () => {
  const ocultos = { "Bujías": [{ id: "GLOW:9", text: "Tarea que ya no existe", status: "ok" }] };
  const emp = emparejarPuntos({}, ITEMS, { ocultos });
  assert.deepEqual(emp.anteriores, [{ grupo: "Bujías", punto: ocultos["Bujías"][0], deOcultos: true }]);
  const sin = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: sinGlow });
  assert.deepEqual(anterioresVisibles(emp, ids(sin), sinGlow), [], "tampoco va a la versión anterior");
  assert.deepEqual(ocultosParaGuardar({ crudoOcultos: {}, emparejado: emp, idsTareas: ids(sin), adicionales: sinGlow }), ocultos);
});

test("bug 1: la columna fotos no guarda las fotos de un punto oculto (viajan dentro del punto)", () => {
  const sin = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: sinGlow });
  const asignados = [{ id: "GLOW:1", grupo: "Bujías de precalentamiento", punto: { id: "GLOW_0" } }];
  const out = fotosParaGuardar({ taskPhotos: { "GLOW:1": FOTO, "GLOW:2": FOTO, "3:1": FOTO }, idsTareas: ids(sin), asignados, colFotosCargada: { GLOW_0: FOTO }, adicionales: sinGlow });
  assert.deepEqual(out, { "3:1": FOTO });
  // El adicional marcado: las fotos vuelven a la columna bajo el id de hoy.
  const con = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: conGlow });
  assert.deepEqual(fotosParaGuardar({ taskPhotos: { "GLOW:1": FOTO }, idsTareas: ids(con), asignados, colFotosCargada: { GLOW_0: FOTO }, adicionales: conGlow }), { "GLOW:1": FOTO });
});

test("itemsOcultosPorAdicionales: los ítems que esconde cada adicional apagado", () => {
  assert.deepEqual([...itemsOcultosPorAdicionales(sinGlow)].sort(), ["4M_DIFF", "4M_FDIFF", "GLOW"]);
  assert.deepEqual([...itemsOcultosPorAdicionales({ glow: true, diferenciales: true })], []);
});

test("bug 2: pendientes de lo que se guarda — la versión anterior cuenta, lo oculto nunca", () => {
  const revisiones = {
    "Revisión de compra": [
      { id: "RC:1", text: "Carrocería", status: "issue", detail: "golpe en la puerta" },
      { id: "RC:2", text: "Chasis", status: "ok", detail: null },
      { id: "RC_20", text: "Prueba en carretera", status: "issue", detail: "vibra a 100 km/h", version_anterior: true },
      { id: "RC:3", text: "⚠ Fila informativa", status: "issue", detail: "no cuenta" },
      { id: "RC:4", text: "Sin detalle", status: "issue", detail: null },
    ],
  };
  assert.deepEqual(pendientesDeRevisiones(revisiones), ["golpe en la puerta", "vibra a 100 km/h"]);
  assert.deepEqual(detallesDeRevisiones(revisiones), [
    { text: "Carrocería", detail: "golpe en la puerta" },
    { text: "Prueba en carretera", detail: "vibra a 100 km/h" },
    { text: "Sin detalle", detail: null },
  ]);
  assert.deepEqual(pendientesDeRevisiones(null), []);
});
