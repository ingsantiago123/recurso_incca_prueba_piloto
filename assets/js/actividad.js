/*!
 * U.INCCA · Motor de actividades gamificadas — vanilla JS, sin dependencias.
 * Cada página de actividad llama a window.renderActividad(config) con sus
 * propias "estaciones" (video, lectura, recurso, video-gallery, quiz).
 */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const TYPE_ICON = {
    video: "fa-circle-play",
    "video-gallery": "fa-video",
    lectura: "fa-book-open",
    recurso: "fa-chart-pie",
    quiz: "fa-circle-question"
  };

  function embedUrl(item) {
    if (item.provider === "youtube") return `https://www.youtube.com/embed/${item.videoId}`;
    return `https://drive.google.com/file/d/${item.fileId || item.videoId}/preview`;
  }

  function loadState(slug) {
    try {
      const raw = localStorage.getItem(`incca-actividad-${slug}`);
      return raw ? JSON.parse(raw) : { done: {}, quizAnswers: {}, quizScore: 0 };
    } catch (e) {
      return { done: {}, quizAnswers: {}, quizScore: 0 };
    }
  }

  function saveState(slug, state) {
    try { localStorage.setItem(`incca-actividad-${slug}`, JSON.stringify(state)); } catch (e) { /* no disponible */ }
  }

  function stationCard(station, index, state) {
    const isQuiz = station.type === "quiz";
    const done = !!state.done[station.id];
    const icon = TYPE_ICON[station.type] || "fa-star";
    const points = isQuiz ? station.questions.length * station.pointsPerQuestion : station.points;

    let media = "";
    if (station.type === "video" || station.type === "recurso") {
      media = `<div class="station-embed"><iframe src="${embedUrl(station)}" title="${station.title}" allow="autoplay" loading="lazy"></iframe></div>`;
    } else if (station.type === "video-gallery") {
      media = `<div class="station-gallery">${station.items.map((it) => `
        <div class="station-gallery-item">
          <div class="station-embed"><iframe src="${embedUrl(it)}" title="${it.label}" allow="autoplay" loading="lazy"></iframe></div>
          <div class="station-gallery-label">${it.label}</div>
        </div>`).join("")}</div>`;
    } else if (station.type === "lectura") {
      media = `<div class="station-text"><p>${station.body}</p></div>`;
    }

    const actionHtml = isQuiz
      ? `<div class="quiz-block" id="quiz-${station.id}"></div>`
      : `<button class="btn ${done ? "btn-done" : "btn-primary"} station-mark" data-station="${station.id}" data-points="${points}">
           <i class="fa-solid ${done ? "fa-check-circle" : "fa-plus-circle"}" aria-hidden="true"></i>
           ${done ? "Completada" : "Marcar como completada"}
         </button>`;

    const lockHtml = isQuiz ? `
        <div class="station-lock-overlay" id="lock-${station.id}">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
          <span>Completa las estaciones anteriores para desbloquear el reto final</span>
        </div>` : "";

    return `
      <article class="station-card ${isQuiz ? "station-card--quiz" : ""} ${done ? "is-done" : ""}" id="station-card-${station.id}" data-station-id="${station.id}">
        ${lockHtml}
        <div class="station-top">
          <div class="station-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
          <div class="station-heading">
            <div class="station-eyebrow">Estación ${index + 1}${isQuiz ? " · Reto final" : ""}</div>
            <h3 class="station-title">${station.title}</h3>
          </div>
          <div class="station-points"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ${points} pts</div>
        </div>
        ${media}
        ${actionHtml}
      </article>`;
  }

  function renderQuiz(container, station, state, onGraded) {
    const saved = state.quizAnswers[station.id] || {};
    container.innerHTML = `
      <div class="quiz-questions">
        ${station.questions.map((q, qi) => `
          <div class="quiz-question" data-qi="${qi}">
            <div class="quiz-question-text"><span class="quiz-question-num">${qi + 1}</span>${q.q}</div>
            <div class="quiz-options">
              ${q.options.map((opt, oi) => `
                <button class="quiz-option ${saved[qi] === oi ? "is-selected" : ""}" data-qi="${qi}" data-oi="${oi}">${opt}</button>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
      <div class="quiz-footer">
        <button class="btn btn-gold" id="quiz-submit-${station.id}"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Enviar respuestas</button>
        <div class="quiz-result" id="quiz-result-${station.id}"></div>
      </div>
    `;

    const answers = Object.assign({}, saved);

    $$(".quiz-option", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const qi = Number(btn.dataset.qi);
        answers[qi] = Number(btn.dataset.oi);
        $$(`.quiz-option[data-qi="${qi}"]`, container).forEach((b) => b.classList.toggle("is-selected", b === btn));
      });
    });

    $(`#quiz-submit-${station.id}`, container).addEventListener("click", () => {
      if (Object.keys(answers).length < station.questions.length) {
        $(`#quiz-result-${station.id}`, container).innerHTML = `<span class="quiz-warning"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Responde todas las preguntas antes de enviar.</span>`;
        return;
      }
      let correct = 0;
      station.questions.forEach((q, qi) => {
        const isRight = answers[qi] === q.correct;
        if (isRight) correct++;
        $$(`.quiz-option[data-qi="${qi}"]`, container).forEach((b) => {
          const oi = Number(b.dataset.oi);
          b.classList.remove("is-selected");
          if (oi === q.correct) b.classList.add("is-correct");
          else if (oi === answers[qi]) b.classList.add("is-incorrect");
          b.disabled = true;
        });
      });
      const score = correct * station.pointsPerQuestion;
      $(`#quiz-result-${station.id}`, container).innerHTML =
        `<i class="fa-solid fa-medal" aria-hidden="true"></i> Obtuviste ${correct} de ${station.questions.length} correctas — ${score} pts`;
      onGraded(score, correct === station.questions.length, answers);
    });
  }

  function launchConfetti(root) {
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    const colors = ["#CBB54E", "#2B8BFA", "#65CBE3", "#A58540", "#FFFFFF"];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.6) + "s";
      piece.style.animationDuration = (2.2 + Math.random() * 1.6) + "s";
      piece.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      layer.appendChild(piece);
    }
    root.appendChild(layer);
    setTimeout(() => layer.remove(), 4200);
  }

  function totalPossible(stations) {
    return stations.reduce((sum, s) => sum + (s.type === "quiz" ? s.questions.length * s.pointsPerQuestion : s.points), 0);
  }

  function earnedPoints(stations, state) {
    let sum = 0;
    stations.forEach((s) => {
      if (s.type === "quiz") sum += state.quizScore || 0;
      else if (state.done[s.id]) sum += s.points;
    });
    return sum;
  }

  function updateProgressUI(config, state) {
    const total = totalPossible(config.stations);
    const earned = earnedPoints(config.stations, state);
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    $("#actProgressFill").style.width = pct + "%";
    $("#actProgressLabel").textContent = `${earned} / ${total} pts (${pct}%)`;
    return { earned, total, pct };
  }

  function refreshLocks(config, state) {
    const nonQuiz = config.stations.filter((s) => s.type !== "quiz");
    const allDone = nonQuiz.every((s) => state.done[s.id]);
    config.stations.filter((s) => s.type === "quiz").forEach((q) => {
      const overlay = $(`#lock-${q.id}`);
      const card = $(`#station-card-${q.id}`);
      if (!overlay || !card) return;
      if (allDone) { card.classList.add("is-unlocked"); }
      else { card.classList.remove("is-unlocked"); }
    });
  }

  function maybeCelebrate(config, state) {
    const { pct } = updateProgressUI(config, state);
    if (pct >= 100 && !state.celebrated) {
      state.celebrated = true;
      saveState(config.slug, state);
      const overlay = $("#celebrationOverlay");
      overlay.classList.add("is-visible");
      launchConfetti(document.body);
    }
  }

  window.renderActividad = function (config) {
    document.addEventListener("DOMContentLoaded", () => {
      const state = loadState(config.slug);
      const root = $("#stationsRoot");

      $("#actTag").innerHTML = `<i class="fa-solid ${config.icon || "fa-flag"}" aria-hidden="true"></i> ${config.tag}`;
      $("#actTitle").textContent = config.title;
      $("#actSubtitle").textContent = config.subtitle || "";

      root.innerHTML = config.stations.map((s, i) => stationCard(s, i, state)).join("");

      config.stations.filter((s) => s.type === "quiz").forEach((q) => {
        renderQuiz($(`#quiz-${q.id}`), q, state, (score, perfect, answers) => {
          state.quizScore = Math.max(state.quizScore || 0, score);
          state.quizAnswers[q.id] = answers;
          state.done[q.id] = true;
          saveState(config.slug, state);
          $(`#station-card-${q.id}`).classList.add("is-done");
          updateProgressUI(config, state);
          maybeCelebrate(config, state);
        });
      });

      $$(".station-mark", root).forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.station;
          const willDo = !state.done[id];
          state.done[id] = willDo;
          saveState(config.slug, state);
          btn.classList.toggle("btn-done", willDo);
          btn.classList.toggle("btn-primary", !willDo);
          btn.innerHTML = `<i class="fa-solid ${willDo ? "fa-check-circle" : "fa-plus-circle"}" aria-hidden="true"></i> ${willDo ? "Completada" : "Marcar como completada"}`;
          $(`#station-card-${id}`).classList.toggle("is-done", willDo);
          refreshLocks(config, state);
          maybeCelebrate(config, state);
        });
      });

      $("#actResetBtn").addEventListener("click", () => {
        const fresh = { done: {}, quizAnswers: {}, quizScore: 0 };
        saveState(config.slug, fresh);
        location.reload();
      });

      $("#celebrationClose").addEventListener("click", () => $("#celebrationOverlay").classList.remove("is-visible"));

      refreshLocks(config, state);
      updateProgressUI(config, state);
      if (state.celebrated) { /* ya se celebró antes; no repetir confeti al recargar */ }
    });
  };
})();
