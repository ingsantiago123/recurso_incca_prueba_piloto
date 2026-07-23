# Conflicto Social y Político en Colombia — U.INCCA

Mazo de diapositivas interactivo (HTML/CSS/JS puro, sin frameworks) para la
Maestría en Transformación de Conflictos y Construcción de Paz de la
Universidad INCCA de Colombia. Diseñado para:

1. Publicarse como sitio estático en **GitHub Pages**.
2. Incrustarse dentro de un curso de **Moodle** mediante `<iframe>`.

No es una página con scroll: es un mazo de diapositivas de pantalla completa
que se navega con flechas, puntos, teclado (← →), swipe (móvil) o el "Mapa
del curso".

## Estructura

```
index.html               ← único punto de entrada
assets/css/styles.css    ← paleta, tipografía y componentes institucionales
assets/js/main.js        ← datos del curso + lógica del deck (edítalo para cambiar contenido)
assets/img/favicon.svg   ← marca "I" institucional
```

Dependencias externas (únicas, vía CDN): **Font Awesome** (iconografía) y
**Google Fonts Roboto** (tipografía de respaldo, ya que Futura Book es una
fuente con licencia — si tienes el archivo, agrégalo con `@font-face` al
inicio de `styles.css` y el `font-family` ya apunta a `'Futura Book'` primero).

## Editar el contenido

Todo el contenido (unidades de aprendizaje, tutorías con fechas, actividades,
enlaces al curso) vive en **`assets/js/main.js`**, en la sección
"Datos del curso". Cambia ahí los textos, fechas (`start`/`end` en formato
ISO, usados también para generar el evento `.ics` de "Agregar al calendario")
y la constante `BASE_URL` con la URL real del curso en Moodle.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (puede ser público o privado con GitHub Pro/Team).
2. Desde esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Publica micrositio interactivo de la maestría"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
4. Tu sitio quedará en `https://<tu-usuario>.github.io/<tu-repo>/`.

## Incrustar en Moodle

Una vez publicado, en el curso de Moodle agrega un recurso **"Etiqueta"** o
**"Página"**, entra al editor HTML (`<>`) y pega:

```html
<iframe
  src="https://<tu-usuario>.github.io/<tu-repo>/"
  title="Conflicto Social y Político en Colombia"
  style="width:100%; height:640px; border:0; border-radius:12px; overflow:hidden;"
  loading="lazy">
</iframe>
```

Ajusta `height` según el espacio disponible en la sección del curso — el
deck se adapta a cualquier alto/ancho (usa `100dvh` internamente relativo al
iframe, no a la ventana completa del navegador).

## Funciones interactivas incluidas

- Navegación por diapositivas con transición direccional (flechas, puntos,
  teclado, swipe táctil, mapa del curso).
- Barra de progreso del recorrido (arriba) y contador "X / 7".
- Tarjetas de "¿Qué aprenderás?" expandibles.
- Acordeón de tutorías + botón **"Agregar al calendario"** que genera un
  archivo `.ics` real (descarga local, sin backend).
- Actividades filtrables por categoría, con buscador en vivo.
- Seguimiento de progreso de actividades (checkbox por tarjeta) persistido
  en `localStorage` del navegador, con barra de avance y reinicio manual.
- Contadores animados en el hero, animaciones de entrada en cascada por
  diapositiva y micro-interacciones (`hover`, foco visible, `prefers-reduced-motion`).

## Archivos anteriores

`Incca Maestria Hero.dc.html` y `support.js` eran un prototipo generado por
una herramienta de diseño interna (requiere un runtime propietario con
React/ReactDOM inyectado) y **no funcionan si se abren directamente en un
navegador ni si se suben a GitHub Pages**. Este `index.html` es el
reemplazo autónomo y desplegable. Puedes borrar esos dos archivos si ya no
los necesitas como referencia.
