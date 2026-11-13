// Panel del intermediario: curaduría, comisión e ingresos simulados.
window.AdminViews = (function () {
  const C = window.CursadaCore;
  const { S, db, ui, h, byId, student, company, offer, area, langName, money, rateRange, when, dateShort, plural } = C;

  function render(parts) {
    const sub = parts[0] || "resumen";
    const d = db();
    const pend = d.students.filter((s) => s.status === "pendiente").length + d.companies.filter((c) => c.status === "pendiente").length;
    const t = C.tabs([
      ["#/a/resumen", "Resumen"],
      ["#/a/curaduria", "Curaduría", pend || ""],
      ["#/a/estudiantes", "Estudiantes"],
      ["#/a/empresas", "Empresas"],
      ["#/a/ofertas", "Ofertas"],
      ["#/a/postulaciones", "Postulaciones"],
    ], "#/a/" + sub);
    let body;
    if (sub === "resumen") body = summary();
    else if (sub === "curaduria") body = curation();
    else if (sub === "estudiantes") body = studentsTable();
    else if (sub === "empresas") body = companiesTable();
    else if (sub === "ofertas") body = offersTable();
    else if (sub === "postulaciones") body = appsTable();
    else body = C.notFound("#/a/resumen");
    return t + `<main id="main">${C.noticeHtml()}${body}</main>`;
  }

  function summary() {
    const d = db();
    const r = C.revenue();
    const open = d.offers.filter((o) => o.status === "abierta").length;
    const fmt = (n) => money(n, true);
    return `<div class="page-head"><div><h1>Resumen de noviembre</h1>
      <p>Ingresos simulados: la comisión sale de las horas cargadas en los contratos activos y se suma lo vendido en Connects. No hay plata real.</p></div></div>
      <form class="commission" data-form="commission" novalidate>
        <div class="field"><label for="f-commission">Comisión (%)</label><input id="f-commission" name="commission" type="number" min="0" max="40" step="0.5" value="${d.commission}"${C.inv("commission")}></div>
        <button class="btn" type="submit">Guardar comisión</button>
        <p class="small muted" style="flex-basis:100%">La paga la empresa encima de la tarifa del estudiante. Cambia el cálculo de abajo y el texto que ven las empresas.</p>
        ${C.err("commission")}
      </form>
      <dl class="summary">
        <div><dt>Facturado por estudiantes</dt><dd>${fmt(r.billed)}</dd></div>
        <div><dt>Comisión (${d.commission}%)</dt><dd>${fmt(r.fees)}</dd></div>
        <div><dt>Connects vendidos</dt><dd>${fmt(r.connectsUsd)}</dd></div>
        <div><dt>Ingreso del mes</dt><dd class="total">${fmt(r.total)}</dd></div>
      </dl>
      <div class="split">
        <section>
          <h2>Contratos activos</h2>
          ${r.rows.length ? `<div class="table-wrap"><table>
            <thead><tr><th>Estudiante</th><th>Empresa</th><th class="num">Tarifa</th><th class="num">Horas</th><th class="num">Facturado</th><th class="num">Comisión</th></tr></thead>
            <tbody>${r.rows.map((x) => `<tr><td>${h(x.s.name)}<br><span class="small muted">${h(x.o.title)}</span></td><td>${h(x.c.name)}</td>
              <td class="num">USD ${x.a.rate}</td><td class="num">${x.k.hoursMonth}</td><td class="num">${fmt(x.billed)}</td><td class="num">${fmt(x.fee)}</td></tr>`).join("")}</tbody>
            <tfoot><tr><td colspan="4">Total</td><td class="num">${fmt(r.billed)}</td><td class="num">${fmt(r.fees)}</td></tr></tfoot></table></div>
            <p class="small muted" style="margin-top:var(--space-2)">Los contratos nuevos arrancan con 0 horas; en un producto real las cargaría el estudiante y las aprobaría la empresa.</p>` :
            `<div class="empty"><h3>No hay contratos activos</h3><p>Cuando una empresa contrata a un postulante, aparece acá.</p></div>`}
        </section>
        <section class="stack">
          <div><h2>Compras de Connects</h2>
            ${r.buys.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Estudiante</th><th class="num">Monto</th></tr></thead>
              <tbody>${r.buys.slice().sort((a, b) => b.p.date.localeCompare(a.p.date)).map((x) => `<tr><td class="nowrap">${dateShort(x.p.date)}</td><td>${h(x.s.name)}<br><span class="small muted">${x.pack.amount} Connects</span></td><td class="num">${fmt(x.pack.usd)}</td></tr>`).join("")}</tbody></table></div>` :
              `<p class="muted small">Nadie compró Connects este mes.</p>`}
          </div>
          <div><h2>Actividad</h2>
            <dl class="facts">
              <dt>Estudiantes</dt><dd>${d.students.length} (${d.students.filter((s) => s.status === "aprobado").length} aprobados)</dd>
              <dt>Empresas</dt><dd>${d.companies.length}</dd>
              <dt>Ofertas abiertas</dt><dd>${open} de ${d.offers.length}</dd>
              <dt>Postulaciones</dt><dd>${d.applications.filter((a) => a.status !== "invitacion").length}</dd>
              <dt>Connects gastados</dt><dd>${d.applications.reduce((t, a) => t + (a.cost || 0), 0)}</dd>
            </dl>
          </div>
        </section>
      </div>`;
  }

  function reviewItem(kind, x) {
    const isS = kind === "s";
    const errKey = "reason-" + x.id;
    return `<div class="review">
      <div>
        <div class="person"><span class="mono${isS ? "" : " sq"}" aria-hidden="true">${C.initials(x.name)}</span><div>
          <h3>${h(x.name)}</h3>
          <p class="small muted">${isS ? `${h(x.career)}, ${h(x.university)}, ${x.year}.º año. ${h(x.city)}. Se registró ${when(x.joined)}.` : `${h(x.city)}, ${h(x.country)}. ${h(x.size)} personas. Se registró ${when(x.joined)}.`}</p>
          <p style="margin-top:var(--space-2)">${h(isS ? x.bio : x.about)}</p>
          ${isS ? `<div style="margin-top:var(--space-2)">${x.languages.map((l) => `<span class="tag">${langName(l.lang)} ${h(l.level)}</span>`).join("")}<span class="tag">USD ${x.rate} /h</span><span class="tag">${x.hours} h por semana</span></div>` : ""}
          ${x.status === "rechazado" ? `<p class="small" style="margin-top:var(--space-2)"><span class="status bad">Rechazado</span> ${h(x.rejectReason || "")}</p>` : ""}
        </div></div>
      </div>
      <div class="review-actions">
        ${x.status === "rechazado" ? `<button class="btn" data-action="reopen-review" data-kind="${kind}" data-id="${x.id}">Volver a revisar</button>` : `
        <form data-form="review" data-kind="${kind}" data-id="${x.id}" novalidate>
          <div class="field"><label for="r-${x.id}">Motivo si lo rechazás <span class="hint">lo ve ${isS ? "el estudiante" : "la empresa"}</span></label>
            <input id="r-${x.id}" type="text" name="reason" value="${h(ui.form[errKey] || "")}" placeholder="${isS ? "Ej.: faltan muestras de trabajo" : "Ej.: no encontramos la web de la empresa"}"${C.inv(errKey)}>${C.err(errKey)}</div>
          <div class="btns"><button class="btn btn-primary" type="submit" name="decision" value="aprobar">Aprobar</button><button class="btn btn-danger" type="submit" name="decision" value="rechazar">Rechazar</button></div>
        </form>`}
      </div>
    </div>`;
  }

  function curation() {
    const d = db();
    const ps = d.students.filter((s) => s.status === "pendiente");
    const pc = d.companies.filter((c) => c.status === "pendiente");
    const rej = d.students.filter((s) => s.status === "rechazado");
    return `<div class="page-head"><div><h1>Curaduría</h1><p>Nada se muestra a la otra parte hasta que lo apruebes. Revisá que los datos cierren y que haya algo concreto hecho.</p></div></div>
      <h2 style="font-size:var(--text-base);margin-bottom:var(--space-3)">Estudiantes por revisar (${ps.length})</h2>
      ${ps.length ? ps.map((s) => reviewItem("s", s)).join("") : `<p class="muted" style="margin-bottom:var(--space-6)">No hay estudiantes esperando. Los nuevos registros aparecen acá.</p>`}
      <h2 style="font-size:var(--text-base);margin:var(--space-6) 0 var(--space-3)">Empresas por revisar (${pc.length})</h2>
      ${pc.length ? pc.map((c) => reviewItem("c", c)).join("") : `<p class="muted">No hay empresas esperando.</p>`}
      ${rej.length ? `<h2 style="font-size:var(--text-base);margin:var(--space-6) 0 var(--space-3)">Rechazados</h2>${rej.map((s) => reviewItem("s", s)).join("")}` : ""}`;
  }

  function studentsTable() {
    const d = db();
    return `<div class="page-head"><div><h1>Estudiantes</h1><p>${plural(d.students.length, "registrado", "registrados")}.</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>Carrera</th><th>Idiomas</th><th class="num">Tarifa</th><th class="num">Connects</th><th class="num">Postulaciones</th><th>Estado</th></tr></thead>
        <tbody>${d.students.slice().sort((a, b) => b.joined.localeCompare(a.joined)).map((s) => `<tr>
          <td>${h(s.name)}<br><span class="small muted">${h(s.city)}, desde ${dateShort(s.joined)}</span></td>
          <td>${h(s.career)}<br><span class="small muted">${h(s.university)}, ${s.year}.º</span></td>
          <td>${s.languages.map((l) => `${langName(l.lang)} ${h(l.level)}`).join("<br>")}</td>
          <td class="num">USD ${s.rate}</td><td class="num">${s.connects}</td>
          <td class="num">${d.applications.filter((a) => a.studentId === s.id && a.status !== "invitacion").length}</td>
          <td>${C.statusTag(C.PROFILE_STATUS, s.status)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function companiesTable() {
    const d = db();
    return `<div class="page-head"><div><h1>Empresas</h1><p>${plural(d.companies.length, "registrada", "registradas")}.</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Empresa</th><th>País</th><th>Contacto</th><th class="num">Ofertas</th><th class="num">Contratos</th><th>Estado</th></tr></thead>
        <tbody>${d.companies.map((c) => {
          const ids = d.offers.filter((o) => o.companyId === c.id).map((o) => o.id);
          const hires = d.applications.filter((a) => ids.includes(a.offerId) && a.status === "contratada").length;
          return `<tr><td>${h(c.name)}<br><span class="small muted">${h(c.about)}</span></td><td>${h(c.country)}</td><td>${h(c.contact)}</td>
            <td class="num">${ids.length}</td><td class="num">${hires}</td><td>${C.statusTag(C.PROFILE_STATUS, c.status)}</td></tr>`;
        }).join("")}</tbody></table></div>`;
  }
  function offersTable() {
    const d = db();
    return `<div class="page-head"><div><h1>Ofertas</h1><p>${d.offers.filter((o) => o.status === "abierta").length} abiertas de ${d.offers.length}.</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Oferta</th><th>Empresa</th><th>Área</th><th class="num">Pago</th><th class="num">Horas</th><th class="num">Postulantes</th><th>Estado</th></tr></thead>
        <tbody>${d.offers.slice().sort((a, b) => b.posted.localeCompare(a.posted)).map((o) => `<tr>
          <td>${h(o.title)}<br><span class="small muted">${when(o.posted)}, ${o.cost} Connects</span></td><td>${h(company(o.companyId).name)}</td><td>${h(area(o.area))}</td>
          <td class="num">${rateRange(o)}</td><td class="num">${o.hours}</td><td class="num">${C.appsFor(o.id).filter((a) => a.status !== "invitacion").length}</td>
          <td><span class="status ${o.status === "abierta" ? "ok" : ""}">${o.status === "abierta" ? "Abierta" : "Pausada"}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function appsTable() {
    const d = db();
    const list = d.applications.slice().sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="page-head"><div><h1>Postulaciones</h1><p>${plural(list.length, "movimiento", "movimientos")}, invitaciones incluidas.</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Estudiante</th><th>Oferta</th><th class="num">Tarifa</th><th class="num">Connects</th><th>Estado</th></tr></thead>
        <tbody>${list.map((a) => { const o = offer(a.offerId); const s = student(a.studentId); if (!o || !s) return ""; return `<tr>
          <td class="nowrap">${dateShort(a.date)}</td><td>${h(s.name)}</td><td>${h(o.title)}<br><span class="small muted">${h(company(o.companyId).name)}</span></td>
          <td class="num">${a.rate ? `USD ${a.rate}` : ""}</td><td class="num">${a.cost}</td><td>${C.statusTag(C.APP_STATUS, a.status)}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function action(a, el) {
    const d = db();
    if (a === "reopen-review") {
      const list = el.dataset.kind === "s" ? d.students : d.companies;
      const x = byId(list, el.dataset.id);
      x.status = "pendiente"; delete x.rejectReason; Store.save();
      C.setNotice(`${h(x.name)} volvió a la lista de revisión.`, "warn"); CursadaRender();
    }
  }
  function submit(kind, form, f) {
    const d = db();
    if (kind === "commission") {
      const v = Number(f.commission);
      if (!(v >= 0 && v <= 40)) { ui.errors = { commission: "Poné un número entre 0 y 40." }; CursadaRender(); return; }
      d.commission = v; Store.save(); C.clearForm();
      C.setNotice(`Comisión guardada: ${v}%. Ya se ve en la landing y en el formulario de las empresas.`); CursadaRender();
    }
    if (kind === "review") {
      const decision = f.decision;
      const list = form.dataset.kind === "s" ? d.students : d.companies;
      const x = byId(list, form.dataset.id);
      const errKey = "reason-" + x.id;
      if (decision === "rechazar") {
        if (!f.reason || f.reason.trim().length < 8) {
          ui.errors = { [errKey]: "Escribí el motivo: sin eso no sabe qué corregir." }; ui.form = { [errKey]: f.reason || "" };
          window.__focusId = "r-" + x.id; CursadaRender(); return;
        }
        x.status = "rechazado"; x.rejectReason = f.reason.trim();
        C.setNotice(`Rechazaste a ${h(x.name)}. Ve el motivo en su perfil.`, "warn");
      } else {
        x.status = "aprobado";
        C.setNotice(`Aprobaste a ${h(x.name)}. ${form.dataset.kind === "s" ? "Las empresas ya pueden ver su perfil y sus postulaciones." : "Sus ofertas quedan visibles para los estudiantes."}`);
      }
      Store.save(); C.clearForm(); CursadaRender();
    }
  }
  return { render, action, submit };
})();
