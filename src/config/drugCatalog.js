
export const DRUG_CATALOG = {
  'ИАПФ': [
    { inn: 'лизиноприл', minimal: '5 мг 1 р/д', optimal: '10 мг 1 р/д', maximal: '20 мг 1 р/д' },
    { inn: 'периндоприл', minimal: '1–2 мг 1 р/д', optimal: '2–4 мг 1 р/д', maximal: '8 мг 1 р/д' },
    { inn: 'рамиприл', minimal: '10 мг 2 р/д', optimal: '10 мг 3 р/д', maximal: '20 мг 3 р/д' },
    { inn: 'эналаприл', minimal: '2,5 мг 1–2 р/д', optimal: '10 мг 2 р/д', maximal: '20 мг 2 р/д' },
    { inn: 'фозиноприл', minimal: '2,5 мг 1 р/д', optimal: '5 мг 1 р/д', maximal: '10 мг 1 р/д' },
  ],
  'БРА': [
    { inn: 'лозартан', minimal: '25 мг 1–2 р/д', optimal: '25 мг 1–2 р/д', maximal: '50 мг 1–2 р/д' },
    { inn: 'телмисартан', minimal: '20 мг 1 р/д', optimal: '40 мг 1 р/д', maximal: '80 мг 1 р/д' },
    { inn: 'валсартан', minimal: '80 мг 1 р/д', optimal: '80 мг 2 р/д', maximal: '160 мг 2 р/д' },
    { inn: 'кандесартан', minimal: '8 мг 1 р/д', optimal: '16 мг 1 р/д', maximal: '32 мг 1 р/д' },
    { inn: 'азилсартан', minimal: '20 мг 1 р/д', optimal: '40 мг 1 р/д', maximal: '80 мг 1 р/д' },
  ],
  'БКК': [
    { inn: 'амлодипин', subclass: 'дигидропиридиновые', minimal: '2,5 мг 1 р/д', optimal: '5 мг 1 р/д', maximal: '10 мг 1 р/д' },
    { inn: 'лерканидипин', subclass: 'дигидропиридиновые', minimal: '5–10 мг 1 р/д', optimal: '10 мг 1 р/д', maximal: '20 мг 1 р/д' },
    { inn: 'нифедипин', subclass: 'дигидропиридиновые', minimal: '10 мг 2 р/д', optimal: '10 мг 3 р/д', maximal: '20 мг 3 р/д' },
    { inn: 'фелодипин', subclass: 'дигидропиридиновые', minimal: '5 мг 1 р/д', optimal: '10 мг 1 р/д', maximal: '20 мг 1 р/д' },
    { inn: 'верапамил', subclass: 'недигидропиридиновые', minimal: '—', optimal: '—', maximal: '—' },
    { inn: 'дилтиазем', subclass: 'недигидропиридиновые', minimal: '—', optimal: '—', maximal: '—' },
  ],
  'ДИУРЕТИКИ': [
    { inn: 'гидрохлоротиазид', subclass: 'Т/ТП', minimal: '12,5 мг 1 р/д', optimal: '25 мг 1 р/д', maximal: '50 мг 1 р/д' },
    { inn: 'индапамид', subclass: 'Т/ТП', minimal: '2,5 мг 1 р/д', optimal: '2,5 мг 1 р/д', maximal: '2,5 мг 1 р/д' },
    { inn: 'фуросемид', subclass: 'петлевые', minimal: '20 мг 1 р/д', optimal: '40 мг 1 р/д', maximal: '40 мг 4 р/д' },
    { inn: 'торасемид', subclass: 'петлевые', minimal: '5 мг 1 р/д', optimal: '10 мг 1 р/д', maximal: '100–200 мг 1 р/д' },
  ],
  'АМКР': [
    { inn: 'спиронолактон', minimal: '25 мг 1 р/д', optimal: '50 мг 1 р/д', maximal: '100 мг 3 р/д' },
    { inn: 'эплеренон', minimal: '25 мг 1 р/д', optimal: '50 мг 1 р/д', maximal: '50 мг 1 р/д' },
  ],
  'ББ': [
    { inn: 'соталол', minimal: '80 мг 2 р/д', optimal: '160 мг 2 р/д', maximal: '160 мг 3 р/д' },
    { inn: 'небиволол', minimal: '2,5 мг 1 р/д', optimal: '5 мг 1 р/д', maximal: '10 мг 1 р/д' },
    { inn: 'бисопролол', minimal: '2,5 мг 1 р/д', optimal: '5 мг 1 р/д', maximal: '10 мг 1 р/д' },
    { inn: 'метопролол', minimal: '12,5 мг 1–2 р/д', optimal: '25–50 мг 2–3 р/д', maximal: '100 мг 2 р/д' },
  ],
  'ААБ': [
    { inn: 'карведилол', minimal: '6,25 мг 2 р/д', optimal: '12,5–25 мг 2 р/д', maximal: '25 мг 2 р/д' },
  ],
};

export function pickDrugExamples(classList = [], doseLevel = 'optimal') {
  const result = [];
  classList.forEach((cls) => {
    const items = DRUG_CATALOG[cls];
    if (!items?.length) return;
    const choices = items.slice(0, 2).map((item) => `${item.inn} — ${item[doseLevel] || item.optimal || '—'}`);
    result.push(`${cls}: ${choices.join('; ')}`);
  });
  return result;
}
