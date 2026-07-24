/*!
 * U.INCCA · Maestría en Transformación de Conflictos y Construcción de Paz
 * Mazo de diapositivas interactivo — vanilla JS, sin frameworks.
 * Única dependencia externa: Font Awesome (iconos), vía CDN en index.html.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * 1. Datos dinámicos — curso, docente, video y actividades vienen de la
   *    URL (ver leerDatosDesdeURL más abajo). Bienvenida/Aprenderás/
   *    Tutorías son contenido fijo, igual que en el diseño original.
   * ------------------------------------------------------------------- */
  const BASE_URL = "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3";

  const SLIDES = [
    { id: "hero", label: "Inicio", icon: "fa-house" },
    { id: "bienvenida", label: "Bienvenida", icon: "fa-hand-holding-heart" },
    { id: "aprenderas", label: "Aprenderás", icon: "fa-route" },
    { id: "docente", label: "Docente", icon: "fa-chalkboard-user" },
    { id: "tutorias", label: "Tutorías", icon: "fa-calendar-days" },
    { id: "dea", label: "DEA", icon: "fa-compass" },
    { id: "actividades", label: "Actividades", icon: "fa-list-check" }
  ];

  const LEARN = [
    { icon: "fa-people-group", title: "Memoria y resistencias comunitarias", detail: "Reconocerás y valorarás las experiencias y resistencias de las comunidades afectadas por el conflicto, comprendiendo el papel de la memoria colectiva, las narrativas locales y las prácticas culturales como herramientas de reconstrucción social." },
    { icon: "fa-scale-balanced", title: "Causas estructurales del conflicto", detail: "Analizarás críticamente las causas estructurales, sociales y políticas del conflicto armado en Colombia, aplicando teorías críticas e interdisciplinarias e identificando dinámicas de poder y desigualdad." },
    { icon: "fa-seedling", title: "Propuestas de transformación social", detail: "Diseñarás propuestas de intervención social y cultural que articulen memoria, justicia social y prácticas artísticas para la transformación de conflictos." },
    { icon: "fa-dove", title: "Dinámicas contemporáneas y paz", detail: "Evaluarás las dinámicas contemporáneas del conflicto, considerando factores económicos, políticos y sociales, procesos de paz y los desafíos actuales para la justicia social." }
  ];

  const TUTORIAS = [
    { title: "Primer encuentro: instalación de la unidad", dateLabel: "14 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-14T08:00:00", end: "2026-09-14T21:00:00", recordingUrl: `${BASE_URL}&act=t1` },
    { title: "Segundo encuentro: causas estructurales", dateLabel: "21 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-21T08:00:00", end: "2026-09-21T21:00:00", recordingUrl: `${BASE_URL}&act=t2` },
    { title: "Tercer encuentro: memoria y territorio", dateLabel: "28 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-28T08:00:00", end: "2026-09-28T21:00:00", recordingUrl: `${BASE_URL}&act=t3` },
    { title: "Cuarto encuentro: cierre y evaluación", dateLabel: "5 de octubre · 8:00 am – 9:00 pm", start: "2026-10-05T08:00:00", end: "2026-10-05T21:00:00", recordingUrl: `${BASE_URL}&act=t4` }
  ];

  // Recurso de ejemplo — se usa SOLO si la URL no trae "curso"
  const EJEMPLO_DEMO = {
    course_name: "Ingeniería de Sistemas (ejemplo)",
    profesor_nombre: "Pepito Pérez",
    profesor_img_url: "https://ui-avatars.com/api/?name=Pepito+Perez&background=0B349D&color=fff&size=300&bold=true",
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    actividades_json: [
      { titulo: "Foro de bienvenida", link: "#" },
      { titulo: "Lectura introductoria", link: "#" },
      { titulo: "Quiz de repaso", link: "#" }
    ]
  };

  /**
   * El plugin de Moodle arma una URL así:
   *   ?curso=Ingenieria+de+Sistemas
   *   &profesor=Pepito+Perez
   *   &profesor_img=https%3A%2F%2Fejemplo.com%2Ffoto.jpg   (opcional)
   *   &video=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DXXXXXXXXXXX
   *   &cantidad_actividades=3
   *   &actividad_1_nombre=Foro+de+bienvenida&actividad_1_url=https%3A%2F%2F...
   * (en PHP, usar http_build_query() para que la codificación quede bien).
   */
  function leerDatosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const curso = params.get("curso");
    if (!curso) return null;
    return {
      course_name: curso,
      profesor_nombre: params.get("profesor") || "Docente del curso",
      profesor_img_url: params.get("profesor_img") || "",
      video_url: params.get("video") || "",
      actividades_json: leerActividadesDesdeURL(params)
    };
  }

  function leerActividadesDesdeURL(params) {
    const actividades = [];
    const declaradas = parseInt(params.get("cantidad_actividades"), 10);
    const conCantidadExplicita = Number.isFinite(declaradas) && declaradas > 0;
    const limite = conCantidadExplicita ? declaradas : 200;
    for (let i = 1; i <= limite; i++) {
      const nombre = params.get(`actividad_${i}_nombre`);
      const url = params.get(`actividad_${i}_url`);
      if (nombre && url) actividades.push({ titulo: nombre, link: url });
      else if (!conCantidadExplicita) break;
    }
    return actividades;
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
   * 2. Utilidades
   * ------------------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function icsDate(iso) {
    return iso.replace(/[-:]/g, "").split(".")[0] + "00";
  }

  function downloadIcs(tutoria) {
    const uid = `incca-${tutoria.start}-${Math.random().toString(36).slice(2, 8)}@unincca`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//U.INCCA//Maestria Transformacion de Conflictos//ES",
      "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(tutoria.start)}`, `DTEND:${icsDate(tutoria.end)}`,
      `SUMMARY:${tutoria.title}`,
      "DESCRIPTION:Tutoría sincrónica — Maestría en Transformación de Conflictos y Construcción de Paz\\, U.INCCA.",
      "LOCATION:INCCA Virtual", "END:VEVENT", "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tutoria-${tutoria.start.slice(0, 10)}.ics`;
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
   * 3. Motor del deck — navegación entre diapositivas
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
      // distancia circular más corta determina la dirección visual de entrada
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
   * 4. Render — chrome de navegación (topbar, dots, menú, flechas)
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

  /* ---------------------------------------------------------------------
   * Pinta las partes dinámicas (curso, docente, video, actividades)
   * ------------------------------------------------------------------- */
  function renderizarDatosDinamicos(datos) {
    document.title = `${datos.course_name} — U.INCCA`;
    $("#courseName").textContent = datos.course_name || "Curso sin nombre";

    const avatar = $("#teacherAvatar");
    avatar.src = datos.profesor_img_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(datos.profesor_nombre || "Docente")}&background=E2E6E9&color=0B349D&size=300`;
    avatar.alt = datos.profesor_nombre || "Docente del curso";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "https://ui-avatars.com/api/?name=Docente&background=E2E6E9&color=0B349D&size=300";
    };
    $("#teacherName").textContent = datos.profesor_nombre || "Docente del curso";

    $("#videoFrame").src = toEmbedUrl(datos.video_url);

    ACTIVIDADES_ACTUALES = Array.isArray(datos.actividades_json) ? datos.actividades_json : [];
    const n = ACTIVIDADES_ACTUALES.length;
    $("#statActividades").dataset.counter = n;
    $("#activitiesSub").textContent = n
      ? `${n} actividad${n === 1 ? "" : "es"} disponible${n === 1 ? "" : "s"} — haz clic para abrir cada una.`
      : "Este recurso todavía no tiene actividades.";
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
   * 5. Render — sección "¿Qué aprenderás?"
   * ------------------------------------------------------------------- */
  function renderLearn() {
    const grid = $("#learnGrid");
    grid.innerHTML = LEARN.map((item) => `
      <div class="learn-card" tabindex="0" role="button" aria-expanded="false">
        <div class="learn-card-icon"><i class="fa-solid ${item.icon}" aria-hidden="true"></i></div>
        <div class="learn-card-title">${item.title}</div>
        <div class="learn-card-hint"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> Toca para expandir</div>
        <div class="learn-card-overlay"><p>${item.detail}</p></div>
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
   * 6. Render — Tutorías (acordeón + descarga .ics)
   * ------------------------------------------------------------------- */
  function formatCountdown(startIso) {
    const diffMs = new Date(startIso) - new Date();
    if (diffMs <= 0) return { label: "Realizada", icon: "fa-check" };
    const days = Math.ceil(diffMs / 86400000);
    if (days <= 1) return { label: "Es hoy", icon: "fa-bolt" };
    return { label: `En ${days} días`, icon: "fa-hourglass-half" };
  }

  function renderTutorias() {
    const list = $("#tutoriaList");
    list.innerHTML = TUTORIAS.map((t, i) => {
      const status = formatCountdown(t.start);
      return `
      <div class="tutoria-item" data-index="${i}">
        <button class="tutoria-head" aria-expanded="false">
          <div class="tutoria-head-left">
            <div class="tutoria-num">${i + 1}</div>
            <div>
              <div class="tutoria-title">${t.title}</div>
              <div class="tutoria-date"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${t.dateLabel}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="tutoria-status" title="${status.label}"><i class="fa-solid ${status.icon}" aria-hidden="true"></i></div>
            <i class="fa-solid fa-chevron-down tutoria-chevron" aria-hidden="true"></i>
          </div>
        </button>
        <div class="tutoria-body">
          <div class="tutoria-body-inner">
            <a class="btn btn-primary btn-sm" href="${t.recordingUrl}" target="_blank" rel="noopener"><i class="fa-solid fa-video" aria-hidden="true"></i> Ver grabación</a>
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
        downloadIcs(TUTORIAS[Number(btn.dataset.icsIndex)]);
        showToast("Evento descargado — ábrelo para agregarlo a tu calendario.", "fa-calendar-check");
      });
    });
  }

  /* ---------------------------------------------------------------------
   * 7. Render — Actividades (simplificado: solo número + título + link)
   * ------------------------------------------------------------------- */
  let ACTIVIDADES_ACTUALES = [];

  function renderActivityCards() {
    const grid = $("#activityGrid");
    grid.innerHTML = ACTIVIDADES_ACTUALES.length
      ? ACTIVIDADES_ACTUALES.map((item, i) => `
        <a class="activity-card" href="${item.link}" target="_blank" rel="noopener" style="text-decoration:none">
          <div class="activity-badge">${i + 1}</div>
          <div class="activity-card-title">${item.titulo}</div>
          <span class="btn btn-primary btn-sm activity-card-btn">Abrir actividad <i class="fa-solid fa-arrow-right activity-card-open" aria-hidden="true"></i></span>
        </a>
      `).join("")
      : `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene actividades.</div>`;
  }

  /* ---------------------------------------------------------------------
   * 8. Contadores animados (hero)
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
    const datosReales = leerDatosDesdeURL();
    renderizarDatosDinamicos(datosReales || EJEMPLO_DEMO);

    renderChrome();
    renderLearn();
    renderTutorias();
    renderActivityCards();
    initMenu();
    initHeroCue();
    initGotoActividadesButtons();
    initKeyboard();
    initSwipe();
    deck.init();
  });
})();
