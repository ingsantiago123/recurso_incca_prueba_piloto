# Visor de recurso educativo — U.INCCA

Carpeta mínima: solo lo indispensable para que el visor funcione. Sin
actividades de prueba, sin archivos de test — únicamente `index.html` +
`assets/`.

Publicado en: **https://ingsantiago123.github.io/recurso_incca_prueba_piloto/**

## Qué es

Mazo de diapositivas interactivo (HTML/CSS/JS puro, sin frameworks) y
**genérico**: no tiene ningún curso escrito en el código. Todo el
contenido (curso, docente, video, bienvenida, ruta de aprendizaje,
tutorías, actividades) se lo pasa Moodle como un objeto **JSON**, leído
desde `window.name` del iframe (no desde la URL — así no hay límite de
longitud aunque el curso tenga muchas actividades).

## Archivos

```
index.html               ← único punto de entrada
assets/css/styles.css    ← paleta institucional + estilos del deck
assets/js/main.js        ← lee el JSON y pinta todo (documentado al inicio del archivo)
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

El atributo `name` debe estar en el mismo tag que `src` desde el
principio (HTML estático generado por PHP, sin JavaScript necesario).

## El JSON esperado

Todos los campos son opcionales excepto `curso`; lo que falte se muestra
como un placeholder genérico ("Nombre del curso", "Nombre del docente",
etc.) en vez de romper el diseño:

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
    "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }]
  },
  "video": "url de YouTube/Vimeo/Drive",
  "video_titulo": "Título junto al video",
  "video_parrafos": ["párrafo 1", "párrafo 2"],
  "bienvenida": { "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..." },
  "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
  "tutorias": [{ "titulo": "...", "fecha_label": "...", "inicio": "ISO", "fin": "ISO", "url_grabacion": "..." }],
  "actividades": [{ "nombre": "...", "url": "..." }]
}
```

El detalle completo de cada campo (dónde se ve, qué pasa si falta) está
documentado en el comentario al inicio de `assets/js/main.js`.

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Publica el visor"
git branch -M main
git remote add origin <url-de-tu-repo>
git push -u origin main
```

Luego: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
