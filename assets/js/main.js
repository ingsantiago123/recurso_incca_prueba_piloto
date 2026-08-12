/*!
 * U.INCCA · Mazo de diapositivas interactivo — vanilla JS, sin frameworks.
 * Única dependencia externa: Font Awesome (iconos), vía CDN en index.html.
 * ---------------------------------------------------------------------
 * TODO el contenido (curso, docente, bienvenida, aprenderás, tutorías,
 * video, unidades/módulos) llega como UN SOLO objeto JSON leído desde
 * `window.name` — no desde la URL. Esto evita el límite de longitud de
 * URL (error 414) cuando el curso tiene muchos módulos.
 *
 * FORMA RECOMENDADA (la que usa Moodle): HTML estático, sin JavaScript,
 * generado en PHP con json_encode() e impreso dentro del atributo name:
 *
 *   <iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
 *     src="https://TU-USUARIO.github.io/TU-REPO/"
 *     name='{"curso":"...", "profesor":{...}, "modulos":[...]}'>
 *   </iframe>
 *
 * ALTERNATIVA (si el padre arma el iframe por JavaScript en vez de HTML
 * estático): hay que fijar contentWindow.name — NO iframe.name, que solo
 * es el atributo HTML del tag — ANTES de fijar el src:
 *
 *   const iframe = document.getElementById("incca-hero-section");
 *   iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
 *   iframe.src = "https://TU-USUARIO.github.io/TU-REPO/";
 *
 * Ver test-iframe.html en la raíz del repo para un ejemplo completo y
 * funcional del patrón estático (el que se usa en producción).
 *
 * Estructura esperada del JSON (todos los campos son opcionales excepto
 * "curso"; lo que falte se completa con el recurso de ejemplo):
 *
 * {
 *   "curso": "Nombre del curso",
 *   "resumen": "Párrafo corto debajo del título del hero",
 *   "insignias": [{ "icono": "fa-brain", "texto": "Teórico · Práctico",
 *                    "destacada": false }],
 *   "unidades": 4,
 *   "horas_trabajo": 96,
 *   "profesor": {
 *     "nombre": "...", "foto": "url (opcional)",
 *     "rol": "... (opcional)",
 *     "bio": ["párrafo 1", "párrafo 2"],
 *     "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }],
 *     "video": "url de YouTube/Vimeo/Drive (opcional; video del docente)"
 *   },
 *   "profesor_tutor": mismo formato que "profesor" (opcional). Si esta
 *     clave no llega, la diapositiva "Docente tutor" ni se muestra — no
 *     todo curso tiene ese rol asignado, así que no hay diapositiva
 *     genérica de relleno para él.
 *   "video": "url de YouTube/Vimeo/Drive (presentación del curso / DEA)",
 *   "video_titulo": "Título junto al video",
 *   "video_parrafos": ["párrafo 1", "párrafo 2"],
 *   "video_descarga_url": "url opcional de descarga del material (p. ej. el DEA)",
 *   "bienvenida": {
 *     "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..."
 *   },
 *   "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
 *   "tutorias": [{ "titulo": "...", "fecha_label": "...", "inicio": "ISO",
 *                  "fin": "ISO", "url_grabacion": "..." }],
 *   "modulos": [{ "nombre": "...", "url": "...", "ilustracion": "url (opcional)",
 *                 "sectionid": "número opcional — ver 'Puente con Moodle' abajo" }],
 *   "secciones": "opcional — ver 'Secciones: mostrar/ocultar/reordenar' abajo",
 *   "diapositivas_extra": "opcional — ver 'Diapositivas custom' abajo"
 * }
 *
 * "modulos" es el mosaico real del curso en Moodle — un arreglo YA
 * ORDENADO tal como debe verse (p. ej. CONECTA, INCCA APOYO, Semana 1,
 * Semana 2...). La cantidad es dinámica (no hay un número fijo de
 * semanas). El ícono/número grande de cada panel NO es un campo del JSON:
 * se infiere del propio "nombre" (ver unitVisualMeta) reconociendo los
 * patrones reales del mosaico — "CONECTA" → ícono de foro, "APOYO" →
 * ícono de ayuda, "Semana N" → el número N en grande; cualquier otro
 * nombre cae en un ícono genérico. "ilustracion" sí es un campo de datos
 * (url de imagen, opcional) que se muestra en el panel expandido; si
 * falta, simplemente no se muestra ilustración. Al pulsar su CTA
 * "INICIAR MÓDULO" normalmente es un enlace real (target="_blank") a la
 * URL de esa sección en Moodle — el visor no reemplaza esa página, solo
 * la referencia (ver excepción del puente con Moodle, justo abajo).
 *
 * PUENTE CON MOODLE (opcional, vía "sectionid"): si el visor está
 * embebido dentro de la MISMA página de curso que contiene esos módulos
 * (típicamente formato de curso "Mosaicos"/format_tiles + el plugin
 * local_visorincca), en vez de abrir "url" en pestaña nueva le avisa a la
 * ventana padre por postMessage para que abra el mosaico nativo ahí
 * mismo. Ver initUnitCta() más abajo para el contrato exacto del mensaje
 * y el fallback (si no hay "sectionid", o no hay confirmación del padre
 * en 500ms, o el visor no está embebido — se abre "url" en pestaña nueva,
 * igual que siempre). "sectionid" es el id real de esa sección en Moodle;
 * sin él, el puente no puede identificar qué módulo abrir y el link se
 * comporta exactamente como si el campo no existiera.
 *
 * SECCIONES: mostrar/ocultar/reordenar (opcional, vía "secciones"). Por
 * defecto existen 8 diapositivas fijas, en este orden: hero, bienvenida,
 * aprenderas, docente, docente_tutor, tutorias, dea, unidades ("docente_
 * tutor" además solo aparece si llegó "profesor_tutor", como siempre).
 * "secciones" deja controlar cada una desde el JSON, sin tocar código:
 *
 *   "secciones": {
 *     "aprenderas": { "visible": false },
 *     "unidades":   { "orden": 0 },
 *     "docente":    { "orden": 1 }
 *   }
 *
 * Cada clave es el id de la diapositiva (ver la lista de arriba); ambos
 * campos son opcionales — "visible" (default true, o el default de
 * "docente_tutor" si no se especifica) y "orden" (default: su posición
 * en la lista de arriba, 0 a 7). "orden" comparte la misma numeración
 * con "diapositivas_extra" (ver abajo): el orden final de TODO el mazo
 * es el resultado de mezclar ambas listas y ordenar por "orden" — así se
 * puede intercalar una diapositiva custom entre dos fijas.
 *
 * EXCEPCIÓN — "hero" (la portada) es la única diapositiva que NO se
 * puede tocar desde "secciones": siempre existe, siempre visible, y
 * siempre es la primera, sin importar qué "visible"/"orden" le manden.
 * Es una decisión de diseño (siempre tiene que haber una portada, y sea
 * cual sea el resto del orden tiene que abrir el mazo) forzada en código
 * — no una convención que dependa de que el plugin "se porte bien".
 *
 * DIAPOSITIVAS CUSTOM (opcional, vía "diapositivas_extra"): agrega
 * diapositivas nuevas sin tocar el HTML/JS, insertando HTML/CSS directo
 * o un iframe:
 *
 *   "diapositivas_extra": [{
 *     "id": "webinar-cierre",        // único, obligatorio
 *     "tipo": "media",               // "media" o "pagina" (default: "media")
 *     "orden": 8,                    // opcional, ver arriba
 *     "visible": true,               // opcional, default true
 *     "titulo": "Webinar de cierre", // solo se usa/muestra en tipo "media"
 *     "descripcion": "...",          // solo se usa/muestra en tipo "media"
 *     "iframe": "https://...",       // el contenido: iframe (si llegan los dos, gana "iframe")
 *     "html": "<div>...</div>"       // o HTML/CSS de confianza, inyectado tal cual (mismo criterio que Moodle)
 *   }]
 *
 * Dos tipos:
 *   - "media": diapositiva normal (con márgenes, como "Docente" o
 *     "Tutorías") — muestra título + descripción + el iframe/html en un
 *     marco contenido, con un botón para abrirlo en un modal de pantalla
 *     completa.
 *   - "pagina": a pantalla completa, igual que "Unidades" — el iframe/
 *     html ocupa toda la diapositiva, sin título/descripción; solo
 *     quedan las flechas prev/next (y los puntos de abajo) para navegar.
 *
 * Ver construirSlides(), renderCustomSlides() y crearSlideCustom() más
 * abajo para la implementación completa.
 *
 * Todo lo que varía según la materia va en el JSON. Lo único que queda
 * fijo en el HTML son etiquetas de interfaz que nunca cambian (textos de
 * botones, nombre de secciones como "Unidades" o "Docente").
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------------
   * 1. Estructura de diapositivas — combina las 8 fijas (diseño: existen
   *    en el HTML, con visibilidad/orden por defecto) con las diapositivas
   *    extra que traiga el JSON (datos.diapositivas_extra) y con los
   *    overrides de datos.secciones. Se recalcula una vez, con los datos
   *    ya cargados, antes de armar el resto del chrome (ver
   *    DOMContentLoaded al final del archivo). Contrato completo de
   *    "secciones" y "diapositivas_extra" documentado en el comentario de
   *    esquema al inicio del archivo.
   * ------------------------------------------------------------------- */
  const SLIDES_FIJAS = [
    { id: "hero", label: "Inicio" },
    { id: "bienvenida", label: "Bienvenida" },
    { id: "aprenderas", label: "Aprenderás" },
    { id: "docente", label: "Docente creador" },
    { id: "docente_tutor", label: "Docente tutor" },
    { id: "tutorias", label: "Tutorías" },
    { id: "dea", label: "DEA" },
    { id: "unidades", label: "Unidades" }
  ];

  function construirSlides(datos) {
    const config = datos.secciones;

    const fijas = SLIDES_FIJAS.map((s, i) => {
      // "hero" es la portada: SIEMPRE existe y SIEMPRE es la primera —
      // no se puede ocultar ni reordenar desde "secciones", pase lo que
      // pase en el JSON. -Infinity garantiza que ningún "orden" (por
      // grande o negativo que sea) pueda colarse antes.
      if (s.id === "hero") {
        return { id: s.id, label: s.label, custom: null, visible: true, orden: -Infinity };
      }
      const override = config[s.id] || {};
      // "docente_tutor" es la única fija cuya visibilidad por defecto NO
      // es "siempre visible": sin override explícito, depende de si
      // llegó profesor_tutor (mismo comportamiento de siempre). Un
      // override explícito (true/false) en "secciones" manda por encima
      // de esa inferencia.
      const visibleDefault = s.id === "docente_tutor" ? Boolean(datos.profesor_tutor) : true;
      return {
        id: s.id,
        label: s.label,
        custom: null,
        visible: typeof override.visible === "boolean" ? override.visible : visibleDefault,
        orden: Number.isFinite(override.orden) ? override.orden : i
      };
    });

    const extra = datos.diapositivas_extra
      .filter((d) => d && d.id)
      .map((d, i) => ({
        id: `custom-${d.id}`,
        label: d.titulo || String(d.id),
        custom: d,
        visible: d.visible !== false,
        orden: Number.isFinite(d.orden) ? d.orden : SLIDES_FIJAS.length + i
      }));

    return fijas.concat(extra)
      .filter((s) => s.visible)
      .sort((a, b) => a.orden - b.orden);
  }
  let SLIDES = [];

  /* ---------------------------------------------------------------------
   * 2. Placeholders — SOLO se usan campo por campo cuando ese campo en
   *    particular no llegó en el JSON. A diferencia de la primera versión
   *    de este patrón (una etiqueta genérica tipo "Nombre del curso"),
   *    estos placeholders son EJEMPLOS con el formato/extensión real que
   *    debería tener cada campo — y varios funcionan además como
   *    instrucción de qué poner ahí — para que quien arma el JSON (o
   *    quien prueba el visor sin datos todavía) vea de una cómo se ve
   *    cada sección llena, no una pantalla vacía. Siguen siendo
   *    OBVIAMENTE de ejemplo (marcados "(ejemplo)"/"Ejemplo:" a propósito)
   *    para que nunca se puedan confundir con datos reales de un curso.
   * ------------------------------------------------------------------- */
  const SIN_DATOS = {
    curso: "Nombre del curso (ejemplo: Ingeniería de Sistemas)",
    resumen: "Ejemplo de resumen: un párrafo breve (2-3 líneas) que cuenta de qué trata el curso, a quién está dirigido y qué lo hace valioso — la idea es que alguien lo lea en 10 segundos y entienda si le sirve.",
    insignias: [
      { icono: "fa-clock", texto: "Duración: 8 semanas (ejemplo)" },
      { icono: "fa-laptop", texto: "100% virtual (ejemplo)" },
      { icono: "fa-certificate", texto: "Con certificado (ejemplo)", destacada: true }
    ],
    unidades: 4,
    horas_trabajo: 96,
    profesor: {
      nombre: "Nombre del docente (ejemplo: María Fernanda Gómez)",
      foto: "https://i.pravatar.cc/300?img=12",
      rol: "Cargo/título profesional del docente (ejemplo: Magíster en Educación)",
      bio: [
        "Ejemplo de biografía: profesional con trayectoria en el área del curso, docente universitario/a y especialista en el tema.",
        "Un segundo párrafo puede sumar experiencia relevante, publicaciones o proyectos destacados — no hace falta que sea largo."
      ],
      etiquetas: [
        { icono: "fa-graduation-cap", texto: "Ejemplo: Magíster en..." },
        { icono: "fa-briefcase", texto: "Ejemplo: 10 años de experiencia" }
      ],
      video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
    },
    video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    video_titulo: "Título del video (ejemplo: Conoce la metodología del curso)",
    video_parrafos: [
      "Ejemplo: un párrafo breve presentando el video — de qué trata y qué va a entender el estudiante al verlo.",
      "Un segundo párrafo puede sumar contexto, como la duración o los temas cubiertos."
    ],
    video_descarga_url: "",
    bienvenida: {
      titulo: "¡Bienvenido/a al curso! (ejemplo de título)",
      parrafos: [
        "Ejemplo de bienvenida: este espacio es para saludar a tus estudiantes y contarles, en 2-3 párrafos cortos, qué encontrarán en el curso.",
        "Puede incluir cómo está organizado, qué se espera de su participación, y un cierre motivador antes de empezar."
      ],
      frase_destacada: "Una frase inspiradora que resuma el espíritu del curso (ejemplo)."
    },
    aprenderas: [
      { icono: "fa-star", titulo: "Temática 1 (ejemplo)", detalle: "Acá van los detalles de esta temática: qué conceptos se cubren y qué va a saber hacer el estudiante al dominarla." },
      { icono: "fa-star", titulo: "Temática 2 (ejemplo)", detalle: "Ejemplo de detalle: describe en un par de líneas el contenido de este bloque temático." },
      { icono: "fa-star", titulo: "Temática 3 (ejemplo)", detalle: "Podés agregar tantas temáticas como el curso necesite — no hay un número fijo." }
    ],
    tutorias: [
      {
        titulo: "Encuentro 1 (ejemplo)",
        fecha_label: "Ejemplo: 10 de septiembre · 6:00 pm – 8:00 pm",
        inicio: "2026-09-10T18:00:00",
        fin: "2026-09-10T20:00:00",
        url_grabacion: "#"
      }
    ],
    modulos: [
      { nombre: "CONECTA (ejemplo)", url: "#" },
      { nombre: "INCCA APOYO (ejemplo)", url: "#" },
      { nombre: "Semana 1 (ejemplo)", url: "#" },
      { nombre: "Semana 2 (ejemplo)", url: "#" }
    ]
  };
  // Placeholder por-campo para cada módulo del mosaico (CONECTA, INCCA
  // APOYO, Semana N...) — se aplica ítem a ítem, igual que el resto del
  // patrón, para que un módulo sin url siga viéndose sin romper el panel.
  const SIN_DATOS_MODULO = { nombre: "Nombre del módulo (ejemplo)", url: "#", ilustracion: "", sectionid: null };

  /* ---------------------------------------------------------------------
   * 3. Lectura de datos desde window.name (JSON) — con try/catch de rescate
   * ------------------------------------------------------------------- */
  function leerDatosDesdeWindowName() {
    try {
      if (!window.name) return null;
      const recibidos = JSON.parse(window.name);
      if (!recibidos || typeof recibidos !== "object") return null;
      return recibidos;
    } catch (e) {
      return null;
    }
  }

  // Completa, CAMPO POR CAMPO, lo que no haya llegado en el JSON con el
  // placeholder correspondiente — así datos parciales muestran lo real
  // que sí llegó y dejan a la vista, sin confundir, lo que todavía falta.
  function obtenerDatos() {
    const recibidos = leerDatosDesdeWindowName() || {};
    return {
      curso: recibidos.curso || SIN_DATOS.curso,
      resumen: recibidos.resumen || SIN_DATOS.resumen,
      insignias: Array.isArray(recibidos.insignias) ? recibidos.insignias : SIN_DATOS.insignias,
      unidades: Number.isFinite(recibidos.unidades) ? recibidos.unidades : SIN_DATOS.unidades,
      horas_trabajo: Number.isFinite(recibidos.horas_trabajo) ? recibidos.horas_trabajo : SIN_DATOS.horas_trabajo,
      profesor: Object.assign({}, SIN_DATOS.profesor, recibidos.profesor || {}),
      // A diferencia de "profesor" (siempre existe, con placeholders si
      // falta), "profesor_tutor" es null cuando el JSON no trae esa clave
      // — el curso puede no tener ese rol asignado todavía — y eso es lo
      // que decide si la diapositiva "Docente tutor" existe o no. Si SÍ
      // llega la clave (aunque venga casi vacía), se completa campo a
      // campo igual que el resto del patrón.
      profesor_tutor: (recibidos.profesor_tutor && typeof recibidos.profesor_tutor === "object")
        ? Object.assign({}, SIN_DATOS.profesor, recibidos.profesor_tutor)
        : null,
      video: recibidos.video || SIN_DATOS.video,
      video_titulo: recibidos.video_titulo || SIN_DATOS.video_titulo,
      video_parrafos: Array.isArray(recibidos.video_parrafos) ? recibidos.video_parrafos : SIN_DATOS.video_parrafos,
      video_descarga_url: recibidos.video_descarga_url || SIN_DATOS.video_descarga_url,
      bienvenida: Object.assign({}, SIN_DATOS.bienvenida, recibidos.bienvenida || {}),
      aprenderas: Array.isArray(recibidos.aprenderas) ? recibidos.aprenderas : SIN_DATOS.aprenderas,
      tutorias: Array.isArray(recibidos.tutorias) ? recibidos.tutorias : SIN_DATOS.tutorias,
      modulos: (Array.isArray(recibidos.modulos) ? recibidos.modulos : SIN_DATOS.modulos).map((m) => ({
        nombre: (m && m.nombre) || SIN_DATOS_MODULO.nombre,
        url: (m && m.url) || SIN_DATOS_MODULO.url,
        ilustracion: (m && m.ilustracion) || SIN_DATOS_MODULO.ilustracion,
        sectionid: (m && m.sectionid) || SIN_DATOS_MODULO.sectionid
      })),
      // Config estructural (qué diapositivas mostrar, en qué orden) — no
      // es "contenido" con placeholder, es config; por eso el default es
      // simplemente "vacío" (sin overrides / sin diapositivas extra), no
      // un objeto de ejemplo. Ver construirSlides().
      secciones: (recibidos.secciones && typeof recibidos.secciones === "object") ? recibidos.secciones : {},
      diapositivas_extra: Array.isArray(recibidos.diapositivas_extra) ? recibidos.diapositivas_extra : []
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
      $$(".deck-dot").forEach((dot, i) => dot.classList.toggle("is-active", i === this.current));
    },

    runSlideExtras(id) {
      if (id === "hero") initCounters($("#hero"));
    }
  };

  /* ---------------------------------------------------------------------
   * 6. Render — chrome de navegación (dots, flechas)
   * ------------------------------------------------------------------- */
  function renderChrome() {
    $("#deckDots").innerHTML = SLIDES.map((s, i) => `
      <button class="deck-dot" data-goto="${i}" aria-label="Ir a ${s.label}"></button>
    `).join("");

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => deck.goTo(Number(btn.dataset.goto)));
    });

    $("#prevBtn").addEventListener("click", () => deck.prev());
    $("#nextBtn").addEventListener("click", () => deck.next());
  }

  function initHeroCue() {
    const btn = $("#heroLearnCue");
    if (!btn) return;
    const targetIndex = SLIDES.findIndex((s) => s.id === "aprenderas");
    btn.addEventListener("click", () => deck.goTo(targetIndex));
  }

  function initGotoUnitsButtons() {
    const targetIndex = SLIDES.findIndex((s) => s.id === "unidades");
    ["heroUnitsCue", "deaUnitsCue"].forEach((id) => {
      const btn = $(`#${id}`);
      if (btn) btn.addEventListener("click", () => deck.goTo(targetIndex));
    });
  }

  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); deck.next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); deck.prev(); }
      else if (e.key === "Home") { e.preventDefault(); deck.goTo(0); }
      else if (e.key === "End") { e.preventDefault(); deck.goTo(deck.total - 1); }
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
  // Se usa para el docente creador (siempre presente) y el docente tutor
  // (solo si el JSON trae "profesor_tutor") — misma tarjeta, mismos ids
  // con prefijo distinto ("teacher"/"tutor") en el HTML de cada slide.
  function renderTeacherCard(idPrefix, profesor) {
    const avatar = $(`#${idPrefix}Avatar`);
    avatar.src = profesor.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(profesor.nombre || "Docente")}&background=E2E6E9&color=0B349D&size=300`;
    avatar.alt = profesor.nombre || "Docente del curso";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "https://ui-avatars.com/api/?name=Docente&background=E2E6E9&color=0B349D&size=300";
    };
    $(`#${idPrefix}Name`).textContent = profesor.nombre || "Docente del curso";
    $(`#${idPrefix}Role`).textContent = profesor.rol || "";
    $(`#${idPrefix}Role`).hidden = !profesor.rol;
    $(`#${idPrefix}Bio`).innerHTML = (profesor.bio || []).map((p) => `<p>${p}</p>`).join("");
    $(`#${idPrefix}Tags`).innerHTML = (profesor.etiquetas || []).map((t) => `
      <span class="teacher-tag"><i class="fa-solid ${t.icono || "fa-tag"}" aria-hidden="true"></i> ${t.texto}</span>
    `).join("");
    $(`#${idPrefix}Media`).classList.toggle("has-video", Boolean(profesor.video));
    if (profesor.video) {
      $(`#${idPrefix}Video`).src = toEmbedUrl(profesor.video);
      $(`#${idPrefix}VideoFrame`).hidden = false;
    } else {
      $(`#${idPrefix}VideoFrame`).hidden = true;
    }
  }

  function renderHeroYBienvenidaYDocente(datos) {
    document.title = `${datos.curso} — U.INCCA`;
    $("#courseName").textContent = datos.curso || "Curso sin nombre";
    $("#heroResumen").textContent = datos.resumen || "";

    $("#heroBadges").innerHTML = (datos.insignias || []).map((b) => `
      <span class="hero-badge ${b.destacada ? "hero-badge--solid" : ""}"><i class="fa-solid ${b.icono || "fa-circle"}" aria-hidden="true"></i> ${b.texto}</span>
    `).join("");

    $("#statUnidades").dataset.counter = datos.unidades;
    $("#statHoras").dataset.counter = datos.horas_trabajo;

    // Docente creador (+ docente tutor, si el JSON lo trae — ver renderTeacherCard)
    renderTeacherCard("teacher", datos.profesor);
    if (datos.profesor_tutor) renderTeacherCard("tutor", datos.profesor_tutor);

    // Bienvenida
    $("#bienvenidaTitulo").textContent = datos.bienvenida.titulo || "¡Bienvenidos al curso!";
    $("#bienvenidaParrafos").innerHTML = (datos.bienvenida.parrafos || []).map((p) => `<p>${p}</p>`).join("");
    $("#bienvenidaFrase").textContent = datos.bienvenida.frase_destacada || "";
    $(".quote-card").hidden = !datos.bienvenida.frase_destacada;

    // Video
    $("#videoTitulo").textContent = datos.video_titulo || "";
    $("#videoParrafos").innerHTML = (datos.video_parrafos || []).map((p) => `<p>${p}</p>`).join("");
    if (datos.video) {
      $("#videoFrame").src = toEmbedUrl(datos.video);
      $("#deaVideoFrame").hidden = false;
    } else {
      $("#deaVideoFrame").hidden = true;
    }
    const descargaBtn = $("#deaDescargaBtn");
    if (datos.video_descarga_url) {
      descargaBtn.href = datos.video_descarga_url;
      descargaBtn.hidden = false;
    } else {
      descargaBtn.hidden = true;
    }

    // Contadores del hero
    $("#statModulos").dataset.counter = datos.modulos.length;
    $("#statTutorias").dataset.counter = datos.tutorias.length;
  }

  /* ---------------------------------------------------------------------
   * 8. Render — "¿Qué aprenderás?"
   * ------------------------------------------------------------------- */
  function renderLearn(aprenderas) {
    const grid = $("#learnGrid");
    grid.innerHTML = aprenderas.length ? aprenderas.map((item) => `
      <div class="learn-card" tabindex="0" role="button" aria-expanded="false">
        <div class="learn-card-icon"><i class="fa-solid ${item.icono || "fa-star"}" aria-hidden="true"></i></div>
        <div class="learn-card-title">${item.titulo}</div>
        <div class="learn-card-hint"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> Toca para expandir</div>
        <div class="learn-card-overlay"><p>${item.detalle}</p></div>
      </div>
    `).join("") : `<div class="activity-empty"><i class="fa-solid fa-route" aria-hidden="true"></i>Este recurso todavía no tiene ruta de aprendizaje.</div>`;

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
    list.innerHTML = tutorias.length ? tutorias.map((t, i) => {
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
    }).join("") : `<div class="activity-empty"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i>Este recurso todavía no tiene tutorías programadas.</div>`;

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
   * 10. Render — Unidades (acordeón horizontal de módulos)
   * Cada módulo (CONECTA, INCCA APOYO, Semana N...) es un panel-acordeón:
   * clic para expandir/contraer, y su CTA "INICIAR MÓDULO" es un <a> real
   * (target="_blank") a la url del módulo — no dispara lógica propia, solo
   * navega, igual que cualquier enlace normal de Moodle.
   * ------------------------------------------------------------------- */
  // Paleta institucional del más claro al más oscuro (mismos tonos que
  // --gradient-institutional). Cada panel recibe UN color sólido tomado de
  // un punto de este degradé según su posición (índice/total) — no el
  // degradé completo — para que se note la progresión clara→oscura Y la
  // separación/forma de cada panel a la vez, en vez de una sola mancha
  // continua o colores sueltos sin relación entre sí.
  const UNIT_GRADIENT_STOPS = [
    { t: 0, rgb: [101, 203, 227] },   // light-cyan
    { t: 0.42, rgb: [43, 139, 250] }, // dodger-blue
    { t: 0.70, rgb: [11, 52, 157] },  // royal-blue
    { t: 1, rgb: [4, 12, 56] }        // oxford-blue
  ];
  function unitColorAt(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < UNIT_GRADIENT_STOPS.length - 1; i++) {
      const a = UNIT_GRADIENT_STOPS[i], b = UNIT_GRADIENT_STOPS[i + 1];
      if (t >= a.t && t <= b.t) {
        const localT = (t - a.t) / (b.t - a.t || 1);
        const rgb = a.rgb.map((c, idx) => Math.round(c + (b.rgb[idx] - c) * localT));
        return `rgb(${rgb.join(",")})`;
      }
    }
    return `rgb(${UNIT_GRADIENT_STOPS[UNIT_GRADIENT_STOPS.length - 1].rgb.join(",")})`;
  }

  // El nombre es lo único garantizado por módulo, así que el ícono/número
  // "más asertado" se infiere del propio nombre — no es un campo aparte
  // del JSON. Reconoce los patrones reales del mosaico de Moodle (CONECTA,
  // INCCA APOYO, Semana N); cualquier otro nombre cae en un ícono genérico.
  function unitVisualMeta(nombre) {
    const n = (nombre || "").toLowerCase();
    if (n.includes("conecta")) return { icon: "fa-comments" };
    if (n.includes("apoyo")) return { icon: "fa-handshake" };
    const num = n.match(/(\d+)/);
    if (n.includes("semana") && num) return { number: num[1] };
    return { icon: "fa-layer-group" };
  }

  function renderUnitsAccordion(modulos) {
    const hero = $("#unitsHero");
    if (!hero) return;
    if (!modulos.length) {
      hero.innerHTML = `<div class="activity-empty"><i class="fa-solid fa-door-closed" aria-hidden="true"></i>Este recurso todavía no tiene unidades.</div>`;
      return;
    }
    hero.innerHTML = modulos.map((m, i) => {
      const meta = unitVisualMeta(m.nombre);
      const iconoHtml = meta.number
        ? `<div class="unit-panel-number" aria-hidden="true">${meta.number}</div>`
        : `<div class="unit-panel-icon" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></div>`;
      // Invertido a propósito: el primer módulo sale más oscuro y el
      // degradé se va aclarando hacia el último (antes era al revés).
      const t = modulos.length > 1 ? 1 - i / (modulos.length - 1) : 1;
      const color = unitColorAt(t);
      return `
      <div class="unit-panel" role="button" tabindex="0" data-unit="${i}" aria-label="${m.nombre}" style="z-index:${modulos.length - i}; --unit-color:${color}">
        ${iconoHtml}
        <div class="unit-footer">
          <div class="unit-footer-shape"><span class="unit-footer-label">${m.nombre}</span></div>
        </div>
        <div class="unit-active-content">
          <div class="unit-watermark" aria-hidden="true"><span>${m.nombre} · ${m.nombre}</span></div>
          <span class="unit-tag">UNIDAD ${i + 1}</span>
          <h3 class="unit-title">${m.nombre}</h3>
          <div class="unit-illustration">${m.ilustracion ? `<img src="${m.ilustracion}" alt="" loading="lazy">` : ""}</div>
          <a class="unit-cta" href="${m.url}" target="_blank" rel="noopener" data-sectionid="${m.sectionid || ""}">
            INICIAR MÓDULO
            <span class="unit-cta-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
          </a>
        </div>
      </div>`;
    }).join("");

    // Confirmado con curl (headers idénticos a un <img> real: Referer,
    // Sec-Fetch-*, UA de Chrome, repetido varias veces) que algunos Moodle
    // bloquean la carga cross-site de pluginfile.php desde <img> en el
    // navegador real, aunque la MISMA url funcione perfecto navegando
    // directo y el servidor nunca mande ningún header CORS/CORP/Referer
    // distinto entre los dos casos — no hay nada del lado del visor que
    // pueda "arreglar" eso de forma confiable. Por eso, si el intento
    // directo falla, se reintenta UNA vez a través de un proxy de
    // imágenes genérico (images.weserv.nl — no depende de ningún dominio
    // de Moodle en particular, sirve cualquier url pública): el navegador
    // ya no le pide la imagen al dominio bloqueado, se la pide a un CDN
    // conocido que sí manda Access-Control-Allow-Origin. Si el proxy
    // TAMBIÉN falla (url realmente rota/inexistente), recién ahí se cae al
    // link "Ver ilustración" como último recurso. El campo "ilustracion"
    // del JSON no cambia en ningún paso, solo cómo se usa acá.
    function proxyIlustracionUrl(url) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    $$(".unit-illustration img", hero).forEach((img) => {
      const urlOriginal = img.getAttribute("src");
      let viaProxy = false;
      img.addEventListener("error", () => {
        if (!viaProxy) {
          viaProxy = true;
          img.src = proxyIlustracionUrl(urlOriginal);
          return;
        }
        const contenedor = img.closest(".unit-illustration");
        img.remove();
        if (contenedor && urlOriginal) {
          contenedor.innerHTML = `
            <a class="unit-illustration-fallback" href="${urlOriginal}" target="_blank" rel="noopener">
              <i class="fa-solid fa-image" aria-hidden="true"></i> Ver ilustración
            </a>`;
        }
      });
    });

    $$(".unit-cta", hero).forEach((a) => initUnitCta(a));

    $$(".unit-panel", hero).forEach((panelEl) => {
      panelEl.addEventListener("click", (e) => {
        if (e.target.closest(".unit-cta")) return; // el <a> maneja su propia navegación
        toggleUnit(panelEl);
      });
      panelEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleUnit(panelEl); }
      });
    });
  }

  function toggleUnit(panelEl) {
    const willOpen = !panelEl.classList.contains("expanded");
    $$(".unit-panel", panelEl.parentElement).forEach((p) => p.classList.remove("expanded"));
    if (willOpen) panelEl.classList.add("expanded");
  }

  // Puente con la página que embebe el visor (Moodle + local_visorincca +
  // formato de curso "Mosaicos"): en vez de navegar de una, le avisa a la
  // ventana padre por postMessage para que abra el mosaico nativo ahí mismo,
  // sin pestaña nueva ni recarga. Si no hay confirmación a tiempo — porque
  // el visor está suelto (sin iframe), el padre no tiene el plugin, o
  // cualquier otro caso no contemplado — cae de vuelta a abrir "url" en
  // pestaña nueva, el comportamiento de siempre. Nunca debe quedar un click
  // sin efecto.
  const UNIT_CTA_ACK_TIMEOUT_MS = 500;
  function initUnitCta(a) {
    a.addEventListener("click", (e) => {
      const sectionid = Number(a.dataset.sectionid) || null;
      if (window.self === window.top || !sectionid) return; // no embebido o sin dato para el puente: link normal

      e.preventDefault();
      let confirmado = false;

      const alRecibirMensaje = (ev) => {
        const d = ev.data;
        if (d && d.source === "visorincca" && d.type === "modulo-abierto" && d.sectionid === sectionid) {
          confirmado = true;
          window.removeEventListener("message", alRecibirMensaje);
        }
      };
      window.addEventListener("message", alRecibirMensaje);
      window.parent.postMessage({ source: "visorincca", type: "abrir-modulo", sectionid }, "*");

      setTimeout(() => {
        window.removeEventListener("message", alRecibirMensaje);
        if (!confirmado) window.open(a.href, "_blank", "noopener");
      }, UNIT_CTA_ACK_TIMEOUT_MS);
    });
  }

  /* ---------------------------------------------------------------------
   * 11. Render — Diapositivas custom (datos.diapositivas_extra)
   * Cada entrada de "diapositivas_extra" no tiene un <section> propio en
   * index.html — se crea acá, en JS, la primera vez que aparece en SLIDES.
   * Dos tipos (campo "tipo", cualquier valor que no sea "pagina" cae en
   * "media"):
   *   - "media": diapositiva normal (con padding, como Docente o
   *     Tutorías) con título + descripción + el iframe/html en un marco
   *     contenido, más un botón para abrirlo en el modal de pantalla
   *     completa ("otra pantalla").
   *   - "pagina": a pantalla completa (misma clase .slide-fullbleed que
   *     usa Unidades) — el iframe/html ocupa toda la diapositiva, sin
   *     título/descripción; solo quedan las flechas prev/next (y los
   *     puntos de abajo) para navegar.
   * El contenido es "iframe" (url) o "html" (string, inyectado tal cual
   * — es contenido de confianza que arma el plugin de Moodle, mismo
   * criterio que los cuadros de "insertar HTML" del propio Moodle) — si
   * llegan ambos, gana "iframe"; si no llega ninguno, se muestra un
   * mensaje de "sin contenido" en vez de una diapositiva vacía rota.
   * ------------------------------------------------------------------- */
  function contenidoEmbebidoCustom(custom) {
    if (custom.iframe) {
      const tituloSeguro = (custom.titulo || "Recurso").replace(/"/g, "&quot;");
      return `<iframe src="${custom.iframe}" title="${tituloSeguro}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    }
    if (custom.html) return custom.html;
    return `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene contenido.</div>`;
  }

  function crearSlideCustom(id, custom) {
    const esPagina = custom.tipo === "pagina";
    const section = document.createElement("section");
    section.id = id;
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "diapositiva");
    section.setAttribute("aria-label", custom.titulo || String(custom.id));
    section.className = esPagina ? "slide slide-fullbleed" : "slide";

    if (esPagina) {
      section.innerHTML = `
        <div class="slide-body">
          <div class="custom-page">${contenidoEmbebidoCustom(custom)}</div>
        </div>`;
    } else {
      section.innerHTML = `
        <div class="slide-body">
          <div class="slide-head">
            <div class="tag"><i class="fa-solid fa-photo-film" aria-hidden="true"></i> Recurso</div>
            ${custom.titulo ? `<h2 class="heading">${custom.titulo}</h2>` : ""}
            ${custom.descripcion ? `<p class="sub">${custom.descripcion}</p>` : ""}
          </div>
          <div class="custom-media-frame">
            ${contenidoEmbebidoCustom(custom)}
            <button class="custom-media-expand" type="button" aria-label="Abrir en pantalla completa">
              <i class="fa-solid fa-expand" aria-hidden="true"></i>
            </button>
          </div>
        </div>`;
      $(".custom-media-expand", section).addEventListener("click", () => openMediaModal(custom));
    }
    return section;
  }

  // Crea (si hace falta) el <section> de cada diapositiva custom y
  // reordena TODAS las diapositivas (fijas + custom) dentro de #slides
  // según el orden final ya calculado en SLIDES — reinsertar un nodo que
  // ya es hijo de #slides simplemente lo mueve a esa posición, así que
  // este mismo paso resuelve tanto crear las nuevas como reordenar las
  // fijas cuando "orden" las cambia de lugar.
  function renderCustomSlides(slides) {
    const contenedor = $("#slides");
    slides.forEach((s) => {
      let el = document.getElementById(s.id);
      if (!el && s.custom) el = crearSlideCustom(s.id, s.custom);
      if (el) contenedor.appendChild(el);
    });
  }

  function openMediaModal(custom) {
    $("#customMediaModalTitle").textContent = custom.titulo || "";
    $("#customMediaModalTitle").hidden = !custom.titulo;
    $("#customMediaModalDescripcion").textContent = custom.descripcion || "";
    $("#customMediaModalDescripcion").hidden = !custom.descripcion;
    $("#customMediaModalBody").innerHTML = contenidoEmbebidoCustom(custom);
    $("#customMediaModalOverlay").classList.add("is-open");
  }

  function closeMediaModal() {
    $("#customMediaModalOverlay").classList.remove("is-open");
    $("#customMediaModalBody").innerHTML = ""; // corta el iframe al cerrar (que no siga sonando/corriendo de fondo)
  }

  function initMediaModal() {
    $("#customMediaModalClose").addEventListener("click", closeMediaModal);
    $("#customMediaModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "customMediaModalOverlay") closeMediaModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#customMediaModalOverlay").classList.contains("is-open")) closeMediaModal();
    });
  }

  /* ---------------------------------------------------------------------
   * 12. Contadores animados (hero)
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
    SLIDES = construirSlides(datos);

    // Cualquier diapositiva FIJA que quedó fuera de SLIDES (visible:false
    // propio, o —para "docente_tutor"— ausencia de profesor_tutor) se
    // saca del árbol de accesibilidad, no solo se deja invisible por CSS.
    const idsVisibles = new Set(SLIDES.map((s) => s.id));
    SLIDES_FIJAS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) el.hidden = !idsVisibles.has(s.id);
    });

    renderCustomSlides(SLIDES);
    renderHeroYBienvenidaYDocente(datos);
    renderChrome();
    renderLearn(datos.aprenderas);
    renderTutorias(datos.tutorias);
    renderUnitsAccordion(datos.modulos);
    initHeroCue();
    initGotoUnitsButtons();
    initMediaModal();
    initKeyboard();
    initSwipe();
    deck.init();
  });
})();
