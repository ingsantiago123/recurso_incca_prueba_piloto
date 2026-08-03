# Visor de recurso educativo — U.INCCA

Mazo de diapositivas interactivo (HTML/CSS/JS puro, sin frameworks) para
la Universidad INCCA de Colombia. Es una plantilla **genérica**: no tiene
ningún curso "quemado" en el código — todo el contenido (nombre del
curso, docentes, video, bienvenida, ruta de aprendizaje, tutorías y las
unidades/módulos del mosaico de Moodle) se lo pasa un sistema externo
(hoy, HTML estático de prueba; a futuro, un plugin de Moodle) como un
objeto **JSON**, y la página se pinta sola con esos datos.

Publicado en: **https://ingsantiago123.github.io/recurso_incca_prueba_piloto/**

## Qué es

Todo el contenido llega en un solo objeto JSON leído desde `window.name`
del iframe — **no desde la URL**, así no hay límite de longitud aunque el
curso tenga muchos módulos o actividades. Ver [Cómo embeberlo en
Moodle](#cómo-embeberlo-en-moodle) más abajo para el patrón exacto.

Solo `curso` es obligatorio. Todo lo demás es opcional y, si falta, se
completa **campo por campo** con un placeholder obviamente genérico
("Nombre del docente", "Título de esta sección"...) en vez de romper el
diseño o mostrar un curso de ejemplo que parezca información real — así,
al probar, siempre es obvio qué dato es real y cuál sigue pendiente.

## Archivos

```
index.html               ← único punto de entrada
assets/css/styles.css    ← paleta institucional + estilos del deck
assets/js/main.js        ← lee el JSON y pinta todo (comentario de esquema al inicio del archivo)
assets/img/               ← escudo + íconos de pestaña
```

## Cómo embeberlo en Moodle

```php
<iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
  style="width:100%; height:900px; border:0;"
  src="https://ingsantiago123.github.io/recurso_incca_prueba_piloto/"
  name='<?php echo htmlspecialchars(json_encode($datosDelRecurso), ENT_QUOTES); ?>'>
</iframe>
```

El atributo `name` debe estar en el **mismo tag** que `src` desde el
principio (HTML estático generado por PHP, sin JavaScript necesario) —
así el navegador crea el iframe con ese nombre desde el arranque, antes
de cargar la página. `htmlspecialchars(..., ENT_QUOTES)` es importante:
si algún texto trae comillas, sin esto rompería el atributo HTML.

Si en cambio el iframe se arma con JavaScript en la página que lo
embebe, hay que fijar `iframe.contentWindow.name` (**no** `iframe.name`,
que solo es el atributo HTML del tag) **antes** de fijar el `src`:

```js
const iframe = document.getElementById("incca-hero-section");
iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
iframe.src = "https://ingsantiago123.github.io/recurso_incca_prueba_piloto/";
```

### Cómo probarlo localmente

Este repo no trae un archivo de prueba (carpeta mínima, sin archivos de
test). Para probar cambios: crea un `.html` cualquiera fuera del repo con
un iframe apuntando a `index.html` (local, vía Live Server u otro
servidor) y el JSON de prueba en el atributo `name`, exactamente como en
el ejemplo de PHP de arriba pero con datos fijos en vez de
`<?php ... ?>`. Abrir `index.html` directo (sin iframe, sin
`window.name`) también sirve — muestra el modo "sin datos", todo en
placeholders, útil para revisar que el diseño no se rompa vacío.

## El JSON — resumen

Todos los campos son opcionales excepto `curso`:

```json
{
  "curso": "Nombre del curso",
  "resumen": "Párrafo corto debajo del título del hero",
  "insignias": [{ "icono": "fa-brain", "texto": "Teórico · Práctico", "destacada": false }],
  "unidades": 4,
  "horas_trabajo": 96,
  "profesor": {
    "nombre": "...", "foto": "url (opcional)", "rol": "... (opcional)",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }],
    "video": "url de YouTube/Vimeo/Drive (opcional)"
  },
  "profesor_tutor": "mismo formato que profesor (opcional) — ver sección Docente tutor",
  "video": "url de YouTube/Vimeo/Drive",
  "video_titulo": "Título junto al video",
  "video_parrafos": ["párrafo 1", "párrafo 2"],
  "video_descarga_url": "url opcional de descarga del material",
  "bienvenida": { "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..." },
  "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
  "tutorias": [{ "titulo": "...", "fecha_label": "...", "inicio": "ISO", "fin": "ISO", "url_grabacion": "..." }],
  "modulos": [{ "nombre": "...", "url": "...", "ilustracion": "url (opcional)", "sectionid": "número (opcional)" }],
  "secciones": "opcional — mostrar/ocultar/reordenar las 8 diapositivas fijas, ver más abajo",
  "diapositivas_extra": "opcional — agregar diapositivas nuevas (iframe o HTML), ver más abajo"
}
```

**Nada de contenido va hardcodeado.** Lo único fijo en el HTML son
etiquetas de interfaz que nunca cambian sin importar el curso: textos de
botones ("Ir a las unidades", "INICIAR MÓDULO") y nombres de sección
("Docente", "Tutorías").

## Las diapositivas — sección por sección

El deck es un mazo de diapositivas de pantalla completa (no es una
página con scroll, y no tiene topbar ni "mapa del curso" — solo el
contenido) — se navega con las flechas de los costados, los puntos de
abajo, las flechas del teclado o swipe (táctil).

La lista de diapositivas **no es fija**: por defecto son 7 u 8 (según si
llega `profesor_tutor`), pero el orden, la visibilidad de cada una y hasta
diapositivas nuevas por completo se pueden controlar desde el JSON — ver
["Personalizar el mazo"](#personalizar-el-mazo-mostrarocultar-reordenar-y-diapositivas-custom)
más abajo. Esta tabla es el estado **por defecto**, sin ningún override:

| # | id interno | Diapositiva | ¿Siempre existe? |
|---|---|---|---|
| 1 | `hero` | Inicio | Sí |
| 2 | `bienvenida` | Bienvenida | Sí |
| 3 | `aprenderas` | Aprenderás | Sí |
| 4 | `docente` | Docente creador | Sí |
| 4b | `docente_tutor` | Docente tutor | Solo si llega `profesor_tutor` |
| 5 | `tutorias` | Tutorías | Sí |
| 6 | `dea` | DEA / Video | Sí |
| 7 | `unidades` | Unidades | Sí |

---

### 1. Inicio (`hero`)

Portada del recurso: título, resumen, insignias y contadores animados.

```json
{
  "curso": "Ingeniería de Alimentos",
  "resumen": "Fundamentos de ciencia y tecnología de alimentos...",
  "insignias": [
    { "icono": "fa-brain", "texto": "Teórico · Práctico" },
    { "icono": "fa-laptop", "texto": "100% Virtual", "destacada": true }
  ],
  "unidades": 5,
  "horas_trabajo": 80
}
```

| Campo | Tipo | Dónde se ve | Si falta |
|---|---|---|---|
| `curso` | texto | Título grande del hero y `<title>` de la pestaña | Se trata como si **todo** el JSON no hubiera llegado — es el único campo verdaderamente obligatorio |
| `resumen` | texto | Párrafo debajo del título | Texto genérico ("Aquí aparecerá el resumen del curso.") |
| `insignias` | `[{icono, texto, destacada}]` | Píldoras junto al título. `icono` es una clase de Font Awesome solid (ej. `fa-brain`); `destacada:true` la pinta en dorado sólido en vez de translúcida | No se muestra ninguna |
| `unidades` | número | Contador **"Unidades"** del hero — es un número informativo, **independiente** de cuántos objetos traiga `modulos` (ver más abajo) | Queda en `0` |
| `horas_trabajo` | número | Contador **"Trabajo directo"** (se muestra con sufijo "h") | Queda en `0h` |

Los otros dos contadores del hero ("Tutorías en vivo" y "Módulos") se
calculan solos, contando `tutorias.length` y `modulos.length` — no son
campos aparte.

---

### 2. Bienvenida (`bienvenida`)

```json
{
  "bienvenida": {
    "titulo": "¡Bienvenidos al curso!",
    "parrafos": ["párrafo 1", "párrafo 2", "párrafo 3"],
    "frase_destacada": "Una cita o lema del curso."
  }
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `bienvenida.titulo` | Título de la diapositiva | "¡Bienvenidos al curso!" |
| `bienvenida.parrafos` | Texto principal (uno o más `<p>`) | Queda vacío |
| `bienvenida.frase_destacada` | Cita en la tarjeta oscura junto al texto | Si falta, **esa tarjeta entera se oculta** (no queda un espacio vacío) |

---

### 3. Aprenderás (`aprenderas`)

```json
{
  "aprenderas": [
    { "icono": "fa-microscope", "titulo": "Microbiología de alimentos", "detalle": "Texto que se ve al tocar la tarjeta." }
  ]
}
```

Arreglo de tarjetas expandibles, cualquier cantidad. `icono` es una clase
de Font Awesome solid. Si el arreglo llega vacío o no llega, se muestra
un mensaje ("Este recurso todavía no tiene ruta de aprendizaje.") en vez
de una grilla vacía.

---

### 4. Docente creador (`docente`)

El video, si llega, es el elemento protagonista (16:9, columna
izquierda) y el avatar se reduce a una chapa circular superpuesta en su
esquina; sin video, el avatar se muestra solo, centrado y grande.

```json
{
  "profesor": {
    "nombre": "Kevin Santiago Garzón Fauna",
    "foto": "https://.../foto.jpg",
    "rol": "Ingeniero de Sistemas · Especialista en Desarrollo de Software",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-flask", "texto": "Control de calidad" }],
    "video": "https://drive.google.com/file/d/XXXXXXXX/preview"
  }
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `profesor.nombre` | Nombre en la tarjeta | "Nombre del docente" |
| `profesor.foto` | Avatar circular/redondeado | Se genera un avatar automático con las iniciales del nombre ([ui-avatars.com](https://ui-avatars.com)); si la URL dada no carga, cae al mismo avatar automático |
| `profesor.rol` | Línea debajo del nombre | Se oculta la línea entera |
| `profesor.bio` | Biografía (uno o más `<p>`) | Queda vacía |
| `profesor.etiquetas` | Chips debajo de la biografía | No se muestra ninguno |
| `profesor.video` | Video 16:9 protagonista de la tarjeta (YouTube/Vimeo/Drive, se convierte solo a su versión embebible) | No se muestra el bloque de video; el avatar vuelve a su tamaño completo |

---

### 4b. Docente tutor (`docente_tutor`) — opcional

**Mismo componente exacto que "Docente creador"**, mismo formato de
datos, bajo la clave `profesor_tutor`. La diferencia real es que **esta
diapositiva no siempre existe**: si el curso no tiene un docente tutor
asignado todavía, simplemente no se manda la clave `profesor_tutor` y la
diapositiva desaparece de la navegación entera (puntos, contador, mapa)
— no queda una diapositiva de placeholders genéricos por rellenar.

```json
{
  "profesor_tutor": {
    "nombre": "Jaime Andrés Arredondo",
    "foto": "https://.../foto.jpg",
    "rol": "Docente tutor · Abogado, Esp. en Derecho Procesal",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-gavel", "texto": "Derecho procesal" }]
  }
}
```

Si se manda `profesor_tutor` aunque sea con un solo campo (p. ej. solo
`nombre`), la diapositiva **sí aparece**, y el resto de sus campos se
completa con los mismos placeholders que "Docente creador".

---

### 5. Tutorías (`tutorias`)

```json
{
  "tutorias": [
    {
      "titulo": "Encuentro 1: instalación del curso",
      "fecha_label": "12 de agosto · 6:00 pm – 8:00 pm",
      "inicio": "2026-08-12T18:00:00",
      "fin": "2026-08-12T20:00:00",
      "url_grabacion": "https://..."
    }
  ]
}
```

Acordeón de encuentros sincrónicos. `inicio`/`fin` deben ser fechas ISO
(`YYYY-MM-DDTHH:mm:ss`) — se usan para calcular el ícono de estado ("Es
hoy" / "En N días" / "Realizada") y para generar el archivo `.ics` real
que descarga el botón "Agregar al calendario" (sin backend). Si el
arreglo llega vacío, se muestra un mensaje en vez de un acordeón vacío.

---

### 6. DEA / Video (`dea`)

Video de presentación del curso + texto (útil también para el contenido
del DEA — Diseño de Experiencia para el Aprendizaje) + botón opcional de
descarga de material.

```json
{
  "video": "https://drive.google.com/file/d/XXXXXXXX/preview",
  "video_titulo": "DEA · Diseño de Experiencia para el Aprendizaje",
  "video_parrafos": ["párrafo 1", "párrafo 2"],
  "video_descarga_url": "https://drive.google.com/file/d/YYYYYYYY/view"
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `video` | Reproductor embebido. Acepta enlaces normales de **YouTube**, **Vimeo** o **Google Drive** — se convierten solos a su versión embebible | Se oculta solo el reproductor; título y párrafos siguen visibles |
| `video_titulo` | Título junto al video | Queda vacío |
| `video_parrafos` | Texto descriptivo junto al video | Queda vacío |
| `video_descarga_url` | Botón "Descargar material" junto a "Ir a las unidades" | Botón oculto |

---

### 7. Unidades (`unidades`) — el mosaico real de Moodle

La diapositiva más distinta de todas: ocupa la pantalla completa (de
punta a punta del deck, sin el margen/padding de las demás) con un
acordeón horizontal de paneles — uno por cada módulo del curso.

```json
{
  "modulos": [
    { "nombre": "CONECTA", "url": "https://moodle.../section.php?id=50", "sectionid": 50 },
    { "nombre": "INCCA APOYO", "url": "https://moodle.../section.php?id=51", "sectionid": 51 },
    { "nombre": "Semana 1", "url": "https://moodle.../section.php?id=52", "sectionid": 52, "ilustracion": "https://.../semana1.png" },
    { "nombre": "Semana 2", "url": "https://moodle.../section.php?id=53", "sectionid": 53 },
    { "nombre": "Semana 3", "url": "https://moodle.../section.php?id=54", "sectionid": 54 },
    { "nombre": "Semana 4", "url": "https://moodle.../section.php?id=55", "sectionid": 55 }
  ]
}
```

`modulos` es un arreglo **ya ordenado tal como debe verse** (CONECTA,
INCCA APOYO, Semana 1, Semana 2...) y de **cantidad dinámica** — no hay
un número fijo de semanas, el acordeón se adapta solo a cuantos módulos
lleguen.

| Campo | Tipo | Qué hace | Si falta |
|---|---|---|---|
| `nombre` | texto | Nombre del módulo — se muestra en la chapa (colapsado) y como título (expandido). También se usa para **inferir** el ícono/número del panel, ver abajo | "Nombre del módulo" |
| `url` | texto | A dónde navega el botón **"INICIAR MÓDULO"** cuando no hay puente con Moodle (ver abajo) — enlace real (`<a target="_blank">`), no ejecuta nada dentro del visor | `#` (no navega a ningún lado) |
| `ilustracion` | url de imagen (opcional) | Imagen mostrada en el panel expandido | No se muestra ninguna ilustración (el panel se ve bien igual, solo sin imagen) |
| `sectionid` | número (opcional) | Id real de la sección en Moodle — habilita el puente con la página padre (ver abajo) | Sin este campo, "INICIAR MÓDULO" siempre navega a `url` en pestaña nueva |

**El ícono/color de cada panel NO son campos del JSON** — son diseño
fijo, calculado automáticamente:

- **Ícono**: se infiere del propio `nombre` (función `unitVisualMeta()`
  en `main.js`). Si el nombre contiene "conecta" → ícono de foro; si
  contiene "apoyo" → ícono de ayuda; si contiene "semana" seguido de un
  número → se muestra ese número en grande en vez de un ícono; cualquier
  otro nombre cae en un ícono genérico. Esto es intencional: para el
  diseño, todos los módulos son indistinguibles entre sí salvo por su
  nombre — no hay un campo `"tipo"` aparte que decir "esto es un foro".
- **Color**: cada panel recibe un color sólido tomado de un punto del
  degradé institucional (oscuro → claro) según su posición — el primer
  módulo sale más oscuro, el último más claro. Se recalcula solo según
  cuántos módulos lleguen (función `unitColorAt()`).

### Puente con Moodle (opcional, vía `sectionid`)

Pensado para cuando el visor está embebido dentro de la **misma página
de curso** que contiene esos módulos (formato de curso "Mosaicos" /
`format_tiles`, con el plugin `local_visorincca`). En vez de abrir `url`
en pestaña nueva, el botón "INICIAR MÓDULO":

1. Le avisa a la ventana padre por `postMessage`:
   ```js
   { source: "visorincca", type: "abrir-modulo", sectionid: <number> }
   ```
2. Espera hasta 500 ms una confirmación del padre:
   ```js
   { source: "visorincca", type: "modulo-abierto", sectionid: <number> }
   ```
3. Si llega la confirmación a tiempo, no navega a ningún lado — el padre
   ya abrió el mosaico nativo ahí mismo. Si no llega (el visor no está
   embebido, el padre no tiene el plugin, o cualquier otro caso), cae de
   vuelta a `window.open(url, "_blank", "noopener")` — el comportamiento
   de siempre. Un click **nunca** se queda sin efecto.

Sin `sectionid` este puente ni se intenta — el link se comporta como uno
normal. Ver `initUnitCta()` en `assets/js/main.js` para la implementación
completa.

---

## Personalizar el mazo: mostrar/ocultar, reordenar y diapositivas custom

Todo esto es opcional y se administra 100% desde el JSON — no hace falta
tocar código para ocultar una diapositiva, cambiar su posición o agregar
una nueva.

### Mostrar, ocultar y reordenar las 8 diapositivas fijas — `secciones`

Por defecto existen las 8 diapositivas de siempre, en este orden: `hero`,
`bienvenida`, `aprenderas`, `docente`, `docente_tutor`, `tutorias`,
`dea`, `unidades` (`docente_tutor` además solo aparece si llegó
`profesor_tutor`, como se explicó arriba). El campo `secciones` deja
controlar cada una sin tocar nada más:

```json
{
  "secciones": {
    "aprenderas": { "visible": false },
    "unidades":   { "orden": 0 },
    "hero":       { "orden": 1 }
  }
}
```

Cada clave es el id de una diapositiva fija. Ambos campos son opcionales:

| Campo | Tipo | Default si falta |
|---|---|---|
| `visible` | booleano | `true` para todas, excepto `docente_tutor` (que sigue dependiendo de si llegó `profesor_tutor`, salvo que acá se fuerce explícitamente) |
| `orden` | número | Su posición en la lista de arriba (0 a 7) |

El ejemplo de arriba deja "Unidades" como primera diapositiva, "Inicio"
como segunda, y saca "Aprenderás" del mazo por completo (no cuenta en
los puntos de abajo ni en ningún lado).

### Agregar diapositivas nuevas — `diapositivas_extra`

Inserta contenido nuevo sin tocar el HTML/JS del visor — un iframe o
HTML/CSS directo (de confianza, se inyecta tal cual — mismo criterio que
los cuadros de "insertar HTML" del propio Moodle):

```json
{
  "diapositivas_extra": [
    {
      "id": "webinar-cierre",
      "tipo": "media",
      "orden": 8,
      "titulo": "Webinar de cierre",
      "descripcion": "Grabación del encuentro de cierre del módulo.",
      "iframe": "https://www.youtube.com/embed/XXXXXXXXXXX"
    },
    {
      "id": "encuesta-satisfaccion",
      "tipo": "pagina",
      "orden": 9,
      "iframe": "https://forms.gle/XXXXXXXXXXX"
    }
  ]
}
```

| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | Sí | Identificador único de la diapositiva (no puede repetirse ni coincidir con las fijas) |
| `tipo` | No (default `"media"`) | `"media"` o `"pagina"` — ver abajo |
| `orden` | No | Comparte la misma numeración que `secciones` — así se puede intercalar una diapositiva custom entre dos fijas. Sin este campo, se agrega al final |
| `visible` | No (default `true`) | Igual que en `secciones` |
| `titulo` / `descripcion` | No | Solo se usan/muestran en tipo `"media"` |
| `iframe` | No* | URL a embeber. Si llegan `iframe` y `html`, gana `iframe` |
| `html` | No* | HTML/CSS a inyectar directo. *Si no llega ninguno de los dos, se muestra un mensaje de "sin contenido" en vez de una diapositiva rota |

**Los dos tipos:**

- **`"media"`** — diapositiva normal, con márgenes, igual que "Docente" o
  "Tutorías": título + descripción arriba, y el iframe/html en un marco
  contenido con un botón para abrirlo en un **modal de pantalla
  completa** (más grande, con el mismo título/descripción).
- **`"pagina"`** — a pantalla completa, igual que "Unidades": el iframe/
  html ocupa toda la diapositiva de punta a punta, sin título ni
  descripción. Solo quedan las flechas prev/next (y los puntos de abajo)
  para salir de ahí — pensado para contenido que necesita todo el
  espacio (un formulario largo, un recurso interactivo completo, etc.).

Implementación completa en `construirSlides()`, `renderCustomSlides()` y
`crearSlideCustom()` (`assets/js/main.js`).

---

## Publicar / actualizar en GitHub Pages

El repo ya está publicado. Para futuros cambios:

```bash
git add .
git commit -m "mensaje del cambio"
git push
```

GitHub Pages reconstruye solo en cada push a `main` (tarda uno o dos
minutos en verse reflejado; si no ves el cambio, recarga forzado con
`Ctrl+Shift+R`).

Si hace falta publicar esto en un repositorio nuevo desde cero:

1. Crea un repositorio en GitHub.
2. Desde esta carpeta: `git init && git add . && git commit -m "..." && git branch -M main && git remote add origin <url> && git push -u origin main`.
3. En GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
4. El sitio queda en `https://<usuario>.github.io/<repo>/`.

## Paleta y tipografía

Variables CSS definidas al inicio de `assets/css/styles.css` — cambiar
cualquier color institucional es editar un solo valor ahí, se propaga a
todo el sitio (incluida la paleta calculada del acordeón de Unidades):

| Variable | Color | Uso |
|---|---|---|
| `--oxford-blue` | `#040C38` | Fondos oscuros, títulos |
| `--dodger-blue` | `#2B8BFA` | Degradé institucional (portada, DEA) |
| `--royal-blue` | `#0B349D` | Iconos, acentos |
| `--light-cyan` | `#65CBE3` | Hover, estados activos, punta clara del degradé de Unidades |
| `--old-gold` | `#CBB54E` | Destacados, botón primario dorado, costura de Unidades |
| `--bronze` | `#A58540` | Degradado dorado (con `--old-gold`) |
| `--platinum` | `#E2E6E9` | Fondos neutros |

Tipografía: `'Futura Book', Roboto, 'Fira Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`.
Futura Book es una fuente con licencia — si tienes el archivo, agrégalo
con `@font-face` al inicio de `styles.css`; mientras tanto se usa Roboto
(vía Google Fonts) como respaldo. Iconografía: únicamente Font Awesome
solid (vía CDN) — cualquier campo `"icono"` del JSON espera una clase
tipo `fa-xxx` de ese set.
