
import { loadRules } from '../config/rules.js';
import { ageGroupLabel, unique } from '../utils/helpers.js';

const rules = () => loadRules();

export function deriveAutoStageRiskFactors(patient) {
  const auto = [];
  if (patient.sex === 'male') auto.push('Пол');
  const age = Number(patient.age);
  if ((patient.sex === 'male' && age > 55) || (patient.sex === 'female' && age > 65)) auto.push('Возраст');
  return auto;
}

export function calculateBpDegree({ sbp, dbp }) {
  const s = Number(sbp);
  const d = Number(dbp);
  if (!Number.isFinite(s) || !Number.isFinite(d)) return '';
  if (s >= 140 && d < 90) return 'изолированная систолическая гипертензия';
  if (s < 140 && d >= 90) return 'изолированная диастолическая гипертензия';

  const sbpDegree =
    s < 120 ? 'оптимальное' :
    s <= 129 ? 'нормальное' :
    s <= 139 ? 'высокое нормальное' :
    s <= 159 ? '1-я степень' :
    s <= 179 ? '2-я степень' : '3 степень';

  const dbpDegree =
    d < 80 ? 'оптимальное' :
    d <= 84 ? 'нормальное' :
    d <= 89 ? 'высокое нормальное' :
    d <= 99 ? '1-я степень' :
    d <= 109 ? '2-я степень' : '3 степень';

  const order = rules().bpDegreeOrder;
  return order[Math.max(order.indexOf(sbpDegree), order.indexOf(dbpDegree))] || '';
}

export function calculateStage(patient, diagnosis) {
  if (diagnosis.stageMode !== 'determine') return diagnosis.stageManual || '';
  const organSelected = diagnosis.stageFactors.organDamage.filter(Boolean);
  const clinicalSelected = diagnosis.stageFactors.clinicalStates.filter(Boolean);
  const ckdStage = diagnosis.stageFactors.ckdStage;

  if (clinicalSelected.length || ckdStage === 'C4' || ckdStage === 'C5') return 'стадия III';

  if (
    organSelected.length ||
    diagnosis.stageFactors.organDamage.includes('Сахарный диабет') ||
    (ckdStage && ckdStage !== 'absent')
  ) {
    return 'стадия II';
  }

  return 'стадия I';
}

export function calculateRiskFromScore2(age, score) {
  const a = Number(age);
  const s = Number(score);
  if (!Number.isFinite(a) || !Number.isFinite(s)) return '';
  if (s < 1) return 'низкий';
  if ((a < 50 && s < 2.5) || (a >= 50 && a <= 69 && s < 5) || (a >= 70 && s < 7.5)) return 'умеренный';
  if ((a < 50 && s >= 7.5) || (a >= 50 && a <= 69 && s >= 10) || (a >= 70 && s >= 15)) return 'высокий';
  return 'высокий';
}

export function calculateRiskClinical(state) {
  const age = Number(state.patient.age);
  const c = state.diagnosis.clinicalRisk;
  const hasMarked = c.markedRiskFactors.length > 0;
  const moreThan3 = c.markedRiskFactors.includes('Сочетание более 3 факторов риска');

  if (
    c.extremeAscvd &&
    (c.diabetes || c.familialHypercholesterolemia || c.documentedAscvd)
  ) return 'экстремальный';

  if (
    c.documentedAscvd ||
    c.imagingAscvd ||
    (c.diabetes && (c.diabetesTom || moreThan3 || (c.diabetesType === '1 тип' && Number(c.diabetesDuration) > 20))) ||
    (c.ckd && c.ckdSeverity === 'severe')
  ) return 'очень высокий';

  if (
    hasMarked ||
    c.familialHypercholesterolemia ||
    (c.diabetes && (!c.diabetesTom && (Number(c.diabetesDuration) >= 10 || hasMarked))) ||
    (c.ckd && c.ckdSeverity === 'moderate')
  ) return 'высокий';

  if (
    c.diabetes &&
    (
      (c.diabetesType === '1 тип' && age < 35) ||
      (c.diabetesType === '2 тип' && age < 50)
    ) &&
    Number(c.diabetesDuration) < 10 &&
    !c.diabetesTom &&
    !hasMarked
  ) return 'умеренный';

  return '';
}

export function calculateRisk(state) {
  if (state.diagnosis.riskMode !== 'determine') return state.diagnosis.riskManual || '';
  if (state.diagnosis.riskCalcMode === 'score2') {
    return calculateRiskFromScore2(state.patient.age, state.diagnosis.score2Value);
  }
  return calculateRiskClinical(state);
}

export function calculateFrailty(other) {
  const score = (other.frailtyAnswers || []).filter(Boolean).length;
  let label = '';
  if (score <= 2) label = 'нет старческой астении';
  else if (score <= 4) label = 'вероятная преастения';
  else label = 'вероятная старческая астения, требуется приём врача-гериатра';
  return { score, label };
}

export function syncChaAutoFields(state) {
  const age = Number(state.patient.age);
  state.additional.other.chaAnswers.age75 = age >= 75;
  state.additional.other.chaAnswers.age65_74 = age >= 65 && age <= 74;
  state.additional.other.chaAnswers.female = state.patient.sex === 'female';
  return state;
}

export function calculateCha2Vasc(state) {
  const answers = state.additional.other.chaAnswers;
  const points =
    (answers.strokeHistory ? 2 : 0) +
    (answers.age75 ? 2 : 0) +
    (answers.hypertension ? 1 : 0) +
    (answers.diabetes ? 1 : 0) +
    (answers.chf ? 1 : 0) +
    (answers.vascular ? 1 : 0) +
    (answers.age65_74 ? 1 : 0) +
    (answers.female ? 1 : 0);

  const risk = rules().cha2vascStrokeRisk[points] ?? 'не указано';
  return { points, annualStrokeRisk: risk };
}

export function getTargetBp(age) {
  const a = Number(age);
  if (a >= 65) return rules().targetBp.older;
  return rules().targetBp.younger;
}

export function getDiagnosisLabel(bpDegree, stage, risk) {
  if (bpDegree === 'нормальное' || bpDegree === 'высокое нормальное' || bpDegree === 'оптимальное') {
    const readable =
      bpDegree === 'нормальное' ? 'значения артериального давления соответствуют нормальным значениям' :
      bpDegree === 'высокое нормальное' ? 'значения артериального давления соответствуют повышенным нормальным значениям' :
      'значения артериального давления соответствуют оптимальным значениям';
    return `${readable}, ${stage}, риск ${risk}`;
  }
  return `артериальная гипертензия ${bpDegree}, ${stage}, риск ${risk}`;
}

export function getDoseBaseByAgeOrFrailty(state) {
  const age = Number(state.patient.age);
  const frailty = calculateFrailty(state.additional.other);
  if ((state.additional.other.frailtyCalculated && frailty.score >= 5) || age > 65) return 'minimal';
  return null;
}

export function normalizeClassesFromPlan(text = '') {
  const mapping = [
    'ИАПФ', 'БРА', 'БКК', 'дигидропиридиновые БКК', 'ДИУРЕТИКИ', 'Т/ТП диуретик',
    'Т/ТП диуретики', 'петлевой диуретик', 'петлевые диуретики', 'ББ', 'АРНИ', 'АМКР', 'АИР', 'ААБ'
  ];
  return unique(mapping.filter((m) => text.includes(m)));
}

export function estimateCurrentTherapyStep(state, scenarioKey) {
  const classes = state.therapyStatus.currentClasses;
  if (!classes.length) return 1;
  if (classes.length >= 4) return 3;
  if (classes.length === 3) return 2;
  if (classes.length === 2) return 1;
  if (scenarioKey === 'standard' && classes.length === 1) return 0;
  return 1;
}

export function score2Image(age) {
  const a = Number(age);
  if (!Number.isFinite(a)) return '';
  if (a >= 70) return './assets/score2-70-plus.svg';
  if (a >= 40) return './assets/score2-40-69.svg';
  return '';
}

export function getScenarioBaseFlags(state) {
  const selected = state.additional.conditions.selected;
  const meds = state.additional.meds.selected;
  return {
    hasPregnancy: selected.includes('Беременность'),
    hasCkd: selected.includes('ХБП'),
    hasIhd: selected.includes('ИБС'),
    hasAf: selected.includes('ФП и другие аритмии'),
    hasOncology: meds.includes('Противоопухолевая терапия'),
  };
}
