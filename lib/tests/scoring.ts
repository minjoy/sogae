import { ALL_TESTS } from './test-data';

export interface TestAnswer {
  questionId: number;
  value: number; // 1-5
}

export interface SubscaleScore {
  subscale: string;
  name: string;
  score: number; // 1-5 평균
  percentile: number; // 0-100
}

export interface TestScore {
  testType: number;
  subscales: SubscaleScore[];
  primaryLabel: string;
  secondaryLabel?: string;
  comment: string;
  recommendations: string[];
}

// 역채점 처리
function reverseScore(value: number): number {
  return 6 - value;
}

// 1-5 점수를 0-100 퍼센타일로 변환
function toPercentile(score: number): number {
  return Math.round((score - 1) * 25);
}

// 테스트 채점
export function scoreTest(testType: number, answers: TestAnswer[]): TestScore {
  const testDef = ALL_TESTS[testType];
  if (!testDef) {
    throw new Error(`Invalid test type: ${testType}`);
  }

  // 하위척도별 점수 계산
  const subscaleScores: { [key: string]: number[] } = {};

  answers.forEach((answer) => {
    const question = testDef.questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    const score = question.reverse ? reverseScore(answer.value) : answer.value;

    if (!subscaleScores[question.subscale]) {
      subscaleScores[question.subscale] = [];
    }
    subscaleScores[question.subscale].push(score);
  });

  // 각 하위척도의 평균 계산
  const subscales: SubscaleScore[] = Object.keys(subscaleScores).map((key) => {
    const scores = subscaleScores[key];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      subscale: key,
      name: testDef.subscales[key].name,
      score: avg,
      percentile: toPercentile(avg),
    };
  });

  // 정렬 (점수 높은 순)
  subscales.sort((a, b) => b.score - a.score);

  // 라벨 및 코멘트 결정
  const result = generateResultByTestType(testType, subscales);

  return {
    testType,
    subscales,
    primaryLabel: result.primaryLabel,
    secondaryLabel: result.secondaryLabel,
    comment: result.comment,
    recommendations: result.recommendations,
  };
}

// 테스트별 결과 생성
function generateResultByTestType(
  testType: number,
  subscales: SubscaleScore[]
): {
  primaryLabel: string;
  secondaryLabel?: string;
  comment: string;
  recommendations: string[];
} {
  const primary = subscales[0];
  const secondary = subscales[1];

  switch (testType) {
    case 1: // 감정 타입
      return generateEmotionTypeResult(subscales);
    case 2: // 소비 성향
      return generateSpendingResult(primary, secondary);
    case 3: // 업무 처리
      return generateWorkModeResult(primary, secondary);
    case 4: // 갈등 스타일
      return generateConflictStyleResult(subscales);
    case 5: // 번아웃
      return generateBurnoutResult(primary);
    default:
      return {
        primaryLabel: primary.name,
        comment: '결과가 저장되었습니다.',
        recommendations: [],
      };
  }
}

// 테스트 1: 감정 타입 결과
function generateEmotionTypeResult(subscales: SubscaleScore[]) {
  const anx = subscales.find((s) => s.subscale === 'ANX');
  const avd = subscales.find((s) => s.subscale === 'AVD');
  const imm = subscales.find((s) => s.subscale === 'IMM');
  const perf = subscales.find((s) => s.subscale === 'PERF');

  let primaryLabel = '';
  let secondaryLabel = undefined;
  let comment = '';
  let recommendations: string[] = [];

  // 주타입 결정
  if (anx && avd) {
    if (anx.score >= 3.6 && avd.score < 3.2) {
      primaryLabel = '불안형';
      comment = '관계의 안전 신호를 더 자주 필요로 하는 편이에요. 확인 욕구가 올라올 때는 "질문 1개 + 요청 1개"로 짧게 표현하는 방식이 도움이 돼요.';
      recommendations = [
        '상대에게 확인하고 싶을 때, 한 번에 한 가지만 물어보기',
        '"지금 나한테 화났어?"보다 "요즘 바빠 보여서 걱정돼. 괜찮아?" 같은 표현 연습',
        '불안할 때 혼자 할 수 있는 안정 루틴 만들기 (산책, 일기 등)',
      ];
    } else if (avd.score >= 3.6 && anx.score < 3.2) {
      primaryLabel = '회피형';
      comment = '감정을 혼자 정리해야 편한 편이에요. 대화를 미루기 전에 "지금은 30분만 쉬고 다시 이야기하자"처럼 시간 약속을 남기면 오해가 크게 줄어요.';
      recommendations = [
        '대화 미루기 전 "○○분 후에 다시 얘기할게" 시간 약속하기',
        '감정 정리가 필요할 때 "지금은 혼자 있고 싶어"라고 표현하기',
        '상대의 감정 요구에 부담될 때 "천천히 이야기하자" 제안하기',
      ];
    } else if (anx.score >= 3.6 && avd.score >= 3.6) {
      primaryLabel = '혼합형 (불안+회피)';
      comment = '가까워지고 싶지만 동시에 부담도 커서 밀고 당기기가 생기기 쉬워요. "내가 원하는 거리"와 "상대가 이해할 언어"를 카드에 적어두면 갈등이 줄어요.';
      recommendations = [
        '밀고 당기기 패턴을 인식하고, 중간 지점 찾기',
        '가까워지고 싶을 때와 거리가 필요할 때를 구분해서 표현하기',
        '관계 초반에 "나는 이런 사람이야"를 먼저 설명하기',
      ];
    } else {
      primaryLabel = '안정형';
      comment = '관계의 불확실성을 감당하는 힘이 있어요. 다만 상대가 불안/회피형이면 "확인/거리" 균형을 더 의식하면 좋아요.';
      recommendations = [
        '상대가 확인을 요청할 때 귀찮아하지 않고 한 번 더 안심시켜주기',
        '상대가 거리가 필요할 때 개인 공간 존중하기',
        '갈등이 생겨도 차분하게 대화로 풀어가는 강점 활용하기',
      ];
    }
  }

  // 보조 배지
  if (imm && imm.score >= 3.8) {
    secondaryLabel = '과몰입 경향';
  } else if (perf && perf.score >= 3.8) {
    secondaryLabel = '완벽주의 경향';
  }

  return { primaryLabel, secondaryLabel, comment, recommendations };
}

// 테스트 2: 소비 성향 결과
function generateSpendingResult(primary: SubscaleScore, secondary: SubscaleScore) {
  const labels: { [key: string]: { comment: string; recs: string[] } } = {
    COMF: {
      comment: '힘들 때 소비가 감정 조절 도구가 되기 쉬워요. 연애에서는 "감정이 흔들리면 지출이 늘어날 수 있음"을 스스로 인지하는 게 핵심이에요.',
      recs: [
        '감정이 안 좋을 때 "일단 24시간 기다리기" 규칙 만들기',
        '스트레스 받을 때 대체 행동 목록 만들기 (산책, 운동, 친구와 통화)',
        '월별 "감정 소비" 예산 미리 책정하기',
      ],
    },
    APPR: {
      comment: '관계/평가 상황에서 소비가 커질 수 있어요. "상대에게 인정받기 위한 지출"과 "내 만족"의 경계를 카드에 써두면 좋아요.',
      recs: [
        '소개팅/모임 전 "얼마까지 쓸 건지" 미리 정하기',
        '"이걸 사면 어떻게 보일까?"보다 "나한테 필요한가?"로 기준 바꾸기',
        '관계 초반 과소비 패턴 인식하고 브레이크 걸기',
      ],
    },
    CTRL: {
      comment: '예측 가능한 재정이 안정감을 줘요. 상대가 즉흥 소비형이면 충돌이 생길 수 있어, "지출 합의 규칙"을 미리 정하는 게 좋아요.',
      recs: [
        '월 예산 계획 세우고 앱으로 자동 관리하기',
        '상대와 금액 기준 정하기 (예: 10만원 이상은 상의)',
        '예상 밖 지출이 생기면 바로 조정 계획 세우기',
      ],
    },
    IMPL: {
      comment: '환경 자극(할인/마감)에 취약할 수 있어요. 결제 전 "10분 유예" 같은 개인 규칙이 실효성이 커요.',
      recs: [
        '구매 전 "10분 산책" 또는 "다음 날 아침 재확인" 규칙 만들기',
        '앱 알림/광고 메일 차단하기',
        '결제 수단을 불편하게 만들기 (카드 집에 두기 등)',
      ],
    },
  };

  const result = labels[primary.subscale] || {
    comment: '소비 성향이 파악되었습니다.',
    recs: [],
  };

  const primaryLabel = primary.name;
  const secondaryLabel = (secondary && Math.abs(primary.score - secondary.score) < 0.3)
    ? secondary.name
    : undefined;

  return {
    primaryLabel,
    secondaryLabel,
    comment: result.comment,
    recommendations: result.recs,
  };
}

// 테스트 3: 업무 처리 결과
function generateWorkModeResult(primary: SubscaleScore, secondary: SubscaleScore) {
  const labels: { [key: string]: { comment: string; recs: string[] } } = {
    PLAN: {
      comment: '약속 변경/갑작스런 연락두절에 취약. "변경 시 최소 1줄 설명"이 관계 안정에 중요.',
      recs: [
        '일정 변경 시 "이유 + 대안 시간" 함께 말하기',
        '상대가 갑자기 못 만나도 "배려 없음"이 아닐 수 있음 인식하기',
        '예측 불가 상황에 대한 여유 시간 미리 확보하기',
      ],
    },
    EXPL: {
      comment: '결정 전에 정리 시간이 필요. 상대가 "답 빨리" 압박하면 갈등. "오늘은 방향만, 내일 결정" 룰 추천.',
      recs: [
        '"지금 바로 답하기 어려워. ○○일까지 생각해볼게" 표현 연습',
        '중요한 결정은 자료/생각 정리 후 이야기하기',
        '상대가 즉흥형이면 "천천히 정하자"고 요청하기',
      ],
    },
    IMPR: {
      comment: '순간 추진력이 강점. 상대가 계획형이면 오해. "즉흥=무책임이 아님" 설명 문구를 카드에 넣으면 좋음.',
      recs: [
        '갑작스런 제안 전에 "지금 괜찮아?"한마디 먼저하기',
        '큰 결정은 하루 정도 시간 두고 재확인하기',
        '상대가 계획 중시하면 "최소 일정"은 지키기',
      ],
    },
    DEAD: {
      comment: '바쁠 때 연락 밀림 가능. 상대는 "회피"로 오해할 수 있어 "마감 기간엔 1일 1회 짧은 체크인" 규칙 추천.',
      recs: [
        '마감 기간 미리 공유하고 "○○일까지 바빠" 안내하기',
        '바빠도 하루 1번은 짧게라도 연락하기',
        '마감 후 "이제 여유 생겼어" 회복 신호 보내기',
      ],
    },
  };

  const result = labels[primary.subscale] || {
    comment: '업무 처리 성향이 파악되었습니다.',
    recs: [],
  };

  const primaryLabel = primary.name;
  const secondaryLabel = (secondary && Math.abs(primary.score - secondary.score) < 0.3)
    ? secondary.name
    : undefined;

  return {
    primaryLabel,
    secondaryLabel,
    comment: result.comment,
    recommendations: result.recs,
  };
}

// 테스트 4: 갈등 스타일 결과
function generateConflictStyleResult(subscales: SubscaleScore[]) {
  const avoid = subscales.find((s) => s.subscale === 'AVOID');
  const attack = subscales.find((s) => s.subscale === 'ATTACK');
  const accom = subscales.find((s) => s.subscale === 'ACCOM');

  const primary = subscales[0];
  const secondaryLabel = undefined;
  let comment = '';
  let recommendations: string[] = [];

  // 위험 신호 체크
  const hasRisk =
    (attack && attack.score >= 4.0) ||
    (avoid && avoid.score >= 4.0) ||
    (accom && accom.score >= 4.0);

  const labels: { [key: string]: { comment: string; recs: string[] } } = {
    AVOID: {
      comment: '대화를 끊기 전에 "시간 약속(예: 30분 후 재개)"이 필수.',
      recs: [
        '회피하기 전 "○○분만 시간 주면 이야기할게" 약속하기',
        '감정이 격해지면 "지금은 정리가 안 돼. 조금만 기다려줘" 표현하기',
        '미룬 대화는 반드시 다시 꺼내기',
      ],
    },
    ATTACK: {
      comment: '핵심은 톤. "사실-느낌-요청" 3단으로 말하면 관계 손상이 급감.',
      recs: [
        '"너는 왜 그래?"보다 "나는 ○○할 때 △△하게 느껴져"로 바꾸기',
        '말하기 전 한 번 숨 고르고 톤 낮추기',
        '상대 비난보다 "나는 이렇게 해줬으면 좋겠어" 요청으로 바꾸기',
      ],
    },
    PERSUADE: {
      comment: '상대는 "논리"보다 "감정 인정"을 먼저 필요로 할 수 있음. "네가 그렇게 느낄 수 있겠다" 1문장 추가.',
      recs: [
        '해결책 제시 전에 "속상했겠다" 한마디 먼저하기',
        '"논리적으로는..."보다 "네 기분은 충분히 이해해" 시작하기',
        '감정과 문제 해결을 분리해서 단계별로 접근하기',
      ],
    },
    ACCOM: {
      comment: '맞추는 건 강점이지만 자기소진 위험. "내가 원하는 1가지"를 반드시 말하는 연습 추천.',
      recs: [
        '양보 전에 "이건 나한테 중요해"라고 말할 1가지 정하기',
        '참았다가 폭발하지 않도록 작은 불편도 표현하기',
        '"나는 이렇게 느껴"를 비난 없이 전달하는 연습하기',
      ],
    },
  };

  const result = labels[primary.subscale] || {
    comment: '갈등 대화 스타일이 파악되었습니다.',
    recs: [],
  };

  comment = result.comment;
  recommendations = result.recs;

  if (hasRisk) {
    comment += ' (주의: 관계 손상 가능성 높은 구간)';
  }

  return {
    primaryLabel: primary.name,
    secondaryLabel,
    comment,
    recommendations,
  };
}

// 테스트 5: 번아웃 결과
function generateBurnoutResult(primary: SubscaleScore) {
  let label = '';
  let comment = '';
  let recommendations: string[] = [];

  if (primary.score >= 1.0 && primary.score < 2.5) {
    label = '안정 ✅';
    comment = '관계를 확장할 체력이 있는 상태예요.';
    recommendations = [
      '현재 에너지 밸런스 유지하기',
      '새로운 관계를 시작하기 좋은 시기',
      '자기 케어 루틴 꾸준히 지속하기',
    ];
  } else if (primary.score >= 2.5 && primary.score < 3.6) {
    label = '주의 ⚠️';
    comment = '연애는 가능하지만, 페이스 조절이 중요해요("천천히 모드" 권장).';
    recommendations = [
      '무리한 약속보다 충분한 휴식 시간 확보하기',
      '상대에게 "요즘 조금 피곤해"라고 미리 공유하기',
      '주 1-2회 온전히 나만의 시간 갖기',
    ];
  } else {
    label = '위험 🔴';
    comment = '지금은 관계가 회복 대신 소진을 키울 수 있어요. 먼저 7일 회복 루틴을 권장해요.';
    recommendations = [
      '새로운 관계 시작보다 휴식과 회복 우선하기',
      '일주일간 의무적 약속 최소화하기',
      '수면, 식사, 운동 기본 루틴부터 재정비하기',
    ];
  }

  return {
    primaryLabel: label,
    comment,
    recommendations,
  };
}
