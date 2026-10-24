// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { autorInicial, campoMecanico, autorMostrado } from "./autorServicio.js";

const bryan = { id: "u-bryan", nombre: "Bryan Brenes" };
const gustavo = { id: "u-gustavo", nombre: "Gustavo Ramos" };

test("autorInicial: SIEMPRE la sesión; el ?mecanico= de un link viejo se ignora (19/10)", () => {
  assert.equal(autorInicial({ mecanicoLink: "Fabian Araya", sessionNombre: "Gustavo Ramos" }), "Gustavo Ramos");
  assert.equal(autorInicial({ mecanicoLink: "  ", sessionNombre: " Bryan Brenes " }), "Bryan Brenes");
  assert.equal(autorInicial({}), "");
});

test("campoMecanico: la fila nueva lleva nombre e id de la sesión; el PATCH nunca los manda", () => {
  assert.deepEqual(campoMecanico({ esFilaNueva: true, session: bryan }), { mecanico: "Bryan Brenes", mecanico_id: "u-bryan" });
  assert.deepEqual(campoMecanico({ esFilaNueva: true, session: null }), {});
  // borrador ajeno abierto por un jefe, modo edición, confirmSig sobre fila existente: no se reescribe
  assert.deepEqual(campoMecanico({ esFilaNueva: false, session: gustavo }), {});
});

test("el autor se fija una sola vez: autosave (POST) → confirmSig (PATCH de otra persona) escribe solo en el POST", () => {
  const post = campoMecanico({ esFilaNueva: true, session: bryan });
  const patch = campoMecanico({ esFilaNueva: false, session: gustavo });
  assert.deepEqual(post, { mecanico: "Bryan Brenes", mecanico_id: "u-bryan" });
  assert.deepEqual(patch, {});
});

test("autorMostrado: el autor de la fila cargada; sin fila, la sesión", () => {
  assert.equal(autorMostrado({ mecanicoFila: "Fabian Araya", sessionNombre: "Gustavo Ramos" }), "Fabian Araya");
  assert.equal(autorMostrado({ mecanicoFila: "", sessionNombre: " Antonio " }), "Antonio");
});
