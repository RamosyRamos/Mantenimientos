import { test } from "node:test";
import assert from "node:assert/strict";
import { sinRechazo, CAMPOS_RECHAZO } from "./vistaCliente.js";

const aprobadoConHistorial = {
  id: "s1", slug: "ABC123-B-14102026-X1Y", estado: "aprobado", aprobado: true, aprobado_por: "Gustavo Ramos",
  rechazado: false, motivo_rechazo: "Faltaba la foto del filtro de aire.", rechazado_por: "Gustavo Ramos", rechazado_at: "2026-10-14T12:00:00Z",
  servicio_codigo: "B", mecanico: "Fabián Araya",
};

test("sinRechazo saca la marca y el historial del rechazo, y nada más", () => {
  const r = sinRechazo(aprobadoConHistorial);
  for (const c of CAMPOS_RECHAZO) assert.equal(c in r, false, c);
  assert.equal(r.slug, aprobadoConHistorial.slug);
  assert.equal(r.aprobado_por, "Gustavo Ramos");
  assert.equal(r.mecanico, "Fabián Araya");
  assert.equal(JSON.stringify(r).toLowerCase().includes("rechaz"), false);
  assert.equal(JSON.stringify(r).includes("filtro de aire"), false);
});

test("sinRechazo no toca la fila original y aguanta filas vacías", () => {
  sinRechazo(aprobadoConHistorial);
  assert.equal(aprobadoConHistorial.motivo_rechazo, "Faltaba la foto del filtro de aire.");
  assert.equal(sinRechazo(null), null);
  assert.equal(sinRechazo(undefined), undefined);
});

test("también una fila vieja con la marca todavía en true", () => {
  const r = sinRechazo({ ...aprobadoConHistorial, rechazado: true });
  assert.equal("rechazado" in r, false);
});
