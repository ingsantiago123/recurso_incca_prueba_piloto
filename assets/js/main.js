/*!
 * U.INCCA · Mazo de diapositivas interactivo — vanilla JS, sin frameworks.
 * Única dependencia externa: Font Awesome (iconos), vía CDN en index.html.
 * ---------------------------------------------------------------------
 * TODO el contenido (curso, docente, bienvenida, aprenderás, tutorías,
 * video, actividades) llega como UN SOLO objeto JSON leído desde
 * `window.name` — no desde la URL. Esto evita el límite de longitud de
 * URL (error 414) cuando hay muchas actividades.
 *
 * El sistema padre (Moodle) debe, ANTES de fijar el src del iframe:
 *
 *   const iframe = document.getElementById("visor");
 *   // OJO: es contentWindow.name (el window.name real de adentro del
 *   // iframe) — NO iframe.name, que solo es el atributo HTML del tag.
 *   iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
 *   iframe.src = "https://TU-USUARIO.github.io/TU-REPO/";
 *
 * Ver test-iframe.html en la raíz del repo para un ejemplo completo y
 * funcional de este patrón (parent que arma el JSON y lo inyecta).
 *
 * Estructura esperada del JSON (todos los campos son opcionales excepto
 * "curso"; lo que falte se completa con el recurso de ejemplo):
 *
 * {
 *   "curso": "Nombre del curso",
 *   "profesor": {
 *     "nombre": "...", "foto": "url (opcional)",
 *     "rol": "... (opcional)",
 *     "bio": ["párrafo 1", "párrafo 2"],
 *     "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }]
 *   },
 *   "video": "url de YouTube/Vimeo/Drive",
 *   "bienvenida": {
 *     "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..."
 *   },
 *   "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
 *   "tutorias": [{ "titulo": "...", "fecha_label": "...", "inicio": "ISO",
 *                  "fin": "ISO", "url_grabacion": "..." }],
 *   "actividades": [{ "nombre": "...", "url": "..." }]
 * }
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------------
   * 1. Estructura de diapositivas (fija — no es "contenido", es diseño)
   * ------------------------------------------------------------------- */
  const SLIDES = [
    { id: "hero", label: "Inicio", icon: "fa-house" },
    { id: "bienvenida", label: "Bienvenida", icon: "fa-hand-holding-heart" },
    { id: "aprenderas", label: "Aprenderás", icon: "fa-route" },
    { id: "docente", label: "Docente", icon: "fa-chalkboard-user" },
    { id: "tutorias", label: "Tutorías", icon: "fa-calendar-days" },
    { id: "dea", label: "DEA", icon: "fa-compass" },
    { id: "actividades", label: "Actividades", icon: "fa-list-check" }
  ];

  /* ---------------------------------------------------------------------
   * 2. Recurso de ejemplo — se usa cuando window.name viene vacío/roto
   *    (por ejemplo, al abrir index.html directo en el navegador, fuera
   *    del iframe). Reutiliza el contenido original del curso piloto.
   * ------------------------------------------------------------------- */
  const EJEMPLO_DEMO = {
    curso: "Conflicto Social y Político en Colombia",
    profesor: {
      nombre: "Sergio Andrés Baquero Muñoz",
      foto: "",
      rol: "Maestro en Música · Magíster en Transformación de Conflictos y Construcción de Paz",
      bio: [
        "Maestro en Música con énfasis en Composición y Arreglos, y Magíster en Transformación de Conflictos y Construcción de Paz, graduado con honores de la Universidad INCCA de Colombia. Cuenta con experiencia docente en iniciación musical, formación de ensambles universitarios y procesos educativos desde la extensión artística y cultural.",
        "Ha sido representante estudiantil y miembro del claustro de gobierno universitario. Actualmente trabaja en la Secretaría Distrital de Integración Social, Subdirección para la Vejez, y continúa vinculado a la docencia universitaria."
      ],
      etiquetas: [
        { icono: "fa-graduation-cap", texto: "Honores INCCA" },
        { icono: "fa-music", texto: "Composición y arreglos" },
        { icono: "fa-landmark", texto: "Gobierno universitario" }
      ]
    },
    video: "https://drive.google.com/file/d/1j9Nz5yjaUFQqirqmNAefUzu726Z0YxDV/preview",
    bienvenida: {
      titulo: "¡Bienvenidos al curso!",
      parrafos: [
        "Nos alegra contar con su participación en este espacio académico donde exploraremos, de manera crítica e interdisciplinar, las raíces, dinámicas y posibilidades de transformación del conflicto colombiano.",
        "A lo largo de cuatro unidades abordaremos las causas estructurales del conflicto, el papel de las comunidades y la memoria, las persistencias del conflicto en la actualidad, y las alternativas de transformación desde la justicia social, el arte y la acción colectiva.",
        "Les invitamos a asumir este recorrido con apertura, compromiso y mirada crítica: aquí el conocimiento se construye desde el diálogo, la experiencia y la reflexión compartida."
      ],
      frase_destacada: "Lucho por una educación que nos enseñe a pensar y no por una educación que nos enseñe a obedecer."
    },
    aprenderas: [
      { icono: "fa-people-group", titulo: "Memoria y resistencias comunitarias", detalle: "Reconocerás y valorarás las experiencias y resistencias de las comunidades afectadas por el conflicto, comprendiendo el papel de la memoria colectiva, las narrativas locales y las prácticas culturales como herramientas de reconstrucción social." },
      { icono: "fa-scale-balanced", titulo: "Causas estructurales del conflicto", detalle: "Analizarás críticamente las causas estructurales, sociales y políticas del conflicto armado en Colombia, aplicando teorías críticas e interdisciplinarias e identificando dinámicas de poder y desigualdad." },
      { icono: "fa-seedling", titulo: "Propuestas de transformación social", detalle: "Diseñarás propuestas de intervención social y cultural que articulen memoria, justicia social y prácticas artísticas para la transformación de conflictos." },
      { icono: "fa-dove", titulo: "Dinámicas contemporáneas y paz", detalle: "Evaluarás las dinámicas contemporáneas del conflicto, considerando factores económicos, políticos y sociales, procesos de paz y los desafíos actuales para la justicia social." }
    ],
    tutorias: [
      { titulo: "Primer encuentro: instalación de la unidad", fecha_label: "14 de septiembre · 8:00 am – 9:00 pm", inicio: "2026-09-14T08:00:00", fin: "2026-09-14T21:00:00", url_grabacion: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t1" },
      { titulo: "Segundo encuentro: causas estructurales", fecha_label: "21 de septiembre · 8:00 am – 9:00 pm", inicio: "2026-09-21T08:00:00", fin: "2026-09-21T21:00:00", url_grabacion: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t2" },
      { titulo: "Tercer encuentro: memoria y territorio", fecha_label: "28 de septiembre · 8:00 am – 9:00 pm", inicio: "2026-09-28T08:00:00", fin: "2026-09-28T21:00:00", url_grabacion: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t3" },
      { titulo: "Cuarto encuentro: cierre y evaluación", fecha_label: "5 de octubre · 8:00 am – 9:00 pm", inicio: "2026-10-05T08:00:00", fin: "2026-10-05T21:00:00", url_grabacion: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t4" }
    ],
    actividades: [
      { nombre: "Foro: presentación y expectativas del curso", url: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=1" },
      { nombre: "Lectura: causas estructurales del conflicto armado", url: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=2" },
      { nombre: "Documental: testimonios de memoria", url: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=3" },
      { nombre: "Cuestionario: autoevaluación Unidad 1", url: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=4" }
    ]
  };

  /* ---------------------------------------------------------------------
   * 3. Lectura de datos desde window.name (JSON) — con try/catch de rescate
   * ------------------------------------------------------------------- */
  function leerDatosDesdeWindowName() {
    try {
      if (!window.name) return null;
      const recibidos = JSON.parse(window.name);
      if (!recibidos || typeof recibidos !== "object" || !recibidos.curso) return null;
      return recibidos;
    } catch (e) {
      return null;
    }
  }

  function obtenerDatos() {
    const recibidos = leerDatosDesdeWindowName();
    if (!recibidos) return EJEMPLO_DEMO;
    return {
      curso: recibidos.curso,
      profesor: Object.assign({}, EJEMPLO_DEMO.profesor, recibidos.profesor || {}),
      video: recibidos.video || EJEMPLO_DEMO.video,
      bienvenida: Object.assign({}, EJEMPLO_DEMO.bienvenida, recibidos.bienvenida || {}),
      aprenderas: Array.isArray(recibidos.aprenderas) ? recibidos.aprenderas : EJEMPLO_DEMO.aprenderas,
      tutorias: Array.isArray(recibidos.tutorias) ? recibidos.tutorias : EJEMPLO_DEMO.tutorias,
      actividades: Array.isArray(recibidos.actividades) ? recibidos.actividades : EJEMPLO_DEMO.actividades
    };
  }

  function toEmbedUrl(url) {
    if (!url) return "";
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    return url;
  }

  /* ---------------------------------------------------------------------
   * 4. Utilidades
   * ------------------------------------------------------------------- */
  function icsDate(iso) {
    return iso.replace(/[-:]/g, "").split(".")[0] + "00";
  }

  function downloadIcs(tutoria) {
    const uid = `incca-${tutoria.inicio}-${Math.random().toString(36).slice(2, 8)}@unincca`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//U.INCCA//Visor de recurso//ES",
      "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(tutoria.inicio)}`, `DTEND:${icsDate(tutoria.fin)}`,
      `SUMMARY:${tutoria.titulo}`,
      "DESCRIPTION:Tutoría sincrónica — U.INCCA.",
      "LOCATION:INCCA Virtual", "END:VEVENT", "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tutoria-${tutoria.inicio.slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  let toastTimer = null;
  function showToast(message, icon) {
    const toast = $("#toast");
    if (!toast) return;
    toast.innerHTML = `<i class="fa-solid ${icon || "fa-circle-check"}" aria-hidden="true"></i><span>${message}</span>`;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function replayStagger(root) {
    $$(".stagger", root).forEach((el) => {
      el.classList.remove("is-playing");
      void el.offsetWidth; // fuerza reflow para reiniciar la animación
      el.classList.add("is-playing");
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Motor del deck — navegación entre diapositivas
   * ------------------------------------------------------------------- */
  const deck = {
    slideEls: [],
    current: 0,
    total: 0,

    init() {
      this.slideEls = SLIDES.map((s) => document.getElementById(s.id));
      this.total = this.slideEls.length;
      $("#slideTotal").textContent = this.total;
      this.slideEls.forEach((el, i) => el.setAttribute("aria-hidden", i === 0 ? "false" : "true"));
      this.slideEls[0].classList.add("is-active");
      this.updateChrome();
      replayStagger(this.slideEls[0]);
      this.runSlideExtras(SLIDES[0].id);
    },

    goTo(index) {
      const total = this.total;
      const idx = ((index % total) + total) % total; // navegación circular
      if (idx === this.current) return;
      const dir = this.directionTo(idx);
      const oldEl = this.slideEls[this.current];
      const newEl = this.slideEls[idx];

      newEl.classList.add(dir > 0 ? "is-enter-right" : "is-enter-left");
      void newEl.offsetWidth;
      oldEl.classList.remove("is-active");
      oldEl.classList.add(dir > 0 ? "is-exit-left" : "is-exit-right");
      newEl.classList.remove(dir > 0 ? "is-enter-right" : "is-enter-left");
      newEl.classList.add("is-active");
      oldEl.setAttribute("aria-hidden", "true");
      newEl.setAttribute("aria-hidden", "false");

      const cleanupClasses = ["is-exit-left", "is-exit-right", "is-enter-left", "is-enter-right"];
      setTimeout(() => {
        cleanupClasses.forEach((c) => { oldEl.classList.remove(c); newEl.classList.remove(c); });
      }, 560);

      this.current = idx;
      this.updateChrome();
      replayStagger(newEl);
      this.runSlideExtras(SLIDES[idx].id);
    },

    directionTo(idx) {
      const forward = (idx - this.current + this.total) % this.total;
      const backward = (this.current - idx + this.total) % this.total;
      return forward <= backward ? 1 : -1;
    },

    next() { this.goTo(this.current + 1); },
    prev() { this.goTo(this.current - 1); },

    updateChrome() {
      $("#slideCurrent").textContent = this.current + 1;
      $("#deckProgress").style.width = ((this.current + 1) / this.total * 100) + "%";
      $$(".deck-dot").forEach((dot, i) => dot.classList.toggle("is-active", i === this.current));
      $$(".menu-item").forEach((item, i) => item.classList.toggle("is-current", i === this.current));
    },

    runSlideExtras(id) {
      if (id === "hero") initCounters($("#hero"));
    }
  };

  /* ---------------------------------------------------------------------
   * 6. Render — chrome de navegación (topbar, dots, menú, flechas)
   * ------------------------------------------------------------------- */
  function renderChrome() {
    $("#deckDots").innerHTML = SLIDES.map((s, i) => `
      <button class="deck-dot" data-goto="${i}" aria-label="Ir a ${s.label}"></button>
    `).join("");

    $("#menuGrid").innerHTML = SLIDES.map((s, i) => `
      <button class="menu-item" data-goto="${i}">
        <div class="menu-item-icon"><i class="fa-solid ${s.icon}" aria-hidden="true"></i></div>
        <div>
          <div class="menu-item-label">${s.label}</div>
          <div class="menu-item-idx">Diapositiva ${i + 1} de ${SLIDES.length}</div>
        </div>
      </button>
    `).join("");

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        deck.goTo(Number(btn.dataset.goto));
        closeMenu();
      });
    });

    $("#prevBtn").addEventListener("click", () => deck.prev());
    $("#nextBtn").addEventListener("click", () => deck.next());
  }

  function openMenu() { $("#menuOverlay").classList.add("is-open"); $("#menuToggle").setAttribute("aria-expanded", "true"); }
  function closeMenu() { $("#menuOverlay").classList.remove("is-open"); $("#menuToggle").setAttribute("aria-expanded", "false"); }

  function initMenu() {
    $("#menuToggle").addEventListener("click", () => {
      $("#menuOverlay").classList.contains("is-open") ? closeMenu() : openMenu();
    });
    $("#menuClose").addEventListener("click", closeMenu);
    $("#menuOverlay").addEventListener("click", (e) => { if (e.target.id === "menuOverlay") closeMenu(); });
  }

  function initHeroCue() {
    const btn = $("#heroLearnCue");
    if (!btn) return;
    const targetIndex = SLIDES.findIndex((s) => s.id === "aprenderas");
    btn.addEventListener("click", () => deck.goTo(targetIndex));
  }

  function initGotoActividadesButtons() {
    const targetIndex = SLIDES.findIndex((s) => s.id === "actividades");
    ["heroActivitiesCue", "deaActivitiesCue"].forEach((id) => {
      const btn = $(`#${id}`);
      if (btn) btn.addEventListener("click", () => deck.goTo(targetIndex));
    });
  }

  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      if ($("#menuOverlay").classList.contains("is-open")) {
        if (e.key === "Escape") closeMenu();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); deck.next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); deck.prev(); }
      else if (e.key === "Home") { e.preventDefault(); deck.goTo(0); }
      else if (e.key === "End") { e.preventDefault(); deck.goTo(deck.total - 1); }
      else if (e.key === "Escape") { closeMenu(); }
    });
  }

  function initSwipe() {
    const el = $("#slides");
    let sx = 0, sy = 0, tracking = false;
    el.addEventListener("touchstart", (e) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        dx < 0 ? deck.next() : deck.prev();
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * 7. Render — Hero / Bienvenida / Docente (a partir del JSON)
   * ------------------------------------------------------------------- */
  function renderHeroYBienvenidaYDocente(datos) {
    document.title = `${datos.curso} — U.INCCA`;
    $("#courseName").textContent = datos.curso || "Curso sin nombre";

    // Docente
    const avatar = $("#teacherAvatar");
    avatar.src = datos.profesor.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(datos.profesor.nombre || "Docente")}&background=E2E6E9&color=0B349D&size=300`;
    avatar.alt = datos.profesor.nombre || "Docente del curso";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "https://ui-avatars.com/api/?name=Docente&background=E2E6E9&color=0B349D&size=300";
    };
    $("#teacherName").textContent = datos.profesor.nombre || "Docente del curso";
    $("#teacherRole").textContent = datos.profesor.rol || "";
    $("#teacherRole").hidden = !datos.profesor.rol;
    $("#teacherBio").innerHTML = (datos.profesor.bio || []).map((p) => `<p>${p}</p>`).join("");
    $("#teacherTags").innerHTML = (datos.profesor.etiquetas || []).map((t) => `
      <span class="teacher-tag"><i class="fa-solid ${t.icono || "fa-tag"}" aria-hidden="true"></i> ${t.texto}</span>
    `).join("");

    // Bienvenida
    $("#bienvenidaTitulo").textContent = datos.bienvenida.titulo || "¡Bienvenidos al curso!";
    $("#bienvenidaParrafos").innerHTML = (datos.bienvenida.parrafos || []).map((p) => `<p>${p}</p>`).join("");
    $("#bienvenidaFrase").textContent = datos.bienvenida.frase_destacada || "";
    $(".quote-card").hidden = !datos.bienvenida.frase_destacada;

    // Video
    $("#videoFrame").src = toEmbedUrl(datos.video);

    // Contadores del hero
    $("#statActividades").dataset.counter = datos.actividades.length;
    $("#statTutorias").dataset.counter = datos.tutorias.length;
    $("#activitiesSub").textContent = datos.actividades.length
      ? `${datos.actividades.length} actividad${datos.actividades.length === 1 ? "" : "es"} disponible${datos.actividades.length === 1 ? "" : "s"} — haz clic para abrir cada una.`
      : "Este recurso todavía no tiene actividades.";
  }

  /* ---------------------------------------------------------------------
   * 8. Render — "¿Qué aprenderás?"
   * ------------------------------------------------------------------- */
  function renderLearn(aprenderas) {
    const grid = $("#learnGrid");
    grid.innerHTML = aprenderas.map((item) => `
      <div class="learn-card" tabindex="0" role="button" aria-expanded="false">
        <div class="learn-card-icon"><i class="fa-solid ${item.icono || "fa-star"}" aria-hidden="true"></i></div>
        <div class="learn-card-title">${item.titulo}</div>
        <div class="learn-card-hint"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> Toca para expandir</div>
        <div class="learn-card-overlay"><p>${item.detalle}</p></div>
      </div>
    `).join("");

    function toggle(card) {
      const willOpen = !card.classList.contains("is-open");
      $$(".learn-card", grid).forEach((c) => { c.classList.remove("is-open"); c.setAttribute("aria-expanded", "false"); });
      if (willOpen) { card.classList.add("is-open"); card.setAttribute("aria-expanded", "true"); }
    }

    $$(".learn-card", grid).forEach((card) => {
      card.addEventListener("click", () => toggle(card));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(card); } });
    });
  }

  /* ---------------------------------------------------------------------
   * 9. Render — Tutorías (acordeón + descarga .ics)
   * ------------------------------------------------------------------- */
  function formatCountdown(startIso) {
    const diffMs = new Date(startIso) - new Date();
    if (diffMs <= 0) return { label: "Realizada", icon: "fa-check" };
    const days = Math.ceil(diffMs / 86400000);
    if (days <= 1) return { label: "Es hoy", icon: "fa-bolt" };
    return { label: `En ${days} días`, icon: "fa-hourglass-half" };
  }

  function renderTutorias(tutorias) {
    const list = $("#tutoriaList");
    list.innerHTML = tutorias.map((t, i) => {
      const status = formatCountdown(t.inicio);
      return `
      <div class="tutoria-item" data-index="${i}">
        <button class="tutoria-head" aria-expanded="false">
          <div class="tutoria-head-left">
            <div class="tutoria-num">${i + 1}</div>
            <div>
              <div class="tutoria-title">${t.titulo}</div>
              <div class="tutoria-date"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${t.fecha_label}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="tutoria-status" title="${status.label}"><i class="fa-solid ${status.icon}" aria-hidden="true"></i></div>
            <i class="fa-solid fa-chevron-down tutoria-chevron" aria-hidden="true"></i>
          </div>
        </button>
        <div class="tutoria-body">
          <div class="tutoria-body-inner">
            <a class="btn btn-primary btn-sm" href="${t.url_grabacion}" target="_blank" rel="noopener"><i class="fa-solid fa-video" aria-hidden="true"></i> Ver grabación</a>
            <button class="btn btn-outline btn-sm" data-ics-index="${i}"><i class="fa-regular fa-calendar-plus" aria-hidden="true"></i> Agregar al calendario</button>
          </div>
        </div>
      </div>`;
    }).join("");

    $$(".tutoria-head", list).forEach((head) => {
      head.addEventListener("click", () => {
        const item = head.closest(".tutoria-item");
        const body = $(".tutoria-body", item);
        const isOpen = item.classList.contains("is-open");
        $$(".tutoria-item", list).forEach((other) => {
          other.classList.remove("is-open");
          $(".tutoria-head", other).setAttribute("aria-expanded", "false");
          $(".tutoria-body", other).style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("is-open");
          head.setAttribute("aria-expanded", "true");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });

    $$("[data-ics-index]", list).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadIcs(tutorias[Number(btn.dataset.icsIndex)]);
        showToast("Evento descargado — ábrelo para agregarlo a tu calendario.", "fa-calendar-check");
      });
    });
  }

  /* ---------------------------------------------------------------------
   * 10. Render — Actividades (número + título + link)
   * ------------------------------------------------------------------- */
  function renderActivityCards(actividades) {
    const grid = $("#activityGrid");
    grid.innerHTML = actividades.length
      ? actividades.map((item, i) => `
        <a class="activity-card" href="${item.url}" target="_blank" rel="noopener" style="text-decoration:none">
          <div class="activity-badge">${i + 1}</div>
          <div class="activity-card-title">${item.nombre}</div>
          <span class="btn btn-primary btn-sm activity-card-btn">Abrir actividad <i class="fa-solid fa-arrow-right activity-card-open" aria-hidden="true"></i></span>
        </a>
      `).join("")
      : `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene actividades.</div>`;
  }

  /* ---------------------------------------------------------------------
   * 11. Contadores animados (hero)
   * ------------------------------------------------------------------- */
  function initCounters(root) {
    $$("[data-counter]", root).forEach((el) => {
      const target = Number(el.dataset.counter);
      const suffix = el.dataset.counterSuffix || "";
      const duration = 1100;
      let startTime = null;
      function tick(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min(1, (ts - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const datos = obtenerDatos();

    renderHeroYBienvenidaYDocente(datos);
    renderChrome();
    renderLearn(datos.aprenderas);
    renderTutorias(datos.tutorias);
    renderActivityCards(datos.actividades);
    initMenu();
    initHeroCue();
    initGotoActividadesButtons();
    initKeyboard();
    initSwipe();
    deck.init();
  });
})();
