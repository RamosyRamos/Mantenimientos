// npm test  (= node --test; sin dependencias)
// fix/revisiones-fase1 (25/10/2026): reabrir un checklist guardado empareja cada punto con su
// tarea por la clave estable o, en los servicios viejos, por el texto; nunca por la posición.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emparejarPuntos, indiceDeTareas, estadoDesdeAsignados, instantaneaEmparejada,
  anterioresVisibles, conAnteriores, fotosParaGuardar, puntoDeVersionAnterior,
} from "./emparejarPuntos.js";
import { buildTasks, idDeTarea, itemDeTareaId } from "./checklistReceta.js";
import { sellarRevisiones, huellaServicio } from "../servicioConcurrencia.js";

// ── Las tareas de RC y RG_PTS como están en la base el 25/10 (claves 1..N del relleno) ──
const RC_TASKS = [
  "Carrocería y pintura: indicios de choques, repintado o masilla",
  "Chasis y puntos de fijación: deformaciones o soldaduras",
  "Interior y tapicería: desgaste coherente con el kilometraje",
  "Kilometraje: coherencia entre odómetro, desgaste y registros",
  "Inspección visual del motor — fugas, correas, mangueras",
  "Verificación de todos los niveles de fluidos",
  "Inspección de pastillas y discos de freno (todos los ejes)",
  "Revisión del freno de estacionamiento",
  "Inspección de suspensión y dirección",
  "Revisión de soportes de motor y transmisión",
  "Inspección de sistema de escape",
  "Inspección de faja de accesorios",
  "Inspección de presión de llantas (incluida llanta de repuesto)",
  "Inspección visual de llantas — desgaste y daños",
  "Llantas: fecha de fabricación (DOT) y antigüedad",
  "Estado del filtro de habitáculo / carbón activo",
  "Revisión de luces, alertas y sensores",
  "Revisión de escobillas limpiaparabrisas y lavadores",
  "Prueba de batería con analizador (estado de salud y carga)",
  "Escaneo completo de fallas (Star Diagnosis)",
  "Prueba de ruta: caja, dirección, frenado y ruidos",
];
const RG_TASKS = [
  "Carrocería y pintura: indicios de choques, repintado o masilla",
  "Chasis y puntos de fijación: deformaciones o soldaduras",
  "Interior y tapicería: estado general",
  "Inspección visual del motor — fugas, correas, mangueras",
  "Verificación de todos los niveles de fluidos",
  "Inspección de pastillas y discos de freno (todos los ejes)",
  "Revisión del freno de estacionamiento",
  "Inspección de suspensión y dirección",
  "Revisión de soportes de motor y transmisión",
  "Inspección de sistema de escape",
  "Inspección de faja de accesorios",
  "Inspección de presión de llantas (incluida llanta de repuesto)",
  "Inspección visual de llantas — desgaste y daños",
  "Estado del filtro de habitáculo / carbón activo",
  "Revisión de luces, alertas y sensores",
  "Revisión de escobillas limpiaparabrisas y lavadores",
  "Prueba de batería con analizador (estado de salud y carga)",
  "Escaneo completo de fallas (Star Diagnosis)",
  "Prueba de ruta: caja, dirección, frenado y ruidos",
];
const conClaves = (clave, label, tasks) => ({ label, icon: "·", tasks, claves: tasks.map((_, i) => `${clave}:${i + 1}`) });
const ITEMS = {
  RC: conClaves("RC", "Revisión de compra", RC_TASKS),
  RG_PTS: conClaves("RG_PTS", "Revisión general", RG_TASKS),
};
const CODES = { RC: { items: ["RC"], serie: "C" }, RG: { items: ["RG_PTS"], serie: "C" } };

// ── Los puntos de la RC de la #2905 y la RG de la #2834 como están guardados (ids por
// posición, de cuando la receta tenía "Prueba en carretera" y no tenía las escobillas).
// Texto y estado reales; el detalle y las fotos reemplazados (Mantenimientos es un repo público).
const DET = "detalle";
const FOTO = (n) => [`https://ejemplo.supabase.co/storage/v1/object/public/fotos-servicios/prueba-${n}.jpg`];
const pRC = [
  ["Carrocería y pintura: indicios de choques, repintado o masilla", "issue", DET, FOTO(0)],
  ["Chasis y puntos de fijación: deformaciones o soldaduras", "ok"],
  ["Interior y tapicería: desgaste coherente con el kilometraje", "issue", DET],
  ["Kilometraje: coherencia entre odómetro, desgaste y registros", "ok"],
  ["Inspección visual del motor — fugas, correas, mangueras", "issue", DET],
  ["Verificación de todos los niveles de fluidos", "ok"],
  ["Inspección de pastillas y discos de freno (todos los ejes)", "issue", DET],
  ["Revisión del freno de estacionamiento", "issue", DET, FOTO(7)],
  ["Inspección de suspensión y dirección", "issue", DET],
  ["Revisión de soportes de motor y transmisión", "issue", DET],
  ["Inspección de sistema de escape", "ok"],
  ["Inspección de faja de accesorios", "ok"],
  ["Inspección de presión de llantas (incluida llanta de repuesto)", "issue", DET],
  ["Inspección visual de llantas — desgaste y daños", "issue", DET],
  ["Llantas: fecha de fabricación (DOT) y antigüedad", "issue", DET],
  ["Estado del filtro de habitáculo / carbón activo", "na"],
  ["Revisión de luces, alertas y sensores", "issue", DET],
  ["Prueba de batería con analizador (estado de salud y carga)", "issue", DET, FOTO(17)],
  ["Escaneo completo de fallas (Star Diagnosis)", "issue"],
  ["Prueba de ruta: caja, dirección, frenado y ruidos", "pending"],
  ["Prueba en carretera", "pending"],
].map(([text, status, detail, fotos], i) => ({ id: `RC_${i}`, text, status, detail: detail || null, fotos: fotos || null }));
const REV_2905 = { "Revisión de compra": pRC };
const COL_2905 = { RC_0: FOTO(0), RC_7: FOTO(7), RC_17: FOTO(17) };

const pRG = [
  ["Carrocería y pintura: indicios de choques, repintado o masilla", "ok"],
  ["Chasis y puntos de fijación: deformaciones o soldaduras", "ok"],
  ["Interior y tapicería: estado general", "ok"],
  ["Inspección visual del motor — fugas, correas, mangueras", "issue", DET],
  ["Verificación de todos los niveles de fluidos", "ok"],
  ["Inspección de pastillas y discos de freno (todos los ejes)", "ok"],
  ["Revisión del freno de estacionamiento", "ok"],
  ["Inspección de suspensión y dirección", "ok"],
  ["Revisión de soportes de motor y transmisión", "ok"],
  ["Inspección de sistema de escape", "ok"],
  ["Inspección de faja de accesorios", "ok"],
  ["Inspección de presión de llantas (incluida llanta de repuesto)", "ok"],
  ["Inspección visual de llantas — desgaste y daños", "ok"],
  ["Estado del filtro de habitáculo / carbón activo", "ok"],
  ["Revisión de luces, alertas y sensores", "issue", DET],
  ["Prueba de batería con analizador (estado de salud y carga)", "ok"],
  ["Escaneo completo de fallas (Star Diagnosis)", "issue", DET],
  ["Prueba de ruta: caja, dirección, frenado y ruidos", "ok"],
  ["Prueba en carretera", "ok"],
].map(([text, status, detail], i) => ({ id: `RG_PTS_${i}`, text, status, detail: detail || null, fotos: null }));
const REV_2834 = { "Revisión general": pRG };

const porTexto = (tasks) => Object.fromEntries(tasks.map(t => [t.text, t.id]));

test("caso obligatorio #2905 (RC): batería en batería, escaneo en escaneo, prueba de ruta con su estado real", () => {
  const tasks = buildTasks("RC", "gasolina", false, CODES, ITEMS);
  const id = porTexto(tasks);
  const emp = emparejarPuntos(REV_2905, ITEMS);
  const est = estadoDesdeAsignados(emp.asignados, COL_2905);
  // Por posición, RC_17 (la batería) caería sobre "Revisión de escobillas" y RC_18 (el escaneo) sobre la batería.
  assert.equal(est.status[id["Prueba de batería con analizador (estado de salud y carga)"]], "issue");
  assert.deepEqual(est.fotos[id["Prueba de batería con analizador (estado de salud y carga)"]], FOTO(17));
  assert.equal(est.status[id["Escaneo completo de fallas (Star Diagnosis)"]], "issue");
  assert.equal(est.issue[id["Escaneo completo de fallas (Star Diagnosis)"]], undefined, "el escaneo no tenía detalle");
  assert.equal(est.status[id["Prueba de ruta: caja, dirección, frenado y ruidos"]], undefined, "la prueba de ruta seguía pendiente");
  assert.equal(est.status[id["Revisión de escobillas limpiaparabrisas y lavadores"]], undefined, "la tarea nueva arranca sin marcar");
  assert.equal(est.status[id["Estado del filtro de habitáculo / carbón activo"]], "na");
  assert.deepEqual(est.fotos[id["Carrocería y pintura: indicios de choques, repintado o masilla"]], FOTO(0));
  assert.deepEqual(est.fotos[id["Revisión del freno de estacionamiento"]], FOTO(7));
  // Lo que ya no existe va a la versión anterior, con su estado.
  assert.deepEqual(emp.anteriores.map(a => [a.punto.text, a.punto.status, a.punto.id]), [["Prueba en carretera", "pending", "RC_20"]]);
  assert.equal(emp.asignados.length, 20);
  // Los ids de hoy son las claves estables.
  assert.equal(id["Prueba de batería con analizador (estado de salud y carga)"], "RC:19");
});

test("caso obligatorio #2834 (RG): batería, escaneo y prueba de ruta en su lugar", () => {
  const tasks = buildTasks("RG", "gasolina", false, CODES, ITEMS);
  const id = porTexto(tasks);
  const est = estadoDesdeAsignados(emparejarPuntos(REV_2834, ITEMS).asignados, {});
  assert.equal(est.status[id["Prueba de batería con analizador (estado de salud y carga)"]], "ok");
  assert.equal(est.status[id["Escaneo completo de fallas (Star Diagnosis)"]], "issue");
  assert.equal(est.issue[id["Escaneo completo de fallas (Star Diagnosis)"]], DET);
  assert.equal(est.status[id["Prueba de ruta: caja, dirección, frenado y ruidos"]], "ok");
  assert.equal(est.status[id["Revisión de escobillas limpiaparabrisas y lavadores"]], undefined);
  const emp = emparejarPuntos(REV_2834, ITEMS);
  assert.deepEqual(emp.anteriores.map(a => [a.punto.text, a.punto.status]), [["Prueba en carretera", "ok"]]);
});

test("clave estable: manda la clave aunque la tarea cambie de lugar o de texto", () => {
  const items = { RC: { label: "RC", tasks: ["Escaneo", "Batería corregida"], claves: ["RC:20", "RC:19"] } };
  const rev = { RC: [{ id: "RC:19", text: "Batería", status: "ok" }, { id: "RC:20", text: "Escaneo", status: "issue", detail: "x" }] };
  const emp = emparejarPuntos(rev, items);
  assert.deepEqual(emp.asignados.map(a => [a.id, a.punto.status]), [["RC:19", "ok"], ["RC:20", "issue"]]);
  assert.equal(emp.anteriores.length, 0);
});

test("una clave que ya no existe NO se busca por texto: va a la versión anterior", () => {
  const items = { RC: { label: "RC", tasks: ["Batería"], claves: ["RC:22"] } };
  const emp = emparejarPuntos({ RC: [{ id: "RC:19", text: "Batería", status: "ok" }] }, items);
  assert.equal(emp.asignados.length, 0);
  assert.equal(emp.anteriores[0].punto.id, "RC:19");
});

test("id viejo: el número del id nunca empareja; el texto sí, solo dentro de su ítem", () => {
  const items = {
    A: { label: "A", tasks: ["Uno", "Dos"], claves: ["A:1", "A:2"] },
    B: { label: "B", tasks: ["Dos"], claves: ["B:1"] },
  };
  // "Dos" del ítem B no puede ir al ítem A aunque el texto coincida, y A_0 no es "la primera de A".
  const emp = emparejarPuntos({ B: [{ id: "B_0", text: "Dos", status: "ok" }], A: [{ id: "A_0", text: "Dos", status: "na" }] }, items);
  assert.deepEqual(emp.asignados.map(a => [a.punto.id, a.id]).sort(), [["A_0", "A:2"], ["B_0", "B:1"]]);
});

test("texto normalizado (tildes, mayúsculas, signos) dentro del ítem, después del exacto", () => {
  const items = { X: { label: "X", tasks: ["Inspección de luces", "Revisión del freno"], claves: ["X:1", "X:2"] } };
  const emp = emparejarPuntos({ X: [{ id: "X_5", text: "INSPECCION DE LUCES.", status: "ok" }, { id: "X_0", text: "Revisión del freno", status: "issue" }] }, items);
  assert.deepEqual(emp.asignados.map(a => [a.punto.id, a.id]), [["X_5", "X:1"], ["X_0", "X:2"]]);
});

test("puntos sin id: por texto entre todas las tareas", () => {
  const items = { A: { label: "A", tasks: ["Uno"], claves: ["A:1"] }, B: { label: "B", tasks: ["Dos"], claves: ["B:1"] } };
  const emp = emparejarPuntos({ Viejo: [{ text: "Dos", status: "ok" }, { text: "Tres", status: "ok" }] }, items);
  assert.deepEqual(emp.asignados.map(a => a.id), ["B:1"]);
  assert.deepEqual(emp.anteriores.map(a => a.punto.text), ["Tres"]);
});

test("texto idéntico repetido: uno a uno y en orden, nunca dos puntos a la misma tarea", () => {
  const items = { D: { label: "D", tasks: ["Revisar", "Revisar", "Fin"], claves: ["D:2", "D:3", "D:4"] } };
  const rev = { D: [
    { id: "D_1", text: "Revisar", status: "ok" },
    { id: "D_2", text: "Revisar", status: "issue", detail: "segunda" },
    { id: "D_0", text: "Fin", status: "na" },
  ] };
  const emp = emparejarPuntos(rev, items);
  assert.deepEqual(emp.asignados.map(a => [a.punto.status, a.id]), [["ok", "D:2"], ["issue", "D:3"], ["na", "D:4"]]);
  assert.equal(new Set(emp.asignados.map(a => a.id)).size, emp.asignados.length);
});

test("texto idéntico repetido con UNA sola tarea: la primera calza, la segunda va a la versión anterior", () => {
  const items = { D: { label: "D", tasks: ["Revisar"], claves: ["D:2"] } };
  const emp = emparejarPuntos({ D: [{ id: "D_0", text: "Revisar", status: "ok" }, { id: "D_1", text: "Revisar", status: "issue" }] }, items);
  assert.deepEqual(emp.asignados.map(a => [a.id, a.punto.status]), [["D:2", "ok"]]);
  assert.deepEqual(emp.anteriores.map(a => a.punto.status), ["issue"]);
});

test("una clave estable y un id viejo con el mismo texto no comparten tarea", () => {
  const items = { D: { label: "D", tasks: ["Revisar", "Revisar"], claves: ["D:1", "D:2"] } };
  const emp = emparejarPuntos({ D: [{ id: "D_0", text: "Revisar", status: "ok" }, { id: "D:1", text: "Revisar", status: "issue" }] }, items);
  assert.deepEqual(emp.asignados.map(a => [a.punto.id, a.id]).sort(), [["D:1", "D:1"], ["D_0", "D:2"]]);
});

test("sin claves en la base (migración sin aplicar): el id es el viejo y se empareja por texto igual", () => {
  const items = { RC: { label: "RC", tasks: ["Uno", "Dos"] } };
  assert.equal(idDeTarea("RC", items.RC, 1), "RC_1");
  const emp = emparejarPuntos({ RC: [{ id: "RC_0", text: "Dos", status: "ok" }] }, items);
  assert.deepEqual(emp.asignados.map(a => a.id), ["RC_1"]);
});

test("itemDeTareaId entiende la clave estable y el id viejo", () => {
  assert.equal(itemDeTareaId("RC:19"), "RC");
  assert.equal(itemDeTareaId("GLOW_TEST:1"), "GLOW_TEST");
  assert.equal(itemDeTareaId("GLOW_TEST_0"), "GLOW_TEST");
  assert.equal(itemDeTareaId("RC:0"), null);
});

test("indiceDeTareas saca el ~ del texto", () => {
  const ix = indiceDeTareas({ G: { tasks: ["~Interna", "Normal"], claves: ["G:1", "G:2"] } });
  assert.deepEqual(ix.map(t => [t.id, t.texto]), [["G:1", "Interna"], ["G:2", "Normal"]]);
});

test("conAnteriores: la versión anterior se guarda tal cual, con la marca, en su grupo", () => {
  const anterior = { grupo: "Revisión de compra", punto: { id: "RC_20", text: "Prueba en carretera", status: "ok", marcado_por: "Fabián" } };
  const out = conAnteriores({ "Revisión de compra": [{ id: "RC:21", status: "pending" }] }, [anterior]);
  assert.deepEqual(out["Revisión de compra"][1], { id: "RC_20", text: "Prueba en carretera", status: "ok", marcado_por: "Fabián", version_anterior: true });
  assert.equal(puntoDeVersionAnterior({ a: 1 }).version_anterior, true);
});

test("anterioresVisibles suma lo emparejado con una tarea que el checklist no muestra (salvo lo de un adicional apagado)", () => {
  const emp = { asignados: [{ id: "19:1", grupo: "DPF", punto: { id: "19_0", status: "ok" } }, { id: "GLOW:1", grupo: "Glow", punto: { id: "GLOW_0", status: "ok" } }, { id: "RC:1", grupo: "RC", punto: { id: "RC_0" } }], anteriores: [] };
  // El ítem 19 no es un adicional: va a la versión anterior. GLOW con el adicional apagado queda oculto.
  assert.deepEqual(anterioresVisibles(emp, new Set(["RC:1"]), { glow: false, diferenciales: false }), [{ grupo: "DPF", punto: { id: "19_0", status: "ok" } }]);
  // Con el adicional marcado pero sin mostrarse (un servicio enviado que muestra solo lo guardado): versión anterior.
  assert.deepEqual(anterioresVisibles(emp, new Set(["RC:1"]), { glow: true, diferenciales: false }).map(a => a.grupo), ["DPF", "Glow"]);
});

test("fotosParaGuardar: las movidas cambian de id, las de la versión anterior quedan, borrar una foto la saca", () => {
  const asignados = [{ id: "RC:19", punto: { id: "RC_17" } }, { id: "RC:1", punto: { id: "RC_0" } }];
  const col = { RC_17: FOTO(17), RC_0: FOTO(0), RC_20: FOTO(20) };
  const out = fotosParaGuardar({ taskPhotos: { "RC:19": FOTO(17) }, idsTareas: new Set(["RC:19", "RC:1"]), asignados, colFotosCargada: col });
  assert.deepEqual(out, { RC_20: FOTO(20), "RC:19": FOTO(17) }, "RC:1 sin foto: se borró en pantalla");
});

test("abrir no vuelve a sellar: lo emparejado conserva su autor con el id de hoy", () => {
  const rev = { X: [{ id: "X_3", text: "Uno", status: "ok", marcado_por: "Fabián", marcado_at: "2026-10-01T10:00:00Z" }] };
  const items = { X: { label: "X", tasks: ["Uno"], claves: ["X:1"] } };
  const emp = emparejarPuntos(rev, items);
  const { snap, stamps } = instantaneaEmparejada(emp.asignados, emp.anteriores);
  const est = estadoDesdeAsignados(emp.asignados, null);
  const crudo = { X: [{ id: "X:1", text: "Uno", status: est.status["X:1"], detail: null, fotos: null }] };
  const sellado = sellarRevisiones(crudo, snap, stamps, "Otro", "2026-10-25T00:00:00Z");
  assert.equal(sellado.X[0].marcado_por, "Fabián");
  assert.equal(sellado.X[0].marcado_at, "2026-10-01T10:00:00Z");
});

test("la huella de lo guardado con la versión anterior es estable entre dos guardados", () => {
  const anterior = [{ grupo: "RC", punto: { id: "RC_20", text: "Prueba en carretera", status: "ok" } }];
  const a = conAnteriores({ RC: [{ id: "RC:1", text: "Uno", status: "ok", detail: null, fotos: null }] }, anterior);
  const b = conAnteriores({ RC: [{ id: "RC:1", text: "Uno", status: "ok", detail: null, fotos: null }] }, anterior);
  assert.equal(huellaServicio({ revisiones: a }), huellaServicio({ revisiones: b }));
});
