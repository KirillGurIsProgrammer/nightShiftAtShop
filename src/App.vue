<script setup lang="ts">
import { computed, ref } from "vue";
import { createCustomerQueue, type Customer } from "./game/customers";

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

const customerCount = 8;
const queue = ref<Customer[]>([]);
const index = ref(0);
const correct = ref(0);
const mistakes = ref(0);
const score = ref(0);
const hidden = ref(false);
const resolved = ref(false);
const activeTab = ref<"inspection" | "patterns">("inspection");
const message = ref("Изучите посетителя и выберите решение.");
const showResult = ref(false);
const stars = ref<Star[]>([]);

function makeStars(): Star[] {
  return Array.from({ length: 24 }, () => ({
    left: Math.random() * 96 + 2,
    top: Math.random() * 34 + 4,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.55 + 0.35
  }));
}

function startGame() {
  queue.value = createCustomerQueue(customerCount);
  index.value = 0;
  correct.value = 0;
  mistakes.value = 0;
  score.value = 0;
  hidden.value = false;
  resolved.value = false;
  showResult.value = false;
  activeTab.value = "inspection";
  stars.value = makeStars();
  message.value = "Изучите посетителя и выберите решение.";
}

const customer = computed(() => queue.value[index.value]);
const dawnProgress = computed(() => queue.value.length
  ? index.value / (queue.value.length - 1)
  : 0);

const skyStyle = computed(() => ({
  "--dawn": dawnProgress.value,
  "--moon-left": `${18 + dawnProgress.value * 68}%`,
  "--moon-top": `${18 - dawnProgress.value * 8}%`
}));

function resolveDecision(selectedDanger: boolean) {
  if (resolved.value || !customer.value) return;
  resolved.value = true;

  if (selectedDanger === customer.value.dangerous) {
    correct.value += 1;
    score.value += 100;
    message.value = selectedDanger
      ? "Верно: угроза распознана."
      : "Верно: посетитель оказался безопасным.";
  } else {
    mistakes.value += 1;
    score.value = Math.max(0, score.value - 50);
    message.value = "Ошибка в решении.";
  }

  window.setTimeout(nextCustomer, 850);
}

function nextCustomer() {
  index.value += 1;
  if (index.value >= queue.value.length) {
    finishShift();
  } else {
    stars.value = makeStars();
    hidden.value = false;
    resolved.value = false;
    message.value = "Изучите посетителя и выберите решение.";
  }
}

function finishShift() {
  const survived = mistakes.value < 3;
  showResult.value = true;
  localStorage.setItem("nightShiftLastResult", JSON.stringify({
    score: score.value,
    correct: correct.value,
    mistakes: mistakes.value,
    survived,
    date: new Date().toISOString()
  }));
}

function toggleHide() {
  if (resolved.value) return;
  hidden.value = !hidden.value;
  message.value = hidden.value
    ? "Вы скрылись в комнате персонала."
    : "Вы вернулись к наблюдению.";
}

startGame();
</script>

<template>
  <main class="game-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">ТРАНСТРАКАЗИНА-12</p>
        <h1>НОЧНАЯ СМЕНА</h1>
      </div>
      <div class="shift-status">
        <span>Посетитель {{ index + 1 }}/{{ queue.length }}</span>
        <span>Очки: {{ score }}</span>
      </div>
    </header>

    <section class="shop-layout">
      <div class="scene" :class="{ 'hidden-mode': hidden }">
        <div class="window" :style="skyStyle">
          <div class="night-sky">
            <span
              v-for="(star, starIndex) in stars"
              :key="starIndex"
              class="star"
              :style="{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity * (1 - dawnProgress)
              }"
            ></span>
            <div class="moon"></div>
            <div class="horizon-glow"></div>
          </div>
          <div class="road"></div>

          <div
            v-if="customer"
            class="visitor"
            :class="{ aggressive: customer.behavior === 'Агрессивное' }"
            :style="{
              '--skin': customer.skin,
              '--clothes': customer.clothes
            }"
            aria-live="polite"
          >
            <div
              class="hat"
              :style="{
                opacity: customer.hat === 'Нет' ? 0 : 1,
                clipPath: customer.hat === 'Капюшон'
                  ? 'polygon(10% 10%, 90% 10%, 100% 100%, 0 100%)'
                  : 'none'
              }"
            ></div>
            <div class="head">
              <div class="eyes"><i></i><i></i></div>
              <div class="mouth"></div>
            </div>
            <div class="body"><div class="badge">SHIFT</div></div>
          </div>
        </div>

        <div class="counter">
          <button class="hide-button" @click="toggleHide">Спрятаться</button>
        </div>
      </div>

      <aside class="panel">
        <div class="panel-tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'inspection' }"
            @click="activeTab = 'inspection'"
          >Осмотр</button>
          <button
            class="tab"
            :class="{ active: activeTab === 'patterns' }"
            @click="activeTab = 'patterns'"
          >Справочник</button>
        </div>

        <div v-if="activeTab === 'inspection'" class="tab-content active">
          <h2>Досье посетителя</h2>
          <dl v-if="customer">
            <dt>Лицо</dt><dd>{{ customer.face }}</dd>
            <dt>Одежда</dt><dd>{{ customer.clothesName }}</dd>
            <dt>Головной убор</dt><dd>{{ customer.hat }}</dd>
            <dt>Поведение</dt><dd>{{ customer.behavior }}</dd>
          </dl>
          <div class="decision">
            <button class="safe" @click="resolveDecision(false)">Безопасно</button>
            <button class="danger" @click="resolveDecision(true)">Угроза</button>
          </div>
        </div>

        <div v-else class="tab-content active">
          <h2>Опасные паттерны</h2>
          <ul class="patterns">
            <li><strong>Чёрные глаза</strong> — не смотреть прямо.</li>
            <li><strong>Нет лица</strong> — немедленно прятаться.</li>
            <li><strong>Красная кожа</strong> — ложная форма.</li>
            <li><strong>Агрессивное поведение</strong> — угроза.</li>
            <li><strong>Капюшон вниз</strong> — проверьте лицо.</li>
          </ul>
        </div>

        <div class="message" aria-live="polite">{{ message }}</div>
      </aside>
    </section>
  </main>

  <div v-if="showResult" class="overlay">
    <div class="result-card">
      <p class="eyebrow">СМЕНА ЗАВЕРШЕНА</p>
      <h2>{{ mistakes < 3 ? "Смена выжита" : "Смена провалена" }}</h2>
      <p>Верно: {{ correct }} · Ошибки: {{ mistakes }} · Итог: {{ score }} очков</p>
      <button @click="startGame">Начать заново</button>
    </div>
  </div>
</template>
