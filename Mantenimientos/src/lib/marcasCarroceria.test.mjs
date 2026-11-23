// npm test — el gemelo marcasCarroceria.js (el mismo archivo que Taller prueba con
// vitest en src/lib/marcasCarroceria.test.js). feat/marcas-carroceria, 23/11/2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  etiquetaMarca, marcasVigentes, laminaDeUrl, puntoDeMarca, puntoDesdeToque, problemaMarca,
  argumentosAgregar, argumentosEditar, resultadoMarca, mensajeMarca, filtroMarcas,
  puedeModificarMarca, puedeAgregarEnRevision, resumenMarcas,
} from "./marcasCarroceria.js";

const O1 = "11111111-1111-4111-8111-111111111111";
const S1 = "22222222-2222-4222-8222-222222222222";
const M1 = "44444444-4444-4444-8444-444444444444";
const LAMINA = "https://x.supabase.co/storage/v1/object/public/vehiculos-carrocerias/W204/lamina.webp?v=e0af820261";

test("nombre de la marca y lista vigente numerada", () => {
  assert.equal(etiquetaMarca({ tipo: "quebradura" }), "Quebradura");
  assert.equal(etiquetaMarca({ tipo: "otro", tipo_otro: "Óxido" }), "Óxido");
  const filas = [
    { id: "b", created_at: "2", tipo: "golpe" },
    { id: "a", created_at: "1", tipo: "rayon" },
    { id: "c", created_at: "3", tipo: "otro", eliminada_at: "x" },
  ];
  assert.deepEqual(marcasVigentes(filas).map((m) => [m.numero, m.id]), [[1, "a"], [2, "b"]]);
  assert.equal(resumenMarcas(filas), "2 detalles");
  assert.equal(resumenMarcas([]), "Sin detalles");
});

test("la lámina sale de su URL y el punto solo va sobre su carrocería", () => {
  assert.deepEqual(laminaDeUrl(LAMINA), { url: LAMINA, codigo: "W204", version: "e0af820261" });
  assert.equal(laminaDeUrl("https://x.supabase.co/storage/v1/object/public/vehiculos-carrocerias/W204/foto.webp"), null);
  const m = { carroceria_codigo: "W204", x: "0.25000", y: 0.5 };
  assert.deepEqual(puntoDeMarca(m, "W204"), { x: 0.25, y: 0.5 });
  assert.equal(puntoDeMarca(m, "W205"), null);
  assert.equal(puntoDeMarca(m, null), null);
});

test("del toque al punto: fracción de la imagen, nunca fuera de ella", () => {
  const rect = { left: 10, top: 100, width: 400, height: 300 };
  assert.deepEqual(puntoDesdeToque({ clientX: 110, clientY: 250 }, rect), { x: 0.25, y: 0.5 });
  assert.equal(puntoDesdeToque({ clientX: 5, clientY: 250 }, rect), null);
  assert.equal(puntoDesdeToque({ clientX: 1, clientY: 1 }, { left: 0, top: 0, width: 0, height: 0 }), null);
});

test("lo que le falta al borrador", () => {
  assert.equal(problemaMarca({ tipo: "" }), "Elegí el tipo de detalle.");
  assert.equal(problemaMarca({ tipo: "otro", tipo_otro: " " }), "Escribí qué es el detalle.");
  assert.equal(problemaMarca({ tipo: "golpe" }), null);
});

test("argumentos: la revisión manda el servicio; sin lámina no viaja punto", () => {
  const lamina = laminaDeUrl(LAMINA);
  const a = argumentosAgregar({ origen: "revision", ordenId: O1, servicioId: S1, borrador: { tipo: "golpe", descripcion: " Puerta " }, punto: { x: 0.2, y: 0.3 }, lamina });
  assert.deepEqual(a, { p_origen: "revision", p_orden_id: null, p_servicio_id: S1, p_tipo: "golpe", p_tipo_otro: null, p_descripcion: "Puerta", p_foto_url: null, p_carroceria_codigo: "W204", p_lamina_version: "e0af820261", p_x: 0.2, p_y: 0.3 });
  const sin = argumentosAgregar({ origen: "revision", servicioId: S1, borrador: { tipo: "rayon" }, punto: { x: 0.2, y: 0.3 }, lamina: null });
  assert.deepEqual([sin.p_carroceria_codigo, sin.p_x, sin.p_y], [null, null, null]);
  const e = argumentosEditar({ id: M1, borrador: { tipo: "golpe" }, punto: { x: 0.1, y: 0.1 }, lamina });
  assert.deepEqual([e.p_mover, e.p_x], [false, null]);
});

test("solo ok: true cuenta como guardado", () => {
  assert.equal(resultadoMarca({ ok: true, marca: { id: M1 } }, null).ok, true);
  assert.equal(resultadoMarca(null, null).ok, false);
  assert.equal(resultadoMarca({ ok: true, marca: {} }, { message: "Failed to fetch" }).ok, false);
  assert.equal(resultadoMarca({ ok: false, error: "no_es_borrador" }, null).mensaje, mensajeMarca("no_es_borrador"));
});

test("qué se lee y quién puede", () => {
  assert.equal(filtroMarcas({ ordenId: O1, servicioIds: [S1] }), `orden_id.eq.${O1},servicio_id.eq.${S1}`);
  assert.equal(filtroMarcas({ ordenId: null, servicioIds: S1 }), `servicio_id.eq.${S1}`);
  assert.equal(filtroMarcas({}), null);
  const mia = { id: M1, origen: "revision", creado_por_id: "u-fabian" };
  assert.equal(puedeModificarMarca(mia, { sessionId: "u-fabian", rol: "mecanico", estadoServicio: "borrador" }), true);
  assert.equal(puedeModificarMarca(mia, { sessionId: "u-fabian", rol: "mecanico", estadoServicio: "pendiente" }), false);
  assert.equal(puedeModificarMarca(mia, { sessionId: "u-otto", rol: "jefe", estadoServicio: "aprobado" }), true);
  assert.equal(puedeAgregarEnRevision({ rol: "mecanico", estadoServicio: "pendiente" }), false);
  assert.equal(puedeAgregarEnRevision({ rol: "jefe", estadoServicio: "aprobado" }), true);
});
