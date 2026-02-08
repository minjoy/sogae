// 얼굴 분석 알고리즘 - Python에서 TypeScript로 포팅
// Google Cloud Vision API의 얼굴 랜드마크 기반 관상 분석

export interface FacePoint {
  x: number;
  y: number;
  z?: number;
}

export interface FaceLandmarks {
  // 얼굴 주요 포인트 (Google Vision API 랜드마크 순서)
  leftEye: FacePoint;           // 0
  rightEye: FacePoint;          // 1
  leftEyebrowLeft: FacePoint;   // 2
  leftEyebrowRight: FacePoint;  // 3
  rightEyebrowLeft: FacePoint;  // 4
  rightEyebrowRight: FacePoint; // 5
  noseTip: FacePoint;           // 6
  upperLip: FacePoint;          // 8
  lowerLip: FacePoint;          // 9
  mouthLeft: FacePoint;         // 10
  mouthRight: FacePoint;        // 11
  mouthCenter: FacePoint;       // 12
  noseBottomRight: FacePoint;   // 13
  noseBottomLeft: FacePoint;    // 14
  noseBottomCenter: FacePoint;  // 15
  leftEyeTopBoundary: FacePoint;    // 16
  leftEyeLeftCorner: FacePoint;     // 17
  leftEyeBottomBoundary: FacePoint; // 18
  leftEyeRightCorner: FacePoint;    // 19
  rightEyeTopBoundary: FacePoint;   // 20
  rightEyeRightCorner: FacePoint;   // 21
  rightEyeBottomBoundary: FacePoint;// 22
  rightEyeLeftCorner: FacePoint;    // 23
  leftEyebrowUpperMidpoint: FacePoint; // 24
  rightEyebrowUpperMidpoint: FacePoint;// 25
  leftCheek: FacePoint;         // 26
  rightCheek: FacePoint;        // 27
  chin: FacePoint;              // 29
  jawLeft: FacePoint;           // 30
  jawRight: FacePoint;          // 31
  forehead: FacePoint;          // 32
  // raw array for compatibility
  all: FacePoint[];
}

export interface FaceAnalysisResult {
  facecode: string;
  score: number;
  panAngle: number;  // 얼굴 좌우 회전 각도
  tiltAngle: number; // 얼굴 상하 기울기 각도
  rollAngle: number; // 얼굴 회전 각도

  // 분석 결과 카테고리
  categories: {
    r1: number; // 운명/권력 점수
    r2: number; // 정신/성인/사랑 점수
    r3: number; // 일/사교/돈 점수
    r4: number; // 친절/책임/진실 점수
  };

  // 각 부위별 분석
  analysis: {
    eyeAngle: { label: string; description: string; };
    eyebrowDistance: { label: string; description: string; };
    noseLength: { label: string; description: string; };
    philtrumLength: { label: string; description: string; };
    mouthWidth: { label: string; description: string; };
    jawWidth: { label: string; description: string; };
    eyeSize: { label: string; description: string; };
  };

  // 종합 해석
  summary: string;
  recommendations: string[];

  // 성별 (분석에 사용)
  gender: 'male' | 'female';
}

// 가중치 설정
const WEIGHTS = {
  r1_power: 3,
  r1_old: 5,
  r2_spirit: 5,
  r2_adult: 3,
  r2_love: 4,
  r2_jealousy: 1,
  r3_work: 4,
  r3_social: 4,
  r3_someone: 1,
  r3_money: 4,
  r4_kind: 3,
  r4_wind: 1,
  r4_responsibility: 3,
  r4_sincere: 3,
};

// 각도 보정 함수 - 얼굴 회전에 따른 비율 보정
function correctForAngle(value: number, panAngle: number, sensitivity: number = 1): number {
  // panAngle이 클수록 (얼굴이 옆으로 돌아갈수록) 비율 왜곡 보정
  const angleRad = Math.abs(panAngle) * Math.PI / 180;
  const correctionFactor = Math.cos(angleRad * sensitivity);
  return value / Math.max(correctionFactor, 0.7); // 최소 0.7로 제한
}

// 두 점 사이의 기울기 계산
function calculateSlope(p1: FacePoint, p2: FacePoint): number {
  if (p2.x === p1.x) return 0;
  return (p2.y - p1.y) / (p2.x - p1.x);
}

// 두 점 사이의 거리 계산
function distance(p1: FacePoint, p2: FacePoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// 각도를 라디안에서 도로 변환
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function analyzeFace(
  landmarks: FaceLandmarks,
  gender: 'male' | 'female',
  panAngle: number = 0,
  tiltAngle: number = 0,
  rollAngle: number = 0
): FaceAnalysisResult {
  const fp = landmarks.all;
  let score = 0;
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0;

  // 기준 비율 (코 너비)
  const noseWidth = Math.abs(fp[13].x - fp[14].x);
  const faceWidth = Math.abs(fp[27].x - fp[26].x);

  // 각도 보정된 비율 계산
  const correctedNoseWidth = correctForAngle(noseWidth, panAngle, 0.8);

  // === 눈꼬리 각도 분석 ===
  const leftEyeInnerSlope = calculateSlope(fp[23], fp[17]);
  const leftEyeOuterSlope = calculateSlope(fp[21], fp[19]);

  const angleRad = Math.atan(leftEyeInnerSlope);
  const eyeAngleRef = toDegrees(angleRad);

  // 눈꼬리 각도에 따른 y좌표 차이 계산
  const b1_y = leftEyeInnerSlope * fp[6].x + (fp[23].y - leftEyeInnerSlope * fp[23].x);
  const b2_y = leftEyeInnerSlope * fp[6].x + (fp[21].y - leftEyeInnerSlope * fp[21].x);
  const faceRatio = Math.abs(fp[17].x - fp[19].x);
  const faceAngle = ((b2_y - b1_y) / faceRatio) * 100;

  let eyeAngleAnalysis: { label: string; description: string };

  if (faceAngle > -2.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 내려감",
      description: "마음이 부드러우며 타인에 대한 배려가 깊어, 주변 환경에 능동적으로 적응하는 능력이 뛰어납니다. 어린이에 대한 애정이 많고, 연애에서는 자신보다 연령이 어린 상대를 선호하는 경향이 있습니다."
    };
    score += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1 + WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
  } else if (faceAngle <= -2.0 && faceAngle > -4.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 일자",
      description: "내면에 강한 의지와 결단력을 지니고 있지만, 때때로 대담한 행동을 취하는 데 있어 약간의 망설임이 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3 + WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
  } else if (faceAngle <= -4.0 && faceAngle > -11.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 올라감",
      description: "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다."
    };
    score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4 + WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
  } else {
    eyeAngleAnalysis = {
      label: "눈꼬리 많이 올라감",
      description: "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 리더십과 독립적인 성향이 강합니다."
    };
    score += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4 + WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
    r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
  }

  // === 눈썹-눈 거리 분석 ===
  const ratio1 = (fp[0].y - fp[24].y) / correctedNoseWidth;
  let eyebrowDistanceAnalysis: { label: string; description: string };

  if (ratio1 > 0.8) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 넓음",
      description: "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 낙천적이고 개방적인 성격입니다."
    };
    score += WEIGHTS.r2_spirit * 2 + WEIGHTS.r3_money * 5;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 5;
  } else if (ratio1 > 0.68) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 넓은 편",
      description: "자연스럽게 복이 많은 삶을 살고 있으며, 온순하고 착한 면모로 주변 사람들에게 큰 호감을 줍니다."
    };
    score += WEIGHTS.r2_spirit * 2 + WEIGHTS.r3_money * 5;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 2;
  } else if (ratio1 > 0.6) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 이상적",
      description: "눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r3_money * 2;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2;
  } else {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 좁음",
      description: "자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 열려 있습니다. 일 처리 방식이 섬세하고 꼼꼼합니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r3_money * 2;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2;
  }

  // === 코 길이 분석 ===
  const ratio2 = (fp[15].y - fp[0].y) / correctedNoseWidth;
  let noseLengthAnalysis: { label: string; description: string };

  if (ratio2 > 1.55) {
    noseLengthAnalysis = {
      label: "코가 긴 편",
      description: "강한 책임감과 성실함을 바탕으로 일에 임하는 타입입니다. 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5 + WEIGHTS.r3_social * 3 + WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5;
    r3 += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
  } else if (ratio2 > 1.28) {
    noseLengthAnalysis = {
      label: "코 길이가 이상적",
      description: "이상적인 중년의 모습을 그대로 담고 있습니다. 평온함이 태도와 마음가짐에 깊이 배어 있으며, 균형 잡힌 능력을 지니고 있습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4 + WEIGHTS.r3_social * 4 + WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
  } else {
    noseLengthAnalysis = {
      label: "코가 짧은 편",
      description: "타고난 낙관주의자로, 긍정적인 태도를 유지하는 데 뛰어난 능력을 지니고 있습니다. 상대방의 기분과 필요를 정확히 파악하는 능력이 탁월합니다."
    };
    score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2 + WEIGHTS.r3_social * 4 + WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
  }

  // === 인중 길이 분석 ===
  const ratio3 = (fp[12].y - fp[15].y) / correctedNoseWidth;
  let philtrumAnalysis: { label: string; description: string };

  if (ratio3 > 0.65) {
    philtrumAnalysis = {
      label: "인중이 긴 편",
      description: "인간성이 뛰어나고 장수하는 경향이 있습니다. 물질적인 풍요로움과는 별개로 인품 자체가 높은 평가를 받습니다. 자녀운도 좋습니다."
    };
    score += WEIGHTS.r1_old * 5 + WEIGHTS.r2_love * 5 + WEIGHTS.r4_sincere * 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (ratio3 > 0.58) {
    philtrumAnalysis = {
      label: "인중이 이상적",
      description: "자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많습니다."
    };
    score += WEIGHTS.r1_old * 5 + WEIGHTS.r2_love * 5 + WEIGHTS.r4_sincere * 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else {
    philtrumAnalysis = {
      label: "인중이 짧은 편",
      description: "성격적으로 변덕이 있을 수 있지만, 많은 사람과 교류하면 도움을 받을 수 있는 인물을 만날 가능성이 높습니다."
    };
    score += WEIGHTS.r1_power * 2 + WEIGHTS.r3_social * 2 + WEIGHTS.r4_sincere * 1;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 2;
    r4 += WEIGHTS.r4_sincere * 1;
  }

  // === 입 너비 분석 ===
  const mouthWidth = Math.abs(fp[11].x - fp[10].x);
  const ratio7 = correctForAngle(mouthWidth, panAngle, 0.5) / correctedNoseWidth;
  let mouthAnalysis: { label: string; description: string };

  if (ratio7 > 1.65) {
    mouthAnalysis = {
      label: "입이 큰 편",
      description: "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격을 지니고 있으며, 사회적으로도 큰 성공을 거두는 모습을 보여줍니다."
    };
    score += WEIGHTS.r1_power * 5 + WEIGHTS.r3_work * 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (ratio7 > 1.57) {
    mouthAnalysis = {
      label: "입 크기가 이상적",
      description: "주변에 운기와 생명력이 넘치는 에너지를 발산하며, 주위 사람들로부터 깊은 존경을 받는 존재가 됩니다."
    };
    score += WEIGHTS.r1_power * 5 + WEIGHTS.r3_work * 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else {
    mouthAnalysis = {
      label: "입이 작은 편",
      description: "뛰어난 직관력과 빠른 판단력으로 성과를 창출하는 데 탁월한 능력을 지니고 있습니다. 전략적인 조언자 역할에 적합합니다."
    };
    score += WEIGHTS.r1_power * 3 + WEIGHTS.r3_work * 3;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  }

  // === 하관(턱) 너비 분석 ===
  const jawWidth = Math.abs(fp[31].x - fp[30].x);
  const ratio8 = correctForAngle(jawWidth, panAngle, 0.6) / faceWidth;
  let jawAnalysis: { label: string; description: string };

  if (ratio8 > 0.77) {
    jawAnalysis = {
      label: "하관이 튼튼함",
      description: "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 안정적인 재정 상태와 자식들의 성공으로 편안한 삶을 즐길 수 있습니다."
    };
    score += WEIGHTS.r2_adult * 5 + WEIGHTS.r3_social * 5;
    r2 += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5;
  } else if (ratio8 > 0.75) {
    jawAnalysis = {
      label: "하관이 적당함",
      description: "말년에 재물과 자녀의 복으로 풍요를 누릴 예정입니다."
    };
    score += WEIGHTS.r2_adult * 3 + WEIGHTS.r3_social * 3;
    r2 += WEIGHTS.r2_adult * 3;
    r3 += WEIGHTS.r3_social * 3;
  } else {
    jawAnalysis = {
      label: "턱이 좁은 편",
      description: "말년에 어려움이 있을 수 있으나, 끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공을 가져올 것입니다."
    };
    score += WEIGHTS.r2_adult * 1 + WEIGHTS.r3_social * 1;
    r2 += WEIGHTS.r2_adult * 1;
    r3 += WEIGHTS.r3_social * 1;
  }

  // === 눈 크기 분석 ===
  const eyeSizeLeft = {
    width: Math.abs(fp[17].x - fp[19].x),
    height: Math.abs(fp[18].y - fp[16].y)
  };
  const eyeRatio = eyeSizeLeft.width / Math.max(eyeSizeLeft.height, 1);
  const eyeFaceRatio = faceWidth / eyeSizeLeft.width;

  let eyeSizeAnalysis: { label: string; description: string };

  if (eyeFaceRatio < 5.33) {
    if (eyeRatio > 3.2) {
      eyeSizeAnalysis = {
        label: "눈이 작은 편",
        description: "결정을 내릴 때 신중함을 기하며, 모든 가능성을 고려한 뒤 행동으로 옮깁니다. 경계심이 강해 사람을 쉽게 신뢰하지 않으며, 결정을 내리면 그 의지는 굳건합니다."
      };
      score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 4;
    } else if (eyeRatio > 2.7) {
      eyeSizeAnalysis = {
        label: "눈이 적당한 크기",
        description: "균형 잡힌 시야와 판단력을 가지고 있습니다. 사람들과 적절한 거리를 유지하면서도 필요할 때 친밀감을 형성할 수 있습니다."
      };
      score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r4_kind * 3;
    } else {
      eyeSizeAnalysis = {
        label: "눈이 큰 편",
        description: "호기심이 많고 감정 표현이 풍부합니다. 사람들에게 쉽게 마음을 열고, 직관적인 판단을 내리는 경향이 있습니다."
      };
      score += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_love * 3 + WEIGHTS.r4_kind * 5;
      r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_love * 3;
      r4 += WEIGHTS.r4_kind * 5;
    }
  } else {
    eyeSizeAnalysis = {
      label: "눈이 작은 편",
      description: "분석적이고 신중한 성격입니다. 관찰력이 뛰어나며 세부 사항을 놓치지 않습니다."
    };
    score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r4_kind * 3;
  }

  // === 종합 점수 정규화 (100점 만점) ===
  const maxPossibleScore = 300; // 대략적인 최대 점수
  const normalizedScore = Math.min(100, Math.round((score / maxPossibleScore) * 100));

  // === 종합 해석 생성 ===
  const summaryParts: string[] = [];

  if (r1 > 40) summaryParts.push("리더십과 권력 운이 강합니다");
  if (r2 > 50) summaryParts.push("정신적 성숙도와 사랑운이 좋습니다");
  if (r3 > 40) summaryParts.push("사회적 성공과 재물운이 있습니다");
  if (r4 > 40) summaryParts.push("성실하고 책임감 있는 성격입니다");

  const summary = summaryParts.length > 0
    ? summaryParts.join('. ') + '.'
    : '균형 잡힌 관상을 가지고 있습니다.';

  // === 추천사항 생성 ===
  const recommendations: string[] = [];

  if (eyeAngleAnalysis.label.includes('올라감')) {
    recommendations.push("감정의 기복을 조절하는 연습이 도움이 됩니다");
  }
  if (philtrumAnalysis.label.includes('짧은')) {
    recommendations.push("다양한 사람들과 교류하면 좋은 기회가 찾아옵니다");
  }
  if (jawAnalysis.label.includes('좁은')) {
    recommendations.push("꾸준한 노력으로 자수성가의 길을 걸어가세요");
  }
  if (mouthAnalysis.label.includes('큰')) {
    recommendations.push("리더십을 발휘할 수 있는 기회를 찾아보세요");
  }

  if (recommendations.length === 0) {
    recommendations.push("현재의 좋은 관상을 유지하며 긍정적인 마음가짐을 가지세요");
  }

  return {
    facecode: generateUUID(),
    score: normalizedScore,
    panAngle,
    tiltAngle,
    rollAngle,
    categories: { r1, r2, r3, r4 },
    analysis: {
      eyeAngle: eyeAngleAnalysis,
      eyebrowDistance: eyebrowDistanceAnalysis,
      noseLength: noseLengthAnalysis,
      philtrumLength: philtrumAnalysis,
      mouthWidth: mouthAnalysis,
      jawWidth: jawAnalysis,
      eyeSize: eyeSizeAnalysis,
    },
    summary,
    recommendations,
    gender,
  };
}

// Google Vision API 응답을 FaceLandmarks로 변환
export function convertVisionLandmarks(landmarks: Array<{ type: string; position: { x: number; y: number; z?: number } }>): FaceLandmarks {
  const landmarkMap: { [key: string]: number } = {
    'LEFT_EYE': 0,
    'RIGHT_EYE': 1,
    'LEFT_OF_LEFT_EYEBROW': 2,
    'RIGHT_OF_LEFT_EYEBROW': 3,
    'LEFT_OF_RIGHT_EYEBROW': 4,
    'RIGHT_OF_RIGHT_EYEBROW': 5,
    'NOSE_TIP': 6,
    'UPPER_LIP': 8,
    'LOWER_LIP': 9,
    'MOUTH_LEFT': 10,
    'MOUTH_RIGHT': 11,
    'MOUTH_CENTER': 12,
    'NOSE_BOTTOM_RIGHT': 13,
    'NOSE_BOTTOM_LEFT': 14,
    'NOSE_BOTTOM_CENTER': 15,
    'LEFT_EYE_TOP_BOUNDARY': 16,
    'LEFT_EYE_LEFT_CORNER': 17,
    'LEFT_EYE_BOTTOM_BOUNDARY': 18,
    'LEFT_EYE_RIGHT_CORNER': 19,
    'RIGHT_EYE_TOP_BOUNDARY': 20,
    'RIGHT_EYE_RIGHT_CORNER': 21,
    'RIGHT_EYE_BOTTOM_BOUNDARY': 22,
    'RIGHT_EYE_LEFT_CORNER': 23,
    'LEFT_EYEBROW_UPPER_MIDPOINT': 24,
    'RIGHT_EYEBROW_UPPER_MIDPOINT': 25,
    'LEFT_CHEEK_CENTER': 26,
    'RIGHT_CHEEK_CENTER': 27,
    'CHIN_GNATHION': 29,
    'LEFT_EAR_TRAGION': 30,
    'RIGHT_EAR_TRAGION': 31,
    'FOREHEAD_GLABELLA': 32,
  };

  const all: FacePoint[] = new Array(33).fill({ x: 0, y: 0 });

  for (const landmark of landmarks) {
    const index = landmarkMap[landmark.type];
    if (index !== undefined) {
      all[index] = {
        x: landmark.position.x,
        y: landmark.position.y,
        z: landmark.position.z,
      };
    }
  }

  return {
    leftEye: all[0],
    rightEye: all[1],
    leftEyebrowLeft: all[2],
    leftEyebrowRight: all[3],
    rightEyebrowLeft: all[4],
    rightEyebrowRight: all[5],
    noseTip: all[6],
    upperLip: all[8],
    lowerLip: all[9],
    mouthLeft: all[10],
    mouthRight: all[11],
    mouthCenter: all[12],
    noseBottomRight: all[13],
    noseBottomLeft: all[14],
    noseBottomCenter: all[15],
    leftEyeTopBoundary: all[16],
    leftEyeLeftCorner: all[17],
    leftEyeBottomBoundary: all[18],
    leftEyeRightCorner: all[19],
    rightEyeTopBoundary: all[20],
    rightEyeRightCorner: all[21],
    rightEyeBottomBoundary: all[22],
    rightEyeLeftCorner: all[23],
    leftEyebrowUpperMidpoint: all[24],
    rightEyebrowUpperMidpoint: all[25],
    leftCheek: all[26],
    rightCheek: all[27],
    chin: all[29],
    jawLeft: all[30],
    jawRight: all[31],
    forehead: all[32],
    all,
  };
}
