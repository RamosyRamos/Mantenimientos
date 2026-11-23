// ── Marcas de carrocería: golpes, rayones y quebraduras sobre la lámina (feat/marcas-carroceria, 23/11/2026) ──
//
// ⚠ ARCHIVO GEMELO — vive DUPLICADO, byte a byte, en los dos repos:
//     Taller          → src/lib/marcasCarroceria.js
//     Mantenimientos  → Mantenimientos/src/lib/marcasCarroceria.js
//   TODO cambio acá se copia al otro repo en el mismo movimiento (los dos deben
//   dar el MISMO sha256). Puro: sin React, sin red, sin imports.
//
// Decisiones de Tavo (22 y 23/11/2026):
// - Sobre la lámina técnica se marcan los detalles del carro: golpe, rayón,
//   quebradura u "otro" (con su texto). Cada marca puede llevar foto y
//   descripción.
// - Sin lámina se usa el método de la recepción, igual: siete fotos guiadas
//   (frente, trasero, laterales, interior, motor, tablero) y fotos adicionales
//   con su descripción, sin elegir tipo.
// - Va en las revisiones RC y RG y en la recepción, y es UNA lista por orden.
// - Todo vive en la tabla `carroceria_marcas`, una fila por MARCA (con `tipo`) o
//   por FOTO (sin `tipo`: guiada si tiene `zona`, adicional si no), y se escribe
//   solo por las funciones carroceria_marca_agregar / _editar / _quitar.
// - El punto (x, y) es una fracción de la imagen de la lámina, con el código de
//   la carrocería sobre la que se tocó. Solo se dibuja si la lámina de hoy es la
//   de ese código: nunca un punto sobre un dibujo que no es el suyo.

export const TABLA_MARCAS = 'carroceria_marcas';
export const TIPOS_MARCA = ['golpe', 'rayon', 'quebradura', 'otro'];
export const ETIQUETA_TIPO = { golpe: 'Golpe', rayon: 'Rayón', quebradura: 'Quebradura', otro: 'Otro' };
export const ORIGEN_RECEPCION = 'recepcion';
export const ORIGEN_REVISION = 'revision';
export const ETIQUETA_ORIGEN = { recepcion: 'Recepción', revision: 'Revisión' };
export const MAX_OTRO = 60;
export const MAX_DESCRIPCION = 500;
export const MAX_MARCAS = 60;
// Las casillas de las fotos guiadas: las mismas siete de la recepción de Taller
// (GUIDED_SLOTS), con las mismas claves y los mismos rótulos.
export const ZONAS_GUIADAS = [
  { key: 'frente', label: 'Frente' },
  { key: 'trasero', label: 'Trasero' },
  { key: 'lat_der', label: 'Lat. Der.' },
  { key: 'lat_izq', label: 'Lat. Izq.' },
  { key: 'interior', label: 'Interior' },
  { key: 'motor', label: 'Motor' },
  { key: 'tablero', label: 'Tablero' },
];
export const MAX_FOTOS_ADICIONALES = 15;
export const ROLES_MARCAS = ['jefe', 'admin'];

const limpio = (s) => String(s ?? '').trim();
const esFraccion = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
const aNumero = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidONull = (v) => (RE_UUID.test(limpio(v)) ? limpio(v) : null);

// Lo que se lee de cada fila.
export const COLUMNAS_MARCA = 'id, orden_id, servicio_id, origen, tipo, tipo_otro, zona, descripcion, foto_url, carroceria_codigo, lamina_version, x, y, creado_por, creado_por_id, created_at, editado_at, eliminada_at';

// El nombre de una marca: su tipo, o el texto de "otro".
export function etiquetaMarca(m) {
  if (m?.tipo === 'otro') return limpio(m?.tipo_otro) || ETIQUETA_TIPO.otro;
  return ETIQUETA_TIPO[m?.tipo] || ETIQUETA_TIPO.otro;
}

const porCreacion = (a, b) => {
  const ta = String(a.created_at || '');
  const tb = String(b.created_at || '');
  if (ta !== tb) return ta < tb ? -1 : 1;
  return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
};
const vigentes = (filas) => (Array.isArray(filas) ? filas : []).filter((m) => m && m.id && !m.eliminada_at);

// Una fila sin `tipo` es una FOTO (guiada o adicional); con `tipo`, una MARCA.
export const esFoto = (m) => !!m && !limpio(m.tipo);

// Las MARCAS vigentes (sin las quitadas y sin las fotos), en el orden en que se
// hicieron y con su número (1, 2, 3…). El número es la posición de hoy: si se
// quita una, las que siguen se corren.
export function marcasVigentes(filas) {
  return vigentes(filas).filter((m) => !esFoto(m)).sort(porCreacion).map((m, i) => ({ ...m, numero: i + 1 }));
}

// Las fotos guiadas vigentes, por casilla: { frente: fila, … }. Si hubiera más
// de una por casilla, vale la más nueva.
export function fotosGuiadas(filas) {
  const claves = ZONAS_GUIADAS.map((z) => z.key);
  const out = {};
  for (const m of vigentes(filas).filter((x) => esFoto(x) && claves.includes(x.zona)).sort(porCreacion)) out[m.zona] = m;
  return out;
}

// Las fotos adicionales vigentes (sin casilla), en el orden en que se subieron.
export function fotosAdicionales(filas) {
  return vigentes(filas).filter((m) => esFoto(m) && !limpio(m.zona)).sort(porCreacion);
}

// Datos de la lámina a partir de su URL pública del bucket:
//   …/vehiculos-carrocerias/<codigo>/lamina.webp?v=<version>
// Sin URL, o con una que no es de una lámina, null.
export function laminaDeUrl(url) {
  const u = limpio(url);
  const m = /\/vehiculos-carrocerias\/([^/?#]+)\/lamina\.[a-z0-9]+(?:\?([^#]*))?(?:#.*)?$/i.exec(u);
  if (!m) return null;
  let codigo = m[1];
  try { codigo = decodeURIComponent(codigo); } catch { /* se deja como vino */ }
  const v = /(?:^|&)v=([^&]*)/.exec(m[2] || '');
  return { url: u, codigo, version: v ? v[1] : null };
}

// El punto de una marca sobre la lámina de HOY: { x, y } en fracción, o null si
// la marca no tiene punto o se hizo sobre otra carrocería.
export function puntoDeMarca(m, codigoActual) {
  const codigo = limpio(codigoActual);
  if (!codigo || limpio(m?.carroceria_codigo) !== codigo) return null;
  const x = aNumero(m?.x);
  const y = aNumero(m?.y);
  if (!esFraccion(x) || !esFraccion(y)) return null;
  return { x, y };
}

// ¿La marca tiene un punto guardado, aunque hoy no se pueda dibujar?
export function tienePuntoGuardado(m) {
  return esFraccion(aNumero(m?.x)) && esFraccion(aNumero(m?.y));
}

// Del toque en pantalla al punto en fracción de la imagen. `rect` es el
// getBoundingClientRect de la IMAGEN (no de su contenedor). Un toque fuera de la
// imagen, o una imagen sin tamaño, da null.
export function puntoDesdeToque(toque, rect) {
  const ancho = Number(rect?.width);
  const alto = Number(rect?.height);
  if (!(ancho > 0) || !(alto > 0)) return null;
  const x = (Number(toque?.clientX) - Number(rect.left)) / ancho;
  const y = (Number(toque?.clientY) - Number(rect.top)) / alto;
  if (!esFraccion(x) || !esFraccion(y)) return null;
  const r = (n) => Math.round(n * 100000) / 100000;
  return { x: r(x), y: r(y) };
}

// Borrador de una marca nueva, o el de una que se edita.
export function borradorMarca(m) {
  return {
    tipo: TIPOS_MARCA.includes(m?.tipo) ? m.tipo : '',
    tipo_otro: limpio(m?.tipo_otro),
    descripcion: String(m?.descripcion ?? ''),
    foto_url: limpio(m?.foto_url) || null,
  };
}

// Qué le falta al borrador para guardarse: un texto para mostrar, o null.
export function problemaMarca(b) {
  if (!TIPOS_MARCA.includes(b?.tipo)) return 'Elegí el tipo de detalle.';
  if (b.tipo === 'otro' && !limpio(b?.tipo_otro)) return 'Escribí qué es el detalle.';
  if (limpio(b?.tipo_otro).length > MAX_OTRO) return `El nombre del detalle no puede pasar de ${MAX_OTRO} letras.`;
  if (limpio(b?.descripcion).length > MAX_DESCRIPCION) return `La descripción no puede pasar de ${MAX_DESCRIPCION} letras.`;
  return null;
}

const contenido = (b) => ({
  p_tipo: b.tipo,
  p_tipo_otro: b.tipo === 'otro' ? limpio(b.tipo_otro) : null,
  p_descripcion: limpio(b.descripcion) || null,
  p_foto_url: limpio(b.foto_url) || null,
});

const puntoParaGuardar = (punto, lamina) => {
  const ok = punto && esFraccion(punto.x) && esFraccion(punto.y) && limpio(lamina?.codigo);
  return ok
    ? { p_carroceria_codigo: limpio(lamina.codigo), p_lamina_version: limpio(lamina.version) || null, p_x: punto.x, p_y: punto.y }
    : { p_carroceria_codigo: null, p_lamina_version: null, p_x: null, p_y: null };
};

// Argumentos de carroceria_marca_agregar. En una revisión manda el servicio (la
// orden la pone la base a partir de él); en la recepción, la orden.
export function argumentosAgregar({ origen, ordenId, servicioId, borrador, punto, lamina } = {}) {
  const revision = origen === ORIGEN_REVISION;
  return {
    p_origen: revision ? ORIGEN_REVISION : ORIGEN_RECEPCION,
    p_orden_id: revision ? null : uuidONull(ordenId),
    p_servicio_id: revision ? uuidONull(servicioId) : null,
    ...contenido(borrador || {}),
    ...puntoParaGuardar(punto, lamina),
    p_zona: null,
  };
}

const SIN_PUNTO = { p_carroceria_codigo: null, p_lamina_version: null, p_x: null, p_y: null };

// Argumentos de carroceria_marca_agregar para una FOTO de la revisión: guiada
// (con su casilla; reemplaza a la que hubiera) o adicional (sin casilla).
export function argumentosFoto({ servicioId, zona, fotoUrl, descripcion } = {}) {
  return {
    p_origen: ORIGEN_REVISION,
    p_orden_id: null,
    p_servicio_id: uuidONull(servicioId),
    p_tipo: null,
    p_tipo_otro: null,
    p_descripcion: limpio(descripcion) || null,
    p_foto_url: limpio(fotoUrl) || null,
    ...SIN_PUNTO,
    p_zona: limpio(zona) || null,
  };
}

// Argumentos de carroceria_marca_editar para una FOTO: su descripción (la foto
// viaja igual: una foto nunca queda sin foto).
export function argumentosEditarFoto({ id, descripcion, fotoUrl } = {}) {
  return {
    p_id: uuidONull(id),
    p_tipo: null,
    p_tipo_otro: null,
    p_descripcion: limpio(descripcion) || null,
    p_foto_url: limpio(fotoUrl) || null,
    p_mover: false,
    ...SIN_PUNTO,
  };
}

// Argumentos de carroceria_marca_editar. El punto solo se toca con `mover`
// (con `punto` en null, lo quita).
export function argumentosEditar({ id, borrador, mover = false, punto, lamina } = {}) {
  return {
    p_id: uuidONull(id),
    ...contenido(borrador || {}),
    p_mover: !!mover,
    ...(mover ? puntoParaGuardar(punto, lamina) : { p_carroceria_codigo: null, p_lamina_version: null, p_x: null, p_y: null }),
  };
}

const MENSAJES = {
  sin_sesion: 'Tu sesión venció: volvé a entrar.',
  no_autorizado: 'No podés cambiar este detalle.',
  no_encontrado: 'Ese detalle ya no existe.',
  no_es_revision: 'Los detalles de carrocería van solo en las revisiones de compra y general.',
  no_es_borrador: 'La revisión ya se cerró: los detalles los cambia un jefe.',
  destino_invalido: 'Falta la orden o la revisión del detalle.',
  tipo_invalido: 'Elegí el tipo de detalle.',
  falta_otro: 'Escribí qué es el detalle.',
  foto_invalida: 'La foto no se pudo guardar. Volvé a tomarla.',
  punto_invalido: 'El punto no cayó sobre la lámina. Tocá de nuevo.',
  demasiadas: `Ya hay ${MAX_MARCAS} detalles: no se pueden agregar más.`,
  falta_foto: 'Falta la foto.',
  zona_invalida: 'Esa casilla de foto no existe.',
  demasiadas_fotos: `Ya hay ${MAX_FOTOS_ADICIONALES} fotos adicionales: no se pueden agregar más.`,
};
export function mensajeMarca(codigo) {
  return MENSAJES[codigo] || 'No se pudo guardar el detalle. Probá de nuevo.';
}

// Resultado de una de las tres funciones. `data` es lo que devolvió la RPC y
// `error` el error de red o de PostgREST (un texto o un objeto con message).
// Una respuesta sin `ok: true` nunca cuenta como guardada.
export function resultadoMarca(data, error) {
  if (error) {
    const detalle = limpio(typeof error === 'string' ? error : error?.message);
    return { ok: false, codigo: 'red', marca: null, mensaje: detalle ? `No se pudo guardar el detalle (${detalle}).` : mensajeMarca() };
  }
  if (data && data.ok === true) return { ok: true, codigo: null, marca: data.marca || null, mensaje: null };
  const codigo = limpio(data?.error) || 'desconocido';
  return { ok: false, codigo, marca: null, mensaje: mensajeMarca(codigo) };
}

// Filtro de PostgREST para leer la lista: las marcas de la orden, más las de
// los servicios dados (una revisión sin orden, o que se ligó después). Sin
// ninguno de los dos, null: no hay nada que leer.
export function filtroMarcas({ ordenId, servicioIds } = {}) {
  const partes = [];
  const orden = uuidONull(ordenId);
  if (orden) partes.push(`orden_id.eq.${orden}`);
  const servicios = [...new Set((Array.isArray(servicioIds) ? servicioIds : [servicioIds]).map(uuidONull).filter(Boolean))];
  if (servicios.length === 1) partes.push(`servicio_id.eq.${servicios[0]}`);
  else if (servicios.length > 1) partes.push(`servicio_id.in.(${servicios.join(',')})`);
  return partes.length ? partes.join(',') : null;
}

// ¿Esta persona puede editar o quitar la marca? La misma regla que aplica la
// base: jefe o admin siempre; quien la hizo, mientras su revisión siga en
// borrador. Es para decidir qué botones mostrar; la base vuelve a comprobarlo.
export function puedeModificarMarca(m, { sessionId, rol, estadoServicio } = {}) {
  if (!m || m.eliminada_at) return false;
  if (ROLES_MARCAS.includes(rol)) return true;
  if (m.origen !== ORIGEN_REVISION) return false;
  return !!limpio(sessionId) && limpio(m.creado_por_id) === limpio(sessionId) && estadoServicio === 'borrador';
}

// ¿Esta persona puede agregar una marca en la revisión? Jefe o admin, en
// cualquier estado menos descartado; el resto, solo en borrador.
export function puedeAgregarEnRevision({ rol, estadoServicio } = {}) {
  if (estadoServicio === 'descartado') return false;
  if (ROLES_MARCAS.includes(rol)) return true;
  return estadoServicio === 'borrador';
}

// "3 detalles", "1 detalle · 4 fotos", "2 fotos" o "Sin detalles".
export function resumenMarcas(filas) {
  const n = marcasVigentes(filas).length;
  const f = Object.keys(fotosGuiadas(filas)).length + fotosAdicionales(filas).length;
  const partes = [];
  if (n) partes.push(n === 1 ? '1 detalle' : `${n} detalles`);
  if (f) partes.push(f === 1 ? '1 foto' : `${f} fotos`);
  return partes.length ? partes.join(' · ') : 'Sin detalles';
}
