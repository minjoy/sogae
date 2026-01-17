/**
 * 언연이 성격 유형 시스템 v2.0
 *
 * 심리학 이론 기반 개선:
 * 1. 상대적 순위 기반 유형 결정 (개인 내 비교)
 * 2. 점수 차이 기반 혼합형 판정
 * 3. 연속적 점수의 다양성 반영
 * 4. 테스트 간 상호작용 고려
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
 * Bartholomew & Horowitz (1991)의 4유형 모델 확장
 */
export type AttachmentStyle =
  | 'SECURE'      // 안정형: 자기+타인 긍정
  | 'ANXIOUS'     // 불안형: 자기 부정, 타인 긍정
  | 'AVOIDANT'    // 회피형: 자기 긍정, 타인 부정
  | 'MIXED'       // 혼합형: 둘 다 불안정
  | 'PREOCCUPIED' // 집착형: 불안 극단
  | 'DISMISSIVE'; // 무시형: 회피 극단

/**
 * 에너지 레벨 (Test 5 기반)
 * Conservation of Resources Theory 기반
 */
export type EnergyLevel =
  | 'HIGH'       // 충만: 새 관계 투자 가능
  | 'MODERATE'   // 균형: 적절한 여력
  | 'LOW'        // 주의: 관리 필요
  | 'DEPLETED';  // 고갈: 회복 우선

/**
 * 갈등 대처 스타일 (Test 4 기반)
 * Thomas-Kilmann Conflict Mode 참고
 */
export type ConflictStyle =
  | 'COLLABORATIVE' // 협력형: 대화로 해결
  | 'ASSERTIVE'     // 주장형: 직접 표현
  | 'ACCOMMODATING' // 수용형: 양보 선호
  | 'AVOIDING'      // 회피형: 갈등 회피
  | 'BALANCED';     // 균형형: 상황에 따라 유연

/**
 * 생활 방식 (Test 3 기반)
 */
export type LifestyleMode =
  | 'PLANNER'    // 계획형
  | 'EXPLORER'   // 탐색형
  | 'IMPROVISER' // 즉흥형
  | 'DEADLINE'   // 마감형
  | 'ADAPTIVE';  // 적응형: 혼합

/**
 * 소비 패턴 (Test 2 기반)
 */
export type SpendingPattern =
  | 'COMFORT'  // 위로형
  | 'APPROVAL' // 인정형
  | 'CONTROL'  // 통제형
  | 'IMPULSE'  // 충동형
  | 'BALANCED_SPENDING'; // 균형형

export interface TypeComponents {
  attachment: AttachmentStyle;
  energy: EnergyLevel;
  conflict: ConflictStyle;
  lifestyle: LifestyleMode;
  spending: SpendingPattern;
}

/**
 * 상세 점수 정보 (새로운 알고리즘용)
 */
export interface DetailedScores {
  // Test 1: 감정/애착
  anxScore?: number;
  avdScore?: number;
  immScore?: number;
  perfScore?: number;
  // Test 2: 소비
  comfScore?: number;
  apprScore?: number;
  ctrlScore?: number;
  implScore?: number;
  // Test 3: 업무
  planScore?: number;
  explScore?: number;
  imprScore?: number;
  deadScore?: number;
  // Test 4: 갈등
  avoidScore?: number;
  attackScore?: number;
  persuadeScore?: number;
  accomScore?: number;
  // Test 5: 번아웃
  burnScore?: number;
}

/**
 * 개선된 애착 스타일 결정 (상대적 + 절대적 기준 혼합)
 *
 * Fraley et al. (2015) ECR-R 해석 가이드라인 참고:
 * - 불안과 회피를 독립적 차원으로 측정
 * - 연속적 점수를 4분면으로 매핑
 */
export function determineAttachmentStyle(
  anxScore: number,
  avdScore: number
): AttachmentStyle {
  // 점수 정규화 (1-5 → 0-1)
  const anxNorm = (anxScore - 1) / 4;
  const avdNorm = (avdScore - 1) / 4;

  // 개인 내 우세성 판단
  const diff = Math.abs(anxNorm - avdNorm);
  const isBalanced = diff < 0.15; // 차이가 작으면 혼합

  // 절대적 수준 판단 (높음/낮음)
  const anxHigh = anxNorm >= 0.55;  // 3.2점 이상
  const anxVeryHigh = anxNorm >= 0.7; // 3.8점 이상
  const avdHigh = avdNorm >= 0.55;
  const avdVeryHigh = avdNorm >= 0.7;
  const bothLow = anxNorm < 0.45 && avdNorm < 0.45; // 둘 다 2.8점 미만

  // 유형 결정 (다양성 증가)
  if (bothLow) {
    return 'SECURE';
  }

  if (anxVeryHigh && avdVeryHigh) {
    return 'MIXED';
  }

  if (anxVeryHigh && !avdHigh) {
    return 'PREOCCUPIED';
  }

  if (avdVeryHigh && !anxHigh) {
    return 'DISMISSIVE';
  }

  if (anxHigh && avdHigh) {
    return 'MIXED';
  }

  if (isBalanced) {
    // 둘 다 중간 정도면 상황에 따라 다름
    if (anxNorm >= 0.4 && avdNorm >= 0.4) {
      return 'MIXED';
    }
    return 'SECURE'; // 둘 다 낮은 중간
  }

  // 우세한 쪽으로 분류
  if (anxNorm > avdNorm) {
    return anxHigh ? 'ANXIOUS' : 'SECURE';
  } else {
    return avdHigh ? 'AVOIDANT' : 'SECURE';
  }
}

/**
 * 개선된 에너지 레벨 결정 (4단계로 세분화)
 */
export function determineEnergyLevel(burnoutScore: number): EnergyLevel {
  // 비선형 매핑으로 민감도 조절
  if (burnoutScore < 2.0) return 'HIGH';
  if (burnoutScore < 2.8) return 'MODERATE';
  if (burnoutScore < 3.5) return 'LOW';
  return 'DEPLETED';
}

/**
 * 개선된 갈등 스타일 결정 (상대적 순위 + 혼합형 추가)
 */
export function determineConflictStyle(
  subscales: Array<{ subscale: string; score: number }>
): ConflictStyle {
  const scores = {
    PERSUADE: subscales.find(s => s.subscale === 'PERSUADE')?.score || 0,
    ACCOM: subscales.find(s => s.subscale === 'ACCOM')?.score || 0,
    AVOID: subscales.find(s => s.subscale === 'AVOID')?.score || 0,
    ATTACK: subscales.find(s => s.subscale === 'ATTACK')?.score || 0,
  };

  // 점수 정렬
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;

  // 1등과 2등 차이가 작으면 균형형
  if (first[1] - second[1] < 0.4 && first[1] < 3.8) {
    return 'BALANCED';
  }

  // 1등이 명확하면 해당 유형
  switch (first[0]) {
    case 'PERSUADE': return 'COLLABORATIVE';
    case 'ATTACK': return 'ASSERTIVE';
    case 'ACCOM': return 'ACCOMMODATING';
    case 'AVOID': return 'AVOIDING';
    default: return 'BALANCED';
  }
}

/**
 * 개선된 생활 방식 결정
 */
export function determineLifestyleMode(
  subscales: Array<{ subscale: string; score: number }>
): LifestyleMode {
  const scores = {
    PLAN: subscales.find(s => s.subscale === 'PLAN')?.score || 0,
    EXPL: subscales.find(s => s.subscale === 'EXPL')?.score || 0,
    IMPR: subscales.find(s => s.subscale === 'IMPR')?.score || 0,
    DEAD: subscales.find(s => s.subscale === 'DEAD')?.score || 0,
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;

  // 차이가 작으면 적응형
  if (first[1] - second[1] < 0.35) {
    return 'ADAPTIVE';
  }

  switch (first[0]) {
    case 'PLAN': return 'PLANNER';
    case 'EXPL': return 'EXPLORER';
    case 'IMPR': return 'IMPROVISER';
    case 'DEAD': return 'DEADLINE';
    default: return 'ADAPTIVE';
  }
}

/**
 * 개선된 소비 패턴 결정
 */
export function determineSpendingPattern(
  subscales: Array<{ subscale: string; score: number }>
): SpendingPattern {
  const scores = {
    COMF: subscales.find(s => s.subscale === 'COMF')?.score || 0,
    APPR: subscales.find(s => s.subscale === 'APPR')?.score || 0,
    CTRL: subscales.find(s => s.subscale === 'CTRL')?.score || 0,
    IMPL: subscales.find(s => s.subscale === 'IMPL')?.score || 0,
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;

  // 차이가 작으면 균형형
  if (first[1] - second[1] < 0.4) {
    return 'BALANCED_SPENDING';
  }

  switch (first[0]) {
    case 'COMF': return 'COMFORT';
    case 'APPR': return 'APPROVAL';
    case 'CTRL': return 'CONTROL';
    case 'IMPL': return 'IMPULSE';
    default: return 'BALANCED_SPENDING';
  }
}

// 하위 호환성을 위한 기존 함수 유지 (새로운 함수로 리다이렉트)
export function determineConflictStyleLegacy(primaryConflict: string): ConflictStyle {
  switch (primaryConflict) {
    case 'PERSUADE': return 'COLLABORATIVE';
    case 'ATTACK': return 'ASSERTIVE';
    case 'ACCOM': return 'ACCOMMODATING';
    case 'AVOID': return 'AVOIDING';
    default: return 'BALANCED';
  }
}

export function determineLifestyleModeLegacy(primaryWork: string): LifestyleMode {
  switch (primaryWork) {
    case 'PLAN': return 'PLANNER';
    case 'EXPL': return 'EXPLORER';
    case 'IMPR': return 'IMPROVISER';
    case 'DEAD': return 'DEADLINE';
    default: return 'ADAPTIVE';
  }
}

export function determineSpendingPatternLegacy(primarySpending: string): SpendingPattern {
  switch (primarySpending) {
    case 'COMF': return 'COMFORT';
    case 'APPR': return 'APPROVAL';
    case 'CTRL': return 'CONTROL';
    case 'IMPL': return 'IMPULSE';
    default: return 'BALANCED_SPENDING';
  }
}

/**
 * 유형 코드 생성 (확장된 코드 시스템)
 */
export function generateTypeCode(components: TypeComponents): string {
  const attachmentCodes: Record<AttachmentStyle, string> = {
    SECURE: 'S',
    ANXIOUS: 'A',
    AVOIDANT: 'V',
    MIXED: 'M',
    PREOCCUPIED: 'P', // 새로 추가
    DISMISSIVE: 'D',  // 새로 추가
  };

  const energyCodes: Record<EnergyLevel, string> = {
    HIGH: 'H',
    MODERATE: 'B',
    LOW: 'L',
    DEPLETED: 'X', // 새로 추가
  };

  const conflictCodes: Record<ConflictStyle, string> = {
    COLLABORATIVE: 'C',
    ASSERTIVE: 'S',
    ACCOMMODATING: 'P',
    AVOIDING: 'D',
    BALANCED: 'B', // 새로 추가
  };

  const lifestyleCodes: Record<LifestyleMode, string> = {
    PLANNER: 'P',
    EXPLORER: 'E',
    IMPROVISER: 'I',
    DEADLINE: 'R',
    ADAPTIVE: 'A', // 새로 추가
  };

  return `${attachmentCodes[components.attachment]}${energyCodes[components.energy]}${conflictCodes[components.conflict]}${lifestyleCodes[components.lifestyle]}`;
}

/**
 * 유형 이름 생성 (확장된 이름 시스템)
 */
export function generateTypeName(components: TypeComponents): string {
  const attachmentNames: Record<AttachmentStyle, string> = {
    SECURE: '안정',
    ANXIOUS: '확인',
    AVOIDANT: '독립',
    MIXED: '밀당',
    PREOCCUPIED: '몰입',
    DISMISSIVE: '자립',
  };

  const energyNames: Record<EnergyLevel, string> = {
    HIGH: '활력 넘치는',
    MODERATE: '균형 잡힌',
    LOW: '회복 중인',
    DEPLETED: '재충전 필요한',
  };

  const conflictNames: Record<ConflictStyle, string> = {
    COLLABORATIVE: '대화',
    ASSERTIVE: '솔직',
    ACCOMMODATING: '배려',
    AVOIDING: '정리',
    BALANCED: '유연',
  };

  return `${energyNames[components.energy]} ${attachmentNames[components.attachment]} ${conflictNames[components.conflict]}형`;
}

/**
 * 유형 이모지 결정 (확장된 조합)
 */
export function generateTypeEmoji(components: TypeComponents): string {
  // 에너지와 애착 스타일 조합으로 이모지 선택
  const emojiMap: Record<string, string> = {
    // HIGH 에너지
    'HIGH-SECURE': '🌟',
    'HIGH-ANXIOUS': '⚡',
    'HIGH-AVOIDANT': '🦅',
    'HIGH-MIXED': '🎭',
    'HIGH-PREOCCUPIED': '💫',
    'HIGH-DISMISSIVE': '🏔️',

    // MODERATE 에너지
    'MODERATE-SECURE': '🌈',
    'MODERATE-ANXIOUS': '🌊',
    'MODERATE-AVOIDANT': '🌙',
    'MODERATE-MIXED': '🎨',
    'MODERATE-PREOCCUPIED': '🔮',
    'MODERATE-DISMISSIVE': '🏛️',

    // LOW 에너지
    'LOW-SECURE': '🌿',
    'LOW-ANXIOUS': '🕊️',
    'LOW-AVOIDANT': '🦋',
    'LOW-MIXED': '🌸',
    'LOW-PREOCCUPIED': '💭',
    'LOW-DISMISSIVE': '🍃',

    // DEPLETED 에너지
    'DEPLETED-SECURE': '🌱',
    'DEPLETED-ANXIOUS': '🥀',
    'DEPLETED-AVOIDANT': '🌘',
    'DEPLETED-MIXED': '🎐',
    'DEPLETED-PREOCCUPIED': '💫',
    'DEPLETED-DISMISSIVE': '🏜️',
  };

  const key = `${components.energy}-${components.attachment}`;
  return emojiMap[key] || '💝';
}

/**
 * 완전한 성격 유형 생성
 */
export function generatePersonalityType(components: TypeComponents): PersonalityType {
  const code = generateTypeCode(components);
  const name = generateTypeName(components);
  const emoji = generateTypeEmoji(components);

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
  const attachmentDesc: Record<AttachmentStyle, string> = {
    SECURE: '관계에서 안정감을 느끼며',
    ANXIOUS: '관계의 확인을 중요하게 여기며',
    AVOIDANT: '독립성을 소중히 하며',
    MIXED: '가까움과 거리 사이에서 균형을 찾으며',
    PREOCCUPIED: '관계에 깊이 몰입하며',
    DISMISSIVE: '스스로 충분함을 느끼며',
  };

  const energyDesc: Record<EnergyLevel, string> = {
    HIGH: '충만한 에너지로',
    MODERATE: '균형 잡힌 페이스로',
    LOW: '회복과 재충전에 집중하며',
    DEPLETED: '자신을 돌보는 것을 최우선으로 하며',
  };

  return `${attachmentDesc[components.attachment]} ${energyDesc[components.energy]} 살아가는 사람`;
}

function generateTypeDescription(components: TypeComponents): string {
  const attachmentDesc = getAttachmentDescription(components.attachment);
  const energyDesc = getEnergyDescription(components.energy);
  const conflictDesc = getConflictDescription(components.conflict);

  return attachmentDesc + energyDesc + conflictDesc;
}

function getAttachmentDescription(attachment: AttachmentStyle): string {
  const descriptions: Record<AttachmentStyle, string> = {
    SECURE: '당신은 관계에서 안정감을 느끼는 사람입니다. 상대방을 믿고, 적절한 거리와 친밀함을 자연스럽게 조절할 줄 압니다. 갈등이 생겨도 당황하지 않고 대화로 풀어갈 수 있으며, 상대의 독립성도 존중합니다.',
    ANXIOUS: '당신은 관계에서 확인과 안심을 필요로 하는 사람입니다. 상대방의 마음을 자주 확인하고 싶어하며, 연락이 뜸하면 불안해집니다. 이는 사랑이 깊다는 증거이기도 하지만, 때로는 상대에게 부담을 줄 수 있습니다.',
    AVOIDANT: '당신은 독립성과 개인 공간을 중요하게 여기는 사람입니다. 너무 빨리 가까워지면 부담스럽고, 혼자만의 시간이 필요합니다. 감정 표현이 어색할 수 있지만, 이것이 사랑하지 않는다는 뜻은 아닙니다.',
    MIXED: '당신은 가까워지고 싶지만 동시에 부담스러운 복잡한 감정을 느끼는 사람입니다. 밀고 당기기 패턴이 나타날 수 있으며, 스스로도 혼란스러울 때가 많습니다. 이런 자신을 이해하고 설명할 수 있다면 관계가 훨씬 편해집니다.',
    PREOCCUPIED: '당신은 관계에 깊이 몰입하는 사람입니다. 상대방과의 연결을 매우 중요하게 여기며, 관계가 당신에게 큰 의미를 갖습니다. 때로는 이런 강렬함이 상대에게 부담이 될 수 있으니, 자신만의 시간도 소중히 하세요.',
    DISMISSIVE: '당신은 스스로 충분함을 느끼는 독립적인 사람입니다. 굳이 누군가에게 의지하지 않아도 괜찮고, 혼자서도 잘 지낼 수 있습니다. 하지만 가끔은 마음을 열고 누군가와 깊이 연결되는 경험도 필요합니다.',
  };
  return descriptions[attachment];
}

function getEnergyDescription(energy: EnergyLevel): string {
  const descriptions: Record<EnergyLevel, string> = {
    HIGH: ' 현재 에너지가 충만한 상태로, 새로운 관계를 시작하거나 깊게 발전시키기 좋은 시기입니다.',
    MODERATE: ' 현재 적절한 에너지 밸런스를 유지하고 있어, 관계에 안정적으로 집중할 수 있습니다.',
    LOW: ' 지금은 에너지가 다소 낮은 상태입니다. 새로운 관계보다는 회복과 재충전에 시간을 투자하는 것이 좋습니다.',
    DEPLETED: ' 지금은 에너지가 많이 소진된 상태입니다. 어떤 관계든 에너지를 요구하기 때문에, 먼저 자신을 돌보는 시간이 필요합니다.',
  };
  return descriptions[energy];
}

function getConflictDescription(conflict: ConflictStyle): string {
  const descriptions: Record<ConflictStyle, string> = {
    COLLABORATIVE: ' 문제가 생기면 대화로 풀어가려는 협력형입니다. 상대의 입장도 이해하려 노력하며, 서로 만족하는 해결책을 찾습니다.',
    ASSERTIVE: ' 문제가 생기면 솔직하게 표현하는 직설형입니다. 명확한 소통을 선호하지만, 때로는 톤이 강해 보일 수 있습니다.',
    ACCOMMODATING: ' 문제가 생기면 상대를 배려해 양보하는 편입니다. 관계를 부드럽게 유지하지만, 자신의 욕구를 억압할 위험이 있습니다.',
    AVOIDING: ' 문제가 생기면 일단 회피하고 혼자 정리하려는 편입니다. 시간이 필요하지만, 대화를 미루면 오해가 쌓일 수 있습니다.',
    BALANCED: ' 상황에 따라 유연하게 대화 방식을 조절합니다. 필요할 때는 직접 표현하고, 때로는 양보할 줄도 압니다.',
  };
  return descriptions[conflict];
}

function generateStrengths(components: TypeComponents): string[] {
  const strengths: string[] = [];

  // 애착 스타일 기반 강점
  const attachmentStrengths: Record<AttachmentStyle, string[]> = {
    SECURE: ['갈등 상황에서도 차분하게 대화할 수 있음', '상대방을 신뢰하고 안정적인 관계 유지'],
    ANXIOUS: ['관계에 대한 높은 관심과 헌신', '감정 표현이 솔직하고 명확함'],
    AVOIDANT: ['독립적으로 문제 해결 가능', '개인 시간을 효과적으로 활용'],
    MIXED: ['다양한 관계 스타일에 적응 가능', '깊이와 공간 모두를 이해함'],
    PREOCCUPIED: ['관계에 깊이 헌신할 수 있음', '상대방의 감정에 민감하게 반응'],
    DISMISSIVE: ['감정에 휘둘리지 않는 냉철함', '혼자서도 충분히 행복할 수 있음'],
  };
  strengths.push(...attachmentStrengths[components.attachment]);

  // 에너지 레벨 기반 강점
  if (components.energy === 'HIGH') {
    strengths.push('새로운 활동과 관계에 적극적');
    strengths.push('긍정적인 에너지를 주변에 전파');
  } else if (components.energy === 'MODERATE') {
    strengths.push('안정적인 페이스로 관계 유지');
  }

  // 갈등 스타일 기반 강점
  if (components.conflict === 'COLLABORATIVE') {
    strengths.push('문제 해결 시 협력적 접근');
  } else if (components.conflict === 'ASSERTIVE') {
    strengths.push('자신의 의견을 명확하게 전달');
  } else if (components.conflict === 'BALANCED') {
    strengths.push('상황에 따라 유연하게 대처');
  }

  return strengths.slice(0, 5);
}

function generateChallenges(components: TypeComponents): string[] {
  const challenges: string[] = [];

  // 애착 스타일 기반 도전과제
  const attachmentChallenges: Record<AttachmentStyle, string[]> = {
    SECURE: [], // 안정형은 도전과제 적음
    ANXIOUS: ['과도한 확인 욕구로 상대가 부담감을 느낄 수 있음', '거절에 대한 두려움이 의사결정을 방해할 수 있음'],
    AVOIDANT: ['감정 표현 회피로 오해가 생길 수 있음', '친밀감 형성에 시간이 오래 걸릴 수 있음'],
    MIXED: ['가까워지고 싶지만 동시에 부담스러워하는 모순', '밀고 당기기 패턴이 관계를 불안정하게 만들 수 있음'],
    PREOCCUPIED: ['관계에 과도하게 몰입할 수 있음', '상대의 작은 변화에도 크게 동요할 수 있음'],
    DISMISSIVE: ['상대가 거리감을 느낄 수 있음', '감정적 연결이 어려울 수 있음'],
  };
  challenges.push(...attachmentChallenges[components.attachment]);

  // 에너지 레벨 기반 도전과제
  if (components.energy === 'LOW' || components.energy === 'DEPLETED') {
    challenges.push('현재 번아웃 위험이 있어 관계에 에너지를 쏟기 어려움');
    challenges.push('회복 없이 관계를 진행하면 소진될 수 있음');
  }

  // 갈등 스타일 기반 도전과제
  const conflictChallenges: Record<ConflictStyle, string> = {
    COLLABORATIVE: '',
    ASSERTIVE: '직설적 표현이 상대에게 공격적으로 느껴질 수 있음',
    ACCOMMODATING: '과도한 양보로 자신의 욕구를 억압할 수 있음',
    AVOIDING: '갈등 회피로 문제가 누적될 수 있음',
    BALANCED: '',
  };
  if (conflictChallenges[components.conflict]) {
    challenges.push(conflictChallenges[components.conflict]);
  }

  return challenges.slice(0, 4);
}

function generateRelationshipTips(components: TypeComponents): string[] {
  const tips: string[] = [];

  // 애착 스타일별 조언
  const attachmentTips: Record<AttachmentStyle, string[]> = {
    SECURE: ['당신의 안정감이 상대에겐 "무관심"으로 보일 수 있어요. 가끔은 먼저 애정 표현을 해주세요'],
    ANXIOUS: ['확인이 필요할 때 "질문 1개 + 요청 1개"로 간단하게 표현하기', '불안할 때 혼자서 할 수 있는 안정 루틴 만들기'],
    AVOIDANT: ['대화 미루기 전 "○○분 후에 다시 얘기할게" 시간 약속하기', '감정 정리 필요할 때 솔직하게 표현하기'],
    MIXED: ['관계 초반에 자신의 패턴을 미리 설명하기', '가까워지고 싶을 때와 거리가 필요할 때를 구분해서 표현하기'],
    PREOCCUPIED: ['관계 외에 자신만의 취미와 시간을 확보하기', '상대에게 의존하기보다 스스로 안정감 찾는 연습하기'],
    DISMISSIVE: ['상대의 감정적 필요를 인식하고 반응해주기', '가끔은 마음을 열고 약한 모습을 보여도 괜찮아요'],
  };
  tips.push(...attachmentTips[components.attachment]);

  // 에너지 레벨별 조언
  if (components.energy === 'LOW' || components.energy === 'DEPLETED') {
    tips.push('새로운 관계보다 휴식과 회복을 우선하기');
    tips.push('현재 관계가 있다면 "천천히 모드"로 페이스 조절하기');
  } else if (components.energy === 'HIGH') {
    tips.push('높은 에너지가 상대에게 부담이 될 수 있음을 인식하기');
  }

  return tips.slice(0, 4);
}

/**
 * 어울리는 연애 상대 유형 생성 (개선된 매칭 알고리즘)
 */
function generateCompatibleTypes(components: TypeComponents): CompatibleType[] {
  const compatible: CompatibleType[] = [];

  // 기본: 안정형은 누구와나 잘 맞음
  const securePartner = generateTypeCode({
    attachment: 'SECURE',
    energy: components.energy === 'DEPLETED' ? 'MODERATE' : components.energy,
    conflict: 'COLLABORATIVE',
    lifestyle: components.lifestyle === 'ADAPTIVE' ? 'PLANNER' : components.lifestyle,
    spending: 'CONTROL',
  });

  compatible.push({
    code: securePartner,
    name: '균형 잡힌 안정 대화형',
    reason: getCompatibilityReason(components.attachment, 'SECURE'),
  });

  // 애착 스타일별 추가 매칭
  if (components.attachment === 'ANXIOUS' || components.attachment === 'PREOCCUPIED') {
    // 불안형은 안정형 + 표현력 좋은 사람
    compatible.push({
      code: 'SHCP',
      name: '활력 넘치는 안정 대화형',
      reason: '꾸준히 "좋아해"라고 표현해주고, 당신의 확인 욕구를 이해해줄 수 있는 상대입니다.',
    });
  } else if (components.attachment === 'AVOIDANT' || components.attachment === 'DISMISSIVE') {
    // 회피형은 안정형 + 독립적인 사람
    compatible.push({
      code: 'SBCE',
      name: '균형 잡힌 안정 대화형',
      reason: '당신의 혼자만의 시간을 존중하고, 적절한 거리감을 유지할 수 있는 상대입니다.',
    });
  } else if (components.attachment === 'MIXED') {
    // 혼합형은 매우 안정적인 사람
    compatible.push({
      code: 'SHCP',
      name: '활력 넘치는 안정 대화형',
      reason: '당신의 밀당에 흔들리지 않고 일관된 태도로 안정감을 줄 수 있는 상대입니다.',
    });
  }

  // 에너지 레벨 고려
  if (components.energy === 'LOW' || components.energy === 'DEPLETED') {
    compatible.push({
      code: 'SBPA',
      name: '균형 잡힌 안정 배려형',
      reason: '지금 당신에게 필요한 회복 시간을 존중하고, 페이스를 맞춰줄 수 있는 상대입니다.',
    });
  }

  return compatible.slice(0, 3);
}

function getCompatibilityReason(myAttachment: AttachmentStyle, partnerAttachment: AttachmentStyle): string {
  if (partnerAttachment === 'SECURE') {
    const reasons: Record<AttachmentStyle, string> = {
      SECURE: '비슷한 성향을 가진 안정형 파트너로, 서로를 이해하고 존중하며 편안한 관계를 만들 수 있습니다.',
      ANXIOUS: '당신의 불안을 이해하고 안정감을 줄 수 있는 상대입니다. 확인 욕구에 귀찮아하지 않고, 꾸준히 안심시켜줄 수 있습니다.',
      AVOIDANT: '당신의 독립성을 존중하면서도 적절한 친밀감을 유지할 수 있는 상대입니다. 거리 조절을 자연스럽게 할 수 있습니다.',
      MIXED: '당신의 밀고 당기기를 이해하고 일관된 태도로 안정감을 줄 수 있는 상대입니다. 변화에도 흔들리지 않습니다.',
      PREOCCUPIED: '당신의 깊은 감정을 받아줄 수 있는 상대입니다. 과하지 않게 조절하면 좋은 관계를 만들 수 있습니다.',
      DISMISSIVE: '당신의 독립성을 인정하면서도 따뜻한 연결을 제안할 수 있는 상대입니다.',
    };
    return reasons[myAttachment];
  }
  return '서로의 다름을 이해하고 성장할 수 있는 관계입니다.';
}

/**
 * 성격 유형 희귀도 계산 (개선된 확률 모델)
 */
export function calculateRarity(components: TypeComponents): { percent: number; label: string; isRare: boolean } {
  // 실제 인구 분포에 가까운 비율 (심리학 연구 기반)
  const attachmentRates: Record<AttachmentStyle, number> = {
    SECURE: 0.50,      // 50% - 안정형이 가장 많음 (Mickelson et al., 1997)
    ANXIOUS: 0.20,     // 20%
    AVOIDANT: 0.15,    // 15%
    MIXED: 0.10,       // 10%
    PREOCCUPIED: 0.03, // 3% - 희귀
    DISMISSIVE: 0.02,  // 2% - 희귀
  };

  const energyRates: Record<EnergyLevel, number> = {
    HIGH: 0.25,
    MODERATE: 0.45,
    LOW: 0.20,
    DEPLETED: 0.10,
  };

  const conflictRates: Record<ConflictStyle, number> = {
    COLLABORATIVE: 0.15,
    ASSERTIVE: 0.20,
    ACCOMMODATING: 0.25,
    AVOIDING: 0.25,
    BALANCED: 0.15,
  };

  const lifestyleRates: Record<LifestyleMode, number> = {
    PLANNER: 0.30,
    EXPLORER: 0.15,
    IMPROVISER: 0.20,
    DEADLINE: 0.20,
    ADAPTIVE: 0.15,
  };

  // 조합 확률 계산
  const probability =
    attachmentRates[components.attachment] *
    energyRates[components.energy] *
    conflictRates[components.conflict] *
    lifestyleRates[components.lifestyle];

  // 상위 몇 %인지 계산 (낮을수록 희귀)
  const percentRank = Math.round(probability * 10000) / 100;

  // 희귀도 라벨 결정
  let label = '';
  let isRare = false;

  if (percentRank <= 0.3) {
    label = '전설급 희귀';
    isRare = true;
  } else if (percentRank <= 0.7) {
    label = '매우 희귀';
    isRare = true;
  } else if (percentRank <= 1.5) {
    label = '희귀';
    isRare = true;
  } else if (percentRank <= 3.0) {
    label = '특별한 조합';
    isRare = false;
  } else {
    label = '일반적';
    isRare = false;
  }

  return { percent: percentRank, label, isRare };
}

/**
 * 성격 코드 각 자리 설명 (족보) - 확장
 */
export interface CodeExplanation {
  position: number;
  code: string;
  category: string;
  name: string;
  emoji: string;
  description: string;
}

export function getCodeExplanations(code: string): CodeExplanation[] {
  const explanations: CodeExplanation[] = [];

  // 1번째 자리: 애착 스타일 (확장)
  const attachmentInfo: Record<string, { name: string; emoji: string; description: string }> = {
    S: { name: '안정형', emoji: '🌟', description: '관계에서 안정감을 느끼고, 적절한 거리와 친밀함을 자연스럽게 조절합니다. 상대를 믿고, 갈등이 생겨도 대화로 풀어갈 수 있어요.' },
    A: { name: '확인형', emoji: '💗', description: '상대의 마음을 자주 확인하고 싶어하며, 연락이 뜸하면 불안해집니다. 사랑이 깊다는 증거이기도 해요.' },
    V: { name: '독립형', emoji: '🦋', description: '독립성과 개인 공간을 중요하게 여깁니다. 너무 빨리 가까워지면 부담스럽고, 혼자만의 시간이 필요해요.' },
    M: { name: '밀당형', emoji: '🎭', description: '가까워지고 싶지만 동시에 부담스러운 복잡한 감정을 느낍니다. 밀고 당기기 패턴이 나타날 수 있어요.' },
    P: { name: '몰입형', emoji: '💫', description: '관계에 깊이 몰입하며, 상대방과의 연결을 매우 중요하게 여깁니다.' },
    D: { name: '자립형', emoji: '🏔️', description: '스스로 충분함을 느끼는 독립적인 사람. 굳이 누군가에게 의지하지 않아도 괜찮아요.' },
  };

  // 2번째 자리: 에너지 레벨 (확장)
  const energyInfo: Record<string, { name: string; emoji: string; description: string }> = {
    H: { name: '활력 충만', emoji: '🔥', description: '에너지가 충만한 상태로, 새로운 관계를 시작하거나 깊게 발전시키기 좋은 시기입니다.' },
    B: { name: '균형 상태', emoji: '⚖️', description: '적절한 에너지 밸런스를 유지하고 있어, 관계에 안정적으로 집중할 수 있습니다.' },
    L: { name: '회복 중', emoji: '🌿', description: '에너지가 다소 낮은 상태입니다. 새로운 관계보다는 회복과 재충전이 필요해요.' },
    X: { name: '재충전 필요', emoji: '🔋', description: '에너지가 많이 소진된 상태입니다. 먼저 자신을 돌보는 시간이 필요해요.' },
  };

  // 3번째 자리: 갈등 스타일 (확장)
  const conflictInfo: Record<string, { name: string; emoji: string; description: string }> = {
    C: { name: '대화형', emoji: '💬', description: '문제가 생기면 대화로 풀어가려는 협력형입니다. 상대의 입장도 이해하려 노력해요.' },
    S: { name: '솔직형', emoji: '⚡', description: '문제가 생기면 솔직하게 표현합니다. 명확한 소통을 선호하지만, 때로는 톤이 강해 보일 수 있어요.' },
    P: { name: '배려형', emoji: '🤝', description: '문제가 생기면 상대를 배려해 양보하는 편입니다. 관계를 부드럽게 유지하지만, 자신의 욕구를 억압할 수 있어요.' },
    D: { name: '정리형', emoji: '🚪', description: '문제가 생기면 일단 거리를 두고 혼자 정리하려는 편입니다. 시간이 필요하지만, 대화를 미루면 오해가 쌓일 수 있어요.' },
    B: { name: '유연형', emoji: '🌊', description: '상황에 따라 유연하게 대화 방식을 조절합니다. 필요할 때는 직접 표현하고, 때로는 양보할 줄도 알아요.' },
  };

  // 4번째 자리: 생활 방식 (확장)
  const lifestyleInfo: Record<string, { name: string; emoji: string; description: string }> = {
    P: { name: '계획형', emoji: '📅', description: '체계적으로 계획을 세우고 실행합니다. 약속 시간을 잘 지키고, 예상치 못한 변화에 스트레스를 받을 수 있어요.' },
    E: { name: '탐색형', emoji: '🔍', description: '신중하게 생각하고 결정합니다. 충분히 고민한 후 행동하지만, 결정이 느려 보일 수 있어요.' },
    I: { name: '즉흥형', emoji: '🎲', description: '떠오르면 바로 실행합니다. 유연하고 적응력이 좋지만, 상대에게 배려 없이 보일 수 있어요.' },
    R: { name: '마감형', emoji: '⏰', description: '마감이 다가와야 집중력이 폭발합니다. 효율적이지만, 바쁠 때 연락이 뜸해질 수 있어요.' },
    A: { name: '적응형', emoji: '🌈', description: '상황에 따라 유연하게 스타일을 바꿉니다. 다양한 상황에 잘 적응해요.' },
  };

  // 각 자리 설명 생성
  if (code[0] && attachmentInfo[code[0]]) {
    const info = attachmentInfo[code[0]];
    explanations.push({
      position: 1,
      code: code[0],
      category: '애착 스타일',
      name: info.name,
      emoji: info.emoji,
      description: info.description,
    });
  }

  if (code[1] && energyInfo[code[1]]) {
    const info = energyInfo[code[1]];
    explanations.push({
      position: 2,
      code: code[1],
      category: '에너지 레벨',
      name: info.name,
      emoji: info.emoji,
      description: info.description,
    });
  }

  if (code[2] && conflictInfo[code[2]]) {
    const info = conflictInfo[code[2]];
    explanations.push({
      position: 3,
      code: code[2],
      category: '갈등 스타일',
      name: info.name,
      emoji: info.emoji,
      description: info.description,
    });
  }

  if (code[3] && lifestyleInfo[code[3]]) {
    const info = lifestyleInfo[code[3]];
    explanations.push({
      position: 4,
      code: code[3],
      category: '생활 방식',
      name: info.name,
      emoji: info.emoji,
      description: info.description,
    });
  }

  return explanations;
}

/**
 * 성격 코드에서 TypeComponents 추출 (확장 지원)
 */
export function parseCodeToComponents(code: string): TypeComponents | null {
  if (!code || code.length !== 4) return null;

  const attachmentMap: Record<string, AttachmentStyle> = {
    S: 'SECURE', A: 'ANXIOUS', V: 'AVOIDANT', M: 'MIXED',
    P: 'PREOCCUPIED', D: 'DISMISSIVE',
  };
  const energyMap: Record<string, EnergyLevel> = {
    H: 'HIGH', B: 'MODERATE', L: 'LOW', X: 'DEPLETED',
  };
  const conflictMap: Record<string, ConflictStyle> = {
    C: 'COLLABORATIVE', S: 'ASSERTIVE', P: 'ACCOMMODATING', D: 'AVOIDING', B: 'BALANCED',
  };
  const lifestyleMap: Record<string, LifestyleMode> = {
    P: 'PLANNER', E: 'EXPLORER', I: 'IMPROVISER', R: 'DEADLINE', A: 'ADAPTIVE',
  };

  const attachment = attachmentMap[code[0]];
  const energy = energyMap[code[1]];
  const conflict = conflictMap[code[2]];
  const lifestyle = lifestyleMap[code[3]];

  if (!attachment || !energy || !conflict || !lifestyle) return null;

  return {
    attachment,
    energy,
    conflict,
    lifestyle,
    spending: 'CONTROL',
  };
}
