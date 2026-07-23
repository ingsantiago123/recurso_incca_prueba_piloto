/*!
 * U.INCCA · Maestría en Transformación de Conflictos y Construcción de Paz
 * Mazo de diapositivas interactivo — vanilla JS, sin frameworks.
 * Única dependencia externa: Font Awesome (iconos), vía CDN en index.html.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * 1. Datos del curso — edita aquí para actualizar el contenido
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

  // category: foros | lecturas | multimedia | evaluacion | talleres
  const ACTIVITIES = [
    { type: "Foro", category: "foros", icon: "fa-comments", title: "Presentación y expectativas del curso", href: "./actividades/actividad-1.html", gamified: true },
    { type: "Lectura", category: "lecturas", icon: "fa-book-open", title: "Causas estructurales del conflicto armado", href: "./actividades/actividad-2.html", gamified: true },
    { type: "Video", category: "multimedia", icon: "fa-circle-play", title: "Documental: testimonios de memoria", href: "./actividades/actividad-3.html", gamified: true },
    { type: "Cuestionario", category: "evaluacion", icon: "fa-list-check", title: "Autoevaluación Unidad 1", href: "./actividades/actividad-4.html", gamified: true },
    { type: "Taller", category: "talleres", icon: "fa-hands-holding-circle", title: "Cartografía social del territorio", href: "./actividades/actividad-5.html", gamified: true },
    { type: "Foro debate", category: "foros", icon: "fa-comments", title: "Actores del conflicto armado" },
    { type: "Tarea", category: "talleres", icon: "fa-pen-to-square", title: "Ensayo crítico: justicia transicional" },
    { type: "Wiki", category: "lecturas", icon: "fa-diagram-project", title: "Glosario colaborativo de paz" },
    { type: "Recurso", category: "multimedia", icon: "fa-podcast", title: "Podcast: resistencias comunitarias" },
    { type: "Cierre", category: "evaluacion", icon: "fa-flag-checkered", title: "Autoevaluación y cierre de unidad" }
  ];

  const FILTERS = [
    { key: "todas", label: "Todas", icon: "fa-border-all" },
    { key: "foros", label: "Foros", icon: "fa-comments" },
    { key: "lecturas", label: "Lecturas", icon: "fa-book-open" },
    { key: "multimedia", label: "Multimedia", icon: "fa-circle-play" },
    { key: "evaluacion", label: "Evaluación", icon: "fa-list-check" },
    { key: "talleres", label: "Talleres", icon: "fa-hands-holding-circle" }
  ];

  const STORAGE_KEY = "incca-conflicto-social-progreso";

  /* ---------------------------------------------------------------------
   * 2. Utilidades
   * ------------------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveProgress(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* almacenamiento no disponible */ }
  }

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
   * 7. Render — Actividades (filtros + búsqueda + progreso)
   * ------------------------------------------------------------------- */
  let completed = new Set(loadProgress());
  let activeFilter = "todas";
  let searchTerm = "";

  function updateProgressUI() {
    const total = ACTIVITIES.length;
    const done = completed.size;
    const pct = Math.round((done / total) * 100);
    $("#progressFill").style.width = pct + "%";
    $("#progressLabel").textContent = `${done} de ${total} completadas (${pct}%)`;
  }

  function renderActivityCards() {
    const grid = $("#activityGrid");
    const term = searchTerm.trim().toLowerCase();

    let anyVisible = false;
    const cards = ACTIVITIES.map((item, i) => {
      const matchesFilter = activeFilter === "todas" || item.category === activeFilter;
      const matchesSearch = !term || item.title.toLowerCase().includes(term) || item.type.toLowerCase().includes(term);
      const visible = matchesFilter && matchesSearch;
      if (visible) anyVisible = true;
      const isDone = completed.has(i);
      return `
      <div class="activity-card ${visible ? "" : "is-hidden"} ${isDone ? "is-done" : ""}" data-index="${i}">
        <a href="${item.href || `${BASE_URL}&act=${i + 1}`}" target="_blank" rel="noopener" style="text-decoration:none;display:block;color:inherit">
          <div class="activity-card-top">
            <div class="activity-badge"><i class="fa-solid ${item.icon}" aria-hidden="true"></i></div>
            <div class="activity-type">${item.type}</div>
          </div>
          <div class="activity-card-title">${item.title}</div>
          ${item.gamified ? `<div class="activity-gamified-tag"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> Actividad gamificada</div>` : ""}
          <div class="activity-card-foot">
            <span>Actividad ${i + 1} de ${ACTIVITIES.length}</span>
            <i class="fa-solid fa-arrow-right activity-card-open" aria-hidden="true"></i>
          </div>
        </a>
        <button class="activity-check" data-check-index="${i}" aria-label="Marcar actividad ${i + 1} como completada"><i class="fa-solid fa-check" aria-hidden="true"></i></button>
      </div>`;
    }).join("");

    grid.innerHTML = cards + (anyVisible ? "" : `
      <div class="activity-empty"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>No encontramos actividades con ese filtro o búsqueda.</div>
    `);

    $$("[data-check-index]", grid).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = Number(btn.dataset.checkIndex);
        if (completed.has(idx)) completed.delete(idx); else completed.add(idx);
        saveProgress(Array.from(completed));
        updateProgressUI();
        btn.closest(".activity-card").classList.toggle("is-done", completed.has(idx));
        if (completed.size === ACTIVITIES.length) showToast("¡Completaste todas las actividades de la unidad!", "fa-trophy");
      });
    });
  }

  function renderActivityFilters() {
    const bar = $("#activityFilters");
    bar.innerHTML = FILTERS.map((f) => `
      <button class="filter-chip ${f.key === activeFilter ? "is-active" : ""}" data-filter="${f.key}">
        <i class="fa-solid ${f.icon}" aria-hidden="true"></i> ${f.label}
      </button>
    `).join("");

    $$("[data-filter]", bar).forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        $$("[data-filter]", bar).forEach((b) => b.classList.toggle("is-active", b === btn));
        renderActivityCards();
      });
    });
  }

  function initActivitySearch() {
    const input = $("#activitySearchInput");
    input.addEventListener("input", () => { searchTerm = input.value; renderActivityCards(); });
  }

  function initProgressReset() {
    $("#progressReset").addEventListener("click", () => {
      completed = new Set();
      saveProgress([]);
      updateProgressUI();
      renderActivityCards();
      showToast("Progreso reiniciado.", "fa-rotate-left");
    });
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
    renderChrome();
    renderLearn();
    renderTutorias();
    renderActivityFilters();
    renderActivityCards();
    updateProgressUI();
    initActivitySearch();
    initProgressReset();
    initMenu();
    initHeroCue();
    initKeyboard();
    initSwipe();
    deck.init();
  });
})();
