// npm test — el gemelo servicioAutor.js (el mismo archivo que Taller prueba con
// vitest en src/lib/servicioAutor.test.js). feat/autor-por-sesion, 19/10/2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  camposAutorNuevo, esAutorDelServicio, servicioEsDeOtro, destinoPushAutor,
  puedeDescartarServicio, itemsMarcados, preguntaDescarte, argumentosDescarte, resultadoDescarte,
} from "./servicioAutor.js";

const bryan = { id: "u-bryan", nombre: "Bryan Brenes", rol: "mecanico" };
const fabian = { id: "u-fabian", nombre: "Fabián Araya", rol: "mecanico" };
const gustavo = { id: "u-gustavo", nombre: "Gustavo Ramos", rol: "jefe" };

test("autor de la sesión, una sola vez", () => {
  assert.deepEqual(camposAutorNuevo({ esFilaNueva: true, sesion: bryan }), { mecanico: "Bryan Brenes", mecanico_id: "u-bryan" });
  assert.deepEqual(camposAutorNuevo({ esFilaNueva: false, sesion: bryan }), {});
});

test("cruces por id con respaldo por nombre", () => {
  assert.equal(esAutorDelServicio({ mecanico: "Otro", mecanico_id: "u-bryan" }, bryan), true);
  assert.equal(esAutorDelServicio({ mecanico: "Bryan Brenes", mecanico_id: "u-bryan" }, { id: "u-x", nombre: "Bryan Brenes" }), false);
  assert.equal(esAutorDelServicio({ mecanico: " FABIAN araya " }, fabian), true);
  assert.equal(servicioEsDeOtro({ mecanico: "" }, bryan), false);
  assert.equal(servicioEsDeOtro({ mecanico_id: "u-bryan", mecanico: "Bryan Brenes" }, fabian), true);
  assert.deepEqual(destinoPushAutor({ mecanico: "Bryan Brenes", mecanico_id: "u-bryan" }), { to_user_id: "u-bryan" });
  assert.deepEqual(destinoPushAutor({ mecanico: "Fabian Araya" }), { to_user_nombre: "Fabian Araya" });
  assert.equal(destinoPushAutor({}), null);
});

test("descarte: autor o jefe/admin, solo borrador", () => {
  const b = { estado: "borrador", mecanico: "Bryan Brenes", mecanico_id: "u-bryan" };
  assert.equal(puedeDescartarServicio(b, bryan).ok, true);
  assert.equal(puedeDescartarServicio(b, fabian).motivo, "permiso");
  assert.equal(puedeDescartarServicio(b, gustavo).ok, true);
  assert.equal(puedeDescartarServicio({ ...b, rechazado: true }, bryan).ok, true);
  assert.equal(puedeDescartarServicio({ ...b, estado: "pendiente" }, gustavo).motivo, "estado");
  assert.equal(puedeDescartarServicio({ ...b, estado: "aprobado" }, gustavo).motivo, "estado");
});

test("confirmación fuerte y argumentos de la RPC", () => {
  assert.equal(itemsMarcados({ g: [{ status: "ok" }, { status: "pending" }, { status: "issue" }] }), 2);
  assert.equal(preguntaDescarte(0), null);
  assert.equal(preguntaDescarte(3), "Tiene 3 ítems marcados; se perderán del informe. ¿Descartar?");
  assert.deepEqual(argumentosDescarte("s1", "  x "), { p_servicio_id: "s1", p_motivo: "x" });
  assert.deepEqual(resultadoDescarte({ ok: true }), { ok: true, error: null });
  assert.equal(resultadoDescarte({ ok: false, error: "no_autorizado" }).ok, false);
});
