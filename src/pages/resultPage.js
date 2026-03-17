
import { getState } from '../appState.js';
import { buildTherapyRecommendation } from '../logic/therapyEngine.js';
import { buildExplanation } from '../logic/explanation.js';
import { buildConclusion } from '../logic/conclusion.js';
import { formatBp, escapeHtml } from '../utils/helpers.js';

export function renderResultPage(root, rerender) {
  const state = getState();
  const result = buildTherapyRecommendation(state);
  const explanation = buildExplanation(state, result);
  const conclusion = buildConclusion(state, result);

  root.innerHTML = `
    <div class="container">
      <h1 class="page-title">Рекомендованная терапия</h1>
      <p class="page-subtitle">Вторая страница — итоговое rule-based решение, объяснение логики и готовое краткое заключение для карты/протокола.</p>

      <div class="layout">
        <section class="card">
          <h2 class="section-title">Основная информация</h2>
          <div class="result-box">
            <div class="kv-row"><div class="kv-key">Возраст / пол / АД</div><div>${escapeHtml(state.patient.age || '—')} лет / ${state.patient.sex === 'female' ? 'женский' : state.patient.sex === 'male' ? 'мужской' : '—'} / ${formatBp(state.patient.sbp, state.patient.dbp)}</div></div>
            <div class="kv-row"><div class="kv-key">Диагноз</div><div>${
              (result.bpDegree === 'нормальное' || result.bpDegree === 'высокое нормальное' || result.bpDegree === 'оптимальное')
                ? `${
                  result.bpDegree === 'нормальное' ? 'Значения артериального давления соответствуют нормальным значениям' :
                  result.bpDegree === 'высокое нормальное' ? 'Значения артериального давления соответствуют повышенным нормальным значениям' :
                  'Значения артериального давления соответствуют оптимальным значениям'
                }, ${escapeHtml(result.stage)}, риск ${escapeHtml(result.risk)}`
                : `АГ ${escapeHtml(result.bpDegree)}, ${escapeHtml(result.stage)}, риск ${escapeHtml(result.risk)}`
            }</div></div>
            <div class="kv-row"><div class="kv-key">Целевой уровень АД</div><div>САД ${escapeHtml(result.targetBp.sbp)} мм рт. ст.; ДАД ${escapeHtml(result.targetBp.dbp)} мм рт. ст.</div></div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Рекомендуемая медикаментозная терапия</h2>
          <div class="result-box">
            <div class="kv-row"><div class="kv-key">Вид терапии</div><div>${escapeHtml(result.therapyType)}</div></div>
            ${result.therapyType === 'корректировка терапии' ? `<div class="kv-row"><div class="kv-key">Принимаемые препараты</div><div>${result.currentClasses.length ? escapeHtml(result.currentClasses.join(', ')) : 'не указаны'}</div></div>` : ''}
            <div class="kv-row"><div class="kv-key">Клинический сценарий</div><div>${escapeHtml(result.scenarioLabel)}</div></div>
            ${result.stepLabel ? `<div class="kv-row"><div class="kv-key">Шаг терапии</div><div>${escapeHtml(result.stepLabel)}</div></div>` : ''}
            <div class="kv-row"><div class="kv-key">Основная рекомендованная терапия</div><div>${escapeHtml(result.mainTherapy)}</div></div>
            ${result.examples?.length ? `<div class="kv-row"><div class="kv-key">Примеры препаратов</div><div>${result.examples.map((x) => `<div>${escapeHtml(x)}</div>`).join('')}</div></div>` : ''}
            ${result.note ? `<div class="kv-row"><div class="kv-key">Темп интенсификации</div><div>${escapeHtml(result.note)}</div></div>` : ''}
          </div>
          <div class="btn-row" style="margin-top:12px;">
            <button type="button" class="btn secondary" id="prevStep" ${!result.stepIndex || result.stepIndex <= 1 ? 'disabled' : ''}>Предыдущий шаг терапии</button>
            <button type="button" class="btn secondary" id="nextStep" ${(result.noDrugTherapy || !result.scenarioConfig || !result.scenarioConfig.steps[result.stepIndex + 1]) ? 'disabled' : ''}>Следующий шаг терапии</button>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Дополнительная информация по лечению</h2>
          <div class="result-box">
            ${result.recommendations.length ? `<div class="kv-row"><div class="kv-key">Рекомендации</div><div>${result.recommendations.map((x) => `<div>${escapeHtml(x)}</div>`).join('')}</div></div>` : ''}
            ${result.warnings.length ? `<div class="kv-row"><div class="kv-key">Предупреждение</div><div><div class="highlight-warning">${result.warnings.map((x) => `<div>${escapeHtml(x)}</div>`).join('')}</div></div></div>` : ''}
            <div class="kv-row"><div class="kv-key">Дополнительная терапия</div><div>${result.additionalTherapy.length ? result.additionalTherapy.map((x) => `<div>${escapeHtml(x)}</div>`).join('') : 'не требуется'}</div></div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Почему рекомендовано именно это</h2>
          <div class="explain-box">
            <ul class="list">${explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Краткое заключение для карты/протокола</h2>
          <div class="btn-row">
            <button type="button" class="btn primary" id="toggleSummary">Скрыть / показать заключение</button>
            <button type="button" class="btn secondary" id="copySummary">Скопировать заключение</button>
          </div>
          <div id="summaryBlock" class="summary-box" style="margin-top:12px;">
            ${escapeHtml(conclusion)}
          </div>
        </section>

        <div class="btn-row">
          <button type="button" class="btn secondary" id="backBtn">Назад к форме</button>
        </div>
      </div>
    </div>
  `;

  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => { window.location.hash = '#form'; });

  const toggleSummary = document.getElementById('toggleSummary');
  toggleSummary.addEventListener('click', () => {
    const block = document.getElementById('summaryBlock');
    block.style.display = block.style.display === 'none' ? 'block' : 'none';
  });

  const copySummary = document.getElementById('copySummary');
  copySummary.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(conclusion);
      alert('Заключение скопировано.');
    } catch {
      alert('Не удалось скопировать автоматически. Скопируйте текст вручную.');
    }
  });

  const prevStep = document.getElementById('prevStep');
  if (prevStep) prevStep.addEventListener('click', () => {
    const step = Math.max(1, (result.stepIndex || 1) - 1);
    const next = getState();
    next.therapyStatus.mode = 'correction';
    next.therapyStatus.targetAchieved = false;
    if (step === 1) next.therapyStatus.currentClasses = ['ИАПФ', 'БКК'];
    if (step === 2) next.therapyStatus.currentClasses = ['ИАПФ', 'БКК', 'ДИУРЕТИКИ'];
    if (step === 3) next.therapyStatus.currentClasses = ['ИАПФ', 'БКК', 'ДИУРЕТИКИ', 'АМКР'];
    localStorage.setItem('agAppState', JSON.stringify(next));
    rerender();
  });

  const nextStep = document.getElementById('nextStep');
  if (nextStep) nextStep.addEventListener('click', () => {
    const next = getState();
    next.therapyStatus.mode = 'correction';
    next.therapyStatus.targetAchieved = false;
    if ((result.stepIndex || 1) <= 1) next.therapyStatus.currentClasses = ['ИАПФ', 'БКК'];
    else if (result.stepIndex === 2) next.therapyStatus.currentClasses = ['ИАПФ', 'БКК', 'ДИУРЕТИКИ'];
    else next.therapyStatus.currentClasses = ['ИАПФ', 'БКК', 'ДИУРЕТИКИ', 'АМКР'];
    localStorage.setItem('agAppState', JSON.stringify(next));
    rerender();
  });
}
