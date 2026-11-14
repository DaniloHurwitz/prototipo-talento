// Conexión a Supabase. Usa solo la clave pública (publishable): nunca la service_role.
(function () {
  // Guardo lo que vino en la dirección antes de que Supabase lo limpie:
  // cuando el link del mail falla, el motivo llega acá (#error=...).
  window.__authHash = location.hash;

  window.sb = window.supabase.createClient(APP.supabase.url, APP.supabase.anonKey, {
    auth: {
      flowType: "implicit",     // el link funciona aunque lo abras en otro dispositivo
      persistSession: true,     // seguís adentro al cerrar y volver a abrir
      autoRefreshToken: true,
      detectSessionInUrl: true, // lee la sesión cuando volvés desde el mail
    },
  });
})();
