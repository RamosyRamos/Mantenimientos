// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarCombustible, estadoCombustible, TEXTO_SEGUN_VEHICULO } from "./combustibleVehiculo.js";

test("normalizarCombustible: los tres valores, con tildes y mayúsculas; lo demás es sin dato", () => {
  assert.equal(normalizarCombustible("gasolina"), "gasolina");
  assert.equal(normalizarCombustible(" Diésel "), "diesel");
  assert.equal(normalizarCombustible("ELÉCTRICO"), "electrico");
  for (const v of [null, undefined, "", "hibrido", "híbrido enchufable", "GNC", "gas", 0]) assert.equal(normalizarCombustible(v), null);
});

test("servicio nuevo con vehículo con combustible: autoselecciona y bloquea", () => {
  assert.deepEqual(estadoCombustible({ combustibleVehiculo: "diesel", combustibleActual: "gasolina" }),
    { delVehiculo: "diesel", autoseleccionar: "diesel", bloqueado: true, aviso: null });
  assert.equal(estadoCombustible({ combustibleVehiculo: "electrico", combustibleActual: "gasolina" }).autoseleccionar, "electrico");
  // ya coincide: bloqueado, nada que cambiar
  assert.deepEqual(estadoCombustible({ combustibleVehiculo: "Gasolina", combustibleActual: "gasolina" }),
    { delVehiculo: "gasolina", autoseleccionar: null, bloqueado: true, aviso: null });
});

test("sin vehículo, sin combustible o con un valor desconocido: libre como siempre", () => {
  for (const v of [null, "", "hibrido"]) {
    assert.deepEqual(estadoCombustible({ combustibleVehiculo: v, combustibleActual: "diesel" }),
      { delVehiculo: null, autoseleccionar: null, bloqueado: false, aviso: null });
    assert.equal(estadoCombustible({ combustibleVehiculo: v, combustibleActual: "diesel", servicioExistente: true }).bloqueado, false);
  }
});

test("servicio existente con otro combustible: no se cambia ni se bloquea, y avisa", () => {
  const e = estadoCombustible({ combustibleVehiculo: "diesel", combustibleActual: "gasolina", servicioExistente: true });
  assert.equal(e.autoseleccionar, null);
  assert.equal(e.bloqueado, false);
  assert.match(e.aviso, /se guardó con Gasolina/);
  assert.match(e.aviso, /dice Diesel/);
});

test("servicio existente con el mismo combustible: bloqueado, sin aviso ni cambio", () => {
  assert.deepEqual(estadoCombustible({ combustibleVehiculo: "diesel", combustibleActual: "diesel", servicioExistente: true }),
    { delVehiculo: "diesel", autoseleccionar: null, bloqueado: true, aviso: null });
});

test("el texto de origen nombra dónde se corrige", () => {
  assert.match(TEXTO_SEGUN_VEHICULO, /editá el vehículo en Taller/);
});
