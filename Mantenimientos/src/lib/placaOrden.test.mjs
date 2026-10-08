// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizarPlaca, placasCoinciden, verificarPlacaOrden, mensajePlacaDistinta, preguntaDesvincular,
  decidirPlacaPaso1, placaAlCancelar, blurVaAContinuar,
} from "./placaOrden.js";

test("normalizarPlaca: mayúsculas, sin espacios ni guiones", () => {
  assert.equal(normalizarPlaca(" mfc-090 "), "MFC090");
  assert.equal(normalizarPlaca("CL 314 594"), "CL314594");
  assert.equal(normalizarPlaca(null), "");
});

test("placasCoinciden: iguales normalizadas; vacías nunca coinciden", () => {
  assert.equal(placasCoinciden("mfc 090", "MFC-090"), true);
  assert.equal(placasCoinciden("347559", "MFC090"), false);
  assert.equal(placasCoinciden("", ""), false);
});

test("verificarPlacaOrden: coincide / distinta / incompleto", () => {
  const fila = { vehiculo_id: "v1", vehiculos: { patente: "MFC090" } };
  assert.equal(verificarPlacaOrden({ placaServicio: "mfc090", ordenRow: fila }).estado, "coincide");
  const d = verificarPlacaOrden({ placaServicio: "347559", ordenRow: fila });
  assert.deepEqual(d, { estado: "distinta", placaOrden: "MFC090", placaServicio: "347559" });
  assert.equal(verificarPlacaOrden({ placaServicio: "347559", ordenRow: null }).estado, "incompleto");
  assert.equal(verificarPlacaOrden({ placaServicio: "347559", ordenRow: { vehiculo_id: null, vehiculos: null } }).estado, "incompleto");
  assert.equal(verificarPlacaOrden({ placaServicio: "", ordenRow: fila }).estado, "incompleto");
  // el embed puede venir como array
  assert.equal(verificarPlacaOrden({ placaServicio: "MFC090", ordenRow: { vehiculo_id: "v1", vehiculos: [{ patente: "MFC090" }] } }).estado, "coincide");
});

test("mensajes: nombran las dos placas y la orden, con o sin #", () => {
  const m = mensajePlacaDistinta({ placaServicio: "347559", placaOrden: "MFC090", ordenNumero: "#3050" });
  assert.match(m, /placa 347559/); assert.match(m, /orden #3050/); assert.match(m, /placa MFC090/);
  assert.match(mensajePlacaDistinta({ placaServicio: "A", placaOrden: "B", ordenNumero: "3050" }), /orden #3050/);
  assert.match(mensajePlacaDistinta({ placaServicio: "A", placaOrden: "B" }), /orden destino/);
  const p = preguntaDesvincular({ placaServicio: "347559", placaOrden: "MFC090", ordenNumero: "3050" });
  assert.match(p, /no es la de la orden #3050 \(MFC090\)/); assert.match(p, /¿desvincular/i);
});

test("decidirPlacaPaso1: sin orden o sin placa de la orden no pregunta; distinta pregunta", () => {
  assert.deepEqual(decidirPlacaPaso1({ ordenId: "", placaOrden: "MFC090", placa: "347559" }), { accion: "seguir" });
  assert.deepEqual(decidirPlacaPaso1({ ordenId: "o1", placaOrden: null, placa: "347559" }), { accion: "seguir" });
  assert.deepEqual(decidirPlacaPaso1({ ordenId: "o1", placaOrden: "MFC090", placa: "" }), { accion: "seguir" });
  assert.deepEqual(decidirPlacaPaso1({ ordenId: "o1", placaOrden: "MFC090", placa: "mfc-090" }), { accion: "seguir" });
  assert.deepEqual(decidirPlacaPaso1({ ordenId: "o1", placaOrden: "MFC090", placa: "347559" }), { accion: "preguntar", placaServicio: "347559", placaOrden: "MFC090" });
});

test("blurVaAContinuar: el blur hacia el botón Continuar (o lo que tenga adentro, o con el pointerdown marcado) no pregunta; cualquier otro blur sí", () => {
  const hijo = {};
  const boton = { contains: (n) => n === hijo };
  const otro = { contains: () => false };
  assert.equal(blurVaAContinuar({ relatedTarget: boton, botonContinuar: boton }), true);
  assert.equal(blurVaAContinuar({ relatedTarget: hijo, botonContinuar: boton }), true);
  assert.equal(blurVaAContinuar({ relatedTarget: null, botonContinuar: boton, continuarPresionado: true }), true);
  assert.equal(blurVaAContinuar({ relatedTarget: null, botonContinuar: boton }), false);
  assert.equal(blurVaAContinuar({ relatedTarget: otro, botonContinuar: boton }), false);
  assert.equal(blurVaAContinuar({ relatedTarget: boton, botonContinuar: null }), false);
  assert.equal(blurVaAContinuar(), false);
});

test("placaAlCancelar: vuelve a la anterior si coincidía con la orden; si no, a la de la orden", () => {
  assert.equal(placaAlCancelar({ placaAnterior: "MFC090", placaOrden: "MFC090" }), "MFC090");
  assert.equal(placaAlCancelar({ placaAnterior: "347559", placaOrden: "MFC090" }), "MFC090");
  assert.equal(placaAlCancelar({ placaAnterior: "", placaOrden: "MFC090" }), "MFC090");
});
