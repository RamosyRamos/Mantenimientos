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
const JEFE = { ...USUARIO, rol: 'jefe' };
async function escenarioAceite(browser, baseUrl, { nombre, fila, resolver, elegir = null, esperado, etiqueta = false, origen = null, textos = [], ausentes = [], presentes = [], sinPatch = false, sinResolver = false, usuario = USUARIO, cuerpo = null }) {
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
    return req.respond({ status: 204, headers: CORS, body: '' });
  });
  await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, usuario);
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
  await context.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (PATCH: ${sinPatch ? 'ninguno' : JSON.stringify({ aceite_litros: p.aceite_litros, aceite_spec: p.aceite_spec })} · resolver: ${llamadas.length})`);
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
  code = r1 && r2 && r3 && r4 && rA.every(Boolean) ? 0 : 1;
  console.log(code === 0 ? 'smoke OK: la app carga sin errores en los diez escenarios' : 'smoke FALLÓ: ver arriba (no mergear)');
} catch (e) {
  console.error('smoke: error del propio script:', e);
  code = 1;
} finally {
  await browser?.close().catch(() => {});
  await new Promise((r) => (server?.httpServer ? server.httpServer.close(() => r()) : r()));
  process.exit(code);
}
