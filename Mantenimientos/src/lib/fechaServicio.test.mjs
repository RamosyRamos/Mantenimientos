// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoFechaCR, fechaServicioTexto, fechaServicioCorta } from "./fechaServicio.js";

test("formatoFechaCR: hora de Costa Rica (UTC-6) con el formato de la columna", () => {
  assert.equal(formatoFechaCR("2026-10-08T22:35:23.345+00:00"), "08/10/2026 16:35");
  assert.equal(formatoFechaCR("2026-10-09T03:10:00Z"), "08/10/2026 21:10");
  assert.equal(formatoFechaCR(new Date("2026-04-21T21:27:00Z")), "21/04/2026 15:27");
  assert.equal(formatoFechaCR(null), null);
  assert.equal(formatoFechaCR("no es fecha"), null);
});

test("fechaServicioTexto: la columna si está; si no, created_at formateado igual", () => {
  assert.equal(fechaServicioTexto({ fecha: "21/04/2026 15:27", created_at: "2026-04-22T00:00:00Z" }), "21/04/2026 15:27");
  assert.equal(fechaServicioTexto({ fecha: null, created_at: "2026-10-03T19:05:00+00:00" }), "03/10/2026 13:05");
  assert.equal(fechaServicioTexto({ fecha: "  ", created_at: "2026-10-03T19:05:00Z" }), "03/10/2026 13:05");
  assert.equal(fechaServicioTexto({}), null);
  assert.equal(fechaServicioCorta({ fecha: null, created_at: "2026-10-03T19:05:00Z" }), "03/10/2026");
});
