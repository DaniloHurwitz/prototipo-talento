// Cursada, prototipo navegable. Vanilla JS, sin dependencias.
(function () {
  const S = SEED;
  const db = () => Store.db;
  const ui = { notice: null, filters: {}, cFilters: {}, errors: {}, form: {}, sort: "new" };

  /* ---------- utilidades ---------- */
  const h = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const byId = (list, id) => list.find((x) => x.id === id);
  const student = (id) => byId(db().students, id);
  const company = (id) => byId(db().companies, id);
  const offer = (id) => byId(db().offers, id);
  const lang = () => db().lang || "es";
  const area = (id, l) => { const a = byId(S.AREAS, id); return a ? a[l || "es"] : id; };
  const langName = (id, l) => { const a = byId(S.LANGS, id); return a ? a[l || "es"] : id; };
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const money = (n, dec) => "USD " + Number(n).toLocaleString("es-AR", { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: 2 });
  const rateRange = (o) => `USD ${o.min}–${o.max} /h`;
  const levelRank = (lv) => S.LEVELS.indexOf(lv);

  function daysAgo(iso) {
    return Math.round((new Date(APP.today) - new Date(iso)) / 86400000);
  }
  function when(iso, l) {
    const d = daysAgo(iso);
    if (l === "en") return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
    return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
  }
  function dateShort(iso, l) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(l === "en" ? "en-GB" : "es-AR", { day: "numeric", month: "short" });
  }
  function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

  const APP_STATUS = {
    enviada: { es: "Enviada", en: "Sent", cls: "" },
    vista: { es: "Vista por la empresa", en: "Viewed", cls: "" },
    entrevista: { es: "Entrevista", en: "Interview", cls: "warn" },
    contratada: { es: "Contratada", en: "Hired", cls: "ok" },
    no_seleccionada: { es: "No seleccionada", en: "Not selected", cls: "bad" },
    invitacion: { es: "Te invitaron", en: "Invited", cls: "ink" },
    rechazada_por_vos: { es: "Invitación rechazada", en: "Declined by student", cls: "bad" },
  };
  const PROFILE_STATUS = {
    aprobado: { es: "Aprobado", en: "Approved", cls: "ok" },
    pendiente: { es: "En revisión", en: "Under review", cls: "warn" },
    rechazado: { es: "Rechazado", en: "Rejected", cls: "bad" },
  };
  const statusTag = (map, key, l) => { const s = map[key] || { es: key, en: key, cls: "" }; return `<span class="status ${s.cls}">${h(s[l || "es"])}</span>`; };

  function setNotice(text, kind) { ui.notice = { text, kind: kind || "ok" }; }
  function noticeHtml() {
    if (!ui.notice) return "";
    const n = ui.notice; ui.notice = null;
    return `<div class="notice ${n.kind}" role="status">${n.text}</div>`;
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ---------- cálculos ---------- */
  function appsFor(offerId) { return db().applications.filter((a) => a.offerId === offerId); }
  function myApp(offerId, studentId) { return db().applications.find((a) => a.offerId === offerId && a.studentId === studentId); }
  function revenue() {
    const d = db();
    const rows = d.contracts.map((k) => {
      const a = byId(d.applications, k.applicationId);
      const o = a && offer(a.offerId);
      const s = a && student(a.studentId);
      if (!a || !o || !s) return null;
      const billed = k.hoursMonth * a.rate;
      return { k, a, o, s, c: company(o.companyId), billed, fee: billed * d.commission / 100 };
    }).filter(Boolean);
    const billed = rows.reduce((t, r) => t + r.billed, 0);
    const fees = rows.reduce((t, r) => t + r.fee, 0);
    const buys = d.purchases.map((p) => ({ p, pack: byId(APP.connects.packs, p.packId), s: student(p.studentId) })).filter((x) => x.pack && x.s);
    const connectsUsd = buys.reduce((t, x) => t + x.pack.usd, 0);
    return { rows, billed, fees, buys, connectsUsd, total: fees + connectsUsd };
  }

  /* ---------- formularios ---------- */
  function formData(form) {
    const o = {};
    new FormData(form).forEach((v, k) => {
      if (k in o) o[k] = [].concat(o[k], v); else o[k] = v;
    });
    return o;
  }
  function err(name) { return ui.errors[name] ? `<p class="field-error" id="err-${name}">${h(ui.errors[name])}</p>` : ""; }
  function inv(name) { return ui.errors[name] ? ` aria-invalid="true" aria-describedby="err-${name}"` : ""; }
  function val(name, fallback) { return h(ui.form[name] != null ? ui.form[name] : fallback == null ? "" : fallback); }
  function input(name, labelText, opts) {
    opts = opts || {};
    return `<div class="field${opts.full ? " full" : ""}">
      <label for="f-${name}">${labelText}${opts.hint ? ` <span class="hint">${opts.hint}</span>` : ""}</label>
      <input id="f-${name}" name="${name}" type="${opts.type || "text"}" value="${val(name, opts.value)}"${opts.attrs || ""}${inv(name)}>
      ${err(name)}</div>`;
  }
  function select(name, labelText, options, opts) {
    opts = opts || {};
    const cur = ui.form[name] != null ? ui.form[name] : opts.value;
    return `<div class="field${opts.full ? " full" : ""}">
      <label for="f-${name}">${labelText}</label>
      <select id="f-${name}" name="${name}"${inv(name)}>${options.map(([v, t]) => `<option value="${h(v)}"${String(v) === String(cur) ? " selected" : ""}>${h(t)}</option>`).join("")}</select>
      ${err(name)}</div>`;
  }
  function textarea(name, labelText, opts) {
    opts = opts || {};
    return `<div class="field full">
      <label for="f-${name}">${labelText}${opts.hint ? ` <span class="hint">${opts.hint}</span>` : ""}</label>
      <textarea id="f-${name}" name="${name}"${opts.attrs || ""}${inv(name)}>${val(name, opts.value)}</textarea>
      ${err(name)}</div>`;
  }
  function clearForm() { ui.errors = {}; ui.form = {}; }

  /* ---------- marco ---------- */
  function topbar(view) {
    const d = db();
    let extra = "";
    if (view === "e" && d.session.studentId && student(d.session.studentId)) {
      const n = student(d.session.studentId).connects;
      extra = `<a class="connects-chip${n < 4 ? " low" : ""}" href="#/e/connects" title="Tu saldo de Connects"><strong>${n}</strong> Connects</a>`;
    }
    if (view === "c") {
      extra = `<div class="seg" role="group" aria-label="Idioma / Language">
        <button type="button" data-action="lang" data-lang="es" aria-pressed="${lang() === "es"}">ES</button>
        <button type="button" data-action="lang" data-lang="en" aria-pressed="${lang() === "en"}">EN</button></div>`;
    }
    const cur = (v) => (view === v ? ' aria-current="page"' : "");
    return `<header class="topbar"><div class="topbar-inner">
      <a class="brand" href="#/">${h(APP.name)}</a><span class="demo-tag" title="Prototipo: nada de lo que ves es real">demo</span>
      <nav class="viewas" aria-label="Cambiar de vista para la demo">
        <span class="viewas-label">Ver como</span>
        <div class="seg">
          <a href="#/e"${cur("e")}>Estudiante</a><a href="#/c"${cur("c")}>Empresa</a><a href="#/a"${cur("a")}>Admin</a>
        </div>
      </nav>
      <div class="topbar-extra">${extra}</div>
    </div></header>`;
  }
  function tabs(items, current, who) {
    return `<div class="tabbar"><nav class="tabs" aria-label="Secciones">${items.map(([href, label, count]) =>
      `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}${count ? `<span class="count">${count}</span>` : ""}</a>`).join("")}${who || ""}</nav></div>`;
  }
  function footer(view) {
    const en = view === "c" && lang() === "en";
    return `<footer><div class="inner">
      <span>${en ? "Prototype with no server. All data is sample data and stays in this browser." : "Prototipo sin servidor. Los datos son de ejemplo y se guardan solo en este navegador."}</span>
      <button class="linklike" data-action="reset">${en ? "Reset the sample data" : "Restablecer los datos de ejemplo"}</button>
    </div></footer>`;
  }

  /* ---------- landing ---------- */
  function landing() {
    const open = db().offers.filter((o) => o.status === "abierta").sort((a, b) => b.posted.localeCompare(a.posted)).slice(0, 4);
    return `<main id="main">
      <section class="landing-intro">
        <h1>Trabajo remoto de medio tiempo para estudiantes universitarios argentinos.</h1>
        <p>Empresas de afuera publican tareas de 8 a 25 horas por semana. Vos te postulás con tu perfil de la facu: carrera, idiomas y horarios. Revisamos cada perfil a mano antes de mostrarlo.</p>
      </section>
      <div class="choose">
        <div>
          <h2>Soy estudiante</h2>
          <ul>
            <li>Tu perfil es gratis.</li>
            <li>Empezás con ${APP.connects.free} Connects; cada postulación cuesta entre 2 y 4.</li>
            <li>No te cobramos comisión sobre lo que ganás.</li>
          </ul>
          <a class="btn btn-primary" href="#/e/registro">Crear mi perfil</a>
          <p class="alt"><a href="#/e/ofertas" data-action="demo-student">Ver ofertas con un perfil de ejemplo</a></p>
        </div>
        <div>
          <h2>Soy empresa</h2>
          <ul>
            <li>Publicás una oferta en cinco minutos.</li>
            <li>Ves solo perfiles revisados, con idiomas y horarios reales.</li>
            <li>Pagás la tarifa del estudiante más un ${db().commission}% de servicio.</li>
          </ul>
          <a class="btn" href="#/c/registro">Registrar mi empresa</a>
          <p class="alt"><a href="#/c/ofertas" data-action="demo-company">Entrar como empresa de ejemplo</a> <span class="muted">(también en inglés)</span></p>
        </div>
      </div>

      <section class="landing-block">
        <h2>Ofertas publicadas esta semana</h2>
        <p>Así se ve el listado. Son ofertas de ejemplo de esta demo.</p>
        <ul class="rows">${open.map((o) => offerRow(o, null, true)).join("")}</ul>
        <p style="margin-top:var(--space-4)"><a href="#/e/ofertas" data-action="demo-student">Ver las ${db().offers.filter((o) => o.status === "abierta").length} ofertas abiertas</a></p>
      </section>

      <section class="landing-block">
        <h2>Cómo funciona</h2>
        <ol class="steps">
          <li><h3>Armás tu perfil</h3><p>Carrera, año, idiomas con nivel, horas disponibles y tu tarifa por hora.</p></li>
          <li><h3>Lo revisamos</h3><p>Miramos que los datos tengan sentido y que haya muestras de trabajo. Tarda uno o dos días.</p></li>
          <li><h3>Te postulás o te invitan</h3><p>Usás Connects para postularte. Si una empresa te invita, no gastás nada.</p></li>
          <li><h3>Trabajás y cobrás</h3><p>La empresa paga cada dos semanas por las horas aprobadas.</p></li>
        </ol>
      </section>

      <section class="landing-block">
        <h2>Cuánto cuesta</h2>
        <div class="money">
          <div><h3>Para estudiantes</h3><p>El perfil es gratis. Si se te terminan los Connects, podés comprar más: 10 por USD 1,50. Lo que facturás es todo tuyo.</p></div>
          <div><h3>Para empresas</h3><p>Publicar es gratis. Cuando contratás, pagás las horas del estudiante más un ${db().commission}% que se queda ${h(APP.name)}.</p></div>
        </div>
      </section>
    </main>`;
  }

  /* ---------- vista estudiante ---------- */
  function offerRow(o, me, compact) {
    const c = company(o.companyId);
    const applied = me && myApp(o.id, me.id);
    let action = "";
    if (!compact) {
      if (applied) action = statusTag(APP_STATUS, applied.status);
      else action = `<a class="btn btn-small btn-primary" href="#/e/oferta/${o.id}">Postularme</a>`;
    }
    return `<li class="row">
      <div>
        <a class="row-title" href="#/e/oferta/${o.id}">${h(o.title)}</a>
        <p class="row-sub"><span>${h(c.name)}, ${h(c.country)}</span><span>${when(o.posted)}</span><span>${plural(appsFor(o.id).length, "postulante", "postulantes")}</span></p>
        <p class="row-desc">${h(o.description)}</p>
        <div>${o.lang === "es" ? `<span class="tag">Español</span>` : `<span class="tag">${langName(o.lang)} ${h(o.level)}</span>`}<span class="tag">${h(area(o.area))}</span>${o.skills.map((s) => `<span class="tag">${h(s)}</span>`).join("")}</div>
      </div>
      <div class="row-side">
        <span class="rate">${rateRange(o)}</span>
        <span class="muted small">${o.hours} h por semana</span>
        <span class="muted small">${h(o.duration)}</span>
        <span class="muted small">${o.cost} Connects</span>
        ${action}
      </div>
    </li>`;
  }

  function studentView(parts) {
    const d = db();
    const sub = parts[0] || "ofertas";
    let me = d.session.studentId && student(d.session.studentId);
    if (!me && sub !== "registro") return `<main id="main">${studentRegister(true)}</main>`;
    if (sub === "registro") return `<main id="main">${studentRegister(false)}</main>`;

    const myApps = d.applications.filter((a) => a.studentId === me.id);
    const invites = myApps.filter((a) => a.status === "invitacion").length;
    const t = tabs([
      ["#/e/ofertas", "Ofertas"],
      ["#/e/postulaciones", "Mis postulaciones", invites || ""],
      ["#/e/perfil", "Mi perfil"],
      ["#/e/connects", "Connects"],
    ], "#/e/" + (sub === "oferta" ? "ofertas" : sub),
    `<span class="who">${h(me.name)} <button data-action="logout-student">Cambiar de perfil</button></span>`);

    let body = "";
    if (sub === "ofertas") body = studentOffers(me);
    else if (sub === "oferta") body = studentOffer(me, parts[1]);
    else if (sub === "postulaciones") body = studentApps(me);
    else if (sub === "perfil") body = studentProfile(me);
    else if (sub === "connects") body = studentConnects(me);
    else body = notFound("#/e/ofertas");
    return t + `<main id="main">${noticeHtml()}${body}</main>`;
  }

  function studentRegister(gate) {
    const approved = db().students.filter((s) => s.status === "aprobado");
    const langs = ui.form.langRows || [{ lang: "en", level: "B2" }];
    return `<div class="detail">
      <div class="detail-main">
        <h1>Armá tu perfil</h1>
        <p class="lead">Lo ven las empresas cuando te postulás. Revisamos cada perfil antes de publicarlo.</p>
        <form data-form="student-register" novalidate>
          <div class="form-grid">
            ${input("name", "Nombre y apellido", { attrs: ' autocomplete="name"' })}
            ${input("email", "Mail", { type: "email", attrs: ' autocomplete="email"' })}
            ${input("career", "Carrera", { attrs: ' placeholder="Ej.: Medicina"' })}
            ${input("university", "Universidad", { attrs: ' list="unis" placeholder="Ej.: UNMdP"' })}
            ${select("year", "Año que estás cursando", [["", "Elegí"], ["1", "1.º"], ["2", "2.º"], ["3", "3.º"], ["4", "4.º"], ["5", "5.º"], ["6", "6.º o más"]])}
            ${input("city", "Ciudad")}
          </div>
          <fieldset class="langs"><legend>Idiomas</legend>
            ${langs.map((r, i) => `<div class="lang-row">
              <select name="lang" aria-label="Idioma ${i + 1}">${S.LANGS.filter((l) => l.id !== "es").map((l) => `<option value="${l.id}"${l.id === r.lang ? " selected" : ""}>${l.es}</option>`).join("")}</select>
              <select name="level" aria-label="Nivel del idioma ${i + 1}">${S.LEVELS.filter((l) => l !== "Nativo").map((l) => `<option${l === r.level ? " selected" : ""}>${l}</option>`).join("")}</select>
              ${langs.length > 1 ? `<button type="button" class="btn btn-small" data-action="lang-remove" data-i="${i}">Quitar</button>` : "<span></span>"}
            </div>`).join("")}
            <button type="button" class="linklike" data-action="lang-add">Agregar otro idioma</button>
            <p class="hint" style="margin-top:var(--space-2)">El español no hace falta cargarlo. Poné el nivel real: la empresa lo prueba en la entrevista.</p>
          </fieldset>
          <fieldset class="two-col"><legend>Áreas en las que querés trabajar</legend>
            ${S.AREAS.map((a) => `<label class="check"><input type="checkbox" name="areas" value="${a.id}"${[].concat(ui.form.areas || []).includes(a.id) ? " checked" : ""}> ${a.es}</label>`).join("")}
            ${err("areas")}
          </fieldset>
          <div class="form-grid">
            ${input("skills", "Habilidades", { full: true, hint: "separadas por coma", attrs: ' placeholder="Ej.: Excel, subtitulado, atención por chat"' })}
            ${input("hours", "Horas por semana", { type: "number", attrs: ' min="4" max="40"' })}
            ${input("rate", "Tarifa por hora (USD)", { type: "number", attrs: ' min="5" max="60" step="0.5"' })}
            ${input("schedule", "Cuándo podés trabajar", { full: true, attrs: ' placeholder="Ej.: tardes desde las 15 y sábados"' })}
            ${textarea("bio", "Contá qué hiciste", { hint: "dos o tres líneas con trabajos o prácticas concretas" })}
          </div>
          <button class="btn btn-primary" type="submit">Crear mi perfil</button>
        </form>
        <datalist id="unis">${["UBA", "UNC", "UNLP", "UNR", "UNMdP", "UTN", "UNCuyo", "UNL", "UNS", "UNT", "ITBA", "UADE", "UNSAM"].map((u) => `<option value="${u}">`).join("")}</datalist>
      </div>
      <aside>
        <div class="aside-box">
          <h2>${gate ? "Para ver ofertas necesitás un perfil" : "¿Solo querés mirar?"}</h2>
          <p class="muted small" style="margin-bottom:var(--space-4)">Entrá con un perfil de ejemplo ya aprobado y probá postularte.</p>
          <form data-form="student-demo">
            ${select("demoStudent", "Perfil de ejemplo", approved.map((s) => [s.id, `${s.name}, ${s.career}`]), { value: "s1" })}
            <button class="btn" type="submit">Entrar con este perfil</button>
          </form>
        </div>
        <div class="aside-box">
          <h2>Qué pasa después</h2>
          <p class="small muted">Tu perfil queda en revisión. Mientras tanto podés postularte: las empresas ven tu postulación cuando lo aprobamos. En la demo lo aprobás vos desde la vista Admin.</p>
        </div>
      </aside>
    </div>`;
  }

  function studentFilterForm(list) {
    const f = ui.filters;
    const countArea = (id) => list.filter((o) => o.area === id).length;
    return `<form data-form="filters" class="filter-form">
      <div class="field"><label for="f-q">Buscar</label><input id="f-q" type="text" name="q" value="${h(f.q || "")}" placeholder="Ej.: subtítulos"></div>
      <fieldset><legend>Área</legend>
        ${S.AREAS.map((a) => `<label class="check"><input type="checkbox" name="area" value="${a.id}"${(f.area || []).includes(a.id) ? " checked" : ""}> ${a.es}<span class="muted">${countArea(a.id)}</span></label>`).join("")}
      </fieldset>
      <div class="field"><label for="f-lang">Idioma de trabajo</label>
        <select id="f-lang" name="lang">${[["", "Cualquiera"], ["en", "Inglés"], ["es", "Español"]].map(([v, t]) => `<option value="${v}"${(f.lang || "") === v ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="f-minrate">Tarifa mínima</label>
        <select id="f-minrate" name="minrate">${[["", "Cualquiera"], ["9", "USD 9 /h o más"], ["11", "USD 11 /h o más"], ["13", "USD 13 /h o más"]].map(([v, t]) => `<option value="${v}"${(f.minrate || "") === v ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <fieldset><legend>Horas por semana</legend>
        ${[["", "Cualquier carga"], ["10", "Hasta 10"], ["15", "Hasta 15"], ["20", "Hasta 20"]].map(([v, t]) => `<label class="check"><input type="radio" name="maxhours" value="${v}"${(f.maxhours || "") === v ? " checked" : ""}> ${t}</label>`).join("")}
      </fieldset>
      ${Object.keys(f).some((k) => [].concat(f[k]).filter(Boolean).length) ? `<button type="button" class="linklike" data-action="clear-filters">Limpiar filtros</button>` : ""}
    </form>`;
  }
  function filteredOffers() {
    const f = ui.filters;
    let list = db().offers.filter((o) => o.status === "abierta");
    if (f.q) { const q = f.q.toLowerCase(); list = list.filter((o) => (o.title + " " + o.description + " " + o.skills.join(" ") + " " + company(o.companyId).name).toLowerCase().includes(q)); }
    if (f.area && f.area.length) list = list.filter((o) => f.area.includes(o.area));
    if (f.lang) list = list.filter((o) => o.lang === f.lang);
    if (f.minrate) list = list.filter((o) => o.max >= Number(f.minrate));
    if (f.maxhours) list = list.filter((o) => o.hours <= Number(f.maxhours));
    list.sort(ui.sort === "rate" ? (a, b) => b.max - a.max : (a, b) => b.posted.localeCompare(a.posted));
    return list;
  }
  function studentOffers(me) {
    const all = db().offers.filter((o) => o.status === "abierta");
    const list = filteredOffers();
    const filters = studentFilterForm(all);
    return `<div class="page-head"><div><h1>Ofertas</h1><p>Todas son remotas. Las publican empresas de afuera, la mayoría en inglés.</p></div></div>
      <div class="with-filters">
        <aside class="filters" aria-label="Filtros">${filters}</aside>
        <div>
          <details class="filters-mobile"><summary>Filtros</summary>${filters.replace(/id="f-/g, 'id="m-f-').replace(/for="f-/g, 'for="m-f-')}</details>
          <div class="results-head">
            <span class="num">${plural(list.length, "oferta", "ofertas")}</span>
            <label class="small muted" style="display:flex;gap:var(--space-2);align-items:center;margin:0;font-weight:400">Ordenar
              <select data-action="sort"><option value="new"${ui.sort === "new" ? " selected" : ""}>Más nuevas</option><option value="rate"${ui.sort === "rate" ? " selected" : ""}>Mejor pagas</option></select></label>
          </div>
          ${list.length ? `<ul class="rows">${list.map((o) => offerRow(o, me)).join("")}</ul>` :
            `<div class="empty"><h3>Ninguna oferta coincide con estos filtros</h3><p>Probá con otra área o sacá el mínimo de tarifa. Hay ${all.length} ofertas abiertas en total.</p><button class="btn" data-action="clear-filters">Limpiar filtros</button></div>`}
        </div>
      </div>`;
  }

  function studentOffer(me, id) {
    const o = offer(id);
    if (!o) return notFound("#/e/ofertas");
    const c = company(o.companyId);
    const mine = myApp(o.id, me.id);
    const short = me.connects < o.cost;
    const langOk = o.lang === "es" || me.languages.some((l) => l.lang === o.lang && levelRank(l.level) >= levelRank(o.level));
    let apply;
    if (mine) {
      apply = `<div class="aside-box"><h2>Tu postulación</h2>
        <p style="margin-bottom:var(--space-3)">${statusTag(APP_STATUS, mine.status)}</p>
        <p class="small muted">${mine.status === "invitacion" ? "La empresa te invitó. Aceptá desde Mis postulaciones, sin gastar Connects." : `Te postulaste ${when(mine.date)}${mine.rate ? ` con una tarifa de USD ${mine.rate} /h` : ""}.`}</p>
        <p class="small" style="margin-top:var(--space-3)"><a href="#/e/postulaciones">Ver mis postulaciones</a></p></div>`;
    } else if (o.status !== "abierta") {
      apply = `<div class="aside-box"><h2>Oferta pausada</h2><p class="small muted">La empresa no está recibiendo postulaciones por ahora.</p></div>`;
    } else {
      apply = `<div class="aside-box" id="postular"><h2>Postularme</h2>
        ${me.status !== "aprobado" ? `<div class="notice warn small">Tu perfil está ${me.status === "pendiente" ? "en revisión" : "rechazado"}. ${me.status === "pendiente" ? "La empresa va a ver tu postulación cuando lo aprobemos." : "Corregilo antes de postularte."}</div>` : ""}
        ${!langOk ? `<div class="notice warn small">Piden ${langName(o.lang)} ${h(o.level)} y tu perfil dice otro nivel. Podés postularte igual.</div>` : ""}
        <form data-form="apply" data-offer="${o.id}" novalidate>
          ${textarea("message", "Por qué encajás", { hint: "mínimo 60 caracteres", attrs: ' rows="5"' })}
          ${input("rate", "Tu tarifa para esta oferta (USD por hora)", { type: "number", value: Math.min(Math.max(me.rate, o.min), o.max), attrs: ' min="5" step="0.5"' })}
          <div class="cost-line"><span>Cuesta</span><span class="num">${o.cost} Connects</span></div>
          <div class="cost-line"><span>Te quedarían</span><span class="num">${Math.max(me.connects - o.cost, 0)} Connects</span></div>
          ${short ? `<div class="notice error small">Te faltan ${o.cost - me.connects} Connects para esta postulación. <a href="#/e/connects">Comprar Connects</a></div>
            <button class="btn btn-primary" type="submit" disabled>Enviar postulación</button>` :
            `<button class="btn btn-primary" type="submit">Enviar postulación</button>`}
        </form></div>`;
    }
    return `<a class="back" href="#/e/ofertas">Volver a las ofertas</a>
      <div class="detail">
        <div class="detail-main">
          <h1>${h(o.title)}</h1>
          <p class="lead">${h(c.name)}, ${h(c.city)} (${h(c.country)}). Publicada ${when(o.posted)}.</p>
          <div class="prose"><p>${h(o.description)}</p></div>
          <h2 class="section-title">Lo que piden</h2>
          <div>${o.skills.map((s) => `<span class="tag">${h(s)}</span>`).join("")}</div>
          <h2 class="section-title">Sobre ${h(c.name)}</h2>
          <div class="person"><span class="mono sq" aria-hidden="true">${initials(c.name)}</span><div><p>${h(c.about)}</p><p class="small muted">${h(c.size)} personas. En ${h(APP.name)} desde ${dateShort(c.joined)}.</p></div></div>
        </div>
        <aside>
          <div class="aside-box" style="margin-bottom:var(--space-4)">
            <dl class="facts">
              <dt>Pago</dt><dd>${rateRange(o)}</dd>
              <dt>Carga</dt><dd>${o.hours} h por semana</dd>
              <dt>Duración</dt><dd>${h(o.duration)}</dd>
              <dt>Idioma</dt><dd>${o.lang === "es" ? "Español" : `${langName(o.lang)} ${h(o.level)}`}</dd>
              <dt>Área</dt><dd>${h(area(o.area))}</dd>
              <dt>Postulantes</dt><dd>${appsFor(o.id).length}</dd>
            </dl>
          </div>
          ${apply}
        </aside>
      </div>`;
  }

  function studentApps(me) {
    const mine = db().applications.filter((a) => a.studentId === me.id).sort((a, b) => b.date.localeCompare(a.date));
    const inv = mine.filter((a) => a.status === "invitacion");
    const rest = mine.filter((a) => a.status !== "invitacion");
    const spent = rest.reduce((t, a) => t + (a.cost || 0), 0);
    return `<div class="page-head"><div><h1>Mis postulaciones</h1><p>Gastaste ${spent} Connects en ${plural(rest.length, "postulación", "postulaciones")}.</p></div></div>
      ${inv.length ? `<h2 style="font-size:var(--text-base);margin-bottom:var(--space-3)">Invitaciones</h2>
        <ul class="rows" style="margin-bottom:var(--space-6)">${inv.map((a) => { const o = offer(a.offerId); const c = company(o.companyId); return `<li class="row">
          <div><a class="row-title" href="#/e/oferta/${o.id}">${h(o.title)}</a><p class="row-sub"><span>${h(c.name)} te invitó ${when(a.date)}</span></p>
          ${a.message ? `<p class="row-desc">${h(a.message)}</p>` : ""}</div>
          <div class="row-side"><span class="rate">${rateRange(o)}</span><span class="muted small">Sin costo de Connects</span>
            <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)"><button class="btn btn-small" data-action="decline-invite" data-id="${a.id}">Rechazar</button><button class="btn btn-small btn-primary" data-action="accept-invite" data-id="${a.id}">Aceptar</button></div></div></li>`; }).join("")}</ul>` : ""}
      ${rest.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Oferta</th><th>Empresa</th><th>Fecha</th><th class="num">Tu tarifa</th><th class="num">Connects</th><th>Estado</th></tr></thead>
        <tbody>${rest.map((a) => { const o = offer(a.offerId); const c = company(o.companyId); return `<tr>
          <td><a href="#/e/oferta/${o.id}">${h(o.title)}</a></td><td>${h(c.name)}</td><td class="nowrap">${dateShort(a.date)}</td>
          <td class="num">${a.rate ? `USD ${a.rate}` : ""}</td><td class="num">${a.cost}</td><td>${statusTag(APP_STATUS, a.status)}</td></tr>`; }).join("")}</tbody></table></div>` :
        `<div class="empty"><h3>Todavía no te postulaste a nada</h3><p>Elegí una oferta que coincida con tus horarios. Tenés ${me.connects} Connects.</p><a class="btn btn-primary" href="#/e/ofertas">Ver ofertas</a></div>`}`;
  }

  function profileBlock(s, l) {
    l = l || "es";
    const L = (es, en) => (l === "en" ? en : es);
    return `<div class="person" style="margin-bottom:var(--space-5)"><span class="mono" aria-hidden="true">${initials(s.name)}</span>
        <div><h1>${h(s.name)}</h1><p class="muted">${h(s.career)}, ${h(s.university)}. ${L(`${s.year}.º año`, `Year ${s.year}`)}. ${h(s.city)}.</p></div></div>
      <div class="prose"><p>${h(s.bio)}</p></div>
      <h2 class="section-title">${L("Idiomas", "Languages")}</h2>
      <p>${L("Español nativo", "Spanish (native)")}${s.languages.map((x) => `, ${langName(x.lang, l)} ${h(x.level)}`).join("")}</p>
      <h2 class="section-title">${L("Habilidades", "Skills")}</h2>
      <div>${s.skills.map((x) => `<span class="tag">${h(x)}</span>`).join("")}</div>
      <h2 class="section-title">${L("Áreas", "Areas")}</h2>
      <div>${s.areas.map((x) => `<span class="tag">${h(area(x, l))}</span>`).join("")}</div>`;
  }

  function studentProfile(me) {
    const st = me.status;
    return `${st === "pendiente" ? `<div class="notice warn">Tu perfil está en revisión. Lo revisamos en uno o dos días. En la demo podés aprobarlo desde <a href="#/a/curaduria">Admin, Curaduría</a>.</div>` : ""}
      ${st === "rechazado" ? `<div class="notice error">Tu perfil fue rechazado: ${h(me.rejectReason || "sin motivo cargado")}</div>` : ""}
      <div class="detail">
        <div class="detail-main">${profileBlock(me)}</div>
        <aside><div class="aside-box">
          <h2>Así te ven las empresas</h2>
          <dl class="facts">
            <dt>Estado</dt><dd>${statusTag(PROFILE_STATUS, st)}</dd>
            <dt>Tarifa</dt><dd>USD ${me.rate} /h</dd>
            <dt>Horas</dt><dd>${me.hours} por semana</dd>
            <dt>Horario</dt><dd>${h(me.schedule)}</dd>
            <dt>Mail</dt><dd>${h(me.email || "oculto hasta que te contraten")}</dd>
            <dt>En ${h(APP.name)}</dt><dd>desde ${dateShort(me.joined)}</dd>
          </dl>
        </div></aside>
      </div>`;
  }

  function studentConnects(me) {
    const mine = db().purchases.filter((p) => p.studentId === me.id);
    const sel = ui.form.pack || "p30";
    return `<div class="detail">
      <div class="detail-main">
        <h1>Connects</h1>
        <p class="lead">Cada postulación cuesta entre 2 y 4 Connects, según la oferta. Si una empresa te invita, no gastás nada.</p>
        <p class="muted small">Tu saldo</p>
        <p class="balance" style="margin-bottom:var(--space-6)">${me.connects}</p>
        <h2 class="section-title" style="margin-top:0">Comprar más</h2>
        <div class="notice warn">Esto es una demo: no se cobra nada y no se pide ningún dato de pago. El saldo se suma igual para que puedas probar.</div>
        <form data-form="buy" novalidate>
          <ul class="packs">${APP.connects.packs.map((p) => `<li><label><input type="radio" name="pack" value="${p.id}"${p.id === sel ? " checked" : ""}> ${p.amount} Connects <span class="muted small">USD ${(p.usd / p.amount).toFixed(2).replace(".", ",")} cada uno</span><span class="price">${money(p.usd, true)}</span></label></li>`).join("")}</ul>
          <fieldset><legend>Medio de pago (simulado)</legend>
            <label class="check"><input type="radio" name="method" value="mp" checked> Mercado Pago</label>
            <label class="check"><input type="radio" name="method" value="card"> Tarjeta de débito o crédito</label>
          </fieldset>
          <button class="btn btn-primary" type="submit">Comprar (simulado)</button>
        </form>
      </div>
      <aside><div class="aside-box"><h2>Tus compras</h2>
        ${mine.length ? `<table><tbody>${mine.map((p) => { const pk = byId(APP.connects.packs, p.packId); return `<tr><td>${dateShort(p.date)}</td><td>${pk.amount} Connects</td><td class="num">${money(pk.usd, true)}</td></tr>`; }).join("")}</tbody></table>` :
          `<p class="small muted">Todavía no compraste Connects. Arrancaste con ${APP.connects.free} gratis.</p>`}
      </div></aside>
    </div>`;
  }

  function notFound(back) {
    return `<div class="empty"><h3>No encontramos esta página</h3><p>Puede que el dato se haya borrado al restablecer la demo.</p><a class="btn" href="${back}">Volver</a></div>`;
  }

  /* las vistas de empresa y admin están en views-company.js y views-admin.js */
  window.CursadaCore = { S, db, ui, h, byId, student, company, offer, lang, area, langName, initials, money, rateRange, levelRank, when, dateShort, plural,
    APP_STATUS, PROFILE_STATUS, statusTag, setNotice, noticeHtml, go, appsFor, myApp, revenue, formData, err, inv, val, input, select, textarea, clearForm,
    tabs, profileBlock, notFound, offerRow };

  /* ---------- router ---------- */
  function render() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const view = parts[0] || "";
    let html;
    if (view === "e") html = studentView(parts.slice(1));
    else if (view === "c") html = CompanyViews.render(parts.slice(1));
    else if (view === "a") html = AdminViews.render(parts.slice(1));
    else html = landing();
    document.title = (view === "c" && lang() === "en" ? `${APP.name}, for companies` : view === "a" ? `${APP.name}, admin` : `${APP.name}, trabajo remoto para estudiantes`) + " (demo)";
    document.documentElement.lang = view === "c" ? lang() : "es";
    document.getElementById("app").innerHTML = `<a class="skip" href="#main">Ir al contenido</a>` + topbar(view) + html + footer(view);
    if (window.__focusId) { const el = document.getElementById(window.__focusId); window.__focusId = null; if (el) el.focus(); }
  }
  window.CursadaRender = render;

  /* ---------- acciones ---------- */
  function readFilters(form) {
    const d = formData(form);
    ui.filters = { q: d.q || "", area: [].concat(d.area || []), lang: d.lang || "", minrate: d.minrate || "", maxhours: d.maxhours || "" };
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    const d = db();
    if (a === "reset") {
      if (confirm(lang() === "en" && location.hash.startsWith("#/c") ? "Your changes will be erased and the sample data restored. Continue?" : "Se borran los cambios que hiciste y vuelven los datos de ejemplo. ¿Seguimos?")) { Store.reset(); clearForm(); ui.filters = {}; ui.cFilters = {}; setNotice("Volvieron los datos de ejemplo."); go("#/"); }
    } else if (a === "demo-student") {
      d.session.studentId = "s1"; Store.save();
    } else if (a === "demo-company") {
      d.session.companyId = "c1"; Store.save();
    } else if (a === "logout-student") {
      d.session.studentId = null; Store.save(); clearForm(); go("#/e/registro");
    } else if (a === "lang") {
      d.lang = el.dataset.lang; Store.save(); render();
    } else if (a === "clear-filters") {
      ui.filters = {}; render();
    } else if (a === "lang-add" || a === "lang-remove") {
      const form = el.closest("form");
      Object.assign(ui.form, formData(form));
      const langs = [].concat(ui.form.lang || []), levels = [].concat(ui.form.level || []);
      let rows = langs.map((l, i) => ({ lang: l, level: levels[i] }));
      if (a === "lang-add") rows.push({ lang: "pt", level: "B1" }); else rows.splice(Number(el.dataset.i), 1);
      ui.form.langRows = rows; render();
    } else if (a === "accept-invite" || a === "decline-invite") {
      const ap = byId(d.applications, el.dataset.id);
      const me = student(d.session.studentId);
      if (a === "accept-invite") { ap.status = "enviada"; ap.rate = me.rate; ap.date = APP.today; setNotice(`Aceptaste la invitación. ${company(offer(ap.offerId).companyId).name} ya ve tu postulación, sin costo de Connects.`); }
      else { ap.status = "rechazada_por_vos"; setNotice("Rechazaste la invitación. La empresa no ve el motivo.", "warn"); }
      Store.save(); render();
    } else if (window.CompanyViews && CompanyViews.action(a, el, e)) {
      // manejado en la vista de empresa
    } else if (window.AdminViews) {
      AdminViews.action(a, el, e);
    }
  });

  document.addEventListener("change", (e) => {
    const form = e.target.closest('form[data-form="filters"]');
    if (form) { readFilters(form); window.__focusId = e.target.id || null; render(); return; }
    if (e.target.matches('[data-action="sort"]')) { ui.sort = e.target.value; render(); return; }
    if (window.CompanyViews && CompanyViews.change) CompanyViews.change(e);
    if (window.AdminViews && AdminViews.change) AdminViews.change(e);
  });
  let qTimer;
  document.addEventListener("input", (e) => {
    const form = e.target.closest('form[data-form="filters"]');
    if (form && e.target.name === "q") {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => { readFilters(form); window.__focusId = e.target.id; render(); const el = document.getElementById(e.target.id); if (el) { el.setSelectionRange(el.value.length, el.value.length); } }, 250);
      return;
    }
    if (window.CompanyViews && CompanyViews.input) CompanyViews.input(e);
  });

  document.addEventListener("submit", (e) => {
    const form = e.target;
    const kind = form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    const d = db();
    const f = formData(form);
    if (e.submitter && e.submitter.name) f[e.submitter.name] = e.submitter.value;

    if (kind === "student-demo") {
      d.session.studentId = f.demoStudent; Store.save(); clearForm(); go("#/e/ofertas"); return;
    }
    if (kind === "student-register") {
      ui.form = Object.assign({}, f, { langRows: [].concat(f.lang || []).map((l, i) => ({ lang: l, level: [].concat(f.level)[i] })) });
      const errs = {};
      if (!f.name || f.name.trim().split(/\s+/).length < 2) errs.name = "Poné nombre y apellido.";
      if (!f.email) errs.email = "Falta el mail."; else if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Revisá el mail: falta la @ o el dominio.";
      if (!f.career) errs.career = "Contanos qué carrera estudiás.";
      if (!f.university) errs.university = "Falta la universidad.";
      if (!f.year) errs.year = "Elegí el año.";
      if (!f.city) errs.city = "Falta la ciudad.";
      if (![].concat(f.areas || []).length) errs.areas = "Elegí al menos un área.";
      if (!f.hours || f.hours < 4 || f.hours > 40) errs.hours = "Entre 4 y 40 horas.";
      if (!f.rate || f.rate < 5 || f.rate > 60) errs.rate = "Entre USD 5 y 60 por hora.";
      if (!f.bio || f.bio.trim().length < 40) errs.bio = "Escribí al menos 40 caracteres: es lo primero que lee la empresa.";
      ui.errors = errs;
      if (Object.keys(errs).length) { render(); const first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
      const s = {
        id: Store.id("s"), name: f.name.trim(), email: f.email.trim(), career: f.career.trim(), university: f.university.trim(), year: Number(f.year), city: f.city.trim(),
        languages: ui.form.langRows, skills: (f.skills || "").split(",").map((x) => x.trim()).filter(Boolean), areas: [].concat(f.areas),
        hours: Number(f.hours), schedule: (f.schedule || "").trim() || "A coordinar", rate: Number(f.rate), status: "pendiente", connects: APP.connects.free,
        joined: APP.today, bio: f.bio.trim(),
      };
      d.students.push(s); d.session.studentId = s.id; Store.save(); clearForm();
      setNotice(`Creamos tu perfil y te dimos ${APP.connects.free} Connects. Lo revisamos en uno o dos días; mientras tanto ya podés postularte.`);
      go("#/e/ofertas"); return;
    }
    if (kind === "apply") {
      const o = offer(form.dataset.offer);
      const me = student(d.session.studentId);
      ui.form = f;
      const errs = {};
      if (!f.message || f.message.trim().length < 60) errs.message = `Te faltan ${60 - (f.message || "").trim().length} caracteres. Contá qué hiciste parecido a esto.`;
      if (!f.rate || Number(f.rate) < 5) errs.rate = "Poné una tarifa de al menos USD 5.";
      if (me.connects < o.cost) errs.rate = `Te faltan ${o.cost - me.connects} Connects.`;
      ui.errors = errs;
      if (Object.keys(errs).length) { render(); const first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
      me.connects -= o.cost;
      d.applications.push({ id: Store.id("a"), offerId: o.id, studentId: me.id, status: "enviada", date: APP.today, rate: Number(f.rate), message: f.message.trim(), cost: o.cost });
      Store.save(); clearForm();
      setNotice(`Te postulaste a "${h(o.title)}". Gastaste ${o.cost} Connects y te quedan ${me.connects}.`);
      go("#/e/postulaciones"); return;
    }
    if (kind === "buy") {
      const me = student(d.session.studentId);
      const pk = byId(APP.connects.packs, f.pack);
      me.connects += pk.amount;
      d.purchases.push({ id: Store.id("b"), studentId: me.id, packId: pk.id, date: APP.today });
      Store.save(); ui.form = { pack: f.pack };
      setNotice(`Sumamos ${pk.amount} Connects (compra simulada, no se cobró nada). Ahora tenés ${me.connects}.`);
      render(); window.scrollTo(0, 0); return;
    }
    if (window.CompanyViews && CompanyViews.submit(kind, form, f)) return;
    if (window.AdminViews) AdminViews.submit(kind, form, f);
  });

  // Cambiar de pantalla limpia errores de formularios
  let lastRoute = location.hash;
  window.addEventListener("hashchange", () => {
    const base = (x) => x.split("/").slice(0, 3).join("/");
    if (base(location.hash) !== base(lastRoute)) clearForm();
    lastRoute = location.hash;
    render();
    window.scrollTo(0, 0);
  });
  document.addEventListener("DOMContentLoaded", render);
})();
