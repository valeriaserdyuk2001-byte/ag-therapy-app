
export const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const unique = (arr) => [...new Set((arr || []).filter(Boolean))];

export const hasAny = (arr) => (arr || []).some(Boolean);

export const titleCase = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const formatBp = (sbp, dbp) => {
  if (!sbp && !dbp) return '—';
  return `${sbp ?? '—'}/${dbp ?? '—'} мм рт. ст.`;
};

export const joinHuman = (items = []) => {
  const cleaned = items.filter(Boolean);
  if (!cleaned.length) return '';
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} и ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(', ')} и ${cleaned.at(-1)}`;
};

export const includesText = (arr = [], value = '') => arr.includes(value);

export const escapeHtml = (str = '') =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const scenarioLabelMap = {
  standard: 'Стандартное лечение АГ',
  ckd: 'Лечение АГ при ХБП',
  ihd: 'Лечение АГ при ИБС',
  af: 'Лечение АГ при ФП',
  pregnancy: 'Лечение АГ при беременности',
  oncology: 'Лечение АГ на фоне противоопухолевой терапии',
};

export const doseLabelMap = {
  minimal: 'минимальная доза',
  optimal: 'оптимальная доза',
  maximal: 'максимальная доза',
};

export const ageGroupLabel = (age) => {
  if (age == null) return '';
  if (age < 50) return '<50';
  if (age <= 69) return '50-69';
  return '70+';
};
