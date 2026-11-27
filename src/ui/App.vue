<script setup lang="ts">
import type { GameUIState } from './MenuState';

defineProps<{ ui: GameUIState }>();

const notices = [
  { title: 'ИНСТРУКЦИЯ №1', text: 'Сверяйте регистрационный номер с документами и данными базы.' },
  { title: 'ИНСТРУКЦИЯ №2', text: 'Несовпадающие данные требуют дополнительного опроса.' },
  { title: 'ПРЕДУПРЕЖДЕНИЕ', text: 'Не передавайте информацию о посетителях по личным каналам связи.' },
  { title: 'НОВОЕ УКАЗАНИЕ', text: 'Повторный визит добавляется в историю и учитывается при решении.' },
];
</script>

<template>
  <main id="app" aria-label="NIGHT SHIFT game">
    <div id="game-root">
      <div id="canvas-host"></div>
      <div class="focus-backdrop"></div>

      <div id="hud" aria-live="polite">
        <section class="hud-panel">
          <span>НОЧЬ {{ ui.hud.night }}</span>
          <time>{{ ui.hud.time }}</time>
          <span>{{ ui.hud.money.toLocaleString('ru-RU') }} ₽</span>
        </section>
        <section class="activity-panel">{{ ui.hud.activity }}</section>
      </div>

      <div class="tooltip" :class="{ visible: ui.tooltipVisible }">{{ ui.tooltip }}</div>
      <button class="save-button" @click="ui.onAction('save')">{{ ui.saveLabel }}</button>

      <section
        class="computer-shell"
        :class="{ open: ui.computerOpen, focused: ui.computerFocused }"
        aria-label="Компьютер оператора"
      >
        <template v-if="ui.menu?.page === 'desktop'">
          <header class="computer-desktop-header">
            <div><strong>STATION OS</strong><span>ЗАПРАВКА №04</span></div>
            <time>{{ ui.hud.time }}</time>
            <button title="Закрыть компьютер" aria-label="Закрыть компьютер" @click="ui.onAction('close-computer')">×</button>
          </header>
          <main class="computer-desktop">
            <aside class="computer-system">
              <b>НОЧЬ {{ ui.hud.night }}</b>
              <span>БАЛАНС</span>
              <strong>{{ ui.computerBalance.toLocaleString('ru-RU') }} ₽</strong>
              <div class="system-state"><i></i> СИСТЕМА АКТИВНА</div>
              <p>Новый посетитель ожидает обслуживания.</p>
            </aside>
            <section class="computer-icons">
              <button @click="ui.onAction('open-panel', 'database')"><span class="icon-face">▦</span><b>База данных</b><em>LOCAL_DB</em></button>
              <button @click="ui.onAction('open-panel', 'messenger')"><span class="icon-face">✉</span><b>Сообщения</b><em>Чат</em></button>
              <button @click="ui.onAction('open-panel', 'cash')"><span class="icon-face">₽</span><b>Касса</b><em>Операции</em></button>
              <button @click="ui.onAction('open-panel', 'visitors')"><span class="icon-face">♙</span><b>Посетители</b><em>Визиты</em></button>
            </section>
          </main>
          <footer class="computer-status"><span>СТАНЦИЯ 04</span><span>{{ ui.hud.time }}</span><span>ON-LINE</span></footer>
        </template>

        <template v-else-if="ui.menu">
          <header class="computer-titlebar">
            <span>{{ ui.menu.title }}</span>
            <nav>
              <button title="Рабочий стол" @click="ui.onAction('desktop')">_</button>
              <button title="Свернуть" @click="ui.onAction('close-computer')">×</button>
            </nav>
          </header>
          <main class="computer-content">
            <p v-if="ui.menu.message">{{ ui.menu.message }}</p>

            <div v-if="ui.menu.cards?.length" class="menu-cards">
              <div v-for="card in ui.menu.cards" :key="card.title" class="database-card">
                <strong>{{ card.title }}</strong>
                <span v-for="detail in card.details" :key="detail">{{ detail }}</span>
              </div>
            </div>

            <dl v-if="ui.menu.rows?.length" class="legacy-grid">
              <template v-for="row in ui.menu.rows" :key="row.label">
                <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
              </template>
            </dl>

            <div v-if="ui.menu.documents?.length" class="document-stack">
              <article v-for="document in ui.menu.documents" :key="document.title" class="document-card">
                <strong>{{ document.title }}</strong>
                <span>{{ document.ownerName }}</span>
                <span>{{ document.plate }}</span>
                <span>{{ document.vehicleModel }}</span>
                <span>До: {{ document.expiryDate }}</span>
              </article>
            </div>

            <div v-if="ui.menu.entries?.length" :class="ui.menu.page === 'shop' ? 'shop-grid' : 'pump-grid'">
              <button
                v-for="entry in ui.menu.entries"
                :key="entry.id"
                :disabled="entry.disabled"
                @click="ui.onAction(ui.menu?.entryAction ?? '', entry.id)"
              >
                <strong>{{ entry.title }}</strong><span>{{ entry.detail }}</span>
              </button>
            </div>

            <div v-if="ui.menu.actions?.length" class="computer-actions">
              <button
                v-for="action in ui.menu.actions"
                :key="action.action"
                :class="{ danger: action.danger }"
                :disabled="action.disabled"
                @click="ui.onAction(action.action, action.payload)"
              >{{ action.label }}</button>
            </div>
          </main>
          <footer class="computer-status"><span>СТАНЦИЯ 04</span><span>{{ ui.hud.time }}</span><span>ON-LINE</span></footer>
        </template>
      </section>

      <section class="noticeboard-overlay" :class="{ open: ui.noticeboardOpen }">
        <header>
          <strong>ОБЪЯВЛЕНИЯ ДЛЯ НОЧНОГО ОПЕРАТОРА</strong>
          <button @click="ui.onAction('return-to-visitor')">Вернуться к посетителю</button>
        </header>
        <article v-for="notice in notices" :key="notice.title">
          <b>{{ notice.title }}</b><p>{{ notice.text }}</p>
        </article>
      </section>

      <section class="visitor-dialogue" :class="{ open: ui.dialogue.open }">
        <header><span>{{ ui.dialogue.name }}</span><button aria-label="Закрыть диалог" @click="ui.onAction('close-dialogue')">×</button></header>
        <div class="dialogue-history"><span v-for="(line, index) in ui.dialogue.history.slice(-3)" :key="index">{{ line }}</span></div>
        <blockquote>{{ ui.dialogue.text }}</blockquote>
        <div class="dialogue-choices">
          <button v-for="choice in ui.dialogue.choices" :key="choice.id" @click="ui.onDialogueChoice(choice)">
            {{ choice.text }}
          </button>
        </div>
      </section>

      <div v-if="ui.fatalError" class="fatal-error"><h1>Не удалось запустить игру</h1><p>{{ ui.fatalError }}</p></div>
    </div>
  </main>
</template>
