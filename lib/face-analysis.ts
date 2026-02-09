// 얼굴 분석 알고리즘 - Python draw.py에서 TypeScript로 포팅
// MediaPipe Face Mesh 랜드마크 기반 관상 분석
// Excel "관상 해석.xlsx" 데이터 통합

import {
  PhysiognomyTraits,
  createEmptyTraits,
  applyTraitModifiers,
  generateResultPhrase,
  getTopTraits,
  traitToPercent,
  findInterpretation,
  getRatioLevel,
  TRAIT_MAX_SCORES,
  OverallFaceReading,
  generateOverallReading,
} from './physiognomy-types';

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
  noseBridge: FacePoint;        // 7 (코 브릿지 - 눈 사이, 코 시작점)
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

  // 관상 특성 점수 (Excel 기반)
  traits?: PhysiognomyTraits;

  // 결과 문구 (점수 + 특성 기반)
  resultPhrase?: string;

  // 상위 특성 (점수가 높은 순)
  topTraits?: Array<{ trait: string; value: number; percent: number }>;

  // 전체 관상 해석 (삼정, 얼굴형, 시기별 운세, 종합 운세)
  overallReading?: OverallFaceReading;

  // 디버그 정보 (ratio 값들)
  debug?: {
    // 기존 값들
    noseWidth: number;
    noseLengthRatio: number;
    philtrumRatio: number;
    mouthRatio: number;
    jawRatio: number;
    eyebrowRatio: number;
    eyeAngleDegrees: number;
    facescore: number;
    // 추가 값들
    faceWidth: number;          // 얼굴 너비 (볼 간 거리)
    jawWidth: number;           // 턱 너비 (턱각 간 거리)
    foreheadHeight: number;     // 이마 높이 (헤어라인~눈썹)
    noseTipToBottom: number;    // 코끝~코밑 거리 (들창코 판별)
    noseBottomToLip: number;    // 코밑~윗입술 거리
    noseTipRatio: number;       // 코끝/코밑 비율 (들창코: 값이 크면 들창코)
    eyebrowLength: number;      // 눈썹 길이
    eyebrowAngle: number;       // 눈썹 각도
    eyeWidth: number;           // 눈 너비
    eyeHeight: number;          // 눈 높이
    mouthWidth: number;         // 입 너비
    mouthHeight: number;        // 입 높이
    // 추가 값들 (눈썹, 눈, 입술)
    eyebrowGap: number;         // 눈썹 사이 거리
    leftEyeWidth: number;       // 왼쪽 눈 너비
    leftEyeHeight: number;      // 왼쪽 눈 높이
    rightEyeWidth: number;      // 오른쪽 눈 너비
    rightEyeHeight: number;     // 오른쪽 눈 높이
    upperLipHeight: number;     // 윗입술 두께
    lowerLipHeight: number;     // 아랫입술 두께
    lipRatio: number;           // 입술 비율 (윗/아랫)
    // 턱각 관련
    leftJawAngle: number;       // 왼쪽 턱각 각도 (볼→턱각→턱끝)
    rightJawAngle: number;      // 오른쪽 턱각 각도
    avgJawAngle: number;        // 평균 턱각 각도
    // 하관 길이 및 윤곽 각도 (2/3 지점)
    lowerJawLengthLeft: number;   // 왼쪽 하관 길이 (턱끝~왼턱각)
    lowerJawLengthRight: number;  // 오른쪽 하관 길이 (턱끝~우턱각)
    lowerJawLengthAvg: number;    // 평균 하관 길이
    jawContourAngleLeft: number;  // 왼쪽 윤곽 2/3 지점 각도 (실제 턱각)
    jawContourAngleRight: number; // 오른쪽 윤곽 2/3 지점 각도
    jawContourAngleAvg: number;   // 평균 윤곽 각도
  };
}

// 가중치 설정 (draw.py와 동일)
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

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 값을 범위 내로 제한
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 비율을 5단계 레벨로 변환 (1-5)
function ratioToLevel(value: number, thresholds: [number, number, number, number]): number {
  const [t1, t2, t3, t4] = thresholds;
  if (value > t1) return 5;
  if (value > t2) return 4;
  if (value > t3) return 3;
  if (value > t4) return 2;
  return 1;
}

// 얼굴 기울기(roll) 보정 - 모든 랜드마크를 정면으로 회전
function normalizeRotation(points: FacePoint[], rollAngle: number): FacePoint[] {
  if (Math.abs(rollAngle) < 0.5) return points; // 기울기가 작으면 보정 불필요

  // 얼굴 중심점 계산 (두 눈 사이)
  const centerX = (points[0].x + points[1].x) / 2;
  const centerY = (points[0].y + points[1].y) / 2;

  // 라디안으로 변환 (반대 방향으로 회전하여 정면으로 맞춤)
  const angleRad = -rollAngle * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return points.map(p => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
      z: p.z
    };
  });
}

export function analyzeFace(
  landmarks: FaceLandmarks,
  gender: 'male' | 'female',
  panAngle: number = 0,
  tiltAngle: number = 0,
  rollAngle: number = 0
): FaceAnalysisResult {
  // 얼굴 기울기 보정 적용
  const fp = normalizeRotation(landmarks.all, rollAngle);

  // draw.py와 동일하게 facescore 직접 누적
  let facescore = 0;
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0;

  // === 기준 비율 계산 === (draw.py와 동일)
  // widthratio = 코 너비 (콧볼 너비)
  const noseWidth = Math.abs(fp[13].x - fp[14].x) || 1;
  // widthratio2 = 얼굴 너비 (볼 중앙 간 거리)
  const faceWidth = Math.abs(fp[27].x - fp[26].x) || 1;

  // === 1. 눈꼬리 각도 분석 ===
  // 왼쪽 눈의 안쪽-바깥쪽 기울기 계산
  const leftEyeSlope = (fp[19].y - fp[17].y) / (fp[19].x - fp[17].x || 1);
  // 오른쪽 눈의 안쪽-바깥쪽 기울기 계산
  const rightEyeSlope = (fp[21].y - fp[23].y) / (fp[21].x - fp[23].x || 1);
  // 평균 기울기를 각도로 변환 (라디안 -> 도)
  const avgSlope = (leftEyeSlope + rightEyeSlope) / 2;
  const eyeAngleDegrees = Math.atan(avgSlope) * (180 / Math.PI);

  let eyeAngleAnalysis: { label: string; description: string };
  let eyeAngleLevel: number;

  // draw.py와 동일한 방식: faceangle 기준 분류
  // faceangle = (b2_y-b1_y)/faceratio*100
  // 여기서는 eyeAngleDegrees를 사용 (유사한 의미)
  if (eyeAngleDegrees > 5) {
    // 눈꼬리 많이 올라감 (draw.py: faceangle <= -11)
    eyeAngleAnalysis = {
      label: "눈꼬리가 많이 올라감",
      description: "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 리더십과 독립적인 성향이 강하지만, 독불장군과 같은 고집스러움이 동반될 수 있습니다."
    };
    eyeAngleLevel = 5;
    facescore += WEIGHTS.r2_spirit * 5;
    facescore += WEIGHTS.r2_adult * 4;
    facescore += WEIGHTS.r4_kind * 1;
    facescore += WEIGHTS.r4_wind * 5;
    r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
  } else if (eyeAngleDegrees > 2) {
    // 눈꼬리 올라감 (draw.py: -11 < faceangle <= -4)
    eyeAngleAnalysis = {
      label: "눈꼬리가 올라감",
      description: "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다."
    };
    eyeAngleLevel = 4;
    facescore += WEIGHTS.r2_spirit * 4;
    facescore += WEIGHTS.r2_adult * 4;
    facescore += WEIGHTS.r4_kind * 4;
    facescore += WEIGHTS.r4_wind * 4;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
  } else if (eyeAngleDegrees > -2) {
    // 눈꼬리 일자 (draw.py: -4 < faceangle <= -2)
    eyeAngleAnalysis = {
      label: "눈꼬리가 일자",
      description: "내면에 강한 의지와 결단력을 지니고 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있으며, 안정적인 성격의 소유자입니다."
    };
    eyeAngleLevel = 3;
    facescore += WEIGHTS.r2_spirit * 3;
    facescore += WEIGHTS.r2_adult * 3;
    facescore += WEIGHTS.r4_kind * 5;
    facescore += WEIGHTS.r4_wind * 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
  } else {
    // 눈꼬리 내려감 (draw.py: faceangle > -2)
    eyeAngleAnalysis = {
      label: "눈꼬리가 내려감",
      description: "마음이 부드러우며 타인에 대한 배려가 깊습니다. 주변 환경에 능동적으로 적응하는 능력이 뛰어나며, 친화력이 좋아 사람들에게 호감을 받습니다."
    };
    eyeAngleLevel = 2;
    facescore += WEIGHTS.r2_spirit * 1;
    facescore += WEIGHTS.r2_adult * 1;
    facescore += WEIGHTS.r4_kind * 2;
    facescore += WEIGHTS.r4_wind * 1;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
  }

  // === 2. 눈썹-눈 거리 분석 ===
  // 눈썹 위쪽 중간점과 눈 중심 사이 거리
  const eyebrowEyeDistLeft = Math.abs(fp[0].y - fp[24].y);
  const eyebrowEyeDistRight = Math.abs(fp[1].y - fp[25].y);
  const avgEyebrowDist = (eyebrowEyeDistLeft + eyebrowEyeDistRight) / 2;
  // 눈 세로 크기 대비 비율로 계산
  const eyeHeight = Math.abs(fp[18].y - fp[16].y) || 1;
  const eyebrowRatio = avgEyebrowDist / eyeHeight;

  let eyebrowDistanceAnalysis: { label: string; description: string };
  let eyebrowLevel: number;

  // MediaPipe 기준 임계값 (눈 높이 대비 비율)
  if (eyebrowRatio > 2.5) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 넓음",
      description: "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 낙천적이고 개방적인 성격입니다."
    };
    eyebrowLevel = 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 5;
  } else if (eyebrowRatio > 2.0) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 넓은 편",
      description: "자연스럽게 복이 많은 삶을 살고 있으며, 낙천적인 성향을 가지고 있습니다. 온순하고 착한 면모로 주변 사람들에게 큰 호감을 줍니다."
    };
    eyebrowLevel = 4;
    r1 += WEIGHTS.r1_old * 4;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 4;
  } else if (eyebrowRatio > 1.5) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 이상적",
      description: "눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻습니다."
    };
    eyebrowLevel = 3;
    r1 += WEIGHTS.r1_old * 3;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 3;
  } else if (eyebrowRatio > 1.0) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 좁은 편",
      description: "자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 열려 있습니다. 일 처리 방식이 섬세하고 꼼꼼합니다."
    };
    eyebrowLevel = 2;
    r1 += WEIGHTS.r1_old * 2;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2;
  } else {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 좁음",
      description: "뛰어난 집중력과 분석력을 가지고 있습니다. 공과 사가 확실하며 업무에서 높은 성과를 내는 타입입니다."
    };
    eyebrowLevel = 1;
    r1 += WEIGHTS.r1_old * 1;
    r2 += WEIGHTS.r2_spirit * 4;
    r3 += WEIGHTS.r3_money * 2;
  }
  // facescore에 눈썹 분석 점수 추가 (draw.py 방식)
  facescore += WEIGHTS.r2_spirit * eyebrowLevel;
  facescore += WEIGHTS.r3_money * eyebrowLevel;

  // === 3. 코 길이 분석 === (draw.py ratio2 공식)
  // ratio2 = (facepoint[15].y - facepoint[0].y) / widthratio
  // 코밑 중앙(fp[15])에서 눈 중심(fp[0])까지 / 코 너비
  const noseLengthRatio = (fp[15].y - fp[0].y) / noseWidth;

  let noseLengthAnalysis: { label: string; description: string };
  let noseLevel: number;

  // draw.py 임계값: >1.55 (긴), 1.28~1.55 (이상적), <1.28 (짧음)
  if (noseLengthRatio > 1.55) {
    noseLengthAnalysis = {
      label: "코가 긴 편",
      description: "강한 책임감과 성실함을 바탕으로 일에 임합니다. 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다."
    };
    noseLevel = 5;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5;
    r3 += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
  } else if (noseLengthRatio > 1.28) {
    noseLengthAnalysis = {
      label: "코 길이가 이상적",
      description: "균형 잡힌 능력을 지니고 있어 다양한 사회적 상황에서 자신의 역할을 훌륭히 수행합니다. 평온하고 안정적인 성격입니다."
    };
    noseLevel = 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
  } else {
    noseLengthAnalysis = {
      label: "코가 짧은 편",
      description: "낙관적이고 긍정적인 성격입니다. 상대방의 기분을 잘 파악하며 사교성이 좋고 장사도 잘 어울립니다. 재물운이 좋지만 신중함이 필요합니다."
    };
    noseLevel = 1;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
  }
  // facescore에 코 분석 점수 추가
  facescore += WEIGHTS.r2_spirit * noseLevel;
  facescore += WEIGHTS.r2_love * noseLevel;
  facescore += WEIGHTS.r4_responsibility * noseLevel;

  // === 4. 인중 길이 분석 === (draw.py ratio3 공식)
  // ratio3 = (facepoint[12].y - facepoint[15].y) / widthratio
  // 입 중앙(fp[12])에서 코밑 중앙(fp[15])까지 / 코 너비
  const philtrumRatio = (fp[12].y - fp[15].y) / noseWidth;

  let philtrumAnalysis: { label: string; description: string };
  let philtrumLevel: number;

  // draw.py 임계값: >0.7 (엄청긴), 0.65~0.7 (긴편), 0.58~0.65 (이상적), 0.5~0.58 (짧음), <0.5 (매우짧음)
  if (philtrumRatio > 0.7) {
    philtrumAnalysis = {
      label: "인중이 매우 긴 편",
      description: "인간성이 뛰어나고 장수하는 경향이 있습니다. 물질적인 풍요로움과는 별개로 인품 자체가 높은 평가를 받습니다."
    };
    philtrumLevel = 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.65) {
    philtrumAnalysis = {
      label: "인중이 긴 편",
      description: "종종 자신의 노력으로 설명할 수 없는 힘을 발휘하며, 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼칩니다."
    };
    philtrumLevel = 4;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.58) {
    philtrumAnalysis = {
      label: "인중이 이상적",
      description: "자녀운에 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 합니다."
    };
    philtrumLevel = 3;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.5) {
    philtrumAnalysis = {
      label: "인중이 짧은 편",
      description: "다양한 관심사를 가지고 있으며 새로운 것에 대한 호기심이 강합니다. 많은 사람과 교류하면 좋은 기회가 찾아옵니다."
    };
    philtrumLevel = 2;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 2;
    r4 += WEIGHTS.r4_sincere * 1;
  } else {
    philtrumAnalysis = {
      label: "인중이 매우 짧은 편",
      description: "빠른 판단력과 행동력을 가지고 있습니다. 적극적으로 교류하며 관계를 넓혀가면 상황을 전환시킬 수 있습니다."
    };
    philtrumLevel = 1;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_sincere * 1;
  }
  // facescore에 인중 분석 점수 추가
  facescore += WEIGHTS.r1_old * philtrumLevel;
  facescore += WEIGHTS.r2_love * philtrumLevel;
  facescore += WEIGHTS.r4_sincere * philtrumLevel;

  // === 5. 입 너비 분석 === (draw.py ratio7 공식)
  // ratio7 = (facepoint[11].x - facepoint[10].x) / widthratio
  const mouthWidthVal = Math.abs(fp[11].x - fp[10].x);
  const mouthRatio = mouthWidthVal / noseWidth;

  let mouthAnalysis: { label: string; description: string };
  let mouthLevel: number;

  // draw.py 임계값: >1.75 (엄청큼), 1.65~1.75 (큼), 1.57~1.65 (이상적), 1.45~1.57 (작음), <1.45 (엄청작음)
  if (mouthRatio > 1.75) {
    mouthAnalysis = {
      label: "입이 매우 큰 편",
      description: "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격입니다. 사회적으로도 큰 성공을 거두는 모습을 보여줍니다."
    };
    mouthLevel = 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.65) {
    mouthAnalysis = {
      label: "입이 큰 편",
      description: "주변에 운기와 생명력이 넘치는 에너지를 발산합니다. 업무 환경에서 동료들 사이에서 인기가 있습니다."
    };
    mouthLevel = 4;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.57) {
    mouthAnalysis = {
      label: "입 크기가 이상적",
      description: "진정성과 노력으로 어떤 분야에서든 성공의 정점을 찍을 수 있으며, 균형 잡힌 대인관계를 유지합니다."
    };
    mouthLevel = 3;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.45) {
    mouthAnalysis = {
      label: "입이 작은 편",
      description: "뛰어난 직관력과 빠른 판단력을 지니고 있습니다. 전략적인 조언자나 중요한 보조 역할에 적합합니다."
    };
    mouthLevel = 2;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  } else {
    mouthAnalysis = {
      label: "입이 매우 작은 편",
      description: "성격이 매우 상냥하며, 세심한 배려로 주변 사람들을 서포트하는 데에 특별한 재능을 보입니다."
    };
    mouthLevel = 1;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  }
  // facescore에 입 분석 점수 추가
  facescore += WEIGHTS.r1_power * mouthLevel;
  facescore += WEIGHTS.r3_work * mouthLevel;

  // === 6. 하관(턱) 너비 분석 ===
  // 턱 양쪽 너비 / 얼굴 너비 비율
  const jawWidth = Math.abs(fp[31].x - fp[30].x);
  const jawRatio = jawWidth / faceWidth;

  let jawAnalysis: { label: string; description: string };
  let jawLevel: number;

  // MediaPipe 기준 임계값
  if (jawRatio > 0.85) {
    jawAnalysis = {
      label: "하관이 매우 튼튼함",
      description: "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 안정적인 재정 상태와 편안한 삶을 즐길 수 있습니다."
    };
    jawLevel = 5;
    r2 += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5;
  } else if (jawRatio > 0.75) {
    jawAnalysis = {
      label: "하관이 튼튼함",
      description: "말년에 재물과 자녀의 복으로 풍요를 누릴 예정입니다. 삶의 후반기에 편안한 삶을 즐길 수 있습니다."
    };
    jawLevel = 4;
    r2 += WEIGHTS.r2_adult * 4;
    r3 += WEIGHTS.r3_social * 4;
  } else if (jawRatio > 0.65) {
    jawAnalysis = {
      label: "하관이 이상적",
      description: "균형 잡힌 얼굴형으로 안정적인 인상을 줍니다. 말년에도 편안하고 충족된 삶을 즐길 수 있습니다."
    };
    jawLevel = 3;
    r2 += WEIGHTS.r2_adult * 3;
    r3 += WEIGHTS.r3_social * 3;
  } else if (jawRatio > 0.55) {
    jawAnalysis = {
      label: "턱이 좁은 편",
      description: "끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공을 가져올 것입니다."
    };
    jawLevel = 2;
    r2 += WEIGHTS.r2_adult * 2;
    r3 += WEIGHTS.r3_social * 2;
  } else {
    jawAnalysis = {
      label: "턱이 매우 뾰족함",
      description: "세련되고 날카로운 인상을 줍니다. 자신만의 스타일과 개성이 뚜렷하며, 창의적인 분야에서 재능을 발휘합니다."
    };
    jawLevel = 1;
    r2 += WEIGHTS.r2_adult * 1;
    r3 += WEIGHTS.r3_social * 2;
  }
  // facescore에 턱 분석 점수 추가
  facescore += WEIGHTS.r2_adult * jawLevel;
  facescore += WEIGHTS.r3_social * jawLevel;

  // === 7. 눈 크기 분석 ===
  const eyeSizeLeftX = Math.abs(fp[17].x - fp[19].x);
  const eyeSizeLeftY = Math.abs(fp[18].y - fp[16].y) || 1;
  const eyeRatio = eyeSizeLeftX / eyeSizeLeftY;
  const eyeFaceWidthRatio = faceWidth / eyeSizeLeftX;

  let eyeSizeAnalysis: { label: string; description: string };
  let eyeSizeLevel: number;

  // 눈 크기와 형태에 따른 분석
  if (eyeFaceWidthRatio < 4.5) {
    // 눈이 큰 편
    if (eyeRatio > 3.0) {
      eyeSizeAnalysis = {
        label: "눈이 크고 긴 편",
        description: "매력적인 눈을 가지고 있으며, 호기심이 강하고 표현력이 풍부합니다. 리더십이 뛰어나 경영자나 정치인에 적합합니다."
      };
      eyeSizeLevel = 5;
    } else {
      eyeSizeAnalysis = {
        label: "눈이 크고 둥근 편",
        description: "날카로운 눈빛과 큰 눈은 자연스러운 리더십을 발휘합니다. 어려움을 극복하는 강인한 정신력을 가지고 있습니다."
      };
      eyeSizeLevel = 4;
    }
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 5;
    r3 += WEIGHTS.r3_someone * 1;
    r4 += WEIGHTS.r4_kind * 1;
  } else if (eyeFaceWidthRatio < 5.5) {
    // 눈이 보통
    eyeSizeAnalysis = {
      label: "눈이 보통 크기",
      description: "호기심이 왕성하고 표현력이 풍부한 성격으로, 빠른 판단력과 대담한 행동력을 가지고 있습니다."
    };
    eyeSizeLevel = 3;
    r2 += WEIGHTS.r2_spirit * 2 + WEIGHTS.r2_jealousy * 2;
    r3 += WEIGHTS.r3_work * 3 + WEIGHTS.r3_someone * 2;
    r4 += WEIGHTS.r4_kind * 3;
  } else {
    // 눈이 작은 편
    if (eyeRatio > 3.0) {
      eyeSizeAnalysis = {
        label: "눈이 작고 긴 편",
        description: "순수한 마음의 소유자로, 사회생활을 잘하는 성격입니다. 감수성이 풍부하고 유연한 성격으로 사람들과 원활한 관계를 유지합니다."
      };
      eyeSizeLevel = 2;
    } else {
      eyeSizeAnalysis = {
        label: "눈이 작고 둥근 편",
        description: "결정을 내릴 때 신중함을 기하며, 모든 가능성을 고려한 뒤 행동으로 옮깁니다. 경계심이 강해 신뢰를 쌓는 데 시간이 걸립니다."
      };
      eyeSizeLevel = 1;
    }
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3;
    r3 += WEIGHTS.r3_someone * 3;
    r4 += WEIGHTS.r4_kind * 4;
  }
  // facescore에 눈 크기 분석 점수 추가
  facescore += WEIGHTS.r2_spirit * eyeSizeLevel;
  facescore += WEIGHTS.r3_someone * eyeSizeLevel;

  // === 종합 점수 정규화 === (draw.py 공식 적용)
  // draw.py: face_color = (150 - (facescore - 172)) / 149 * 100
  // facescore 범위: 약 50 ~ 300 (가중치 합산)
  // face_color는 "상위 X%"를 의미 (낮을수록 좋음)

  // 우리는 점수를 높을수록 좋게 표시하므로, 100 - face_color 사용
  const faceColor = (150 - (facescore - 172)) / 149 * 100;
  // face_color가 10% = 상위 10% = 좋은 점수 = 90점
  // face_color가 80% = 상위 80% = 보통 점수 = 50점
  const normalizedScore = clamp(
    Math.round(100 - faceColor),
    25,
    95
  );

  // === 카테고리 점수 정규화 ===
  // 각 카테고리 raw 점수를 0~100 범위로 변환
  const normalizeCategory = (val: number, avgVal: number, spread: number): number => {
    const deviation = (val - avgVal) / spread;
    const normalized = 50 + deviation * 25;
    return clamp(Math.round(normalized), 15, 85);
  };

  // r1~r4 raw 값 저장 (디버그용)
  const rawR1 = r1, rawR2 = r2, rawR3 = r3, rawR4 = r4;

  // 각 카테고리 정규화 (표시용)
  r1 = normalizeCategory(r1, 20, 15);
  r2 = normalizeCategory(r2, 40, 20);
  r3 = normalizeCategory(r3, 30, 20);
  r4 = normalizeCategory(r4, 25, 15);

  // === 관상 특성 점수 계산 (Excel 기반) ===
  let traits = createEmptyTraits();

  // 1. 눈꼬리 기반 특성
  if (eyeAngleDegrees > 5) {
    traits = applyTraitModifiers(traits, '눈꼬리', 'high');
  } else if (eyeAngleDegrees > 2) {
    traits = applyTraitModifiers(traits, '눈꼬리', 'high');
  } else if (eyeAngleDegrees > -2) {
    traits = applyTraitModifiers(traits, '눈꼬리', 'medium');
  } else if (eyeAngleDegrees > -5) {
    traits = applyTraitModifiers(traits, '눈꼬리', 'low');
  } else {
    traits = applyTraitModifiers(traits, '눈꼬리', 'verylow');
  }

  // 2. 눈두덩이 기반 특성
  if (eyebrowRatio > 2.0) {
    traits = applyTraitModifiers(traits, '눈두덩이', 'high');
  } else if (eyebrowRatio < 1.5) {
    traits = applyTraitModifiers(traits, '눈두덩이', 'low');
  }

  // 3. 코길이 기반 특성
  if (noseLengthRatio > 1.55) {
    traits = applyTraitModifiers(traits, '코길이', 'high');
  } else if (noseLengthRatio < 1.28) {
    traits = applyTraitModifiers(traits, '코길이', 'low');
  }

  // 4. 인중 기반 특성
  if (philtrumRatio > 0.65) {
    traits = applyTraitModifiers(traits, '인중', 'high');
  } else if (philtrumRatio < 0.55) {
    traits = applyTraitModifiers(traits, '인중', 'low');
  }

  // 5. 입크기 기반 특성
  if (mouthRatio > 1.65) {
    traits = applyTraitModifiers(traits, '입크기', 'high');
  } else if (mouthRatio < 1.50) {
    traits = applyTraitModifiers(traits, '입크기', 'low');
  }

  // 6. 하관 기반 특성
  if (jawRatio > 0.77) {
    traits = applyTraitModifiers(traits, '하관', 'high');
  } else if (jawRatio < 0.60) {
    traits = applyTraitModifiers(traits, '하관', 'low');
  }

  // 7. 눈크기 기반 특성
  if (eyeFaceWidthRatio < 5.0) {
    traits = applyTraitModifiers(traits, '눈크기', 'big');
  } else if (eyeFaceWidthRatio > 6.0) {
    traits = applyTraitModifiers(traits, '눈크기', 'small');
  }

  // 상위 특성 계산
  const topTraitsArray = getTopTraits(traits, 3).map(t => ({
    ...t,
    percent: traitToPercent(t.trait as keyof PhysiognomyTraits, t.value)
  }));

  // 결과 문구 생성
  const resultPhrase = generateResultPhrase(traits, normalizedScore);

  // === 전체 관상 해석 생성 ===
  // 삼정 측정값 계산
  const foreheadToEyebrow = Math.abs((fp[32]?.y || fp[10]?.y || fp[0].y) - fp[24].y); // 이마~눈썹
  const eyebrowToNoseBottom = Math.abs(fp[24].y - fp[15].y); // 눈썹~코밑
  const noseBottomToChin = Math.abs(fp[15].y - fp[29].y); // 코밑~턱끝

  // 얼굴형 측정값
  const faceHeightForShape = Math.abs((fp[32]?.y || fp[10]?.y || fp[0].y) - fp[29].y); // 이마~턱끝
  const foreheadWidthVal = Math.abs(fp[3].x - fp[4].x); // 눈썹 양끝 (이마 너비 추정)
  const cheekWidthVal = faceWidth; // 볼 너비

  // 전체 관상 해석 생성
  const overallReading = generateOverallReading(
    foreheadToEyebrow,
    eyebrowToNoseBottom,
    noseBottomToChin,
    faceWidth,
    faceHeightForShape,
    foreheadWidthVal,
    jawWidth,
    cheekWidthVal,
    traits,
    normalizedScore
  );

  // === 종합 해석 생성 ===
  const summaryParts: string[] = [];

  if (r1 > 60) summaryParts.push("리더십과 권력 운이 강합니다");
  else if (r1 > 40) summaryParts.push("안정적인 운명의 흐름을 가지고 있습니다");

  if (r2 > 60) summaryParts.push("정신적 성숙도와 사랑운이 좋습니다");
  else if (r2 > 40) summaryParts.push("정서적으로 균형 잡힌 성격입니다");

  if (r3 > 60) summaryParts.push("사회적 성공과 재물운이 있습니다");
  else if (r3 > 40) summaryParts.push("꾸준한 노력으로 성과를 이룹니다");

  if (r4 > 60) summaryParts.push("성실하고 책임감 있는 성격입니다");
  else if (r4 > 40) summaryParts.push("신뢰받는 인품을 가지고 있습니다");

  const summary = summaryParts.length > 0
    ? summaryParts.join('. ') + '.'
    : '균형 잡힌 관상을 가지고 있습니다.';

  // === 추천사항 생성 ===
  const recommendations: string[] = [];

  if (eyeAngleLevel >= 4) {
    recommendations.push("감정의 기복을 조절하는 연습이 도움이 됩니다");
  }
  if (philtrumLevel <= 2) {
    recommendations.push("다양한 사람들과 교류하면 좋은 기회가 찾아옵니다");
  }
  if (jawLevel <= 2) {
    recommendations.push("꾸준한 노력으로 자수성가의 길을 걸어가세요");
  }
  if (mouthLevel >= 4) {
    recommendations.push("리더십을 발휘할 수 있는 기회를 찾아보세요");
  }
  if (eyebrowLevel <= 2) {
    recommendations.push("자수성가형으로 꼼꼼한 계획이 성공의 열쇠입니다");
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
    traits,
    resultPhrase,
    topTraits: topTraitsArray,
    overallReading,
    debug: {
      // 기존 값들
      noseWidth,
      noseLengthRatio,
      philtrumRatio,
      mouthRatio,
      jawRatio,
      eyebrowRatio,
      eyeAngleDegrees,
      facescore,
      // 추가 값들
      faceWidth,
      jawWidth: Math.abs(fp[31].x - fp[30].x),
      foreheadHeight: Math.abs(fp[24].y - (fp[32]?.y || fp[10]?.y || fp[0].y)), // 눈썹~이마 상단
      noseTipToBottom: Math.abs((fp[6]?.y || fp[7]?.y || 0) - fp[15].y), // 코끝~코밑
      noseBottomToLip: Math.abs(fp[15].y - fp[8].y), // 코밑~윗입술
      noseTipRatio: Math.abs((fp[6]?.y || fp[7]?.y || 0) - fp[15].y) / (Math.abs(fp[15].y - fp[8].y) || 1), // 들창코 비율
      eyebrowLength: Math.abs(fp[3].x - fp[2].x), // 왼쪽 눈썹 길이
      eyebrowAngle: Math.atan2(fp[3].y - fp[2].y, fp[3].x - fp[2].x) * (180 / Math.PI), // 눈썹 각도
      eyeWidth: Math.abs(fp[17].x - fp[19].x), // 눈 너비
      eyeHeight: eyeHeight, // 눈 높이
      mouthWidth: mouthWidthVal, // 입 너비
      mouthHeight: Math.abs(fp[9].y - fp[8].y), // 입 높이
      // 추가 값들 (눈썹, 눈, 입술)
      eyebrowGap: Math.abs(fp[3].x - fp[4].x), // 눈썹 사이 거리 (왼눈썹안쪽 ~ 우눈썹안쪽)
      leftEyeWidth: Math.abs(fp[17].x - fp[19].x), // 왼쪽 눈 너비
      leftEyeHeight: Math.abs(fp[18].y - fp[16].y), // 왼쪽 눈 높이
      rightEyeWidth: Math.abs(fp[21].x - fp[23].x), // 오른쪽 눈 너비
      rightEyeHeight: Math.abs(fp[22].y - fp[20].y), // 오른쪽 눈 높이
      upperLipHeight: Math.abs(fp[12].y - fp[8].y), // 윗입술 두께 (입중앙 ~ 윗입술)
      lowerLipHeight: Math.abs(fp[9].y - fp[12].y), // 아랫입술 두께 (아랫입술 ~ 입중앙)
      lipRatio: Math.abs(fp[12].y - fp[8].y) / (Math.abs(fp[9].y - fp[12].y) || 1), // 입술 비율
      // 턱각 각도 계산 (볼→턱각→턱끝 사이 각도, 작을수록 각진 턱)
      leftJawAngle: (() => {
        // 왼쪽: 볼(fp[26]) → 턱각(fp[30]) → 턱끝(fp[29])
        const v1x = fp[26].x - fp[30].x, v1y = fp[26].y - fp[30].y;
        const v2x = fp[29].x - fp[30].x, v2y = fp[29].y - fp[30].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
        return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
      })(),
      rightJawAngle: (() => {
        // 오른쪽: 볼(fp[27]) → 턱각(fp[31]) → 턱끝(fp[29])
        const v1x = fp[27].x - fp[31].x, v1y = fp[27].y - fp[31].y;
        const v2x = fp[29].x - fp[31].x, v2y = fp[29].y - fp[31].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
        return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
      })(),
      avgJawAngle: (() => {
        // 평균 턱각
        const calcAngle = (cheek: FacePoint, jaw: FacePoint, chin: FacePoint) => {
          const v1x = cheek.x - jaw.x, v1y = cheek.y - jaw.y;
          const v2x = chin.x - jaw.x, v2y = chin.y - jaw.y;
          const dot = v1x * v2x + v1y * v2y;
          const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
          const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
          return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
        };
        const left = calcAngle(fp[26], fp[30], fp[29]);
        const right = calcAngle(fp[27], fp[31], fp[29]);
        return (left + right) / 2;
      })(),
      // 하관 길이 (턱끝 ~ 턱각)
      lowerJawLengthLeft: Math.sqrt(
        Math.pow(fp[29].x - fp[30].x, 2) + Math.pow(fp[29].y - fp[30].y, 2)
      ),
      lowerJawLengthRight: Math.sqrt(
        Math.pow(fp[29].x - fp[31].x, 2) + Math.pow(fp[29].y - fp[31].y, 2)
      ),
      lowerJawLengthAvg: (
        Math.sqrt(Math.pow(fp[29].x - fp[30].x, 2) + Math.pow(fp[29].y - fp[30].y, 2)) +
        Math.sqrt(Math.pow(fp[29].x - fp[31].x, 2) + Math.pow(fp[29].y - fp[31].y, 2))
      ) / 2,
      // 윤곽 2/3 지점 각도 (두 직선 교차 각도)
      // 직선1: 턱끝 → 2/3지점, 직선2: 관자놀이 → 턱각
      // 작을수록 각진 턱
      jawContourAngleLeft: (() => {
        // 2/3 지점 (턱끝에서 왼턱각까지)
        const p2_3 = {
          x: fp[29].x + (fp[30].x - fp[29].x) * (2/3),
          y: fp[29].y + (fp[30].y - fp[29].y) * (2/3)
        };
        // 직선1 방향: 턱끝 → 2/3지점
        const v1x = p2_3.x - fp[29].x, v1y = p2_3.y - fp[29].y;
        // 직선2 방향: 관자놀이(fp[30]=LEFT_EAR_TRAGION) → 턱각
        // Vision API에서 fp[30]은 LEFT_EAR_TRAGION (관자놀이 근처)
        // 볼(fp[26])을 관자놀이 대신 사용
        const v2x = fp[30].x - fp[26].x, v2y = fp[30].y - fp[26].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
        return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
      })(),
      jawContourAngleRight: (() => {
        // 2/3 지점 (턱끝에서 우턱각까지)
        const p2_3 = {
          x: fp[29].x + (fp[31].x - fp[29].x) * (2/3),
          y: fp[29].y + (fp[31].y - fp[29].y) * (2/3)
        };
        // 직선1 방향: 턱끝 → 2/3지점
        const v1x = p2_3.x - fp[29].x, v1y = p2_3.y - fp[29].y;
        // 직선2 방향: 볼 → 턱각
        const v2x = fp[31].x - fp[27].x, v2y = fp[31].y - fp[27].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
        return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
      })(),
      jawContourAngleAvg: (() => {
        // 양쪽 평균
        const calcAngle = (chin: FacePoint, jaw: FacePoint, cheek: FacePoint) => {
          const p2_3 = {
            x: chin.x + (jaw.x - chin.x) * (2/3),
            y: chin.y + (jaw.y - chin.y) * (2/3)
          };
          const v1x = p2_3.x - chin.x, v1y = p2_3.y - chin.y;
          const v2x = jaw.x - cheek.x, v2y = jaw.y - cheek.y;
          const dot = v1x * v2x + v1y * v2y;
          const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
          const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
          return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
        };
        return (calcAngle(fp[29], fp[30], fp[26]) + calcAngle(fp[29], fp[31], fp[27])) / 2;
      })(),
    },
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
    'NOSE_BRIDGE': 7,  // 코 브릿지 (눈 사이, 코 시작점)
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

  const all: FacePoint[] = new Array(33).fill(null).map(() => ({ x: 0, y: 0 }));

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
    noseBridge: all[7],
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
