/**
 * 나지연 성격 유형 시스템
 * 5가지 테스트 결과를 종합하여 고유한 성격 유형 생성
 */

export interface PersonalityType {
  code: string; // 예: "SEC-HIG-COL"
  name: string; // 예: "활력 넘치는 안정형"
  emoji: string;
  summary: string;
  description: string;
  strengths: string[];
  challenges: string[];
  relationshipTips: string[];
}

/**
 * 감정 애착 유형 (Test 1 기반)
 */
export type AttachmentStyle = 'SECURE' | 'ANXIOUS' | 'AVOIDANT' | 'MIXED';

/**
 * 에너지 레벨 (Test 5 기반)
 */
export type EnergyLevel = 'HIGH' | 'MODERATE' | 'LOW';

/**
 * 갈등 대처 스타일 (Test 4 기반)
 */
export type ConflictStyle = 'COLLABORATIVE' | 'ASSERTIVE' | 'ACCOMMODATING' | 'AVOIDING';

/**
 * 생활 방식 (Test 3 기반)
 */
export type LifestyleMode = 'PLANNER' | 'EXPLORER' | 'IMPROVISER' | 'DEADLINE';

/**
 * 소비 패턴 (Test 2 기반)
 */
export type SpendingPattern = 'COMFORT' | 'APPROVAL' | 'CONTROL' | 'IMPULSE';

export interface TypeComponents {
  attachment: AttachmentStyle;
  energy: EnergyLevel;
  conflict: ConflictStyle;
  lifestyle: LifestyleMode;
  spending: SpendingPattern;
}

/**
 * 테스트 결과로부터 감정 애착 유형 결정
 */
export function determineAttachmentStyle(
  anxScore: number,
  avdScore: number
): AttachmentStyle {
  if (anxScore >= 3.6 && avdScore < 3.2) return 'ANXIOUS';
  if (avdScore >= 3.6 && anxScore < 3.2) return 'AVOIDANT';
  if (anxScore >= 3.6 && avdScore >= 3.6) return 'MIXED';
  return 'SECURE';
}

/**
 * 번아웃 점수로부터 에너지 레벨 결정
 */
export function determineEnergyLevel(burnoutScore: number): EnergyLevel {
  if (burnoutScore < 2.5) return 'HIGH';
  if (burnoutScore < 3.6) return 'MODERATE';
  return 'LOW';
}

/**
 * 갈등 테스트 결과로부터 스타일 결정
 */
export function determineConflictStyle(primaryConflict: string): ConflictStyle {
  switch (primaryConflict) {
    case 'PERSUADE':
      return 'COLLABORATIVE';
    case 'ATTACK':
      return 'ASSERTIVE';
    case 'ACCOM':
      return 'ACCOMMODATING';
    case 'AVOID':
      return 'AVOIDING';
    default:
      return 'COLLABORATIVE';
  }
}

/**
 * 업무 처리 결과로부터 생활 방식 결정
 */
export function determineLifestyleMode(primaryWork: string): LifestyleMode {
  switch (primaryWork) {
    case 'PLAN':
      return 'PLANNER';
    case 'EXPL':
      return 'EXPLORER';
    case 'IMPR':
      return 'IMPROVISER';
    case 'DEAD':
      return 'DEADLINE';
    default:
      return 'PLANNER';
  }
}

/**
 * 소비 테스트 결과로부터 패턴 결정
 */
export function determineSpendingPattern(primarySpending: string): SpendingPattern {
  switch (primarySpending) {
    case 'COMF':
      return 'COMFORT';
    case 'APPR':
      return 'APPROVAL';
    case 'CTRL':
      return 'CONTROL';
    case 'IMPL':
      return 'IMPULSE';
    default:
      return 'CONTROL';
  }
}

/**
 * 유형 코드 생성
 */
export function generateTypeCode(components: TypeComponents): string {
  const shortCodes = {
    // Attachment
    SECURE: 'SEC',
    ANXIOUS: 'ANX',
    AVOIDANT: 'AVD',
    MIXED: 'MIX',
    // Energy
    HIGH: 'HI',
    MODERATE: 'MD',
    LOW: 'LO',
    // Conflict
    COLLABORATIVE: 'CO',
    ASSERTIVE: 'AS',
    ACCOMMODATING: 'AC',
    AVOIDING: 'AV',
  };

  return `${shortCodes[components.attachment]}-${shortCodes[components.energy]}-${shortCodes[components.conflict]}`;
}

/**
 * 유형 이름 생성 (한국어)
 */
export function generateTypeName(components: TypeComponents): string {
  const attachmentNames = {
    SECURE: '안정형',
    ANXIOUS: '확인형',
    AVOIDANT: '독립형',
    MIXED: '밀당형',
  };

  const energyNames = {
    HIGH: '활력',
    MODERATE: '균형',
    LOW: '회복기',
  };

  const conflictNames = {
    COLLABORATIVE: '대화형',
    ASSERTIVE: '솔직형',
    ACCOMMODATING: '배려형',
    AVOIDING: '정리형',
  };

  return `${energyNames[components.energy]} 넘치는 ${attachmentNames[components.attachment]} ${conflictNames[components.conflict]}`;
}

/**
 * 유형 이모지 결정
 */
export function generateTypeEmoji(components: TypeComponents): string {
  // 에너지와 애착 스타일 조합으로 이모지 선택
  if (components.energy === 'HIGH' && components.attachment === 'SECURE') return '🌟';
  if (components.energy === 'HIGH' && components.attachment === 'ANXIOUS') return '⚡';
  if (components.energy === 'HIGH' && components.attachment === 'AVOIDANT') return '🦅';
  if (components.energy === 'HIGH' && components.attachment === 'MIXED') return '🎭';

  if (components.energy === 'MODERATE' && components.attachment === 'SECURE') return '🌈';
  if (components.energy === 'MODERATE' && components.attachment === 'ANXIOUS') return '💫';
  if (components.energy === 'MODERATE' && components.attachment === 'AVOIDANT') return '🌙';
  if (components.energy === 'MODERATE' && components.attachment === 'MIXED') return '🎨';

  if (components.energy === 'LOW' && components.attachment === 'SECURE') return '🌿';
  if (components.energy === 'LOW' && components.attachment === 'ANXIOUS') return '🕊️';
  if (components.energy === 'LOW' && components.attachment === 'AVOIDANT') return '🦋';
  if (components.energy === 'LOW' && components.attachment === 'MIXED') return '🌸';

  return '💝';
}

/**
 * 완전한 성격 유형 생성
 */
export function generatePersonalityType(components: TypeComponents): PersonalityType {
  const code = generateTypeCode(components);
  const name = generateTypeName(components);
  const emoji = generateTypeEmoji(components);

  // 유형별 설명 생성
  const description = generateTypeDescription(components);
  const strengths = generateStrengths(components);
  const challenges = generateChallenges(components);
  const relationshipTips = generateRelationshipTips(components);

  return {
    code,
    name,
    emoji,
    summary: generateSummary(components),
    description,
    strengths,
    challenges,
    relationshipTips,
  };
}

function generateSummary(components: TypeComponents): string {
  const attachmentDesc = {
    SECURE: '관계에서 안정감을 느끼며',
    ANXIOUS: '관계의 확인을 중요하게 여기며',
    AVOIDANT: '독립성을 소중히 하며',
    MIXED: '가까움과 거리 사이에서 균형을 찾으며',
  };

  const energyDesc = {
    HIGH: '충만한 에너지로',
    MODERATE: '균형 잡힌 페이스로',
    LOW: '회복과 재충전에 집중하며',
  };

  return `${attachmentDesc[components.attachment]} ${energyDesc[components.energy]} 살아가는 사람`;
}

function generateTypeDescription(components: TypeComponents): string {
  // 간단한 기본 설명 - 실제로는 더 풍부하게 작성
  return `당신은 ${generateTypeName(components)}입니다. 관계에서는 ${
    components.attachment === 'SECURE'
      ? '안정적이고 신뢰를 바탕으로 행동하며'
      : components.attachment === 'ANXIOUS'
      ? '확인과 소통을 중요하게 여기며'
      : components.attachment === 'AVOIDANT'
      ? '개인 공간과 독립성을 존중받기를 원하며'
      : '친밀함과 거리 사이의 균형을 찾으려 하며'
  }, 현재는 ${
    components.energy === 'HIGH'
      ? '높은 에너지 레벨을 유지하고 있습니다'
      : components.energy === 'MODERATE'
      ? '적절한 에너지 밸런스를 유지하고 있습니다'
      : '에너지 회복이 필요한 시기입니다'
  }.`;
}

function generateStrengths(components: TypeComponents): string[] {
  const strengths: string[] = [];

  // 애착 스타일 기반 강점
  if (components.attachment === 'SECURE') {
    strengths.push('갈등 상황에서도 차분하게 대화할 수 있음');
    strengths.push('상대방을 신뢰하고 안정적인 관계 유지');
  } else if (components.attachment === 'ANXIOUS') {
    strengths.push('관계에 대한 높은 관심과 헌신');
    strengths.push('감정 표현이 솔직하고 명확함');
  } else if (components.attachment === 'AVOIDANT') {
    strengths.push('독립적으로 문제 해결 가능');
    strengths.push('개인 시간을 효과적으로 활용');
  } else {
    strengths.push('다양한 관계 스타일에 적응 가능');
    strengths.push('깊이와 공간 모두를 이해함');
  }

  // 에너지 레벨 기반 강점
  if (components.energy === 'HIGH') {
    strengths.push('새로운 활동과 관계에 적극적');
    strengths.push('긍정적인 에너지를 주변에 전파');
  }

  // 갈등 스타일 기반 강점
  if (components.conflict === 'COLLABORATIVE') {
    strengths.push('문제 해결 시 협력적 접근');
  } else if (components.conflict === 'ASSERTIVE') {
    strengths.push('자신의 의견을 명확하게 전달');
  }

  return strengths;
}

function generateChallenges(components: TypeComponents): string[] {
  const challenges: string[] = [];

  // 애착 스타일 기반 도전과제
  if (components.attachment === 'ANXIOUS') {
    challenges.push('과도한 확인 욕구로 상대가 부담감을 느낄 수 있음');
    challenges.push('거절에 대한 두려움이 의사결정을 방해할 수 있음');
  } else if (components.attachment === 'AVOIDANT') {
    challenges.push('감정 표현 회피로 오해가 생길 수 있음');
    challenges.push('친밀감 형성에 시간이 오래 걸릴 수 있음');
  } else if (components.attachment === 'MIXED') {
    challenges.push('가까워지고 싶지만 동시에 부담스러워하는 모순');
    challenges.push('밀고 당기기 패턴이 관계를 불안정하게 만들 수 있음');
  }

  // 에너지 레벨 기반 도전과제
  if (components.energy === 'LOW') {
    challenges.push('현재 번아웃 위험이 있어 관계에 에너지를 쏟기 어려움');
    challenges.push('회복 없이 관계를 진행하면 소진될 수 있음');
  }

  // 갈등 스타일 기반 도전과제
  if (components.conflict === 'AVOIDING') {
    challenges.push('갈등 회피로 문제가 누적될 수 있음');
  } else if (components.conflict === 'ASSERTIVE') {
    challenges.push('직설적 표현이 상대에게 공격적으로 느껴질 수 있음');
  } else if (components.conflict === 'ACCOMMODATING') {
    challenges.push('과도한 양보로 자신의 욕구를 억압할 수 있음');
  }

  return challenges;
}

function generateRelationshipTips(components: TypeComponents): string[] {
  const tips: string[] = [];

  // 애착 스타일별 조언
  if (components.attachment === 'ANXIOUS') {
    tips.push('확인이 필요할 때 "질문 1개 + 요청 1개"로 간단하게 표현하기');
    tips.push('불안할 때 혼자서 할 수 있는 안정 루틴 만들기');
  } else if (components.attachment === 'AVOIDANT') {
    tips.push('대화 미루기 전 "○○분 후에 다시 얘기할게" 시간 약속하기');
    tips.push('감정 정리 필요할 때 솔직하게 표현하기');
  } else if (components.attachment === 'MIXED') {
    tips.push('관계 초반에 자신의 패턴을 미리 설명하기');
    tips.push('가까워지고 싶을 때와 거리가 필요할 때를 구분해서 표현하기');
  }

  // 에너지 레벨별 조언
  if (components.energy === 'LOW') {
    tips.push('새로운 관계보다 휴식과 회복을 우선하기');
    tips.push('현재 관계가 있다면 "천천히 모드"로 페이스 조절하기');
  } else if (components.energy === 'HIGH') {
    tips.push('높은 에너지가 상대에게 부담이 될 수 있음을 인식하기');
  }

  return tips;
}
