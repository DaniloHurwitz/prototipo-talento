// Ingreso con link por mail (sin contraseñas). Usa Supabase Auth.
(function () {
  const C = window.CursadaCore;
  const { h, ui, input, go, setNotice, noticeHtml, clearForm } = C;

  /* ---------- Textos (ES/EN: las empresas del exterior entran en inglés) ---------- */
  const T = {
    es: {
      title: (a) => `Entrar a ${a}`, wait: "Un segundo…",
      lead: "Ponés tu mail y te mandamos un link para entrar. No hay contraseña que recordar.",
      email: "Mail", send: "Mandarme el link", sending: "Mandando…",
      first: "Si es la primera vez, se crea tu cuenta con ese mail.",
      sentH: "Revisá tu mail", sentTo: (m) => `Te mandamos un link a <strong>${m}</strong>. Tocalo y entrás directo.`,
      sentNote: "Puede tardar un minuto. Si no aparece, mirá en spam. El link sirve una sola vez.",
      again: "Mandar de nuevo", other: "Usar otro mail",
      inH: "Ya entraste", inP: (m) => `Tu sesión está abierta con <strong>${m}</strong>.`,
      inNote: "Todavía falta conectar tu perfil y las ofertas a esta cuenta: lo que ves en la demo sigue siendo de ejemplo.",
      back: "Volver a la demo", out: "Salir", enter: "Entrar",
      done: (m) => `Listo, entraste con <strong>${m}</strong>.`, bye: "Saliste de tu cuenta.",
      eMissing: "Falta el mail.", eFormat: "Revisá el mail: falta la @ o el dominio.",
      eHour: "Se alcanzó el límite de mails por hora. Probá de nuevo en un rato.",
      eMinute: "Esperá un minuto antes de pedir otro link.",
      eTest: "Todavía no podemos mandar links a esa dirección: el envío de mails está en modo de prueba.",
      eInvalid: "Revisá el mail: parece que no es válido.",
      eGeneric: "No pudimos mandar el link. Probá de nuevo en unos minutos.",
      lExpired: "El link venció o ya se usó. Cada link sirve una sola vez; pedí uno nuevo.",
      lOther: "No pudimos validar el link. Pedí uno nuevo.",
      foot: "El ingreso es real: usamos tu mail solo para mandarte el link. Todo lo demás sigue siendo la demo con datos de ejemplo.",
      docTitle: "entrar",
    },
    en: {
      title: (a) => `Sign in to ${a}`, wait: "One moment…",
      lead: "Enter your email and we'll send you a link to sign in. There's no password to remember.",
      email: "Email", send: "Email me the link", sending: "Sending…",
      first: "If it's your first time, we'll create your account with this email.",
      sentH: "Check your email", sentTo: (m) => `We sent a link to <strong>${m}</strong>. Click it and you're in.`,
      sentNote: "It can take a minute. Check your spam folder if you don't see it. The link works once.",
      again: "Send again", other: "Use another email",
      inH: "You're signed in", inP: (m) => `Your session is open as <strong>${m}</strong>.`,
      inNote: "Your profile and the offers still need to be connected to this account: what you see in the demo is still sample data.",
      back: "Back to the demo", out: "Sign out", enter: "Sign in",
      done: (m) => `Done, you're signed in as <strong>${m}</strong>.`, bye: "You signed out.",
      eMissing: "The email is missing.", eFormat: "Check the email: the @ or the domain is missing.",
      eHour: "The hourly email limit was reached. Try again in a while.",
      eMinute: "Wait a minute before asking for another link.",
      eTest: "We can't send links to that address yet: email sending is in test mode.",
      eInvalid: "Check the email: it doesn't look valid.",
      eGeneric: "We couldn't send the link. Try again in a few minutes.",
      lExpired: "The link expired or was already used. Each link works once; ask for a new one.",
      lOther: "We couldn't validate the link. Ask for a new one.",
      foot: "Sign-in is real: we only use your email to send you the link. Everything else is still the demo with sample data.",
      docTitle: "sign in",
    },
  };
  const tx = () => T[C.lang()] || T.es;

  const state = {
    user: null,        // usuario con sesión iniciada (o null)
    ready: false,      // ya sabemos si hay sesión o no
    sending: false,    // mandando el link
    sentTo: null,      // mail al que mandamos el link
    linkError: null,   // motivo si el link del mail falló
  };

  /* ---------- 1. Qué trajo la dirección al volver del mail ---------- */
  const hashParams = new URLSearchParams((window.__authHash || "").replace(/^#/, ""));
  const cameFromLink = hashParams.has("access_token");
  if (hashParams.has("error")) state.linkError = hashParams.get("error_code") || hashParams.get("error");
  if (cameFromLink || state.linkError) {
    // saco los datos sensibles de la barra de direcciones
    history.replaceState(null, "", location.pathname + location.search);
  }

  /* ---------- 2. Sesión ---------- */
  const isAdmin = (u) => !!u && u.app_metadata && u.app_metadata.role === "admin";
  // No redibujar mientras la página todavía está cargando sus scripts: el primer dibujo lo hace app.js al terminar.
  const rerender = () => { if (document.readyState !== "loading" && window.CursadaRender) window.CursadaRender(); };

  sb.auth.onAuthStateChange((event, session) => {
    state.user = session ? session.user : null;
    state.ready = true;
    if (event === "SIGNED_IN" && cameFromLink && !state.welcomed) {
      state.welcomed = true;
      state.sentTo = null;
      setNotice(tx().done(h(state.user.email)));
      go("#/entrar");
      return;
    }
    if (event === "SIGNED_OUT") state.sentTo = null;
    rerender();
  });
  if (state.linkError) go("#/entrar");

  /* ---------- 3. Mensajes de error en castellano ---------- */
  function sendError(error) {
    const t = tx();
    const code = error.code || "";
    const msg = (error.message || "").toLowerCase();
    // El límite de "una vez por minuto" y el de "por hora" pueden llegar con el mismo código: los separa el texto.
    if (msg.includes("seconds")) return t.eMinute;
    if (code === "over_email_send_rate_limit" || error.status === 429) return t.eHour;
    if (code === "email_address_not_authorized") return t.eTest;
    if (code === "email_address_invalid" || msg.includes("invalid")) return t.eInvalid;
    return t.eGeneric;
  }
  const linkErrorText = (code) => (code === "otp_expired" || code === "access_denied" ? tx().lExpired : tx().lOther);

  /* ---------- 4. Pantalla ---------- */
  function render() {
    const t = tx();
    let body;
    if (!state.ready) {
      body = `<h1>${t.title(h(APP.name))}</h1><p class="lead muted">${t.wait}</p>`;
    } else if (state.user) {
      body = `<h1>${t.inH}</h1>
        <p class="lead">${t.inP(h(state.user.email))}${isAdmin(state.user) ? ` <span class="status ink">Admin</span>` : ""}</p>
        <p class="muted">${t.inNote}</p>
        <p class="actions"><a class="btn btn-primary" href="#/">${t.back}</a> <button class="btn" type="button" data-action="auth-logout">${t.out}</button></p>`;
    } else if (state.sentTo) {
      body = `<h1>${t.sentH}</h1>
        <p class="lead">${t.sentTo(h(state.sentTo))}</p>
        <p class="muted">${t.sentNote}</p>
        <p class="actions"><button class="btn" type="button" data-action="auth-resend"${state.sending ? " disabled" : ""}>${state.sending ? t.sending : t.again}</button>
        <button class="linklike" type="button" data-action="auth-other">${t.other}</button></p>`;
    } else {
      body = `<h1>${t.title(h(APP.name))}</h1>
        <p class="lead">${t.lead}</p>
        <form data-form="auth-login" novalidate>
          ${input("email", t.email, { type: "email", attrs: ' autocomplete="email" inputmode="email" autofocus' })}
          <button class="btn btn-primary" type="submit"${state.sending ? " disabled" : ""}>${state.sending ? t.sending : t.send}</button>
        </form>
        <p class="muted small" style="margin-top:var(--space-4)">${t.first}</p>`;
    }
    const linkProblem = state.linkError && !state.user
      ? `<div class="notice error" role="alert">${h(linkErrorText(state.linkError))}</div>` : "";
    return `<main id="main"><div class="auth">${noticeHtml()}${linkProblem}${body}</div></main>`;
  }

  /* ---------- 5. Acciones ---------- */
  async function send(email) {
    state.sending = true; state.linkError = null; rerender();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: APP.siteUrl, shouldCreateUser: true },
    });
    state.sending = false;
    if (error) {
      state.sentTo = null;
      ui.errors = { email: sendError(error) };
      ui.form = { email };
    } else {
      state.sentTo = email; clearForm();
    }
    rerender();
  }

  function submit(kind, form, f) {
    if (kind !== "auth-login") return false;
    const email = (f.email || "").trim();
    ui.form = { email };
    if (!email) ui.errors = { email: tx().eMissing };
    else if (!/^\S+@\S+\.\S+$/.test(email)) ui.errors = { email: tx().eFormat };
    else { ui.errors = {}; send(email); return true; }
    rerender();
    const first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus();
    return true;
  }

  function action(a) {
    if (a === "auth-logout") { sb.auth.signOut({ scope: "local" }); setNotice(tx().bye); go("#/entrar"); return true; }
    if (a === "auth-resend") { if (state.sentTo && !state.sending) send(state.sentTo); return true; }
    if (a === "auth-other") { state.sentTo = null; clearForm(); rerender(); return true; }
    return false;
  }

  // Lo que se ve en la barra de arriba
  function chip() {
    if (!state.ready) return "";
    if (state.user) {
      return `<span class="auth-chip" title="${h(state.user.email)}">${h(state.user.email)}</span><button class="linklike" type="button" data-action="auth-logout">${tx().out}</button>`;
    }
    return `<a class="btn btn-small" href="#/entrar">${tx().enter}</a>`;
  }

  window.Auth = { render, footer: () => tx().foot, docTitle: () => tx().docTitle, submit, action, chip, get user() { return state.user; }, isAdmin: () => isAdmin(state.user) };

  // Primera lectura de la sesión guardada
  sb.auth.getSession().then(({ data }) => {
    if (!state.ready) { state.user = data.session ? data.session.user : null; state.ready = true; rerender(); }
  });
})();
