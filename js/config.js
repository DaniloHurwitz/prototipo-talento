// Todo lo que se cambia a mano está acá.
// Para renombrar la plataforma, cambiá APP.name y listo.
window.APP = {
  name: "Cursada",
  storageKey: "cursada-demo-v1",
  connects: {
    free: 20,          // Connects con los que arranca cada estudiante
    defaultCost: 2,    // costo de una postulación común
    packs: [
      { id: "p10", amount: 10, usd: 1.5 },
      { id: "p30", amount: 30, usd: 4 },
      { id: "p80", amount: 80, usd: 9 },
    ],
  },
  // Dirección pública de la app: es a donde vuelve el link del mail.
  // Tiene que estar también en Supabase > Authentication > URL Configuration.
  siteUrl: "https://danilohurwitz.github.io/prototipo-talento/",
  // Datos públicos del proyecto de Supabase (la clave "publishable" está pensada para ir en el navegador).
  // NUNCA pongas acá la clave "secret" / service_role.
  supabase: {
    url: "https://bsgxkgzvymtyizcangaz.supabase.co",
    anonKey: "sb_publishable_GCCYGs7pUKf9GRMTVR9kdw_dwA_UB5V",
  },
  commissionDefault: 10, // % que paga la empresa sobre lo facturado
  // Fecha "de hoy" fija para que la demo se vea igual siempre
  today: "2026-11-13",
};
