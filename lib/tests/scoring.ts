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

export interface CompatibilityInfo {
  myType: string;
  idealPartner: string;
  idealPartnerDesc: string;
  datingTip: string;
}

export interface TestScore {
  testType: number;
  subscales: SubscaleScore[];
  primaryLabel: string;
  secondaryLabel?: string;
  comment: string;
  recommendations: string[];
  compatibility?: CompatibilityInfo;
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
    compatibility: result.compatibility,
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
  compatibility?: CompatibilityInfo;
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
  let compatibility: CompatibilityInfo | undefined;

  // 주타입 결정
  if (anx && avd) {
    if (anx.score >= 3.6 && avd.score < 3.2) {
      primaryLabel = '불안형';
      comment = '솔직히 말하면, 답장 3시간만 늦어도 "나 싫어진 거 아니야?"라고 생각해본 적 있죠? 이건 약점이 아니라 신호예요. 연애할 때 안정감을 충전하는 속도가 빠르게 소모된다는 뜻. 상대의 "좋아해"를 듣고도 며칠 지나면 또 확인하고 싶어지는 이유입니다.';
      recommendations = [
        '확인하고 싶을 때 "나 지금 불안해져서 질문할게" 한마디 먼저 말하기',
        '상대가 답장 늦으면 최소 6시간은 기다린 후 연락하기 (직감은 90% 틀림)',
        '매일 5분 "오늘 내가 받은 사랑 증거" 3가지 적어보기',
      ];
      compatibility = {
        myType: '불안형 💗',
        idealPartner: '안정형 상대',
        idealPartnerDesc: '답장 늦어도 "바쁘겠지" 하고 기다릴 수 있는 사람. 당신의 확인 욕구에 귀찮아하지 않고 "괜찮아, 좋아해"라고 꾸준히 말해줄 수 있는 파트너가 이상적이에요.',
        datingTip: '회피형과 만나면 서로 소진되기 쉬워요. 안정형이나 적당히 표현 잘 하는 사람을 찾으세요.',
      };
    } else if (avd.score >= 3.6 && anx.score < 3.2) {
      primaryLabel = '회피형';
      comment = '"혼자 있고 싶어"를 말하면 상대가 서운해할까 봐 그냥 잠수 타버린 적, 있죠? 당신은 나쁜 사람이 아니에요. 다만 감정 처리 시스템이 "혼자 모드"로 설정되어 있을 뿐. 문제는 상대가 그걸 "냉정함"으로 오해한다는 거예요. 달아나기 전에 5초만 말해보세요.';
      recommendations = [
        '화났을 때 "지금 화난 거 아니고, 30분만 혼자 있을게" 문자 보내기',
        '상대가 "왜 말 안 해?"라고 물으면 "정리 중"이라고 인정하기',
        '대화 미룬 후 반드시 내가 먼저 다시 말 걸기 (이게 신뢰의 핵심)',
      ];
      compatibility = {
        myType: '회피형 🦋',
        idealPartner: '안정형 또는 독립적인 상대',
        idealPartnerDesc: '당신의 "혼자 시간"을 이해하고 존중해주는 사람. 매번 "왜 연락 안 해?"라고 추궁하지 않고, 적당한 거리감을 편하게 유지할 수 있는 파트너가 좋아요.',
        datingTip: '불안형과 만나면 상대는 더 매달리고, 당신은 더 도망치는 악순환이 생겨요. 독립적인 취미가 있는 사람을 찾으세요.',
      };
    } else if (anx.score >= 3.6 && avd.score >= 3.6) {
      primaryLabel = '혼합형 (불안+회피)';
      comment = '가장 복잡한 유형. "보고 싶다"고 연락했다가 만나면 "숨 막혀"지는 모순. 이게 바로 밀당의 정체예요. 상대는 "도대체 뭘 원해?"라고 혼란스럽고, 당신도 스스로 이해 못 해서 지쳐요. 하지만 이건 패턴일 뿐, 당신 자체가 문제는 아닙니다.';
      recommendations = [
        '가까워지고 싶을 때 / 거리 두고 싶을 때를 일기에 기록하기 (패턴 발견용)',
        '상대에게 "나는 파도 타는 사람"이라고 미리 설명하기',
        '"가까워졌으니 이제 혼자 있고 싶어져"를 당당히 말하는 연습하기',
      ];
      compatibility = {
        myType: '혼합형 🎭',
        idealPartner: '매우 안정적인 상대',
        idealPartnerDesc: '당신의 밀고 당기기에 흔들리지 않고 일관된 태도를 유지할 수 있는 사람. "오늘은 멀리 있고 싶어도 내일은 다시 올 거야"라고 믿고 기다려줄 수 있는 파트너가 필요해요.',
        datingTip: '같은 혼합형이나 불안형을 만나면 롤러코스터가 됩니다. 안정형 중에서도 특히 여유 있는 사람을 찾으세요.',
      };
    } else {
      primaryLabel = '안정형';
      comment = '당신은 희귀종입니다. 답장 안 와도 "바쁘겠지"하고 기다릴 수 있고, 붙어 있어도 숨 안 막혀요. 하지만 조심하세요. 상대가 불안형/회피형일 경우, 당신의 "편안함"이 그들에겐 "관심 없음"으로 읽힐 수 있어요. 당신은 괜찮아도 상대는 불안할 수 있다는 걸 기억하세요.';
      recommendations = [
        '상대가 "나 좋아해?"라고 물으면 귀찮아하지 말고 진지하게 대답하기',
        '상대가 혼자 있고 싶다고 하면 "언제든지 편할 때 연락해"라고 말해주기',
        '당신의 "차분함"이 누군가에겐 "냉정함"으로 느껴질 수 있음 인지하기',
      ];
      compatibility = {
        myType: '안정형 🌟',
        idealPartner: '대부분의 유형과 호환',
        idealPartnerDesc: '당신은 어떤 유형과도 잘 맞을 수 있어요. 특히 불안형이나 회피형 파트너를 만나면 그들에게 안정감을 줄 수 있습니다. 같은 안정형을 만나면 가장 편안한 관계가 됩니다.',
        datingTip: '당신의 안정감이 상대에겐 "무관심"으로 보일 수 있어요. 가끔은 먼저 애정 표현을 해주세요.',
      };
    }
  }

  // 보조 배지
  if (imm && imm.score >= 3.8) {
    secondaryLabel = '과몰입 경향';
  } else if (perf && perf.score >= 3.8) {
    secondaryLabel = '완벽주의 경향';
  }

  return { primaryLabel, secondaryLabel, comment, recommendations, compatibility };
}

// 테스트 2: 소비 성향 결과
function generateSpendingResult(primary: SubscaleScore, secondary: SubscaleScore) {
  const labels: { [key: string]: { comment: string; recs: string[]; compatibility: CompatibilityInfo } } = {
    COMF: {
      comment: '짜증나면 결제창 열리죠? "화났는데 배달비 5,000원? 걍 시킨다" 이게 당신입니다. 문제는 감정과 지갑이 직통으로 연결돼 있다는 거예요. 스트레스 받을 때마다 쇼핑몰 켜는 습관, 이거 연애하면 "싸우고 나서 충동구매" 패턴으로 이어집니다. 감정이 돈으로 새는 구멍을 막으세요.',
      recs: [
        '화날 때 카드 결제 전 "6시간 대기" 의무화하기',
        '스트레스 받으면 "쇼핑 대신 산책 30분" 규칙 실천하기',
        '매달 "감정 소비 한도" 10만원 미리 설정하고 지키기',
      ],
      compatibility: {
        myType: '위로형 소비 💆',
        idealPartner: '통제형 또는 안정적인 소비 스타일',
        idealPartnerDesc: '당신이 감정적으로 지출하려 할 때 "잠깐, 진짜 필요해?"라고 부드럽게 물어봐줄 수 있는 사람. 하지만 너무 잔소리하지 않고 가끔은 함께 "오늘은 쓰자!"라고 할 수 있는 유연함도 필요해요.',
        datingTip: '같은 위로형을 만나면 싸울 때마다 카드값이 폭발해요. 돈 관리 잘 하는 파트너가 좋습니다.',
      },
    },
    APPR: {
      comment: '솔직하게 물어볼게요. 소개팅 전날 옷 새로 산 적 있죠? "좋아 보여야 해"라는 압박이 지갑을 엽니다. 문제는 관계가 시작되면 "계속 좋아 보여야 해"로 이어진다는 거예요. 선물, 데이트 비용, 외모 관리... 인정받으려고 쓴 돈은 나중에 "내가 이렇게까지 했는데"라는 원망으로 돌아와요.',
      recs: [
        '데이트 전 "오늘 지출 한도 ○만원" 메모장에 적기',
        '"이거 사면 어떻게 볼까?" 생각 들면 구매 중단하기',
        '관계 초반 3개월은 "과시 소비 금지" 규칙 세우기',
      ],
      compatibility: {
        myType: '인정형 소비 👔',
        idealPartner: '있는 그대로를 인정해주는 상대',
        idealPartnerDesc: '"비싼 거 안 사도 돼, 네가 좋아"라고 진심으로 말해주는 사람. 외모나 소유물보다 당신 자체를 봐주고, 과시하지 않아도 인정받는다는 걸 느끼게 해줄 파트너가 좋아요.',
        datingTip: '겉모습을 중시하는 상대를 만나면 끝없이 돈을 쓰게 돼요. 내면을 봐주는 사람을 찾으세요.',
      },
    },
    CTRL: {
      comment: '예산표 없이는 못 사는 타입. 통장 쪼개기, 가계부 앱 3개 깔려 있죠? 문제는 상대가 "갑자기 제주도 갈래?"라고 하면 당신은 멘붕 온다는 거예요. "예산에 없는데..."라고 말하면 상대는 "재미없다"고 느끼고, 당신은 "왜 계획 없이 살아?"라고 답답해합니다. 충돌 각.',
      recs: [
        '월 예산에 "즉흥 비용 10%" 미리 포함시키기',
        '상대에게 "○만원 이상은 사전 협의"라고 명확히 말하기',
        '계획 틀어져도 "이번 한 번은 괜찮아" 연습하기',
      ],
      compatibility: {
        myType: '통제형 소비 📊',
        idealPartner: '비슷하거나 약간 유연한 소비 스타일',
        idealPartnerDesc: '같이 가계부 쓰고, 예산 회의하는 게 즐거운 사람. 또는 당신의 계획을 존중하면서도 가끔 "오늘은 예산 잊자"라고 유연하게 제안할 수 있는 파트너도 좋아요.',
        datingTip: '충동형과 만나면 돈 문제로 매일 싸워요. 최소한 돈에 대한 대화가 가능한 사람을 찾으세요.',
      },
    },
    IMPL: {
      comment: '"할인 끝나기 3시간 전!" 이 문구에 약하죠? 쿠폰, 타임딜, 마감 임박... 이런 말만 보면 이성이 증발합니다. 장바구니에 담았던 거 "지금 아니면 손해"라고 생각하고 결제 누르는 순간, 당신은 이미 마케팅의 노예예요. 연애에서도 "지금 아니면 놓칠 것 같아"라는 조급함이 문제가 됩니다.',
      recs: [
        '결제 전 무조건 "내일 아침 다시 보기" 규칙 지키기',
        '쿠폰/할인 알림 전부 차단하고 필요할 때만 직접 검색하기',
        '카드는 집에 두고 현금만 들고 다니기 (물리적 제약이 최고)',
      ],
      compatibility: {
        myType: '충동형 소비 ⚡',
        idealPartner: '통제형 또는 균형 잡힌 상대',
        idealPartnerDesc: '당신이 "이거 사야 해!"라고 할 때 "진짜 필요해? 내일 다시 생각해보자"라고 브레이크 걸어줄 수 있는 사람. 하지만 매번 잔소리가 아니라 유머로 말해주는 센스도 필요해요.',
        datingTip: '같은 충동형을 만나면 둘 다 파산해요. 한 명은 꼭 브레이크 역할이 필요합니다.',
      },
    },
  };

  const result = labels[primary.subscale] || {
    comment: '소비 성향이 파악되었습니다.',
    recs: [],
    compatibility: undefined,
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
    compatibility: result.compatibility,
  };
}

// 테스트 3: 업무 처리 결과
function generateWorkModeResult(primary: SubscaleScore, secondary: SubscaleScore) {
  const labels: { [key: string]: { comment: string; recs: string[]; compatibility: CompatibilityInfo } } = {
    PLAN: {
      comment: '당신은 "약속 시간 10분 전 도착"이 기본이고, 캘린더 없으면 불안한 사람. 문제는 상대가 "어 깜빡했어 ㅠ 30분만 늦을게"라고 하면 당신 머릿속에서 일정이 폭발한다는 거예요. "계획 틀어짐 = 나를 무시함"으로 읽히거든요. 상대는 그냥 깜빡한 건데, 당신은 배신감 느낍니다.',
      recs: [
        '약속 변경되면 일단 "화나지 않기" 3초 숨 고르기',
        '상대에게 "나는 계획 틀어지면 스트레스야"라고 미리 말하기',
        '모든 약속에 "+30분 버퍼" 심리적으로 설정하기',
      ],
      compatibility: {
        myType: '계획형 📅',
        idealPartner: '비슷한 계획형 또는 존중하는 상대',
        idealPartnerDesc: '약속 시간 잘 지키고, 일정 공유하는 게 자연스러운 사람. 또는 즉흥적이더라도 "나 때문에 계획 바뀌면 미안하니까 미리 말할게"라고 배려해주는 파트너도 좋아요.',
        datingTip: '극단적인 즉흥형과 만나면 매일 스트레스예요. 최소한 중요한 약속은 지키는 사람을 찾으세요.',
      },
    },
    EXPL: {
      comment: '당신은 "지금 당장 답 줘"를 제일 싫어하죠. "생각 좀 해볼게"가 입버릇인데, 상대는 "왜 이렇게 답답해?"라고 느낍니다. 문제는 고민이 길어질수록 상대는 "관심 없나 봐"라고 오해한다는 거예요. 당신은 신중한 거지만, 상대는 회피로 읽습니다. 속도 차이가 갈등이 됩니다.',
      recs: [
        '결정 못 내릴 땐 "○일까지 답할게" 명확한 기한 말하기',
        '"아직 답 못 내렸어"가 아니라 "지금 이 정도까지 생각했어" 중간 보고하기',
        '작은 결정(메뉴, 영화)은 3분 안에 답하는 연습하기',
      ],
      compatibility: {
        myType: '탐색형 🔍',
        idealPartner: '기다려줄 수 있는 상대',
        idealPartnerDesc: '"천천히 생각해도 돼"라고 기다려주면서도, 가끔 "여기까지 어때?"라고 부드럽게 결정을 도와줄 수 있는 사람. 당신의 신중함을 "무관심"이 아니라 "진지함"으로 이해해주는 파트너.',
        datingTip: '급한 성격의 상대와 만나면 매번 "빨리 결정해!"로 싸워요. 여유 있는 사람을 찾으세요.',
      },
    },
    IMPR: {
      comment: '"갑자기 부산 갈래?" 이게 당신입니다. 계획? 그런 거 없어요. 떠오르면 바로 실행. 문제는 상대가 "어... 나 내일 약속 있는데"라고 하면 당신은 "재미없다"고 느낀다는 거예요. 당신의 즉흥성은 매력이지만, 상대에겐 "배려 없음"으로 읽힙니다. 타이밍 체크가 핵심.',
      recs: [
        '즉흥 제안 전에 "지금 시간 괜찮아?" 먼저 물어보기',
        '큰 결정(여행, 이사)은 하루 자고 다시 생각하기',
        '상대가 계획형이면 "최소 1일 전 예고" 규칙 지키기',
      ],
      compatibility: {
        myType: '즉흥형 🎲',
        idealPartner: '유연하고 적응력 있는 상대',
        idealPartnerDesc: '"갑자기? 좋아 가자!"라고 함께 뛸 수 있는 사람. 또는 평소엔 계획적이지만 가끔 당신의 즉흥 제안에 "오늘은 따라갈게"라고 할 수 있는 유연한 파트너도 좋아요.',
        datingTip: '완벽주의 계획형과 만나면 둘 다 답답해요. 어느 정도 유연한 사람을 찾으세요.',
      },
    },
    DEAD: {
      comment: '당신은 마감 앞두면 연락 끊기는 사람. "바쁘니까 이해하겠지" 생각하는데, 상대는 "나한테 관심 없나 봐"라고 불안해합니다. 3일 동안 "ㅇㅋ" 한 글자만 보내면 상대는 "뭔가 잘못했나?"라고 생각해요. 당신은 일에 몰입한 것뿐인데, 상대는 거리감을 느낍니다.',
      recs: [
        '바쁠 때 미리 "○일까지 마감이라 연락 줄어들 수 있어" 공지하기',
        '아무리 바빠도 하루 1번 "오늘 힘들었어. 내일 얘기할게" 짧게 보내기',
        '마감 끝나면 "이제 한가해졌어!" 회복 신호 보내기',
      ],
      compatibility: {
        myType: '마감형 ⏰',
        idealPartner: '독립적이고 이해심 있는 상대',
        idealPartnerDesc: '당신이 바쁠 때 "연락 없어도 괜찮아, 힘내"라고 기다려줄 수 있는 사람. 자기만의 일이나 취미가 있어서 당신 연락에 매달리지 않는 독립적인 파트너가 좋아요.',
        datingTip: '불안형 상대와 만나면 바쁠 때마다 "나 싫어진 거야?" 폭풍 연락이 와요. 여유 있는 사람을 찾으세요.',
      },
    },
  };

  const result = labels[primary.subscale] || {
    comment: '업무 처리 성향이 파악되었습니다.',
    recs: [],
    compatibility: undefined,
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
    compatibility: result.compatibility,
  };
}

// 테스트 4: 갈등 스타일 결과
function generateConflictStyleResult(subscales: SubscaleScore[]) {
  const avoid = subscales.find((s) => s.subscale === 'AVOID');
  const attack = subscales.find((s) => s.subscale === 'ATTACK');
  const accom = subscales.find((s) => s.subscale === 'ACCOM');

  const primary = subscales[0];
  const secondaryLabel = undefined;

  // 위험 신호 체크
  const hasRisk =
    (attack && attack.score >= 4.0) ||
    (avoid && avoid.score >= 4.0) ||
    (accom && accom.score >= 4.0);

  const labels: { [key: string]: { comment: string; recs: string[]; compatibility: CompatibilityInfo } } = {
    AVOID: {
      comment: '싸우기 시작하면 "나 화장실" 하고 도망치는 사람. 당신은 "일단 피하고 나중에 생각하자" 모드인데, 상대는 "대화 중단 = 무시"로 받아들입니다. 문제는 나중에 절대 먼저 꺼내지 않는다는 거예요. 그래서 문제는 쌓이고, 어느 날 상대가 폭발합니다. 회피는 해결이 아니라 연기일 뿐.',
      recs: [
        '도망치기 전 "30분만 시간 줘. 그 다음에 다시 얘기하자" 약속하기',
        '감정 정리 후 반드시 내가 먼저 "아까 그 얘기 계속할까?" 말 걸기',
        '회피 = 무시가 아니라는 걸 상대에게 미리 설명하기',
      ],
      compatibility: {
        myType: '회피형 대화 🚪',
        idealPartner: '차분하고 기다려주는 상대',
        idealPartnerDesc: '"시간 필요하면 기다릴게"라고 여유 있게 말해주는 사람. 당신이 도망쳐도 쫓아오지 않고, 돌아올 때까지 기다려주면서 "이제 얘기할 수 있어?"라고 부드럽게 물어봐주는 파트너.',
        datingTip: '공격형 상대와 만나면 당신은 도망치고 상대는 더 화내는 악순환이 생겨요. 차분한 사람을 찾으세요.',
      },
    },
    ATTACK: {
      comment: '화나면 말이 칼이 되는 사람. "너 때문에 다 망했어!" 이런 말, 싸울 때 한 번쯤 했죠? 당신은 순간 감정을 터뜨린 건데, 상대는 그 말을 평생 기억합니다. 문제는 당신도 나중에 후회한다는 거예요. "그냥 그때 화났던 거잖아"라고 생각하지만, 상대는 "저 사람 본심이 그거구나"라고 받아들입니다.',
      recs: [
        '화났을 때 "너는 왜"로 시작하는 문장 절대 금지',
        '말하기 전 3초 숨 고르고 "나는 ○○해서 속상해"로 바꾸기',
        '한 번 뱉은 말은 못 주워담는다는 걸 항상 기억하기',
      ],
      compatibility: {
        myType: '공격형 대화 🔥',
        idealPartner: '흔들리지 않는 안정적인 상대',
        idealPartnerDesc: '당신이 화내도 같이 흥분하지 않고 "일단 진정하고 얘기하자"라고 말할 수 있는 사람. 당신의 말에 상처받지 않을 만큼 단단하면서도, 나중에 "아까 그건 좀 심했어"라고 피드백 줄 수 있는 파트너.',
        datingTip: '같은 공격형이나 예민한 상대와 만나면 싸움이 전쟁이 돼요. 마음 넓은 사람을 찾으세요.',
      },
    },
    PERSUADE: {
      comment: '당신은 싸울 때 "논리"로 이기려는 사람. "객관적으로 봤을 때..." 이런 말 자주 하죠? 문제는 상대는 논리가 아니라 "내 감정 좀 알아줘"를 원한다는 거예요. 당신이 팩트를 늘어놓을수록 상대는 "내 마음은 관심 없나 봐"라고 느낍니다. 이기는 건데 왜 관계는 지는지 모르겠죠?',
      recs: [
        '해결책 말하기 전에 "그래서 속상했구나" 먼저 말하기',
        '"논리적으로는..."은 상대 감정 인정한 후에 꺼내기',
        '감정 vs 문제 해결, 이 둘을 분리해서 단계별로 접근하기',
      ],
      compatibility: {
        myType: '설득형 대화 💬',
        idealPartner: '논리와 감정 모두 표현하는 상대',
        idealPartnerDesc: '당신의 논리를 이해하면서도 "근데 나는 이렇게 느꼈어"라고 감정도 표현할 수 있는 사람. 토론이 건강한 대화가 될 수 있게 함께 만들어갈 수 있는 파트너.',
        datingTip: '감정적인 상대와 만나면 "넌 논리가 없어" vs "넌 마음이 없어"로 싸워요. 균형 잡힌 사람을 찾으세요.',
      },
    },
    ACCOM: {
      comment: '당신은 "괜찮아"가 입버릇. 싸우면 일단 사과하고, 상대 기분 맞춰주고, 내 불편은 삼킵니다. 문제는 참고 참다가 어느 날 "나는 항상 양보만 해!"라고 폭발한다는 거예요. 상대는 "갑자기 왜 그래?"라고 당황하고, 당신은 "내가 얼마나 참았는데"라고 억울해합니다. 양보는 미덕이지만, 자기 소진은 폭탄입니다.',
      recs: [
        '양보 전에 "이건 나한테 중요해"라고 말할 1가지 정하기',
        '작은 불편도 "나는 이렇게 느껴"라고 바로바로 표현하기',
        '"괜찮아" 말하기 전에 정말 괜찮은지 5초 생각하기',
      ],
      compatibility: {
        myType: '수용형 대화 🤝',
        idealPartner: '당신 의견을 물어봐주는 상대',
        idealPartnerDesc: '"너는 어떻게 생각해?"라고 먼저 물어봐주고, 당신이 양보하려 할 때 "진짜 괜찮아? 네 생각도 중요해"라고 확인해주는 사람. 당신의 배려를 당연시하지 않는 파트너.',
        datingTip: '이기적인 상대와 만나면 평생 양보만 하게 돼요. 당신 의견도 존중해주는 사람을 찾으세요.',
      },
    },
  };

  const result = labels[primary.subscale] || {
    comment: '갈등 대화 스타일이 파악되었습니다.',
    recs: [],
    compatibility: undefined,
  };

  const comment = hasRisk
    ? result.comment + ' (주의: 관계 손상 가능성 높은 구간)'
    : result.comment;

  return {
    primaryLabel: primary.name,
    secondaryLabel,
    comment,
    recommendations: result.recs,
    compatibility: result.compatibility,
  };
}

// 테스트 5: 번아웃 결과
function generateBurnoutResult(primary: SubscaleScore) {
  let label = '';
  let comment = '';
  let recommendations: string[] = [];
  let compatibility: CompatibilityInfo | undefined;

  if (primary.score >= 1.0 && primary.score < 2.5) {
    label = '안정 ✅';
    comment = '당신은 지금 연애할 에너지가 있는 상태. 아침에 일어나도 피곤하지 않고, "주말에 뭐하지?"라는 생각이 들면 실제로 약속을 잡을 여유가 있어요. 이 상태일 때 새로운 사람을 만나면 관계가 즐겁게 시작됩니다. 에너지가 있을 때 시작하세요.';
    recommendations = [
      '지금 상태 유지하면서 새로운 사람 만나기 시작하기',
      '에너지 떨어지기 전에 미리 휴식 루틴 지키기',
      '일주일에 최소 1번은 아무 약속 없는 날 만들기',
    ];
    compatibility = {
      myType: '에너지 충만 🔋',
      idealPartner: '다양한 에너지 레벨과 호환',
      idealPartnerDesc: '지금 당신은 어떤 상대와도 함께할 에너지가 있어요. 같이 활동적인 사람과 만나면 즐겁고, 조용한 사람과 만나도 배려할 여유가 있습니다.',
      datingTip: '에너지가 많다고 상대에게 "우리 뭐 하자!"를 너무 많이 요구하면 부담될 수 있어요. 상대 페이스도 맞춰주세요.',
    };
  } else if (primary.score >= 2.5 && primary.score < 3.6) {
    label = '주의 ⚠️';
    comment = '솔직히 말할게요. 당신 지금 피곤한 거 맞죠? "괜찮아"라고 하지만 주말에도 쉰 것 같지 않고, 약속 잡으면 "또 나가야 해?"라는 생각 들 때 있어요. 연애는 가능하지만, 지금 상태로 무리하면 상대에게 "요즘 왜 그래?"라는 말 듣게 됩니다. 속도 조절이 필수.';
    recommendations = [
      '주 2회 이상 약속은 거절하고 혼자 쉬는 시간 확보하기',
      '상대에게 "요즘 에너지가 좀 부족해"라고 솔직히 말하기',
      '매일 최소 7시간 수면 지키기 (협상 불가)',
    ];
    compatibility = {
      myType: '에너지 주의 ⚡',
      idealPartner: '이해심 있고 여유로운 상대',
      idealPartnerDesc: '"오늘 피곤해? 그럼 집에서 쉬자"라고 이해해주는 사람. 매번 "나가자, 뭐하자"가 아니라 가끔은 함께 쉴 줄 아는 파트너가 좋아요.',
      datingTip: '에너지 넘치는 상대와 만나면 따라가다가 지쳐요. 당신 페이스를 존중해주는 사람을 찾으세요.',
    };
  } else {
    label = '위험 🔴';
    comment = '지금 당신은 탈진 직전입니다. "그냥 누워있고 싶다"는 생각이 자주 들고, 친구 연락도 귀찮아요. 이 상태에서 연애하면 상대가 "에너지 뱀파이어"처럼 느껴집니다. 상대가 나쁜 게 아니라, 당신이 비어 있는 거예요. 지금은 연애 말고 나를 채울 시간. 1주일만 나에게 집중하세요.';
    recommendations = [
      '모든 약속 취소하고 7일 동안 나만 돌보기',
      '잠, 밥, 산책 이 3가지만 챙기기 (다른 건 나중에)',
      '에너지 회복 전까지 새로운 관계 시작 절대 금지',
    ];
    compatibility = {
      myType: '에너지 고갈 🪫',
      idealPartner: '지금은 연애보다 회복이 먼저',
      idealPartnerDesc: '솔직히 말하면, 지금 상태에서 만나는 건 추천하지 않아요. 어떤 좋은 상대를 만나도 당신이 에너지가 없으면 부담으로 느껴질 거예요.',
      datingTip: '지금 연애를 시작하면 "왜 연락해?" "왜 만나자고 해?"가 됩니다. 먼저 회복하고, 에너지가 생기면 그때 시작하세요.',
    };
  }

  return {
    primaryLabel: label,
    comment,
    recommendations,
    compatibility,
  };
}
