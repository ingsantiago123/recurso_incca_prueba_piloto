/*!
 * U.INCCA · Visor de recurso — app.js
 * ---------------------------------------------------------------------
 * Página pensada para embeberse en Moodle vía <iframe>, así:
 *
 *   <iframe src="https://TU-USUARIO.github.io/TU-REPO/visor/?id_recurso=45"></iframe>
 *
 * Flujo:
 *   1) leerIdRecurso()        → lee "id_recurso" de la URL (URLSearchParams)
 *   2) fetchDatosRecurso(id)  → HOY: devuelve mock data (Promise).
 *                               MAÑANA: reemplazar el cuerpo por un fetch()
 *                               real a la API PHP (ver comentario abajo).
 *   3) renderizarInterfaz(datos) → pinta el HTML con esos datos.
 *
 * Cuando exista el backend PHP, SOLO hay que tocar fetchDatosRecurso().
 * Todo lo demás (lectura de la URL, render, estados de carga/error)
 * sigue funcionando igual.
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* -----------------------------------------------------------------
   * 1) Leer el parámetro id_recurso de la URL
   * ----------------------------------------------------------------- */
  function leerIdRecurso() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id_recurso");
  }

  /* -----------------------------------------------------------------
   * 2) MOCK DATA — simula la futura respuesta del backend en PHP.
   *    Estructura acordada con backend:
   *      course_name        -> string
   *      profesor_img_url    -> string (URL de imagen)
   *      profesor_nombre     -> string (opcional)
   *      video_url           -> string (YouTube/Vimeo/Drive, o ya-embebible)
   *      actividades_json    -> [{ titulo, link }, ...]
   * ----------------------------------------------------------------- */
  const MOCK_DB = {
    "45": {
      course_name: "Conflicto Social y Político en Colombia",
      profesor_nombre: "Sergio Andrés Baquero Muñoz",
      profesor_img_url: "https://ui-avatars.com/api/?name=Sergio+Baquero&background=0B349D&color=fff&size=200&bold=true",
      video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      actividades_json: [
        { titulo: "Foro: presentación y expectativas del curso", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=1" },
        { titulo: "Lectura: causas estructurales del conflicto armado", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=2" },
        { titulo: "Cuestionario: autoevaluación Unidad 1", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=3" },
        { titulo: "Taller: cartografía social del territorio", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=3&act=4" }
      ]
    },
    "46": {
      course_name: "Comercio Electrónico: Marco Legal y Fiscal",
      profesor_nombre: "Docente invitado",
      profesor_img_url: "https://ui-avatars.com/api/?name=Docente+Invitado&background=A58540&color=fff&size=200&bold=true",
      video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      actividades_json: [
        { titulo: "Lección 5: fundamentos legales del comercio electrónico", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=4&act=1" },
        { titulo: "Lección 7: aspectos fiscales del comercio electrónico", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=4&act=2" },
        { titulo: "Lección 8: protección al consumidor en línea", link: "https://moodlepruebas.unincca.edu.co/course/view.php?id=1857&section=4&act=3" }
      ]
    }
  };

  // Recurso genérico usado cuando el id no existe en MOCK_DB (o no llegó ninguno).
  const MOCK_FALLBACK = {
    course_name: "Recurso educativo de ejemplo",
    profesor_nombre: "Docente del curso",
    profesor_img_url: "https://ui-avatars.com/api/?name=U+INCCA&background=0B349D&color=fff&size=200&bold=true",
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    actividades_json: [
      { titulo: "Actividad de ejemplo 1", link: "#" },
      { titulo: "Actividad de ejemplo 2", link: "#" },
      { titulo: "Actividad de ejemplo 3", link: "#" }
    ]
  };

  function simularLatenciaDeRed(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * fetchDatosRecurso(id)
   * HOY   → devuelve mock data (simulando latencia de red real).
   * MAÑANA → reemplazar todo el cuerpo por, por ejemplo:
   *
   *   async function fetchDatosRecurso(id) {
   *     const res = await fetch(`https://TU-DOMINIO/api/recurso.php?id=${id}`);
   *     if (!res.ok) throw new Error("No se pudo obtener el recurso (" + res.status + ")");
   *     return res.json();
   *   }
   *
   * OJO CORS: si el backend PHP vive en otro dominio (ej. el propio Moodle),
   * ese endpoint debe responder con la cabecera
   * "Access-Control-Allow-Origin: https://TU-USUARIO.github.io"
   * o el navegador bloqueará la respuesta aunque el fetch "funcione".
   */
  async function fetchDatosRecurso(id) {
    await simularLatenciaDeRed(500);
    if (!id) throw new Error("No se especificó un id_recurso en la URL.");
    return MOCK_DB[id] || MOCK_FALLBACK;
  }

  /* -----------------------------------------------------------------
   * Helper: normaliza distintos tipos de URL de video a una URL embebible
   * ----------------------------------------------------------------- */
  function toEmbedUrl(url) {
    if (!url) return "";
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    return url; // se asume que ya es una URL embebible
  }

  /* -----------------------------------------------------------------
   * 3) renderizarInterfaz(datos) — pinta el DOM con los datos recibidos
   * ----------------------------------------------------------------- */
  function renderizarInterfaz(datos) {
    document.title = `${datos.course_name} — U.INCCA`;
    $("#courseName").textContent = datos.course_name || "Curso sin nombre";

    const avatar = $("#teacherAvatar");
    avatar.src = datos.profesor_img_url || "";
    avatar.alt = datos.profesor_nombre || "Docente del curso";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "https://ui-avatars.com/api/?name=Docente&background=E2E6E9&color=0B349D&size=200";
    };
    $("#teacherName").textContent = datos.profesor_nombre || "Docente del curso";

    $("#videoFrame").src = toEmbedUrl(datos.video_url);

    const grid = $("#activitiesGrid");
    const actividades = Array.isArray(datos.actividades_json) ? datos.actividades_json : [];
    grid.innerHTML = actividades.length
      ? actividades.map((act) => `
        <div class="activity-card">
          <div class="activity-card-title">${act.titulo}</div>
          <a class="activity-card-btn" href="${act.link}" target="_blank" rel="noopener">
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i> Abrir actividad
          </a>
        </div>
      `).join("")
      : `<div class="activities-empty">Este recurso todavía no tiene actividades.</div>`;

    $("#stateLoading").hidden = true;
    $("#stateError").hidden = true;
    $("#resource").hidden = false;
  }

  function mostrarError(mensaje) {
    $("#stateLoading").hidden = true;
    $("#resource").hidden = true;
    $("#stateErrorMsg").textContent = mensaje;
    $("#stateError").hidden = false;
  }

  /* -----------------------------------------------------------------
   * Init
   * ----------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    const idRecurso = leerIdRecurso();
    try {
      const datos = await fetchDatosRecurso(idRecurso);
      renderizarInterfaz(datos);
    } catch (err) {
      mostrarError(err.message || "No se pudo cargar el recurso.");
    }
  });
})();
