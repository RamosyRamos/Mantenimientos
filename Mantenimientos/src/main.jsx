import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ClientReport from './ClientReport.jsx'
import ClientHistory from './ClientHistory.jsx'
import ActualizacionBanner from './ActualizacionBanner.jsx'
import { instalarRecargaPorChunkPerdido } from './lib/version.js'

function Router() {
  const path = window.location.pathname;
  const serviceMatch = path.match(/^\/servicio\/(.+)$/);
  if (serviceMatch) return <ClientReport binId={serviceMatch[1]} />;
  if (path === "/historial" || path === "/cliente") return <ClientHistory />;
  return <App />;
}

const rootEl = document.getElementById('root');
// Staleness de PWA (#2977): chunk con hash viejo tras un deploy → una recarga
// (guard en sessionStorage). Ver src/lib/version.js.
instalarRecargaPorChunkPerdido();

createRoot(rootEl).render(
  <StrictMode>
    <Router />
    {/* Banner de versión nueva + recarga segura al volver de horas oculta */}
    <ActualizacionBanner />
  </StrictMode>
);

// Restaurar tema claro si estaba activo — SOLO en la app interna (App.jsx,
// que escribe localStorage.theme y depende de este restore al recargar).
// Las vistas de cliente /servicio y /historial son claras de por sí:
// el filtro invert las rompería.
try {
  const path = window.location.pathname;
  const esVistaCliente = path.startsWith('/servicio/') || path === '/historial' || path === '/cliente';
  if (!esVistaCliente && localStorage.getItem('theme') === 'light') {
    rootEl.style.filter = 'invert(1) hue-rotate(180deg)';
    // Re-invertir imágenes después de que React renderice
    setTimeout(() => {
      rootEl.querySelectorAll('img, canvas').forEach(el => {
        el.style.filter = 'invert(1) hue-rotate(180deg)';
      });
    }, 300);
  }
} catch(e) {}
