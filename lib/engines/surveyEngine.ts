/**
 * 경제 성향 설문 엔진
 * 8개 문항을 통해 3글자 코드를 생성합니다.
 *
 * 축 구조:
 * 1. 소비/절약 축 (S: Saver, C: Consumer)
 * 2. 계획/유연 축 (P: Planner, F: Flexible)
 * 3. 위험/안전 축 (L: Low risk, R: Risk)
 */

export interface SurveyAnswers {
  q1: number; // 1-5
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
}

export interface SurveyResult {
  code3: string;
  summaryText: string;
  details: {
    axis1: { code: 'S' | 'C'; label: string; score: number };
    axis2: { code: 'P' | 'F'; label: string; score: number };
    axis3: { code: 'L' | 'R'; label: string; score: number };
  };
}

/**
 * 설문 문항 정의
 */
export const SURVEY_QUESTIONS = [
  {
    id: 'q1',
    text: '월급이 들어오면 가장 먼저 떠오르는 생각은?',
    options: [
      { value: 1, label: '저축/대출 상환부터 걱정된다' },
      { value: 2, label: '일단 저축은 하되, 쓸 돈도 생각한다' },
      { value: 3, label: '균형있게 배분한다' },
      { value: 4, label: '필요한 것부터 쓰고 남으면 저축한다' },
      { value: 5, label: '이번에 뭘 사거나 어디 갈지부터 떠오른다' },
    ],
  },
  {
    id: 'q2',
    text: '불필요한 지출을 줄이기 위해 가계부를 쓰거나 체크해 본 적이 있다',
    options: [
      { value: 1, label: '전혀 없다' },
      { value: 2, label: '가끔 시도했지만 지속하지 못했다' },
      { value: 3, label: '필요할 때만 한다' },
      { value: 4, label: '자주 하는 편이다' },
      { value: 5, label: '항상 한다' },
    ],
  },
  {
    id: 'q3',
    text: '5년 뒤의 나의 재정 상태에 대해 구체적인 목표(집, 자산 규모 등)가 있다',
    options: [
      { value: 1, label: '그런 거 잘 안 정한다' },
      { value: 2, label: '막연하게만 생각한다' },
      { value: 3, label: '큰 틀만 있다' },
      { value: 4, label: '어느 정도 구체적이다' },
      { value: 5, label: '꽤 구체적으로 세워두었다' },
    ],
  },
  {
    id: 'q4',
    text: '계획과 다르게 써도 "살다 보면 그럴 수 있지"라고 생각하는 편이다',
    options: [
      { value: 1, label: '거의 아니다. 계획 깨지는 걸 싫어한다' },
      { value: 2, label: '가끔은 그렇다' },
      { value: 3, label: '보통이다' },
      { value: 4, label: '자주 그렇다' },
      { value: 5, label: '그렇다. 크게 신경 쓰지 않는다' },
    ],
  },
  {
    id: 'q5',
    text: '투자 성향에 대한 나의 생각에 가장 가까운 것은?',
    options: [
      { value: 1, label: '원금 보장이 최우선이다' },
      { value: 2, label: '손실 위험은 최소화하되 약간의 수익은 원한다' },
      { value: 3, label: '적당한 위험은 감수할 수 있다' },
      { value: 4, label: '높은 수익을 위해 위험을 감수한다' },
      { value: 5, label: '손실 가능성이 있어도 수익을 위해 투자할 수 있다' },
    ],
  },
  {
    id: 'q6',
    text: '지금 가진 돈이 있다면 어느 쪽에 더 쓰고 싶은가?',
    options: [
      { value: 1, label: '예/적금, 빚 상환' },
      { value: 2, label: '저축이 우선이지만 가끔 쓰고 싶다' },
      { value: 3, label: '반반' },
      { value: 4, label: '경험도 중요하니 적절히 쓴다' },
      { value: 5, label: '여행, 취미, 경험, 새로운 도전' },
    ],
  },
  {
    id: 'q7',
    text: '갑자기 큰돈이 필요해지는 상황을 대비해 별도 비상금을 준비해두고 있다',
    options: [
      { value: 1, label: '없다' },
      { value: 2, label: '생각만 하고 있다' },
      { value: 3, label: '준비 중이다' },
      { value: 4, label: '어느 정도 있다' },
      { value: 5, label: '충분히 있다' },
    ],
  },
  {
    id: 'q8',
    text: '경제적인 이유로 연애/결혼/출산 시기를 조정하고 싶다는 생각이 있다',
    options: [
      { value: 1, label: '그런 거 별로 따지지 않는다' },
      { value: 2, label: '약간 고려한다' },
      { value: 3, label: '보통이다' },
      { value: 4, label: '꽤 고려한다' },
      { value: 5, label: '경제 상황이 어느 정도 갖춰져야 한다고 생각한다' },
    ],
  },
];

/**
 * 설문 답변을 바탕으로 3글자 경제 성향 코드를 계산
 */
export function calculateEconomicCode3(answers: SurveyAnswers): SurveyResult {
  // 축 1: 소비/절약 (S vs C)
  // Q1, Q2, Q6을 활용
  // Q1: 높을수록 소비형 (C)
  // Q2: 높을수록 절약형 (S)
  // Q6: 높을수록 소비형 (C)
  const axis1Score = (answers.q1 + (6 - answers.q2) + answers.q6) / 3;
  const axis1Code: 'S' | 'C' = axis1Score < 3 ? 'S' : 'C';
  const axis1Label = axis1Code === 'S' ? '절약·안정형' : '소비·경험형';

  // 축 2: 계획/유연 (P vs F)
  // Q3, Q4, Q7, Q8을 활용
  // Q3: 높을수록 계획형 (P)
  // Q4: 높을수록 유연형 (F)
  // Q7: 높을수록 계획형 (P)
  // Q8: 높을수록 계획형 (P)
  const axis2Score = (answers.q3 + (6 - answers.q4) + answers.q7 + answers.q8) / 4;
  const axis2Code: 'P' | 'F' = axis2Score < 3 ? 'F' : 'P';
  const axis2Label = axis2Code === 'P' ? '계획형' : '유연형';

  // 축 3: 위험/안전 (L vs R)
  // Q5를 활용
  // Q5: 높을수록 위험추구형 (R)
  const axis3Score = answers.q5;
  const axis3Code: 'L' | 'R' = axis3Score < 3 ? 'L' : 'R';
  const axis3Label = axis3Code === 'L' ? '안정투자형' : '공격투자형';

  const code3 = `${axis1Code}${axis2Code}${axis3Code}`;

  // 코드별 설명 생성
  const summaryText = generateSummaryText(code3, {
    axis1: axis1Label,
    axis2: axis2Label,
    axis3: axis3Label,
  });

  return {
    code3,
    summaryText,
    details: {
      axis1: { code: axis1Code, label: axis1Label, score: axis1Score },
      axis2: { code: axis2Code, label: axis2Label, score: axis2Score },
      axis3: { code: axis3Code, label: axis3Label, score: axis3Score },
    },
  };
}

/**
 * 코드별 요약 설명 생성
 */
function generateSummaryText(
  code3: string,
  labels: { axis1: string; axis2: string; axis3: string }
): string {
  const descriptions: Record<string, string> = {
    SPL: '당신은 절약하며 계획적으로 안정적인 투자를 선호하는 타입입니다. 미래를 위해 꾸준히 준비하며, 위험보다는 확실함을 추구합니다.',
    SPR: '당신은 절약하지만 계획적으로 공격적인 투자도 고려하는 타입입니다. 목표를 위해 계산된 위험을 감수할 수 있습니다.',
    SFL: '당신은 절약하되 상황에 유연하게 대응하며, 안정적인 투자를 선호합니다. 현실적이면서도 신중한 편입니다.',
    SFR: '당신은 절약하지만 유연하게 대응하며, 기회가 있으면 투자도 고려하는 타입입니다. 균형감각이 있습니다.',
    CPL: '당신은 경험을 중시하지만 계획적으로 접근하며, 안정적인 기반을 유지합니다. 즐기되 무리하지 않습니다.',
    CPR: '당신은 경험을 중시하고 계획적으로 투자하며, 공격적인 기회도 놓치지 않습니다. 도전적이면서 전략적입니다.',
    CFL: '당신은 경험을 즐기고 유연하게 대응하지만, 투자는 안정적으로 하는 타입입니다. 삶을 즐기되 기본은 지킵니다.',
    CFR: '당신은 경험을 중시하고 유연하며, 공격적인 투자도 두려워하지 않습니다. 모험을 즐기고 새로운 기회를 추구합니다.',
  };

  return (
    descriptions[code3] ||
    `당신은 ${labels.axis1}, ${labels.axis2}, ${labels.axis3} 성향을 가진 분입니다.`
  );
}

/**
 * 설문 답변 유효성 검증
 */
export function validateSurveyAnswers(answers: Partial<SurveyAnswers>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const requiredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

  for (const q of requiredQuestions) {
    const value = answers[q as keyof SurveyAnswers];
    if (value === undefined || value === null) {
      errors.push(`${q}는 필수 항목입니다.`);
    } else if (value < 1 || value > 5) {
      errors.push(`${q}의 값은 1-5 사이여야 합니다.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
