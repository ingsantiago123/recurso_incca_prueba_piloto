/*!
 * U.INCCA · Visor de recurso — main.js
 * ---------------------------------------------------------------------
 * Página normal (con scroll) embebible en Moodle vía <iframe>. El título
 * del curso, el docente, el video y las actividades vienen directo de la
 * URL — el resto del contenido (Bienvenida, Aprenderás, Tutorías) es fijo,
 * igual que en el diseño original.
 *
 * El plugin de Moodle arma una URL así:
 *   ?curso=Ingenieria+de+Sistemas
 *   &profesor=Pepito+Perez
 *   &profesor_img=https%3A%2F%2Fejemplo.com%2Ffoto.jpg   (opcional)
 *   &video=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DXXXXXXXXXXX
 *   &cantidad_actividades=3
 *   &actividad_1_nombre=Foro+de+bienvenida&actividad_1_url=https%3A%2F%2F...
 *   &actividad_2_nombre=Lectura+inicial&actividad_2_url=https%3A%2F%2F...
 *   &actividad_3_nombre=Quiz+final&actividad_3_url=https%3A%2F%2F...
 * (en PHP, arma esa cadena con http_build_query() para la codificación).
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* -----------------------------------------------------------------
   * Contenido fijo — igual que en el diseño original (sin datos de URL)
   * ----------------------------------------------------------------- */
  const LEARN = [
    { icon: "fa-people-group", title: "Memoria y resistencias comunitarias", detail: "Reconocerás y valorarás las experiencias y resistencias de las comunidades afectadas por el conflicto, comprendiendo el papel de la memoria colectiva, las narrativas locales y las prácticas culturales como herramientas de reconstrucción social." },
    { icon: "fa-scale-balanced", title: "Causas estructurales del conflicto", detail: "Analizarás críticamente las causas estructurales, sociales y políticas del conflicto armado en Colombia, aplicando teorías críticas e interdisciplinarias e identificando dinámicas de poder y desigualdad." },
    { icon: "fa-seedling", title: "Propuestas de transformación social", detail: "Diseñarás propuestas de intervención social y cultural que articulen memoria, justicia social y prácticas artísticas para la transformación de conflictos." },
    { icon: "fa-dove", title: "Dinámicas contemporáneas y paz", detail: "Evaluarás las dinámicas contemporáneas del conflicto, considerando factores económicos, políticos y sociales, procesos de paz y los desafíos actuales para la justicia social." }
  ];

  const TUTORIAS = [
    { title: "Primer encuentro: instalación de la unidad", dateLabel: "14 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-14T08:00:00", end: "2026-09-14T21:00:00", recordingUrl: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t1" },
    { title: "Segundo encuentro: causas estructurales", dateLabel: "21 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-21T08:00:00", end: "2026-09-21T21:00:00", recordingUrl: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t2" },
    { title: "Tercer encuentro: memoria y territorio", dateLabel: "28 de septiembre · 8:00 am – 9:00 pm", start: "2026-09-28T08:00:00", end: "2026-09-28T21:00:00", recordingUrl: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t3" },
    { title: "Cuarto encuentro: cierre y evaluación", dateLabel: "5 de octubre · 8:00 am – 9:00 pm", start: "2026-10-05T08:00:00", end: "2026-10-05T21:00:00", recordingUrl: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=t4" }
  ];

  /* -----------------------------------------------------------------
   * Recurso de ejemplo — se usa SOLO si la URL no trae "curso"
   * ----------------------------------------------------------------- */
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

  /* -----------------------------------------------------------------
   * Datos dinámicos: leídos directo de los parámetros de la URL
   * ----------------------------------------------------------------- */
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

  /* -----------------------------------------------------------------
   * renderizarInterfaz(datos) — pinta las partes dinámicas del DOM
   * ----------------------------------------------------------------- */
  function renderizarInterfaz(datos) {
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

    const videoSection = $("#video");
    if (datos.video_url) {
      videoSection.hidden = false;
      $("#videoFrame").src = toEmbedUrl(datos.video_url);
    } else {
      videoSection.hidden = true;
    }

    const actividades = Array.isArray(datos.actividades_json) ? datos.actividades_json : [];
    $("#statActividades").textContent = actividades.length;
    $("#activitiesSub").textContent = actividades.length
      ? `${actividades.length} actividad${actividades.length === 1 ? "" : "es"} disponible${actividades.length === 1 ? "" : "s"} — haz clic para abrir cada una.`
      : "Este recurso todavía no tiene actividades.";

    const grid = $("#activityGrid");
    grid.innerHTML = actividades.length
      ? actividades.map((act, i) => `
        <a class="activity-card" href="${act.link}" target="_blank" rel="noopener" style="text-decoration:none">
          <div class="activity-badge">${i + 1}</div>
          <div class="activity-card-title">${act.titulo}</div>
          <span class="btn btn-primary btn-sm activity-card-btn">Abrir actividad <i class="fa-solid fa-arrow-right activity-card-open" aria-hidden="true"></i></span>
        </a>
      `).join("")
      : `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene actividades.</div>`;

    $("#resource").hidden = false;
  }

  /* -----------------------------------------------------------------
   * ¿Qué aprenderás? — tarjetas expandibles (contenido fijo)
   * ----------------------------------------------------------------- */
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

  /* -----------------------------------------------------------------
   * Tutorías — acordeón + descarga .ics (contenido fijo)
   * ----------------------------------------------------------------- */
  function icsDate(iso) { return iso.replace(/[-:]/g, "").split(".")[0] + "00"; }

  function downloadIcs(t) {
    const uid = `incca-${t.start}-${Math.random().toString(36).slice(2, 8)}@unincca`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//U.INCCA//Visor de recurso//ES",
      "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(t.start)}`, `DTEND:${icsDate(t.end)}`,
      `SUMMARY:${t.title}`, "LOCATION:INCCA Virtual", "END:VEVENT", "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tutoria-${t.start.slice(0, 10)}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  let toastTimer = null;
  function showToast(message, icon) {
    const toast = $("#toast");
    toast.innerHTML = `<i class="fa-solid ${icon || "fa-circle-check"}" aria-hidden="true"></i><span>${message}</span>`;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

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
          <div style="display:flex;align-items:center;gap:12px">
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

  /* -----------------------------------------------------------------
   * Reveal on scroll (IntersectionObserver, sin librerías)
   * ----------------------------------------------------------------- */
  function initReveal() {
    const targets = $$(".reveal, .reveal-stagger");
    if (!("IntersectionObserver" in window) || targets.length === 0) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    targets.forEach((t) => io.observe(t));
  }

  function initHeroCue() {
    const btn = $("#heroLearnCue");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const el = document.getElementById("aprenderas");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* -----------------------------------------------------------------
   * Init
   * ----------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const datosReales = leerDatosDesdeURL();
    if (datosReales) {
      renderizarInterfaz(datosReales);
    } else {
      $("#demoBanner").hidden = false;
      renderizarInterfaz(EJEMPLO_DEMO);
    }
    renderLearn();
    renderTutorias();
    initHeroCue();
    initReveal();
  });
})();
