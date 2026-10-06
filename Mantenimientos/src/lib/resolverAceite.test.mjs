// npm test  (= node --test; sin dependencias)
// Respuestas simuladas con la forma real de la Edge Function resolver-aceite.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  llamarResolverAceite, aceiteDeRespuesta, aceiteCalculadoDeResolver, condicionDeEtiqueta, esUuid,
} from "./resolverAceite.js";
import { aceiteDelServicio, camposAceite, ETIQUETA_GUARDADO } from "./aceiteServicio.js";

const URL = "https://x.supabase.co/functions/v1/resolver-aceite";

// fetch falso: devuelve `status` + `cuerpo` y guarda lo que recibió.
const fetchFalso = (status, cuerpo) => {
  const llamadas = [];
  const f = async (url, opts) => {
    llamadas.push({ url, opts });
    return { ok: status >= 200 && status < 300, status, json: async () => cuerpo };
  };
  f.llamadas = llamadas;
  return f;
};

const AUTOMATICO = {
  vehiculo_id: "v1", build: "cee6f86", avisos: [],
  aceite: { estado: "auto", litros: 8, spec: "229.5", viscosidad: "5W40",
    origen: { tipo: "catalogo", etiqueta: "Por tarjeta de datos del EPC (M272.961)" },
    motivo: null, opciones: [], fuentes: ["BF18"] },
  atf: null,
};
const CON_OPCIONES = {
  vehiculo_id: "v2", build: "cee6f86", avisos: [],
  aceite: { estado: "pendiente", litros: null, spec: "229.52", viscosidad: "5W30",
    origen: { tipo: null, etiqueta: null }, motivo: "El catálogo da 2 cantidades.",
    opciones: [
      { litros: 6, spec: null, etiqueta: "Excepto código M005: 4MATIC: 6 L", origen: "catalogo" },
      { litros: 6.5, spec: null, etiqueta: "Con código M005: 4MATIC: 6.5 L", origen: "catalogo" },
      { litros: 7, spec: null, etiqueta: "Cantidad histórica del vehículo, sin verificar: 7 L", origen: "historico" },
    ], fuentes: [] },
  atf: null,
};
const PENDIENTE = {
  vehiculo_id: "v3", build: "cee6f86", avisos: [],
  aceite: { estado: "pendiente", litros: null, spec: null, viscosidad: null,
    origen: { tipo: null, etiqueta: null }, motivo: "Este vehículo no está enlazado al catálogo.",
    opciones: [{ litros: 7, spec: null, etiqueta: "Cantidad histórica del vehículo, sin verificar: 7 L", origen: "historico" }],
    fuentes: [] },
  atf: null,
};
const RAVENOL = {
  vehiculo_id: "v4", build: "cee6f86", avisos: [],
  aceite: { estado: "pendiente", litros: 11, spec: null, viscosidad: null,
    origen: { tipo: "ravenol", etiqueta: "11,0 L · Ravenol (capacidad)" }, motivo: "Sin producto.", opciones: [], fuentes: [] },
  atf: null,
};

test("automático: manda orden_id y los headers de la sesión, y devuelve la cantidad con origen WIS", async () => {
  const f = fetchFalso(200, AUTOMATICO);
  const r = await llamarResolverAceite({ ordenId: "o-1" }, { url: URL, headers: { Authorization: "Bearer jwt", "x-session-id": "u1" }, fetchImpl: f });
  assert.equal(r.ok, true);
  const { opts } = f.llamadas[0];
  assert.equal(opts.method, "POST");
  assert.deepEqual(JSON.parse(opts.body), { orden_id: "o-1" });
  assert.equal(opts.headers.Authorization, "Bearer jwt");
  assert.equal(opts.headers["x-session-id"], "u1");
  const a = aceiteDeRespuesta(r.datos);
  assert.deepEqual([a.tipo, a.litros, a.spec, a.origen], ["cantidad", 8, "229.5", "WIS"]);
});

test("sin orden_id manda vehiculo_id", async () => {
  const f = fetchFalso(200, AUTOMATICO);
  await llamarResolverAceite({ vehiculoId: "v1" }, { url: URL, fetchImpl: f });
  assert.deepEqual(JSON.parse(f.llamadas[0].opts.body), { vehiculo_id: "v1" });
});

test("con opciones: solo las documentadas, cada una con su condición; la histórica no se ofrece", () => {
  const a = aceiteDeRespuesta(CON_OPCIONES);
  assert.equal(a.tipo, "opciones");
  assert.deepEqual(a.opciones.map(o => [o.litros, o.condicion, o.origen, o.spec]), [
    [6, "Excepto código M005: 4MATIC", "WIS", "229.52"],
    [6.5, "Con código M005: 4MATIC", "WIS", "229.52"],
  ]);
});

test("con opciones: sin elegir no hay cálculo; elegida o guardada que coincide, sí", () => {
  const a = aceiteDeRespuesta(CON_OPCIONES);
  assert.equal(aceiteCalculadoDeResolver(a).litros, null);
  assert.deepEqual(aceiteCalculadoDeResolver(a, { elegida: 6.5 }), { litros: 6.5, spec: "229.52", origen: "WIS", elegida: 6.5 });
  // Al reabrir un servicio, lo guardado que coincide con una opción cuenta como elegido.
  assert.equal(aceiteCalculadoDeResolver(a, { guardado: { litros: 6, spec: "229.52" } }).elegida, 6);
  // Una guardada que no es ninguna opción no se elige sola.
  assert.equal(aceiteCalculadoDeResolver(a, { guardado: { litros: 9, spec: null } }).litros, null);
});

test("lo elegido es lo que se guarda en el servicio", () => {
  const a = aceiteDeRespuesta(CON_OPCIONES);
  const c = aceiteCalculadoDeResolver(a, { elegida: 6 });
  assert.deepEqual(camposAceite({ litros: c.litros, spec: c.spec, llevaAceite: true, guardado: { litros: null, spec: null }, congelado: false }),
    { aceite_litros: 6, aceite_spec: "229.52" });
});

test("pendiente sin opciones documentadas: sin dato (la histórica de vehiculos.aceite_lt no cuenta)", () => {
  const a = aceiteDeRespuesta(PENDIENTE);
  assert.equal(a.tipo, "sin_dato");
  assert.deepEqual(a.opciones, []);
});

test("sin dato y con aceite guardado en el servicio: se muestra lo guardado, nunca null encima", () => {
  const c = aceiteCalculadoDeResolver(aceiteDeRespuesta(PENDIENTE));
  const a = aceiteDelServicio({ litros: c.litros, spec: c.spec, llevaAceite: true, guardado: { litros: 8.5, spec: "MB 229.51" }, congelado: false });
  assert.deepEqual(a, { litros: 8.5, spec: "MB 229.51", origen: "guardado", etiqueta: ETIQUETA_GUARDADO });
});

test("Ravenol con cantidad y sin producto: se muestra la cantidad con origen Ravenol", () => {
  const a = aceiteDeRespuesta(RAVENOL);
  assert.deepEqual([a.tipo, a.litros, a.spec, a.origen], ["cantidad", 11, null, "Ravenol"]);
});

test("401: sin_sesion, sin lanzar", async () => {
  const r = await llamarResolverAceite({ vehiculoId: "v1" }, { url: URL, fetchImpl: fetchFalso(401, { error: "sin_sesion", build: "x" }) });
  assert.deepEqual([r.ok, r.motivo, r.status], [false, "sin_sesion", 401]);
  assert.equal(aceiteDeRespuesta(null).tipo, "sin_dato");
});

test("404 y 400 tienen su motivo", async () => {
  assert.equal((await llamarResolverAceite({ ordenId: "o" }, { url: URL, fetchImpl: fetchFalso(404, { error: "orden_no_encontrada" }) })).motivo, "no_encontrado");
  assert.equal((await llamarResolverAceite({ ordenId: "o" }, { url: URL, fetchImpl: fetchFalso(400, { error: "entrada_invalida" }) })).motivo, "entrada_invalida");
  assert.equal((await llamarResolverAceite({ ordenId: "o" }, { url: URL, fetchImpl: fetchFalso(500, { error: "fallo_lectura" }) })).motivo, "http");
});

test("error de red: motivo red, sin lanzar", async () => {
  const f = async () => { throw new TypeError("Failed to fetch"); };
  const r = await llamarResolverAceite({ vehiculoId: "v1" }, { url: URL, fetchImpl: f });
  assert.deepEqual([r.ok, r.motivo], [false, "red"]);
});

test("timeout corto: corta la espera y devuelve timeout", async () => {
  const f = (url, opts) => new Promise((_, reject) => {
    opts.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
  });
  const t0 = Date.now();
  const r = await llamarResolverAceite({ vehiculoId: "v1" }, { url: URL, fetchImpl: f, timeoutMs: 50 });
  assert.deepEqual([r.ok, r.motivo], [false, "timeout"]);
  assert.ok(Date.now() - t0 < 1000);
});

test("condición de la etiqueta y uuid", () => {
  assert.equal(condicionDeEtiqueta("Con código M005: 6.5 L"), "Con código M005");
  assert.equal(condicionDeEtiqueta("7.5 L"), null);
  assert.equal(condicionDeEtiqueta(""), null);
  assert.equal(esUuid("c461f068-f681-4f4b-9ed8-06b2ffd8f1aa"), true);
  assert.equal(esUuid("INT-#3100"), false);
});
