// scripts/smoke.mjs — "build OK no significa carga OK".
//
// Buildea la app, la sirve con `vite preview` y la carga en Chrome headless (puppeteer)
// en cuatro escenarios: SIN sesión (debe renderizar LoginScreen), CON sesión sembrada en
// localStorage (debe renderizar MainApp), version.json con otro build (banner) y login
// con la pestaña Correo recordada (pide correo, manda el código por email, paso 2,
// "Cambiar correo" y vuelta a Teléfono). Falla ante cualquier error de JS de la página
// (pageerror), cualquier console.error/console.warn que no sea ruido de red, cualquier
// alert() y ante un #root vacío.
//
// Nació el 13/9/2026: un `const` del render de MainApp se leía antes de su declaración
// (TDZ → "Cannot access 'df' before initialization") y la app quedaba en negro para todo
// usuario logueado. `vite build` no lo detecta (es JS válido; el orden se resuelve en
// runtime) y abrir la página sin sesión tampoco (LoginScreen no ejecuta MainApp).
//
// Red: todas las llamadas a Supabase se interceptan y se responden con mocks
// (mi_usuario → usuario de prueba; el resto → [] / {}), así que corre offline y no toca
// producción. Uso: `npm run smoke` (desde Mantenimientos/). Chrome: el que baja puppeteer;
// se puede forzar otro con PUPPETEER_EXECUTABLE_PATH.

import { build, preview, loadEnv } from 'vite';
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const env = loadEnv('production', root, 'VITE_');
const SUPA = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const REF = SUPA ? new URL(SUPA).hostname.split('.')[0] : 'local';
const UID = '00000000-0000-4000-8000-000000000001';
const USUARIO = { id: UID, username: 'smoke', nombre: 'Smoke Test', rol: 'mecanico', app: 'taller' };
// Ruido de red que NO es un error de la app (favicon 404, recursos bloqueados). Los errores
// de JS (pageerror) nunca se ignoran.
const IGNORAR = [/Failed to load resource/i];
const TEXTO_LOGIN = 'Ingresá tu número';
const TEXTO_LOGIN_CORREO = 'Ingresá tu correo';
const CLAVE_CANAL_LOGIN = 'ryr_login_canal';   // = authOtp.CLAVE_CANAL_LOGIN
const EMAIL_PRUEBA = 'Smoke.Test@RamosyRamosCR.com';

// Recetas e ítems como en la base (14/10, feat/recetas-astra): mant_recetas + mant_items
// son la ÚNICA fuente; sin ellas la app falla cerrado. Recortadas a lo que usan los
// escenarios.
const T_GLOW_TEST = 'Prueba de las bujías de precalentamiento con XENTRY, sin desmontar';
const T_GLOW_0 = 'Extracción de bujías de precalentamiento';
const T_4M_INSP = 'Inspección de fugas en diferenciales delantero y trasero y caja de transferencia';
const T_4M_DIFF = 'Drenaje del aceite del diferencial trasero';
const RECETAS_SMOKE = [
  { codigo: 'A',   serie: 'A',  descripcion: 'Inspección menor + aceite', items: ['1', '3'], orden: 1, color: '#C8A96E', fuel_lock: null },
  { codigo: 'A3',  serie: 'A',  descripcion: 'A + filtro aire + combustible/bujías', items: ['1', '3', '8', 'FUEL'], orden: 5, color: '#B88A00', fuel_lock: null },
  { codigo: 'B',   serie: 'B',  descripcion: 'Inspección mayor + aceite + filtro habitáculo', items: ['2', '3'], orden: 1, color: '#7EB8F7', fuel_lock: null },
  { codigo: 'BD',  serie: 'B',  descripcion: 'B + filtro aire + combustible + ATF', items: ['2', '3', '8', '11', '20', '19'], orden: 13, color: '#4878B8', fuel_lock: 'diesel' },
  { codigo: 'BF',  serie: 'B',  descripcion: 'B + frenos + filtro aire + bujías + ATF', items: ['2', '3', '4', '8', '12', '20'], orden: 15, color: '#B88A00', fuel_lock: 'gasolina' },
  { codigo: 'RC',  serie: 'C',  descripcion: 'Revisión de Compra', items: ['RC'], orden: 1, color: '#C9CDD2', fuel_lock: null },
  { codigo: 'RG',  serie: 'C',  descripcion: 'Revisión General', items: ['RG_PTS'], orden: 2, color: '#C9CDD2', fuel_lock: null },
  { codigo: 'AEV', serie: 'EV', descripcion: 'Servicio A Eléctrico', items: ['EV_A'], orden: 1, color: '#4ade80', fuel_lock: 'electrico' },
];
const ITEMS_SMOKE_BASE = [
  { clave: '1', label: 'Inspección A (menor)', icon: '🔍', orden: 1, out_of_assyst: false, tasks: ['Inspección menor del vehículo completo'] },
  { clave: '2', label: 'Inspección B (mayor)', icon: '🔍', orden: 2, out_of_assyst: false, tasks: ['Inspección mayor del vehículo completo'] },
  { clave: '3', label: 'Aceite y filtro de motor', icon: '🛢️', orden: 3, out_of_assyst: false, tasks: ['Cambio de aceite y filtro de motor'] },
  { clave: '4', label: 'Líquido de frenos', icon: '🛑', orden: 4, out_of_assyst: false, tasks: ['Cambio del líquido de frenos'] },
  { clave: '8', label: 'Filtro de aire del motor', icon: '🌀', orden: 5, out_of_assyst: false, tasks: ['Instalación del filtro de aire nuevo'] },
  { clave: '11', label: 'Filtro de combustible — Diesel', icon: '⛽', orden: 7, out_of_assyst: false, tasks: ['Instalación del filtro de combustible nuevo'] },
  { clave: '12', label: 'Bujías de encendido — gasolina', icon: '⚡', orden: 8, out_of_assyst: false, tasks: ['Instalación de bujías nuevas con torque especificado'] },
  { clave: '19', label: 'Inspeccion de DPF', icon: '💨', orden: 11, out_of_assyst: false, tasks: ['Inspección del estado del filtro de partículas (DPF) con escáner'] },
  { clave: '20', label: 'Caja automática ATF', icon: '🔧', orden: 11, out_of_assyst: false, tasks: ['Carga de aceite ATF — especificación MB aprobada'] },
  { clave: 'GLOW', label: 'Bujías de precalentamiento — Solo diesel', icon: '🌡️', orden: 13, out_of_assyst: true, tasks: ['~' + T_GLOW_0, 'Verificación con Star Diagnosis (test de precalentamiento)'] },
  { clave: 'GLOW_TEST', label: 'Prueba de bujías de precalentamiento', icon: '🌡️', orden: 13, out_of_assyst: true, tasks: [T_GLOW_TEST] },
  { clave: '4M_DIFF', label: 'Diferencial trasero 4MATIC', icon: '🔩', orden: 14, out_of_assyst: true, tasks: [T_4M_DIFF] },
  { clave: '4M_INSP', label: 'Inspección de diferenciales 4MATIC', icon: '🔩', orden: 14, out_of_assyst: true, tasks: [T_4M_INSP] },
  { clave: '4M_FDIFF', label: 'Diferencial delantero 4MATIC', icon: '🔩', orden: 15, out_of_assyst: true, tasks: ['Drenaje del aceite del diferencial delantero si aplica'] },
  { clave: 'EV_A', label: 'Inspección A Eléctrico (menor EV)', icon: '⚡', orden: 30, out_of_assyst: false, tasks: ['Cambio de filtro de habitáculo'] },
];
// Responde mant_recetas / mant_items; null si la URL no es de recetas.
function respuestaRecetas(u, json, { fallar = false } = {}) {
  if (u.includes('/rest/v1/mant_recetas')) return fallar ? json({ message: 'caida' }, 503) : json(RECETAS_SMOKE);
  if (u.includes('/rest/v1/mant_items')) return fallar ? json({ message: 'caida' }, 503) : json(ITEMS_SMOKE);
  return null;
}

function sembrarSesion() {
  return (REF, UID, USUARIO) => {
    const exp = Math.floor(Date.now() / 1000) + 86400;
    localStorage.setItem(`sb-${REF}-auth-token`, JSON.stringify({
      access_token: 'smoke.fake.jwt', refresh_token: 'smoke', token_type: 'bearer',
      expires_in: 86400, expires_at: exp,
      user: { id: UID, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    }));
    localStorage.setItem('ryr_session', JSON.stringify(USUARIO));
  };
}

async function escenario(browser, baseUrl, { nombre, conSesion, versionNueva = false, pestanaCorreo = false }) {
  // Contexto aislado por escenario: el localStorage sembrado en uno no debe filtrarse al siguiente.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errores = [];
  const authBodies = {};              // cuerpo del último POST a /auth/v1/otp y /auth/v1/verify
  let publicarVersionNueva = false;   // se prende DESPUÉS de cargar: /version.json pasa a devolver otro build
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}\n    ${String(e.stack || '').split('\n').slice(1, 3).join('\n    ')}`));
  page.on('console', (m) => {
    if (!['error', 'warning'].includes(m.type())) return;
    const txt = m.text();
    if (IGNORAR.some((re) => re.test(txt))) return;
    errores.push(`console.${m.type()}: ${txt.slice(0, 300)}`);
  });
  page.on('dialog', (d) => { errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });

  // Los mocks son cross-origin para la página: llevan CORS abierto y responden el preflight,
  // si no el navegador los bloquea y el error de CORS se confunde con un error de la app.
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  const json = (body, status = 200) => ({ status, contentType: 'application/json', headers: CORS, body });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (publicarVersionNueva && u.startsWith(baseUrl + 'version.json')) {
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ build: 'smoke-build-nuevo', at: new Date().toISOString() }) });
    }
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      const auth = u.match(/\/auth\/v1\/(otp|verify)\b/);
      if (auth) { try { authBodies[auth[1]] = JSON.parse(req.postData() || '{}'); } catch { authBodies[auth[1]] = {}; } }
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(JSON.stringify(USUARIO)));
      const rr = respuestaRecetas(u, (b, st) => json(JSON.stringify(b), st));
      if (rr) return req.respond(rr);
      if (u.includes('/rest/v1/')) return req.respond(json('[]'));
      return req.respond(json('{}'));
    }
    return req.respond({ status: 204, headers: CORS, body: '' }); // fuentes u otros terceros: nada sale a internet
  });

  if (conSesion) await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, USUARIO);
  if (pestanaCorreo) {
    await page.evaluateOnNewDocument((k) => { if (!sessionStorage.getItem('smoke_sembrado')) { localStorage.setItem(k, 'email'); sessionStorage.setItem('smoke_sembrado', '1'); } }, CLAVE_CANAL_LOGIN);
  }

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    errores.push(`goto: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 1500));

  const estado = await page.evaluate(() => ({
    rootLen: document.getElementById('root')?.innerHTML.length ?? -1,
    texto: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200),
  })).catch((e) => ({ rootLen: -1, texto: `evaluate falló: ${e.message}` }));

  if (estado.rootLen <= 0) errores.push(`#root vacío (${estado.rootLen}): la app no renderizó`);
  const textoLogin = pestanaCorreo ? TEXTO_LOGIN_CORREO : TEXTO_LOGIN;
  const muestraLogin = estado.texto.includes(textoLogin);
  if (conSesion && muestraLogin) errores.push('con sesión sembrada sigue en LoginScreen (mi_usuario mock no aplicó o la sesión se descartó)');
  if (!conSesion && !muestraLogin) errores.push(`sin sesión no muestra LoginScreen${pestanaCorreo ? ' en la pestaña Correo' : ''}: "${estado.texto.slice(0, 120)}"`);

  // Login por correo (segundo canal): la pestaña recordada en localStorage abre en Correo;
  // se tipea un correo con mayúsculas y espacios, el código se pide por email con
  // shouldCreateUser:false (el mock de /auth/v1/otp responde {} = enviado), el paso 2
  // muestra el correo normalizado y "Cambiar correo"; volver a Teléfono guarda 'sms'.
  if (pestanaCorreo && muestraLogin) {
    const esperarTexto = (t) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: 5000 }, t).then(() => true, () => false);
    try {
      await page.type('input[type=email]', `  ${EMAIL_PRUEBA} `);
      await page.click('form button[type=submit]');
      if (!(await esperarTexto('Te enviamos un correo a'))) errores.push('correo: tras "ENVIARME CÓDIGO POR CORREO" no pasó al paso 2');
      const otp = authBodies.otp || {};
      if (otp.email !== EMAIL_PRUEBA.toLowerCase()) errores.push(`correo: /auth/v1/otp no recibió el correo normalizado (${JSON.stringify(otp.email)})`);
      if (otp.create_user !== false) errores.push(`correo: /auth/v1/otp sin create_user:false (${JSON.stringify(otp.create_user)})`);
      if (otp.phone) errores.push('correo: /auth/v1/otp mandó phone en la pestaña Correo');
      const texto2 = await page.evaluate(() => document.body.innerText);
      if (!texto2.includes(EMAIL_PRUEBA.toLowerCase())) errores.push('correo: el paso 2 no muestra el correo normalizado');
      if (!texto2.includes('Cambiar correo')) errores.push('correo: el paso 2 no ofrece "Cambiar correo"');
      if (!texto2.includes('Reenviar código (')) errores.push('correo: el paso 2 no arrancó el cooldown de reenvío');
      await page.type('input[autocomplete=one-time-code]', '123456');
      await page.click('form button[type=submit]');
      await new Promise((r) => setTimeout(r, 1500));
      const ver = authBodies.verify || {};
      if (ver.type !== 'email' || ver.email !== EMAIL_PRUEBA.toLowerCase() || ver.token !== '123456') errores.push(`correo: /auth/v1/verify con cuerpo inesperado ${JSON.stringify({ type: ver.type, email: ver.email, token: ver.token })}`);
      // Con el verify y mi_usuario mockeados entra a MainApp; se recarga la página (la
      // sesión Auth mock no persiste) para volver al login y probar la vuelta a Teléfono.
      await page.evaluate((k) => { localStorage.removeItem('ryr_session'); return localStorage.getItem(k); }, CLAVE_CANAL_LOGIN);
      await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
      if (!(await esperarTexto(TEXTO_LOGIN_CORREO))) errores.push('correo: al recargar no recordó la pestaña Correo');
      const [tabTel] = await page.$$('button[role=tab]');
      await tabTel.click();
      if (!(await esperarTexto(TEXTO_LOGIN))) errores.push('correo: la pestaña Teléfono no muestra el input de número');
      const guardado = await page.evaluate((k) => localStorage.getItem(k), CLAVE_CANAL_LOGIN);
      if (guardado !== 'sms') errores.push(`correo: al elegir Teléfono no se guardó 'sms' (${guardado})`);
    } catch (e) {
      errores.push(`correo: el recorrido falló: ${e.message}`);
    }
  }

  // Staleness de PWA (#2977): con la página ya cargada, /version.json pasa a publicar otro
  // build; al volver de "oculta" (visibilitychange) el detector de lib/version.js tiene que
  // mostrar el banner "Hay una versión nueva". Cubre: id embebido vs publicado, el parseo de
  // la respuesta, el listener de visibilidad y el montaje del banner fuera del Router.
  if (versionNueva) {
    publicarVersionNueva = true;
    const conBanner = await page.evaluate(async () => {
      const hidden = (v) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      hidden(true); hidden(false);
      for (let i = 0; i < 40; i++) {           // hasta 4 s: fetch + setState + render
        if (document.body.innerText.includes('Hay una versión nueva')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    }).catch((e) => { errores.push(`evaluate banner falló: ${e.message}`); return false; });
    if (!conBanner) errores.push('version.json publicó otro build y tras visibilitychange NO apareció el banner "Hay una versión nueva"');
  }

  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (#root ${estado.rootLen} chars)`);
  for (const e of errores) console.log(`  - ${e}`);
  return ok;
}

// Aceite de un servicio abierto por ?servicio= (feat/aceite-desde-resolver, 5/10):
// la fila del mock se abre en la app real y el aceite sale de la Edge Function
// resolver-aceite SIMULADA (con la orden si la fila tiene orden_id; si no, por
// el vehículo de la placa). El autosave escribe a los 2 s (las revisiones vienen
// en null, así que la huella difiere) y se mira el último PATCH.
const SVC_ID = '00000000-0000-4000-8000-0000000000a1';
const ORDEN_ID = '00000000-0000-4000-8000-0000000000c1';
const VEH_ID = '00000000-0000-4000-8000-0000000000d1';
const FILA_SELECTOR = { id: '00000000-0000-4000-8000-0000000000b1', clase: 'C', categoria: 'C-Class (W204) 2007-2014', nombre: 'C 200 (M271 1.8T)', combustible: 'gasolina', orden: 1 };
const RESP = {
  automatico: { vehiculo_id: VEH_ID, build: 'smoke', avisos: [], atf: null,
    aceite: { estado: 'auto', litros: 8, spec: 'MB 229.5', viscosidad: '5W40', origen: { tipo: 'catalogo', etiqueta: 'Por tarjeta de datos del EPC (M272.961)' }, motivo: null, opciones: [], fuentes: [] } },
  opciones: { vehiculo_id: VEH_ID, build: 'smoke', avisos: [], atf: null,
    aceite: { estado: 'pendiente', litros: null, spec: 'MB 229.52', viscosidad: '5W30', origen: { tipo: null, etiqueta: null }, motivo: 'El catálogo da 2 cantidades.', fuentes: [],
      opciones: [
        { litros: 6, spec: null, etiqueta: 'Excepto código M005: 4MATIC: 6 L', origen: 'catalogo' },
        { litros: 6.5, spec: null, etiqueta: 'Con código M005: 4MATIC: 6.5 L', origen: 'catalogo' },
      ] } },
  sinDato: { vehiculo_id: VEH_ID, build: 'smoke', avisos: [], atf: null,
    aceite: { estado: 'pendiente', litros: null, spec: null, viscosidad: null, origen: { tipo: null, etiqueta: null }, motivo: 'Este vehículo no está enlazado al catálogo.', fuentes: [],
      opciones: [{ litros: 7.3, spec: null, etiqueta: 'Cantidad histórica del vehículo, sin verificar: 7.3 L', origen: 'historico' }] } },
  otroValor: { vehiculo_id: VEH_ID, build: 'smoke', avisos: [], atf: null,
    aceite: { estado: 'auto', litros: 6, spec: 'MB 229.5', viscosidad: '5W40', origen: { tipo: 'catalogo', etiqueta: null }, motivo: null, opciones: [], fuentes: [] } },
};
// La lámina técnica (feat/lamina-carroceria): imagenes.lamina de resolver-aceite. El host
// es inventado: el escenario responde la imagen (o un 404) por su cuenta.
const LAMINA_URL = 'https://lamina.smoke/W204/lamina.webp?v=1';
const LAMINA_ROTA = 'https://lamina.smoke/W204/rota.webp?v=1';
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
RESP.conLamina = { ...RESP.automatico, imagenes: { foto: null, lamina: LAMINA_URL, mascara: null } };
RESP.laminaRota = { ...RESP.automatico, imagenes: { foto: null, lamina: LAMINA_ROTA, mascara: null } };
const JEFE = { ...USUARIO, rol: 'jefe' };
async function escenarioAceite(browser, baseUrl, { nombre, fila, resolver, elegir = null, esperado, etiqueta = false, origen = null, textos = [], ausentes = [], presentes = [], sinPatch = false, sinResolver = false, usuario = USUARIO, cuerpo = null, lamina = 'ausente', tema = null }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errores = [];
  const patches = [];
  const llamadas = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (!['error', 'warning'].includes(m.type())) return;
    const txt = m.text();
    if (IGNORAR.some((re) => re.test(txt)) || /keeping defaults/.test(txt)) return;
    errores.push(`console.${m.type()}: ${txt.slice(0, 300)}`);
  });
  page.on('dialog', (d) => { errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  const json = (body, status = 200) => ({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  const row = { id: SVC_ID, estado: 'borrador', aprobado: false, servicio_codigo: 'A', placa: 'SMK001', mecanico: usuario.nombre, revisiones: null, observaciones: '', fotos: {}, created_at: new Date().toISOString(), ...fila };
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      if (u.includes('/functions/v1/resolver-aceite')) {
        llamadas.push({ body: JSON.parse(req.postData() || '{}'), auth: req.headers()['authorization'] || '' });
        if (resolver === 'caida') return req.respond(json({ error: 'fallo_lectura', build: 'smoke' }, 503));
        return req.respond(json(RESP[resolver]));
      }
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(usuario));
      if (u.includes('/rest/v1/vehiculos_modelos')) return req.respond(json([FILA_SELECTOR]));
      { const rr = respuestaRecetas(u, json); if (rr) return req.respond(rr); }
      if (u.includes('/rest/v1/vehiculos?patente=eq.SMK001')) return req.respond(json([{ id: VEH_ID }]));
      if (u.includes(`/rest/v1/servicios?id=eq.${SVC_ID}`)) {
        if (req.method() === 'PATCH') {
          const body = JSON.parse(req.postData() || '{}');
          patches.push(body);
          return req.respond(json([{ ...row, ...body }]));
        }
        return req.respond(json([row]));
      }
      if (u.includes('/rest/v1/')) return req.respond(json([]));
      return req.respond(json({}));
    }
    if (u === LAMINA_URL) return req.respond({ status: 200, contentType: 'image/png', headers: CORS, body: PNG_1X1 });
    if (u === LAMINA_ROTA) return req.respond({ status: 404, headers: CORS, body: '' });
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, usuario);
  // tema 'claro': la app arranca con el tema claro guardado (el restore de main.jsx).
  if (tema === 'claro') await page.evaluateOnNewDocument(() => { try { localStorage.setItem('theme', 'light'); } catch { /* sin storage */ } });
  try {
    await page.goto(`${baseUrl}?servicio=${SVC_ID}`, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) { errores.push(`goto: ${e.message}`); }
  if (elegir != null) {
    try {
      await page.waitForSelector('select[data-elegir-aceite]', { timeout: 6000 });
      const opciones = await page.$$eval('select[data-elegir-aceite] option', (os) => os.map((o) => o.textContent));
      for (const t of textos) if (!opciones.some((o) => o.includes(t))) errores.push(`el selector no ofrece "${t}" (${JSON.stringify(opciones)})`);
      await page.select('select[data-elegir-aceite]', String(elegir));
    } catch (e) { errores.push(`no apareció el selector de cantidad: ${e.message}`); }
  }
  const objetivo = (b) => b.aceite_litros === esperado.litros && b.aceite_spec === esperado.spec;
  if (sinPatch) await new Promise((r) => setTimeout(r, 4000));
  else for (let i = 0; i < 70 && !patches.some(objetivo); i++) await new Promise((r) => setTimeout(r, 100));
  const texto = await page.evaluate(() => document.body.innerText).catch(() => '');
  const p = patches[patches.length - 1] || {};
  if (sinPatch) {
    if (patches.length) errores.push(`hubo PATCH a servicios y no debía (${JSON.stringify(patches.map((x) => x.aceite_litros))})`);
  } else {
    if (!patches.length) errores.push('el autosave no escribió (no hubo PATCH a servicios)');
    if (p.aceite_litros !== esperado.litros) errores.push(`último PATCH aceite_litros = ${JSON.stringify(p.aceite_litros)}, esperado ${esperado.litros}`);
    if (p.aceite_spec !== esperado.spec) errores.push(`último PATCH aceite_spec = ${JSON.stringify(p.aceite_spec)}, esperado ${JSON.stringify(esperado.spec)}`);
  }
  if (sinResolver && llamadas.length) errores.push(`llamó a resolver-aceite y no debía (${llamadas.length})`);
  if (!sinResolver && !llamadas.length) errores.push('no llamó a resolver-aceite');
  if (cuerpo && llamadas.length && JSON.stringify(llamadas[0].body) !== JSON.stringify(cuerpo)) errores.push(`resolver-aceite recibió ${JSON.stringify(llamadas[0].body)}, esperado ${JSON.stringify(cuerpo)}`);
  if (llamadas.length && !/Bearer smoke\.fake\.jwt/.test(llamadas[0].auth)) errores.push('resolver-aceite no recibió el JWT de la sesión');
  if (esperado.litros !== null && !texto.includes(`${esperado.litros} L`)) errores.push(`la pantalla no muestra "${esperado.litros} L"`);
  if (etiqueta !== texto.includes('guardado en el servicio')) errores.push(etiqueta ? 'falta la etiqueta "guardado en el servicio"' : 'muestra la etiqueta "guardado en el servicio" sin motivo');
  if (origen && !texto.includes(origen)) errores.push(`no muestra el origen "${origen}" junto a la cantidad`);
  for (const t of presentes) if (!texto.includes(t)) errores.push(`la pantalla no muestra "${t}"`);
  for (const t of ausentes) if (texto.includes(t)) errores.push(`la pantalla muestra "${t}" y no debía`);
  // La lámina: 'visible' (se dibuja con su URL, sobre un fondo, y sigue al tema con él),
  // 'oculta' (la URL falló: el bloque no ocupa lugar) o 'ausente' (sin lámina, sin bloque).
  const lam = await page.evaluate(() => {
    const c = document.querySelector('[data-lamina-carroceria]');
    if (!c) return null;
    const i = c.querySelector('img');
    const cs = getComputedStyle(c);
    return { src: i?.getAttribute('src') ?? null, alto: c.getBoundingClientRect().height, display: cs.display, fondo: cs.backgroundColor, temaFijo: c.hasAttribute('data-tema-fijo'), cargada: !!(i && i.complete && i.naturalWidth > 0) };
  }).catch(() => null);
  if (lamina === 'ausente' && lam) errores.push(`dibuja la lámina y no debía (${JSON.stringify(lam)})`);
  if (lamina === 'visible') {
    if (!lam) errores.push('no dibuja la lámina');
    else {
      if (lam.src !== LAMINA_URL) errores.push(`la lámina apunta a ${lam.src}`);
      if (!lam.cargada || lam.display === 'none' || !(lam.alto > 0)) errores.push(`la lámina no se ve (${JSON.stringify(lam)})`);
      if (!lam.fondo || lam.fondo === 'rgba(0, 0, 0, 0)') errores.push('la lámina no tiene fondo propio');
      if (!lam.temaFijo) errores.push('la lámina no lleva data-tema-fijo');
    }
  }
  if (lamina === 'oculta' && (!lam || lam.display !== 'none')) errores.push(`la lámina con la URL rota no se ocultó (${JSON.stringify(lam)})`);
  // El tema claro invierte #root y re-invierte cada img para que se vea normal. El bloque
  // de la lámina (data-tema-fijo) se ve IGUAL en los dos temas: se re-invierte ENTERO por
  // CSS y su imagen no lleva filtro propio (si lo llevara, se invertiría tres veces).
  // Se mira al arrancar en claro (main.jsx, 300 ms) y después de alternar dos veces (App.jsx).
  if (tema === 'claro') {
    const filtros = () => page.evaluate(() => ({
      root: document.getElementById('root').style.filter || '',
      bloque: getComputedStyle(document.querySelector('[data-lamina-carroceria]')).filter,
      lamina: getComputedStyle(document.querySelector('[data-lamina-carroceria] img')).filter,
      logo: getComputedStyle(document.querySelector('[data-cabecera] img')).filter,
    })).catch(() => null);
    await new Promise((r) => setTimeout(r, 600));
    const mirar = (f, cuando) => {
      if (!f) return errores.push(`tema claro (${cuando}): no se pudo medir`);
      if (!/invert/.test(f.root)) errores.push(`tema claro (${cuando}): #root no está invertido`);
      if (!/invert/.test(f.bloque)) errores.push(`tema claro (${cuando}): el bloque de la lámina no se re-invierte (${f.bloque})`);
      if (f.lamina !== 'none') errores.push(`tema claro (${cuando}): la imagen de la lámina lleva filtro propio (${f.lamina}) y queda invertida`);
      if (!/invert/.test(f.logo)) errores.push(`tema claro (${cuando}): el logo dejó de re-invertirse (${f.logo})`);
    };
    mirar(await filtros(), 'al arrancar');
    await page.click('[data-tema-toggle]').catch(() => {});
    const oscuro = await filtros();
    if (oscuro && oscuro.bloque !== 'none') errores.push(`tema oscuro: el bloque de la lámina quedó con filtro (${oscuro.bloque})`);
    await page.click('[data-tema-toggle]').catch(() => {});
    mirar(await filtros(), 'después de alternar dos veces');
  }
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (PATCH: ${sinPatch ? 'ninguno' : JSON.stringify({ aceite_litros: p.aceite_litros, aceite_spec: p.aceite_spec })} · resolver: ${llamadas.length})`);
  for (const e of errores) console.log(`  - ${e}`);
  return ok;
}

// Serie C (RC / RG) en un vehículo ELÉCTRICO (feat/revisiones-c-ev, 7/10): decisión del
// dueño: la revisión de compra y la general valen para cualquier combustible. Recorre el
// flujo entero como un mecánico: paso 1 elige un modelo eléctrico del selector (el
// combustible queda en "electrico"), paso 2 ve el bloque REVISIONES y elige RC/RG (y el
// código NO se deselecciona por el efecto combustible ↔ serie EV), paso 3 marca todas
// las tareas en OK, da el dictamen, firma y guarda: el POST a servicios tiene que traer
// el código, combustible "electrico", todas las tareas de la receta en ok, el dictamen,
// y nada de aceite. Cualquier pageerror, console.error o alert() lo hace fallar.
const FILA_EV = { id: '00000000-0000-4000-8000-0000000000b2', clase: 'EQB', categoria: 'EQB (X243) 2021-presente', nombre: 'EQB 300 4MATIC (eléctrico)', combustible: 'electrico', orden: 1 };
const RECETAS_C = [
  { codigo: 'A',  serie: 'A',  descripcion: 'Inspección menor + aceite', items: ['1', '3'], orden: 1, color: '#C8A96E', fuel_lock: null },
  { codigo: 'RC', serie: 'C',  descripcion: 'Revisión de Compra', items: ['RC'], orden: 1, color: '#C9CDD2', fuel_lock: null },
  { codigo: 'RG', serie: 'C',  descripcion: 'Revisión General', items: ['RG_PTS'], orden: 2, color: '#C9CDD2', fuel_lock: null },
  { codigo: 'AEV', serie: 'EV', descripcion: 'Servicio A Eléctrico', items: ['EV_A'], orden: 1, color: '#4ade80', fuel_lock: 'electrico' },
];
const TAREAS_RG = [
  'Carrocería y pintura: indicios de choques, repintado o masilla', 'Chasis y puntos de fijación: deformaciones o soldaduras',
  'Interior y tapicería: estado general', 'Inspección visual del motor — fugas, correas, mangueras', 'Verificación de todos los niveles de fluidos',
  'Inspección de pastillas y discos de freno (todos los ejes)', 'Revisión del freno de estacionamiento', 'Inspección de suspensión y dirección',
  'Revisión de soportes de motor y transmisión', 'Inspección de sistema de escape', 'Inspección de faja de accesorios',
  'Inspección de presión de llantas (incluida llanta de repuesto)', 'Inspección visual de llantas — desgaste y daños',
  'Estado del filtro de habitáculo / carbón activo', 'Revisión de luces, alertas y sensores', 'Revisión de escobillas limpiaparabrisas y lavadores',
  'Prueba de batería con analizador (estado de salud y carga)', 'Escaneo completo de fallas (Star Diagnosis)', 'Prueba de ruta: caja, dirección, frenado y ruidos',
];
const TAREAS_RC = [
  'Carrocería y pintura: indicios de choques, repintado o masilla', 'Chasis y puntos de fijación: deformaciones o soldaduras',
  'Interior y tapicería: desgaste coherente con el kilometraje', 'Kilometraje: coherencia entre odómetro, desgaste y registros',
  'Inspección visual del motor — fugas, correas, mangueras', 'Verificación de todos los niveles de fluidos', 'Inspección de pastillas y discos de freno (todos los ejes)',
  'Revisión del freno de estacionamiento', 'Inspección de suspensión y dirección', 'Revisión de soportes de motor y transmisión', 'Inspección de sistema de escape',
  'Inspección de faja de accesorios', 'Inspección de presión de llantas (incluida llanta de repuesto)', 'Inspección visual de llantas — desgaste y daños',
  'Llantas: fecha de fabricación (DOT) y antigüedad', 'Estado del filtro de habitáculo / carbón activo', 'Revisión de luces, alertas y sensores',
  'Revisión de escobillas limpiaparabrisas y lavadores', 'Prueba de batería con analizador (estado de salud y carga)', 'Escaneo completo de fallas (Star Diagnosis)',
  'Prueba de ruta: caja, dirección, frenado y ruidos',
];
// feat/recetas-astra (decisión 8): en un ELÉCTRICO, RC usa RC_EV y RG usa RG_EV (sin
// escape ni faja, con alta tensión, puerto de carga y refrigeración). Textos de la base.
const EV_HV = 'Inspección visual del compartimento delantero y de los componentes de alta tensión (cables naranja, conectores)';
const EV_SOP = 'Revisión de soportes del motor eléctrico / eATS';
const EV_MAS = ['Puerto y cable de carga: estado y prueba de carga', 'Lectura del estado de la batería HV con XENTRY (anotar valor y método)', 'Circuitos de refrigeración de batería y motor eléctrico: nivel y fugas'];
const aEV = (lista) => lista
  .filter((t) => !/sistema de escape|faja de accesorios/.test(t))
  .map((t) => t === 'Inspección visual del motor — fugas, correas, mangueras' ? EV_HV : t === 'Revisión de soportes de motor y transmisión' ? EV_SOP : t)
  .concat(EV_MAS);
const TAREAS_RC_EV = aEV(TAREAS_RC);
const TAREAS_RG_EV = aEV(TAREAS_RG);
const ITEMS_C = [
  { clave: '1', label: 'Inspección A (menor)', icon: '🔍', orden: 1, out_of_assyst: false, tasks: ['Inspección menor'] },
  { clave: '3', label: 'Aceite y filtro de motor', icon: '🛢️', orden: 3, out_of_assyst: false, tasks: ['Cambio de aceite y filtro'] },
  { clave: 'RC', label: 'Revisión de compra', icon: '📋', orden: 90, out_of_assyst: true, tasks: TAREAS_RC },
  { clave: 'RG_PTS', label: 'Revisión general', icon: '📋', orden: 91, out_of_assyst: true, tasks: TAREAS_RG },
  { clave: 'RC_EV', label: 'Revisión de compra — eléctrico', icon: '🔍', orden: 100, out_of_assyst: true, tasks: TAREAS_RC_EV },
  { clave: 'RG_EV', label: 'Revisión general — eléctrico', icon: '🩺', orden: 98, out_of_assyst: true, tasks: TAREAS_RG_EV },
  { clave: 'EV_A', label: 'Inspección A Eléctrico (menor EV)', icon: '⚡', orden: 95, out_of_assyst: false, tasks: ['Cambio de filtro de habitáculo'] },
];
const ITEMS_SMOKE = [...ITEMS_SMOKE_BASE, ...ITEMS_C.filter((i) => !ITEMS_SMOKE_BASE.some((b) => b.clave === i.clave))];

async function escenarioRevisionEV(browser, baseUrl, { nombre, codigo, tareas, usuario = USUARIO }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errores = [];
  const posts = [];
  const pushes = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (!['error', 'warning'].includes(m.type())) return;
    const txt = m.text();
    if (IGNORAR.some((re) => re.test(txt)) || /keeping defaults/.test(txt)) return;
    errores.push(`console.${m.type()}: ${txt.slice(0, 300)}`);
  });
  page.on('dialog', (d) => { errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  const json = (body, status = 200) => ({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(usuario));
      if (u.includes('/rest/v1/vehiculos_modelos')) return req.respond(json([FILA_SELECTOR, FILA_EV]));
      if (u.includes('/rest/v1/mant_recetas')) return req.respond(json(RECETAS_C));
      if (u.includes('/rest/v1/mant_items')) return req.respond(json(ITEMS_C));
      if (u.includes('/rest/v1/servicios') && req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        posts.push(body);
        return req.respond(json([{ id: '00000000-0000-4000-8000-0000000000a9', ...body }], 201));
      }
      if (u.includes('/functions/v1/resolver-aceite')) return req.respond(json(RESP.sinDato));
      // feat/push-aprobadores-admin (16/10): el aviso "pendiente de aprobación" se graba.
      if (u.includes('/functions/v1/send-push')) {
        try { pushes.push(JSON.parse(req.postData() || '{}')); } catch { /* */ }
        return req.respond(json({ sent: 1 }));
      }
      if (u.includes('/rest/v1/')) return req.respond(json([]));
      return req.respond(json({}));
    }
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, usuario);
  const clicTexto = async (re, desc) => {
    const ok = await page.evaluate((src, flags) => {
      const r = new RegExp(src, flags);
      const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled);
      if (!b) return false; b.click(); return true;
    }, re.source, re.flags);
    if (!ok) errores.push(`no encontré el botón ${desc}`);
    await new Promise((r) => setTimeout(r, 350));
    return ok;
  };
  // Tema B (18/10): los botones con texto pasaron a frase y los principales llevan data-*.
  const clicSel = async (sel, desc) => {
    const ok = await page.evaluate((q) => { const b = document.querySelector(q); if (!b || b.disabled) return false; b.click(); return true; }, sel);
    if (!ok) errores.push(`no encontré el botón ${desc}`);
    await new Promise((r) => setTimeout(r, 350));
    return ok;
  };
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    // Paso 1: modelo eléctrico del selector
    await page.waitForSelector('[data-buscar-modelo]', { timeout: 8000 });
    await page.type('[data-buscar-modelo]', 'EQB');
    await new Promise((r) => setTimeout(r, 400));
    const eligio = await page.evaluate(() => {
      const d = [...document.querySelectorAll('[data-modelo-opcion]')].find((x) => /EQB 300/.test(x.textContent));
      if (!d) return false; d.click(); return true;
    });
    if (!eligio) errores.push('el selector no ofreció el EQB 300 eléctrico');
    await new Promise((r) => setTimeout(r, 300));
    const t1 = await page.evaluate(() => document.body.innerText);
    const elegido = await page.evaluate(() => document.querySelector('[data-modelo-elegido]')?.innerText || '');
    if (!/EQB/.test(elegido)) errores.push('el paso 1 no confirmó el modelo eléctrico (texto: ' + JSON.stringify(elegido.slice(0, 60) || t1.slice(0, 60)) + ')');
    await clicSel('[data-continuar-paso1]', 'Continuar al tipo de servicio');
    // Paso 2: el bloque REVISIONES está, se elige el código y no se deselecciona
    const t2 = await page.evaluate(() => document.body.innerText);
    if (!/PASO 2\s*Tipo de servicio/i.test(t2)) errores.push('no llegó al paso 2');
    if (!/REVISIONES/.test(t2)) errores.push('el paso 2 de un eléctrico NO muestra el bloque REVISIONES');
    if (!(await page.$('button[data-combustible="electrico"]'))) errores.push('el paso 2 no muestra el selector de combustible');
    if (!/c[óo]digo de servicio\s*\*/i.test(t2) || /ASSYST/.test(t2)) errores.push('el paso 2 no está en modo eléctrico (debería decir Código de servicio, sin ASSYST)');
    await clicTexto(new RegExp(`^${codigo}$`), codigo);
    await new Promise((r) => setTimeout(r, 600));
    const seleccionado = await page.evaluate((c) => {
      const b = [...document.querySelectorAll('button.svc-btn')].find((x) => x.textContent.trim() === c);
      return b ? b.getAttribute('aria-pressed') === 'true' : null;
    }, codigo);
    if (seleccionado !== true) errores.push(`${codigo} no quedó seleccionado en un eléctrico (aria-pressed: ${seleccionado})`);
    const iniciar = await page.evaluate(() => { const b = document.querySelector('[data-iniciar-inspeccion]'); return b ? !b.disabled : null; });
    if (iniciar !== true) errores.push(`"Iniciar inspección" no está habilitado (${iniciar})`);
    await clicSel('[data-iniciar-inspeccion]', 'Iniciar inspección');
    // Paso 3: todas las tareas de la receta, en OK
    const nOk = await page.evaluate(() => document.querySelectorAll('[data-marcar="ok"] input').length);
    if (nOk !== tareas.length) errores.push(`el checklist tiene ${nOk} tareas, esperaba ${tareas.length}`);
    for (let i = 0; i < nOk; i++) {
      await page.evaluate((i) => { document.querySelectorAll('[data-marcar="ok"] input')[i].click(); }, i);
      await new Promise((r) => setTimeout(r, 60));
    }
    const t3 = await page.evaluate(() => document.body.innerText);
    for (const t of tareas) if (!t3.includes(t)) errores.push(`falta la tarea "${t}"`);
    for (const t of ['Inspección de sistema de escape', 'Inspección de faja de accesorios']) if (t3.includes(t)) errores.push(`un eléctrico muestra "${t}"`);
    // "FUERA DEL ASSYST" es la etiqueta legítima de los ítems fuera del ASSYST (RC y RG lo son).
    const sospechosos = [...t3.matchAll(/.{0,50}(aceite|ASSYST).{0,50}/gi)].map((m) => m[0].replace(/\s+/g, ' ')).filter((t) => !/FUERA DEL ASSYST/i.test(t));
    if (sospechosos.length) errores.push('el paso 3 de la revisión menciona aceite o ASSYST: ' + JSON.stringify(sospechosos));
    // feat/autor-sin-firma (8/10): ya no hay firma; el bloque se llama NOTAS Y CIERRE y el
    // ENCARGADO es el de la sesión (no se elige).
    await clicSel('[data-continuar-notas]', 'Continuar a notas y cierre');
    // Dictamen, encargado y guardar
    const t4 = await page.evaluate(() => document.body.innerText);
    if (!/Dictamen de revisi[óo]n/i.test(t4)) errores.push('no aparece el bloque Dictamen');
    await clicSel('[data-dictamen-opcion]', 'la primera opción del dictamen');
    const encargado = await page.evaluate(() => document.querySelector('[data-encargado]')?.innerText || '');
    if (!/Smoke Test/.test(encargado)) errores.push('el ENCARGADO no es el de la sesión: ' + JSON.stringify(encargado));
    if (/Gustavo Ramos|Fabián Araya/.test(await page.evaluate(() => document.body.innerText))) errores.push('siguen los botones de la firma');
    await clicSel('[data-confirmar-guardar]', 'Confirmar y guardar');
    for (let i = 0; i < 60 && !posts.length; i++) await new Promise((r) => setTimeout(r, 100));
    for (let i = 0; i < 40 && !pushes.length; i++) await new Promise((r) => setTimeout(r, 100));
  } catch (e) { errores.push(`flujo: ${e.message}`); }
  // feat/push-aprobadores-admin (16/10): "pendiente de aprobación" va a los tres jefes y al admin.
  const avisoPendiente = pushes.find((x) => /pendiente de aprobación/.test(x?.title || ''));
  if (!avisoPendiente) errores.push('no salió el aviso "pendiente de aprobación"');
  else if (JSON.stringify(avisoPendiente.to_user_nombres) !== JSON.stringify(['Otto Ramos', 'Gustavo Ramos', 'Arturo Ramos', 'Joseline Guzman'])) {
    errores.push('el aviso "pendiente de aprobación" va a ' + JSON.stringify(avisoPendiente.to_user_nombres) + ', esperaba los tres jefes y Joseline Guzman');
  }
  const p = posts[0] || null;
  if (!p) errores.push('no hubo POST a servicios');
  else {
    if (p.servicio_codigo !== codigo) errores.push(`servicio_codigo = ${JSON.stringify(p.servicio_codigo)}, esperaba ${codigo}`);
    if (p.combustible !== 'electrico') errores.push(`combustible = ${JSON.stringify(p.combustible)}, esperaba electrico`);
    const items = Object.values(p.revisiones || {}).flat();
    if (items.length !== tareas.length) errores.push(`revisiones con ${items.length} ítems, esperaba ${tareas.length}`);
    if (items.some((it) => it.status !== 'ok')) errores.push('hay ítems que no quedaron en ok: ' + JSON.stringify(items.filter((it) => it.status !== 'ok').map((it) => it.text)));
    if (!p.dictamen || !p.dictamen.recomendacion) errores.push('el POST no trae el dictamen');
    // feat/autor-sin-firma: la fila nace con el encargado de la sesión y la fecha en su columna (dd/mm/aaaa hh:mm).
    if (p.mecanico !== 'Smoke Test') errores.push('mecanico = ' + JSON.stringify(p.mecanico) + ', esperaba Smoke Test (el de la sesión)');
    // feat/autor-por-sesion (19/10): también el id de la sesión.
    if (p.mecanico_id !== UID) errores.push('mecanico_id = ' + JSON.stringify(p.mecanico_id) + ', esperaba el id de la sesión');
    if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(String(p.fecha || ''))) errores.push('fecha = ' + JSON.stringify(p.fecha) + ', esperaba dd/mm/aaaa hh:mm');
    if (p.aceite_litros != null || p.aceite_spec) errores.push(`el POST trae aceite (${p.aceite_litros} / ${p.aceite_spec}) y una revisión en un eléctrico no lleva`);
    if (p.progreso?.completadas !== tareas.length || p.progreso?.total !== tareas.length) errores.push(`progreso ${JSON.stringify(p.progreso)}`);
  }
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (POST servicios: ${p ? `${p.servicio_codigo} · ${p.combustible} · ${Object.values(p.revisiones || {}).flat().length} ítems · dictamen ${p.dictamen?.recomendacion}` : 'ninguno'})`);
  for (const e of errores) console.log(`  - ${e}`);
  return ok;
}

// Combustible según el vehículo (feat/combustible-desde-vehiculo, 12/10). Decisión de Tavo:
// si el vehículo de la placa tiene combustible, el selector del paso 2 se autoselecciona y
// queda bloqueado; sin dato queda libre; un servicio ya guardado con otro valor no se toca
// y avisa. modo 'link' entra como desde Taller (?placa=&modelo=), llega al paso 2, elige el
// código y devuelve las tareas del paso 3; modo 'borrador' abre ?servicio= y mira el aviso.
const CAT_COMB = FILA_SELECTOR.categoria;
async function escenarioCombustible(browser, baseUrl, { nombre, modo = 'link', combVehiculo, manual = null, codigo = 'A3', esperado, bloqueado, fila = null, aviso = false,
  es4matic = false, adicional = null, presentes = [], ausentes = [], cuatroMatic = null, candado = null, recetasCaidas = false }) {
  let intentosRecetas = 0;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errores = [];
  const patches = [];
  let tareas = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (!['error', 'warning'].includes(m.type())) return;
    const txt = m.text();
    if (IGNORAR.some((re) => re.test(txt)) || /keeping defaults/.test(txt)) return;
    errores.push(`console.${m.type()}: ${txt.slice(0, 300)}`);
  });
  page.on('dialog', (d) => { errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  const json = (body, status = 200) => ({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  const row = fila ? { id: SVC_ID, estado: 'borrador', aprobado: false, servicio_codigo: 'A3', placa: 'SMK010', modelo: CAT_COMB, mecanico: USUARIO.nombre, revisiones: null, observaciones: '', fotos: {}, created_at: new Date().toISOString(), ...fila } : null;
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(USUARIO));
      if (u.includes('/rest/v1/vehiculos_modelos')) return req.respond(json([FILA_SELECTOR, FILA_EV]));
      { const rr = respuestaRecetas(u, json, { fallar: recetasCaidas && intentosRecetas++ < 2 }); if (rr) return req.respond(rr); }
      if (u.includes('/rest/v1/vehiculos?patente=eq.SMK010')) return req.respond(json([{ id: VEH_ID, modelo: CAT_COMB, combustible: combVehiculo }]));
      if (row && u.includes(`/rest/v1/servicios?id=eq.${SVC_ID}`)) {
        if (req.method() === 'PATCH') { const body = JSON.parse(req.postData() || '{}'); patches.push(body); return req.respond(json([{ ...row, ...body }])); }
        return req.respond(json([row]));
      }
      if (u.includes('/functions/v1/resolver-aceite')) return req.respond(json({ ...RESP.sinDato, traccion: { es_4matic: es4matic ? true : null, origen: es4matic ? 'tarjeta' : null, etiqueta: null } }));
      if (u.includes('/rest/v1/')) return req.respond(json([]));
      return req.respond(json({}));
    }
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, USUARIO);
  const clic = async (re, desc) => {
    const ok = await page.evaluate((src) => {
      const r = new RegExp(src);
      const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled);
      if (!b) return false; b.click(); return true;
    }, re.source);
    if (!ok) errores.push(`no encontré el botón ${desc}`);
    await new Promise((r) => setTimeout(r, 350));
  };
  const selector = () => page.evaluate(() => ({
    activo: document.querySelector('button[data-combustible][data-activo="1"]')?.dataset.combustible ?? null,
    deshabilitados: [...document.querySelectorAll('button[data-combustible]')].filter((b) => b.disabled).length,
    total: document.querySelectorAll('button[data-combustible]').length,
    origen: document.querySelector('[data-combustible-bloqueado]')?.innerText ?? null,
    aviso: document.querySelector('[data-combustible-aviso]')?.innerText ?? null,
  }));
  try {
    if (modo === 'link') {
      await page.goto(`${baseUrl}?placa=SMK010&modelo=${encodeURIComponent(CAT_COMB)}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 900));          // el debounce de la placa (400 ms) + la lectura
      await page.click('[data-continuar-paso1]').catch(() => errores.push('no encontré el botón Continuar al tipo de servicio'));
      await new Promise((r) => setTimeout(r, 350));
    } else {
      await page.goto(`${baseUrl}?servicio=${SVC_ID}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 900));
      if (recetasCaidas) {
        // La apertura por ?servicio= ESPERA las recetas: con la lectura caída el error
        // (con Reintentar) tiene que verse ya en el paso 1, y al reintentar se abre el servicio.
        const e = await page.evaluate(() => ({ estado: document.querySelector('[data-recetas-estado]')?.dataset.recetasEstado ?? null, paso1: document.body.innerText.includes('PASO 1') }));
        if (e.estado !== 'error') errores.push(`recetas caídas con ?servicio=: el paso 1 no muestra el error (${e.estado})`);
        if (!e.paso1) errores.push('recetas caídas con ?servicio=: no se quedó en el paso 1');
        await page.click('button[data-accion="reintentar-recetas"]').catch(() => errores.push('no está el botón Reintentar en el paso 1'));
        await new Promise((r) => setTimeout(r, 1200));
        const e2 = await page.evaluate(() => ({ estado: document.querySelector('[data-recetas-estado]')?.dataset.recetasEstado ?? null, paso1: document.body.innerText.includes('PASO 1') }));
        if (e2.estado || e2.paso1) errores.push(`tras Reintentar no se abrió el servicio (${JSON.stringify(e2)})`);
      }
      const a3 = await page.evaluate(() => document.querySelector('[data-combustible-aviso]')?.innerText ?? null);
      if (aviso && !a3) errores.push('el paso 3 del borrador no muestra el aviso de la diferencia');
      await clic(/^Editar$/, 'Editar');   // clic() no pasa los flags del regex
    }
    const s = await selector();
    if (s.total !== 3) errores.push(`el paso 2 no muestra los tres botones de combustible (${s.total})`);
    if (bloqueado) {
      if (s.deshabilitados !== 3) errores.push(`el selector no quedó bloqueado (${s.deshabilitados}/3 deshabilitados)`);
      if (!/Según el vehículo/.test(s.origen || '')) errores.push('falta la línea "Según el vehículo · para corregir, editá el vehículo en Taller"');
    } else {
      if (s.deshabilitados !== 0) errores.push(`el selector quedó bloqueado y debía estar libre (${s.deshabilitados}/3)`);
      if (s.origen) errores.push('muestra "Según el vehículo" sin estar bloqueado');
    }
    if (aviso !== !!s.aviso) errores.push(aviso ? 'falta el aviso de la diferencia en el paso 2' : `muestra un aviso sin motivo: ${s.aviso}`);
    if (manual) { await page.click(`button[data-combustible="${manual}"]`); await new Promise((r) => setTimeout(r, 300)); }
    const s2 = await selector();
    if (s2.activo !== esperado) errores.push(`combustible seleccionado = ${s2.activo}, esperaba ${esperado}`);
    if (recetasCaidas && modo === 'link') {
      // Falla cerrado: error con Reintentar, sin códigos, INICIAR deshabilitado; Reintentar recupera.
      const e = await page.evaluate(() => ({
        estado: document.querySelector('[data-recetas-estado]')?.dataset.recetasEstado ?? null,
        codigos: document.querySelectorAll('button.svc-btn').length,
        iniciar: document.querySelector('[data-iniciar-inspeccion]')?.disabled ?? null,
      }));
      if (e.estado !== 'error') errores.push(`recetas caídas: no muestra el error (${e.estado})`);
      if (e.codigos !== 0) errores.push(`recetas caídas: ofrece ${e.codigos} códigos (debería ninguno)`);
      if (e.iniciar !== true) errores.push('recetas caídas: "Iniciar inspección" no está deshabilitado');
      await page.click('button[data-accion="reintentar-recetas"]').catch(() => errores.push('no está el botón Reintentar'));
      await new Promise((r) => setTimeout(r, 500));
      const e2 = await page.evaluate(() => ({ estado: document.querySelector('[data-recetas-estado]')?.dataset.recetasEstado ?? null, codigos: document.querySelectorAll('button.svc-btn').length }));
      if (e2.estado || e2.codigos === 0) errores.push(`tras Reintentar no cargaron las recetas (${JSON.stringify(e2)})`);
    }
    if (candado) {
      // Tema B: el candado es el ícono SVG del candado (antes el emoji 🔒).
      const c = await page.evaluate((k) => { const b = document.querySelector(`button[data-codigo="${k}"]`); return b ? { dis: b.disabled, txt: b.textContent, candado: !!b.querySelector('svg') } : null; }, candado);
      if (!c) errores.push(`no está el botón del código ${candado}`);
      else if (!c.dis || !c.candado) errores.push(`el código ${candado} no quedó deshabilitado con el candado (${JSON.stringify(c)})`);
    }
    if (cuatroMatic) {
      const q = await page.evaluate(() => ({ on: document.querySelector('button[data-4matic]')?.dataset['4matic'] ?? null, bloq: document.querySelector('button[data-4matic]')?.disabled ?? null, txt: document.querySelector('[data-4matic-segun-vehiculo]')?.innerText ?? null }));
      if (q.on !== (cuatroMatic.on ? '1' : '0')) errores.push(`4MATIC = ${q.on}, esperaba ${cuatroMatic.on ? '1' : '0'}`);
      if (q.bloq !== cuatroMatic.bloqueado) errores.push(`4MATIC bloqueado = ${q.bloq}, esperaba ${cuatroMatic.bloqueado}`);
      if (cuatroMatic.bloqueado && !/Según el vehículo/.test(q.txt || '')) errores.push('4MATIC bloqueado sin la línea "Según el vehículo"');
    }
    if (modo === 'link') {
      await clic(new RegExp(`^${codigo}$`), codigo);
      if (adicional) {
        const hay = await page.evaluate((k) => !!document.querySelector(`[data-adicional="${k}"] input`), adicional);
        if (!hay) errores.push(`no está la casilla del adicional ${adicional}`);
        else {
          const marcada = await page.evaluate((k) => document.querySelector(`[data-adicional="${k}"] input`).checked, adicional);
          if (marcada) errores.push(`la casilla ${adicional} vino marcada (debe arrancar apagada)`);
          await page.click(`[data-adicional="${adicional}"] input`); await new Promise((r) => setTimeout(r, 200));
        }
      }
      await page.click('[data-iniciar-inspeccion]').catch(() => errores.push('no encontré el botón Iniciar inspección'));
      await new Promise((r) => setTimeout(r, 350));
      // Tema B: los títulos de grupo y el texto de cada tarea (antes, las líneas del innerText).
      tareas = await page.evaluate(() => [...document.querySelectorAll('[data-grupo-checklist] h3, [data-texto-tarea]')].map((e) => (e.dataset.textoTarea ?? e.textContent).trim()));
      const t3 = tareas.join('\n');
      for (const t of presentes) if (!t3.includes(t)) errores.push(`el paso 3 no tiene "${t}"`);
      for (const t of ausentes) if (t3.includes(t)) errores.push(`el paso 3 tiene "${t}" y no debía`);
    } else {
      await new Promise((r) => setTimeout(r, 3500));          // el autosave (2 s): no debe reescribir el combustible
      const mal = patches.filter((p) => 'combustible' in p && p.combustible !== esperado);
      if (mal.length) errores.push(`el autosave reescribió el combustible: ${JSON.stringify(mal.map((p) => p.combustible))}`);
    }
  } catch (e) { errores.push(`flujo: ${e.message}`); }
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (combustible ${esperado}${modo === 'link' ? ` · ${tareas.length} líneas en el paso 3` : ` · PATCH: ${patches.length}`})`);
  for (const e of errores) console.log(`  - ${e}`);
  return { ok, tareas };
}

// Vistas del cliente (decisión de Tavo, 18/10/2026): un servicio que se rechazó,
// se corrigió y se aprobó conserva motivo_rechazo, rechazado_por y rechazado_at
// como historial interno. El informe público (/servicio/:slug) y el historial
// por placa (/historial) NUNCA muestran nada del rechazo: ni la palabra, ni el
// motivo, ni quién lo rechazó. Se prueba con la marca limpia (lo que deja toda
// aprobación desde el 18/10) y con una fila vieja que todavía la tiene en true.
const MOTIVO_SMOKE = 'Falta la foto del filtro de aire y el nivel de refrigerante';
const RECHAZO_SMOKE = { motivo_rechazo: MOTIVO_SMOKE, rechazado_por: 'Otto Ramos', rechazado_at: '2026-10-14T12:00:00Z' };
const filaAprobadaSmoke = (o) => ({
  id: '00000000-0000-4000-8000-0000000000e1', slug: 'SMK123-B-14102026-AB1', placa: 'SMK123', modelo: 'C-Class', motor: 'M274',
  mecanico: 'Fabián Araya', aprobado_por: 'Gustavo Ramos', estado: 'aprobado', aprobado: true, servicio_codigo: 'B',
  servicio_desc: 'Servicio B', km: 82000, combustible: 'gasolina', traccion: 'RWD', created_at: '2026-10-15T15:00:00Z',
  revisiones: { MOTOR: [{ id: '3_0', text: 'Cambio de aceite de motor', status: 'ok' }] }, observaciones: '', pendientes: [], progreso: { completadas: 1, total: 1 },
  fotos: {}, ...RECHAZO_SMOKE, ...o,
});
async function escenarioVistaCliente(browser, baseUrl, { nombre, ruta, filas, placa = null }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !IGNORAR.some((re) => re.test(m.text()))) errores.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('dialog', (d) => { errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA) && u.includes('/rest/v1/servicios')) return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(filas) });
    if (SUPA && u.startsWith(SUPA)) return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: u.includes('/rest/v1/') ? '[]' : '{}' });
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  let texto = '';
  try {
    await page.goto(baseUrl.replace(/\/$/, '') + ruta, { waitUntil: 'networkidle0', timeout: 30000 });
    if (placa) {
      await page.type('input', placa);
      await page.keyboard.press('Enter');
    }
    await page.waitForFunction(() => document.body.innerText.includes('Gustavo Ramos'), { timeout: 8000 })
      .catch(() => errores.push('no apareció el servicio aprobado (falta "Gustavo Ramos" de Aprobado por)'));
    await new Promise((r) => setTimeout(r, 400));
    texto = await page.evaluate(() => document.body.innerText);
    if (/rechaz/i.test(texto)) errores.push(`la vista muestra "rechaz…": ${(texto.match(/.{0,40}rechaz.{0,40}/i) || [''])[0]}`);
    if (texto.includes(MOTIVO_SMOKE)) errores.push('la vista muestra el motivo del rechazo');
    if (texto.includes(RECHAZO_SMOKE.rechazado_por)) errores.push(`la vista muestra a quien rechazó (${RECHAZO_SMOKE.rechazado_por})`);
    if (/❌/.test(texto)) errores.push('la vista muestra un ❌');
  } catch (e) { errores.push(`flujo: ${e.message}`); }
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}`);
  for (const e of errores) console.log(`  - ${e}`);
  return ok;
}

// Detalles de carrocería sobre la lámina (feat/marcas-carroceria, 23/11/2026): en una
// revisión RC / RG se marcan golpes, rayones y quebraduras. Se abre un servicio por
// ?servicio= con la red simulada: la tabla carroceria_marcas y sus tres funciones.
//   pasos: lista de acciones del escenario (ver el switch de abajo).
const LAMINA_MARCAS = 'https://lamina.smoke/storage/v1/object/public/vehiculos-carrocerias/W204/lamina.webp?v=abc123';
// Para MIRAR la pantalla (no hace falta para que el smoke pase): con SMOKE_LAMINA=<archivo>
// la lámina es esa imagen real, y con SMOKE_CAPTURAS=<carpeta> el paso ['captura', nombre]
// guarda una captura. Sin esas variables, la lámina es un PNG de 1×1 y 'captura' no hace nada.
const LAMINA_REAL = process.env.SMOKE_LAMINA ? readFileSync(process.env.SMOKE_LAMINA) : null;
const LAMINA_TIPO = /\.webp$/i.test(process.env.SMOKE_LAMINA || '') ? 'image/webp' : 'image/png';
RESP.conLaminaMarcas = { ...RESP.automatico, imagenes: { foto: null, lamina: LAMINA_MARCAS, mascara: null } };
const MARCA_RECEPCION = { id: '00000000-0000-4000-8000-0000000000f1', orden_id: null, servicio_id: SVC_ID, origen: 'recepcion', tipo: 'rayon', tipo_otro: null, descripcion: 'Defensa delantera', foto_url: null, carroceria_codigo: 'W204', lamina_version: 'abc123', x: 0.2, y: 0.3, creado_por: 'Joseline Guzman', creado_por_id: '00000000-0000-4000-8000-000000000009', created_at: '2026-11-23T14:00:00Z', editado_at: null, eliminada_at: null };
const MARCA_PROPIA = { id: '00000000-0000-4000-8000-0000000000f2', orden_id: null, servicio_id: SVC_ID, origen: 'revision', tipo: 'golpe', tipo_otro: null, descripcion: 'Puerta trasera', foto_url: null, carroceria_codigo: 'W204', lamina_version: 'abc123', x: 0.6, y: 0.7, creado_por: USUARIO.nombre, creado_por_id: UID, created_at: '2026-11-23T15:00:00Z', editado_at: null, eliminada_at: null };
const FOTO_GUIADA = { ...MARCA_PROPIA, id: '00000000-0000-4000-8000-0000000000f5', tipo: null, zona: 'trasero', descripcion: null, foto_url: 'https://lamina.smoke/foto-trasero.png', carroceria_codigo: null, lamina_version: null, x: null, y: null, created_at: '2026-11-23T15:10:00Z' };
const FOTO_ADICIONAL = { ...FOTO_GUIADA, id: '00000000-0000-4000-8000-0000000000f6', zona: null, descripcion: 'Rayón en el techo', foto_url: 'https://lamina.smoke/foto-libre.png', created_at: '2026-11-23T15:20:00Z' };
// La foto que suben los escenarios de "sin lámina" (un PNG de 1×1 en un archivo temporal).
const FOTO_ARCHIVO = join(tmpdir(), 'ryr-smoke-foto.png');
writeFileSync(FOTO_ARCHIVO, PNG_1X1);
const MARCA_OTRA_LAMINA = { ...MARCA_PROPIA, id: '00000000-0000-4000-8000-0000000000f3', carroceria_codigo: 'W205', created_at: '2026-11-23T16:00:00Z', descripcion: 'Se marcó sobre otra carrocería' };
async function escenarioMarcas(browser, baseUrl, { nombre, fila = {}, resolver = 'conLaminaMarcas', usuario = USUARIO, iniciales = [], errorRpc = null, tema = null, entrada = 'servicio', pasos = [] }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const errores = [];
  const rpcs = [];
  const lecturas = [];
  const posts = [];
  const subidas = [];
  let confirmaciones = 0;
  let marcas = iniciales.map((m) => ({ ...m }));
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (!['error', 'warning'].includes(m.type())) return;
    const txt = m.text();
    if (IGNORAR.some((re) => re.test(txt)) || /keeping defaults/.test(txt)) return;
    errores.push(`console.${m.type()}: ${txt.slice(0, 300)}`);
  });
  // El único diálogo esperado es la confirmación de quitar un detalle.
  page.on('dialog', (d) => {
    if (d.type() === 'confirm' && /Quitar este detalle/.test(d.message())) { confirmaciones++; d.accept().catch(() => {}); return; }
    errores.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {});
  });
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
  const json = (body, status = 200) => ({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  const row = { id: SVC_ID, estado: 'borrador', aprobado: false, servicio_codigo: 'RC', placa: 'SMK001', mecanico: usuario.nombre, mecanico_id: usuario.id, revisiones: null, observaciones: '', fotos: {}, created_at: new Date().toISOString(), ...fila };
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      if (u.includes('/functions/v1/resolver-aceite')) return req.respond(json(RESP[resolver]));
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(usuario));
      if (u.includes('/rest/v1/rpc/carroceria_marca_')) {
        const fn = u.split('/rpc/')[1].split('?')[0];
        const a = JSON.parse(req.postData() || '{}');
        rpcs.push({ fn, a });
        if (errorRpc) return req.respond(json({ ok: false, error: errorRpc }));
        if (fn === 'carroceria_marca_agregar') {
          if (a.p_zona && !a.p_tipo) marcas = marcas.filter((x) => !(x.zona === a.p_zona && !x.tipo));
          const m = { id: `00000000-0000-4000-8000-0000000001${String(rpcs.length).padStart(2, '0')}`, orden_id: null, servicio_id: a.p_servicio_id, origen: a.p_origen, tipo: a.p_tipo, tipo_otro: a.p_tipo_otro, zona: a.p_tipo ? null : (a.p_zona ?? null), descripcion: a.p_descripcion, foto_url: a.p_foto_url, carroceria_codigo: a.p_x == null ? null : a.p_carroceria_codigo, lamina_version: a.p_lamina_version, x: a.p_x, y: a.p_y, creado_por: usuario.nombre, creado_por_id: usuario.id, created_at: new Date().toISOString(), editado_at: null, eliminada_at: null };
          marcas.push(m);
          return req.respond(json({ ok: true, error: null, marca: m }));
        }
        if (fn === 'carroceria_marca_quitar') {
          marcas = marcas.filter((m) => m.id !== a.p_id);
          return req.respond(json({ ok: true, error: null, id: a.p_id }));
        }
        const i = marcas.findIndex((m) => m.id === a.p_id);
        if (i < 0) return req.respond(json({ ok: false, error: 'no_encontrado' }));
        marcas[i] = { ...marcas[i], tipo: a.p_tipo, tipo_otro: a.p_tipo_otro, descripcion: a.p_descripcion, foto_url: a.p_foto_url, ...(a.p_mover ? { x: a.p_x, y: a.p_y, carroceria_codigo: a.p_carroceria_codigo } : null) };
        return req.respond(json({ ok: true, error: null, marca: marcas[i] }));
      }
      if (u.includes('/storage/v1/object/fotos-servicios/')) { subidas.push(u); return req.respond(json({ Key: 'smoke' })); }
      if (u.includes('/rest/v1/carroceria_marcas')) { lecturas.push(decodeURIComponent(u)); return req.respond(json(marcas)); }
      // entrada 'orden': el link de Taller abre el servicio vigente de la orden.
      if (u.includes('/rest/v1/servicios?orden_id=eq.')) return req.respond(json(entrada === 'orden' ? [row] : []));
      if (u.includes('/rest/v1/vehiculos_modelos')) return req.respond(json([FILA_SELECTOR]));
      { const rr = respuestaRecetas(u, json); if (rr) return req.respond(rr); }
      if (u.includes('/rest/v1/vehiculos?patente=eq.SMK001')) return req.respond(json([{ id: VEH_ID }]));
      if (u.includes(`/rest/v1/servicios?id=eq.${SVC_ID}`)) {
        if (req.method() === 'PATCH') { const body = JSON.parse(req.postData() || '{}'); posts.push(body); return req.respond(json([{ ...row, ...body }])); }
        return req.respond(json([row]));
      }
      if (u.includes('/rest/v1/')) return req.respond(json([]));
      return req.respond(json({}));
    }
    if (u === LAMINA_MARCAS || u.startsWith('https://lamina.smoke/foto-')) return req.respond({ status: 200, contentType: LAMINA_REAL ? LAMINA_TIPO : 'image/png', headers: CORS, body: LAMINA_REAL || PNG_1X1 });
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, usuario);
  if (tema === 'claro') await page.evaluateOnNewDocument(() => { try { localStorage.setItem('theme', 'light'); } catch { /* sin storage */ } });
  try {
    await page.goto(entrada === 'orden' ? `${baseUrl}?placa=SMK001&orden_id=${ORDEN_ID}` : `${baseUrl}?servicio=${SVC_ID}`, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) { errores.push(`goto: ${e.message}`); }
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const hay = (sel) => page.$(sel).then((h) => !!h);
  const cuenta = (sel) => page.$$eval(sel, (els) => els.length).catch(() => 0);
  const texto = (sel) => page.$eval(sel, (el) => el.innerText).catch(() => null);
  const tocar = async (sel) => { try { await page.waitForSelector(sel, { timeout: 4000 }); await page.click(sel); } catch (e) { errores.push(`no se pudo tocar ${sel}: ${e.message.slice(0, 120)}`); } };
  for (const [paso, arg] of pasos) {
    switch (paso) {
      case 'sin-bloque': if (await hay('[data-marcas-carroceria]')) errores.push('un servicio que no es RC ni RG muestra los detalles de carrocería'); break;
      case 'bloque': if (!await hay('[data-marcas-carroceria] [data-marcas-abrir]')) errores.push('no aparece el bloque de detalles de carrocería'); break;
      case 'lamina-cabecera': {
        const l = await page.evaluate(() => {
          const c = document.querySelector('#root [data-marcas-carroceria] [data-lamina-carroceria]');
          if (!c) return null;
          return { display: getComputedStyle(c).display, temaFijo: c.hasAttribute('data-tema-fijo'), src: c.querySelector('img')?.getAttribute('src'), puntos: c.querySelectorAll('[data-marca-punto]').length };
        });
        if (arg === 'ausente') { if (l) errores.push(`dibuja una lámina y no debía (${JSON.stringify(l)})`); break; }
        if (!l || l.display === 'none' || !l.temaFijo || l.src !== LAMINA_MARCAS) errores.push(`la lámina de la cabecera no está bien (${JSON.stringify(l)})`);
        else if (l.puntos !== arg) errores.push(`la lámina de la cabecera dibuja ${l.puntos} puntos, esperado ${arg}`);
        break;
      }
      case 'resumen': { const t = await texto('[data-marcas-resumen]'); if (t !== arg) errores.push(`el resumen dice "${t}", esperado "${arg}"`); break; }
      case 'abrir': {
        await tocar('[data-marcas-abrir]');
        await page.waitForSelector('[data-marcas-panel]', { timeout: 4000 }).catch(() => errores.push('no abrió el panel de detalles'));
        const dentro = await page.evaluate(() => { const p = document.querySelector('[data-marcas-panel]'); return p ? { enRoot: !!p.closest('#root'), enBody: p.parentElement === document.body, alto: p.getBoundingClientRect().height, vista: window.innerHeight } : null; });
        if (!dentro || dentro.enRoot || !dentro.enBody) errores.push(`el panel no va por portal a <body> (${JSON.stringify(dentro)})`);
        else if (Math.abs(dentro.alto - dentro.vista) > 1) errores.push(`el panel no mide la pantalla (${dentro.alto} de ${dentro.vista})`);
        break;
      }
      case 'cerrar': await tocar('[data-marcas-cerrar]'); await espera(150); if (await hay('[data-marcas-panel]')) errores.push('el panel no cerró'); break;
      case 'tocar-lamina': {
        // Toca la imagen en la fracción dada (x, y) y espera el formulario.
        const caja = await page.$eval('[data-marcas-lamina] img', (i) => { const r = i.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }).catch(() => null);
        if (!caja || !(caja.w > 20)) { errores.push(`la lámina del panel no tiene tamaño (${JSON.stringify(caja)})`); break; }
        await page.mouse.click(caja.x + caja.w * arg[0], caja.y + caja.h * arg[1]);
        await espera(150);
        break;
      }
      case 'form': { const f = await page.$eval('[data-marca-form]', (el) => el.getAttribute('data-modo')).catch(() => null); if (f !== arg) errores.push(`el formulario está en "${f}", esperado "${arg}"`); break; }
      case 'sin-form': if (await hay('[data-marca-form]')) errores.push('hay un formulario abierto y no debía'); break;
      case 'punto-pendiente': { const n = await cuenta('[data-marcas-lamina] [data-marca-punto][data-pendiente]'); if (n !== arg) errores.push(`puntos pendientes sobre la lámina: ${n}, esperado ${arg}`); break; }
      case 'tipo': await tocar(`[data-marca-tipo="${arg}"]`); break;
      case 'otro': await page.type('[data-marca-otro]', arg).catch((e) => errores.push(`no se pudo escribir el "otro": ${e.message.slice(0, 80)}`)); break;
      case 'descripcion': await page.type('[data-marca-descripcion]', arg).catch((e) => errores.push(`no se pudo escribir la descripción: ${e.message.slice(0, 80)}`)); break;
      case 'guardar': await tocar('[data-marca-guardar]'); await espera(350); break;
      case 'error': { const t = await texto('[data-marca-error]'); if (!t || !t.includes(arg)) errores.push(`el error del formulario dice "${t}", esperado "${arg}"`); break; }
      case 'agregar-sin-punto': await tocar('[data-marcas-agregar]'); break;
      case 'sin-agregar': if (await hay('[data-marcas-agregar]')) errores.push('ofrece agregar un detalle y no debía'); if (!await hay('[data-marcas-solo-lectura]')) errores.push('no avisa que la revisión ya se cerró'); break;
      case 'sin-lamina-aviso': if (!await hay('[data-marcas-sin-lamina]')) errores.push('no avisa que el vehículo no tiene lámina'); if (await hay('[data-marcas-lamina]')) errores.push('dibuja una lámina en el panel y no debía'); break;
      case 'lista': { const n = await cuenta('[data-marcas-lista] [data-marca]'); if (n !== arg) errores.push(`la lista tiene ${n} detalles, esperado ${arg}`); break; }
      case 'nombres': { const t = await page.$$eval('[data-marcas-lista] [data-marca]', (els) => els.map((e) => `${e.getAttribute('data-numero')} ${e.querySelector('[data-marca-nombre]')?.innerText}`)).catch(() => []); if (JSON.stringify(t) !== JSON.stringify(arg)) errores.push(`la lista dice ${JSON.stringify(t)}, esperado ${JSON.stringify(arg)}`); break; }
      case 'puntos-panel': { const n = await page.$$eval('[data-marcas-lamina] [data-marca-punto]:not([data-pendiente])', (els) => els.map((e) => e.getAttribute('data-numero'))).catch(() => []); if (JSON.stringify(n) !== JSON.stringify(arg)) errores.push(`los puntos del panel son ${JSON.stringify(n)}, esperado ${JSON.stringify(arg)}`); break; }
      case 'editables': { const n = await cuenta('[data-marca-editar]'); if (n !== arg) errores.push(`detalles con lápiz: ${n}, esperado ${arg}`); break; }
      case 'editar': { const bs = await page.$$('[data-marca-editar]'); if (!bs[arg]) errores.push(`no hay lápiz ${arg}`); else await bs[arg].click(); await espera(150); break; }
      case 'quitar': await tocar('[data-marca-quitar]'); await espera(350); break;
      case 'rpc': {
        const r = rpcs[rpcs.length - 1];
        if (!r || r.fn !== arg.fn) { errores.push(`la última función llamada es ${r?.fn}, esperado ${arg.fn}`); break; }
        for (const [k, v] of Object.entries(arg.a || {})) {
          const real = r.a[k];
          const igual = v && typeof v === 'object' ? typeof real === 'string' && real.startsWith(v.empieza)
            : typeof v === 'number' ? typeof real === 'number' && Math.abs(real - v) < 0.02 : real === v;
          if (!igual) errores.push(`${arg.fn}: ${k} = ${JSON.stringify(real)}, esperado ${JSON.stringify(v)}`);
        }
        break;
      }
      case 'rpcs': if (rpcs.length !== arg) errores.push(`llamadas a las funciones de marcas: ${rpcs.length}, esperado ${arg} (${rpcs.map((r) => r.fn).join(', ')})`); break;
      case 'tema-panel': {
        const f = await page.evaluate(() => { const p = document.querySelector('[data-marcas-panel]'); const l = document.querySelector('[data-marcas-lamina]'); return p ? { tema: p.getAttribute('data-tema'), panel: getComputedStyle(p).filter, lamina: l ? getComputedStyle(l).filter : null, img: l ? getComputedStyle(l.querySelector('img')).filter : null } : null; });
        if (!f) { errores.push('no se pudo medir el tema del panel'); break; }
        if (arg === 'claro') {
          if (f.tema !== 'claro' || !/invert/.test(f.panel)) errores.push(`tema claro: el panel no lleva el filtro del tema (${JSON.stringify(f)})`);
          if (!/invert/.test(f.lamina || '')) errores.push(`tema claro: la lámina del panel no se re-invierte (${f.lamina})`);
          if (f.img !== 'none') errores.push(`tema claro: la imagen de la lámina lleva filtro propio (${f.img})`);
        } else if (f.tema !== 'oscuro' || f.panel !== 'none' || (f.lamina && f.lamina !== 'none')) errores.push(`tema oscuro: el panel lleva filtros (${JSON.stringify(f)})`);
        break;
      }
      case 'sin-tipos': if (await hay('[data-marca-tipo]') || await hay('[data-marcas-agregar]')) errores.push('sin lámina ofrece elegir un tipo de detalle, y debía ofrecer solo fotos'); break;
      case 'guiadas': { const n = await cuenta('[data-fotos-guiadas] [data-foto-guiada]'); if (n !== arg) errores.push(`casillas de fotos guiadas: ${n}, esperado ${arg}`); break; }
      case 'guiadas-con-foto': { const n = await cuenta('[data-fotos-guiadas] [data-foto-guiada][data-con-foto]'); if (n !== arg) errores.push(`casillas guiadas con foto: ${n}, esperado ${arg}`); break; }
      case 'adicionales': { const n = await cuenta('[data-fotos-adicionales] [data-foto-adicional]'); const c = await texto('[data-fotos-adicionales-conteo]'); if (n !== arg || c !== String(arg)) errores.push(`fotos adicionales: ${n} (el conteo dice ${c}), esperado ${arg}`); break; }
      case 'sin-sumar-fotos': if (await hay('[data-fotos-agregar]') || await hay('[data-foto-guiada]:not([data-con-foto])')) errores.push('con lámina ofrece sumar fotos, y solo debía mostrar las que hay'); break;
      case 'subir-guiada':
      case 'subir-adicional': {
        // El segundo input del FotoPicker es el de la galería.
        const sel = paso === 'subir-guiada' ? `[data-foto-guiada="${arg}"] input[type=file]` : '[data-fotos-agregar] input[type=file]';
        const ins = await page.$$(sel);
        if (ins.length < 2) { errores.push(`no hay dónde subir la foto (${sel})`); break; }
        const antes = rpcs.length;
        await ins[1].uploadFile(FOTO_ARCHIVO);
        for (let i = 0; i < 80 && rpcs.length === antes; i++) await espera(100);
        await espera(200);
        if (rpcs.length === antes) errores.push(`la foto no llegó a la base (subidas al bucket: ${subidas.length})`);
        break;
      }
      case 'describir': {
        const ins = await page.$$('[data-foto-descripcion]');
        if (!ins[arg[0]]) { errores.push(`no hay foto adicional ${arg[0]} para describir`); break; }
        await ins[arg[0]].click({ clickCount: 3 }); await ins[arg[0]].type(arg[1]); await page.keyboard.press('Tab'); await espera(350);
        break;
      }
      case 'quitar-foto': { const bs = await page.$$('[data-foto-quitar]'); if (!bs[arg]) errores.push(`no hay foto ${arg} para quitar`); else await bs[arg].evaluate((b) => b.click()); await espera(350); break; }   // click del DOM: la cabecera fija del panel puede tapar la casilla al desplazar
      case 'fotos-quitables': { const n = await cuenta('[data-foto-quitar]'); if (n !== arg) errores.push(`fotos con botón de quitar: ${n}, esperado ${arg}`); break; }
      case 'captura': if (process.env.SMOKE_CAPTURAS) await page.screenshot({ path: `${process.env.SMOKE_CAPTURAS}/${arg}.png` }).catch((e) => errores.push(`captura: ${e.message.slice(0, 80)}`)); break;
      default: errores.push(`paso desconocido: ${paso}`);
    }
  }
  // Las marcas no pasan por el guardado del checklist: ningún PATCH las lleva.
  for (const b of posts) if (JSON.stringify(b).includes('carroceria') || 'marcas' in b) errores.push('un PATCH a servicios lleva las marcas');
  if (pasos.some(([p]) => p === 'bloque') && !lecturas.some((u) => u.includes(`servicio_id.eq.${SVC_ID}`) && u.includes('eliminada_at=is.null'))) errores.push(`no leyó las marcas del servicio (${JSON.stringify(lecturas)})`);
  if (confirmaciones !== pasos.filter(([p]) => p === 'quitar').length) errores.push(`confirmaciones de quitar: ${confirmaciones}`);
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (funciones: ${rpcs.map((r) => r.fn.replace('carroceria_marca_', '')).join(', ') || 'ninguna'})`);
  for (const e of errores) console.log(`  - ${e}`);
  return ok;
}

let server, browser, code = 1;
try {
  console.log('smoke: vite build…');
  await build({ root, logLevel: 'warn' });
  server = await preview({ root, logLevel: 'silent', preview: { port: 4199, strictPort: false, open: false } });
  const baseUrl = server.resolvedUrls.local[0];
  console.log(`smoke: preview en ${baseUrl}`);
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const r1 = await escenario(browser, baseUrl, { nombre: 'sin sesión → LoginScreen', conSesion: false });
  const r2 = await escenario(browser, baseUrl, { nombre: 'con sesión sembrada → MainApp', conSesion: true });
  const r3 = await escenario(browser, baseUrl, { nombre: 'version.json con otro build → banner "Hay una versión nueva"', conSesion: false, versionNueva: true });
  const r4 = await escenario(browser, baseUrl, { nombre: 'login en pestaña Correo → código por email, paso 2, vuelta a Teléfono', conSesion: false, pestanaCorreo: true });
  const rA = [];
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'aceite automático por la orden → se ve con su origen y se guarda',
    fila: { orden_id: ORDEN_ID, aceite_litros: 7, aceite_spec: 'MB 229.3' }, resolver: 'automatico', cuerpo: { orden_id: ORDEN_ID },
    esperado: { litros: 8, spec: 'MB 229.5' }, origen: 'WIS',
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'varias cantidades por la placa → el mecánico elige 6.5 L y queda guardado',
    fila: {}, resolver: 'opciones', cuerpo: { vehiculo_id: VEH_ID }, elegir: 6.5, textos: ['Con código M005', 'Excepto código M005'],
    esperado: { litros: 6.5, spec: 'MB 229.52' }, origen: 'WIS',
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'sin dato del resolvedor ni guardado → "Aceite no disponible", la histórica no se ofrece',
    fila: {}, resolver: 'sinDato', esperado: { litros: null, spec: null },
    presentes: ['Aceite no disponible: identificá el vehículo (VIN)'], ausentes: ['7.3 L'],
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'función caída con aceite guardado → conserva lo guardado, con la etiqueta',
    fila: { aceite_litros: 8.5, aceite_spec: 'MB 229.51' }, resolver: 'caida',
    esperado: { litros: 8.5, spec: 'MB 229.51' }, etiqueta: true,
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'receta sin cambio de aceite → queda vacío a propósito',
    fila: { servicio_codigo: 'AEV', aceite_litros: 8.5, aceite_spec: 'MB 229.51' }, resolver: 'automatico',
    esperado: { litros: null, spec: null }, ausentes: ['8.5 L', '8 L'],
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'control: servicio APROBADO → aceite congelado, ni PATCH ni consulta al resolvedor',
    fila: { estado: 'aprobado', aprobado: true, aceite_litros: 8.5, aceite_spec: 'MB 229.51' }, resolver: 'otroValor', usuario: JEFE,
    esperado: { litros: 8.5, spec: 'MB 229.51' }, etiqueta: true, sinPatch: true, sinResolver: true, ausentes: ['6 L'],
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'lámina: resolver-aceite la devuelve → se dibuja en el checklist, sobre su fondo',
    fila: { orden_id: ORDEN_ID }, resolver: 'conLamina', cuerpo: { orden_id: ORDEN_ID },
    esperado: { litros: 8, spec: 'MB 229.5' }, origen: 'WIS', lamina: 'visible',
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'lámina: la URL falla → el bloque se oculta y el resto sigue igual',
    fila: { orden_id: ORDEN_ID }, resolver: 'laminaRota', cuerpo: { orden_id: ORDEN_ID },
    esperado: { litros: 8, spec: 'MB 229.5' }, origen: 'WIS', lamina: 'oculta',
  }));
  rA.push(await escenarioAceite(browser, baseUrl, {
    nombre: 'lámina en el tema claro → se ve igual que en el oscuro: el bloque se re-invierte entero y la imagen no (al arrancar y al alternar)',
    fila: { orden_id: ORDEN_ID }, resolver: 'conLamina', cuerpo: { orden_id: ORDEN_ID },
    esperado: { litros: 8, spec: 'MB 229.5' }, origen: 'WIS', lamina: 'visible', tema: 'claro',
  }));
  const rC = [];
  rC.push(await escenarioRevisionEV(browser, baseUrl, { nombre: 'eléctrico → Revisión de compra (RC) con RC_EV de punta a punta: 22 tareas, sin escape ni faja, dictamen y guardado', codigo: 'RC', tareas: TAREAS_RC_EV }));
  rC.push(await escenarioRevisionEV(browser, baseUrl, { nombre: 'eléctrico → Revisión general (RG) con RG_EV de punta a punta: 20 tareas, sin escape ni faja, dictamen y guardado', codigo: 'RG', tareas: TAREAS_RG_EV }));
  const rF = [];
  const fGas  = await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: vehículo gasolina por el link → autoseleccionado y bloqueado', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true });
  const fDie  = await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: vehículo diésel por el link → autoseleccionado y bloqueado', combVehiculo: 'diesel', esperado: 'diesel', bloqueado: true });
  const fEle  = await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: vehículo eléctrico por el link → bloqueado, serie EV', combVehiculo: 'electrico', esperado: 'electrico', bloqueado: true, codigo: 'AEV' });
  const fSin  = await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: vehículo sin dato → selector libre, gasolina por defecto', combVehiculo: null, esperado: 'gasolina', bloqueado: false });
  const fRaro = await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: valor desconocido ("hibrido") → selector libre', combVehiculo: 'hibrido', esperado: 'gasolina', bloqueado: false });
  const mDie  = await escenarioCombustible(browser, baseUrl, { nombre: 'control: sin dato + Diesel a mano', combVehiculo: null, manual: 'diesel', esperado: 'diesel', bloqueado: false });
  const mEle  = await escenarioCombustible(browser, baseUrl, { nombre: 'control: sin dato + Eléctrico a mano', combVehiculo: null, manual: 'electrico', esperado: 'electrico', bloqueado: false, codigo: 'AEV' });
  const igual = (a, b, q) => { const ok = a.tareas.length > 0 && JSON.stringify(a.tareas) === JSON.stringify(b.tareas); console.log(`${ok ? 'PASS' : 'FAIL'}  combustible: el paso 3 con ${q} del vehículo es igual al de ${q} elegido a mano (${a.tareas.length} líneas)`); return ok; };
  rF.push(fGas.ok, fDie.ok, fEle.ok, fSin.ok, fRaro.ok, mDie.ok, mEle.ok, igual(fDie, mDie, 'diésel'), igual(fEle, mEle, 'eléctrico'), igual(fGas, fSin, 'gasolina'));
  if (JSON.stringify(fDie.tareas) === JSON.stringify(fGas.tareas)) { console.log('FAIL  combustible: diésel y gasolina dan el mismo paso 3 (el A3 debería cambiar)'); rF.push(false); }
  rF.push((await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: borrador guardado con gasolina y vehículo diésel → se muestra gasolina, aviso, libre, sin reescribir', modo: 'borrador', combVehiculo: 'diesel', fila: { combustible: 'gasolina' }, esperado: 'gasolina', bloqueado: false, aviso: true })).ok);
  rF.push((await escenarioCombustible(browser, baseUrl, { nombre: 'combustible: borrador guardado con diésel y vehículo diésel → bloqueado, sin aviso', modo: 'borrador', combVehiculo: 'diesel', fila: { combustible: 'diesel' }, esperado: 'diesel', bloqueado: true })).ok);
  // feat/recetas-astra (13-14/10): agregados automáticos, adicionales, 4MATIC del vehículo,
  // candado de combustible y recetas que fallan cerradas.
  const rR = [];
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: diésel A → GLOW_TEST (la prueba) y SIN GLOW; la casilla de bujías arranca apagada', combVehiculo: 'diesel', esperado: 'diesel', bloqueado: true, codigo: 'A', presentes: [T_GLOW_TEST], ausentes: [T_GLOW_0] })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: diésel A + casilla "Cambio de bujías de precalentamiento" → suma GLOW', combVehiculo: 'diesel', esperado: 'diesel', bloqueado: true, codigo: 'A', adicional: 'glow', presentes: [T_GLOW_TEST, T_GLOW_0] })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: vehículo 4MATIC (tarjeta) → interruptor prendido y bloqueado, 4M_INSP sin el cambio de diferenciales', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true, codigo: 'B', es4matic: true, cuatroMatic: { on: true, bloqueado: true }, presentes: [T_4M_INSP], ausentes: [T_4M_DIFF] })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: 4MATIC + casilla "Cambio de aceite de diferenciales" → suma 4M_DIFF', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true, codigo: 'B', es4matic: true, adicional: 'diferenciales', cuatroMatic: { on: true, bloqueado: true }, presentes: [T_4M_INSP, T_4M_DIFF] })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: sin dato de 4MATIC → interruptor libre y apagado', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true, codigo: 'B', cuatroMatic: { on: false, bloqueado: false }, ausentes: [T_4M_INSP] })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: código diésel (BD) deshabilitado con 🔒 en un gasolina', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true, codigo: 'A', candado: 'BD' })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: código gasolina (BF) deshabilitado con 🔒 en un diésel', combVehiculo: 'diesel', esperado: 'diesel', bloqueado: true, codigo: 'A', candado: 'BF' })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: la lectura de recetas falla → error con Reintentar, sin códigos ni INICIAR; Reintentar las carga', combVehiculo: 'gasolina', esperado: 'gasolina', bloqueado: true, codigo: 'A', recetasCaidas: true })).ok);
  rR.push((await escenarioCombustible(browser, baseUrl, { nombre: 'recetas: con ?servicio= y la lectura caída, el paso 1 muestra el error con Reintentar y al reintentar se abre el servicio', modo: 'borrador', combVehiculo: 'diesel', fila: { combustible: 'diesel' }, esperado: 'diesel', bloqueado: true, recetasCaidas: true })).ok);
  // Vistas del cliente sin rastro del rechazo (18/10).
  const rV = [];
  rV.push(await escenarioVistaCliente(browser, baseUrl, { nombre: 'vista pública: informe /servicio/:slug de un aprobado con historial de rechazo → sin rastro del rechazo', ruta: '/servicio/SMK123-B-14102026-AB1', filas: [filaAprobadaSmoke({ rechazado: false })] }));
  rV.push(await escenarioVistaCliente(browser, baseUrl, { nombre: 'vista pública: informe de una fila vieja aprobada con la marca todavía en true → sin rastro del rechazo', ruta: '/servicio/SMK123-B-14102026-AB1', filas: [filaAprobadaSmoke({ rechazado: true })] }));
  rV.push(await escenarioVistaCliente(browser, baseUrl, { nombre: 'vista pública: historial por placa con los dos casos → sin rastro del rechazo', ruta: '/historial', placa: 'SMK123', filas: [filaAprobadaSmoke({ rechazado: true }), filaAprobadaSmoke({ id: '00000000-0000-4000-8000-0000000000e2', slug: 'SMK123-A-01092026-ZZ9', servicio_codigo: 'A', rechazado: false })] }));
  const rM = [];
  rM.push(await escenarioMarcas(browser, baseUrl, { nombre: 'marcas: un mantenimiento A no lleva detalles de carrocería', fila: { servicio_codigo: 'A' }, pasos: [['sin-bloque']] }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: RC con lámina → tocar la lámina, elegir el tipo y guardar: punto numerado en el panel y en la cabecera',
    pasos: [['bloque'], ['lamina-cabecera', 0], ['resumen', 'Sin detalles'], ['abrir'], ['tema-panel', 'oscuro'], ['tocar-lamina', [0.25, 0.75]], ['form', 'nueva'], ['punto-pendiente', 1],
      ['guardar'], ['error', 'Elegí el tipo de detalle.'], ['rpcs', 0], ['tipo', 'golpe'], ['descripcion', 'Puerta trasera izquierda'], ['guardar'],
      ['rpc', { fn: 'carroceria_marca_agregar', a: { p_origen: 'revision', p_servicio_id: SVC_ID, p_orden_id: null, p_tipo: 'golpe', p_tipo_otro: null, p_descripcion: 'Puerta trasera izquierda', p_carroceria_codigo: 'W204', p_lamina_version: 'abc123', p_x: 0.25, p_y: 0.75 } }],
      ['sin-form'], ['lista', 1], ['nombres', ['1 Golpe']], ['puntos-panel', ['1']], ['cerrar'], ['lamina-cabecera', 1], ['resumen', '1 detalle']],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: RG sin lámina → el método de la recepción: fotos guiadas y adicionales con descripción, sin tipo',
    fila: { servicio_codigo: 'RG' }, resolver: 'automatico',
    pasos: [['bloque'], ['lamina-cabecera', 'ausente'], ['resumen', 'Sin detalles'], ['abrir'], ['sin-lamina-aviso'], ['sin-tipos'], ['guiadas', 7], ['guiadas-con-foto', 0], ['adicionales', 0],
      ['subir-guiada', 'frente'],
      ['rpc', { fn: 'carroceria_marca_agregar', a: { p_origen: 'revision', p_servicio_id: SVC_ID, p_tipo: null, p_zona: 'frente', p_x: null, p_y: null, p_carroceria_codigo: null, p_foto_url: { empieza: `${SUPA}/storage/v1/object/public/fotos-servicios/marcas/` } } }],
      ['guiadas-con-foto', 1], ['subir-adicional'],
      ['rpc', { fn: 'carroceria_marca_agregar', a: { p_tipo: null, p_zona: null, p_foto_url: { empieza: `${SUPA}/storage/v1/object/public/fotos-servicios/marcas/` } } }],
      ['adicionales', 1], ['describir', [0, 'Rayón en el techo']],
      ['rpc', { fn: 'carroceria_marca_editar', a: { p_tipo: null, p_descripcion: 'Rayón en el techo', p_mover: false, p_foto_url: { empieza: `${SUPA}/storage/v1/object/public/fotos-servicios/marcas/` } } }],
      ['fotos-quitables', 2], ['quitar-foto', 0], ['rpcs', 4], ['guiadas-con-foto', 0], ['adicionales', 1], ['lista', 0], ['cerrar'], ['resumen', '1 foto']],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: la base rechaza el guardado → se ve el motivo, el formulario sigue abierto y la lista no cambia',
    errorRpc: 'no_es_borrador',
    pasos: [['abrir'], ['tocar-lamina', [0.5, 0.5]], ['tipo', 'rayon'], ['guardar'], ['rpcs', 1], ['error', 'La revisión ya se cerró'], ['form', 'nueva'], ['lista', 0]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: lista con una de recepción, una propia y una de otra lámina → el mecánico edita solo las suyas; quitar renumera',
    iniciales: [MARCA_RECEPCION, MARCA_PROPIA, MARCA_OTRA_LAMINA],
    pasos: [['bloque'], ['lamina-cabecera', 2], ['resumen', '3 detalles'], ['abrir'], ['lista', 3], ['nombres', ['1 Rayón', '2 Golpe', '3 Golpe']], ['puntos-panel', ['1', '2']], ['editables', 2],
      ['tocar-lamina', [0.9, 0.1]], ['form', 'nueva'], ['guardar'], ['rpcs', 0]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: quitar un detalle propio pide confirmación, llama a la base y renumera la lista',
    iniciales: [MARCA_RECEPCION, MARCA_PROPIA, MARCA_OTRA_LAMINA],
    pasos: [['abrir'], ['editar', 0], ['form', 'editar'], ['quitar'], ['rpc', { fn: 'carroceria_marca_quitar', a: { p_id: MARCA_PROPIA.id } }], ['sin-form'], ['lista', 2], ['nombres', ['1 Rayón', '2 Golpe']], ['puntos-panel', ['1']], ['editables', 1]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: revisión ya enviada (pendiente) → el mecánico las ve y no puede agregar ni editar; tocar la lámina no hace nada',
    entrada: 'orden', fila: { estado: 'pendiente', orden_id: ORDEN_ID }, iniciales: [MARCA_PROPIA],
    pasos: [['bloque'], ['abrir'], ['sin-agregar'], ['lista', 1], ['editables', 0], ['tocar-lamina', [0.5, 0.5]], ['sin-form'], ['rpcs', 0]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: un jefe sobre una revisión aprobada (sin lámina: no se consulta) → edita también las de recepción y ve las casillas de fotos',
    fila: { estado: 'aprobado', aprobado: true }, usuario: JEFE, iniciales: [MARCA_RECEPCION, FOTO_GUIADA],
    pasos: [['bloque'], ['lamina-cabecera', 'ausente'], ['resumen', '1 detalle · 1 foto'], ['abrir'], ['lista', 1], ['editables', 1], ['guiadas', 7], ['guiadas-con-foto', 1], ['fotos-quitables', 1],
      ['editar', 0], ['form', 'editar'], ['tipo', 'quebradura'], ['guardar'], ['rpc', { fn: 'carroceria_marca_editar', a: { p_id: MARCA_RECEPCION.id, p_tipo: 'quebradura', p_mover: false } }], ['nombres', ['1 Quebradura']]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: con lámina y fotos de cuando no la había → las fotos se muestran, sin ofrecer sumar más; la lista numerada es solo de marcas',
    iniciales: [MARCA_PROPIA, FOTO_GUIADA, FOTO_ADICIONAL],
    pasos: [['bloque'], ['lamina-cabecera', 1], ['resumen', '1 detalle · 2 fotos'], ['abrir'], ['lista', 1], ['nombres', ['1 Golpe']], ['puntos-panel', ['1']], ['guiadas', 1], ['guiadas-con-foto', 1], ['adicionales', 1], ['sin-sumar-fotos'], ['fotos-quitables', 2]],
  }));
  rM.push(await escenarioMarcas(browser, baseUrl, {
    nombre: 'marcas: tema claro → el panel lleva el filtro del tema y la lámina se ve normal',
    tema: 'claro', iniciales: [MARCA_PROPIA],
    pasos: [['bloque'], ['lamina-cabecera', 1], ['abrir'], ['tema-panel', 'claro'], ['lista', 1], ['puntos-panel', ['1']]],
  }));
  code = r1 && r2 && r3 && r4 && rA.every(Boolean) && rC.every(Boolean) && rF.every(Boolean) && rR.every(Boolean) && rV.every(Boolean) && rM.every(Boolean) ? 0 : 1;
  console.log(code === 0 ? 'smoke OK: la app carga sin errores en todos los escenarios' : 'smoke FALLÓ: ver arriba (no mergear)');
} catch (e) {
  console.error('smoke: error del propio script:', e);
  code = 1;
} finally {
  await browser?.close().catch(() => {});
  await new Promise((r) => (server?.httpServer ? server.httpServer.close(() => r()) : r()));
  process.exit(code);
}
