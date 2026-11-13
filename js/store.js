// Estado de la demo en localStorage. Sin servidor.
window.Store = (function () {
  const key = APP.storageKey;

  function fresh() {
    const s = JSON.parse(JSON.stringify(SEED));
    return {
      students: s.students,
      companies: s.companies,
      offers: s.offers,
      applications: s.applications,
      contracts: s.contracts,
      purchases: s.purchases,
      commission: APP.commissionDefault,
      session: { studentId: null, companyId: null },
      lang: "es",
      seq: 100,
    };
  }

  let db;
  try {
    db = JSON.parse(localStorage.getItem(key)) || fresh();
  } catch (e) {
    db = fresh();
  }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(db)); } catch (e) { /* modo privado: la demo sigue en memoria */ }
  }
  function reset() { db = fresh(); save(); }
  function id(prefix) { db.seq += 1; save(); return prefix + db.seq; }

  return {
    get db() { return db; },
    save, reset, id,
  };
})();
