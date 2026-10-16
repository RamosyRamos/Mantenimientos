// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { JEFES, ADMIN, APROBADORES_Y_ADMIN } from "./destinatariosPush.js";

test("los avisos a quienes aprueban van a los tres jefes y al admin", () => {
  assert.deepEqual(JEFES, ["Otto Ramos", "Gustavo Ramos", "Arturo Ramos"]);
  assert.deepEqual(APROBADORES_Y_ADMIN, ["Otto Ramos", "Gustavo Ramos", "Arturo Ramos", "Joseline Guzman"]);
  assert.ok(APROBADORES_Y_ADMIN.includes(ADMIN[0]));
});

test("sin repetidos: nadie recibe el aviso dos veces", () => {
  assert.equal(new Set(APROBADORES_Y_ADMIN).size, APROBADORES_Y_ADMIN.length);
});
