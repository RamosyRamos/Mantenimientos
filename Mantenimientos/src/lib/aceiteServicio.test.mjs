// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aceiteGuardado, aceiteCalculado, aceiteCongelado, aceiteDelServicio, camposAceite, ETIQUETA_GUARDADO,
} from "./aceiteServicio.js";

// Fila de un borrador cuya categoría ya no existe en el selector: el cálculo
// de hoy (modelData[model] → motor) no encuentra nada.
const filaHuerfana = { estado: "borrador", modelo: "GLE / GLE Coupé (W166 / C166)", motor: "OM642 3.0D V6", aceite_litros: 8.5, aceite_spec: "MB 229.51" };
const sinCalculo = { litros: null, spec: null, llevaAceite: true };

test("borrador con categoría inexistente: al abrirlo se ve lo guardado, con la etiqueta", () => {
  const a = aceiteDelServicio({ ...sinCalculo, guardado: aceiteGuardado(filaHuerfana), congelado: aceiteCongelado(filaHuerfana.estado) });
  assert.deepEqual(a, { litros: 8.5, spec: "MB 229.51", origen: "guardado", etiqueta: ETIQUETA_GUARDADO });
});

test("borrador con categoría inexistente: el autosave conserva los litros (no manda null)", () => {
  const campos = camposAceite({ ...sinCalculo, guardado: aceiteGuardado(filaHuerfana), congelado: false });
  assert.deepEqual(campos, { aceite_litros: 8.5, aceite_spec: "MB 229.51" });
});

test("la firma de ese borrador también conserva lo guardado", () => {
  // confirmSig pasa a 'pendiente' desde un borrador: no está congelado.
  const campos = camposAceite({ litros: undefined, spec: undefined, llevaAceite: true, guardado: aceiteGuardado(filaHuerfana), congelado: aceiteCongelado("borrador") });
  assert.equal(campos.aceite_litros, 8.5);
  assert.equal(campos.aceite_spec, "MB 229.51");
});

test("aprobado en modo edición: el aceite no viaja en el PATCH aunque el cálculo dé otro valor", () => {
  const fila = { estado: "aprobado", aceite_litros: 7.5, aceite_spec: "MB 229.5" };
  const entrada = { litros: 8, spec: "MB 229.52", llevaAceite: true, guardado: aceiteGuardado(fila), congelado: aceiteCongelado(fila.estado) };
  assert.deepEqual(camposAceite(entrada), {});
  const visto = aceiteDelServicio(entrada);
  assert.equal(visto.litros, 7.5);
  assert.equal(visto.spec, "MB 229.5");
  assert.equal(visto.etiqueta, ETIQUETA_GUARDADO);
});

test("aprobado con cálculo vacío: tampoco se escribe ni se pierde nada", () => {
  const fila = { estado: "aprobado", aceite_litros: 6.5, aceite_spec: "MB 229.5" };
  const entrada = { ...sinCalculo, guardado: aceiteGuardado(fila), congelado: true };
  assert.deepEqual(camposAceite(entrada), {});
  assert.equal(aceiteDelServicio(entrada).litros, 6.5);
});

test("aprobado cuyo cálculo coincide con lo guardado: sin etiqueta", () => {
  const entrada = { litros: 6.5, spec: "MB 229.5", llevaAceite: true, guardado: { litros: 6.5, spec: "MB 229.5" }, congelado: true };
  assert.equal(aceiteDelServicio(entrada).etiqueta, null);
});

test("borrador con cálculo válido: como hoy (gana el cálculo, sin etiqueta)", () => {
  const entrada = { litros: 6.5, spec: "MB 229.5", llevaAceite: true, guardado: { litros: 7, spec: "MB 229.3" }, congelado: false };
  assert.deepEqual(camposAceite(entrada), { aceite_litros: 6.5, aceite_spec: "MB 229.5" });
  assert.deepEqual(aceiteDelServicio(entrada), { litros: 6.5, spec: "MB 229.5", origen: "calculo", etiqueta: null });
});

test("servicio nuevo con cálculo válido: como hoy", () => {
  assert.deepEqual(
    camposAceite({ litros: 5.5, spec: "MB 229.52", llevaAceite: true, guardado: aceiteGuardado(null), congelado: false }),
    { aceite_litros: 5.5, aceite_spec: "MB 229.52" },
  );
});

test("servicio nuevo sin cálculo: null, como hoy", () => {
  assert.deepEqual(
    camposAceite({ ...sinCalculo, guardado: aceiteGuardado(null), congelado: false }),
    { aceite_litros: null, aceite_spec: null },
  );
});

test("receta sin cambio de aceite: el cálculo es vacío y lo guardado no se borra", () => {
  assert.deepEqual(aceiteCalculado({ litros: 6.5, spec: "MB 229.5", llevaAceite: false }), { litros: null, spec: null });
  const campos = camposAceite({ litros: 6.5, spec: "MB 229.5", llevaAceite: false, guardado: { litros: 7, spec: "MB 229.3" }, congelado: false });
  assert.deepEqual(campos, { aceite_litros: 7, aceite_spec: "MB 229.3" });
});

test("cálculo con litros y sin spec: la spec guardada no se pisa con null", () => {
  const campos = camposAceite({ litros: 7, spec: null, llevaAceite: true, guardado: { litros: 7.5, spec: "MB 229.5" }, congelado: false });
  assert.deepEqual(campos, { aceite_litros: 7, aceite_spec: "MB 229.5" });
});

test("eléctrico (0 L) y valores raros cuentan como vacío", () => {
  assert.deepEqual(aceiteCalculado({ litros: 0, spec: "Sin aceite de motor", llevaAceite: true }), { litros: null, spec: null });
  assert.deepEqual(aceiteGuardado({ aceite_litros: "", aceite_spec: "  " }), { litros: null, spec: null });
  assert.deepEqual(aceiteGuardado({ aceite_litros: "8.5", aceite_spec: "MB 229.51" }), { litros: 8.5, spec: "MB 229.51" });
});
