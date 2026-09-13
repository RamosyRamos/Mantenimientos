/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// ── Staleness de PWA (#2977) — identificador de build ──────────────────────
// Mismo patrón que Taller/vite.config.js: cada build lleva un id (__BUILD_ID__)
// y publica el MISMO id en /version.json; src/lib/version.js compara los dos y
// avisa cuando hay una versión nueva (ver ese archivo).
// Fuente del id, en orden: commit de Vercel (VERCEL_GIT_COMMIT_SHA) → git local
// → timestamp (build sin git). Siempre distinto entre deploys.
function buildId() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  if (sha) return sha.slice(0, 12)
  try { return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || String(Date.now()) }
  catch { return String(Date.now()) }
}

function versionPlugin() {
  const id = buildId()
  const cuerpo = () => JSON.stringify({ build: id, at: new Date().toISOString() })
  return {
    name: 'ryr-version',
    config: () => ({ define: { __BUILD_ID__: JSON.stringify(id) } }),
    // dist/version.json: lo que el cliente consulta con cache: 'no-store'.
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: cuerpo() }) },
    // En dev el detector está apagado (import.meta.env.DEV), pero el archivo
    // existe igual para poder probar el fetch a mano.
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(cuerpo()) })
    },
  }
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
})
