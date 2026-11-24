const customers = [
  { name: "Иван", face: "Обычное", skin: "#c98f72", clothes: "#4d6177", clothesName: "Серая куртка", hat: "Кепка", behavior: "Спокойное", dangerous: false },
  { name: "Мария", face: "Обычное", skin: "#ddb08f", clothes: "#756d55", clothesName: "Бежевая рубашка", hat: "Нет", behavior: "Нервное", dangerous: false },
  { name: "Пётр", face: "Уставшее", skin: "#b68a72", clothes: "#4b4d5a", clothesName: "Тёмная форма", hat: "Шляпа", behavior: "Спокойное", dangerous: false },
  { name: "Анна", face: "Обычное", skin: "#e0b69a", clothes: "#65745f", clothesName: "Зелёная куртка", hat: "Капюшон", behavior: "Нормальное", dangerous: false },
  { name: "Олег", face: "Чёрные глаза", skin: "#a9a99f", clothes: "#30363b", clothesName: "Чёрная куртка", hat: "Нет", behavior: "Неподвижное", dangerous: true },
  { name: "Без лица", face: "Нет лица", skin: "#bdc2b8", clothes: "#2f3231", clothesName: "Чёрный плащ", hat: "Капюшон", behavior: "Неподвижное", dangerous: true },
  { name: "Красный", face: "Грубые черты", skin: "#8c2f26", clothes: "#6d3d36", clothesName: "Красная рубашка", hat: "Нет", behavior: "Агрессивное", dangerous: true },
  { name: "Гость-7", face: "Чёрные глаза", skin: "#718079", clothes: "#41484e", clothesName: "Серая форма", hat: "Кепка", behavior: "Странное", dangerous: true },
  { name: "Сергей", face: "Обычное", skin: "#c79772", clothes: "#5d6f66", clothesName: "Хаки", hat: "Нет", behavior: "Торопливое", dangerous: false },
  { name: "Лена", face: "Обычное", skin: "#e1b28f", clothes: "#6d7181", clothesName: "Синяя куртка", hat: "Шляпа", behavior: "Спокойное", dangerous: false },
  { name: "Невидимый", face: "Нет лица", skin: "#cfd2c7", clothes: "#3f4742", clothesName: "Серый плащ", hat: "Капюшон", behavior: "Странное", dangerous: true },
  { name: "Василий", face: "Грубые черты", skin: "#9d2f25", clothes: "#2f3437", clothesName: "Тёмная куртка", hat: "Кепка", behavior: "Агрессивное", dangerous: true },
  { name: "Юрий", face: "Улыбка", skin: "#b98b69", clothes: "#526057", clothesName: "Зелёная рубашка", hat: "Шляпа", behavior: "Дружелюбное", dangerous: false },
  { name: "Кира", face: "Обычное", skin: "#d0a184", clothes: "#6b626f", clothesName: "Фиолетовая куртка", hat: "Нет", behavior: "Спокойное", dangerous: false },
  { name: "Тень", face: "Чёрные глаза", skin: "#67716d", clothes: "#242a28", clothesName: "Чёрная форма", hat: "Капюшон", behavior: "Агрессивное", dangerous: true },
  { name: "Странник", face: "Нет лица", skin: "#aa2f2a", clothes: "#4d2925", clothesName: "Красная куртка", hat: "Кепка", behavior: "Агрессивное", dangerous: true }
];

const state = {
  queue: [],
  index: 0,
  correct: 0,
  mistakes: 0,
  score: 0,
  hidden: false,
  resolved: false
};

const elements = {
  scene: document.querySelector("#scene"),
  visitor: document.querySelector("#visitor"),
  hat: document.querySelector("#hat"),
  traits: document.querySelector("#visitorTraits"),
  count: document.querySelector("#visitorCount"),
  score: document.querySelector("#score"),
  message: document.querySelector("#message"),
  overlay: document.querySelector("#resultOverlay"),
  resultTitle: document.querySelector("#resultTitle"),
  resultStats: document.querySelector("#resultStats")
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function startGame() {
  state.queue = shuffle(customers).slice(0, 8);
  state.index = 0;
  state.correct = 0;
  state.mistakes = 0;
  state.score = 0;
  state.hidden = false;
  state.resolved = false;
  elements.overlay.classList.add("hidden");
  showCustomer();
}

function showCustomer() {
  state.resolved = false;
  state.hidden = false;
  elements.scene.classList.remove("hidden-mode");
  elements.visitor.classList.remove("aggressive");
  const customer = state.queue[state.index];

  elements.visitor.style.setProperty("--skin", customer.skin);
  elements.visitor.style.setProperty("--clothes", customer.clothes);
  elements.hat.style.opacity = customer.hat === "Нет" ? "0" : "1";
  elements.hat.style.clipPath = customer.hat === "Капюшон"
    ? "polygon(10% 10%, 90% 10%, 100% 100%, 0 100%)"
    : "none";

  if (customer.behavior === "Агрессивное") {
    elements.visitor.classList.add("aggressive");
  }

  elements.traits.innerHTML = `
    <dt>Лицо</dt><dd>${customer.face}</dd>
    <dt>Одежда</dt><dd>${customer.clothesName}</dd>
    <dt>Головной убор</dt><dd>${customer.hat}</dd>
    <dt>Поведение</dt><dd>${customer.behavior}</dd>
  `;
  elements.count.textContent = `Посетитель ${state.index + 1}/${state.queue.length}`;
  elements.score.textContent = `Очки: ${state.score}`;
  elements.message.textContent = "Изучите посетителя и выберите решение.";
}

function resolveDecision(selectedDanger) {
  if (state.resolved) return;
  state.resolved = true;
  const customer = state.queue[state.index];

  if (selectedDanger === customer.dangerous) {
    state.correct += 1;
    state.score += 100;
    elements.message.textContent = selectedDanger
      ? "Верно: угроза распознана."
      : "Верно: посетитель оказался безопасным.";
  } else {
    state.mistakes += 1;
    state.score = Math.max(0, state.score - 50);
    elements.message.textContent = "Ошибка в решении.";
  }

  elements.score.textContent = `Очки: ${state.score}`;
  window.setTimeout(nextCustomer, 850);
}

function nextCustomer() {
  state.index += 1;
  if (state.index >= state.queue.length) {
    finishShift();
  } else {
    showCustomer();
  }
}

function finishShift() {
  const survived = state.mistakes < 3;
  elements.resultTitle.textContent = survived ? "Смена выжита" : "Смена провалена";
  elements.resultStats.textContent =
    `Верно: ${state.correct} · Ошибки: ${state.mistakes} · Итог: ${state.score} очков`;
  elements.overlay.classList.remove("hidden");
  localStorage.setItem("nightShiftLastResult", JSON.stringify({
    score: state.score,
    correct: state.correct,
    mistakes: state.mistakes,
    survived,
    date: new Date().toISOString()
  }));
}

document.querySelector("#safeButton").addEventListener("click", () => resolveDecision(false));
document.querySelector("#dangerButton").addEventListener("click", () => resolveDecision(true));
document.querySelector("#restartButton").addEventListener("click", startGame);
document.querySelector("#hideButton").addEventListener("click", () => {
  if (state.resolved) return;
  state.hidden = !state.hidden;
  elements.scene.classList.toggle("hidden-mode", state.hidden);
  elements.message.textContent = state.hidden
    ? "Вы скрылись в комнате персонала."
    : "Вы вернулись к наблюдению.";
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}Tab`).classList.add("active");
  });
});

startGame();
