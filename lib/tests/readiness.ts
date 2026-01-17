import { TestScore, SubscaleScore } from './scoring';

export interface ReadinessResult {
  score: number; // 0-100
  modeLabel: string;
  emoji: string;
  message: string;
  blockedReason?: string;
  // 새로운 상세 분석 데이터
  breakdown?: ReadinessBreakdown;
}

/**
 * 연애 준비도 상세 분석 (각 영역별 점수)
 * 심리학적 다차원 모델 기반
 */
export interface ReadinessBreakdown {
  // 각 영역별 0-100 점수
  emotionalStability: number;     // 정서적 안정성 (Test 1, 5)
  selfRegulation: number;         // 자기조절 능력 (Test 2, 3)
  relationshipSkills: number;     // 관계 기술 (Test 4)
  psychologicalResources: number; // 심리적 여력 (Test 5)
  interactionBonus: number;       // 테스트 간 상호작용 보정
  // 각 영역 인사이트
  insights: AreaInsight[];
}

export interface AreaInsight {
  area: string;
  score: number;
  status: 'strength' | 'neutral' | 'growth';
  message: string;
  tip?: string;
}

/**
 * 심리학 이론 기반 연애 준비도 계산
 *
 * 이론적 배경:
 * 1. Transtheoretical Model (Prochaska & DiClemente) - 변화 준비도
 * 2. Self-Determination Theory (Deci & Ryan) - 자기결정과 내적 동기
 * 3. Attachment Theory (Bowlby, Ainsworth) - 애착 유형
 * 4. Emotional Intelligence Theory (Goleman) - 정서 지능
 *
 * 가중치 분배:
 * - 정서적 안정성: 30% (애착 패턴 + 번아웃 영향)
 * - 자기조절 능력: 20% (소비/업무 성향)
 * - 관계 기술: 25% (갈등 대화 스타일)
 * - 심리적 여력: 25% (에너지 레벨)
 */
export function calculateReadiness(testScores: {
  [testType: number]: TestScore;
}): ReadinessResult {
  const breakdown = calculateBreakdown(testScores);

  // 가중 평균 계산
  const weightedScore =
    breakdown.emotionalStability * 0.30 +
    breakdown.selfRegulation * 0.20 +
    breakdown.relationshipSkills * 0.25 +
    breakdown.psychologicalResources * 0.25 +
    breakdown.interactionBonus;

  // 최종 점수 (0-100 범위로 조정)
  const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));

  // 모드 라벨 결정
  const { modeLabel, emoji, message, blockedReason } = determineMode(
    finalScore,
    breakdown,
    testScores
  );

  return {
    score: finalScore,
    modeLabel,
    emoji,
    message,
    blockedReason,
    breakdown,
  };
}

/**
 * 각 영역별 점수 계산
 */
function calculateBreakdown(testScores: {
  [testType: number]: TestScore;
}): ReadinessBreakdown {
  const insights: AreaInsight[] = [];

  // 1. 정서적 안정성 (Emotional Stability) - Test 1 + Test 5 일부
  const emotionalStability = calculateEmotionalStability(testScores, insights);

  // 2. 자기조절 능력 (Self-Regulation) - Test 2, 3
  const selfRegulation = calculateSelfRegulation(testScores, insights);

  // 3. 관계 기술 (Relationship Skills) - Test 4
  const relationshipSkills = calculateRelationshipSkills(testScores, insights);

  // 4. 심리적 여력 (Psychological Resources) - Test 5
  const psychologicalResources = calculatePsychologicalResources(testScores, insights);

  // 5. 테스트 간 상호작용 보정
  const interactionBonus = calculateInteractionEffects(testScores, insights);

  return {
    emotionalStability,
    selfRegulation,
    relationshipSkills,
    psychologicalResources,
    interactionBonus,
    insights,
  };
}

/**
 * 1. 정서적 안정성 계산 (Attachment Theory + Emotional Regulation)
 *
 * 애착 이론(Bowlby, Ainsworth)에 따르면:
 * - 안정형: 자신과 타인에 대한 긍정적 모델 → 최고점
 * - 불안형: 자신에 대한 부정적 모델 → 중간
 * - 회피형: 타인에 대한 부정적 모델 → 중간
 * - 혼합형: 둘 다 부정적 → 낮은 점수
 */
function calculateEmotionalStability(
  testScores: { [testType: number]: TestScore },
  insights: AreaInsight[]
): number {
  const emotionTest = testScores[1];
  const burnoutTest = testScores[5];

  if (!emotionTest) return 50;

  const anx = findSubscale(emotionTest.subscales, 'ANX');
  const avd = findSubscale(emotionTest.subscales, 'AVD');
  const imm = findSubscale(emotionTest.subscales, 'IMM');
  const perf = findSubscale(emotionTest.subscales, 'PERF');

  let score = 100;
  let insightMessage = '';
  let tip = '';

  // 불안 점수 영향 (비선형 - 높을수록 급격히 감소)
  if (anx) {
    // 불안 점수를 정규화하고 2차 함수로 영향 계산
    const anxImpact = Math.pow((anx.score - 1) / 4, 1.5) * 35;
    score -= anxImpact;
  }

  // 회피 점수 영향
  if (avd) {
    const avdImpact = Math.pow((avd.score - 1) / 4, 1.5) * 30;
    score -= avdImpact;
  }

  // 불안+회피 혼합 시 추가 감점 (상호작용 효과)
  if (anx && avd && anx.score >= 3.2 && avd.score >= 3.2) {
    const mixedPenalty = Math.min(15, (anx.score - 3.2) * (avd.score - 3.2) * 5);
    score -= mixedPenalty;
    insightMessage = '가까워지고 싶지만 동시에 부담스러운 마음이 공존해요.';
    tip = '이 패턴을 인식하고 상대에게 미리 설명하면 오해가 줄어듭니다.';
  } else if (anx && anx.score >= 3.5) {
    insightMessage = '관계의 안전을 자주 확인하고 싶은 마음이 있어요.';
    tip = '확인 충동이 올 때 "6시간 규칙"을 적용해보세요.';
  } else if (avd && avd.score >= 3.5) {
    insightMessage = '혼자 감정을 정리하는 시간이 필요한 타입이에요.';
    tip = '거리 두기 전 "30분 후에 다시 얘기하자"라고 말해보세요.';
  } else {
    insightMessage = '정서적으로 안정된 상태를 유지하고 있어요.';
  }

  // 과몰입 경향 (가중치 낮게)
  if (imm && imm.score >= 3.8) {
    score -= (imm.score - 3.8) * 8;
  }

  // 완벽주의 경향 (약한 영향)
  if (perf && perf.score >= 4.0) {
    score -= (perf.score - 4.0) * 5;
  }

  // 번아웃이 정서 안정성에 미치는 영향 (20% 반영)
  if (burnoutTest) {
    const burnScore = findSubscale(burnoutTest.subscales, 'BURN');
    if (burnScore) {
      const burnoutImpact = ((burnScore.score - 1) / 4) * 20;
      score -= burnoutImpact;
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));

  insights.push({
    area: '정서적 안정성',
    score: Math.round(finalScore),
    status: finalScore >= 70 ? 'strength' : finalScore >= 45 ? 'neutral' : 'growth',
    message: insightMessage,
    tip,
  });

  return finalScore;
}

/**
 * 2. 자기조절 능력 계산 (Self-Regulation Theory)
 *
 * Baumeister의 자기조절 이론에 따르면:
 * - 높은 자기조절 = 장기적 관계 유지 능력
 * - 충동성 = 관계 초반 과투자 위험
 * - 계획성 = 안정적 관계 설계 능력
 */
function calculateSelfRegulation(
  testScores: { [testType: number]: TestScore },
  insights: AreaInsight[]
): number {
  let score = 75; // 기본 중립 점수
  let insightMessage = '';
  let tip = '';

  // Test 2: 소비 성향
  const spendingTest = testScores[2];
  if (spendingTest && spendingTest.subscales.length > 0) {
    const ctrl = findSubscale(spendingTest.subscales, 'CTRL');
    const impl = findSubscale(spendingTest.subscales, 'IMPL');
    const comf = findSubscale(spendingTest.subscales, 'COMF');

    // 통제형: 자기조절 능력 높음
    if (ctrl && ctrl.score >= 3.5) {
      score += (ctrl.score - 3.5) * 10;
    }

    // 충동형: 자기조절 능력 낮음
    if (impl && impl.score >= 3.5) {
      score -= (impl.score - 3.5) * 12;
      insightMessage = '순간적인 결정을 내리는 경향이 있어요.';
      tip = '큰 결정 전 "하루 숙고 규칙"을 적용해보세요.';
    }

    // 위로형 소비: 감정조절에 소비 의존
    if (comf && comf.score >= 3.8) {
      score -= (comf.score - 3.8) * 8;
    }
  }

  // Test 3: 업무 처리 방식
  const workTest = testScores[3];
  if (workTest && workTest.subscales.length > 0) {
    const plan = findSubscale(workTest.subscales, 'PLAN');
    const expl = findSubscale(workTest.subscales, 'EXPL');
    const impr = findSubscale(workTest.subscales, 'IMPR');
    // dead(마감형)는 자기조절과 직접 연관 없음 - 중립 처리

    // 계획형: 높은 자기조절
    if (plan && plan.score >= 3.5) {
      score += (plan.score - 3.5) * 8;
      if (!insightMessage) {
        insightMessage = '체계적으로 계획하고 실행하는 능력이 있어요.';
      }
    }

    // 탐색형: 신중한 자기조절
    if (expl && expl.score >= 3.5) {
      score += (expl.score - 3.5) * 5;
    }

    // 즉흥형: 유연하지만 자기조절 낮음
    if (impr && impr.score >= 3.8) {
      score -= (impr.score - 3.8) * 6;
    }

    // 마감형: 중립 (상황에 따라 다름)
    // 마감형은 자기조절이 부족한 게 아니라 다른 스타일
  }

  if (!insightMessage) {
    insightMessage = '적절한 자기조절 능력을 보유하고 있어요.';
  }

  const finalScore = Math.max(0, Math.min(100, score));

  insights.push({
    area: '자기조절 능력',
    score: Math.round(finalScore),
    status: finalScore >= 70 ? 'strength' : finalScore >= 45 ? 'neutral' : 'growth',
    message: insightMessage,
    tip,
  });

  return finalScore;
}

/**
 * 3. 관계 기술 계산 (Conflict Resolution & Communication Skills)
 *
 * Gottman의 관계 연구에 따르면:
 * - 긍정:부정 비율 5:1 이상이면 안정적 관계
 * - 비난, 방어, 담쌓기, 경멸이 관계 파괴 예측 요인
 */
function calculateRelationshipSkills(
  testScores: { [testType: number]: TestScore },
  insights: AreaInsight[]
): number {
  const conflictTest = testScores[4];
  if (!conflictTest) {
    insights.push({
      area: '관계 기술',
      score: 50,
      status: 'neutral',
      message: '갈등 스타일 데이터가 없습니다.',
    });
    return 50;
  }

  let score = 75;
  let insightMessage = '';
  let tip = '';

  const persuade = findSubscale(conflictTest.subscales, 'PERSUADE');
  const accom = findSubscale(conflictTest.subscales, 'ACCOM');
  const avoid = findSubscale(conflictTest.subscales, 'AVOID');
  const attack = findSubscale(conflictTest.subscales, 'ATTACK');

  // 설득형 (협력적 대화): 가장 건강한 갈등 해결
  if (persuade && persuade.score >= 3.5) {
    score += (persuade.score - 3.5) * 12;
    insightMessage = '논리적으로 소통하며 문제를 해결하려는 능력이 있어요.';
  }

  // 수용형: 관계 유지 능력 있지만 과도하면 문제
  if (accom) {
    if (accom.score >= 4.0) {
      // 과도한 양보는 오히려 관계에 해로움
      score -= (accom.score - 4.0) * 10;
      insightMessage = '상대를 배려하지만, 자신의 욕구도 표현할 필요가 있어요.';
      tip = '"괜찮아" 말하기 전 정말 괜찮은지 5초 생각해보세요.';
    } else if (accom.score >= 3.2) {
      score += (accom.score - 3.2) * 5;
    }
  }

  // 회피형: Gottman의 "담쌓기" - 관계 손상 예측 요인
  if (avoid && avoid.score >= 3.5) {
    score -= (avoid.score - 3.5) * 15;
    if (avoid.score >= 4.0) {
      insightMessage = '갈등을 피하는 경향이 문제를 쌓이게 할 수 있어요.';
      tip = '도망치기 전 "30분 후에 다시 얘기하자" 약속하기';
    }
  }

  // 공격형: Gottman의 "비난/방어" - 가장 해로운 패턴
  if (attack && attack.score >= 3.5) {
    score -= (attack.score - 3.5) * 18;
    insightMessage = '감정이 올라올 때 말이 강해지는 경향이 있어요.';
    tip = '화났을 때 "너는 왜"로 시작하는 문장 대신 "나는 ~해서 속상해"로 바꿔보세요.';
  }

  // 공격+회피 조합: 최악의 조합
  if (attack && avoid && attack.score >= 3.5 && avoid.score >= 3.5) {
    score -= 10;
  }

  if (!insightMessage) {
    insightMessage = '균형 잡힌 대화 스타일을 가지고 있어요.';
  }

  const finalScore = Math.max(0, Math.min(100, score));

  insights.push({
    area: '관계 기술',
    score: Math.round(finalScore),
    status: finalScore >= 70 ? 'strength' : finalScore >= 45 ? 'neutral' : 'growth',
    message: insightMessage,
    tip,
  });

  return finalScore;
}

/**
 * 4. 심리적 여력 계산 (Energy & Resources)
 *
 * Conservation of Resources Theory (Hobfoll)에 따르면:
 * - 자원이 소진되면 새로운 투자가 어려움
 * - 번아웃 상태에서는 관계 투자 능력 저하
 */
function calculatePsychologicalResources(
  testScores: { [testType: number]: TestScore },
  insights: AreaInsight[]
): number {
  const burnoutTest = testScores[5];
  if (!burnoutTest) {
    insights.push({
      area: '심리적 여력',
      score: 50,
      status: 'neutral',
      message: '에너지 상태 데이터가 없습니다.',
    });
    return 50;
  }

  const burnScore = findSubscale(burnoutTest.subscales, 'BURN');
  if (!burnScore) {
    return 50;
  }

  // 번아웃 점수를 에너지 점수로 변환 (비선형)
  // 낮은 번아웃 = 높은 에너지
  const burnoutLevel = (burnScore.score - 1) / 4; // 0-1 정규화

  // S-curve 적용: 중간 구간에서 변화가 크고, 극단에서는 완만
  const energyScore = 100 * (1 - Math.pow(burnoutLevel, 1.3));

  let insightMessage = '';
  let tip = '';

  if (energyScore >= 75) {
    insightMessage = '에너지가 충만해서 새로운 관계에 투자할 여력이 있어요.';
  } else if (energyScore >= 50) {
    insightMessage = '적절한 에너지 수준을 유지하고 있지만 관리가 필요해요.';
    tip = '주 2회 이상 약속은 거절하고 혼자 쉬는 시간을 확보하세요.';
  } else if (energyScore >= 30) {
    insightMessage = '에너지가 많이 소진된 상태예요. 회복이 우선이에요.';
    tip = '매일 최소 7시간 수면을 지키세요.';
  } else {
    insightMessage = '지금은 연애보다 나를 돌보는 시간이 필요해요.';
    tip = '모든 약속을 최소화하고 잠, 밥, 산책 이 3가지만 챙기세요.';
  }

  insights.push({
    area: '심리적 여력',
    score: Math.round(energyScore),
    status: energyScore >= 70 ? 'strength' : energyScore >= 45 ? 'neutral' : 'growth',
    message: insightMessage,
    tip,
  });

  return energyScore;
}

/**
 * 5. 테스트 간 상호작용 효과 (Interaction Effects)
 *
 * 심리학에서 성격 특성들은 독립적이지 않고 상호작용합니다.
 * 특정 조합은 위험을 증폭시키고, 다른 조합은 보호 요인이 됩니다.
 */
function calculateInteractionEffects(
  testScores: { [testType: number]: TestScore },
  insights: AreaInsight[]
): number {
  let bonus = 0;
  const interactionMessages: string[] = [];

  const emotionTest = testScores[1];
  const spendingTest = testScores[2];
  const workTest = testScores[3];
  const conflictTest = testScores[4];
  const burnoutTest = testScores[5];

  // === 위험 조합 (Risky Combinations) ===

  // 1. 불안형 + 공격형 = 감정 폭발 위험
  if (emotionTest && conflictTest) {
    const anx = findSubscale(emotionTest.subscales, 'ANX');
    const attack = findSubscale(conflictTest.subscales, 'ATTACK');
    if (anx && attack && anx.score >= 3.5 && attack.score >= 3.5) {
      bonus -= 8;
      interactionMessages.push('불안한 마음이 공격적 표현으로 나타날 수 있어요');
    }
  }

  // 2. 회피형(애착) + 회피형(갈등) = 대화 단절 위험
  if (emotionTest && conflictTest) {
    const avd = findSubscale(emotionTest.subscales, 'AVD');
    const avoid = findSubscale(conflictTest.subscales, 'AVOID');
    if (avd && avoid && avd.score >= 3.5 && avoid.score >= 3.5) {
      bonus -= 10;
      interactionMessages.push('감정과 대화 모두 회피하면 관계가 멀어질 수 있어요');
    }
  }

  // 3. 과몰입 + 충동소비 = 관계 과투자 위험
  if (emotionTest && spendingTest) {
    const imm = findSubscale(emotionTest.subscales, 'IMM');
    const impl = findSubscale(spendingTest.subscales, 'IMPL');
    if (imm && impl && imm.score >= 3.8 && impl.score >= 3.8) {
      bonus -= 7;
      interactionMessages.push('관계에 과도하게 투자하는 패턴이 있어요');
    }
  }

  // 4. 완벽주의 + 마감형 = 자기비판 과잉
  if (emotionTest && workTest) {
    const perf = findSubscale(emotionTest.subscales, 'PERF');
    const dead = findSubscale(workTest.subscales, 'DEAD');
    if (perf && dead && perf.score >= 3.8 && dead.score >= 3.8) {
      bonus -= 5;
      interactionMessages.push('높은 기준과 미루기 습관이 자기비판을 유발할 수 있어요');
    }
  }

  // 5. 번아웃 + 수용형 과다 = 소진 가속
  if (burnoutTest && conflictTest) {
    const burn = findSubscale(burnoutTest.subscales, 'BURN');
    const accom = findSubscale(conflictTest.subscales, 'ACCOM');
    if (burn && accom && burn.score >= 3.0 && accom.score >= 4.0) {
      bonus -= 8;
      interactionMessages.push('지친 상태에서 계속 양보하면 더 소진돼요');
    }
  }

  // === 보호 조합 (Protective Combinations) ===

  // 1. 안정형 애착 + 협력적 대화 = 최적 조합
  if (emotionTest && conflictTest) {
    const anx = findSubscale(emotionTest.subscales, 'ANX');
    const avd = findSubscale(emotionTest.subscales, 'AVD');
    const persuade = findSubscale(conflictTest.subscales, 'PERSUADE');

    // 안정형 체크 (불안, 회피 둘 다 낮음)
    const isSecure = (!anx || anx.score < 3.2) && (!avd || avd.score < 3.2);

    if (isSecure && persuade && persuade.score >= 3.5) {
      bonus += 10;
      interactionMessages.push('안정적인 마음과 협력적 대화 능력을 갖추고 있어요 ✨');
    }
  }

  // 2. 계획형 + 통제형 소비 = 안정적 생활 관리
  if (workTest && spendingTest) {
    const plan = findSubscale(workTest.subscales, 'PLAN');
    const ctrl = findSubscale(spendingTest.subscales, 'CTRL');
    if (plan && ctrl && plan.score >= 3.5 && ctrl.score >= 3.5) {
      bonus += 5;
      interactionMessages.push('체계적인 생활 관리 능력이 있어요');
    }
  }

  // 3. 높은 에너지 + 안정형 = 연애 최적기
  if (burnoutTest && emotionTest) {
    const burn = findSubscale(burnoutTest.subscales, 'BURN');
    const anx = findSubscale(emotionTest.subscales, 'ANX');
    const avd = findSubscale(emotionTest.subscales, 'AVD');

    const isSecure = (!anx || anx.score < 3.2) && (!avd || avd.score < 3.2);
    const hasEnergy = burn && burn.score < 2.5;

    if (isSecure && hasEnergy) {
      bonus += 8;
      interactionMessages.push('지금은 새로운 관계를 시작하기 최적의 상태예요! 🌟');
    }
  }

  // 상호작용 인사이트 추가
  if (interactionMessages.length > 0) {
    insights.push({
      area: '마음 상태 연결',
      score: Math.round(50 + bonus), // 50 기준으로 보정
      status: bonus > 0 ? 'strength' : bonus < -10 ? 'growth' : 'neutral',
      message: interactionMessages[0],
      tip: interactionMessages.length > 1 ? interactionMessages[1] : undefined,
    });
  }

  return bonus;
}

/**
 * 모드 결정 (점수와 상세 분석 기반)
 */
function determineMode(
  score: number,
  breakdown: ReadinessBreakdown,
  testScores: { [testType: number]: TestScore }
): { modeLabel: string; emoji: string; message: string; blockedReason?: string } {
  let modeLabel = '';
  let emoji = '';
  let message = '';
  let blockedReason: string | undefined;

  // 특별 케이스: 심각한 번아웃
  const burnoutTest = testScores[5];
  const burnScore = burnoutTest ? findSubscale(burnoutTest.subscales, 'BURN') : null;
  const isSevereBurnout = burnScore && burnScore.score >= 4.0;

  if (isSevereBurnout) {
    modeLabel = '회복 필수';
    emoji = '🛑';
    message = '지금은 연애보다 나를 돌보는 시간이 절대적으로 필요해요. 최소 2주간 휴식을 권장합니다.';
    blockedReason = '심각한 에너지 고갈';
    return { modeLabel, emoji, message, blockedReason };
  }

  // 일반 케이스
  if (score >= 80) {
    modeLabel = '적극 추천';
    emoji = '🔥';
    message = generateHighScoreMessage(breakdown);
  } else if (score >= 65) {
    modeLabel = '추천';
    emoji = '💚';
    message = generateMediumHighScoreMessage(breakdown);
  } else if (score >= 50) {
    modeLabel = '천천히';
    emoji = '🌿';
    message = generateMediumScoreMessage(breakdown);
  } else if (score >= 35) {
    modeLabel = '주의 필요';
    emoji = '⚠️';
    message = generateLowScoreMessage(breakdown);
    blockedReason = identifyBlockedReason(breakdown);
  } else {
    modeLabel = '회복 권장';
    emoji = '🧘';
    message = '지금은 새로운 관계보다 자신을 돌보는 시간이 필요해요. 에너지를 회복한 후에 다시 시작하세요.';
    blockedReason = identifyBlockedReason(breakdown);
  }

  return { modeLabel, emoji, message, blockedReason };
}

/**
 * 높은 점수 메시지 생성
 */
function generateHighScoreMessage(breakdown: ReadinessBreakdown): string {
  const strengths: string[] = [];

  if (breakdown.emotionalStability >= 70) strengths.push('정서적으로 안정되어');
  if (breakdown.selfRegulation >= 70) strengths.push('자기조절 능력이 뛰어나');
  if (breakdown.relationshipSkills >= 70) strengths.push('건강한 대화 능력을 갖추어');
  if (breakdown.psychologicalResources >= 70) strengths.push('에너지가 충만하여');

  if (strengths.length >= 2) {
    return `${strengths.slice(0, 2).join(', ')} 있어요. 지금은 새로운 관계를 시작하기 정말 좋은 시기입니다!`;
  }
  return '전반적으로 연애 준비 상태가 매우 좋습니다. 자신감을 가지고 새로운 만남을 시작해보세요!';
}

function generateMediumHighScoreMessage(breakdown: ReadinessBreakdown): string {
  const growth = breakdown.insights.find(i => i.status === 'growth');
  if (growth) {
    return `대체로 준비가 되어 있지만, ${growth.area}(을)를 조금 더 챙기면 더 좋은 관계를 만들 수 있어요.`;
  }
  return '연애 준비 상태가 양호합니다. 천천히 관계를 시작해도 괜찮아요.';
}

function generateMediumScoreMessage(breakdown: ReadinessBreakdown): string {
  const growthAreas = breakdown.insights.filter(i => i.status === 'growth');
  if (growthAreas.length > 0) {
    return `${growthAreas[0].area}에 주의가 필요해요. ${growthAreas[0].tip || '자신을 돌보면서 천천히 진행하세요.'}`;
  }
  return '급하게 시작하기보다 천천히, 여유있게 관계를 시작해보세요.';
}

function generateLowScoreMessage(breakdown: ReadinessBreakdown): string {
  const growthAreas = breakdown.insights.filter(i => i.status === 'growth');
  if (growthAreas.length >= 2) {
    return `${growthAreas[0].area}과 ${growthAreas[1].area}을 먼저 돌봐주세요. 지금 관계를 시작하면 서로 상처받을 수 있어요.`;
  } else if (growthAreas.length === 1) {
    return `${growthAreas[0].area}이 많이 지친 상태예요. 이 부분을 회복한 후 연애를 시작하는 게 좋겠어요.`;
  }
  return '지금은 자신을 돌보는 시간이 필요해요.';
}

function identifyBlockedReason(breakdown: ReadinessBreakdown): string {
  const reasons: string[] = [];

  if (breakdown.emotionalStability < 40) reasons.push('정서적 불안정');
  if (breakdown.selfRegulation < 40) reasons.push('자기조절 어려움');
  if (breakdown.relationshipSkills < 40) reasons.push('대화 스킬 보완 필요');
  if (breakdown.psychologicalResources < 40) reasons.push('에너지 부족');

  return reasons.join(', ') || '전반적인 준비 부족';
}

/**
 * 유틸리티: subscale 찾기
 */
function findSubscale(subscales: SubscaleScore[], key: string): SubscaleScore | undefined {
  return subscales.find(s => s.subscale === key);
}
