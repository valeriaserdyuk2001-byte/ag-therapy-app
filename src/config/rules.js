
export const DEFAULT_RULES = {
  riskLevels: ['низкий', 'умеренный', 'высокий', 'очень высокий', 'экстремальный'],
  stageLevels: ['стадия I', 'стадия II', 'стадия III'],
  bpDegreeOrder: [
    'оптимальное',
    'нормальное',
    'высокое нормальное',
    '1-я степень',
    '2-я степень',
    '3 степень',
  ],
  targetBp: {
    younger: {
      sbp: 'менее 130, но не менее 120',
      dbp: 'менее 80, но не ниже 70',
    },
    older: {
      sbp: '130–139 при переносимости',
      dbp: 'менее 80, но не ниже 70',
    },
  },
  cha2vascStrokeRisk: {
    0: '0',
    1: '1,3',
    2: '2,2',
    3: '3,2',
    4: '4,0',
    5: '6,7',
    6: '9,8',
    7: '9,6',
    8: '6,7',
    9: '15,2',
  },
  statinTargets: {
    'низкий': 'назначение статинов для достижения целевого ХС ЛПНП 3,0 ммоль/л и менее',
    'умеренный': 'назначение статинов для достижения целевого ХС ЛПНП 2,6 ммоль/л и менее',
    'высокий': 'назначение статинов для достижения целевого ХС ЛПНП 1,8 ммоль/л и менее или его снижение на 50% и более от исходного',
    'очень высокий': 'назначение статинов для достижения целевого ХС ЛПНП 1,4 ммоль/л и менее',
    'экстремальный': 'назначение статинов для достижения целевого ХС ЛПНП 1,0 ммоль/л и менее или его снижение на 50% и более от исходного',
  },
  therapyScenarios: {
    standard: {
      id: 'standard',
      label: 'Стандартное лечение АГ',
      steps: {
        0: {
          label: 'Щадящий старт',
          primary: {
            classPlan: 'ИАПФ или БРА или диуретик или длительно действующий БКК или ББ',
            doseLevel: 'minimal',
          },
          note: 'Для низкого риска / небольшого превышения целевого АД / очень пожилых / при старческой астении.',
        },
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК или диуретик',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК + диуретик',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК + диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + диуретик + БКК + АМКР или ББ или АИР или ААБ',
            doseLevel: 'optimal',
          },
        },
      },
    },

    ckdEarly: {
      id: 'ckdEarly',
      label: 'Лечение АГ при ХБП',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК или Т/ТП диуретик',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК или Т/ТП диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + БКК + Т/ТП диуретик',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК + Т/ТП диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + БКК + Т/ТП диуретик + АМКР или ББ или ААБ или АИР',
            doseLevel: 'optimal',
          },
        },
      },
    },

    ckdLate: {
      id: 'ckdLate',
      label: 'Лечение АГ при ХБП',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК или петлевой диуретик',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК или петлевой диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + БКК + петлевой диуретик',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + БКК + петлевой диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + БКК + петлевой диуретик + Т/ТП диуретик или ББ или ААБ или АИР',
            doseLevel: 'optimal',
          },
        },
      },
    },

    ihdAngina: {
      id: 'ihdAngina',
      label: 'Лечение АГ при ИБС',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК + АМКР или диуретик или ААБ или АИР',
            doseLevel: 'optimal',
          },
        },
      },
    },

    ihdNoAngina: {
      id: 'ihdNoAngina',
      label: 'Лечение АГ при ИБС',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретики',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретики',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретики + АМКР или диуретик или ААБ или АИР',
            doseLevel: 'optimal',
          },
        },
      },
    },

    afFast: {
      id: 'afFast',
      label: 'Лечение АГ при ФП',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретики',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК + Т/ТП диуретики',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК + Т/ТП диуретики + АМКР или диуретик или ААБ или АИР',
            doseLevel: 'optimal',
          },
        },
      },
    },

    afSlow: {
      id: 'afSlow',
      label: 'Лечение АГ при ФП',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК или Т/ТП диуретик',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК или Т/ТП диуретик',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК + Т/ТП диуретики',
            doseLevel: 'optimal',
          },
        },
        3: {
          label: '3 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК + Т/ТП диуретики',
            doseLevel: 'maximal',
          },
        },
      },
    },

    pregnancy: {
      id: 'pregnancy',
      label: 'Лечение АГ при беременности',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            textPlan: 'Метилдопа перорально или нифедипин с замедленным высвобождением: 20–40 мг 2 раза в сутки внутрь, не разжёвывая, или 30–60 мг 1 раз в сутки; максимальная суточная доза 120 мг.',
            doseLevel: 'specific',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            textPlan: 'Бисопролол или метопролол.',
            doseLevel: 'specific',
          },
        },
      },
      warning: 'иАПФ, БРА, АМКР, БКК — противопоказаны при беременности',
    },

    oncology: {
      id: 'oncology',
      label: 'Лечение АГ на фоне противоопухолевой терапии',
      steps: {
        1: {
          label: 'Стартовая терапия (1 шаг)',
          primary: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК',
            doseLevel: 'optimal',
          },
        },
        2: {
          label: '2 шаг',
          primary: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК',
            doseLevel: 'maximal',
            warning: 'При непереносимости рассмотреть альтернативный вариант терапии',
          },
          alternative: {
            classPlan: 'ИАПФ или БРА + дигидропиридиновые БКК + АМКР или ББ или диуретик',
            doseLevel: 'optimal',
          },
        },
      },
    },
  },

  classDescriptions: {
    'БРА': 'Блокаторы рецепторов ангиотензина I',
    'ИАПФ': 'Ингибиторы ангиотензинпревращающего фермента',
    'БКК': 'Блокаторы кальциевых каналов',
    'ДИУРЕТИКИ': 'Тиазидные и тиазидоподобные диуретики',
    'ББ': 'Бета-адреноблокаторы',
    'АРНИ': 'Ангиотензиновых рецепторов и неприлизина ингибиторы, представитель — валсартан+сакубитрил',
    'АМКР': 'Антагонисты минералокортикоидных рецепторов',
    'АИР': 'Агонисты имидазолиновых рецепторов, представитель — моксонидин',
    'ААБ': 'Альфа-адреноблокаторы',
  },
};

const STORAGE_KEY = 'agRulesOverride';

export function loadRules() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_RULES;
  try {
    return { ...DEFAULT_RULES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRulesOverride(jsonString) {
  localStorage.setItem(STORAGE_KEY, jsonString);
}

export function resetRulesOverride() {
  localStorage.removeItem(STORAGE_KEY);
}
