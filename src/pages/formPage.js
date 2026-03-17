
import { getState, setState, resetState } from '../appState.js';
import { validateState } from '../logic/validation.js';
import { calculateBpDegree, calculateStage, calculateRisk, deriveAutoStageRiskFactors, score2Image, syncChaAutoFields, calculateFrailty, calculateCha2Vasc } from '../logic/calculators.js';
import { loadRules, saveRulesOverride, resetRulesOverride, DEFAULT_RULES } from '../config/rules.js';
import { escapeHtml } from '../utils/helpers.js';

const riskFactorsOptions = [
  'Курение', 'Дислипидемия', 'Мочевая кислота (≥360 мкмоль/л)',
  'Нарушение гликемии натощак: глюкоза плазмы натощак 5,6–6,9 ммоль/л',
  'Нарушение толерантности к глюкозе', 'Избыточная масса тела или ожирение',
  'Абдоминальное ожирение', 'Отягощенный семейный анамнез по ССЗ',
  'АГ в молодом возрасте в семье', 'Ранняя менопауза',
  'Малоподвижный образ жизни', 'Психологические и социально-экономические факторы',
  'ЧСС более 80 ударов в минуту',
];

const organDamageOptions = [
  'Сахарный диабет', 'Пульсовое давление (у пожилых пациентов) ≥ 60 мм рт. ст.',
  'Каротидно-феморальная скорость распространения пульсовой волны > 10 м/с',
  'Электрокардиографические признаки гипертрофии левого желудочка',
  'Эхокардиографические признаки гипертрофии левого желудочка',
  'Альбуминурия 30–300 мг / 24 ч или соотношение альбумин/креатинин 30–300 мг/г',
  'Лодыжечно-плечевой индекс < 0,9',
  'Выраженная ретинопатия: кровоизлияния, экссудаты или отёк диска зрительного нерва',
];

const clinicalStatesOptions = [
  'Цереброваскулярные заболевания: ишемический инсульт, геморрагический инсульт, ТИА',
  'ИБС: инфаркт миокарда, стенокардия, реваскуляризация миокарда',
  'Наличие атероматозных бляшек при визуализации (стеноз ≥50%)',
  'Сердечная недостаточность, в том числе СН с сохранённой ФВ',
  'Заболевание периферических артерий',
  'Фибрилляция предсердий',
];

const additionalConditions = [
  'СД', 'ХБП', 'ИБС', 'ГЛЖ и СН', 'ФП и другие аритмии',
  'Цереброваскулярная болезнь', 'Заболевания периферических артерий',
  'Бронхиальная астма и/или ХОБЛ', 'Синдром обструктивного апноэ сна',
  'Резистентная АГ', 'Беременность', 'Эректильная дисфункция',
];

const additionalMeds = ['КОК', 'Менопаузальная гормональная терапия', 'Противоопухолевая терапия'];

const therapyClasses = ['БРА', 'ИАПФ', 'БКК', 'ДИУРЕТИКИ', 'ББ', 'АРНИ', 'АМКР', 'АИР', 'ААБ'];

const frailtyQuestions = [
  'Похудели ли Вы на 5 кг и более за последние 6 месяцев?',
  'Испытываете ли Вы какие-либо ограничения в повседневной жизни из-за снижения зрения или слуха?',
  'Были ли у Вас в течение последнего года падения или травмы, связанные с падением?',
  'Чувствуете ли Вы себя подавленным, грустным или встревоженным на протяжении последних недель?',
  'Есть ли у Вас проблемы с памятью, пониманием, ориентацией или способностью планировать?',
  'Страдаете ли Вы недержанием мочи?',
  'Испытываете ли Вы трудности в перемещении по дому или на улице?',
];

const markedRiskOptions = [
  'ХС >8 ммоль/л и/или ХС ЛНП >4,9 ммоль/л',
  'АД ≥180/110 мм рт.ст.',
  'Сочетание более 3 факторов риска',
];

function chip(label, active, attrs = '') {
  return `<button type="button" class="chip ${active ? 'active' : ''}" ${attrs}>${escapeHtml(label)}</button>`;
}

function renderChipGroup(name, options, selected, attrsBuilder) {
  return `<div class="chips">${options.map((opt, idx) => chip(opt, selected.includes(opt), attrsBuilder(opt, idx))).join('')}</div>`;
}

export function renderFormPage(root, rerender) {
  const state = getState();
  syncChaAutoFields(state);
  const validation = validateState(state);
  const autoFactors = deriveAutoStageRiskFactors(state.patient);
  const mergedFactors = Array.from(new Set([...autoFactors, ...state.diagnosis.stageFactors.riskFactors]));
  state.diagnosis.stageFactors.riskFactors = mergedFactors;
  setState(state);

  const degree = calculateBpDegree(state.patient);
  const stage = calculateStage(state.patient, state.diagnosis);
  const risk = calculateRisk(state);
  const frailty = calculateFrailty(state.additional.other);
  const cha = calculateCha2Vasc(state);
  const score2Src = score2Image(state.patient.age);
  const rules = loadRules();

  const menOnly = state.patient.sex === 'male';
  const womenOnly = state.patient.sex === 'female';
  const showMenopause = womenOnly;
  const visibleConditions = additionalConditions.filter((item) => !(item === 'Беременность' && menOnly) && !(item === 'Эректильная дисфункция' && womenOnly));
  const visibleMeds = additionalMeds.filter((item) => !((item === 'КОК' || item === 'Менопаузальная гормональная терапия') && menOnly));

  root.innerHTML = `
    <div class="container">
      <h1 class="page-title">Система помощи принятия решений по терапии АГ</h1>
      <p class="page-subtitle">Первая страница — ввод данных пациента и rule-based определение степени, стадии, риска и клинического сценария.</p>

      ${validation.errors.length ? `<div class="error-list card"><strong>Критические ошибки</strong><ul class="list">${validation.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
      ${validation.warnings.length ? `<div class="warning-list card"><strong>Предупреждения</strong><ul class="list">${validation.warnings.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
      ${
        state.additional.conditions.selected.includes('Беременность') && ((Number(state.patient.sbp) >= 160) || (Number(state.patient.dbp) >= 110))
          ? `<div class="highlight-warning">Рекомендуется срочно госпитализировать пациентку и расценивать состояние как гипертонический криз.</div>`
          : ''
      }

      <div class="layout">
        <section class="card">
          <h2 class="section-title">Основная информация</h2>
          <div class="grid-4">
            <div class="field"><label>Возраст</label><input id="age" type="number" min="1" max="120" value="${escapeHtml(state.patient.age)}" /></div>
            <div class="field"><label>Пол</label>
              <select id="sex">
                <option value="">Выберите</option>
                <option value="male" ${state.patient.sex === 'male' ? 'selected' : ''}>Мужской</option>
                <option value="female" ${state.patient.sex === 'female' ? 'selected' : ''}>Женский</option>
              </select>
            </div>
            <div class="field"><label>САД</label><input id="sbp" type="number" min="1" value="${escapeHtml(state.patient.sbp)}" /></div>
            <div class="field"><label>ДАД</label><input id="dbp" type="number" min="1" value="${escapeHtml(state.patient.dbp)}" /></div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Диагноз</h2>
          <div class="grid-3">
            <div class="field">
              <label>Степень</label>
              <div class="banner">${degree ? `Автоматически рассчитано: <strong>${escapeHtml(degree)}</strong>` : 'Введите САД и ДАД для автоматического расчёта степени.'}</div>
            </div>
            <div class="field">
              <label>Стадия</label>
              <select id="stageModeSelect">
                <option value="determine" ${state.diagnosis.stageMode === 'determine' ? 'selected' : ''}>Определить</option>
                <option value="manual" ${state.diagnosis.stageMode === 'manual' ? 'selected' : ''}>Выбрать вручную</option>
              </select>
              ${state.diagnosis.stageMode === 'manual' ? `
              <select id="stageManualSelect">
                <option value="">Выберите стадию</option>
                <option value="стадия I" ${state.diagnosis.stageManual === 'стадия I' ? 'selected' : ''}>Стадия I</option>
                <option value="стадия II" ${state.diagnosis.stageManual === 'стадия II' ? 'selected' : ''}>Стадия II</option>
                <option value="стадия III" ${state.diagnosis.stageManual === 'стадия III' ? 'selected' : ''}>Стадия III</option>
              </select>` : `<div class="banner">Итоговая стадия: <strong>${escapeHtml(stage)}</strong></div>`}
            </div>
            <div class="field">
              <label>Риск</label>
              <select id="riskModeSelect">
                <option value="determine" ${state.diagnosis.riskMode === 'determine' ? 'selected' : ''}>Определить</option>
                <option value="manual" ${state.diagnosis.riskMode === 'manual' ? 'selected' : ''}>Выбрать вручную</option>
              </select>
              ${state.diagnosis.riskMode === 'manual' ? `
              <select id="riskManualSelect">
                <option value="">Выберите риск</option>
                ${rules.riskLevels.map((item) => `<option value="${item}" ${state.diagnosis.riskManual === item ? 'selected' : ''}>${item}</option>`).join('')}
              </select>` : `<div class="banner">Итоговый риск: <strong>${escapeHtml(risk || 'не определён')}</strong></div>`}
            </div>
          </div>

          ${state.diagnosis.stageMode === 'determine' ? `
          <h3 class="subsection-title">Определение стадии</h3>
          <div class="columns-3">
            <div class="card">
              <h4>Факторы риска</h4>
              ${autoFactors.length ? `<div class="auto-locked">Автоматически добавлены и зафиксированы: ${autoFactors.join(', ')}.</div>` : '<div class="small">Автоматических факторов риска нет.</div>'}
              <div class="chips" style="margin-top:10px;">
                ${riskFactorsOptions
                  .filter((x) => !(x === 'Ранняя менопауза' && !showMenopause))
                  .map((opt) => chip(opt, mergedFactors.includes(opt), `data-stage-risk-factor="${escapeHtml(opt)}"`)).join('')}
              </div>
            </div>
            <div class="card">
              <h4>Сопутствующие состояния и поражение органов-мишеней</h4>
              <div class="field">
                <label>ХБП</label>
                <select id="stageCkdStage">
                  <option value="absent" ${state.diagnosis.stageFactors.ckdStage === 'absent' ? 'selected' : ''}>отсутствует</option>
                  <option value="C3" ${state.diagnosis.stageFactors.ckdStage === 'C3' ? 'selected' : ''}>С3</option>
                  <option value="C4" ${state.diagnosis.stageFactors.ckdStage === 'C4' ? 'selected' : ''}>С4</option>
                  <option value="C5" ${state.diagnosis.stageFactors.ckdStage === 'C5' ? 'selected' : ''}>С5</option>
                </select>
              </div>
              <div class="chips">
                ${organDamageOptions.map((opt) => chip(opt, state.diagnosis.stageFactors.organDamage.includes(opt), `data-organ="${escapeHtml(opt)}"`)).join('')}
              </div>
            </div>
            <div class="card">
              <h4>Ассоциированные клинические состояния</h4>
              <div class="chips">
                ${clinicalStatesOptions.map((opt) => chip(opt, state.diagnosis.stageFactors.clinicalStates.includes(opt), `data-clinical="${escapeHtml(opt)}"`)).join('')}
              </div>
            </div>
          </div>` : ''}

          ${state.diagnosis.riskMode === 'determine' ? `
          <h3 class="subsection-title">Определение риска</h3>
          <div class="toggle-group">
            <button type="button" class="toggle-btn ${state.diagnosis.riskCalcMode === 'score2' ? 'active' : ''}" data-riskcalc="score2">Рассчитать по SCORE2</button>
            <button type="button" class="toggle-btn ${state.diagnosis.riskCalcMode === 'clinical' ? 'active' : ''}" data-riskcalc="clinical">Клинический расчёт</button>
          </div>

          ${state.diagnosis.riskCalcMode === 'score2' ? `
            <div class="grid-2" style="margin-top:14px;">
              <div class="image-placeholder">${score2Src ? `<img src="${score2Src}" alt="SCORE2" />` : `<div class="card"><strong>Пояснение</strong><p class="small">Для возраста младше 40 лет интерпретация SCORE2 в этом интерфейсе не применяется.</p></div>`}</div>
              <div class="field">
                <label>Введите значение SCORE2</label>
                <input id="score2Value" type="number" step="0.1" min="0" value="${escapeHtml(state.diagnosis.score2Value)}" />
                <div class="small">Возраст пациента используется автоматически для интерпретации результата.</div>
              </div>
            </div>
          ` : `
            <div class="grid-2" style="margin-top:14px;">
              <div class="card">
                <h4>Состояния</h4>
                <div class="chips">
                  ${[
                    ['СД', state.diagnosis.clinicalRisk.diabetes, 'diabetes'],
                    ['ХБП', state.diagnosis.clinicalRisk.ckd, 'ckd'],
                    ['Семейная гиперхолестеринемия без факторов риска', state.diagnosis.clinicalRisk.familialHypercholesterolemia, 'fh'],
                    ['Документированное атеросклеротическое ССЗ', state.diagnosis.clinicalRisk.documentedAscvd, 'ascvd'],
                    ['Бесспорно документированное ССЗ по визуализации', state.diagnosis.clinicalRisk.imagingAscvd, 'imaging'],
                    ['Экстремальный риск / повторные события', state.diagnosis.clinicalRisk.extremeAscvd, 'extreme'],
                  ].map(([label, active, key]) => chip(label, active, `data-clinrisk-toggle="${key}"`)).join('')}
                </div>

                ${state.diagnosis.clinicalRisk.diabetes ? `
                <div class="grid-3" style="margin-top:10px;">
                  <div class="field">
                    <label>Тип СД</label>
                    <select id="diabetesType">
                      <option value="">Выберите</option>
                      <option value="1 тип" ${state.diagnosis.clinicalRisk.diabetesType === '1 тип' ? 'selected' : ''}>1 тип</option>
                      <option value="2 тип" ${state.diagnosis.clinicalRisk.diabetesType === '2 тип' ? 'selected' : ''}>2 тип</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Стаж заболевания, лет</label>
                    <input id="diabetesDuration" type="number" min="0" value="${escapeHtml(state.diagnosis.clinicalRisk.diabetesDuration)}" />
                  </div>
                  <div class="field">
                    <label>Поражение органов-мишеней</label>
                    <button type="button" class="toggle-btn ${state.diagnosis.clinicalRisk.diabetesTom ? 'active' : ''}" id="diabetesTomBtn">ПОМ</button>
                  </div>
                </div>` : ''}

                ${state.diagnosis.clinicalRisk.ckd ? `
                <div class="field" style="margin-top:10px;">
                  <label>ХБП</label>
                  <select id="ckdSeverity">
                    <option value="">Выберите</option>
                    <option value="moderate" ${state.diagnosis.clinicalRisk.ckdSeverity === 'moderate' ? 'selected' : ''}>Умеренная (СКФ 30–59)</option>
                    <option value="severe" ${state.diagnosis.clinicalRisk.ckdSeverity === 'severe' ? 'selected' : ''}>Выраженная (СКФ &lt;30)</option>
                  </select>
                </div>` : ''}

                <h4 style="margin-top:14px;">Значимо выраженные факторы риска</h4>
                <div class="chips">
                  ${markedRiskOptions.map((opt) => chip(opt, state.diagnosis.clinicalRisk.markedRiskFactors.includes(opt), `data-marked-risk="${escapeHtml(opt)}"`)).join('')}
                </div>
              </div>
              <div class="card">
                <h4>Промежуточный итог</h4>
                <div class="banner">Результат клинического расчёта: <strong>${escapeHtml(risk || 'не определён')}</strong></div>
                <p class="small">Если выбран хотя бы один пункт более высокой ступени, итоговый риск повышается до этого уровня.</p>
              </div>
            </div>
          `}
          ` : ''}
        </section>

        <section class="card">
          <h2 class="section-title">Дополнительная информация</h2>
          <h3 class="subsection-title">Сопутствующие состояния</h3>
          ${renderChipGroup('conditions', visibleConditions, state.additional.conditions.selected, (opt) => `data-cond="${escapeHtml(opt)}"`)}
          ${state.additional.conditions.selected.includes('ХБП') ? `
            <div class="field" style="margin-top:10px;">
              <label>Уточнение ХБП</label>
              <select id="additionalCkdSubtype">
                <option value="">Выберите</option>
                <option value="early" ${state.additional.conditions.ckdSubtype === 'early' ? 'selected' : ''}>ХБП С1–3, СКФ 30 и более мл/мин/1,73м3</option>
                <option value="late" ${state.additional.conditions.ckdSubtype === 'late' ? 'selected' : ''}>ХБП С4–5 / СКФ менее 30 мл/мин/1,73м3</option>
              </select>
            </div>` : ''}
          ${state.additional.conditions.selected.includes('ИБС') ? `
            <div class="field" style="margin-top:10px;">
              <label>Уточнение ИБС</label>
              <select id="ihdSubtype">
                <option value="">Выберите</option>
                <option value="angina-yes" ${state.additional.conditions.ihdSubtype === 'angina-yes' ? 'selected' : ''}>Стенокардия есть</option>
                <option value="angina-no" ${state.additional.conditions.ihdSubtype === 'angina-no' ? 'selected' : ''}>Стенокардия отсутствует</option>
              </select>
            </div>` : ''}
          ${state.additional.conditions.selected.includes('ГЛЖ и СН') ? `
            <div class="field" style="margin-top:10px;">
              <label>Уточнение ГЛЖ и СН</label>
              <select id="heartFailureSubtype">
                <option value="">Выберите</option>
                <option value="hfrEF" ${state.additional.conditions.heartFailureSubtype === 'hfrEF' ? 'selected' : ''}>ХСНнФВ</option>
                <option value="hfmrEF" ${state.additional.conditions.heartFailureSubtype === 'hfmrEF' ? 'selected' : ''}>ХСНунФВ</option>
                <option value="hfPEF" ${state.additional.conditions.heartFailureSubtype === 'hfPEF' ? 'selected' : ''}>ХСНсФВ</option>
              </select>
            </div>` : ''}
          ${state.additional.conditions.selected.includes('ФП и другие аритмии') ? `
            <div class="field" style="margin-top:10px;">
              <label>Уточнение ФП и аритмий</label>
              <select id="afSubtype">
                <option value="">Выберите</option>
                <option value="hr-80-plus" ${state.additional.conditions.afSubtype === 'hr-80-plus' ? 'selected' : ''}>ЧСС 80 ударов и более</option>
                <option value="hr-below-80" ${state.additional.conditions.afSubtype === 'hr-below-80' ? 'selected' : ''}>ЧСС менее 80</option>
              </select>
            </div>` : ''}

          <h3 class="subsection-title">Приём других лекарственных средств</h3>
          ${renderChipGroup('meds', visibleMeds, state.additional.meds.selected, (opt) => `data-med="${escapeHtml(opt)}"`)}
          ${state.additional.meds.selected.includes('Противоопухолевая терапия') ? `
            <div class="field" style="margin-top:10px;">
              <label>Статус противоопухолевой терапии</label>
              <select id="cancerSubtype">
                <option value="">Выберите</option>
                <option value="not-started" ${state.additional.meds.cancerSubtype === 'not-started' ? 'selected' : ''}>Терапия ещё не начата</option>
                <option value="ongoing" ${state.additional.meds.cancerSubtype === 'ongoing' ? 'selected' : ''}>Терапия проводится</option>
              </select>
            </div>` : ''}

          <h3 class="subsection-title">Другое</h3>
          ${Number(state.patient.age) >= 60 ? `
            <div class="btn-row">
              <button type="button" class="toggle-btn ${state.additional.other.frailtyOpen ? 'active' : ''}" id="toggleFrailty">Рассчитать вероятность старческой астении</button>
            </div>
            ${state.additional.other.frailtyOpen ? `
              <div class="card" style="margin-top:12px;">
                <div class="small">Ответьте на вопросы. Галочка = «да».</div>
                <div class="chips" style="margin-top:10px;">
                  ${frailtyQuestions.map((q, i) => chip(q, state.additional.other.frailtyAnswers[i], `data-frailty="${i}"`)).join('')}
                </div>
                <div class="btn-row" style="margin-top:12px;">
                  <button type="button" class="btn primary" id="calcFrailty">Рассчитать</button>
                  <button type="button" class="btn secondary" id="resetFrailty">Сбросить</button>
                </div>
                ${state.additional.other.frailtyCalculated ? `<div class="banner" style="margin-top:10px;">Результат: <strong>${frailty.score} балл(ов)</strong> — ${escapeHtml(frailty.label)}</div>` : ''}
              </div>
            ` : ''}` : `<div class="small">Блок расчёта старческой астении показывается с 60 лет.</div>`}

          ${state.additional.conditions.selected.includes('ФП и другие аритмии') ? `
            <div class="btn-row" style="margin-top:14px;">
              <button type="button" class="toggle-btn ${state.additional.other.chaOpen ? 'active' : ''}" id="toggleCha">Рассчитать CHA2DS2-VASc</button>
            </div>
            ${state.additional.other.chaOpen ? `
              <div class="card" style="margin-top:12px;">
                <div class="small">Отметьте факторы риска пациента.</div>
                <div class="chips" style="margin-top:10px;">
                  ${chip('Инсульт / ТИА / системная эмболия в анамнезе (2 балла)', state.additional.other.chaAnswers.strokeHistory, 'data-cha="strokeHistory"')}
                  ${chip('Возраст ≥75 лет (2 балла, автоматически)', state.additional.other.chaAnswers.age75, 'disabled')}
                  ${chip('АГ или приём АГП (1 балл)', state.additional.other.chaAnswers.hypertension, 'data-cha="hypertension"')}
                  ${chip('СД 1 или 2 типа (1 балл)', state.additional.other.chaAnswers.diabetes, 'data-cha="diabetes"')}
                  ${chip('Средняя или тяжёлая ХСН (1 балл)', state.additional.other.chaAnswers.chf, 'data-cha="chf"')}
                  ${chip('Сосудистое заболевание (1 балл)', state.additional.other.chaAnswers.vascular, 'data-cha="vascular"')}
                  ${chip('Возраст 65–74 года (1 балл, автоматически)', state.additional.other.chaAnswers.age65_74, 'disabled')}
                  ${chip('Женский пол (1 балл, автоматически)', state.additional.other.chaAnswers.female, 'disabled')}
                </div>
                <div class="btn-row" style="margin-top:12px;">
                  <button type="button" class="btn primary" id="calcCha">Рассчитать</button>
                  <button type="button" class="btn secondary" id="resetCha">Сбросить</button>
                </div>
                ${state.additional.other.chaCalculated ? `<div class="banner" style="margin-top:10px;">Итог: <strong>${cha.points} балл(ов)</strong>, ожидаемая частота инсультов за год — <strong>${escapeHtml(cha.annualStrokeRisk)}%</strong></div>` : ''}
              </div>
            ` : ''}` : ''}

        </section>

        <section class="card">
          <h2 class="section-title">Статус терапии</h2>
          <div class="toggle-group">
            <button type="button" class="toggle-btn ${state.therapyStatus.mode === 'start' ? 'active' : ''}" data-therapy-mode="start">Старт терапии</button>
            <button type="button" class="toggle-btn ${state.therapyStatus.mode === 'correction' ? 'active' : ''}" data-therapy-mode="correction">Коррекция терапии</button>
          </div>
          ${state.therapyStatus.mode === 'correction' ? `
            <div style="margin-top:14px;">
              <div class="small">Укажите уже используемые классы антигипертензивных препаратов.</div>
              <div class="chips" style="margin-top:10px;">
                ${therapyClasses.map((cls) => chip(cls, state.therapyStatus.currentClasses.includes(cls), `title="${escapeHtml(rules.classDescriptions[cls] || '')}" data-current-class="${cls}"`)).join('')}
              </div>
              <div class="field" style="margin-top:12px;">
                <label>Целевой уровень АД достигнут?</label>
                <select id="targetAchieved">
                  <option value="false" ${!state.therapyStatus.targetAchieved ? 'selected' : ''}>Нет, не достигнут</option>
                  <option value="true" ${state.therapyStatus.targetAchieved ? 'selected' : ''}>Да, достигнут</option>
                </select>
              </div>
            </div>
          ` : ''}
        </section>

        <section class="card">
          <h2 class="section-title">Предпросмотр</h2>
          <div class="kv-row"><div class="kv-key">Степень</div><div>${escapeHtml(degree || 'не определена')}</div></div>
          <div class="kv-row"><div class="kv-key">Стадия</div><div>${escapeHtml(stage || 'не определена')}</div></div>
          <div class="kv-row"><div class="kv-key">Риск</div><div>${escapeHtml(risk || 'не определён')}</div></div>
        </section>

        <section class="card">
          <h2 class="section-title">Скрытый редактор правил</h2>
          <div class="small">Нажмите <span class="code-hint">Ctrl + Shift + R</span>, чтобы показать или скрыть JSON-конфигурацию правил.</div>
          <div class="rule-editor ${state.ui.showRuleEditor ? 'visible' : ''}">
            <textarea id="ruleEditor">${escapeHtml(JSON.stringify(loadRules(), null, 2))}</textarea>
            <div class="btn-row" style="margin-top:12px;">
              <button type="button" class="btn primary" id="saveRules">Сохранить конфигурацию</button>
              <button type="button" class="btn secondary" id="resetRules">Сбросить конфигурацию</button>
            </div>
          </div>
        </section>

        <div class="sticky-actions">
          <div class="btn-row">
            <button type="button" class="btn primary" id="submitBtn">Назначить терапию</button>
            <button type="button" class="btn secondary" id="resetAll">Сбросить форму</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const bindInput = (id, pathFn) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const next = getState();
      pathFn(next, el.value);
      setState(next);
      rerender();
    });
    el.addEventListener('change', () => {
      const next = getState();
      pathFn(next, el.value);
      setState(next);
      rerender();
    });
  };

  bindInput('age', (s, v) => { s.patient.age = v; });
  bindInput('sex', (s, v) => { s.patient.sex = v; });
  bindInput('sbp', (s, v) => { s.patient.sbp = v; });
  bindInput('dbp', (s, v) => { s.patient.dbp = v; });
  bindInput('stageModeSelect', (s, v) => { s.diagnosis.stageMode = v; if (v !== 'manual') s.diagnosis.stageManual = ''; });
  bindInput('stageManualSelect', (s, v) => { s.diagnosis.stageManual = v; });
  bindInput('riskModeSelect', (s, v) => { s.diagnosis.riskMode = v; if (v !== 'manual') s.diagnosis.riskManual = ''; });
  bindInput('riskManualSelect', (s, v) => { s.diagnosis.riskManual = v; });
  bindInput('stageCkdStage', (s, v) => { s.diagnosis.stageFactors.ckdStage = v; });
  bindInput('score2Value', (s, v) => { s.diagnosis.score2Value = v; });
  bindInput('diabetesType', (s, v) => { s.diagnosis.clinicalRisk.diabetesType = v; });
  bindInput('diabetesDuration', (s, v) => { s.diagnosis.clinicalRisk.diabetesDuration = v; });
  bindInput('ckdSeverity', (s, v) => { s.diagnosis.clinicalRisk.ckdSeverity = v; });
  bindInput('additionalCkdSubtype', (s, v) => { s.additional.conditions.ckdSubtype = v; });
  bindInput('ihdSubtype', (s, v) => { s.additional.conditions.ihdSubtype = v; });
  bindInput('heartFailureSubtype', (s, v) => { s.additional.conditions.heartFailureSubtype = v; });
  bindInput('afSubtype', (s, v) => { s.additional.conditions.afSubtype = v; });
  bindInput('cancerSubtype', (s, v) => { s.additional.meds.cancerSubtype = v; });
  bindInput('targetAchieved', (s, v) => { s.therapyStatus.targetAchieved = v === 'true'; });

  document.querySelectorAll('[data-riskcalc]').forEach((btn) => btn.addEventListener('click', () => {
    const next = getState();
    next.diagnosis.riskCalcMode = btn.dataset.riskcalc;
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-stage-risk-factor]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.stageRiskFactor;
    if (autoFactors.includes(label)) return;
    const next = getState();
    const arr = next.diagnosis.stageFactors.riskFactors;
    next.diagnosis.stageFactors.riskFactors = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-organ]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.organ;
    const next = getState();
    const arr = next.diagnosis.stageFactors.organDamage;
    next.diagnosis.stageFactors.organDamage = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-clinical]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.clinical;
    const next = getState();
    const arr = next.diagnosis.stageFactors.clinicalStates;
    next.diagnosis.stageFactors.clinicalStates = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-clinrisk-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.clinriskToggle;
    const next = getState();
    const m = {
      diabetes: 'diabetes',
      ckd: 'ckd',
      fh: 'familialHypercholesterolemia',
      ascvd: 'documentedAscvd',
      imaging: 'imagingAscvd',
      extreme: 'extremeAscvd',
    };
    next.diagnosis.clinicalRisk[m[key]] = !next.diagnosis.clinicalRisk[m[key]];
    setState(next);
    rerender();
  }));

  const diabetesTomBtn = document.getElementById('diabetesTomBtn');
  if (diabetesTomBtn) diabetesTomBtn.addEventListener('click', () => {
    const next = getState();
    next.diagnosis.clinicalRisk.diabetesTom = !next.diagnosis.clinicalRisk.diabetesTom;
    setState(next);
    rerender();
  });

  document.querySelectorAll('[data-marked-risk]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.markedRisk;
    const next = getState();
    const arr = next.diagnosis.clinicalRisk.markedRiskFactors;
    next.diagnosis.clinicalRisk.markedRiskFactors = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-cond]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.cond;
    const next = getState();
    const arr = next.additional.conditions.selected;
    next.additional.conditions.selected = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    if (!next.additional.conditions.selected.includes('ХБП')) next.additional.conditions.ckdSubtype = '';
    if (!next.additional.conditions.selected.includes('ИБС')) next.additional.conditions.ihdSubtype = '';
    if (!next.additional.conditions.selected.includes('ГЛЖ и СН')) next.additional.conditions.heartFailureSubtype = '';
    if (!next.additional.conditions.selected.includes('ФП и другие аритмии')) next.additional.conditions.afSubtype = '';
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-med]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.med;
    const next = getState();
    const arr = next.additional.meds.selected;
    next.additional.meds.selected = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    if (!next.additional.meds.selected.includes('Противоопухолевая терапия')) next.additional.meds.cancerSubtype = '';
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-frailty]').forEach((btn) => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.frailty);
    const next = getState();
    next.additional.other.frailtyAnswers[index] = !next.additional.other.frailtyAnswers[index];
    setState(next);
    rerender();
  }));

  const toggleFrailty = document.getElementById('toggleFrailty');
  if (toggleFrailty) toggleFrailty.addEventListener('click', () => {
    const next = getState();
    next.additional.other.frailtyOpen = !next.additional.other.frailtyOpen;
    setState(next);
    rerender();
  });

  const calcFrailty = document.getElementById('calcFrailty');
  if (calcFrailty) calcFrailty.addEventListener('click', () => {
    const next = getState();
    next.additional.other.frailtyCalculated = true;
    setState(next);
    rerender();
  });

  const resetFrailty = document.getElementById('resetFrailty');
  if (resetFrailty) resetFrailty.addEventListener('click', () => {
    const next = getState();
    next.additional.other.frailtyAnswers = [false, false, false, false, false, false, false];
    next.additional.other.frailtyCalculated = false;
    next.additional.other.frailtyOpen = false;
    setState(next);
    rerender();
  });

  const toggleCha = document.getElementById('toggleCha');
  if (toggleCha) toggleCha.addEventListener('click', () => {
    const next = getState();
    next.additional.other.chaOpen = !next.additional.other.chaOpen;
    setState(next);
    rerender();
  });

  document.querySelectorAll('[data-cha]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.cha;
    const next = getState();
    next.additional.other.chaAnswers[key] = !next.additional.other.chaAnswers[key];
    setState(next);
    rerender();
  }));

  const calcCha = document.getElementById('calcCha');
  if (calcCha) calcCha.addEventListener('click', () => {
    const next = getState();
    next.additional.other.chaCalculated = true;
    setState(next);
    rerender();
  });

  const resetCha = document.getElementById('resetCha');
  if (resetCha) resetCha.addEventListener('click', () => {
    const next = getState();
    next.additional.other.chaAnswers.strokeHistory = false;
    next.additional.other.chaAnswers.hypertension = true;
    next.additional.other.chaAnswers.diabetes = false;
    next.additional.other.chaAnswers.chf = false;
    next.additional.other.chaAnswers.vascular = false;
    next.additional.other.chaCalculated = false;
    next.additional.other.chaOpen = false;
    setState(next);
    rerender();
  });

  document.querySelectorAll('[data-therapy-mode]').forEach((btn) => btn.addEventListener('click', () => {
    const next = getState();
    next.therapyStatus.mode = btn.dataset.therapyMode;
    setState(next);
    rerender();
  }));

  document.querySelectorAll('[data-current-class]').forEach((btn) => btn.addEventListener('click', () => {
    const label = btn.dataset.currentClass;
    const next = getState();
    const arr = next.therapyStatus.currentClasses;
    next.therapyStatus.currentClasses = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    setState(next);
    rerender();
  }));

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', () => {
    const now = validateState(getState());
    if (!now.canProceed) {
      alert('Форма содержит критические ошибки. Исправьте их перед переходом на страницу рекомендаций.');
      rerender();
      return;
    }
    window.location.hash = '#result';
  });

  const resetAll = document.getElementById('resetAll');
  resetAll.addEventListener('click', () => {
    resetState();
    rerender();
  });

  document.addEventListener('keydown', onRuleShortcut);
  function onRuleShortcut(e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
      const next = getState();
      next.ui.showRuleEditor = !next.ui.showRuleEditor;
      setState(next);
      rerender();
    }
  }

  const saveRules = document.getElementById('saveRules');
  if (saveRules) saveRules.addEventListener('click', () => {
    const val = document.getElementById('ruleEditor').value;
    try {
      JSON.parse(val);
      saveRulesOverride(val);
      alert('Конфигурация правил сохранена.');
    } catch {
      alert('JSON-конфигурация содержит ошибку.');
    }
  });
  const resetRulesBtn = document.getElementById('resetRules');
  if (resetRulesBtn) resetRulesBtn.addEventListener('click', () => {
    resetRulesOverride();
    alert('Конфигурация правил сброшена.');
    rerender();
  });
}
