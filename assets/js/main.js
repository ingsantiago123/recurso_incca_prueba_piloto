/*!
 * U.INCCA · Visor de recurso — main.js
 * ---------------------------------------------------------------------
 * Página pensada para embeberse en Moodle vía <iframe>. TODOS los datos
 * viajan directo en la URL — no hay backend ni base de datos de por medio.
 * El plugin de Moodle arma una URL así:
 *
 *   ?curso=Ingenieria+de+Sistemas
 *   &profesor=Pepito+Perez
 *   &profesor_img=https%3A%2F%2Fejemplo.com%2Ffoto.jpg   (opcional)
 *   &video=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DXXXXXXXXXXX
 *   &cantidad_actividades=3
 *   &actividad_1_nombre=Foro+de+bienvenida&actividad_1_url=https%3A%2F%2F...
 *   &actividad_2_nombre=Lectura+inicial&actividad_2_url=https%3A%2F%2F...
 *   &actividad_3_nombre=Quiz+final&actividad_3_url=https%3A%2F%2F...
 *
 * (en PHP, arma esa cadena con http_build_query() para que la codificación
 * de espacios/acentos/símbolos quede siempre correcta).
 *
 * Flujo:
 *   1) leerDatosDesdeURL()    → lee todos los parámetros con URLSearchParams.
 *   2) renderizarInterfaz(datos) → pinta el HTML con esos datos.
 *
 * Si la URL no trae "curso" se muestra un recurso de EJEMPLO con un
 * banner que lo avisa, solo para que siempre haya algo que ver.
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

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
   * Lee TODOS los datos directo de los parámetros de la URL.
   * Devuelve null si no viene "curso" (no hay datos reales que leer).
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

  /**
   * Reconstruye el arreglo de actividades a partir de los pares
   * actividad_N_nombre / actividad_N_url.
   * Si viene "cantidad_actividades" lo usa como límite exacto; si no,
   * autodetecta contando hasta el primer hueco (con un tope de seguridad).
   */
  function leerActividadesDesdeURL(params) {
    const actividades = [];
    const declaradas = parseInt(params.get("cantidad_actividades"), 10);
    const conCantidadExplicita = Number.isFinite(declaradas) && declaradas > 0;
    const limite = conCantidadExplicita ? declaradas : 200; // tope de seguridad si autodetecta

    for (let i = 1; i <= limite; i++) {
      const nombre = params.get(`actividad_${i}_nombre`);
      const url = params.get(`actividad_${i}_url`);

      if (nombre && url) {
        actividades.push({ titulo: nombre, link: url });
      } else if (!conCantidadExplicita) {
        break; // autodetectando: al primer hueco, se asume que ya no hay más
      }
    }
    return actividades;
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
   * renderizarInterfaz(datos) — pinta el DOM con los datos recibidos
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

    const grid = $("#activityGrid");
    const actividades = Array.isArray(datos.actividades_json) ? datos.actividades_json : [];
    grid.innerHTML = actividades.length
      ? actividades.map((act, i) => `
        <div class="activity-card">
          <div class="activity-badge">${i + 1}</div>
          <div class="activity-card-title">${act.titulo}</div>
          <a class="btn btn-primary btn-sm activity-card-btn" href="${act.link}" target="_blank" rel="noopener">
            Abrir actividad <i class="fa-solid fa-arrow-right activity-card-open" aria-hidden="true"></i>
          </a>
        </div>
      `).join("")
      : `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene actividades.</div>`;

    $("#resource").hidden = false;
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
  });
})();
