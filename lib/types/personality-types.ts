/**
 * 언연이 성격 유형 시스템
 * 5가지 테스트 결과를 종합하여 연애 타이밍과 어울리는 상대 분석
 */

export interface CompatibleType {
  code: string;
  name: string;
  reason: string;
}

export interface PersonalityType {
  code: string; // 예: "SHCP"
  name: string; // 예: "활력 넘치는 안정 대화형"
  emoji: string;
  summary: string;
  description: string;
  strengths: string[];
  challenges: string[];
  relationshipTips: string[];
  compatibleTypes: CompatibleType[]; // 어울리는 연애 상대
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
 * 유형 코드 생성 (MBTI 스타일 4자리)
 */
export function generateTypeCode(components: TypeComponents): string {
  const codes = {
    // 1번째 자리: 애착 스타일
    SECURE: 'S',
    ANXIOUS: 'A',
    AVOIDANT: 'V',
    MIXED: 'M',
    // 2번째 자리: 에너지 레벨
    HIGH: 'H',
    MODERATE: 'B', // Balanced
    LOW: 'L',
    // 3번째 자리: 갈등 스타일
    COLLABORATIVE: 'C',
    ASSERTIVE: 'S',
    ACCOMMODATING: 'P', // Passive
    AVOIDING: 'D', // Detach
    // 4번째 자리: 생활 방식 (추가)
  };

  const lifestyleCodes = {
    PLANNER: 'P',
    EXPLORER: 'E',
    IMPROVISER: 'I',
    DEADLINE: 'R', // Rush
  };

  return `${codes[components.attachment]}${codes[components.energy]}${codes[components.conflict]}${lifestyleCodes[components.lifestyle]}`;
}

/**
 * 유형 이름 생성 (한국어, 마지막에만 "형")
 */
export function generateTypeName(components: TypeComponents): string {
  const attachmentNames = {
    SECURE: '안정',
    ANXIOUS: '확인',
    AVOIDANT: '독립',
    MIXED: '밀당',
  };

  const energyNames = {
    HIGH: '활력 넘치는',
    MODERATE: '균형 잡힌',
    LOW: '회복 중인',
  };

  const conflictNames = {
    COLLABORATIVE: '대화',
    ASSERTIVE: '솔직',
    ACCOMMODATING: '배려',
    AVOIDING: '정리',
  };

  // "활력 넘치는 안정 대화형" 형태
  return `${energyNames[components.energy]} ${attachmentNames[components.attachment]} ${conflictNames[components.conflict]}형`;
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
  const compatibleTypes = generateCompatibleTypes(components);

  return {
    code,
    name,
    emoji,
    summary: generateSummary(components),
    description,
    strengths,
    challenges,
    relationshipTips,
    compatibleTypes,
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
  // 애착 스타일별 구체적 설명
  let attachmentDesc = '';
  if (components.attachment === 'SECURE') {
    attachmentDesc = '당신은 관계에서 안정감을 느끼는 사람입니다. 상대방을 믿고, 적절한 거리와 친밀함을 자연스럽게 조절할 줄 압니다. 갈등이 생겨도 당황하지 않고 대화로 풀어갈 수 있으며, 상대의 독립성도 존중합니다.';
  } else if (components.attachment === 'ANXIOUS') {
    attachmentDesc = '당신은 관계에서 확인과 안심을 필요로 하는 사람입니다. 상대방의 마음을 자주 확인하고 싶어하며, 연락이 뜸하면 불안해집니다. 이는 사랑이 깊다는 증거이기도 하지만, 때로는 상대에게 부담을 줄 수 있습니다.';
  } else if (components.attachment === 'AVOIDANT') {
    attachmentDesc = '당신은 독립성과 개인 공간을 중요하게 여기는 사람입니다. 너무 빨리 가까워지면 부담스럽고, 혼자만의 시간이 필요합니다. 감정 표현이 어색할 수 있지만, 이것이 사랑하지 않는다는 뜻은 아닙니다.';
  } else {
    attachmentDesc = '당신은 가까워지고 싶지만 동시에 부담스러운 복잡한 감정을 느끼는 사람입니다. 밀고 당기기 패턴이 나타날 수 있으며, 스스로도 혼란스러울 때가 많습니다. 이런 자신을 이해하고 설명할 수 있다면 관계가 훨씬 편해집니다.';
  }

  // 에너지 레벨별 설명
  let energyDesc = '';
  if (components.energy === 'HIGH') {
    energyDesc = ' 현재 에너지가 충만한 상태로, 새로운 관계를 시작하거나 깊게 발전시키기 좋은 시기입니다.';
  } else if (components.energy === 'MODERATE') {
    energyDesc = ' 현재 적절한 에너지 밸런스를 유지하고 있어, 관계에 안정적으로 집중할 수 있습니다.';
  } else {
    energyDesc = ' 지금은 에너지가 많이 소진된 상태입니다. 새로운 관계보다는 회복과 재충전이 우선이며, 기존 관계도 천천히 진행하는 것이 좋습니다.';
  }

  // 갈등 스타일별 설명
  let conflictDesc = '';
  if (components.conflict === 'COLLABORATIVE') {
    conflictDesc = ' 문제가 생기면 대화로 풀어가려는 협력형입니다. 상대의 입장도 이해하려 노력하며, 서로 만족하는 해결책을 찾습니다.';
  } else if (components.conflict === 'ASSERTIVE') {
    conflictDesc = ' 문제가 생기면 솔직하게 표현하는 직설형입니다. 명확한 소통을 선호하지만, 때로는 톤이 강해 보일 수 있습니다.';
  } else if (components.conflict === 'ACCOMMODATING') {
    conflictDesc = ' 문제가 생기면 상대를 배려해 양보하는 편입니다. 관계를 부드럽게 유지하지만, 자신의 욕구를 억압할 위험이 있습니다.';
  } else {
    conflictDesc = ' 문제가 생기면 일단 회피하고 혼자 정리하려는 편입니다. 시간이 필요하지만, 대화를 미루면 오해가 쌓일 수 있습니다.';
  }

  return attachmentDesc + energyDesc + conflictDesc;
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

/**
 * 어울리는 연애 상대 유형 생성
 */
function generateCompatibleTypes(components: TypeComponents): CompatibleType[] {
  const compatible: CompatibleType[] = [];

  // 애착 스타일 기반 매칭
  if (components.attachment === 'ANXIOUS') {
    // 불안형은 안정형과 잘 맞음
    const partnerCode = generateTypeCode({
      attachment: 'SECURE',
      energy: components.energy === 'LOW' ? 'MODERATE' : components.energy,
      conflict: 'COLLABORATIVE',
      lifestyle: components.lifestyle,
      spending: components.spending,
    });
    compatible.push({
      code: partnerCode,
      name: '균형 잡힌 안정 대화형',
      reason: '당신의 불안을 이해하고 안정감을 줄 수 있는 상대입니다. 확인 욕구에 귀찮아하지 않고, 꾸준히 안심시켜줄 수 있습니다.',
    });
  } else if (components.attachment === 'AVOIDANT') {
    // 회피형도 안정형과 잘 맞음
    const partnerCode = generateTypeCode({
      attachment: 'SECURE',
      energy: 'MODERATE',
      conflict: 'COLLABORATIVE',
      lifestyle: components.lifestyle,
      spending: components.spending,
    });
    compatible.push({
      code: partnerCode,
      name: '균형 잡힌 안정 대화형',
      reason: '당신의 독립성을 존중하면서도 적절한 친밀감을 유지할 수 있는 상대입니다. 거리 조절을 자연스럽게 할 수 있습니다.',
    });
  } else if (components.attachment === 'MIXED') {
    // 혼합형은 안정형이 필수
    const partnerCode = generateTypeCode({
      attachment: 'SECURE',
      energy: 'MODERATE',
      conflict: 'COLLABORATIVE',
      lifestyle: 'EXPLORER',
      spending: components.spending,
    });
    compatible.push({
      code: partnerCode,
      name: '균형 잡힌 안정 대화형',
      reason: '당신의 밀고 당기기를 이해하고 일관된 태도로 안정감을 줄 수 있는 상대입니다. 변화에도 흔들리지 않습니다.',
    });
  } else {
    // 안정형은 다양한 타입과 잘 맞음
    const partnerCode1 = generateTypeCode({
      attachment: 'SECURE',
      energy: components.energy,
      conflict: components.conflict,
      lifestyle: components.lifestyle,
      spending: components.spending,
    });
    compatible.push({
      code: partnerCode1,
      name: generateTypeName({
        attachment: 'SECURE',
        energy: components.energy,
        conflict: components.conflict,
        lifestyle: components.lifestyle,
        spending: components.spending,
      }),
      reason: '비슷한 성향을 가진 안정형 파트너로, 서로를 이해하고 존중하며 편안한 관계를 만들 수 있습니다.',
    });

    // 불안형도 추가 (안정형은 불안형을 잘 케어할 수 있음)
    const partnerCode2 = generateTypeCode({
      attachment: 'ANXIOUS',
      energy: 'MODERATE',
      conflict: 'COLLABORATIVE',
      lifestyle: components.lifestyle,
      spending: components.spending,
    });
    compatible.push({
      code: partnerCode2,
      name: '균형 잡힌 확인 대화형',
      reason: '당신의 안정감이 상대의 불안을 달래줄 수 있습니다. 상대의 확인 욕구에 귀찮아하지 않고 따뜻하게 응답할 수 있습니다.',
    });
  }

  // 에너지 레벨 고려한 추가 매칭
  if (components.energy === 'LOW') {
    const supportivePartner = generateTypeCode({
      attachment: 'SECURE',
      energy: 'MODERATE',
      conflict: 'ACCOMMODATING',
      lifestyle: 'PLANNER',
      spending: 'CONTROL',
    });
    compatible.push({
      code: supportivePartner,
      name: '균형 잡힌 안정 배려형',
      reason: '지금 당신에게 필요한 회복 시간을 존중하고, 페이스를 맞춰줄 수 있는 상대입니다. 무리하게 요구하지 않습니다.',
    });
  }

  return compatible.slice(0, 3); // 최대 3개
}
