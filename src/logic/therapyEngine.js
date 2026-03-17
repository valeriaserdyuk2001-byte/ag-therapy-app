
import { loadRules } from '../config/rules.js';
import { pickDrugExamples } from '../config/drugCatalog.js';
import {
  calculateBpDegree,
  calculateStage,
  calculateRisk,
  calculateFrailty,
  calculateCha2Vasc,
  getTargetBp,
  getDoseBaseByAgeOrFrailty,
  estimateCurrentTherapyStep,
  normalizeClassesFromPlan,
  getScenarioBaseFlags,
} from './calculators.js';
import { joinHuman, scenarioLabelMap, doseLabelMap, unique } from '../utils/helpers.js';

const rules = () => loadRules();

function classifyScenario(state) {
  const flags = getScenarioBaseFlags(state);
  if (flags.hasPregnancy) return { key: 'pregnancy', configKey: 'pregnancy', label: scenarioLabelMap.pregnancy, reason: 'выбрана беременность в дополнительной информации' };
  if (flags.hasOncology) return { key: 'oncology', configKey: 'oncology', label: scenarioLabelMap.oncology, reason: 'отмечена противоопухолевая терапия' };
  if (flags.hasCkd) {
    const late = state.additional.conditions.ckdSubtype === 'late';
    return {
      key: 'ckd',
      configKey: late ? 'ckdLate' : 'ckdEarly',
      label: scenarioLabelMap.ckd,
      reason: late ? 'указана ХБП С4–5 / СКФ <30' : 'указана ХБП С1–3 / СКФ ≥30',
    };
  }
  if (flags.hasIhd) {
    const angina = state.additional.conditions.ihdSubtype === 'angina-yes';
    return {
      key: 'ihd',
      configKey: angina ? 'ihdAngina' : 'ihdNoAngina',
      label: scenarioLabelMap.ihd,
      reason: angina ? 'указана ИБС со стенокардией' : 'указана ИБС без стенокардии',
    };
  }
  if (flags.hasAf) {
    const fast = state.additional.conditions.afSubtype === 'hr-80-plus';
    return {
      key: 'af',
      configKey: fast ? 'afFast' : 'afSlow',
      label: scenarioLabelMap.af,
      reason: fast ? 'указана ФП/аритмия с ЧСС ≥80' : 'указана ФП/аритмия с ЧСС <80',
    };
  }
  return { key: 'standard', configKey: 'standard', label: scenarioLabelMap.standard, reason: 'нет признаков сценариев ХБП/ИБС/ФП/беременности/противоопухолевой терапии' };
}

function getExcludedClassesAndExtraAdvice(state) {
  const excluded = [];
  const recommendations = [];
  const warnings = [];
  const additionalTherapy = [];

  const selected = state.additional.conditions.selected;
  const meds = state.additional.meds.selected;
  const heartFailure = state.additional.conditions.heartFailureSubtype;

  if (heartFailure === 'hfrEF') {
    recommendations.push('Рекомендуется назначение иАПФ или АРНИ, ББ или АМКР для снижения риска смерти и госпитализации из-за СН.');
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточности эффективности АГТ.');
    recommendations.push('Не рекомендуется назначение дилтиазема и верапамила из-за отрицательного инотропного действия и риска ухудшения ХСН.');
    excluded.push('АИР', 'ААБ');
  }
  if (heartFailure === 'hfmrEF') {
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточной эффективности АГТ.');
    recommendations.push('Рекомендуется назначение диуретиков при признаках задержки жидкости для улучшения симптоматики ХСН.');
    recommendations.push('Рекомендуется рассмотреть возможность приёма АРНИ для снижения риска госпитализации и смерти из-за ХСН.');
    recommendations.push('Рекомендуется рассмотреть возможность приёма дапаглифлозина или эмпаглифлозина для снижения риска госпитализации из-за ХСН.');
  }
  if (heartFailure === 'hfPEF') {
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточной эффективности АГТ.');
    recommendations.push('Рекомендуется рассмотреть возможность приёма дапаглифлозина или эмпаглифлозина для снижения риска госпитализации из-за ХСН.');
    recommendations.push('Рекомендуется рассмотреть возможность приёма АРНИ для снижения риска госпитализации и смерти из-за ХСН.');
  }

  if (selected.includes('Бронхиальная астма и/или ХОБЛ')) {
    excluded.push('ББ');
    recommendations.push('Рекомендовано отдавать предпочтение БРА из-за кашля на иАПФ.');
    recommendations.push('Использовать диуретики с осторожностью из-за риска гипокалиемии на фоне β2-агонистов.');
  }

  if (selected.includes('Синдром обструктивного апноэ сна')) {
    recommendations.push('Рекомендовано снижение веса у пациентов с ожирением, отказ от курения, коррекция факторов, ухудшающих проходимость дыхательных путей.');
    recommendations.push('Рекомендована CPAP-терапия.');
  }

  if (meds.includes('КОК')) {
    recommendations.push('Провести оценку рисков и преимуществ приёма КОК, а также сопутствующих факторов сердечно-сосудистого риска для улучшения контроля АД.');
  }
  if (meds.includes('Менопаузальная гормональная терапия')) {
    recommendations.push('Приём менопаузальной гормональной терапии не противопоказан при условии контроля АД с помощью АГТ.');
  }
  if (
    meds.includes('Противоопухолевая терапия') &&
    state.additional.meds.cancerSubtype === 'not-started' &&
    (Number(state.patient.sbp) >= 180 || Number(state.patient.dbp) >= 110)
  ) {
    warnings.push('Начинать противоопухолевую терапию не рекомендуется до стабилизации АД.');
  }

  return { excluded: unique(excluded), recommendations: unique(recommendations), warnings, additionalTherapy };
}

function resolveDoseLevel(state, scenarioConfig, stepIndex, bpDegree, risk) {
  const age = Number(state.patient.age);
  const frailty = calculateFrailty(state.additional.other);
  const sbp = Number(state.patient.sbp);
  const dbp = Number(state.patient.dbp);
  const target = getTargetBp(age);

  const overTargetSbp = age >= 65 ? sbp - 139 : sbp - 129;
  const overTargetDbp = dbp - 79;
  const isSlightlyAboveTarget = overTargetSbp < 20 && overTargetDbp < 10;

  if (
    scenarioConfig.id === 'standard' &&
    stepIndex === 1 &&
    (
      (risk === 'низкий' && isSlightlyAboveTarget) ||
      age > 80 ||
      (state.additional.other.frailtyCalculated && frailty.score >= 5)
    )
  ) {
    return { doseLevel: 'minimal', specialStandardLowStart: true, target };
  }

  const ageFrailtyBase = getDoseBaseByAgeOrFrailty(state);
  if (ageFrailtyBase && stepIndex === 1) {
    return { doseLevel: 'minimal', specialStandardLowStart: false, target };
  }

  const stepConfig = scenarioConfig.steps[stepIndex] || scenarioConfig.steps[1];
  return {
    doseLevel: stepConfig?.primary?.doseLevel || 'optimal',
    specialStandardLowStart: false,
    target,
  };
}

function textToBaseClasses(planText = '') {
  const t = planText.toLowerCase();
  const arr = [];
  if (t.includes('иапф')) arr.push('ИАПФ');
  if (t.includes('бра')) arr.push('БРА');
  if (t.includes('бкк')) arr.push('БКК');
  if (t.includes('дигидропиридиновые бкк')) arr.push('БКК');
  if (t.includes('диуретик')) arr.push('ДИУРЕТИКИ');
  if (t.includes('т/тп')) arr.push('ДИУРЕТИКИ');
  if (t.includes('петлевой')) arr.push('ДИУРЕТИКИ');
  if (t.includes('бб')) arr.push('ББ');
  if (t.includes('арни')) arr.push('АРНИ');
  if (t.includes('амкр')) arr.push('АМКР');
  if (t.includes('аир')) arr.push('АИР');
  if (t.includes('ааб')) arr.push('ААБ');
  return unique(arr);
}

function getStepPlanText(stepVariant = {}) {
  return stepVariant.classPlan || stepVariant.textPlan || '';
}

export function buildTherapyRecommendation(state) {
  const bpDegree = calculateBpDegree(state.patient);
  const stage = calculateStage(state.patient, state.diagnosis);
  const risk = calculateRisk(state);
  const frailty = calculateFrailty(state.additional.other);
  const cha = calculateCha2Vasc(state);
  const targetBp = getTargetBp(state.patient.age);
  const scenario = classifyScenario(state);
  const scenarioConfig = rules().therapyScenarios[scenario.configKey];

  const baseAdvice = getExcludedClassesAndExtraAdvice(state);
  const excludedClasses = [...baseAdvice.excluded];

  let stepIndex = 1;
  if (state.therapyStatus.mode === 'correction' && !state.therapyStatus.targetAchieved) {
    const current = estimateCurrentTherapyStep(state, scenario.key);
    stepIndex = Math.min(current + 1, Math.max(...Object.keys(scenarioConfig.steps).map(Number)));
  } else if (state.therapyStatus.mode === 'correction' && state.therapyStatus.targetAchieved) {
    stepIndex = estimateCurrentTherapyStep(state, scenario.key);
  }

  if (bpDegree === 'нормальное' || bpDegree === 'высокое нормальное' || bpDegree === 'оптимальное') {
    return {
      bpDegree,
      stage,
      risk,
      frailty,
      cha,
      targetBp,
      scenario,
      therapyType: state.therapyStatus.mode === 'start' ? 'старт терапии' : 'корректировка терапии',
      currentClasses: state.therapyStatus.currentClasses,
      noDrugTherapy: true,
      scenarioLabel: scenario.label,
      stepIndex: null,
      stepLabel: '',
      mainTherapy: 'Показаний для медикаментозной терапии нет.',
      alternativeTherapy: '',
      alternativeExamples: [],
      examples: [],
      recommendations: baseAdvice.recommendations,
      warnings: baseAdvice.warnings,
      additionalTherapy: [rules().statinTargets[risk]].filter(Boolean),
      excludedClasses,
    };
  }

  const resolvedDose = resolveDoseLevel(state, scenarioConfig, stepIndex, bpDegree, risk);
  const stepConfig = scenarioConfig.steps[stepIndex] || scenarioConfig.steps[1];

  let mainTherapy = '';
  let alternativeTherapy = '';
  let examples = [];
  let alternativeExamples = [];

  if (resolvedDose.specialStandardLowStart) {
    mainTherapy = 'ИАПФ или БРА или диуретик или длительно действующий БКК или ББ в минимальной дозе.';
    examples = pickDrugExamples(
      ['ИАПФ', 'БРА', 'БКК', 'ДИУРЕТИКИ', 'ББ'].filter((c) => !excludedClasses.includes(c)),
      'minimal',
    );
    stepIndex = 0;
  } else {
    const primaryPlan = stepConfig?.primary || {};
    const alternativePlan = stepConfig?.alternative || null;

    const primaryText = getStepPlanText(primaryPlan);
    const primaryDose = primaryPlan?.doseLevel || resolvedDose.doseLevel || 'optimal';

    if (primaryPlan.textPlan) {
      mainTherapy = primaryText;
      examples = [];
    } else {
      mainTherapy = `${primaryText} в ${doseLabelMap[primaryDose] || primaryDose}.`;
      const baseClasses = textToBaseClasses(primaryText).filter((c) => !excludedClasses.includes(c));
      examples = pickDrugExamples(baseClasses, primaryDose);
    }

    if (alternativePlan) {
      const alternativeText = getStepPlanText(alternativePlan);
      const alternativeDose = alternativePlan?.doseLevel || 'optimal';

      if (alternativePlan.textPlan) {
        alternativeTherapy = alternativeText;
        alternativeExamples = [];
      } else {
        alternativeTherapy = `${alternativeText} в ${doseLabelMap[alternativeDose] || alternativeDose}.`;
        const altClasses = textToBaseClasses(alternativeText).filter((c) => !excludedClasses.includes(c));
        alternativeExamples = pickDrugExamples(altClasses, alternativeDose);
      }
    }
  }

  const additionalTherapy = [rules().statinTargets[risk]].filter(Boolean);

  if (
    state.additional.conditions.selected.includes('Эректильная дисфункция') &&
    !mainTherapy.includes('ААБ') &&
    !alternativeTherapy.includes('ААБ')
  ) {
    additionalTherapy.push('Рассмотреть ингибиторы фосфодиэстеразы-5.');
  }

  if (scenarioConfig.warning) {
    baseAdvice.warnings.push(scenarioConfig.warning);
  }
  if (stepConfig.warning) {
    baseAdvice.warnings.push(stepConfig.warning);
  }

  return {
    bpDegree,
    stage,
    risk,
    frailty,
    cha,
    targetBp,
    scenario,
    scenarioConfig,
    therapyType: state.therapyStatus.mode === 'start' ? 'старт терапии' : 'корректировка терапии',
    currentClasses: state.therapyStatus.currentClasses,
    noDrugTherapy: false,
    scenarioLabel: scenario.label,
    stepIndex,
    stepLabel: scenarioConfig.steps[stepIndex]?.label || stepConfig.label,
    mainTherapy,
    alternativeTherapy,
    examples,
    alternativeExamples,
    recommendations: unique(baseAdvice.recommendations),
    warnings: unique(baseAdvice.warnings),
    additionalTherapy: unique(additionalTherapy),
    excludedClasses: unique(excludedClasses),
    note: 'Каждый шаг терапии 2–4 недели для достижения целевого АД за 3 месяца.',
  };
}
