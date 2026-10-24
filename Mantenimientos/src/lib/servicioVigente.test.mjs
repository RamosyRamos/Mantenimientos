// npm test  (= node --test sobre este archivo; sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  servicioVigente, accionAlAbrir, ACCION, esAjeno, esServicioDescartado, urlInformePublico,
  tipoDelLink, seriesVisibles, esChoqueVigente, marcasParaPasar, claveChoque,
  rechazoVigente, LIMPIAR_RECHAZO,
} from "./servicioVigente.js";

const s = (o) => ({ id: "s1", estado: "borrador", mecanico: "Fabián Araya", created_at: "2026-10-13T10:00:00Z", ...o });

test("servicioVigente: ignora descartados y toma el más nuevo de los vigentes", () => {
  assert.equal(servicioVigente([]), null);
  assert.equal(servicioVigente(null), null);
  assert.equal(servicioVigente([s({ estado: "descartado" })]), null);
  const v = servicioVigente([
    s({ id: "a", estado: "aprobado", created_at: "2026-10-13T16:03:00Z" }),
    s({ id: "b", estado: "descartado", created_at: "2026-10-13T19:12:00Z" }),
  ]);
  assert.equal(v.id, "a");
  assert.equal(servicioVigente([s({ id: "x", created_at: "2026-10-01" }), s({ id: "y", created_at: "2026-10-02" })]).id, "y");
});

test("accionAlAbrir: sin servicio → nuevo", () => {
  assert.equal(accionAlAbrir(null).accion, ACCION.NUEVO);
  assert.equal(accionAlAbrir(s({ estado: "descartado" })).accion, ACCION.NUEVO);
});

test("accionAlAbrir: borrador propio → continuar, sin aviso de ajeno", () => {
  const r = accionAlAbrir(s(), { nombreSesion: "Fabian Araya" });
  assert.equal(r.accion, ACCION.CONTINUAR);
  assert.equal(r.ajeno, false);
});

test("accionAlAbrir: borrador ajeno → continuar con 'lo lleva'", () => {
  const r = accionAlAbrir(s(), { nombreSesion: "Antonio" });
  assert.equal(r.accion, ACCION.CONTINUAR);
  assert.equal(r.ajeno, true);
  assert.equal(r.lleva, "Fabián Araya");
});

test("accionAlAbrir: borrador rechazado → corregir con el motivo completo", () => {
  const motivo = "Falta la foto del filtro de aire y el nivel de refrigerante quedó sin marcar. Revisar también las fibras traseras antes de enviar.";
  const r = accionAlAbrir(s({ rechazado: true, motivo_rechazo: `  ${motivo}  `, rechazado_por: "Gustavo Ramos" }), { nombreSesion: "Fabián Araya" });
  assert.equal(r.accion, ACCION.CORREGIR);
  assert.equal(r.motivo, motivo);
  assert.equal(r.rechazadoPor, "Gustavo Ramos");
});

test("accionAlAbrir: pendiente → por aprobar (aunque arrastre el flag rechazado)", () => {
  assert.equal(accionAlAbrir(s({ estado: "pendiente" })).accion, ACCION.POR_APROBAR);
  assert.equal(accionAlAbrir(s({ estado: "pendiente", rechazado: true })).accion, ACCION.POR_APROBAR);
  assert.equal(accionAlAbrir(s({ estado: null })).accion, ACCION.POR_APROBAR);
});

test("accionAlAbrir: aprobado → informe", () => {
  assert.equal(accionAlAbrir(s({ estado: "aprobado", aprobado: true })).accion, ACCION.APROBADO);
});

test("esAjeno: sin autor guardado no es ajeno; compara sin tildes ni mayúsculas", () => {
  assert.equal(esAjeno(s({ mecanico: "" }), "Antonio"), false);
  assert.equal(esAjeno(s({ mecanico: " BRYAN brenes " }), "Bryan Brenes"), false);
  assert.equal(esAjeno(s({ mecanico: "Bryan Brenes" }), "Antonio"), true);
});

test("urlInformePublico: slug, si no el id", () => {
  assert.equal(urlInformePublico({ slug: "ABC-A-01", id: "x" }, "https://m.ej/"), "https://m.ej/servicio/ABC-A-01");
  assert.equal(urlInformePublico({ id: "x" }, "https://m.ej"), "https://m.ej/servicio/x");
  assert.equal(urlInformePublico(null, "https://m.ej"), null);
});

test("tipoDelLink y seriesVisibles", () => {
  assert.equal(tipoDelLink("revision"), "revision");
  assert.equal(tipoDelLink(" Mantenimiento "), "mantenimiento");
  assert.equal(tipoDelLink("otra"), null);
  assert.equal(tipoDelLink(null), null);
  assert.deepEqual(seriesVisibles(null), { mantenimiento: true, revision: true });
  assert.deepEqual(seriesVisibles("revision"), { mantenimiento: false, revision: true });
  assert.deepEqual(seriesVisibles("mantenimiento"), { mantenimiento: true, revision: false });
  assert.deepEqual(seriesVisibles("revision", { verTodas: true }), { mantenimiento: true, revision: true });
});

test("esChoqueVigente: solo el 409 del índice", () => {
  const body = '{"code":"23505","details":"Key (orden_id)=(x) already exists.","message":"duplicate key value violates unique constraint \\"servicios_un_vigente_por_orden\\""}';
  assert.equal(esChoqueVigente({ tipo: "http", status: 409, body }), true);
  assert.equal(esChoqueVigente({ tipo: "http", status: 409, body: '{"code":"23503"}' }), false);
  assert.equal(esChoqueVigente({ tipo: "http", status: 500, body }), false);
  assert.equal(esChoqueVigente({ tipo: "red" }), false);
  assert.equal(esChoqueVigente(null), false);
});

test("marcasParaPasar: solo lo que tiene contenido, existe en el destino y no pisa marcas", () => {
  const crudo = {
    "3": [
      { id: "3_0", status: "ok" },
      { id: "3_1", status: "pending" },
      { id: "3_2", status: "issue", detail: "Fuga leve" },
      { id: "3_3", status: "pending", fotos: ["https://f/1.jpg"] },
    ],
    "20": [{ id: "20_0", status: "na" }],
    "9": [{ id: "9_0", status: "ok" }],
  };
  const r = marcasParaPasar(crudo, { idsDestino: ["3_0", "3_1", "3_2", "3_3", "20_0"], statusDestino: { "20_0": "ok" } });
  assert.deepEqual(r.status, { "3_0": "ok", "3_2": "issue" });
  assert.deepEqual(r.detail, { "3_2": "Fuga leve" });
  assert.deepEqual(r.fotos, { "3_3": ["https://f/1.jpg"] });
  assert.equal(r.pasan, 3);
  assert.equal(r.fuera, 1);      // 9_0 no existe en el destino
  assert.equal(r.conflicto, 1);  // 20_0 ya estaba marcado en el destino
});

test("claveChoque", () => {
  assert.equal(claveChoque("abc"), "ryr_mant_choque_abc");
  assert.equal(claveChoque(""), null);
});

// ── La marca de rechazo cuenta solo en borrador (decisión de Tavo, 18/10) ──
const conRechazo = (o) => s({ rechazado: true, motivo_rechazo: "Falta la foto del filtro.", rechazado_por: "Gustavo Ramos", rechazado_at: "2026-10-14T12:00:00Z", ...o });

test("marca de rechazo: borrador → corregir con el motivo", () => {
  const r = accionAlAbrir(conRechazo({ estado: "borrador" }));
  assert.equal(r.accion, ACCION.CORREGIR);
  assert.equal(r.motivo, "Falta la foto del filtro.");
});

test("marca de rechazo: pendiente (corregido y confirmado) → por aprobar, nunca corregir", () => {
  assert.equal(accionAlAbrir(conRechazo({ estado: "pendiente" })).accion, ACCION.POR_APROBAR);
});

test("marca de rechazo: aprobado (dato viejo con la marca) → informe", () => {
  assert.equal(accionAlAbrir(conRechazo({ estado: "aprobado", aprobado: true })).accion, ACCION.APROBADO);
});

test("rechazoVigente: solo borrador con la marca en true", () => {
  assert.equal(rechazoVigente(conRechazo({ estado: "borrador" })), true);
  assert.equal(rechazoVigente(conRechazo({ estado: "pendiente" })), false);
  assert.equal(rechazoVigente(conRechazo({ estado: "aprobado" })), false);
  assert.equal(rechazoVigente(conRechazo({ rechazado: false })), false);
  assert.equal(rechazoVigente(null), false);
});

test("LIMPIAR_RECHAZO: la aprobación limpia la marca y deja el historial", () => {
  assert.deepEqual({ ...LIMPIAR_RECHAZO }, { rechazado: false });
  const aprobado = { ...conRechazo({ estado: "pendiente" }), aprobado: true, estado: "aprobado", ...LIMPIAR_RECHAZO };
  assert.equal(aprobado.rechazado, false);
  assert.equal(aprobado.motivo_rechazo, "Falta la foto del filtro.");
  assert.equal(aprobado.rechazado_por, "Gustavo Ramos");
});

test("esAjeno / accionAlAbrir por mecanico_id (feat/autor-por-sesion, 19/10): el id manda sobre el nombre", () => {
  const fila = s({ mecanico: "Fabián Araya", mecanico_id: "u-fabian" });
  assert.equal(esAjeno(fila, { id: "u-fabian", nombre: "Nombre distinto" }), false);
  assert.equal(esAjeno(fila, { id: "u-bryan", nombre: "Fabián Araya" }), true);
  assert.equal(accionAlAbrir(fila, { sesion: { id: "u-bryan", nombre: "Bryan Brenes" } }).ajeno, true);
  assert.equal(accionAlAbrir(fila, { sesion: { id: "u-fabian", nombre: "Fabian" } }).ajeno, false);
  // filas viejas sin id: por nombre, como siempre
  assert.equal(esAjeno(s({ mecanico: "Fabián Araya" }), { id: "u-x", nombre: "fabian araya" }), false);
});

test("esServicioDescartado: el 400 del trigger 'servicio_descartado'; nada más", () => {
  assert.equal(esServicioDescartado({ tipo: "http", status: 400, body: '{"code":"P0001","message":"servicio_descartado"}' }), true);
  assert.equal(esServicioDescartado({ tipo: "http", status: 409, body: "duplicate key" }), false);
  assert.equal(esServicioDescartado({ tipo: "red" }), false);
  assert.equal(esServicioDescartado(null), false);
});
