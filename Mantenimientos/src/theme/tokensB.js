// ⚠⚠ ARCHIVO GEMELO de Taller (src/theme/tokensB.js): mismos nombres y mismos
// valores, copiados exactos. Los dos cambian JUNTOS, en el mismo movimiento
// (feat/tema-b-mantenimientos, 18/10/2026). Debajo de este comentario, el
// archivo de Taller tal cual.
//
// Tema B — rediseño de Repuestos (propuesta B, rama feat/rediseno-repuestos).
//
// Paleta LOCAL: la usan solo Repuestos y lo que cuelga de Repuestos (el kanban,
// la lista móvil, sus modales y el cotizador). El resto de la app sigue con C
// (tokens.js), que NO se toca.
//
// Todo color va en hex de 6 cifras para que sigan funcionando los sufijos de
// transparencia que usa el código (T.accent + '66'). Las únicas excepciones son
// los bordes en rgba y el fondo de modal: van siempre enteros, sin sufijo; para
// un borde con sufijo está `border`, sólido.
export const T = {
  bg: '#0B0B0D',

  // superficies, de la más hundida a la más alta
  shell: '#0F1112',
  sunken: '#0D0F10',
  field: '#141719',
  panel: '#191C1E',
  card: '#202325',
  raised: '#26292B',
  raisedHover: '#2E3133',
  control: '#2A2D2F',
  avatar: '#292C2E',

  // texto
  text: '#F2F0EB',
  textSoft: '#ABA9A4',
  textMuted: '#8A8D90',
  textDisabled: '#5C6064',

  // acento (champagne): solo donde algo está activo, elegido o es la acción principal
  accent: '#C8A96E',
  accentHover: '#D9BE8A',
  accentMuted: '#A09580',

  // semánticos
  ok: '#78A88A',
  warn: '#C7A16C',
  crit: '#C87873',
  info: '#839EB8',
  neutral: '#92969A',

  // bordes
  border: '#25282A',                        // sólido: para cuando haga falta sufijo
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderDefault: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.11)',

  // estados de cotización, por el id de ESTADOS_COTIZACION ('listo' = "Por agendar")
  estado: {
    por_cotizar: '#C87873',
    cotizado: '#C7A16C',
    aprobado: '#78A88A',
    en_camino: '#839EB8',
    listo: '#A193C2',
    agendado: '#7FA9A3',
    en_taller: '#C29A7C',
    cobrado: '#6E9A7E',
    perdido: '#6F7377',
  },

  // placa
  plateBg: '#E6E3DC',
  plateText: '#15181A',

  // fondo de modal: un único valor dentro del alcance
  overlay: 'rgba(5,6,7,0.66)',

  radio: { panel: 12, card: 9, control: 8, small: 7, badge: 5, plate: 4 },

  sans: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
}

// La misma paleta con las CLAVES de C (tokens.js), para los componentes
// compartidos que leen la paleta por clave (C.gold, C.muted…): con el tema B
// reciben esto y quedan con los colores nuevos sin reescribirse. `gold` era el
// acento de la app y pasa a ser el acento champagne.
export const CB = {
  bg: T.sunken,
  surface: T.panel,
  surface2: T.card,
  border: T.border,
  gold: T.accent,
  goldDim: T.accentMuted,
  text: T.text,
  muted: T.textMuted,
  red: T.crit,
  green: T.ok,
  blue: T.info,
  amber: T.warn,
  purple: T.estado.listo,
}

// Color de un estado de cotización en el tema B (estado desconocido → neutral).
export const colorEstadoB = id => T.estado[id] || T.neutral
