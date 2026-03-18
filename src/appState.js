
export const defaultState = {
  patient: {
    age: '',
    sex: '',
    sbp: '',
    dbp: '',
  },
  diagnosis: {
    stageMode: 'determine',
    stageManual: '',
    riskMode: 'determine',
    riskManual: '',
    riskCalcMode: 'score2',
    score2Value: '',
    score2SourceImage: '',
    stageFactors: {
      riskFactors: [],
      organDamage: [],
      clinicalStates: [],
      ckdStage: 'absent',
    },
    clinicalRisk: {
      diabetes: false,
      diabetesType: '',
      diabetesDuration: '',
      diabetesTom: false,
      ckd: false,
      ckdSeverity: '',
      familialHypercholesterolemia: false,
      markedRiskFactors: [],
      documentedAscvd: false,
      imagingAscvd: false,
      extremeAscvd: false,
    },
  },
  additional: {
    conditions: {
      selected: [],
      ckdSubtype: '',
      ihdSubtype: '',
      heartFailureSubtype: '',
      afSubtype: '',
    },
    meds: {
      selected: [],
      cancerSubtype: '',
    },
    other: {
      frailtyOpen: false,
      frailtyAnswers: [false, false, false, false, false, false, false],
      frailtyCalculated: false,
      chaOpen: false,
      chaAnswers: {
        strokeHistory: false,
        age75: false,
        hypertension: true,
        diabetes: false,
        chf: false,
        vascular: false,
        age65_74: false,
        female: false,
      },
      chaCalculated: false,
    },
  },
  therapyStatus: {
    mode: 'start',
    currentClasses: [],
    targetAchieved: false,
  },
  ui: {
    showRuleEditor: false,
    manualStepView: null,
  },
};

let state = structuredClone(defaultState);

export const getState = () => state;

export const setState = (next) => {
  state = next;
  localStorage.setItem('agAppState', JSON.stringify(state));
};

export const loadState = () => {
  const raw = localStorage.getItem('agAppState');
  if (!raw) return state;
  try {
    state = { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    state = structuredClone(defaultState);
  }
  return state;
};

export const resetState = () => {
  state = structuredClone(defaultState);
  localStorage.removeItem('agAppState');
  return state;
};
