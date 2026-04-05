import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ClientReport from './ClientReport.jsx'
import ClientHistory from './ClientHistory.jsx'

function Router() {
  const path = window.location.pathname;

  // ── Rutas públicas (sin PIN) ──
  const serviceMatch = path.match(/^\/servicio\/(.+)$/);
  if (serviceMatch) return <ClientReport binId={serviceMatch[1]} />;
  if (path === "/historial" || path === "/cliente") return <ClientHistory />;

  // ── App del taller (con PIN) ──
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>
)
