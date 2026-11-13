// Vista de empresa, en español o inglés.
window.CompanyViews = (function () {
  const C = window.CursadaCore;
  const { S, db, ui, h, byId, student, company, offer, lang, area, langName, initials, money, rateRange, levelRank, when, dateShort } = C;

  const T = {
    es: {
      tabOffers: "Mis ofertas", tabPost: "Publicar oferta", tabSearch: "Buscar estudiantes", tabProfile: "Empresa",
      switchCo: "Cambiar de empresa",
      regTitle: "Registrá tu empresa", regLead: "Publicar es gratis. Revisamos cada empresa antes de mostrar sus ofertas a los estudiantes.",
      coName: "Nombre de la empresa", country: "País", city: "Ciudad", website: "Sitio web", size: "Personas en la empresa",
      contact: "Tu nombre", email: "Mail de trabajo", about: "A qué se dedica la empresa", aboutHint: "una o dos líneas",
      regSubmit: "Registrar la empresa", demoTitle: "¿Solo querés mirar?", demoLead: "Entrá con una empresa de ejemplo que ya tiene ofertas y postulantes.",
      demoPick: "Empresa de ejemplo", demoEnter: "Entrar con esta empresa", gateTitle: "Para publicar necesitás registrar la empresa",
      offersTitle: "Mis ofertas", offersLead: (n) => `${n} publicadas. Hacé clic en una para ver a quién se postuló.`,
      thTitle: "Oferta", thStatus: "Estado", thPosted: "Publicada", thApplicants: "Postulantes", thBudget: "Presupuesto", thHours: "Horas",
      noOffersTitle: "Todavía no publicaste ninguna oferta", noOffersLead: "Una oferta clara recibe postulaciones en uno o dos días.", postOne: "Publicar una oferta",
      st_abierta: "Abierta", st_pausada: "Pausada", st_cerrada: "Cerrada",
      backOffers: "Volver a mis ofertas", applicantsTitle: "Postulantes", noApplicants: "Nadie se postuló todavía",
      noApplicantsLead: "Podés invitar a estudiantes que encajen. Las invitaciones no les cuestan Connects.", findStudents: "Buscar estudiantes",
      pause: "Pausar oferta", reopen: "Volver a abrir", proposes: "Propone", perHour: "/h", interview: "Entrevistar", hire: "Contratar", discard: "Descartar",
      viewProfile: "Ver perfil", invitedWait: "Invitación enviada, falta que acepte",
      postTitle: "Publicar una oferta", postLead: "Escribí la tarea como se la explicarías a alguien nuevo: qué hay que hacer, con qué herramientas y cuántas horas.",
      fTitle: "Título", fTitleHint: "qué va a hacer la persona", fDesc: "Descripción", fDescHint: "mínimo 120 caracteres", fArea: "Área", fLang: "Idioma de trabajo", fLevel: "Nivel mínimo",
      fHours: "Horas por semana", fMin: "Tarifa mínima (USD por hora)", fMax: "Tarifa máxima (USD por hora)", fDuration: "Duración", fSkills: "Habilidades", fSkillsHint: "separadas por coma",
      durOpts: ["1 mes", "2 meses", "3 meses", "6 meses", "Continuo"], publish: "Publicar oferta",
      feeTitle: "Cuánto pagarías", feeLine: (rate, hours, total, stu, fee, pct) => `Si contratás a alguien a USD ${rate} /h por ${hours} h por semana, pagás <strong>USD ${total}</strong> por semana: USD ${stu} al estudiante y USD ${fee} de servicio (${pct}%).`,
      feeNote: "Los estudiantes pagan Connects para postularse, así recibís menos postulaciones automáticas.",
      searchTitle: "Estudiantes", searchLead: "Solo ves perfiles que revisamos a mano.",
      fq: "Buscar", fqPh: "Ej.: Stata, subtitulado", fAreaL: "Área", fLangL: "Idioma", anyLang: "Cualquiera", fLevelL: "Nivel mínimo", anyLevel: "Cualquiera",
      fMaxRate: "Tarifa máxima", anyRate: "Cualquiera", upTo: (n) => `Hasta USD ${n} /h`, fMinHours: "Disponibilidad", anyHours: "Cualquiera", atLeast: (n) => `${n} h por semana o más`,
      clear: "Limpiar filtros", count: (n) => `${n} ${n === 1 ? "estudiante" : "estudiantes"}`, perWeek: "h por semana",
      noMatchTitle: "Nadie coincide con estos filtros", noMatchLead: "Probá bajar el nivel de idioma o subir la tarifa máxima.",
      invite: "Invitar", backSearch: "Volver a estudiantes", inviteTitle: "Invitar a una oferta", inviteLead: "La invitación no le cuesta Connects. Le llega como aviso y decide si acepta.",
      inviteOffer: "Oferta", inviteMsg: "Mensaje", inviteMsgHint: "opcional", inviteSend: "Enviar invitación",
      inviteNone: "No tenés ofertas abiertas para invitar.", alreadyIn: "Ya está en esta oferta", rate: "Tarifa", hoursL: "Horas", schedule: "Horario", status: "Estado",
      profileTitle: "Datos de la empresa", inReview: "Tu empresa está en revisión. Tus ofertas se publican igual en la demo.",
      published: (t) => `Publicamos "${t}". Ya la ven los estudiantes.`, invited: (n, t) => `Invitaste a ${n} a "${t}". Te avisamos cuando responda.`,
      registered: "Registramos tu empresa. La revisamos en un día hábil.",
      movedTo: (n, s) => `${n} pasó a "${s}".`, paused: "Pausaste la oferta. No recibe nuevas postulaciones.", reopened: "La oferta volvió a recibir postulaciones.",
      errName: "Falta el nombre de la empresa.", errCountry: "Falta el país.", errContact: "Falta tu nombre.", errEmail: "Revisá el mail.", errAbout: "Escribí al menos 30 caracteres.",
      errTitle: "El título tiene que tener al menos 10 caracteres.", errDesc: (n) => `Faltan ${n} caracteres. Contá qué se hace, con qué y cómo se revisa.`,
      errHours: "Entre 4 y 40 horas.", errRate: "La máxima tiene que ser igual o mayor que la mínima, y la mínima al menos USD 5.",
      cost: (n) => `Postularse cuesta ${n} Connects.`, since: "desde", people: "personas",
    },
    en: {
      tabOffers: "My job posts", tabPost: "Post a job", tabSearch: "Find students", tabProfile: "Company",
      switchCo: "Switch company",
      regTitle: "Register your company", regLead: "Posting is free. We review every company before students see its jobs.",
      coName: "Company name", country: "Country", city: "City", website: "Website", size: "Company size",
      contact: "Your name", email: "Work email", about: "What does the company do?", aboutHint: "one or two lines",
      regSubmit: "Register company", demoTitle: "Just looking?", demoLead: "Use a sample company that already has job posts and applicants.",
      demoPick: "Sample company", demoEnter: "Use this company", gateTitle: "Register your company to post jobs",
      offersTitle: "My job posts", offersLead: (n) => `${n} posted. Click one to see who applied.`,
      thTitle: "Job", thStatus: "Status", thPosted: "Posted", thApplicants: "Applicants", thBudget: "Budget", thHours: "Hours",
      noOffersTitle: "You haven't posted a job yet", noOffersLead: "A clear job post gets applications within a day or two.", postOne: "Post a job",
      st_abierta: "Open", st_pausada: "Paused", st_cerrada: "Closed",
      backOffers: "Back to my job posts", applicantsTitle: "Applicants", noApplicants: "No one has applied yet",
      noApplicantsLead: "You can invite students who fit. Invitations don't cost them Connects.", findStudents: "Find students",
      pause: "Pause job", reopen: "Reopen job", proposes: "Asks for", perHour: "/h", interview: "Interview", hire: "Hire", discard: "Reject",
      viewProfile: "View profile", invitedWait: "Invitation sent, waiting for an answer",
      postTitle: "Post a job", postLead: "Describe the work as you would to a new hire: what needs doing, with which tools and how many hours.",
      fTitle: "Title", fTitleHint: "what the person will do", fDesc: "Description", fDescHint: "at least 120 characters", fArea: "Area", fLang: "Working language", fLevel: "Minimum level",
      fHours: "Hours per week", fMin: "Minimum rate (USD per hour)", fMax: "Maximum rate (USD per hour)", fDuration: "Duration", fSkills: "Skills", fSkillsHint: "comma separated",
      durOpts: ["1 month", "2 months", "3 months", "6 months", "Ongoing"], publish: "Post job",
      feeTitle: "What you would pay", feeLine: (rate, hours, total, stu, fee, pct) => `If you hire someone at USD ${rate}/h for ${hours} hours a week, you pay <strong>USD ${total}</strong> a week: USD ${stu} to the student and a USD ${fee} service fee (${pct}%).`,
      feeNote: "Students spend Connects to apply, so you get fewer copy-paste applications.",
      searchTitle: "Students", searchLead: "You only see profiles we reviewed by hand. Students write their profiles in Spanish; language levels are checked in the interview.",
      fq: "Search", fqPh: "e.g. Stata, subtitling", fAreaL: "Area", fLangL: "Language", anyLang: "Any", fLevelL: "Minimum level", anyLevel: "Any",
      fMaxRate: "Maximum rate", anyRate: "Any", upTo: (n) => `Up to USD ${n}/h`, fMinHours: "Availability", anyHours: "Any", atLeast: (n) => `${n}+ hours a week`,
      clear: "Clear filters", count: (n) => `${n} ${n === 1 ? "student" : "students"}`, perWeek: "h a week",
      noMatchTitle: "No students match these filters", noMatchLead: "Try a lower language level or a higher maximum rate.",
      invite: "Invite", backSearch: "Back to students", inviteTitle: "Invite to a job", inviteLead: "Invitations don't cost the student Connects. They get a notice and decide.",
      inviteOffer: "Job", inviteMsg: "Message", inviteMsgHint: "optional", inviteSend: "Send invitation",
      inviteNone: "You have no open jobs to invite to.", alreadyIn: "Already on this job", rate: "Rate", hoursL: "Hours", schedule: "Schedule", status: "Status",
      profileTitle: "Company details", inReview: "Your company is under review. In this demo your jobs are published anyway.",
      published: (t) => `"${t}" is live. Students can see it now.`, invited: (n, t) => `You invited ${n} to "${t}". We'll let you know when they answer.`,
      registered: "Company registered. We'll review it within one business day.",
      movedTo: (n, s) => `${n} moved to "${s}".`, paused: "Job paused. It won't get new applications.", reopened: "The job is accepting applications again.",
      errName: "Company name is missing.", errCountry: "Country is missing.", errContact: "Your name is missing.", errEmail: "Check the email address.", errAbout: "Write at least 30 characters.",
      errTitle: "The title needs at least 10 characters.", errDesc: (n) => `${n} more characters needed. Say what the work is, with which tools and how it gets reviewed.`,
      errHours: "Between 4 and 40 hours.", errRate: "The maximum must be equal to or higher than the minimum, and the minimum at least USD 5.",
      cost: (n) => `Applying costs students ${n} Connects.`, since: "since", people: "people",
    },
  };
  const t = (k) => T[lang()][k];
  const L = () => lang();
  const countryOf = (c) => (L() === "en" ? c.countryEn || c.country : c.country);
  const stLabel = (s) => t("st_" + s) || s;

  function me() { const id = db().session.companyId; return id && company(id); }

  function render(parts) {
    const sub = parts[0] || "ofertas";
    const co = me();
    if (!co || sub === "registro") return `<main id="main">${C.noticeHtml()}${register(!co && sub !== "registro")}</main>`;
    const mine = db().offers.filter((o) => o.companyId === co.id);
    const tabsHtml = C.tabs([
      ["#/c/ofertas", t("tabOffers")],
      ["#/c/publicar", t("tabPost")],
      ["#/c/estudiantes", t("tabSearch")],
      ["#/c/perfil", t("tabProfile")],
    ], "#/c/" + (sub === "oferta" ? "ofertas" : sub === "estudiante" ? "estudiantes" : sub),
    `<span class="who">${h(co.name)} <button data-action="logout-company">${t("switchCo")}</button></span>`);
    let body;
    if (sub === "ofertas") body = offers(co, mine);
    else if (sub === "oferta") body = offerApplicants(co, parts[1]);
    else if (sub === "publicar") body = post(co);
    else if (sub === "estudiantes") body = search(co);
    else if (sub === "estudiante") body = studentPage(co, parts[1]);
    else if (sub === "perfil") body = profile(co);
    else body = C.notFound("#/c/ofertas");
    return tabsHtml + `<main id="main">${C.noticeHtml()}${body}</main>`;
  }

  function register(gate) {
    const all = db().companies;
    const sizes = ["1-5", "6-20", "21-50", "51-200", "200+"];
    return `<div class="detail">
      <div class="detail-main">
        <h1>${t("regTitle")}</h1>
        <p class="lead">${t("regLead")}</p>
        <form data-form="company-register" novalidate>
          <div class="form-grid">
            ${C.input("name", t("coName"), { attrs: ' autocomplete="organization"' })}
            ${C.input("website", t("website"), { type: "url", attrs: ' placeholder="https://"' })}
            ${C.input("country", t("country"))}
            ${C.input("city", t("city"))}
            ${C.select("size", t("size"), sizes.map((s) => [s, s]))}
            ${C.input("contact", t("contact"), { attrs: ' autocomplete="name"' })}
            ${C.input("email", t("email"), { type: "email", full: true, attrs: ' autocomplete="email"' })}
            ${C.textarea("about", t("about"), { hint: t("aboutHint"), attrs: ' rows="3"' })}
          </div>
          <button class="btn btn-primary" type="submit">${t("regSubmit")}</button>
        </form>
      </div>
      <aside><div class="aside-box">
        <h2>${gate ? t("gateTitle") : t("demoTitle")}</h2>
        <p class="small muted" style="margin-bottom:var(--space-4)">${t("demoLead")}</p>
        <form data-form="company-demo">
          ${C.select("demoCompany", t("demoPick"), all.map((c) => [c.id, `${c.name}, ${countryOf(c)}`]), { value: "c1" })}
          <button class="btn" type="submit">${t("demoEnter")}</button>
        </form>
      </div></aside>
    </div>`;
  }

  function offers(co, mine) {
    if (!mine.length) return `<div class="empty"><h3>${t("noOffersTitle")}</h3><p>${t("noOffersLead")}</p><a class="btn btn-primary" href="#/c/publicar">${t("postOne")}</a></div>`;
    const sorted = mine.slice().sort((a, b) => b.posted.localeCompare(a.posted));
    return `<div class="page-head"><div><h1>${t("offersTitle")}</h1><p>${t("offersLead")(mine.length)}</p></div><a class="btn btn-primary" href="#/c/publicar">${t("tabPost")}</a></div>
      <div class="table-wrap"><table>
        <thead><tr><th>${t("thTitle")}</th><th>${t("thStatus")}</th><th>${t("thPosted")}</th><th class="num">${t("thApplicants")}</th><th class="num">${t("thBudget")}</th><th class="num">${t("thHours")}</th></tr></thead>
        <tbody>${sorted.map((o) => {
          const apps = C.appsFor(o.id).filter((a) => a.status !== "invitacion" && a.status !== "rechazada_por_vos" && student(a.studentId).status === "aprobado");
          const fresh = apps.filter((a) => a.status === "enviada").length;
          return `<tr><td><a href="#/c/oferta/${o.id}">${h(o.title)}</a></td>
            <td><span class="status ${o.status === "abierta" ? "ok" : ""}">${stLabel(o.status)}</span></td>
            <td class="nowrap">${when(o.posted, L())}</td>
            <td class="num">${apps.length}${fresh ? ` <span class="muted">(${fresh} ${L() === "en" ? "new" : fresh === 1 ? "nueva" : "nuevas"})</span>` : ""}</td>
            <td class="num">${rateRange(o)}</td><td class="num">${o.hours}</td></tr>`;
        }).join("")}</tbody></table></div>`;
  }

  function offerApplicants(co, id) {
    const o = offer(id);
    if (!o || o.companyId !== co.id) return C.notFound("#/c/ofertas");
    // las postulaciones de perfiles sin aprobar no se muestran (curaduría); las invitaciones sí
    const apps = C.appsFor(o.id).filter((a) => a.status !== "rechazada_por_vos" && (a.status === "invitacion" || student(a.studentId).status === "aprobado")).sort((a, b) => b.date.localeCompare(a.date));
    // al abrir la oferta, las postulaciones "enviada" pasan a "vista"
    let touched = false;
    apps.forEach((a) => { if (a.status === "enviada") { a.status = "vista"; touched = true; } });
    if (touched) Store.save();
    const statusOpts = [["entrevista", t("interview")], ["contratada", t("hire")], ["no_seleccionada", t("discard")]];
    return `<a class="back" href="#/c/ofertas">${t("backOffers")}</a>
      <div class="page-head"><div><h1>${h(o.title)}</h1>
        <p>${rateRange(o)}, ${o.hours} ${t("perWeek")}. ${t("cost")(o.cost)} <span class="status ${o.status === "abierta" ? "ok" : ""}">${stLabel(o.status)}</span></p></div>
        <button class="btn" data-action="toggle-offer" data-id="${o.id}">${o.status === "abierta" ? t("pause") : t("reopen")}</button></div>
      <h2 style="font-size:var(--text-base);margin-bottom:var(--space-2)">${t("applicantsTitle")} (${apps.length})</h2>
      ${apps.length ? `<ul class="rows">${apps.map((a) => {
        const s = student(a.studentId);
        return `<li class="row">
          <div class="person"><span class="mono" aria-hidden="true">${initials(s.name)}</span><div>
            <a class="row-title" href="#/c/estudiante/${s.id}">${h(s.name)}</a>
            <p class="row-sub"><span>${h(s.career)}, ${h(s.university)}</span><span>${L() === "en" ? `Year ${s.year}` : `${s.year}.º año`}</span><span>${when(a.date, L())}</span></p>
            ${a.message ? `<p class="row-desc">${h(a.message)}</p>` : ""}
            <div>${s.languages.map((x) => `<span class="tag">${langName(x.lang, L())} ${h(x.level)}</span>`).join("")}</div>
          </div></div>
          <div class="row-side">
            ${a.rate ? `<span class="rate">USD ${a.rate} ${t("perHour")}</span><span class="muted small">${t("proposes")}</span>` : ""}
            ${a.status === "vista" ? `<span class="status">${L() === "en" ? "Viewed" : "Vista"}</span>` : C.statusTag(C.APP_STATUS, a.status, L())}
            ${a.status === "invitacion" ? `<span class="muted small">${t("invitedWait")}</span>` :
              a.status === "contratada" ? "" : `<div class="row-actions">${statusOpts.filter(([v]) => v !== a.status).map(([v, lbl]) =>
                `<button class="btn btn-small${v === "no_seleccionada" ? " btn-danger" : ""}" data-action="app-status" data-id="${a.id}" data-status="${v}">${lbl}</button>`).join("")}</div>`}
          </div></li>`;
      }).join("")}</ul>` :
      `<div class="empty"><h3>${t("noApplicants")}</h3><p>${t("noApplicantsLead")}</p><a class="btn" href="#/c/estudiantes">${t("findStudents")}</a></div>`}`;
  }

  function feeHtml(f) {
    const rate = Number(f.max || f.min || 12), hours = Number(f.hours || 10), pct = db().commission;
    const stu = rate * hours, fee = stu * pct / 100;
    const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString(L() === "en" ? "en-US" : "es-AR");
    return `<p class="small">${t("feeLine")(fmt(rate), hours, fmt(stu + fee), fmt(stu), fmt(fee), pct)}</p>`;
  }

  function post(co) {
    const f = ui.form;
    const langs = [["en", langName("en", L())], ["es", langName("es", L())], ["pt", langName("pt", L())], ["fr", langName("fr", L())], ["it", langName("it", L())], ["de", langName("de", L())]];
    return `<div class="detail">
      <div class="detail-main">
        <h1>${t("postTitle")}</h1>
        <p class="lead">${t("postLead")}</p>
        ${co.status === "pendiente" ? `<div class="notice warn">${t("inReview")}</div>` : ""}
        <form data-form="post" novalidate>
          <div class="form-grid">
            ${C.input("title", t("fTitle"), { full: true, hint: t("fTitleHint"), attrs: ' maxlength="90"' })}
            ${C.textarea("description", t("fDesc"), { hint: t("fDescHint"), attrs: ' rows="6"' })}
            ${C.select("area", t("fArea"), S.AREAS.map((a) => [a.id, a[L()]]))}
            ${C.select("duration", t("fDuration"), t("durOpts").map((d, i) => [T.es.durOpts[i], d]), { value: T.es.durOpts[2] })}
            ${C.select("lang", t("fLang"), langs, { value: "en" })}
            ${C.select("level", t("fLevel"), S.LEVELS.map((l) => [l, l === "Nativo" && L() === "en" ? "Native" : l]), { value: "B2" })}
            ${C.input("hours", t("fHours"), { type: "number", value: 10, attrs: ' min="4" max="40"' })}
            <div></div>
            ${C.input("min", t("fMin"), { type: "number", value: 10, attrs: ' min="5" step="0.5"' })}
            ${C.input("max", t("fMax"), { type: "number", value: 13, attrs: ' min="5" step="0.5"' })}
            ${C.input("skills", t("fSkills"), { full: true, hint: t("fSkillsHint") })}
          </div>
          <button class="btn btn-primary" type="submit">${t("publish")}</button>
        </form>
      </div>
      <aside><div class="aside-box"><h2>${t("feeTitle")}</h2><div id="fee">${feeHtml(Object.assign({ hours: 10, min: 10, max: 13 }, f))}</div>
        <p class="small muted" style="margin-top:var(--space-3)">${t("feeNote")}</p></div></aside>
    </div>`;
  }

  function filtered() {
    const f = ui.cFilters;
    let list = db().students.filter((s) => s.status === "aprobado");
    if (f.q) { const q = f.q.toLowerCase(); list = list.filter((s) => (s.name + " " + s.career + " " + s.university + " " + s.skills.join(" ") + " " + s.bio).toLowerCase().includes(q)); }
    if (f.area && f.area.length) list = list.filter((s) => s.areas.some((a) => f.area.includes(a)));
    if (f.lang) list = list.filter((s) => s.languages.some((l) => l.lang === f.lang && (!f.level || levelRank(l.level) >= levelRank(f.level))));
    else if (f.level) list = list.filter((s) => s.languages.some((l) => levelRank(l.level) >= levelRank(f.level)));
    if (f.maxrate) list = list.filter((s) => s.rate <= Number(f.maxrate));
    if (f.minhours) list = list.filter((s) => s.hours >= Number(f.minhours));
    return list.sort((a, b) => b.joined.localeCompare(a.joined));
  }
  function searchFilters() {
    const f = ui.cFilters;
    const opt = (pairs, cur) => pairs.map(([v, txt]) => `<option value="${v}"${(cur || "") === v ? " selected" : ""}>${txt}</option>`).join("");
    return `<form data-form="cfilters">
      <div class="field"><label for="cf-q">${t("fq")}</label><input id="cf-q" type="text" name="q" value="${h(f.q || "")}" placeholder="${t("fqPh")}"></div>
      <fieldset><legend>${t("fAreaL")}</legend>${S.AREAS.map((a) => `<label class="check"><input type="checkbox" name="area" value="${a.id}"${(f.area || []).includes(a.id) ? " checked" : ""}> ${a[L()]}</label>`).join("")}</fieldset>
      <div class="field"><label for="cf-lang">${t("fLangL")}</label><select id="cf-lang" name="lang">${opt([["", t("anyLang")]].concat(S.LANGS.filter((l) => l.id !== "es").map((l) => [l.id, l[L()]])), f.lang)}</select></div>
      <div class="field"><label for="cf-level">${t("fLevelL")}</label><select id="cf-level" name="level">${opt([["", t("anyLevel")], ["B1", "B1"], ["B2", "B2"], ["C1", "C1"], ["C2", "C2"]], f.level)}</select></div>
      <div class="field"><label for="cf-maxrate">${t("fMaxRate")}</label><select id="cf-maxrate" name="maxrate">${opt([["", t("anyRate")], ["10", t("upTo")(10)], ["12", t("upTo")(12)], ["15", t("upTo")(15)]], f.maxrate)}</select></div>
      <div class="field"><label for="cf-minhours">${t("fMinHours")}</label><select id="cf-minhours" name="minhours">${opt([["", t("anyHours")], ["10", t("atLeast")(10)], ["15", t("atLeast")(15)], ["20", t("atLeast")(20)]], f.minhours)}</select></div>
      ${Object.keys(f).some((k) => [].concat(f[k]).filter(Boolean).length) ? `<button type="button" class="linklike" data-action="clear-cfilters">${t("clear")}</button>` : ""}
    </form>`;
  }
  function search(co) {
    const list = filtered();
    const fl = searchFilters();
    return `<div class="page-head"><div><h1>${t("searchTitle")}</h1><p>${t("searchLead")}</p></div></div>
      <div class="with-filters">
        <aside class="filters" aria-label="Filters">${fl}</aside>
        <div>
          <details class="filters-mobile"><summary>${L() === "en" ? "Filters" : "Filtros"}</summary>${fl.replace(/id="cf-/g, 'id="m-cf-').replace(/for="cf-/g, 'for="m-cf-')}</details>
          <div class="results-head"><span class="num">${t("count")(list.length)}</span></div>
          ${list.length ? `<ul class="rows">${list.map((s) => `<li class="row">
            <div class="person"><span class="mono" aria-hidden="true">${initials(s.name)}</span><div>
              <a class="row-title" href="#/c/estudiante/${s.id}">${h(s.name)}</a>
              <p class="row-sub"><span>${h(s.career)}, ${h(s.university)}</span><span>${L() === "en" ? `Year ${s.year}` : `${s.year}.º año`}</span><span>${h(s.city)}</span></p>
              <p class="row-desc">${h(s.bio)}</p>
              <div>${s.languages.map((x) => `<span class="tag">${langName(x.lang, L())} ${h(x.level)}</span>`).join("")}${s.skills.slice(0, 3).map((x) => `<span class="tag">${h(x)}</span>`).join("")}</div>
            </div></div>
            <div class="row-side"><span class="rate">USD ${s.rate} ${t("perHour")}</span><span class="muted small">${s.hours} ${t("perWeek")}</span>
              <a class="btn btn-small" href="#/c/estudiante/${s.id}#invitar">${t("invite")}</a></div>
          </li>`).join("")}</ul>` :
          `<div class="empty"><h3>${t("noMatchTitle")}</h3><p>${t("noMatchLead")}</p><button class="btn" data-action="clear-cfilters">${t("clear")}</button></div>`}
        </div>
      </div>`;
  }

  function studentPage(co, id) {
    const s = student(id);
    if (!s) return C.notFound("#/c/estudiantes");
    const open = db().offers.filter((o) => o.companyId === co.id && o.status === "abierta");
    const taken = (oid) => C.myApp(oid, s.id);
    const avail = open.filter((o) => !taken(o.id));
    return `<a class="back" href="#/c/estudiantes">${t("backSearch")}</a>
      <div class="detail">
        <div class="detail-main">${C.profileBlock(s, L())}</div>
        <aside>
          <div class="aside-box" style="margin-bottom:var(--space-4)"><dl class="facts">
            <dt>${t("rate")}</dt><dd>USD ${s.rate} ${t("perHour")}</dd>
            <dt>${t("hoursL")}</dt><dd>${s.hours} ${t("perWeek")}</dd>
            <dt>${t("schedule")}</dt><dd>${h(s.schedule)}</dd>
            <dt>${t("status")}</dt><dd>${C.statusTag(C.PROFILE_STATUS, s.status, L())}</dd>
          </dl></div>
          <div class="aside-box" id="invitar"><h2>${t("inviteTitle")}</h2>
            ${avail.length ? `<p class="small muted" style="margin-bottom:var(--space-4)">${t("inviteLead")}</p>
              <form data-form="invite" data-student="${s.id}">
                ${C.select("offerId", t("inviteOffer"), avail.map((o) => [o.id, o.title]))}
                ${C.textarea("note", t("inviteMsg"), { hint: t("inviteMsgHint"), attrs: ' rows="3"' })}
                <button class="btn btn-primary" type="submit">${t("inviteSend")}</button>
              </form>` : `<p class="small muted">${t("inviteNone")}</p>`}
            ${open.filter((o) => taken(o.id)).map((o) => `<p class="small" style="margin-top:var(--space-3)">${h(o.title)}: ${C.statusTag(C.APP_STATUS, taken(o.id).status, L())}</p>`).join("")}
          </div>
        </aside>
      </div>`;
  }

  function profile(co) {
    return `${co.status === "pendiente" ? `<div class="notice warn">${t("inReview")}</div>` : ""}
      <div class="person" style="margin-bottom:var(--space-5)"><span class="mono sq" aria-hidden="true">${initials(co.name)}</span>
        <div><h1>${h(co.name)}</h1><p class="muted">${h(co.city)}, ${h(countryOf(co))}. ${h(co.size)} ${t("people")}.</p></div></div>
      <div class="prose" style="margin-bottom:var(--space-5)"><p>${h(co.about)}</p></div>
      <dl class="facts" style="max-width:480px">
        <dt>${t("contact")}</dt><dd>${h(co.contact)}</dd>
        <dt>${t("email")}</dt><dd>${h(co.email || "—")}</dd>
        <dt>${t("status")}</dt><dd>${C.statusTag(C.PROFILE_STATUS, co.status, L())}</dd>
        <dt>${APP.name}</dt><dd>${t("since")} ${dateShort(co.joined, L())}</dd>
      </dl>`;
  }

  /* ---------- eventos ---------- */
  function readCFilters(form) {
    const d = C.formData(form);
    ui.cFilters = { q: d.q || "", area: [].concat(d.area || []), lang: d.lang || "", level: d.level || "", maxrate: d.maxrate || "", minhours: d.minhours || "" };
  }
  function action(a, el) {
    const d = db();
    if (a === "logout-company") { d.session.companyId = null; Store.save(); C.clearForm(); C.go("#/c/registro"); return true; }
    if (a === "clear-cfilters") { ui.cFilters = {}; CursadaRender(); return true; }
    if (a === "toggle-offer") {
      const o = offer(el.dataset.id);
      o.status = o.status === "abierta" ? "pausada" : "abierta";
      Store.save(); C.setNotice(o.status === "pausada" ? t("paused") : t("reopened"), o.status === "pausada" ? "warn" : "ok"); CursadaRender(); return true;
    }
    if (a === "app-status") {
      const ap = byId(d.applications, el.dataset.id);
      ap.status = el.dataset.status;
      if (ap.status === "contratada" && !d.contracts.some((k) => k.applicationId === ap.id)) d.contracts.push({ id: Store.id("k"), applicationId: ap.id, hoursMonth: 0 });
      Store.save();
      C.setNotice(t("movedTo")(h(student(ap.studentId).name), C.APP_STATUS[ap.status][L()]), ap.status === "no_seleccionada" ? "warn" : "ok");
      CursadaRender(); return true;
    }
    return false;
  }
  function change(e) {
    const form = e.target.closest('form[data-form="cfilters"]');
    if (form) { readCFilters(form); window.__focusId = e.target.id; CursadaRender(); }
    if (e.target.closest('form[data-form="post"]')) updateFee(e.target.closest("form"));
  }
  let timer;
  function input(e) {
    const form = e.target.closest('form[data-form="cfilters"]');
    if (form && e.target.name === "q") {
      clearTimeout(timer);
      timer = setTimeout(() => { readCFilters(form); window.__focusId = e.target.id; CursadaRender(); const el = document.getElementById(e.target.id); if (el) el.setSelectionRange(el.value.length, el.value.length); }, 250);
    }
    if (e.target.closest('form[data-form="post"]')) updateFee(e.target.closest("form"));
  }
  function updateFee(form) {
    const box = document.getElementById("fee");
    if (box) box.innerHTML = feeHtml(C.formData(form));
  }
  function submit(kind, form, f) {
    const d = db();
    if (kind === "company-demo") { d.session.companyId = f.demoCompany; Store.save(); C.clearForm(); C.go("#/c/ofertas"); return true; }
    if (kind === "company-register") {
      ui.form = f;
      const errs = {};
      if (!f.name || f.name.trim().length < 2) errs.name = t("errName");
      if (!f.country) errs.country = t("errCountry");
      if (!f.contact) errs.contact = t("errContact");
      if (!f.email || !/^\S+@\S+\.\S+$/.test(f.email)) errs.email = t("errEmail");
      if (!f.about || f.about.trim().length < 30) errs.about = t("errAbout");
      ui.errors = errs;
      if (Object.keys(errs).length) { CursadaRender(); const el = document.querySelector('[aria-invalid="true"]'); if (el) el.focus(); return true; }
      const c = { id: Store.id("c"), name: f.name.trim(), country: f.country.trim(), countryEn: f.country.trim(), city: (f.city || "").trim(), size: f.size, about: f.about.trim(),
        contact: f.contact.trim(), email: f.email.trim(), website: f.website, status: "pendiente", joined: APP.today };
      d.companies.push(c); d.session.companyId = c.id; Store.save(); C.clearForm();
      C.setNotice(t("registered")); C.go("#/c/publicar"); return true;
    }
    if (kind === "post") {
      ui.form = f;
      const errs = {};
      const desc = (f.description || "").trim();
      if (!f.title || f.title.trim().length < 10) errs.title = t("errTitle");
      if (desc.length < 120) errs.description = t("errDesc")(120 - desc.length);
      if (!f.hours || f.hours < 4 || f.hours > 40) errs.hours = t("errHours");
      if (!(Number(f.min) >= 5) || !(Number(f.max) >= Number(f.min))) errs.max = t("errRate");
      ui.errors = errs;
      if (Object.keys(errs).length) { CursadaRender(); const el = document.querySelector('[aria-invalid="true"]'); if (el) el.focus(); return true; }
      const o = { id: Store.id("o"), companyId: db().session.companyId, area: f.area, lang: f.lang, level: f.lang === "es" ? "Nativo" : f.level, hours: Number(f.hours),
        min: Number(f.min), max: Number(f.max), duration: f.duration, cost: Number(f.max) >= 13 ? 4 : APP.connects.defaultCost, posted: APP.today, status: "abierta",
        title: f.title.trim(), description: desc, skills: (f.skills || "").split(",").map((x) => x.trim()).filter(Boolean) };
      d.offers.push(o); Store.save(); C.clearForm();
      C.setNotice(t("published")(h(o.title))); C.go("#/c/oferta/" + o.id); return true;
    }
    if (kind === "invite") {
      const s = student(form.dataset.student);
      const o = offer(f.offerId);
      d.applications.push({ id: Store.id("a"), offerId: o.id, studentId: s.id, status: "invitacion", date: APP.today, rate: null, message: (f.note || "").trim(), cost: 0 });
      Store.save(); C.clearForm();
      C.setNotice(t("invited")(h(s.name), h(o.title))); CursadaRender(); window.scrollTo(0, 0); return true;
    }
    return false;
  }

  return { render, action, change, input, submit };
})();
