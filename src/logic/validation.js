
import { calculateBpDegree, score2Image } from './calculators.js';

export function validateState(state) {
  const errors = [];
  const warnings = [];

  const age = Number(state.patient.age);
  const sbp = Number(state.patient.sbp);
  const dbp = Number(state.patient.dbp);

  if (!Number.isFinite(age) || age <= 0 || age > 120) {
    errors.push('Ошибка: возраст должен быть указан числом от 1 до 120 лет.');
  }
  if (!Number.isFinite(sbp) || sbp <= 0) {
    errors.push('Ошибка: САД должен быть указан положительным числом.');
  }
  if (!Number.isFinite(dbp) || dbp <= 0) {
    errors.push('Ошибка: ДАД должен быть указан положительным числом.');
  }
  if (Number.isFinite(sbp) && Number.isFinite(dbp) && dbp > sbp) {
    errors.push('Ошибка: диастолическое давление не может быть выше систолического.');
  }

  if (state.diagnosis.riskMode === 'determine' && state.diagnosis.riskCalcMode === 'score2') {
    const score = state.diagnosis.score2Value;
    if (age < 40) {
      warnings.push('Предупреждение: интерпретация SCORE2 в этом интерфейсе не применяется для возраста младше 40 лет.');
    } else if (score === '' || score === null || score === undefined) {
      warnings.push('Для расчёта риска по SCORE2 введите числовое значение.');
    } else if (Number(score) < 0) {
      errors.push('Ошибка: SCORE2 не может быть отрицательным.');
    }
  }

  if (state.diagnosis.riskMode === 'determine' && state.diagnosis.riskCalcMode === 'clinical') {
    if (state.diagnosis.clinicalRisk.diabetes && Number(state.diagnosis.clinicalRisk.diabetesDuration) < 0) {
      errors.push('Ошибка: стаж сахарного диабета не может быть отрицательным.');
    }
  }

   if (age > 50 && selectedConditions.includes('Беременность')) {
    errors.push('Ошибка: беременность не должна быть выбрана у пациентки старше 50 лет.');
  }

  if (
    selectedConditions.includes('Беременность') &&
    (
      selectedMeds.includes('КОК') ||
      selectedMeds.includes('Менопаузальная гормональная терапия')
    )
  ) {
    errors.push('Ошибка: при выбранной беременности нельзя указывать КОК или менопаузальную гормональную терапию.');
  }

  if (
    selectedMeds.includes('КОК') &&
    selectedMeds.includes('Менопаузальная гормональная терапия')
  ) {
    errors.push('Ошибка: нельзя одновременно выбрать КОК и менопаузальную гормональную терапию.');
  }

  if (state.patient.sex === 'male' && state.additional.conditions.selected.includes('Беременность')) {
    errors.push('Ошибка: беременность недоступна для выбранного пола.');
  }

  if (state.patient.sex === 'male') {
    if (state.additional.meds.selected.includes('КОК') || state.additional.meds.selected.includes('Менопаузальная гормональная терапия')) {
      errors.push('Ошибка: КОК и менопаузальная гормональная терапия доступны только для женщин.');
    }
  }

  if (!state.additional.conditions.selected.includes('ХБП') && state.additional.conditions.ckdSubtype) {
    warnings.push('Уточните раздел ХБП: выбран подтип ХБП без основной отметки состояния.');
  }
  if (state.additional.conditions.selected.includes('ХБП') && !state.additional.conditions.ckdSubtype) {
    errors.push('Уточните стадию ХБП для корректного выбора терапии.');
  }
  if (state.additional.conditions.selected.includes('ИБС') && !state.additional.conditions.ihdSubtype) {
    errors.push('Уточните вариант ИБС: стенокардия есть или отсутствует.');
  }
  if (state.additional.conditions.selected.includes('ФП и другие аритмии') && !state.additional.conditions.afSubtype) {
    errors.push('Уточните вариант ФП/аритмии: ЧСС ≥80 или <80.');
  }
  if (state.additional.conditions.selected.includes('ГЛЖ и СН') && !state.additional.conditions.heartFailureSubtype) {
    warnings.push('Уточните подтип ХСН для более точных рекомендаций.');
  }
  if (state.additional.meds.selected.includes('Противоопухолевая терапия') && !state.additional.meds.cancerSubtype) {
    errors.push('Уточните статус противоопухолевой терапии: терапия ещё не начата или терапия проводится.');
  }

  if (age < 60 && state.additional.other.frailtyOpen) {
    warnings.push('Блок расчёта старческой астении обычно применяется у пациентов 60 лет и старше.');
  }

  if (state.diagnosis.stageMode !== 'determine' && state.diagnosis.stageManual === '') {
    errors.push('Ошибка: выберите стадию АГ вручную.');
  }
  if (state.diagnosis.riskMode !== 'determine' && state.diagnosis.riskManual === '') {
    errors.push('Ошибка: выберите сердечно-сосудистый риск вручную.');
  }

  if (state.therapyStatus.mode === 'correction' && !state.therapyStatus.currentClasses.length) {
    warnings.push('Предупреждение: для режима коррекции желательно указать уже принимаемые классы препаратов.');
  }

  const pregnancyCrisis =
    state.additional.conditions.selected.includes('Беременность') &&
    ((Number.isFinite(sbp) && sbp >= 160) || (Number.isFinite(dbp) && dbp >= 110));

  if (pregnancyCrisis) {
    warnings.push('Рекомендуется срочно госпитализировать пациентку и расценивать состояние как гипертонический криз.');
  }

  const cancerNotStarted = state.additional.meds.selected.includes('Противоопухолевая терапия') &&
    state.additional.meds.cancerSubtype === 'not-started' &&
    ((Number.isFinite(sbp) && sbp >= 180) || (Number.isFinite(dbp) && dbp >= 110));

  if (cancerNotStarted) {
    warnings.push('Начинать противоопухолевую терапию не рекомендуется до стабилизации АД.');
  }

  return {
    errors,
    warnings,
    degreePreview: calculateBpDegree(state.patient),
    score2Image: score2Image(age),
    canProceed: errors.length === 0,
  };
}
