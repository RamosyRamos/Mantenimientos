// npm test  (= node --test; sin dependencias)
// Gemelo con Taller (src/lib/revisionPuntos.js): los mismos casos viven en revisionPuntos.test.js de ese repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  itemDeIdPunto, esClaveEstable, puntoSeguible, faltantesDeRevisiones, problemaCierreRevision,
  mensajeCierre, tipoRevision, textoDictamen, reparacionesParaGuardar, reparacionesConTexto, reparacionesSinId,
  bloqueDictamenInforme, conBloqueDictamen, formatoColones, normalizarTextoPunto, MARCA_DICTAMEN,
} from "./revisionPuntos.js";

test("itemDeIdPunto: clave estable e id viejo", () => {
  assert.equal(itemDeIdPunto("RC:19"), "RC");
  assert.equal(itemDeIdPunto("RG_PTS:17"), "RG_PTS");
  assert.equal(itemDeIdPunto("GLOW_TEST_0"), "GLOW_TEST");
  assert.equal(itemDeIdPunto("3_0"), "3");
  assert.equal(itemDeIdPunto("t1"), null);
  assert.equal(itemDeIdPunto(null), null);
  assert.equal(esClaveEstable("RC:19"), true);
  assert.equal(esClaveEstable("RC_19"), false);
  assert.equal(esClaveEstable("RC:0"), false);
});

test("normalizarTextoPunto: sin ~, tildes, mayúsculas ni signos", () => {
  assert.equal(normalizarTextoPunto("~ Inspección — LUCES."), "inspeccionluces");
});

test("puntoSeguible: fuera la versión anterior y las filas informativas", () => {
  assert.equal(puntoSeguible({ text: "Uno" }), true);
  assert.equal(puntoSeguible({ text: "Uno", version_anterior: true }), false);
  assert.equal(puntoSeguible({ text: "⚠ Aviso" }), false);
});

const rev = (estados) => ({ RC: estados.map((status, i) => ({ id: `RC:${i + 1}`, text: `Punto ${i + 1}`, status })) });

test("problemaCierreRevision: RC completa con dictamen → se puede cerrar", () => {
  assert.equal(problemaCierreRevision({ codigo: "RC", revisiones: rev(["ok", "issue", "na"]), dictamen: { recomendacion: "apto" } }), null);
});

test("problemaCierreRevision: puntos sin estado → bloquea y dice cuántos y cuáles", () => {
  const p = problemaCierreRevision({ codigo: "RC", revisiones: rev(["ok", "pending", null]), dictamen: { recomendacion: "apto" } });
  assert.equal(p.faltantes.length, 2);
  assert.deepEqual(p.faltantes.map(f => f.texto), ["Punto 2", "Punto 3"]);
  assert.equal(p.sinDictamen, false);
  assert.match(p.mensaje, /Faltan 2 puntos sin marcar \(OK, hallazgo o N\/A\): Punto 2 y Punto 3\./);
});

test("problemaCierreRevision: sin dictamen (o con una clave que no es de su tipo) → bloquea", () => {
  const p = problemaCierreRevision({ codigo: "RG", revisiones: rev(["ok"]), dictamen: { recomendacion: "apto" } });
  assert.equal(p.sinDictamen, true);
  assert.match(p.mensaje, /estado del vehículo/);
  assert.match(problemaCierreRevision({ codigo: "RC", revisiones: rev(["ok"]), dictamen: null }).mensaje, /recomendación de compra/);
});

test("problemaCierreRevision: la versión anterior y las filas ⚠ no cuentan", () => {
  const r = { RC: [
    { id: "RC:1", text: "Uno", status: "ok" },
    { id: "RC_20", text: "Prueba en carretera", status: "pending", version_anterior: true },
    { id: "RC:2", text: "⚠ Informativa", status: "pending" },
  ] };
  assert.equal(problemaCierreRevision({ codigo: "RC", revisiones: r, dictamen: { recomendacion: "apto" } }), null);
});

test("problemaCierreRevision: un mantenimiento (no RC / RG) no se bloquea acá", () => {
  assert.equal(problemaCierreRevision({ codigo: "B3", revisiones: rev(["pending"]), dictamen: null }), null);
  assert.equal(tipoRevision("rc"), "compra");
  assert.equal(tipoRevision("RG"), "general");
  assert.equal(tipoRevision("RG_PTS"), null);
});

test("mensajeCierre: corta en 5 nombres y dice cuántos más", () => {
  const faltantes = Array.from({ length: 8 }, (_, i) => ({ texto: `P${i + 1}` }));
  assert.match(mensajeCierre({ tipo: "compra", faltantes }), /Faltan 8 puntos .*: P1, P2, P3, P4, P5 y 3 más\./);
  assert.match(mensajeCierre({ tipo: "compra", faltantes: [{ texto: "Solo" }] }), /Falta 1 punto sin marcar .*: Solo\./);
  assert.equal(mensajeCierre({ tipo: "compra" }), "");
});

test("faltantesDeRevisiones saca el ~ del texto", () => {
  assert.deepEqual(faltantesDeRevisiones({ G: [{ id: "G:1", text: "~ Interna", status: "pending" }] }).map(f => f.texto), ["Interna"]);
});

test("textoDictamen por tipo", () => {
  assert.equal(textoDictamen("compra", "apto_reparaciones"), "Apto con reparaciones");
  assert.equal(textoDictamen("general", "critico"), "Estado crítico");
  assert.equal(textoDictamen("general", "apto"), null);
});

test("reparacionesParaGuardar: cada una con id propio y sin ningún monto", () => {
  const out = reparacionesParaGuardar([
    { descripcion: "Frenos", costo_estimado: "45000" },
    { id: "r1", descripcion: "Alinear" },
    { id: "r1", descripcion: "Repetida" },
    { id: "con espacio", descripcion: "Id inválido" },
    null,
  ]);
  assert.equal(out.length, 4);
  assert.equal(out[1].id, "r1");
  assert.equal(new Set(out.map(r => r.id)).size, 4, "ids únicos");
  for (const r of out) {
    assert.deepEqual(Object.keys(r).sort(), ["descripcion", "id"]);
    assert.match(r.id, /^[A-Za-z0-9_-]{1,64}$/);
  }
  assert.deepEqual(reparacionesConTexto([{ id: "a", descripcion: " " }, { id: "b", descripcion: "x" }]).map(r => r.id), ["b"]);
});

test("bug 3: mostrar o cotizar no inventa ids — la que no tiene id sale con null, siempre igual", () => {
  const lista = [{ descripcion: "Frenos" }, { id: "r1", descripcion: "Alinear" }, { id: "r1", descripcion: "Repetida" }, { id: "mal id", descripcion: "Otra" }];
  const a = reparacionesConTexto(lista);
  const b = reparacionesConTexto(lista);
  assert.deepEqual(a, b, "dos renders dan lo mismo");
  assert.deepEqual(a.map(r => r.id), [null, "r1", null, null]);
  assert.equal(reparacionesSinId(lista), true);
  assert.equal(reparacionesSinId([{ id: "r1", descripcion: "x" }, { id: "r2", descripcion: "" }]), false);
  assert.equal(reparacionesSinId(null), false);
  // El id se da una sola vez, al guardar: y lo guardado ya no necesita otro.
  const guardadas = reparacionesParaGuardar(lista);
  assert.equal(reparacionesSinId(guardadas), false);
  assert.deepEqual(reparacionesParaGuardar(guardadas), guardadas, "volver a guardar no cambia ningún id");
  // El bloque del informe: una sin id se lista sin precio (el precio cuelga del id).
  const bloque = bloqueDictamenInforme({ codigo: "RC", dictamen: { recomendacion: "apto_reparaciones", reparaciones: [{ descripcion: "Frenos" }] }, precios: { null: 5000, undefined: 5000 } });
  assert.equal(bloque, `${MARCA_DICTAMEN} Apto con reparaciones\nReparaciones sugeridas:\n- Frenos`);
});

test("formatoColones", () => {
  assert.equal(formatoColones(45000), "₡45 000");
  assert.equal(formatoColones(1234567), "₡1 234 567");
  assert.equal(formatoColones("x"), "");
});

const dictamen = { recomendacion: "apto_reparaciones", reparaciones: [{ id: "a", descripcion: "Frenos\ndelanteros" }, { id: "b", descripcion: "Alinear" }] };

test("bloqueDictamenInforme: sin precios (Mantenimientos) no lleva montos", () => {
  assert.equal(bloqueDictamenInforme({ codigo: "RC", dictamen }),
    `${MARCA_DICTAMEN} Apto con reparaciones\nReparaciones sugeridas:\n- Frenos; delanteros\n- Alinear`);
});

test("bloqueDictamenInforme: con los precios de Taller suma el total", () => {
  assert.equal(bloqueDictamenInforme({ codigo: "RC", dictamen, precios: { a: 45000 } }),
    `${MARCA_DICTAMEN} Apto con reparaciones\nReparaciones sugeridas:\n- Frenos; delanteros — ₡45 000\n- Alinear\nTotal estimado: ₡45 000`);
  assert.equal(bloqueDictamenInforme({ codigo: "B3", dictamen }), "");
  assert.equal(bloqueDictamenInforme({ codigo: "RG", dictamen: { recomendacion: "bueno", reparaciones: [] } }), `${MARCA_DICTAMEN} Bueno, atención menor`);
});

test("conBloqueDictamen: va después del encabezado, se reemplaza y se saca", () => {
  const informe = "🔧 Revisión — 01/10/2026\n\nMecánico: X\nKilometraje: 1 km\n\n⚠️ Detalles:\n- a\n\n📝 Observaciones del mecánico:\nnota";
  const b1 = `${MARCA_DICTAMEN} Apto`;
  const con = conBloqueDictamen(informe, b1);
  assert.equal(con, "🔧 Revisión — 01/10/2026\n\nMecánico: X\nKilometraje: 1 km\n\n📋 Dictamen: Apto\n\n⚠️ Detalles:\n- a\n\n📝 Observaciones del mecánico:\nnota");
  const b2 = `${MARCA_DICTAMEN} Apto\nReparaciones sugeridas:\n- Frenos — ₡1 000`;
  assert.equal(conBloqueDictamen(con, b2), conBloqueDictamen(informe, b2), "reemplaza, no duplica");
  assert.equal(conBloqueDictamen(con, ""), informe, "un bloque vacío lo saca");
});
