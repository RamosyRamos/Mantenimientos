import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ClientReport from './ClientReport.jsx'

function Router() {
  const path = window.location.pathname;
  const match = path.match(/^\/servicio\/(.+)$/);
  if (match) return <ClientReport binId={match[1]} />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>
)
