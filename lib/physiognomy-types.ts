/**
 * 관상 해석 시스템 - Excel "관상 해석.xlsx" 데이터 기반
 * 과학적 비율 계산과 전통 관상 해석을 통합
 */

// === 특성(Trait) 정의 ===
// Excel "안좋은 궁합" 시트에서 추출한 점수 카테고리
export interface PhysiognomyTraits {
  // 정신/성격 관련
  정신력: number;     // 5점 만점 (의지력, 결단력)
  착함: number;       // 3점 만점 (배려심, 친절함)
  외도: number;       // 1점 만점 (충동성, 바람기)
  질투심: number;     // 2점 만점 (경쟁심, 시기)
  호기심: number;     // 2점 만점 (탐구심, 새로운 것에 대한 관심)
  남의시선: number;   // 2점 만점 (자의식, 타인 평가 의식)
  긍정: number;       // 4점 만점 (낙관성, 밝은 성격)

  // 운세/복 관련
  중년운: number;     // 4점 만점 (40-60대 운세)
  장수: number;       // 5점 만점 (건강, 수명)
  재물: number;       // 4점 만점 (돈복, 재정운)
  연애운: number;     // 3점 만점 (이성운, 결혼운)

  // 직업/사회 관련
  업무: number;       // 4점 만점 (직장운, 일 능력)
  책임감: number;     // 4점 만점 (성실함, 신뢰도)
  성실함: number;     // 3점 만점 (꾸준함, 노력)
  사교력: number;     // 3점 만점 (대인관계, 친화력)
  체력: number;       // 3점 만점 (기력, 활력)
}

// 특성별 최대 점수
export const TRAIT_MAX_SCORES: PhysiognomyTraits = {
  정신력: 5,
  착함: 3,
  외도: 1,
  질투심: 2,
  호기심: 2,
  남의시선: 2,
  긍정: 4,
  중년운: 4,
  장수: 5,
  재물: 4,
  연애운: 3,
  업무: 4,
  책임감: 4,
  성실함: 3,
  사교력: 3,
  체력: 3,
};

// 초기 특성 점수 (기본값)
export function createEmptyTraits(): PhysiognomyTraits {
  return {
    정신력: 0,
    착함: 0,
    외도: 0,
    질투심: 0,
    호기심: 0,
    남의시선: 0,
    긍정: 0,
    중년운: 0,
    장수: 0,
    재물: 0,
    연애운: 0,
    업무: 0,
    책임감: 0,
    성실함: 0,
    사교력: 0,
    체력: 0,
  };
}

// === 비율 기준값 정의 ===
// draw.py에서 추출한 기준 비율값
export interface RatioThresholds {
  name: string;
  description: string;
  thresholds: number[];  // 각 레벨 경계값 [매우높음, 높음, 보통, 낮음]
  labels: string[];      // 각 레벨 라벨
}

export const RATIO_THRESHOLDS: Record<string, RatioThresholds> = {
  // ratio1: 눈두덩이 (눈~눈썹 거리 / 코너비)
  eyebrowDistance: {
    name: '눈두덩이',
    description: '눈과 눈썹 사이 거리',
    thresholds: [0.8, 0.68, 0.6, 0.5],
    labels: ['매우 넓음', '넓은 편', '이상적', '좁은 편', '매우 좁음'],
  },

  // ratio2: 코길이 (코끝~눈 / 코너비)
  noseLength: {
    name: '코길이',
    description: '코의 세로 길이',
    thresholds: [1.55, 1.40, 1.28, 1.15],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio3: 인중 (입술~코끝 / 코너비)
  philtrumLength: {
    name: '인중',
    description: '코밑에서 윗입술까지 거리',
    thresholds: [0.70, 0.65, 0.58, 0.50],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio4: 턱길이 (턱~입술 / 코너비)
  chinLength: {
    name: '턱길이',
    description: '아랫입술에서 턱끝까지 거리',
    thresholds: [1.50, 1.20, 0.80, 0.60],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio7: 입크기 (입 가로 / 코너비)
  mouthWidth: {
    name: '입크기',
    description: '입의 가로 너비',
    thresholds: [1.75, 1.65, 1.57, 1.45],
    labels: ['매우 큰', '큰 편', '이상적', '작은 편', '매우 작은'],
  },

  // ratio8: 하관 (입 가로 / 볼너비)
  jawWidth: {
    name: '하관',
    description: '턱의 너비 (하관)',
    thresholds: [0.78, 0.77, 0.76, 0.75],
    labels: ['매우 튼튼한', '튼튼한', '이상적', '얇은 편', '뾰족한'],
  },

  // 눈크기 (눈가로/눈세로 비율)
  eyeShape: {
    name: '눈모양',
    description: '눈의 가로세로 비율',
    thresholds: [3.5, 3.2, 2.8, 2.5],
    labels: ['매우 긴', '긴 편', '보통', '둥근 편', '매우 둥근'],
  },

  // 눈꼬리 각도
  eyeAngle: {
    name: '눈꼬리',
    description: '눈꼬리의 기울기',
    thresholds: [5, 2, -2, -5],
    labels: ['많이 올라감', '올라감', '일자', '내려감', '많이 내려감'],
  },
};

// === 특성 점수 변화 규칙 (Excel 기반) ===
export interface TraitModifier {
  feature: string;       // 특징 이름
  condition: string;     // 조건 (high, low, medium)
  changes: Partial<PhysiognomyTraits>;  // 점수 변화
}

export const TRAIT_MODIFIERS: TraitModifier[] = [
  // 1. 눈꼬리 (eye_updown)
  { feature: '눈꼬리', condition: 'high',   changes: { 정신력: 1, 중년운: 1, 착함: 0, 외도: 0 } },
  { feature: '눈꼬리', condition: 'medium', changes: { 정신력: 0, 중년운: 0, 착함: 0, 외도: 0 } },
  { feature: '눈꼬리', condition: 'low',    changes: { 정신력: -1, 중년운: 0, 착함: 1, 외도: 0 } },
  { feature: '눈꼬리', condition: 'verylow', changes: { 정신력: 0, 중년운: 0, 착함: 0, 외도: 1 } },

  // 2. 눈두덩이 (ratio1a)
  { feature: '눈두덩이', condition: 'high', changes: { 재물: 1, 정신력: -1 } },
  { feature: '눈두덩이', condition: 'low',  changes: { 재물: -1, 정신력: 1 } },

  // 3. 코길이 (ratio2a)
  { feature: '코길이', condition: 'high', changes: { 연애운: 1, 책임감: 1, 성실함: 1, 사교력: -1 } },
  { feature: '코길이', condition: 'low',  changes: { 정신력: -1, 연애운: 0, 성실함: 0, 사교력: 1, 긍정: 1 } },

  // 4. 인중길이 (ratio3a)
  { feature: '인중', condition: 'high', changes: { 장수: 1, 성실함: -1, 연애운: 1 } },
  { feature: '인중', condition: 'low',  changes: { 장수: 0, 사교력: -1, 긍정: -1, 체력: -1 } },

  // 5. 입크기 (ratio7a)
  { feature: '입크기', condition: 'high', changes: { 체력: 1, 업무: 1 } },
  { feature: '입크기', condition: 'low',  changes: { 체력: -1, 업무: -1 } },

  // 6. 하관 (ratio8a)
  { feature: '하관', condition: 'high', changes: { 중년운: 1, 사교력: 1 } },
  { feature: '하관', condition: 'low',  changes: { 중년운: -1, 사교력: 0 } },

  // 7. 눈크기 (youreye)
  { feature: '눈크기', condition: 'big',   changes: { 호기심: 1, 질투심: 0, 남의시선: 1 } },
  { feature: '눈크기', condition: 'small', changes: { 호기심: 0, 질투심: 1, 정신력: 1 } },
];

// === 관상 해석 텍스트 (Excel 기반) ===
export interface PhysiognomyInterpretation {
  feature: string;
  condition: string;
  shortLabel: string;
  description: string;
  advice?: string;
}

export const INTERPRETATIONS: PhysiognomyInterpretation[] = [
  // 눈두덩이
  {
    feature: '눈두덩이',
    condition: 'veryHigh',
    shortLabel: '눈두덩이가 매우 넓음',
    description: '타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 봅니다. 낙천적이고 개방적인 성격입니다.',
    advice: '재물과 관련된 문서 작성에서는 맺고 끊음을 확실히 하세요.',
  },
  {
    feature: '눈두덩이',
    condition: 'high',
    shortLabel: '눈두덩이가 넓은 편',
    description: '자연스럽게 복이 많은 삶을 살며, 낙천적인 성향을 가지고 있습니다. 온순하고 착한 면모로 주변에 호감을 줍니다.',
    advice: '개인적인 경계를 설정하는 연습이 필요합니다.',
  },
  {
    feature: '눈두덩이',
    condition: 'medium',
    shortLabel: '눈두덩이가 이상적',
    description: '눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 이점을 가져다주며, 자연스럽게 호감을 얻습니다.',
    advice: '마음의 여유를 유지하면 인생이 순탄합니다.',
  },
  {
    feature: '눈두덩이',
    condition: 'low',
    shortLabel: '눈두덩이가 좁은 편',
    description: '자신의 능력과 노력으로 성공을 이루는 자수성가형입니다. 일 처리가 섬세하고 꼼꼼합니다.',
    advice: '지나친 완벽주의는 조절이 필요합니다.',
  },

  // 코 관련
  {
    feature: '코',
    condition: 'long',
    shortLabel: '코가 긴 편',
    description: '책임감이 강하고 성실합니다. 자존심이 강해 결정한 바를 끝까지 밀고 나가는 완고함이 있습니다.',
    advice: '유연성을 가지면 대인관계가 더 좋아집니다.',
  },
  {
    feature: '코',
    condition: 'short',
    shortLabel: '코가 짧은 편',
    description: '낙관적이고 긍정적인 성격입니다. 상대의 기분을 잘 파악하며 장사에 소질이 있습니다.',
    advice: '깊이 생각하고 신중하게 결정하는 연습이 필요합니다.',
  },
  {
    feature: '코',
    condition: 'upturned',
    shortLabel: '들창코 (콧구멍이 보임)',
    description: '개방적이며 낙관적이고 시원시원한 성품입니다. 일의 결과에 성급할 수 있습니다.',
    advice: '장기적 계획을 세우고 금전관리에 신경쓰세요.',
  },
  {
    feature: '코',
    condition: 'hidden',
    shortLabel: '콧구멍 안보이는 코',
    description: '재물이 들어오면 잘 나가지 않는 자물통형입니다. 이성적 판단을 잘하고 금전관리에 능합니다.',
  },

  // 인중
  {
    feature: '인중',
    condition: 'long',
    shortLabel: '인중이 긴 편',
    description: '인간성이 뛰어나고 장수하는 경향이 있습니다. 인품 자체가 높은 평가를 받습니다.',
  },
  {
    feature: '인중',
    condition: 'short',
    shortLabel: '인중이 짧은 편',
    description: '성격적으로 다양한 관심사를 가지고 있습니다. 많은 사람과 교류하면 좋은 기회가 찾아옵니다.',
    advice: '장기적인 목표에 집중하는 연습이 도움됩니다.',
  },

  // 입
  {
    feature: '입',
    condition: 'large',
    shortLabel: '입이 큰 편',
    description: '리더십과 카리스마로 모두를 이끌어가는 성격입니다. 사회적으로 성공을 거둡니다.',
  },
  {
    feature: '입',
    condition: 'small',
    shortLabel: '입이 작은 편',
    description: '뛰어난 직관력과 빠른 판단력을 가지고 있습니다. 조언자나 보조 역할에 적합합니다.',
  },
  {
    feature: '입',
    condition: 'upturned',
    shortLabel: '입꼬리가 올라감',
    description: '긍정적 사고방식을 갖고 있습니다. 일처리를 야무지게 하고 살림을 잘합니다.',
  },
  {
    feature: '입',
    condition: 'downturned',
    shortLabel: '입꼬리가 처짐',
    description: '부정적인 생각이 강할 수 있습니다.',
    advice: '긍정적인 마음가짐을 유지하세요.',
  },

  // 턱/하관
  {
    feature: '하관',
    condition: 'strong',
    shortLabel: '하관이 튼튼함',
    description: '말년에 재물과 자녀의 복으로 풍요를 누립니다. 안정적인 재정 상태를 유지합니다.',
  },
  {
    feature: '하관',
    condition: 'pointed',
    shortLabel: '턱이 뾰족함',
    description: '말년에 재복과 자식 덕이 적을 수 있지만, 끊임없는 노력으로 자수성가합니다.',
    advice: '꾸준한 노력과 저축이 중요합니다.',
  },

  // 미간
  {
    feature: '미간',
    condition: 'wide',
    shortLabel: '미간이 넓음',
    description: '사고방식이 열려있고 이해력이 뛰어납니다. 지능이 좋고 시야가 넓습니다.',
  },
  {
    feature: '미간',
    condition: 'narrow',
    shortLabel: '미간이 좁음',
    description: '세상 보는 시야가 좁을 수 있습니다. 안전 지향형으로 약속을 잘 지킵니다.',
    advice: '융통성과 응용력을 기르세요.',
  },

  // 눈
  {
    feature: '눈',
    condition: 'long',
    shortLabel: '눈이 긴 편',
    description: '좋은 직업에 종사할 가능성이 높습니다.',
  },
  {
    feature: '눈',
    condition: 'big',
    shortLabel: '눈이 큰 편',
    description: '호기심이 왕성하고 표현력이 풍부합니다. 리더십이 뛰어납니다.',
    advice: '타인의 평가에 대한 불안을 관리하세요.',
  },
  {
    feature: '눈',
    condition: 'small',
    shortLabel: '눈이 작은 편',
    description: '신중하게 결정을 내립니다. 꾸준히 노력하여 성공하는 타입입니다.',
  },

  // 눈꼬리
  {
    feature: '눈꼬리',
    condition: 'upturned',
    shortLabel: '눈꼬리가 올라감',
    description: '대담하고 용기가 있으며 적극적이고 밝습니다. 자수성가하는 사람에게 많습니다.',
    advice: '감정의 기복을 조절하세요.',
  },
  {
    feature: '눈꼬리',
    condition: 'downturned',
    shortLabel: '눈꼬리가 내려감',
    description: '성품이 부드럽고 타인 배려를 잘합니다. 아이들을 좋아하며 연하를 선호하는 경향이 있습니다.',
    advice: '스트레스 관리가 중요합니다.',
  },

  // 눈썹
  {
    feature: '눈썹',
    condition: 'close',
    shortLabel: '눈과 눈썹이 붙음',
    description: '고독하고 배려심이 없을 수 있습니다.',
    advice: '타인에 대한 배려를 의식적으로 연습하세요.',
  },
  {
    feature: '눈썹',
    condition: 'drooping',
    shortLabel: '눈썹이 처짐',
    description: '낙천적인 성격으로 사교성이 좋습니다.',
    advice: '맺고 끊음을 확실히 하세요.',
  },

  // 입술
  {
    feature: '입술',
    condition: 'thin',
    shortLabel: '입술이 얇음',
    description: '책임감이 있고 담백합니다. 냉철하고 자기주관이 뚜렷합니다.',
    advice: '타인의 비밀을 말할 때 조심하세요.',
  },
];

// === 결과 문구 생성 ===
export interface ResultPhrase {
  minScore: number;
  trait: keyof PhysiognomyTraits;
  phrase: string;
}

export const RESULT_PHRASES: ResultPhrase[] = [
  // 높은 점수 (80+)
  { minScore: 80, trait: '연애운', phrase: '연애 걱정 없는 연애운 최고의 상입니다.' },
  { minScore: 80, trait: '정신력', phrase: '정신력은 따라올 자가 없는 상입니다.' },
  { minScore: 80, trait: '장수', phrase: '정말로 장수할 상입니다.' },
  { minScore: 80, trait: '재물', phrase: '돈이 따라오는 상입니다.' },
  { minScore: 80, trait: '업무', phrase: '일 하나는 똑부러지게 잘하는 상입니다.' },
  { minScore: 80, trait: '착함', phrase: '누가봐도 착한 얼굴을 가지고 있습니다.' },
  { minScore: 80, trait: '사교력', phrase: '사회성이 만랩인 상입니다.' },
  { minScore: 80, trait: '책임감', phrase: '책임감이 넘쳐 흐르는 상입니다.' },
  { minScore: 80, trait: '성실함', phrase: '성실함이 최고의 장점인 상입니다.' },

  // 중간 높음 (70+)
  { minScore: 70, trait: '중년운', phrase: '중년에 팔자가 피는 값비싼 상입니다.' },
  { minScore: 70, trait: '체력', phrase: '체력이 장군감인 상입니다.' },
  { minScore: 70, trait: '호기심', phrase: '호기심이 왕성해 보이는군요.' },

  // 특수 (부정적 특성이 높을 때)
  { minScore: 60, trait: '질투심', phrase: '질투심이 있는 상입니다.' },
  { minScore: 60, trait: '남의시선', phrase: '남의 시선을 다소 신경 쓰는 상입니다.' },
];

// === 특성 점수를 퍼센트로 변환 ===
export function traitToPercent(trait: keyof PhysiognomyTraits, value: number): number {
  const max = TRAIT_MAX_SCORES[trait];
  // 기본값 50%에서 시작하여 점수에 따라 조정
  const basePercent = 50;
  const adjustment = (value / max) * 30;  // 최대 ±30%
  return Math.max(20, Math.min(80, basePercent + adjustment));
}

// === 가장 높은 특성 찾기 ===
export function getTopTraits(traits: PhysiognomyTraits, count: number = 3): Array<{trait: string; value: number}> {
  const entries = Object.entries(traits) as Array<[keyof PhysiognomyTraits, number]>;

  // 부정적 특성 제외
  const positiveTraits = entries.filter(([key]) =>
    !['외도', '질투심', '남의시선'].includes(key)
  );

  return positiveTraits
    .sort((a, b) => {
      // 최대값 대비 비율로 정렬
      const ratioA = a[1] / TRAIT_MAX_SCORES[a[0]];
      const ratioB = b[1] / TRAIT_MAX_SCORES[b[0]];
      return ratioB - ratioA;
    })
    .slice(0, count)
    .map(([trait, value]) => ({ trait, value }));
}

// === 결과 문구 생성 ===
export function generateResultPhrase(traits: PhysiognomyTraits, totalScore: number): string {
  const topTraits = getTopTraits(traits, 1);

  if (topTraits.length === 0) {
    return `${totalScore}점 + 균형 잡힌 관상을 가지고 있습니다.`;
  }

  const topTrait = topTraits[0].trait as keyof PhysiognomyTraits;
  const traitPercent = traitToPercent(topTrait, traits[topTrait]);

  // 해당 특성에 맞는 문구 찾기
  const phrase = RESULT_PHRASES.find(p =>
    p.trait === topTrait && traitPercent >= p.minScore
  );

  if (phrase) {
    return `${totalScore}점 + ${phrase.phrase}`;
  }

  // 기본 문구
  return `${totalScore}점 + 좋은 관상을 가지고 있습니다.`;
}

// === 비율 레벨 계산 ===
export function getRatioLevel(ratioName: string, value: number): { level: number; label: string } {
  const thresholds = RATIO_THRESHOLDS[ratioName];
  if (!thresholds) {
    return { level: 3, label: '보통' };
  }

  for (let i = 0; i < thresholds.thresholds.length; i++) {
    if (value > thresholds.thresholds[i]) {
      return { level: 5 - i, label: thresholds.labels[i] };
    }
  }

  return { level: 1, label: thresholds.labels[thresholds.labels.length - 1] };
}

// === 해석 찾기 ===
export function findInterpretation(feature: string, condition: string): PhysiognomyInterpretation | undefined {
  return INTERPRETATIONS.find(i => i.feature === feature && i.condition === condition);
}

// === 특성 변화 적용 ===
export function applyTraitModifiers(
  traits: PhysiognomyTraits,
  feature: string,
  condition: string
): PhysiognomyTraits {
  const modifier = TRAIT_MODIFIERS.find(m => m.feature === feature && m.condition === condition);

  if (!modifier) return traits;

  const newTraits = { ...traits };

  for (const [key, change] of Object.entries(modifier.changes)) {
    const traitKey = key as keyof PhysiognomyTraits;
    newTraits[traitKey] = Math.max(0, Math.min(
      TRAIT_MAX_SCORES[traitKey],
      newTraits[traitKey] + (change as number)
    ));
  }

  return newTraits;
}

// ============================================================
// === 전체 관상 해석 (Overall Face Reading) ===
// ============================================================

// === 삼정(三停) - 얼굴 3등분 비율 ===
export interface ThreeSections {
  upper: number;   // 상정 (이마~눈썹): 초년운 (1-30세)
  middle: number;  // 중정 (눈썹~코밑): 중년운 (31-50세)
  lower: number;   // 하정 (코밑~턱끝): 말년운 (51세~)
  dominant: 'upper' | 'middle' | 'lower' | 'balanced';
  interpretation: string;
}

// === 오악(五岳) - 얼굴의 5개 돌출부 ===
export interface FivePeaks {
  forehead: string;  // 남악 (이마)
  chin: string;      // 북악 (턱)
  nose: string;      // 중악 (코)
  leftCheek: string; // 동악 (왼볼)
  rightCheek: string; // 서악 (오른볼)
  balance: string;   // 균형 상태
}

// === 얼굴형 ===
export type FaceShapeType =
  | '갑자형'   // 이마 넓고 턱 좁음 - 지적, 이상주의
  | '원형'     // 둥근 얼굴 - 사교적, 낙천적
  | '방형'     // 각진 얼굴 - 의지력, 리더십
  | '장형'     // 긴 얼굴 - 신중함, 끈기
  | '역삼각형' // 턱 뾰족 - 예술적, 예민
  | '타원형';  // 이상적 비율 - 균형, 조화

export interface FaceShape {
  type: FaceShapeType;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

// === 시기별 운세 ===
export interface LifePeriodFortune {
  earlyLife: {    // 초년운 (1-30세)
    score: number;
    description: string;
  };
  middleLife: {   // 중년운 (31-50세)
    score: number;
    description: string;
  };
  lateLife: {     // 말년운 (51세~)
    score: number;
    description: string;
  };
  overall: string;
}

// === 전체 관상 해석 결과 ===
export interface OverallFaceReading {
  // 삼정 비율
  threeSections: ThreeSections;

  // 얼굴형
  faceShape: FaceShape;

  // 시기별 운세
  lifePeriodFortune: LifePeriodFortune;

  // 종합 성격
  personality: {
    mainType: string;      // 주된 성격 유형
    description: string;   // 성격 설명
    strengths: string[];   // 장점
    weaknesses: string[];  // 단점
  };

  // 종합 운세
  fortune: {
    wealth: string;        // 재물운
    career: string;        // 직업운
    love: string;          // 연애/결혼운
    health: string;        // 건강운
    social: string;        // 대인관계
  };

  // 종합 조언
  advice: string[];

  // 한줄 총평
  oneLiner: string;

  // 나이대별 특이사항 (백세류년도 기반)
  ageFortuneDetails?: AgeFortuneDetail[];
}

// === 나이대별 특이사항 (百歲流年圖 기반) ===
export interface AgeFortuneDetail {
  ageRange: string;       // "10대", "20대", "30대" 등
  label: string;          // 핵심 키워드 (예: "학업 두각")
  fortune: 'great' | 'good' | 'normal' | 'caution';  // 운세 등급
  description: string;    // 상세 설명
  relatedFeature: string; // 관련 얼굴 부위
}

// === 삼정 비율 계산 ===
export function calculateThreeSections(
  foreheadToEyebrow: number,  // 이마~눈썹
  eyebrowToNoseBottom: number, // 눈썹~코밑
  noseBottomToChin: number     // 코밑~턱끝
): ThreeSections {
  const total = foreheadToEyebrow + eyebrowToNoseBottom + noseBottomToChin;

  const upper = foreheadToEyebrow / total;
  const middle = eyebrowToNoseBottom / total;
  const lower = noseBottomToChin / total;

  // 어느 부분이 우세한지 판단
  let dominant: 'upper' | 'middle' | 'lower' | 'balanced';
  let interpretation: string;

  const idealRatio = 1/3;
  const threshold = 0.05; // 5% 이상 차이나면 우세

  if (Math.abs(upper - idealRatio) < threshold &&
      Math.abs(middle - idealRatio) < threshold &&
      Math.abs(lower - idealRatio) < threshold) {
    dominant = 'balanced';
    interpretation = '삼정이 균형 잡힌 이상적인 얼굴입니다. 초년, 중년, 말년 모두 고르게 발전하는 안정적인 인생을 살 가능성이 높습니다.';
  } else if (upper > middle && upper > lower) {
    dominant = 'upper';
    if (upper > 0.38) {
      interpretation = '상정(이마)이 매우 발달했습니다. 지적 능력이 뛰어나고 초년에 두각을 나타낼 가능성이 높습니다. 학업운과 출세운이 좋으며, 30세 이전에 인생의 기반을 다지게 됩니다.';
    } else {
      interpretation = '상정(이마)이 발달한 편입니다. 사고력이 좋고 계획적입니다. 초년운이 좋아 젊은 시절에 기회가 많이 찾아옵니다.';
    }
  } else if (middle > upper && middle > lower) {
    dominant = 'middle';
    if (middle > 0.38) {
      interpretation = '중정(코)이 매우 발달했습니다. 31-50세 사이에 인생의 전성기를 맞이할 가능성이 높습니다. 사회적 성공과 재물운이 좋으며, 고위직에 오를 수 있는 상입니다.';
    } else {
      interpretation = '중정(코)이 발달한 편입니다. 중년기에 운이 트이며, 40대에 큰 성과를 이룰 수 있습니다.';
    }
  } else {
    dominant = 'lower';
    if (lower > 0.38) {
      interpretation = '하정(턱)이 매우 발달했습니다. 말년운이 매우 좋아 노후가 풍요롭습니다. 자녀운과 부동산운이 좋으며, 인생 후반부에 결실을 맺습니다. 단, 지나치게 길 경우 평생 고생이 있을 수도 있습니다.';
    } else {
      interpretation = '하정(턱)이 발달한 편입니다. 말년운이 좋아 노후가 안정적입니다. 부동산과 자녀로부터 복을 받습니다.';
    }
  }

  return { upper, middle, lower, dominant, interpretation };
}

// === 얼굴형 판단 ===
export function determineFaceShape(
  faceWidth: number,
  faceHeight: number,
  foreheadWidth: number,
  jawWidth: number,
  cheekWidth: number
): FaceShape {
  const ratio = faceHeight / faceWidth;
  const foreheadToJaw = foreheadWidth / jawWidth;
  const cheekToJaw = cheekWidth / jawWidth;

  let type: FaceShapeType;
  let description: string;
  let strengths: string[];
  let weaknesses: string[];

  if (foreheadToJaw > 1.3 && ratio > 1.2) {
    type = '갑자형';
    description = '이마가 넓고 턱이 좁은 형태로, 지적이고 이상주의적인 성향이 강합니다.';
    strengths = ['뛰어난 두뇌', '창의력', '분석력', '학문적 성취'];
    weaknesses = ['현실감각 부족', '말년 고생 가능', '완고함'];
  } else if (ratio < 1.1 && cheekToJaw > 0.95) {
    type = '원형';
    description = '둥글고 부드러운 얼굴형으로, 사교적이고 낙천적인 성격입니다.';
    strengths = ['사교성', '친화력', '적응력', '낙천성'];
    weaknesses = ['우유부단함', '결단력 부족', '식탐'];
  } else if (ratio < 1.2 && foreheadToJaw < 1.1 && cheekToJaw < 1.1) {
    type = '방형';
    description = '각지고 뚜렷한 얼굴형으로, 의지력과 리더십이 강합니다.';
    strengths = ['리더십', '결단력', '책임감', '신뢰성'];
    weaknesses = ['고집', '융통성 부족', '완고함'];
  } else if (ratio > 1.4) {
    type = '장형';
    description = '길고 좁은 얼굴형으로, 신중하고 끈기 있는 성격입니다.';
    strengths = ['신중함', '인내력', '성실함', '집중력'];
    weaknesses = ['우울함', '내성적', '고독'];
  } else if (foreheadToJaw > 1.2 && jawWidth < cheekWidth * 0.8) {
    type = '역삼각형';
    description = '턱이 뾰족하고 이마가 넓은 형태로, 예술적 감각과 예민함을 가지고 있습니다.';
    strengths = ['예술적 감각', '섬세함', '창의성', '직관력'];
    weaknesses = ['예민함', '스트레스에 약함', '말년 고생'];
  } else {
    type = '타원형';
    description = '균형 잡힌 이상적인 얼굴형으로, 조화롭고 안정적인 성격입니다.';
    strengths = ['균형감', '조화', '안정성', '적응력'];
    weaknesses = ['특별한 약점 없음'];
  }

  return { type, description, strengths, weaknesses };
}

// === 시기별 운세 계산 ===
export function calculateLifePeriodFortune(
  threeSections: ThreeSections,
  traits: PhysiognomyTraits,
  faceShape: FaceShape
): LifePeriodFortune {
  // 초년운 (상정 + 관련 특성)
  const earlyScore = Math.round(
    (threeSections.upper * 100 * 0.5) +
    (traits.정신력 / TRAIT_MAX_SCORES.정신력 * 25) +
    (traits.호기심 / TRAIT_MAX_SCORES.호기심 * 25)
  );

  // 중년운 (중정 + 관련 특성)
  const middleScore = Math.round(
    (threeSections.middle * 100 * 0.5) +
    (traits.중년운 / TRAIT_MAX_SCORES.중년운 * 20) +
    (traits.업무 / TRAIT_MAX_SCORES.업무 * 15) +
    (traits.재물 / TRAIT_MAX_SCORES.재물 * 15)
  );

  // 말년운 (하정 + 관련 특성)
  const lateScore = Math.round(
    (threeSections.lower * 100 * 0.5) +
    (traits.장수 / TRAIT_MAX_SCORES.장수 * 20) +
    (traits.사교력 / TRAIT_MAX_SCORES.사교력 * 15) +
    (traits.체력 / TRAIT_MAX_SCORES.체력 * 15)
  );

  // 설명 생성
  const getDescription = (score: number, period: string): string => {
    if (score >= 70) return `${period}이 매우 좋습니다. 이 시기에 큰 발전과 성취가 기대됩니다.`;
    if (score >= 55) return `${period}이 좋은 편입니다. 안정적인 발전이 있을 것입니다.`;
    if (score >= 40) return `${period}은 보통입니다. 꾸준한 노력이 필요합니다.`;
    return `${period}에 어려움이 있을 수 있습니다. 미리 대비하고 준비하세요.`;
  };

  // 전체 운세 요약
  const scores = [earlyScore, middleScore, lateScore];
  const maxPeriod = scores.indexOf(Math.max(...scores));
  const periodNames = ['초년', '중년', '말년'];

  let overall: string;
  if (Math.max(...scores) - Math.min(...scores) < 15) {
    overall = '인생 전반에 걸쳐 균형 잡힌 운세를 가지고 있습니다. 큰 기복 없이 안정적인 삶을 살 가능성이 높습니다.';
  } else {
    overall = `${periodNames[maxPeriod]}에 가장 좋은 운이 찾아옵니다. 이 시기를 잘 활용하여 인생의 기반을 다지세요.`;
  }

  return {
    earlyLife: {
      score: Math.min(100, earlyScore),
      description: getDescription(earlyScore, '초년운'),
    },
    middleLife: {
      score: Math.min(100, middleScore),
      description: getDescription(middleScore, '중년운'),
    },
    lateLife: {
      score: Math.min(100, lateScore),
      description: getDescription(lateScore, '말년운'),
    },
    overall,
  };
}

// === 종합 성격 분석 ===
export function analyzePersonality(traits: PhysiognomyTraits, faceShape: FaceShape): {
  mainType: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
} {
  const topTraits = getTopTraits(traits, 3);

  // 주된 성격 유형 결정
  let mainType: string;
  let description: string;

  if (traits.정신력 >= 4 && traits.책임감 >= 3) {
    mainType = '리더형';
    description = '강한 의지력과 책임감을 바탕으로 조직을 이끄는 리더형 성격입니다. 결단력이 있고 목표 지향적입니다.';
  } else if (traits.사교력 >= 2 && traits.착함 >= 2) {
    mainType = '사교형';
    description = '뛰어난 대인관계 능력과 친절함으로 사람들에게 사랑받는 사교형 성격입니다. 분위기 메이커 역할을 합니다.';
  } else if (traits.성실함 >= 2 && traits.책임감 >= 3) {
    mainType = '성실형';
    description = '꾸준하고 성실한 노력으로 목표를 달성하는 성실형 성격입니다. 신뢰받는 인재입니다.';
  } else if (traits.호기심 >= 1 && traits.긍정 >= 3) {
    mainType = '탐험형';
    description = '새로운 것에 대한 호기심과 긍정적인 마인드로 도전하는 탐험형 성격입니다.';
  } else if (traits.재물 >= 3 && traits.업무 >= 3) {
    mainType = '사업형';
    description = '재물운과 업무 능력이 뛰어나 사업에서 성공할 가능성이 높은 사업형 성격입니다.';
  } else {
    mainType = '균형형';
    description = '다양한 특성이 균형을 이루고 있어 상황에 따라 유연하게 대처하는 균형형 성격입니다.';
  }

  // 장단점은 얼굴형에서 가져옴
  return {
    mainType,
    description,
    strengths: [...faceShape.strengths, ...topTraits.map(t => `${t.trait}이(가) 뛰어남`)],
    weaknesses: faceShape.weaknesses,
  };
}

// === 종합 운세 분석 ===
export function analyzeFortuneAreas(traits: PhysiognomyTraits): {
  wealth: string;
  career: string;
  love: string;
  health: string;
  social: string;
} {
  // 재물운
  const wealthScore = (traits.재물 / TRAIT_MAX_SCORES.재물) +
                     (traits.업무 / TRAIT_MAX_SCORES.업무) / 2;
  let wealth: string;
  if (wealthScore > 1.5) {
    wealth = '재물운이 매우 좋습니다. 돈이 자연스럽게 따라오는 상이며, 투자에도 성공할 가능성이 높습니다.';
  } else if (wealthScore > 1.0) {
    wealth = '재물운이 좋은 편입니다. 꾸준한 저축과 현명한 소비로 부를 축적할 수 있습니다.';
  } else if (wealthScore > 0.5) {
    wealth = '재물운은 보통입니다. 노력한 만큼 얻는 상이니 꾸준히 노력하세요.';
  } else {
    wealth = '재물운에 어려움이 있을 수 있습니다. 저축 습관과 재정 관리에 신경 쓰세요.';
  }

  // 직업운
  const careerScore = (traits.업무 / TRAIT_MAX_SCORES.업무) +
                     (traits.책임감 / TRAIT_MAX_SCORES.책임감) / 2;
  let career: string;
  if (careerScore > 1.5) {
    career = '직업운이 매우 좋습니다. 선택한 분야에서 두각을 나타내고 승진이 빠를 것입니다.';
  } else if (careerScore > 1.0) {
    career = '직업운이 좋은 편입니다. 안정적인 직장생활과 꾸준한 발전이 기대됩니다.';
  } else if (careerScore > 0.5) {
    career = '직업운은 보통입니다. 자신의 적성을 찾아 전문성을 기르세요.';
  } else {
    career = '직업에서 어려움이 있을 수 있습니다. 꾸준한 자기계발이 필요합니다.';
  }

  // 연애/결혼운
  const loveScore = (traits.연애운 / TRAIT_MAX_SCORES.연애운) +
                   (traits.착함 / TRAIT_MAX_SCORES.착함) / 2;
  let love: string;
  if (loveScore > 1.5) {
    love = '연애운이 매우 좋습니다. 좋은 인연을 만나 행복한 가정을 이룰 상입니다.';
  } else if (loveScore > 1.0) {
    love = '연애운이 좋은 편입니다. 진실된 마음으로 다가가면 좋은 인연을 만납니다.';
  } else if (loveScore > 0.5) {
    love = '연애운은 보통입니다. 급하게 생각하지 말고 천천히 인연을 기다리세요.';
  } else {
    love = '연애에 어려움이 있을 수 있습니다. 자신을 먼저 사랑하고 가꾸세요.';
  }

  // 건강운
  const healthScore = (traits.장수 / TRAIT_MAX_SCORES.장수) +
                     (traits.체력 / TRAIT_MAX_SCORES.체력) / 2;
  let health: string;
  if (healthScore > 1.5) {
    health = '건강운이 매우 좋습니다. 타고난 체력이 좋아 장수할 상입니다.';
  } else if (healthScore > 1.0) {
    health = '건강운이 좋은 편입니다. 규칙적인 생활을 유지하면 건강하게 살 수 있습니다.';
  } else if (healthScore > 0.5) {
    health = '건강운은 보통입니다. 정기적인 건강검진과 운동을 권합니다.';
  } else {
    health = '건강에 주의가 필요합니다. 무리하지 말고 충분한 휴식을 취하세요.';
  }

  // 대인관계
  const socialScore = (traits.사교력 / TRAIT_MAX_SCORES.사교력) +
                     (traits.착함 / TRAIT_MAX_SCORES.착함) / 2;
  let social: string;
  if (socialScore > 1.5) {
    social = '대인관계가 매우 좋습니다. 주변에 사람이 많고 귀인의 도움을 받습니다.';
  } else if (socialScore > 1.0) {
    social = '대인관계가 좋은 편입니다. 신뢰받는 관계를 형성할 수 있습니다.';
  } else if (socialScore > 0.5) {
    social = '대인관계는 보통입니다. 먼저 다가가고 경청하는 태도가 필요합니다.';
  } else {
    social = '대인관계에 어려움이 있을 수 있습니다. 열린 마음으로 사람들을 대하세요.';
  }

  return { wealth, career, love, health, social };
}

// === 종합 조언 생성 ===
export function generateOverallAdvice(
  traits: PhysiognomyTraits,
  faceShape: FaceShape,
  lifePeriod: LifePeriodFortune
): string[] {
  const advice: string[] = [];

  // 약한 특성에 대한 조언
  if (traits.정신력 < 2) {
    advice.push('의지력을 기르기 위해 작은 목표부터 달성하는 습관을 들이세요.');
  }
  if (traits.사교력 < 1) {
    advice.push('대인관계를 넓히기 위해 새로운 모임에 참여해 보세요.');
  }
  if (traits.재물 < 2) {
    advice.push('재정 관리를 위해 저축 습관을 기르고 불필요한 지출을 줄이세요.');
  }
  if (traits.성실함 < 1) {
    advice.push('꾸준함이 성공의 열쇠입니다. 매일 조금씩 실천하세요.');
  }

  // 부정적 특성에 대한 조언
  if (traits.외도 > 0) {
    advice.push('충동적인 결정을 피하고 한 번 더 생각하는 습관을 기르세요.');
  }
  if (traits.질투심 > 1) {
    advice.push('타인과 비교하기보다 자신의 성장에 집중하세요.');
  }

  // 시기별 조언
  if (lifePeriod.earlyLife.score < 50) {
    advice.push('젊은 시절 어려움이 있더라도 포기하지 마세요. 후반에 좋아집니다.');
  }
  if (lifePeriod.middleLife.score > 70) {
    advice.push('중년기가 인생의 전성기입니다. 이 시기를 잘 활용하세요.');
  }
  if (lifePeriod.lateLife.score < 50) {
    advice.push('노후 대비를 미리 하세요. 저축과 건강관리가 중요합니다.');
  }

  // 얼굴형 기반 조언
  if (faceShape.type === '갑자형' || faceShape.type === '역삼각형') {
    advice.push('현실적인 목표 설정과 실행력을 기르세요.');
  }
  if (faceShape.type === '원형') {
    advice.push('결단력을 기르고 우유부단함을 극복하세요.');
  }

  // 기본 조언
  if (advice.length === 0) {
    advice.push('현재의 좋은 운세를 유지하며 긍정적인 마음가짐을 가지세요.');
    advice.push('꾸준한 자기계발과 건강관리로 더 나은 미래를 준비하세요.');
  }

  return advice;
}

// === 한줄 총평 생성 ===
export function generateOneLiner(
  score: number,
  traits: PhysiognomyTraits,
  faceShape: FaceShape,
  lifePeriod: LifePeriodFortune
): string {
  const topTraits = getTopTraits(traits, 2);
  const topTraitNames = topTraits.map(t => t.trait).join(', ');

  // 가장 좋은 시기
  const periods = [
    { name: '초년', score: lifePeriod.earlyLife.score },
    { name: '중년', score: lifePeriod.middleLife.score },
    { name: '말년', score: lifePeriod.lateLife.score },
  ];
  const bestPeriod = periods.reduce((a, b) => a.score > b.score ? a : b);

  if (score >= 80) {
    return `${topTraitNames}이(가) 뛰어난 최상의 관상입니다. ${bestPeriod.name}에 큰 성공이 기대됩니다.`;
  } else if (score >= 65) {
    return `${faceShape.type} 얼굴형으로 ${topTraitNames}이(가) 장점입니다. ${bestPeriod.name}운이 특히 좋습니다.`;
  } else if (score >= 50) {
    return `균형 잡힌 관상으로 ${topTraitNames}을(를) 살리면 성공할 수 있습니다.`;
  } else {
    return `노력형 관상입니다. ${faceShape.strengths[0]}을(를) 살려 꾸준히 정진하세요.`;
  }
}

// === 전체 관상 해석 생성 (메인 함수) ===
export function generateOverallReading(
  // 삼정 측정값
  foreheadToEyebrow: number,
  eyebrowToNoseBottom: number,
  noseBottomToChin: number,
  // 얼굴형 측정값
  faceWidth: number,
  faceHeight: number,
  foreheadWidth: number,
  jawWidth: number,
  cheekWidth: number,
  // 특성 점수
  traits: PhysiognomyTraits,
  // 총점
  totalScore: number
): OverallFaceReading {
  // 삼정 계산
  const threeSections = calculateThreeSections(
    foreheadToEyebrow,
    eyebrowToNoseBottom,
    noseBottomToChin
  );

  // 얼굴형 판단
  const faceShape = determineFaceShape(
    faceWidth,
    faceHeight,
    foreheadWidth,
    jawWidth,
    cheekWidth
  );

  // 시기별 운세
  const lifePeriodFortune = calculateLifePeriodFortune(
    threeSections,
    traits,
    faceShape
  );

  // 성격 분석
  const personality = analyzePersonality(traits, faceShape);

  // 운세 분석
  const fortune = analyzeFortuneAreas(traits);

  // 조언
  const advice = generateOverallAdvice(traits, faceShape, lifePeriodFortune);

  // 한줄 총평
  const oneLiner = generateOneLiner(totalScore, traits, faceShape, lifePeriodFortune);

  // 나이대별 특이사항
  const ageFortuneDetails = calculateAgeFortuneDetails(
    threeSections,
    traits,
    faceShape
  );

  return {
    threeSections,
    faceShape,
    lifePeriodFortune,
    personality,
    fortune,
    advice,
    oneLiner,
    ageFortuneDetails,
  };
}

// === 나이대별 특이사항 계산 (百歲流年圖 기반) ===
// 관상학에서 얼굴의 각 부위는 특정 나이대의 운세를 나타냄:
// - 이마(상정): 15~30세 → 10대, 20대
// - 눈썹/눈(중정 상부): 31~40세 → 30대
// - 코(중정 하부): 41~50세 → 40대
// - 입/인중(하정 상부): 51~60세 → 50대
// - 턱/하관(하정 하부): 61세~ → 60대 이후
export function calculateAgeFortuneDetails(
  threeSections: ThreeSections,
  traits: PhysiognomyTraits,
  faceShape: FaceShape
): AgeFortuneDetail[] {
  const details: AgeFortuneDetail[] = [];

  // --- 10대 (이마 = 상정, 정신력/호기심) ---
  const teens = calculateTeensFortune(threeSections, traits);
  details.push(teens);

  // --- 20대 (이마 + 눈썹 경계, 정신력/긍정/호기심) ---
  const twenties = calculateTwentiesFortune(threeSections, traits);
  details.push(twenties);

  // --- 30대 (눈썹/눈 = 중정 상부, 연애운/사교력) ---
  const thirties = calculateThirtiesFortune(threeSections, traits);
  details.push(thirties);

  // --- 40대 (코 = 중정 하부, 재물/업무/중년운) ---
  const forties = calculateFortiesFortune(threeSections, traits);
  details.push(forties);

  // --- 50대 (입/인중 = 하정 상부, 장수/체력/책임감) ---
  const fifties = calculateFiftiesFortune(threeSections, traits);
  details.push(fifties);

  // --- 60대 이후 (턱/하관 = 하정 하부, 장수/사교력) ---
  const sixties = calculateSixtiesFortune(threeSections, traits, faceShape);
  details.push(sixties);

  return details;
}

function getFortuneTier(score: number): 'great' | 'good' | 'normal' | 'caution' {
  if (score >= 75) return 'great';
  if (score >= 55) return 'good';
  if (score >= 35) return 'normal';
  return 'caution';
}

// 10대: 이마(상정) + 정신력, 호기심
function calculateTeensFortune(ts: ThreeSections, traits: PhysiognomyTraits): AgeFortuneDetail {
  const score = Math.round(
    (ts.upper * 100 * 0.5) +
    (traits.호기심 / TRAIT_MAX_SCORES.호기심 * 30) +
    (traits.정신력 / TRAIT_MAX_SCORES.정신력 * 20)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '넓고 맑은 이마상으로, 학업에서 두각을 나타내며 부모의 든든한 지원 아래 순탄한 성장기를 보냅니다. 총명함이 빛을 발하는 시기입니다.',
    good: '안정된 이마상으로, 학업과 성장이 고르게 이루어지는 시기입니다. 좋은 스승이나 멘토를 만날 가능성이 높습니다.',
    normal: '평범한 성장기이나, 꾸준한 노력이 뒷받침되면 기반을 다질 수 있는 시기입니다.',
    caution: '이마가 좁은 편으로, 어린 시절 고생이 있을 수 있으나 이것이 오히려 강한 독립심과 인내력을 길러줍니다.',
  };
  const labelMap = { great: '학업 두각', good: '안정 성장', normal: '꾸준한 노력기', caution: '조기 자립' };

  return {
    ageRange: '10대',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '이마(상정)',
  };
}

// 20대: 이마~눈썹 경계 + 정신력, 긍정, 호기심
function calculateTwentiesFortune(ts: ThreeSections, traits: PhysiognomyTraits): AgeFortuneDetail {
  const score = Math.round(
    (ts.upper * 100 * 0.35) +
    (traits.정신력 / TRAIT_MAX_SCORES.정신력 * 25) +
    (traits.긍정 / TRAIT_MAX_SCORES.긍정 * 20) +
    (traits.호기심 / TRAIT_MAX_SCORES.호기심 * 20)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '이마에서 눈썹으로 이어지는 기운이 활발하여, 사회에 첫 발을 내딛으며 빠른 성과를 이룹니다. 귀인을 만나 도움을 받는 운이 강합니다.',
    good: '안정적인 사회 진출기로, 자신만의 영역을 착실히 구축해 나갑니다. 초반의 노력이 30대에 결실을 맺습니다.',
    normal: '시행착오를 거치며 성장하는 시기입니다. 다양한 경험이 인생의 자산이 됩니다.',
    caution: '사회 진출 초기 어려움이 있을 수 있으나, 이 시기의 고생이 중년 이후 큰 성공의 밑거름이 됩니다.',
  };
  const labelMap = { great: '귀인 출현', good: '착실한 기반', normal: '시행착오 성장', caution: '고진감래' };

  return {
    ageRange: '20대',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '이마~눈썹(상정 하부)',
  };
}

// 30대: 눈썹/눈 = 중정 상부, 연애운/사교력/정신력
function calculateThirtiesFortune(ts: ThreeSections, traits: PhysiognomyTraits): AgeFortuneDetail {
  const score = Math.round(
    (ts.middle * 100 * 0.35) +
    (traits.연애운 / TRAIT_MAX_SCORES.연애운 * 25) +
    (traits.사교력 / TRAIT_MAX_SCORES.사교력 * 20) +
    (traits.정신력 / TRAIT_MAX_SCORES.정신력 * 20)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '눈과 눈썹의 기운이 왕성하여, 대인관계와 연애/결혼에서 큰 행운이 찾아옵니다. 인생의 동반자를 만나고 사회적으로도 인정받는 전성기입니다.',
    good: '안정적인 대인관계를 바탕으로 결혼과 가정을 이루기 좋은 시기입니다. 직장에서도 신뢰를 쌓아갑니다.',
    normal: '인간관계에서 선택과 집중이 필요한 시기입니다. 진정한 인연을 알아보는 눈이 중요합니다.',
    caution: '대인관계에서 시련이 있을 수 있으나, 진심을 다하면 늦더라도 좋은 인연이 찾아옵니다.',
  };
  const labelMap = { great: '연애 전성기', good: '안정 결실', normal: '선택과 집중', caution: '늦깎이 인연' };

  return {
    ageRange: '30대',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '눈썹·눈(중정 상부)',
  };
}

// 40대: 코 = 중정 하부, 재물/업무/중년운
function calculateFortiesFortune(ts: ThreeSections, traits: PhysiognomyTraits): AgeFortuneDetail {
  const score = Math.round(
    (ts.middle * 100 * 0.3) +
    (traits.재물 / TRAIT_MAX_SCORES.재물 * 25) +
    (traits.업무 / TRAIT_MAX_SCORES.업무 * 20) +
    (traits.중년운 / TRAIT_MAX_SCORES.중년운 * 25)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '코의 기운이 풍성하여, 재물운과 직업운이 절정에 달합니다. 사업이나 투자에서 큰 성과를 거두며 경제적 풍요를 누립니다.',
    good: '꾸준히 쌓아온 실력이 빛을 발하는 시기로, 재물이 안정적으로 들어옵니다. 승진이나 사업 확장의 기회가 있습니다.',
    normal: '경제적으로 균형을 맞추는 시기입니다. 무리한 투자보다 안정적인 재테크가 유리합니다.',
    caution: '재물의 출입이 불안정할 수 있으니, 절약과 저축을 통해 미래를 대비하세요. 본업에 충실하면 위기를 넘깁니다.',
  };
  const labelMap = { great: '재물 전성기', good: '안정 수입', normal: '균형 재정', caution: '절약 필요' };

  return {
    ageRange: '40대',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '코(중정 하부)',
  };
}

// 50대: 입/인중 = 하정 상부, 장수/체력/책임감
function calculateFiftiesFortune(ts: ThreeSections, traits: PhysiognomyTraits): AgeFortuneDetail {
  const score = Math.round(
    (ts.lower * 100 * 0.3) +
    (traits.장수 / TRAIT_MAX_SCORES.장수 * 25) +
    (traits.체력 / TRAIT_MAX_SCORES.체력 * 20) +
    (traits.책임감 / TRAIT_MAX_SCORES.책임감 * 25)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '인중과 입의 기운이 좋아, 건강하고 활력 넘치는 50대를 보냅니다. 자녀로부터 효도를 받으며 사회적 지위도 유지됩니다.',
    good: '건강 관리에 신경 쓰면 활기찬 중년을 보낼 수 있습니다. 가정에서 안정과 행복을 찾는 시기입니다.',
    normal: '체력 관리가 핵심인 시기입니다. 규칙적인 생활과 운동이 남은 인생의 질을 좌우합니다.',
    caution: '건강에 특별히 유의해야 하는 시기입니다. 정기적인 건강검진과 체력 관리가 반드시 필요합니다.',
  };
  const labelMap = { great: '건강 장수', good: '안정 가정', normal: '체력 관리기', caution: '건강 주의' };

  return {
    ageRange: '50대',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '인중·입(하정 상부)',
  };
}

// 60대 이후: 턱/하관 = 하정 하부, 장수/사교력 + 얼굴형
function calculateSixtiesFortune(ts: ThreeSections, traits: PhysiognomyTraits, faceShape: FaceShape): AgeFortuneDetail {
  const faceShapeBonus = (faceShape.type === '원형' || faceShape.type === '방형') ? 10 : 0;
  const score = Math.round(
    (ts.lower * 100 * 0.35) +
    (traits.장수 / TRAIT_MAX_SCORES.장수 * 25) +
    (traits.사교력 / TRAIT_MAX_SCORES.사교력 * 20) +
    faceShapeBonus +
    (traits.성실함 / TRAIT_MAX_SCORES.성실함 * 10)
  );
  const tier = getFortuneTier(score);

  const descMap = {
    great: '턱과 하관의 기운이 풍성하여, 자녀복과 부동산복이 넘치는 말년입니다. 주변 사람들의 존경과 사랑을 받으며 풍요로운 노후를 보냅니다.',
    good: '안정적인 하관으로, 편안하고 여유로운 말년을 보냅니다. 자녀와의 관계도 원만하며 소소한 행복이 가득합니다.',
    normal: '노후 준비를 착실히 하면 안정적인 말년을 보낼 수 있습니다. 취미 활동과 사회적 교류가 삶의 질을 높입니다.',
    caution: '턱이 가늘어 말년에 외로울 수 있으나, 젊은 시절부터 인간관계와 재산을 잘 관리하면 충분히 극복됩니다.',
  };
  const labelMap = { great: '풍요로운 노후', good: '편안한 말년', normal: '준비된 노후', caution: '노후 대비 필요' };

  return {
    ageRange: '60대 이후',
    label: labelMap[tier],
    fortune: tier,
    description: descMap[tier],
    relatedFeature: '턱·하관(하정 하부)',
  };
}
