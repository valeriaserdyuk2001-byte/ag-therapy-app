
export function buildConclusion(state, result) {
  const sexText = state.patient.sex === 'female' ? 'Пациентка' : 'Пациент';
  const parts = [];

  parts.push(`${sexText} ${state.patient.age || '—'} лет.`);
  if (state.patient.sbp || state.patient.dbp) {
    parts.push(`Уровень артериального давления ${state.patient.sbp || '—'}/${state.patient.dbp || '—'} мм рт. ст.`);
  }

  if (result.bpDegree === 'нормальное' || result.bpDegree === 'высокое нормальное' || result.bpDegree === 'оптимальное') {
    const text =
      result.bpDegree === 'нормальное' ? 'Показатели соответствуют нормальному артериальному давлению.' :
      result.bpDegree === 'высокое нормальное' ? 'Показатели соответствуют высокому нормальному артериальному давлению.' :
      'Показатели соответствуют оптимальному артериальному давлению.';
    parts.push(text);
  } else if (result.bpDegree) {
    parts.push(`Определена артериальная гипертензия: ${result.bpDegree}, ${result.stage}, сердечно-сосудистый риск ${result.risk}.`);
  } else {
    parts.push(`Стадия: ${result.stage || 'не указана'}, сердечно-сосудистый риск: ${result.risk || 'не указан'}.`);
  }

  if (result.targetBp?.sbp || result.targetBp?.dbp) {
    parts.push(`Целевой уровень АД: САД ${result.targetBp.sbp} мм рт. ст., ДАД ${result.targetBp.dbp} мм рт. ст.`);
  }

  parts.push(`Вид терапии: ${result.therapyType}.`);
  if (result.scenarioLabel) {
    parts.push(`Выбран клинический сценарий: ${result.scenarioLabel}.`);
  }
  if (result.mainTherapy) {
    parts.push(`Основная рекомендованная терапия: ${result.mainTherapy}`);
  }
  if (result.note) {
    parts.push(result.note);
  }
  if (result.warnings?.length) {
    parts.push(`Ключевые предупреждения: ${result.warnings.join(' ')}`);
  }
  if (result.recommendations?.length) {
    parts.push(`Дополнительные рекомендации: ${result.recommendations.join(' ')}`);
  }
  if (result.additionalTherapy?.length) {
    parts.push(`Дополнительная терапия: ${result.additionalTherapy.join(' ')}`);
  }

  return parts.filter(Boolean).join(' ');
}
