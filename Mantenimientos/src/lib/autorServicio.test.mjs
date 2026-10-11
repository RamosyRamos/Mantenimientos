// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import { autorInicial, campoMecanico, autorMostrado } from "./autorServicio.js";

test("autorInicial: el link manda; sin link, la sesión; nada → vacío", () => {
  assert.equal(autorInicial({ mecanicoLink: "Fabian Araya", sessionNombre: "Gustavo Ramos" }), "Fabian Araya");
  assert.equal(autorInicial({ mecanicoLink: "  ", sessionNombre: "Gustavo Ramos" }), "Gustavo Ramos");
  assert.equal(autorInicial({ mecanicoLink: null, sessionNombre: "Bryan Brenes" }), "Bryan Brenes");
  assert.equal(autorInicial({}), "");
  assert.equal(autorMostrado({ mecanicoLink: "", sessionNombre: " Antonio " }), "Antonio");
});

test("campoMecanico: solo la fila nueva lleva mecanico; el PATCH nunca lo manda", () => {
  assert.deepEqual(campoMecanico({ esFilaNueva: true, autor: "Fabian Araya" }), { mecanico: "Fabian Araya" });
  assert.deepEqual(campoMecanico({ esFilaNueva: true, autor: "" }), {});
  // borrador ajeno abierto por un jefe, modo edición, confirmSig sobre fila existente: no se reescribe
  assert.deepEqual(campoMecanico({ esFilaNueva: false, autor: "Gustavo Ramos" }), {});
  assert.deepEqual(campoMecanico({ esFilaNueva: false, autor: "" }), {});
});

test("el autor se fija una sola vez: la secuencia autosave (POST) → confirmSig (PATCH) escribe mecanico solo en el POST", () => {
  const autor = autorInicial({ mecanicoLink: "", sessionNombre: "Antonio" });
  const post = campoMecanico({ esFilaNueva: true, autor });
  const patch = campoMecanico({ esFilaNueva: false, autor: autorInicial({ mecanicoLink: "", sessionNombre: "Gustavo Ramos" }) });
  assert.deepEqual(post, { mecanico: "Antonio" });
  assert.deepEqual(patch, {});
});
