import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ClientReport from './ClientReport.jsx'
import ClientHistory from './ClientHistory.jsx'

function Router() {
  const path = window.location.pathname;
  const serviceMatch = path.match(/^\/servicio\/(.+)$/);
  if (serviceMatch) return <ClientReport binId={serviceMatch[1]} />;
  if (path === "/historial" || path === "/cliente") return <ClientHistory />;
  return <App />;
}

const rootEl = document.getElementById('root');
createRoot(rootEl).render(
  <StrictMode>
    <Router />
  </StrictMode>
);

// Restaurar tema claro si estaba activo
try {
  if (localStorage.getItem('theme') === 'light') {
    rootEl.style.filter = 'invert(1) hue-rotate(180deg)';
    // Re-invertir imágenes después de que React renderice
    setTimeout(() => {
      rootEl.querySelectorAll('img, canvas').forEach(el => {
        el.style.filter = 'invert(1) hue-rotate(180deg)';
      });
    }, 300);
  }
} catch(e) {}
