// ── Cliente Supabase (F4 Sesión E) ────────────────────────────────────────────
// Mantenimientos tiene sesión PROPIA de Supabase Auth (teléfono + OTP por SMS,
// una vez por teléfono). Mismos nombres de env que el resto de la app.
// Solo se usa para auth (signInWithOtp / verifyOtp / getSession / signOut) y
// para los RPC (mi_usuario, aprobar_correccion_aceite): el resto de las
// llamadas REST/storage siguen en apiFetch, que toma el JWT de acá.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
