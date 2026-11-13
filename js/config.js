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
  commissionDefault: 10, // % que paga la empresa sobre lo facturado
  // Fecha "de hoy" fija para que la demo se vea igual siempre
  today: "2026-11-13",
};
