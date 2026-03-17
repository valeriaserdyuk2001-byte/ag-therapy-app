
import { calculateBpDegree, calculateStage, calculateRisk } from './calculators.js';
import { scenarioLabelMap, doseLabelMap } from '../utils/helpers.js';

export function buildExplanation(state, result) {
  const lines = [];
  const sbp = Number(state.patient.sbp);
  const dbp = Number(state.patient.dbp);
  const age = Number(state.patient.age);

  lines.push(`На выбор повлияли исходные данные пациента: возраст ${age || 'не указан'} лет, пол ${state.patient.sex === 'female' ? 'женский' : state.patient.sex === 'male' ? 'мужской' : 'не указан'}, АД ${sbp || '—'}/${dbp || '—'} мм рт. ст.`);

  if (result.bpDegree) {
    lines.push(`Определена ${result.bpDegree}, потому что САД ${sbp} мм рт. ст. и ДАД ${dbp} мм рт. ст. соответствуют этому диапазону правил.`);
  } else {
    lines.push('Степень АГ не определена автоматически, потому что числовых данных недостаточно.');
  }

  if (state.diagnosis.stageMode === 'determine') {
    const hasClinical = state.diagnosis.stageFactors.clinicalStates.length > 0 || ['C4', 'C5'].includes(state.diagnosis.stageFactors.ckdStage);
    const hasOrgan = state.diagnosis.stageFactors.organDamage.length > 0 || state.diagnosis.stageFactors.ckdStage !== 'absent';
    if (hasClinical) {
      lines.push('Определена стадия III, потому что отмечены ассоциированные клинические состояния и/или ХБП C4–C5.');
    } else if (hasOrgan) {
      lines.push('Определена стадия II, потому что есть сахарный диабет, ХБП C1–C3 и/или признаки поражения органов-мишеней без ассоциированных клинических состояний.');
    } else {
      lines.push('Определена стадия I, потому что ассоциированные клинические состояния и поражение органов-мишеней не отмечены.');
    }
  } else {
    lines.push(`Стадия взята вручную: ${result.stage}.`);
  }

  if (state.diagnosis.riskMode === 'determine') {
    if (state.diagnosis.riskCalcMode === 'score2') {
      lines.push(`Риск определён по SCORE2: введено значение ${state.diagnosis.score2Value || 'не указано'}, итог — ${result.risk || 'не определён'}.`);
    } else {
      lines.push(`Риск определён клинически: итог — ${result.risk || 'не определён'}, на основании отмеченных состояний из блока клинического расчёта.`);
    }
  } else {
    lines.push(`Риск взят вручную: ${result.risk}.`);
  }

  lines.push(`Выбран клинический сценарий «${result.scenarioLabel}», потому что ${result.scenario.reason}.`);

  if (result.noDrugTherapy) {
    lines.push('Медикаментозная терапия не рекомендована, потому что текущие значения АД соответствуют оптимальному / нормальному / высокому нормальному диапазону.');
  } else {
    if (result.therapyType === 'старт терапии') {
      lines.push(`Выбран ${result.stepLabel || 'стартовый шаг'} терапии, потому что указан режим старта терапии.`);
    } else if (state.therapyStatus.targetAchieved) {
      lines.push(`Сохранён текущий шаг терапии (${result.stepLabel || 'текущий шаг'}), потому что в режиме коррекции отмечено достижение целевого АД.`);
    } else {
      lines.push(`Выбран ${result.stepLabel || 'следующий шаг'} терапии, потому что в режиме коррекции целевой уровень АД не достигнут и система повысила шаг лечения.`);
    }

    const doseReason = result.stepIndex === 0
      ? 'минимальная доза выбрана для щадящего старта при небольшом превышении целевого АД / низком риске / очень пожилом возрасте / старческой астении'
      : result.mainTherapy.includes('минимальной дозе')
      ? 'минимальная доза выбрана, потому что пациент старше 65 лет и/или есть признаки старческой астении'
      : result.mainTherapy.includes('максимальной дозе')
      ? 'максимальная доза выбрана, потому что это более поздний шаг интенсификации терапии'
      : 'оптимальная доза выбрана как базовая стартовая тактика для этого сценария';
    lines.push(`${doseReason.charAt(0).toUpperCase()}${doseReason.slice(1)}.`);

    if (result.excludedClasses.length) {
      result.excludedClasses.forEach((cls) => {
        const reason =
          cls === 'ББ' ? 'отмечена бронхиальная астма и/или ХОБЛ' :
          ['АИР', 'ААБ'].includes(cls) ? 'выбран подтип ХСНнФВ' :
          'сработало дополнительное правило исключения';
        lines.push(`Класс ${cls} исключён из рекомендаций, потому что ${reason}.`);
      });
    } else {
      lines.push('Исключающие правила для классов препаратов не сработали.');
    }
  }

  if (result.recommendations.length) {
    result.recommendations.forEach((item) => {
      lines.push(`Добавлена дополнительная рекомендация: ${item}`);
    });
  } else {
    lines.push('Дополнительные рекомендации не потребовались, кроме стандартного контроля АД и поэтапной титрации терапии.');
  }

  if (result.warnings.length) {
    result.warnings.forEach((item) => lines.push(`Добавлено предупреждение: ${item}`));
  } else {
    lines.push('Критических предупреждений по введённым данным не выявлено.');
  }

  if (result.additionalTherapy.length) {
    result.additionalTherapy.forEach((item) => lines.push(`Добавлена сопутствующая терапия/цель: ${item}`));
  }

  return lines;
}
