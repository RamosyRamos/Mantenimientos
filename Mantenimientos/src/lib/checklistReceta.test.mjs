// npm test  (= node --test; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTasks, itemsDelServicio, itemDeTareaId, adicionalesDeTareas, idsDeRevisiones,
  estadoCandado, adicionalesOfrecidos, stripInterna, SIN_ADICIONALES,
} from "./checklistReceta.js";

// Recetas e ítems como en la base (14/10, después de la fase 1), recortados.
const CODES = {
  A:   { items: ["1", "3"], serie: "A" },
  A3:  { items: ["1", "3", "8", "FUEL"], serie: "A" },
  B:   { items: ["2", "3"], serie: "B" },
  BD:  { items: ["2", "3", "8", "11", "20", "19"], serie: "B", fuelLock: "diesel" },
  RC:  { items: ["RC"], serie: "C" },
  RG:  { items: ["RG_PTS"], serie: "C" },
  AEV: { items: ["EV_A"], serie: "EV", ev: true },
};
const blk = (label, n) => ({ label, icon: "·", tasks: Array.from({ length: n }, (_, i) => `${label} ${i}`) });
const ITEMS = {
  1: blk("A", 2), 2: blk("B", 2), 3: blk("Aceite", 2), 8: blk("Aire", 1), 11: blk("Comb", 1), 12: blk("Bujías", 1),
  19: blk("DPF", 1), 20: blk("ATF", 1), RC: blk("RC", 2), RG_PTS: blk("RG", 2), RC_EV: blk("RC EV", 3), RG_EV: blk("RG EV", 3),
  EV_A: blk("EV A", 1),
  GLOW: { label: "Glow", icon: "·", tasks: ["~Extracción", "Verificación"], outOfAssyst: true },
  GLOW_TEST: { label: "Prueba glow", icon: "·", tasks: ["Prueba con XENTRY"], outOfAssyst: true },
  "4M_DIFF": blk("Dif tras", 1), "4M_FDIFF": blk("Dif del", 1), "4M_INSP": blk("Insp 4M", 1),
};
const items = (code, fuel, is4m, opts) => [...new Set(buildTasks(code, fuel, is4m, CODES, ITEMS, opts).map(t => itemDeTareaId(t.id)))];

test("diésel A: GLOW_TEST automático y SIN GLOW; con la casilla, GLOW", () => {
  assert.deepEqual(items("A", "diesel", false), ["1", "3", "GLOW_TEST"]);
  assert.deepEqual(items("A", "diesel", false, { adicionales: { glow: true, diferenciales: false } }), ["1", "3", "GLOW_TEST", "GLOW"]);
});

test("4MATIC: 4M_INSP automático; el cambio de diferenciales solo con la casilla", () => {
  assert.deepEqual(items("B", "gasolina", true), ["2", "3", "4M_INSP"]);
  assert.deepEqual(items("B", "gasolina", true, { adicionales: { glow: false, diferenciales: true } }), ["2", "3", "4M_INSP", "4M_DIFF", "4M_FDIFF"]);
});

test("un adicional sin su condición no entra (GLOW en gasolina, diferenciales sin 4MATIC)", () => {
  assert.deepEqual(items("A", "gasolina", false, { adicionales: { glow: true, diferenciales: true } }), ["1", "3"]);
});

test("A3: FUEL → 11 en diésel (sin bujías de gasolina) y 12 en gasolina", () => {
  assert.deepEqual(items("A3", "diesel", false), ["1", "3", "8", "11", "GLOW_TEST"]);
  assert.deepEqual(items("A3", "gasolina", false), ["1", "3", "8", "12"]);
});

test("serie C: sin GLOW_TEST ni 4M_INSP; en un eléctrico RC_EV y RG_EV", () => {
  assert.deepEqual(items("RC", "diesel", true), ["RC"]);
  assert.deepEqual(items("RG", "gasolina", true), ["RG_PTS"]);
  assert.deepEqual(items("RC", "electrico", false), ["RC_EV"]);
  assert.deepEqual(items("RG", "electrico", true), ["RG_EV"]);
});

test("serie C de un borrador VIEJO con GLOW guardado: lo conserva (manda lo guardado)", () => {
  assert.deepEqual(items("RC", "diesel", false, { adicionales: { glow: true, diferenciales: false, legado: true } }), ["RC", "GLOW"]);
  // una casilla elegida (no legado) nunca se arrastra a la serie C
  assert.deepEqual(items("RC", "diesel", false, { adicionales: { glow: true, diferenciales: false, legado: false } }), ["RC"]);
});

test("serie EV y combustible eléctrico: sin agregados", () => {
  assert.deepEqual(items("AEV", "electrico", true), ["EV_A"]);
  assert.deepEqual(items("A", "electrico", true, { adicionales: { glow: true, diferenciales: true } }), ["1", "3"]);
});

test("soloItems: un servicio ya cerrado muestra solo los ítems que tiene guardados", () => {
  assert.deepEqual(items("A", "diesel", false, { soloItems: new Set(["1", "3"]) }), ["1", "3"]);
});

test("ids de las tareas y texto sin el ~ interno", () => {
  const ts = buildTasks("A", "diesel", false, CODES, ITEMS, { adicionales: { glow: true, diferenciales: false } });
  assert.ok(ts.some(t => t.id === "GLOW_TEST_0"));
  assert.ok(ts.some(t => t.id === "GLOW_0" && t.text === "Extracción" && t.outOfAssyst));
  assert.equal(stripInterna("~ algo"), "algo");
  assert.deepEqual(buildTasks("ZZ", "diesel", false, CODES, ITEMS), []);
});

test("itemDeTareaId: se quita SOLO el último _n, nunca por prefijo (GLOW_TEST empieza con GLOW_)", () => {
  assert.equal(itemDeTareaId("GLOW_TEST_0"), "GLOW_TEST");
  assert.equal(itemDeTareaId("GLOW_6"), "GLOW");
  assert.equal(itemDeTareaId("4M_INSP_0"), "4M_INSP");
  assert.equal(itemDeTareaId("4M_DIFF_2"), "4M_DIFF");
  assert.equal(itemDeTareaId("RC_EV_10"), "RC_EV");
  assert.equal(itemDeTareaId("3_0"), "3");
  assert.equal(itemDeTareaId("t1"), null);
});

test("adicionalesDeTareas: GLOW_TEST NO cuenta como el adicional GLOW", () => {
  assert.deepEqual(adicionalesDeTareas(["1_0", "GLOW_TEST_0"]), { glow: false, diferenciales: false, legado: true });
  assert.deepEqual(adicionalesDeTareas(["GLOW_0", "GLOW_6"]), { glow: true, diferenciales: false, legado: true });
  assert.deepEqual(adicionalesDeTareas(["4M_INSP_0", "4M_FDIFF_1"]), { glow: false, diferenciales: true, legado: true });
  assert.equal(SIN_ADICIONALES.legado, false);
  assert.deepEqual(idsDeRevisiones({ a: [{ id: "1_0" }], b: [{ id: "GLOW_0" }, {}] }), ["1_0", "GLOW_0"]);
  assert.deepEqual(idsDeRevisiones(null), []);
});

test("candado: con el combustible fijo, un código de otro combustible queda deshabilitado", () => {
  assert.deepEqual(estadoCandado({ fuelLock: "diesel", fuel: "gasolina", fuelFijo: true }), { deshabilitado: true, ponerFuel: null });
  assert.deepEqual(estadoCandado({ fuelLock: "diesel", fuel: "diesel", fuelFijo: true }), { deshabilitado: false, ponerFuel: null });
  // combustible libre (el vehículo no lo dice): elegirlo lo pone para ese combustible
  assert.deepEqual(estadoCandado({ fuelLock: "diesel", fuel: "gasolina", fuelFijo: false }), { deshabilitado: false, ponerFuel: "diesel" });
  assert.deepEqual(estadoCandado({ fuelLock: null, fuel: "gasolina", fuelFijo: true }), { deshabilitado: false, ponerFuel: null });
});

test("casillas de adicionales: glow solo diésel no EV no serie C; diferenciales solo 4MATIC", () => {
  assert.deepEqual(adicionalesOfrecidos(CODES.A, { fuel: "diesel", is4m: false }), { glow: true, diferenciales: false });
  assert.deepEqual(adicionalesOfrecidos(CODES.B, { fuel: "gasolina", is4m: true }), { glow: false, diferenciales: true });
  assert.deepEqual(adicionalesOfrecidos(CODES.RC, { fuel: "diesel", is4m: true }), { glow: false, diferenciales: false });
  assert.deepEqual(adicionalesOfrecidos(CODES.AEV, { fuel: "electrico", is4m: true }), { glow: false, diferenciales: false });
});
