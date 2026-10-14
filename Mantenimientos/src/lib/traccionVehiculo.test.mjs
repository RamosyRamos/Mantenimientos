// npm test  (= node --test; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoTraccion, es4maticDeRespuesta, TEXTO_TRACCION_SEGUN_VEHICULO } from "./traccionVehiculo.js";

test("es4maticDeRespuesta: solo un sí; lo demás (null, ausente, false) es no se sabe", () => {
  assert.equal(es4maticDeRespuesta({ traccion: { es_4matic: true } }), true);
  for (const d of [null, {}, { traccion: null }, { traccion: { es_4matic: null } }, { traccion: { es_4matic: false } }]) {
    assert.equal(es4maticDeRespuesta(d), null);
  }
});

test("servicio nuevo con vehículo 4MATIC: se prende solo y queda bloqueado", () => {
  assert.deepEqual(estadoTraccion({ es4maticVehiculo: true, is4mActual: false }),
    { delVehiculo: true, autoseleccionar: true, bloqueado: true, aviso: null });
  assert.deepEqual(estadoTraccion({ es4maticVehiculo: true, is4mActual: true }),
    { delVehiculo: true, autoseleccionar: null, bloqueado: true, aviso: null });
});

test("sin dato (no se sabe): libre, como siempre; nunca se apaga solo", () => {
  for (const actual of [true, false]) {
    assert.deepEqual(estadoTraccion({ es4maticVehiculo: null, is4mActual: actual }),
      { delVehiculo: null, autoseleccionar: null, bloqueado: false, aviso: null });
    assert.equal(estadoTraccion({ es4maticVehiculo: false, is4mActual: actual }).bloqueado, false);
  }
});

test("servicio guardado sin 4MATIC y vehículo 4MATIC: manda lo guardado, con aviso", () => {
  const e = estadoTraccion({ es4maticVehiculo: true, is4mActual: false, servicioExistente: true });
  assert.equal(e.autoseleccionar, null);
  assert.equal(e.bloqueado, false);
  assert.match(e.aviso, /sin 4MATIC/);
});

test("servicio guardado con 4MATIC y vehículo 4MATIC: bloqueado, sin aviso", () => {
  assert.deepEqual(estadoTraccion({ es4maticVehiculo: true, is4mActual: true, servicioExistente: true }),
    { delVehiculo: true, autoseleccionar: null, bloqueado: true, aviso: null });
});

test("el texto de origen nombra dónde se corrige", () => {
  assert.match(TEXTO_TRACCION_SEGUN_VEHICULO, /editá el vehículo en Taller/);
});
