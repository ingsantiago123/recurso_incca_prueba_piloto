# Visor de recurso educativo — U.INCCA

Mazo de diapositivas interactivo (HTML/CSS/JS puro, sin frameworks) para la
Universidad INCCA de Colombia. Es una plantilla **genérica**: no tiene
ningún curso "quemado" en el código — todo el contenido (nombre del curso,
docente, video, bienvenida, ruta de aprendizaje, tutorías y actividades) se
lo pasa un sistema externo (un plugin de Moodle) como un objeto **JSON**,
y la página se pinta sola con esos datos.

Publicado en GitHub Pages: **https://ingsantiago123.github.io/recurso_incca_prueba_piloto/**

---

## Índice

1. [Cómo funciona (arquitectura)](#cómo-funciona-arquitectura)
2. [Estructura de archivos](#estructura-de-archivos)
3. [El JSON, campo por campo](#el-json-campo-por-campo)
4. [Qué pasa si un campo no llega](#qué-pasa-si-un-campo-no-llega)
5. [Las 7 diapositivas](#las-7-diapositivas)
6. [Cómo embeberlo en Moodle](#cómo-embeberlo-en-moodle)
7. [Cómo probarlo](#cómo-probarlo)
8. [Actividades gamificadas (`/actividades/`)](#actividades-gamificadas-actividades)
9. [Publicar / actualizar en GitHub Pages](#publicar--actualizar-en-github-pages)
10. [Paleta y tipografía](#paleta-y-tipografía)
11. [Funciones interactivas](#funciones-interactivas)
12. [Archivos que NO están en el repo](#archivos-que-no-están-en-el-repo)
13. [Notas técnicas y límites conocidos](#notas-técnicas-y-límites-conocidos)

---

## Cómo funciona (arquitectura)

```
Moodle (PHP)  →  arma un objeto con los datos del curso
              →  lo convierte a texto con json_encode()
              →  lo imprime dentro del atributo `name` de un <iframe>
              →  el iframe carga index.html (este sitio)
                        ↓
index.html    →  assets/js/main.js lee window.name (JSON.parse)
              →  completa con placeholders lo que no haya llegado
              →  pinta el HTML (título, docente, video, actividades…)
              →  arma el mazo de diapositivas y lo activa
```

**Por qué `window.name` y no parámetros de la URL (`?curso=...`):** la
primera versión pasaba los datos por `URLSearchParams`. Con pocos campos
funcionaba, pero en cuanto un curso tiene muchas actividades la URL supera
el límite de longitud que soportan navegadores y servidores (error 414) y
la página se rompe. `window.name` no tiene ese límite práctico (soporta
varios MB), así que ahora **todo** el contenido va ahí, sin importar
cuántas actividades, tutorías o tarjetas tenga el curso.

No hace falta backend ni base de datos para que el visor funcione — el
JSON ya trae todo lo que necesita pintar. El "backend" real es quien sea
que arme ese JSON del lado de Moodle (hoy, para pruebas, es HTML estático
escrito a mano; a futuro, un plugin PHP que consulte la base de datos de
Moodle y genere el mismo JSON).

---

## Estructura de archivos

```
index.html                     ← el visor genérico (único punto de entrada real)
assets/
  css/styles.css                ← paleta institucional + todos los estilos del deck
  js/main.js                    ← lectura del JSON + toda la lógica del deck
  css/actividad.css             ← estilos de las páginas de /actividades/
  js/actividad.js               ← motor de gamificación de /actividades/
  img/unincca-emblem.png        ← escudo institucional (recortado de unincca.png)
  img/unincca.png               ← logo oficial completo (con texto "unincca")
  img/favicon.png                ← ícono de pestaña (generado del escudo)
  img/apple-touch-icon.png       ← ícono para "agregar a inicio" en iOS
actividades/
  actividad-1.html … actividad-5.html   ← 5 actividades gamificadas de prueba piloto
test-iframe.html               ← ejemplo funcional del <iframe> que debe generar Moodle
README.md                      ← este archivo
```

`index.html` **no tiene ningún dato de curso escrito en el HTML.** Todos
los `id` visibles (`#courseName`, `#teacherName`, `#activityGrid`, etc.)
empiezan vacíos y los llena `main.js` en cuanto lee el JSON.

---

## El JSON, campo por campo

Esta es la estructura completa que espera `main.js`. **Solo importa el
objeto en sí** — de dónde salga (atributo `name` estático o JS) es un
detalle de transporte, no cambia el contenido.

```json
{
  "curso": "Ingeniería de Alimentos",
  "resumen": "Fundamentos de ciencia y tecnología de alimentos...",
  "insignias": [
    { "icono": "fa-brain", "texto": "Teórico · Práctico" },
    { "icono": "fa-laptop", "texto": "100% Virtual", "destacada": true }
  ],
  "unidades": 5,
  "horas_trabajo": 80,
  "profesor": {
    "nombre": "Kevin Santiago Garzón Fauna",
    "foto": "https://.../foto.jpg",
    "rol": "Ingeniero de Alimentos · Especialista en Control de Calidad",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-flask", "texto": "Control de calidad" }]
  },
  "video": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "video_titulo": "Conoce el laboratorio y la metodología del curso",
  "video_parrafos": ["párrafo 1", "párrafo 2"],
  "bienvenida": {
    "titulo": "¡Bienvenidos al curso!",
    "parrafos": ["párrafo 1", "párrafo 2", "párrafo 3"],
    "frase_destacada": "Una cita o lema del curso."
  },
  "aprenderas": [
    { "icono": "fa-microscope", "titulo": "Microbiología de alimentos", "detalle": "..." }
  ],
  "tutorias": [
    {
      "titulo": "Encuentro 1: instalación del curso",
      "fecha_label": "12 de agosto · 6:00 pm – 8:00 pm",
      "inicio": "2026-08-12T18:00:00",
      "fin": "2026-08-12T20:00:00",
      "url_grabacion": "https://..."
    }
  ],
  "actividades": [
    { "nombre": "Foro: preséntate al curso", "url": "https://..." }
  ]
}
```

### Tabla de campos

| Campo | Tipo | Dónde se ve | Obligatorio |
|---|---|---|---|
| `curso` | texto | Título grande del hero (diapositiva 1) y `<title>` de la pestaña | **Sí** (si falta, todo lo demás también se trata como "no llegó nada") |
| `resumen` | texto | Párrafo debajo del título, en el hero | No |
| `insignias` | arreglo de `{icono, texto, destacada}` | Las píldoras del hero (créditos, modalidad, etc.) — `icono` es una clase de Font Awesome (ej. `fa-brain`), `destacada:true` la pinta en dorado sólido | No |
| `unidades` | número | Contador "Unidades" en el hero | No (queda en 0) |
| `horas_trabajo` | número | Contador "Trabajo directo" en el hero (se muestra con sufijo "h") | No (queda en 0h) |
| `profesor.nombre` | texto | Nombre en la diapositiva "Docente" | No |
| `profesor.foto` | URL de imagen | Avatar del docente. Si falta o la imagen no carga, se genera automáticamente un avatar con las iniciales (servicio [ui-avatars.com](https://ui-avatars.com)) | No |
| `profesor.rol` | texto | Línea debajo del nombre (ej. "Ingeniero de Alimentos · Especialista en...") | No |
| `profesor.bio` | arreglo de párrafos (texto) | Biografía del docente, uno o más `<p>` | No |
| `profesor.etiquetas` | arreglo de `{icono, texto}` | Chips debajo de la biografía (ej. "Control de calidad") | No |
| `video` | URL | Video embebido en la diapositiva de video. Acepta enlaces normales de **YouTube**, **Vimeo** o **Google Drive** — se convierten automáticamente a su versión embebible | No (si falta, se oculta solo el reproductor; el título y los párrafos siguen visibles) |
| `video_titulo` | texto | Título junto al video | No |
| `video_parrafos` | arreglo de párrafos | Texto descriptivo junto al video | No |
| `bienvenida.titulo` | texto | Título de la diapositiva "Bienvenida" | No |
| `bienvenida.parrafos` | arreglo de párrafos | Texto principal de esa diapositiva | No |
| `bienvenida.frase_destacada` | texto | Cita destacada en la tarjeta oscura junto al texto. Si falta, esa tarjeta se oculta entera | No |
| `aprenderas` | arreglo de `{icono, titulo, detalle}` | Las tarjetas de "¿Qué aprenderás?" (se puede mandar cualquier cantidad; se abren al tocarlas) | No |
| `tutorias` | arreglo de `{titulo, fecha_label, inicio, fin, url_grabacion}` | Acordeón de "Tutorías". `inicio`/`fin` deben ser fechas ISO (`YYYY-MM-DDTHH:mm:ss`) — se usan para calcular el ícono de estado ("Es hoy", "En N días", "Realizada") y para generar el archivo `.ics` de "Agregar al calendario" | No |
| `actividades` | arreglo de `{nombre, url}` | Tarjetas numeradas de la diapositiva "Actividades" (sin límite práctico de cantidad — probado con 9, funciona igual con 50) | No |

**Nada de contenido va hardcodeado.** Lo único fijo en el HTML son
etiquetas de interfaz que nunca cambian sin importar el curso: textos de
botones ("Ir a las actividades", "Agregar al calendario"), nombres de
sección ("Docente", "Tutorías") y el membrete "Universidad INCCA de
Colombia" del encabezado.

---

## Qué pasa si un campo no llega

`main.js` resuelve **cada campo por separado**. Si mandas un JSON con solo
`curso` y `profesor.nombre`, esos dos se muestran reales y todo lo demás
muestra un **placeholder obviamente genérico**:

- `curso` faltante → "Nombre del curso"
- `resumen` faltante → "Aquí aparecerá el resumen del curso."
- `profesor.nombre` faltante → "Nombre del docente"
- `unidades` / `horas_trabajo` faltantes → `0` / `0h`
- `insignias`, `aprenderas`, `tutorias`, `actividades` faltantes → esas
  secciones aparecen vacías con un mensaje ("Este recurso todavía no
  tiene actividades", etc.)
- `video` faltante → la diapositiva de video oculta el reproductor

Esto es intencional: así, al probar, nunca hay duda de si un dato
"real" que ves es realmente el que mandaste o es un resto de una prueba
anterior — si ves "Nombre del curso" literal, sabes que ese campo no llegó.

Estos placeholders viven en el objeto `SIN_DATOS` al inicio de
`assets/js/main.js`.

---

## Las 7 diapositivas

El deck es un mazo de **7 diapositivas de pantalla completa** (no es una
página con scroll) — se navega con las flechas de los costados, los puntos
de abajo, las flechas del teclado, swipe (táctil) o el botón "Mapa del
curso" (arriba a la derecha, abre un panel con las 7 de un vistazo).

| # | Diapositiva | Contenido |
|---|---|---|
| 1 | **Inicio** | Insignias, título (`curso`), resumen, botón "Ir a las actividades", contadores animados (unidades, horas, tutorías, actividades) |
| 2 | **Bienvenida** | Texto de bienvenida + cita destacada en tarjeta oscura |
| 3 | **Aprenderás** | Tarjetas expandibles con la ruta de aprendizaje |
| 4 | **Docente** | Foto/avatar, nombre, rol, biografía, etiquetas |
| 5 | **Tutorías** | Acordeón de encuentros sincrónicos con fecha, estado y botones "Ver grabación" / "Agregar al calendario" |
| 6 | **DEA / Video** | Video embebido + texto descriptivo |
| 7 | **Actividades** | Grilla de tarjetas numeradas (nombre + botón "Abrir actividad") |

---

## Cómo embeberlo en Moodle

**Forma recomendada** — HTML estático generado por PHP, sin JavaScript en
la página que embebe:

```php
<iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
  style="width:100%; height:900px; border:0;"
  src="https://ingsantiago123.github.io/recurso_incca_prueba_piloto/"
  name='<?php echo htmlspecialchars(json_encode($datosDelRecurso), ENT_QUOTES); ?>'>
</iframe>
```

- El `id` del iframe (`incca-hero-section` en este ejemplo) es libre — el
  visor no lo lee para nada, es solo para que el CSS del lado de Moodle lo
  pueda referenciar si hace falta.
- `htmlspecialchars(..., ENT_QUOTES)` es importante en producción: si algún
  texto del curso trae comillas simples o dobles, sin esto rompería el
  atributo HTML.
- El atributo `name` **tiene que estar en el mismo tag** que `src` desde
  el principio (HTML estático) — así el navegador crea el iframe con ese
  nombre desde el arranque, antes de empezar a cargar la página.

**Alternativa** — si en vez de imprimir HTML estático el sistema arma el
iframe con JavaScript en el navegador:

```html
<iframe id="incca-hero-section" title="Visor de recurso U.INCCA" style="width:100%; height:900px; border:0;"></iframe>
<script>
  const iframe = document.getElementById("incca-hero-section");
  // OJO: es contentWindow.name (el window.name real de adentro del iframe),
  // NO iframe.name (que solo es el atributo HTML del elemento) — y hay que
  // fijarlo ANTES de asignar el src.
  iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
  iframe.src = "https://ingsantiago123.github.io/recurso_incca_prueba_piloto/";
</script>
```

Ambas formas funcionan igual — probadas las dos. La primera es más simple
si el JSON ya lo arma un script en PHP (no necesita JS extra); la segunda
sirve si quien arma los datos es JavaScript del lado del navegador.

---

## Cómo probarlo

**`test-iframe.html`** (en la raíz del repo) es un ejemplo funcional real,
con un curso completo de principio a fin ("Ingeniería de Alimentos", con
las 13 secciones del JSON llenas: docente, video, bienvenida, 4 tarjetas
de aprendizaje, 3 tutorías y 9 actividades). Ábrelo directo:

**https://ingsantiago123.github.io/recurso_incca_prueba_piloto/test-iframe.html**

Para probar con tus propios datos, copia ese archivo y reemplaza el JSON
del atributo `name` por el que quieras — o abre `index.html` directo sin
ningún iframe (sin `window.name`) para ver el modo "sin datos" (todo en
placeholders), útil para revisar que el diseño se vea bien incluso vacío.

---

## Actividades gamificadas (`/actividades/`)

Esto es un subsistema **aparte**, no forma parte del JSON del visor
principal. Son 5 páginas de prueba piloto (`actividad-1.html` a
`actividad-5.html`) pensadas para mostrar un formato de actividad mucho
más interactivo que un simple link: cada una tiene "estaciones" (video,
lectura, recurso, galería de videos) más un quiz final que se **desbloquea**
al completar las anteriores, con puntos, barra de progreso guardada en
`localStorage` del navegador, y confeti + celebración al llegar al 100%.

- Motor genérico: `assets/js/actividad.js` (función `renderActividad(config)`).
- Estilos: `assets/css/actividad.css` (reutiliza la paleta de `styles.css`).
- Cada `actividad-N.html` trae sus propios datos hardcodeados dentro de un
  `<script>` al final del archivo (a diferencia del visor principal, este
  contenido **si está fijo en el HTML** — es contenido de la prueba piloto,
  no viene de Moodle).
- El contenido actual (temas de "sociedad de la información" e inglés) es
  **contenido de relleno**, tomado de los archivos que se pasaron para
  poblar la prueba — no corresponde al curso real. Para ponerlo al día,
  edita el objeto `config` al final de cada `actividad-N.html`.

Estas páginas NO están enlazadas desde el visor principal (ya que las
actividades ahora vienen 100% del JSON) — quedan como recurso independiente
para embeber directamente si se quiere, en `.../actividades/actividad-1.html`.

---

## Publicar / actualizar en GitHub Pages

El repo ya está publicado. Para futuros cambios:

```bash
git add .
git commit -m "mensaje del cambio"
git push
```

GitHub Pages reconstruye solo en cada push a `main` (tarda ~1-2 minutos en
verse reflejado; los archivos quedan cacheados 10 minutos en el navegador,
así que si no ves el cambio, recarga forzado con `Ctrl+Shift+R`).

Si necesitas publicar esto en un repositorio nuevo desde cero:

1. Crea un repositorio en GitHub.
2. Desde esta carpeta: `git init && git add . && git commit -m "..." && git branch -M main && git remote add origin <url> && git push -u origin main`.
3. En GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
4. El sitio queda en `https://<usuario>.github.io/<repo>/`.

---

## Paleta y tipografía

Variables CSS definidas al inicio de `assets/css/styles.css` — cambiar
cualquier color institucional es editar un solo valor ahí, se propaga a
todo el sitio:

| Variable | Color | Uso |
|---|---|---|
| `--oxford-blue` | `#040C38` | Fondos oscuros, títulos |
| `--dodger-blue` | `#2B8BFA` | Gradiente institucional |
| `--royal-blue` | `#0B349D` | Iconos, acentos |
| `--light-cyan` | `#65CBE3` | Hover, estados activos |
| `--old-gold` | `#CBB54E` | Destacados, botón primario dorado |
| `--bronze` | `#A58540` | Degradado dorado (con `--old-gold`) |
| `--platinum` | `#E2E6E9` | Fondos neutros |

Tipografía: `'Futura Book', Roboto, 'Fira Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`.
Futura Book es una fuente con licencia — si tienes el archivo, agrégalo con
`@font-face` al inicio de `styles.css`; mientras tanto se usa Roboto (vía
Google Fonts) como respaldo. Iconografía: únicamente Font Awesome (vía CDN).

---

## Funciones interactivas

- Navegación por diapositivas con transición direccional (flechas, puntos,
  teclado ← →, swipe táctil, panel "Mapa del curso").
- Contadores animados en el hero (cuentan desde 0 hasta el valor real).
- Tarjetas de "¿Qué aprenderás?" expandibles al tocarlas.
- Acordeón de tutorías con estado dinámico ("Es hoy" / "En N días" /
  "Realizada", calculado contra la fecha real) y botón **"Agregar al
  calendario"** que genera un archivo `.ics` real (descarga local, sin
  backend).
- Fallback de avatar automático (iniciales) si la foto del docente no
  carga.
- Conversión automática de enlaces de YouTube/Vimeo/Drive a su versión
  embebible.
- Animaciones de entrada en cascada por diapositiva y micro-interacciones
  (`hover`, foco visible, `prefers-reduced-motion` respetado).

---

## Archivos que NO están en el repo

Estos archivos existen en la carpeta de trabajo local pero están excluidos
vía `.gitignore` — nunca se publicaron ni se publicarán en GitHub Pages:

- `Incca Maestria Hero.dc.html` y `support.js` — prototipo generado por una
  herramienta de diseño interna; depende de un runtime propietario
  (React/ReactDOM inyectado) y no funciona fuera de esa herramienta.
- `recursos x/` — archivos HTML de Moodle usados solo para poblar de
  contenido de prueba las páginas de `/actividades/`.
- `.thumbnail` — miniatura interna de la herramienta de diseño.
- `prueba.html` — tu archivo de pruebas local (apunta a `127.0.0.1:5500`,
  un servidor local tipo Live Server), no tiene sentido publicarlo.

---

## Notas técnicas y límites conocidos

- **Sin backend.** El visor no hace ningún `fetch()` ni llamada de red
  propia — todo el contenido llega ya armado en `window.name`. Si en el
  futuro se agrega un backend PHP real, este es un cambio aislado a la
  función `leerDatosDesdeWindowName()` en `main.js`.
- **`window.name` no es privado.** Cualquier script que corra dentro del
  mismo iframe podría leerlo. No pongas ahí información sensible (notas de
  estudiante, calificaciones, datos personales más allá de nombre/foto
  pública del docente).
- **Tamaño práctico:** `window.name` soporta varios megabytes en los
  navegadores modernos — de sobra para decenas de actividades. Si algún
  día un curso tuviera cientos de actividades con textos muy largos, ahí
  sí valdría la pena migrar a un `fetch()` real contra un backend.
- **`curso` es un campo más, no un interruptor.** El reemplazo por
  placeholder es 100% independiente por campo — si mandas un JSON con
  solo `profesor.nombre` (sin `curso`), el nombre del docente se muestra
  real y el título del curso simplemente muestra su propio placeholder
  ("Nombre del curso"). Lo único "todo o nada" es cuando `window.name`
  viene vacío o no es JSON válido: ahí sí se cae al modo "sin datos"
  completo, porque no hay ni un solo campo real que leer.
