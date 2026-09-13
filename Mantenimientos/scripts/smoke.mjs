// scripts/smoke.mjs — "build OK no significa carga OK".
//
// Buildea la app, la sirve con `vite preview` y la carga en Chrome headless (puppeteer)
// en dos escenarios: SIN sesión (debe renderizar LoginScreen) y CON sesión sembrada en
// localStorage (debe renderizar MainApp). Falla ante cualquier error de JS de la página
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

async function escenario(browser, baseUrl, { nombre, conSesion }) {
  const page = await browser.newPage();
  const errores = [];
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
    if (u.startsWith(baseUrl)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
    if (SUPA && u.startsWith(SUPA)) {
      if (u.includes('/rest/v1/rpc/mi_usuario')) return req.respond(json(JSON.stringify(USUARIO)));
      if (u.includes('/rest/v1/')) return req.respond(json('[]'));
      return req.respond(json('{}'));
    }
    return req.respond({ status: 204, headers: CORS, body: '' }); // fuentes u otros terceros: nada sale a internet
  });

  if (conSesion) await page.evaluateOnNewDocument(sembrarSesion(), REF, UID, USUARIO);

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
  const muestraLogin = estado.texto.includes(TEXTO_LOGIN);
  if (conSesion && muestraLogin) errores.push('con sesión sembrada sigue en LoginScreen (mi_usuario mock no aplicó o la sesión se descartó)');
  if (!conSesion && !muestraLogin) errores.push(`sin sesión no muestra LoginScreen: "${estado.texto.slice(0, 120)}"`);

  await page.close();
  const ok = errores.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}  (#root ${estado.rootLen} chars)`);
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
  code = r1 && r2 ? 0 : 1;
  console.log(code === 0 ? 'smoke OK: la app carga sin errores en los dos escenarios' : 'smoke FALLÓ: ver arriba (no mergear)');
} catch (e) {
  console.error('smoke: error del propio script:', e);
  code = 1;
} finally {
  await browser?.close().catch(() => {});
  await new Promise((r) => (server?.httpServer ? server.httpServer.close(() => r()) : r()));
  process.exit(code);
}
