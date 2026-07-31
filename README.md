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
  "modulos": [{ "nombre": "...", "url": "...", "ilustracion": "url (opcional)" }]
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

La lista de diapositivas **no es fija**: normalmente son 7, pero
"Docente tutor" solo aparece si el JSON trae la clave `profesor_tutor` —
si no llega, esa diapositiva ni se cuenta ni aparece en los puntos de
abajo. Se recalcula una vez, al cargar, en `construirSlides()` (`main.js`).

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
    { "nombre": "CONECTA", "url": "https://moodle.../section.php?id=50" },
    { "nombre": "INCCA APOYO", "url": "https://moodle.../section.php?id=51" },
    { "nombre": "Semana 1", "url": "https://moodle.../section.php?id=52", "ilustracion": "https://.../semana1.png" },
    { "nombre": "Semana 2", "url": "https://moodle.../section.php?id=53" },
    { "nombre": "Semana 3", "url": "https://moodle.../section.php?id=54" },
    { "nombre": "Semana 4", "url": "https://moodle.../section.php?id=55" }
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
| `url` | texto | A dónde navega el botón **"INICIAR MÓDULO"** — es un enlace real (`<a target="_blank">`), no ejecuta nada dentro del visor, solo abre esa URL en pestaña nueva | `#` (no navega a ningún lado) |
| `ilustracion` | url de imagen (opcional) | Imagen mostrada en el panel expandido | No se muestra ninguna ilustración (el panel se ve bien igual, solo sin imagen) |

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
  degradé institucional (claro → oscuro) según su posición — el primer
  módulo sale más claro, el último más oscuro. Se recalcula solo según
  cuántos módulos lleguen (función `unitColorAt()`).

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
