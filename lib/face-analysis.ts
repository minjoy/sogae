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
    noseTypeRatio: number;      // 코끝-코밑 높이차 / 코너비 (들창코/눌린코 판단용)
    noseTypeLabel: string;      // 코 타입 라벨
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
    // 회전 보정 팩터
    rotationCompHorizontal: number; // 수평 보정 팩터 (좌우 회전)
    rotationCompVertical: number;   // 수직 보정 팩터 (상하 회전)
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

// 얼굴 회전 보정 팩터 계산
// panAngle: 좌우 회전 (양수 = 왼쪽으로 돌림, 음수 = 오른쪽으로 돌림)
// tiltAngle: 상하 회전 (양수 = 위로 올림, 음수 = 아래로 내림)
interface RotationCompensation {
  horizontal: number;  // 수평 측정값 보정 팩터 (입, 눈, 턱 너비 등)
  vertical: number;    // 수직 측정값 보정 팩터 (코, 인중 길이 등)
}

function getRotationCompensation(panAngle: number, tiltAngle: number): RotationCompensation {
  // 각도를 라디안으로 변환
  const panRad = Math.abs(panAngle) * Math.PI / 180;
  const tiltRad = Math.abs(tiltAngle) * Math.PI / 180;

  // 최대 보정 각도 제한 (40도 이상은 측정 신뢰도가 낮음)
  const maxAngleRad = 40 * Math.PI / 180;
  const clampedPanRad = Math.min(panRad, maxAngleRad);
  const clampedTiltRad = Math.min(tiltRad, maxAngleRad);

  // cos 값이 너무 작아지면 보정값이 과도해지므로 최소값 제한
  const minCos = 0.75; // cos(40°) ≈ 0.766

  // 수평 보정: 좌우로 돌리면 수평 거리가 줄어들어 보임 → 1/cos(pan)으로 복원
  const horizontalCos = Math.max(Math.cos(clampedPanRad), minCos);
  const horizontalFactor = 1 / horizontalCos;

  // 수직 보정: 위아래로 돌리면 수직 거리가 줄어들어 보임 → 1/cos(tilt)로 복원
  const verticalCos = Math.max(Math.cos(clampedTiltRad), minCos);
  const verticalFactor = 1 / verticalCos;

  return {
    horizontal: horizontalFactor,
    vertical: verticalFactor
  };
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

  // 얼굴 회전 보정 팩터 계산
  const rotationComp = getRotationCompensation(panAngle, tiltAngle);

  // draw.py와 동일하게 facescore 직접 누적
  let facescore = 0;
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0;

  // 세부 카테고리 합산값 추적 (draw.py와 동일)
  let r1_power_sum = 0;
  let r1_old_sum = 0;
  let r2_spirit_sum = 0;
  let r2_adult_sum = 0;
  let r2_love_sum = 0;
  let r2_jeal_sum = 0;
  let r3_work_sum = 0;
  let r3_social_sum = 0;
  let r3_someone_sum = 0;
  let r3_money_sum = 0;
  let r4_kind_sum = 0;
  let r4_wind_sum = 0;
  let r4_respon_sum = 0;
  let r4_since_sum = 0;

  // === 기준 비율 계산 === (draw.py와 동일)
  // widthratio = 코 너비 (콧볼 너비) - 수평 보정 적용
  const noseWidthRaw = Math.abs(fp[13].x - fp[14].x) || 1;
  const noseWidth = noseWidthRaw * rotationComp.horizontal;
  // widthratio2 = 얼굴 너비 (볼 중앙 간 거리) - 수평 보정 적용
  const faceWidthRaw = Math.abs(fp[27].x - fp[26].x) || 1;
  const faceWidth = faceWidthRaw * rotationComp.horizontal;

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
  // 임계값 조정: 살짝 올라갔는데 일자로 나오는 문제 수정 (추가 하향)
  if (eyeAngleDegrees > 5) {
    // 눈꼬리 많이 올라감
    eyeAngleAnalysis = {
      label: "눈꼬리가 많이 올라감",
      description: "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 리더십과 독립적인 성향이 강하지만, 독불장군과 같은 고집스러움이 동반될 수 있습니다."
    };
    eyeAngleLevel = 5;
    facescore += WEIGHTS.r2_spirit * 5; r2_spirit_sum += WEIGHTS.r2_spirit * 5;
    facescore += WEIGHTS.r2_adult * 4; r2_adult_sum += WEIGHTS.r2_adult * 4;
    facescore += WEIGHTS.r4_kind * 1; r4_kind_sum += WEIGHTS.r4_kind * 1;
    facescore += WEIGHTS.r4_wind * 5; r4_wind_sum += WEIGHTS.r4_wind * 5;
    r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
  } else if (eyeAngleDegrees > 2) {
    // 눈꼬리 올라감
    eyeAngleAnalysis = {
      label: "눈꼬리가 올라감",
      description: "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다."
    };
    eyeAngleLevel = 4;
    facescore += WEIGHTS.r2_spirit * 4; r2_spirit_sum += WEIGHTS.r2_spirit * 4;
    facescore += WEIGHTS.r2_adult * 4; r2_adult_sum += WEIGHTS.r2_adult * 4;
    facescore += WEIGHTS.r4_kind * 4; r4_kind_sum += WEIGHTS.r4_kind * 4;
    facescore += WEIGHTS.r4_wind * 4; r4_wind_sum += WEIGHTS.r4_wind * 4;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
  } else if (eyeAngleDegrees > -5) {
    // 눈꼬리 일자 (-5° ~ +2°)
    eyeAngleAnalysis = {
      label: "눈꼬리가 일자",
      description: "내면에 강한 의지와 결단력을 지니고 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있으며, 안정적인 성격의 소유자입니다."
    };
    eyeAngleLevel = 3;
    facescore += WEIGHTS.r2_spirit * 3; r2_spirit_sum += WEIGHTS.r2_spirit * 3;
    facescore += WEIGHTS.r2_adult * 3; r2_adult_sum += WEIGHTS.r2_adult * 3;
    facescore += WEIGHTS.r4_kind * 5; r4_kind_sum += WEIGHTS.r4_kind * 5;
    facescore += WEIGHTS.r4_wind * 3; r4_wind_sum += WEIGHTS.r4_wind * 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
  } else {
    // 눈꼬리 내려감 (< -4°)
    eyeAngleAnalysis = {
      label: "눈꼬리가 내려감",
      description: "마음이 부드러우며 타인에 대한 배려가 깊습니다. 주변 환경에 능동적으로 적응하는 능력이 뛰어나며, 친화력이 좋아 사람들에게 호감을 받습니다."
    };
    eyeAngleLevel = 2;
    facescore += WEIGHTS.r2_spirit * 1; r2_spirit_sum += WEIGHTS.r2_spirit * 1;
    facescore += WEIGHTS.r2_adult * 1; r2_adult_sum += WEIGHTS.r2_adult * 1;
    facescore += WEIGHTS.r4_kind * 2; r4_kind_sum += WEIGHTS.r4_kind * 2;
    facescore += WEIGHTS.r4_wind * 1; r4_wind_sum += WEIGHTS.r4_wind * 1;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
  }

  // === 2. 눈썹-눈 거리 분석 ===
  // 눈썹 위쪽 중간점과 눈 중심 사이 거리 - 수직 보정 적용
  const eyebrowEyeDistLeftRaw = Math.abs(fp[0].y - fp[24].y);
  const eyebrowEyeDistRightRaw = Math.abs(fp[1].y - fp[25].y);
  const eyebrowEyeDistLeft = eyebrowEyeDistLeftRaw * rotationComp.vertical;
  const eyebrowEyeDistRight = eyebrowEyeDistRightRaw * rotationComp.vertical;
  const avgEyebrowDist = (eyebrowEyeDistLeft + eyebrowEyeDistRight) / 2;
  // 눈 세로 크기 대비 비율로 계산 - 수직 보정 적용
  const eyeHeightRaw = Math.abs(fp[18].y - fp[16].y) || 1;
  const eyeHeight = eyeHeightRaw * rotationComp.vertical;
  const eyebrowRatio = avgEyebrowDist / eyeHeight;

  let eyebrowDistanceAnalysis: { label: string; description: string };
  let eyebrowLevel: number;

  // 실제 관상가 피드백 기반 임계값 조정 (eyebrowRatio 범위: 2.1~3.6)
  // - "좁음/좁은편": 2.13~2.46 → 좁은 편 또는 매우 좁음
  // - "넓은편": 3.07~3.09 → 넓은 편
  // - "많이넓음": 2.88~3.64 → 매우 넓음 또는 넓은 편
  if (eyebrowRatio > 3.2) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 넓음",
      description: "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 낙천적이고 개방적인 성격입니다."
    };
    eyebrowLevel = 5;
    r1 += WEIGHTS.r1_old * 5; r1_old_sum += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_spirit * 2; r2_spirit_sum += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 5; r3_money_sum += WEIGHTS.r3_money * 5;
  } else if (eyebrowRatio > 2.7) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 넓은 편",
      description: "자연스럽게 복이 많은 삶을 살고 있으며, 낙천적인 성향을 가지고 있습니다. 온순하고 착한 면모로 주변 사람들에게 큰 호감을 줍니다."
    };
    eyebrowLevel = 4;
    r1 += WEIGHTS.r1_old * 4; r1_old_sum += WEIGHTS.r1_old * 4;
    r2 += WEIGHTS.r2_spirit * 2; r2_spirit_sum += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 4; r3_money_sum += WEIGHTS.r3_money * 4;
  } else if (eyebrowRatio > 2.5) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 이상적",
      description: "눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻습니다."
    };
    eyebrowLevel = 3;
    r1 += WEIGHTS.r1_old * 3; r1_old_sum += WEIGHTS.r1_old * 3;
    r2 += WEIGHTS.r2_spirit * 3; r2_spirit_sum += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 3; r3_money_sum += WEIGHTS.r3_money * 3;
  } else if (eyebrowRatio > 2.2) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 좁은 편",
      description: "자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 열려 있습니다. 일 처리 방식이 섬세하고 꼼꼼합니다."
    };
    eyebrowLevel = 2;
    r1 += WEIGHTS.r1_old * 2; r1_old_sum += WEIGHTS.r1_old * 2;
    r2 += WEIGHTS.r2_spirit * 3; r2_spirit_sum += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2; r3_money_sum += WEIGHTS.r3_money * 2;
  } else {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 좁음",
      description: "뛰어난 집중력과 분석력을 가지고 있습니다. 공과 사가 확실하며 업무에서 높은 성과를 내는 타입입니다."
    };
    eyebrowLevel = 1;
    r1 += WEIGHTS.r1_old * 1; r1_old_sum += WEIGHTS.r1_old * 1;
    r2 += WEIGHTS.r2_spirit * 4; r2_spirit_sum += WEIGHTS.r2_spirit * 4;
    r3 += WEIGHTS.r3_money * 2; r3_money_sum += WEIGHTS.r3_money * 2;
  }
  // facescore에 눈썹 분석 점수 추가 (draw.py 방식)
  facescore += WEIGHTS.r2_spirit * eyebrowLevel; r2_spirit_sum += WEIGHTS.r2_spirit * eyebrowLevel;
  facescore += WEIGHTS.r3_money * eyebrowLevel; r3_money_sum += WEIGHTS.r3_money * eyebrowLevel;

  // === 3. 코 길이 분석 === (draw.py ratio2 공식)
  // ratio2 = (facepoint[15].y - facepoint[0].y) / widthratio
  // 코밑 중앙(fp[15])에서 눈 중심(fp[0])까지 / 코 너비 - 수직 보정 적용
  const noseLengthRaw = (fp[15].y - fp[0].y) * rotationComp.vertical;
  const noseLengthRatio = noseLengthRaw / noseWidth;

  let noseLengthAnalysis: { label: string; description: string };
  let noseLevel: number;

  // draw.py 임계값: >1.55 (긴), 1.28~1.55 (이상적), <1.28 (짧음)
  if (noseLengthRatio > 1.55) {
    noseLengthAnalysis = {
      label: "코가 긴 편",
      description: "강한 책임감과 성실함을 바탕으로 일에 임합니다. 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다."
    };
    noseLevel = 5;
    r2 += WEIGHTS.r2_spirit * 3; r2_spirit_sum += WEIGHTS.r2_spirit * 3;
    r2 += WEIGHTS.r2_love * 5; r2_love_sum += WEIGHTS.r2_love * 5;
    r3 += WEIGHTS.r3_social * 3; r3_social_sum += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_responsibility * 5; r4_respon_sum += WEIGHTS.r4_responsibility * 5;
    r4 += WEIGHTS.r4_sincere * 5; r4_since_sum += WEIGHTS.r4_sincere * 5;
  } else if (noseLengthRatio > 1.28) {
    noseLengthAnalysis = {
      label: "코 길이가 이상적",
      description: "균형 잡힌 능력을 지니고 있어 다양한 사회적 상황에서 자신의 역할을 훌륭히 수행합니다. 평온하고 안정적인 성격입니다."
    };
    noseLevel = 3;
    r2 += WEIGHTS.r2_spirit * 3; r2_spirit_sum += WEIGHTS.r2_spirit * 3;
    r2 += WEIGHTS.r2_love * 4; r2_love_sum += WEIGHTS.r2_love * 4;
    r3 += WEIGHTS.r3_social * 4; r3_social_sum += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 4; r4_respon_sum += WEIGHTS.r4_responsibility * 4;
    r4 += WEIGHTS.r4_sincere * 4; r4_since_sum += WEIGHTS.r4_sincere * 4;
  } else {
    noseLengthAnalysis = {
      label: "코가 짧은 편",
      description: "낙관적이고 긍정적인 성격입니다. 상대방의 기분을 잘 파악하며 사교성이 좋고 장사도 잘 어울립니다. 재물운이 좋지만 신중함이 필요합니다."
    };
    noseLevel = 1;
    r2 += WEIGHTS.r2_spirit * 4; r2_spirit_sum += WEIGHTS.r2_spirit * 4;
    r2 += WEIGHTS.r2_love * 2; r2_love_sum += WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 4; r3_social_sum += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 2; r4_respon_sum += WEIGHTS.r4_responsibility * 2;
    r4 += WEIGHTS.r4_sincere * 3; r4_since_sum += WEIGHTS.r4_sincere * 3;
  }
  // facescore에 코 분석 점수 추가
  facescore += WEIGHTS.r2_spirit * noseLevel; r2_spirit_sum += WEIGHTS.r2_spirit * noseLevel;
  facescore += WEIGHTS.r2_love * noseLevel; r2_love_sum += WEIGHTS.r2_love * noseLevel;
  facescore += WEIGHTS.r4_responsibility * noseLevel; r4_respon_sum += WEIGHTS.r4_responsibility * noseLevel;

  // === 4. 인중 길이 분석 === (개선된 버전)
  // 인중 = 코 아래점(fp[15])에서 윗입술 상단(fp[8])까지
  // fp[15] = noseBottomCenter (MediaPipe #2, 코 끝나는 지점)
  // fp[8] = upperLip (MediaPipe #0, 윗입술 가장 위)
  const philtrumLengthRaw = (fp[8].y - fp[15].y) * rotationComp.vertical;
  const philtrumRatio = philtrumLengthRaw / noseWidth;

  // 코 타입 분석 (들창코/눌린코)
  // 코끝(fp[6])이 코 아래점(fp[15])보다 얼마나 높은지 체크
  const noseTipHeight = (fp[15].y - fp[6].y) * rotationComp.vertical; // 코끝이 코밑보다 얼마나 위에 있는지
  const noseTypeRatio = noseTipHeight / noseWidth;

  let noseTypeLabel = "";
  if (noseTypeRatio > 0.25) {
    noseTypeLabel = "들창코 (코끝이 올라간 형태)";
  } else if (noseTypeRatio < 0.08) {
    noseTypeLabel = "눌린코 (코끝이 낮은 형태)";
  } else {
    noseTypeLabel = "보통 코 형태";
  }

  let philtrumAnalysis: { label: string; description: string };
  let philtrumLevel: number;

  // 인중 임계값 조정: 보통인데 짧다고 나오므로 임계값 하향
  if (philtrumRatio > 0.45) {
    philtrumAnalysis = {
      label: "인중이 매우 긴 편",
      description: "인간성이 뛰어나고 장수하는 경향이 있습니다. 물질적인 풍요로움과는 별개로 인품 자체가 높은 평가를 받습니다."
    };
    philtrumLevel = 5;
    r1 += WEIGHTS.r1_old * 5; r1_old_sum += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5; r2_love_sum += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5; r4_since_sum += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.38) {
    philtrumAnalysis = {
      label: "인중이 긴 편",
      description: "종종 자신의 노력으로 설명할 수 없는 힘을 발휘하며, 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼칩니다."
    };
    philtrumLevel = 4;
    r1 += WEIGHTS.r1_old * 5; r1_old_sum += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5; r2_love_sum += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5; r4_since_sum += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.28) {
    philtrumAnalysis = {
      label: "인중이 이상적",
      description: "자녀운에 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 합니다."
    };
    philtrumLevel = 3;
    r1 += WEIGHTS.r1_old * 5; r1_old_sum += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5; r2_love_sum += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5; r4_since_sum += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.24) {
    philtrumAnalysis = {
      label: "인중이 짧은 편",
      description: "다양한 관심사를 가지고 있으며 새로운 것에 대한 호기심이 강합니다. 많은 사람과 교류하면 좋은 기회가 찾아옵니다."
    };
    philtrumLevel = 2;
    r1 += WEIGHTS.r1_power * 2; r1_power_sum += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 2; r3_social_sum += WEIGHTS.r3_social * 2;
    r4 += WEIGHTS.r4_sincere * 1; r4_since_sum += WEIGHTS.r4_sincere * 1;
  } else {
    philtrumAnalysis = {
      label: "인중이 매우 짧은 편",
      description: "빠른 판단력과 행동력을 가지고 있습니다. 적극적으로 교류하며 관계를 넓혀가면 상황을 전환시킬 수 있습니다."
    };
    philtrumLevel = 1;
    r1 += WEIGHTS.r1_power * 2; r1_power_sum += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 4; r3_social_sum += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_sincere * 1; r4_since_sum += WEIGHTS.r4_sincere * 1;
  }
  // facescore에 인중 분석 점수 추가
  facescore += WEIGHTS.r1_old * philtrumLevel; r1_old_sum += WEIGHTS.r1_old * philtrumLevel;
  facescore += WEIGHTS.r2_love * philtrumLevel; r2_love_sum += WEIGHTS.r2_love * philtrumLevel;
  facescore += WEIGHTS.r4_sincere * philtrumLevel; r4_since_sum += WEIGHTS.r4_sincere * philtrumLevel;

  // === 5. 입 너비 분석 === (draw.py ratio7 공식)
  // ratio7 = (facepoint[11].x - facepoint[10].x) / widthratio - 수평 보정 적용
  const mouthWidthRaw = Math.abs(fp[11].x - fp[10].x);
  const mouthWidthVal = mouthWidthRaw * rotationComp.horizontal;
  const mouthRatio = mouthWidthVal / noseWidth;

  let mouthAnalysis: { label: string; description: string };
  let mouthLevel: number;

  // 임계값 조정 (실제 데이터 기반: mouthRatio 범위 0.96~1.37)
  // 기존 draw.py 임계값이 너무 높아서 거의 다 "작음"으로 분류됨
  if (mouthRatio > 1.25) {
    mouthAnalysis = {
      label: "입이 매우 큰 편",
      description: "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격입니다. 사회적으로도 큰 성공을 거두는 모습을 보여줍니다."
    };
    mouthLevel = 5;
    r1 += WEIGHTS.r1_power * 5; r1_power_sum += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5; r3_work_sum += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.15) {
    mouthAnalysis = {
      label: "입이 큰 편",
      description: "주변에 운기와 생명력이 넘치는 에너지를 발산합니다. 업무 환경에서 동료들 사이에서 인기가 있습니다."
    };
    mouthLevel = 4;
    r1 += WEIGHTS.r1_power * 5; r1_power_sum += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5; r3_work_sum += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.05) {
    mouthAnalysis = {
      label: "입 크기가 이상적",
      description: "진정성과 노력으로 어떤 분야에서든 성공의 정점을 찍을 수 있으며, 균형 잡힌 대인관계를 유지합니다."
    };
    mouthLevel = 3;
    r1 += WEIGHTS.r1_power * 5; r1_power_sum += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5; r3_work_sum += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 0.95) {
    mouthAnalysis = {
      label: "입이 작은 편",
      description: "뛰어난 직관력과 빠른 판단력을 지니고 있습니다. 전략적인 조언자나 중요한 보조 역할에 적합합니다."
    };
    mouthLevel = 2;
    r1 += WEIGHTS.r1_power * 3; r1_power_sum += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3; r3_work_sum += WEIGHTS.r3_work * 3;
  } else {
    mouthAnalysis = {
      label: "입이 매우 작은 편",
      description: "성격이 매우 상냥하며, 세심한 배려로 주변 사람들을 서포트하는 데에 특별한 재능을 보입니다."
    };
    mouthLevel = 1;
    r1 += WEIGHTS.r1_power * 3; r1_power_sum += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3; r3_work_sum += WEIGHTS.r3_work * 3;
  }
  // facescore에 입 분석 점수 추가
  facescore += WEIGHTS.r1_power * mouthLevel; r1_power_sum += WEIGHTS.r1_power * mouthLevel;
  facescore += WEIGHTS.r3_work * mouthLevel; r3_work_sum += WEIGHTS.r3_work * mouthLevel;

  // === 6. 하관(턱) 분석 ===
  // 실제 데이터 분석 결과: avgJawAngle이 높을수록 튼튼한 턱
  // - "하관 발달" → avgJawAngle: 30~32°
  // - "턱 가늘다/얇음" → avgJawAngle: 24~27°

  // 턱 너비 - 수평 보정 적용
  const jawWidthRaw = Math.abs(fp[31].x - fp[30].x);
  const jawWidth = jawWidthRaw * rotationComp.horizontal;
  const jawRatio = jawWidth / faceWidth;

  // 턱각 계산 (볼-턱각-턱끝 사이의 각도)
  const calcJawAngle = (cheek: FacePoint, jaw: FacePoint, chin: FacePoint) => {
    const v1x = cheek.x - jaw.x, v1y = cheek.y - jaw.y;
    const v2x = chin.x - jaw.x, v2y = chin.y - jaw.y;
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
    return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
  };
  const leftJawAngle = calcJawAngle(fp[26], fp[30], fp[29]);
  const rightJawAngle = calcJawAngle(fp[27], fp[31], fp[29]);
  const avgJawAngle = (leftJawAngle + rightJawAngle) / 2;

  // 하관 길이 (턱끝 ~ 턱각 거리) - 디버그용으로 유지
  const jawLengthLeft = Math.sqrt(
    Math.pow(fp[29].x - fp[30].x, 2) + Math.pow(fp[29].y - fp[30].y, 2)
  );
  const jawLengthRight = Math.sqrt(
    Math.pow(fp[29].x - fp[31].x, 2) + Math.pow(fp[29].y - fp[31].y, 2)
  );
  const avgJawLength = (jawLengthLeft + jawLengthRight) / 2;
  const jawWidthToLengthRatio = avgJawLength / (jawWidth || 1);

  let jawAnalysis: { label: string; description: string };
  let jawLevel: number;

  // 실제 데이터 기반 임계값 (avgJawAngle 범위: 22~35°)
  // 높은 각도 = 튼튼한 턱, 낮은 각도 = 가는 턱
  // 임계값 상향: 갸름한데 튼튼으로 나오는 문제 수정
  if (avgJawAngle > 33) {
    jawAnalysis = {
      label: "하관이 매우 튼튼함",
      description: "넓고 튼튼한 턱으로, 말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 강한 의지력과 추진력을 가지고 있습니다."
    };
    jawLevel = 5;
    r2 += WEIGHTS.r2_adult * 5; r2_adult_sum += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5; r3_social_sum += WEIGHTS.r3_social * 5;
  } else if (avgJawAngle > 31) {
    jawAnalysis = {
      label: "하관이 튼튼함",
      description: "안정적인 턱 구조로, 말년에 재물과 자녀의 복으로 풍요를 누릴 예정입니다. 삶의 후반기에 편안한 삶을 즐길 수 있습니다."
    };
    jawLevel = 4;
    r2 += WEIGHTS.r2_adult * 4; r2_adult_sum += WEIGHTS.r2_adult * 4;
    r3 += WEIGHTS.r3_social * 4; r3_social_sum += WEIGHTS.r3_social * 4;
  } else if (avgJawAngle > 29) {
    jawAnalysis = {
      label: "하관이 이상적",
      description: "균형 잡힌 얼굴형으로 안정적인 인상을 줍니다. 말년에도 편안하고 충족된 삶을 즐길 수 있습니다."
    };
    jawLevel = 3;
    r2 += WEIGHTS.r2_adult * 3; r2_adult_sum += WEIGHTS.r2_adult * 3;
    r3 += WEIGHTS.r3_social * 3; r3_social_sum += WEIGHTS.r3_social * 3;
  } else if (avgJawAngle > 27) {
    jawAnalysis = {
      label: "턱이 갸름한 편",
      description: "섬세하고 예민한 성격의 소유자입니다. 끊임없는 노력으로 자수성가의 길을 걷게 됩니다."
    };
    jawLevel = 2;
    r2 += WEIGHTS.r2_adult * 2; r2_adult_sum += WEIGHTS.r2_adult * 2;
    r3 += WEIGHTS.r3_social * 2; r3_social_sum += WEIGHTS.r3_social * 2;
  } else {
    jawAnalysis = {
      label: "턱이 가늘고 뾰족한 편",
      description: "세련되고 날카로운 인상을 줍니다. 자신만의 스타일과 개성이 뚜렷하며, 창의적인 분야에서 재능을 발휘합니다."
    };
    jawLevel = 1;
    r2 += WEIGHTS.r2_adult * 1; r2_adult_sum += WEIGHTS.r2_adult * 1;
    r3 += WEIGHTS.r3_social * 2; r3_social_sum += WEIGHTS.r3_social * 2;
  }
  // facescore에 턱 분석 점수 추가
  facescore += WEIGHTS.r2_adult * jawLevel; r2_adult_sum += WEIGHTS.r2_adult * jawLevel;
  facescore += WEIGHTS.r3_social * jawLevel; r3_social_sum += WEIGHTS.r3_social * jawLevel;

  // === 7. 눈 크기 분석 ===
  // 눈 너비 - 수평 보정 적용, 눈 높이 - 수직 보정 적용
  const eyeSizeLeftXRaw = Math.abs(fp[17].x - fp[19].x);
  const eyeSizeLeftYRaw = Math.abs(fp[18].y - fp[16].y) || 1;
  const eyeSizeLeftX = eyeSizeLeftXRaw * rotationComp.horizontal;
  const eyeSizeLeftY = eyeSizeLeftYRaw * rotationComp.vertical;
  const eyeRatio = eyeSizeLeftX / eyeSizeLeftY;
  const eyeFaceWidthRatio = faceWidth / eyeSizeLeftX;

  let eyeSizeAnalysis: { label: string; description: string };
  let eyeSizeLevel: number;

  // 눈 크기와 형태에 따른 분석 (임계값 상향: 큰 눈이 보통으로 나오는 문제 수정)
  if (eyeFaceWidthRatio < 5.0) {
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
    r2 += WEIGHTS.r2_spirit * 1; r2_spirit_sum += WEIGHTS.r2_spirit * 1;
    r2 += WEIGHTS.r2_jealousy * 5; r2_jeal_sum += WEIGHTS.r2_jealousy * 5;
    r3 += WEIGHTS.r3_someone * 1; r3_someone_sum += WEIGHTS.r3_someone * 1;
    r4 += WEIGHTS.r4_kind * 1; r4_kind_sum += WEIGHTS.r4_kind * 1;
  } else if (eyeFaceWidthRatio < 6.0) {
    // 눈이 보통
    eyeSizeAnalysis = {
      label: "눈이 보통 크기",
      description: "호기심이 왕성하고 표현력이 풍부한 성격으로, 빠른 판단력과 대담한 행동력을 가지고 있습니다."
    };
    eyeSizeLevel = 3;
    r2 += WEIGHTS.r2_spirit * 2; r2_spirit_sum += WEIGHTS.r2_spirit * 2;
    r2 += WEIGHTS.r2_jealousy * 2; r2_jeal_sum += WEIGHTS.r2_jealousy * 2;
    r3 += WEIGHTS.r3_work * 3; r3_work_sum += WEIGHTS.r3_work * 3;
    r3 += WEIGHTS.r3_someone * 2; r3_someone_sum += WEIGHTS.r3_someone * 2;
    r4 += WEIGHTS.r4_kind * 3; r4_kind_sum += WEIGHTS.r4_kind * 3;
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
    r2 += WEIGHTS.r2_spirit * 4; r2_spirit_sum += WEIGHTS.r2_spirit * 4;
    r2 += WEIGHTS.r2_jealousy * 3; r2_jeal_sum += WEIGHTS.r2_jealousy * 3;
    r3 += WEIGHTS.r3_someone * 3; r3_someone_sum += WEIGHTS.r3_someone * 3;
    r4 += WEIGHTS.r4_kind * 4; r4_kind_sum += WEIGHTS.r4_kind * 4;
  }
  // facescore에 눈 크기 분석 점수 추가
  facescore += WEIGHTS.r2_spirit * eyeSizeLevel; r2_spirit_sum += WEIGHTS.r2_spirit * eyeSizeLevel;
  facescore += WEIGHTS.r3_someone * eyeSizeLevel; r3_someone_sum += WEIGHTS.r3_someone * eyeSizeLevel;

  // === 종합 점수 정규화 === (draw.py 공식 기반, 다양한 분포를 위해 조정)
  // draw.py: face_color = (150 - (facescore - 172)) / 149 * 100
  // facescore 범위: 약 100 ~ 350 (가중치 합산)
  // face_color는 "상위 X%"를 의미 (낮을수록 좋음)

  // 점수 분포 개선: facescore에 따라 0~100점 범위로 분포
  // facescore가 높을수록 좋은 관상 → 높은 점수
  const minFacescore = 80;
  const maxFacescore = 320;
  const scoreRange = maxFacescore - minFacescore;

  // 선형 매핑: facescore를 0~100점으로 변환
  const facescoreNormalized = clamp(
    Math.round(((facescore - minFacescore) / scoreRange) * 100),
    0,
    100
  );

  // draw.py 호환: 상위 X% 계산 (face_color)
  const faceColor = (150 - (facescore - 172)) / 149 * 100;

  // === 카테고리 점수 정규화 ===
  // 각 카테고리 raw 점수를 0~100 범위로 변환
  // 기준점 45, 편차 크게 반영하여 변별력 확보
  const normalizeCategory = (val: number, avgVal: number, spread: number): number => {
    const deviation = (val - avgVal) / spread;
    // 기준점 45, 편차 50배 반영 (0~100 전체 범위 활용)
    const normalized = 45 + deviation * 50;
    return clamp(Math.round(normalized), 0, 100);
  };

  // r1~r4 raw 값 저장 (디버그용)
  const rawR1 = r1, rawR2 = r2, rawR3 = r3, rawR4 = r4;

  // 각 카테고리 정규화 - avgVal 상향으로 점수 기준 엄격하게
  r1 = normalizeCategory(r1, 25, 12);  // 기준 상향, spread 축소
  r2 = normalizeCategory(r2, 50, 18);
  r3 = normalizeCategory(r3, 40, 16);
  r4 = normalizeCategory(r4, 32, 12);

  // 최종 점수: facescore 기반 점수와 카테고리 평균의 가중 조합
  // 카테고리 점수와 전체 점수가 일관성 있게 나오도록 함
  const categoryAvg = (r1 + r2 + r3 + r4) / 4;
  // facescore 40%, 카테고리 평균 60% 조합 (0~100 범위)
  const normalizedScore = clamp(
    Math.round(facescoreNormalized * 0.4 + categoryAvg * 0.6),
    0,
    100
  );

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

  // 2. 눈두덩이 기반 특성 (실제 데이터 기반 조정)
  if (eyebrowRatio > 2.7) {
    traits = applyTraitModifiers(traits, '눈두덩이', 'high');
  } else if (eyebrowRatio < 2.3) {
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

  // 5. 입크기 기반 특성 (임계값 조정됨)
  if (mouthRatio > 1.15) {
    traits = applyTraitModifiers(traits, '입크기', 'high');
  } else if (mouthRatio < 1.00) {
    traits = applyTraitModifiers(traits, '입크기', 'low');
  }

  // 6. 하관 기반 특성
  if (jawRatio > 0.77) {
    traits = applyTraitModifiers(traits, '하관', 'high');
  } else if (jawRatio < 0.60) {
    traits = applyTraitModifiers(traits, '하관', 'low');
  }

  // 7. 눈크기 기반 특성 (회전 보정 적용으로 원래 임계값 사용)
  if (eyeFaceWidthRatio < 4.5) {
    traits = applyTraitModifiers(traits, '눈크기', 'big');
  } else if (eyeFaceWidthRatio > 5.5) {
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

  // === 종합 해석 생성 (draw.py whytext 방식) ===
  // draw.py와 동일하게 각 세부 카테고리에 오프셋 적용 후 가장 높은 값 찾기
  const categoryScores: Array<{ name: string; score: number; whytext: string }> = [
    { name: 'r1_power_sum', score: r1_power_sum + 60, whytext: '힘의 기운이 가득찬 관상이오, 짝을 만날때는 내 넘치는 체력을 받아줄 강철체력이면 좋겠습니다.' },
    { name: 'r1_old_sum', score: r1_old_sum + 53, whytext: '장수의 기운이 깃든 관상이오. 오랫동안 홀로 남아있으면 외로우니 같이 장수의 기운이 있는 상대면 좋겠습니다.' },
    { name: 'r2_spirit_sum', score: r2_spirit_sum + 3, whytext: '총명함과 정신이 깃든 관상이오. 귀한 자식을 두기 위해 애교살이 많거나 성기에 점이 있는 상대면 좋겠습니다.' },
    { name: 'r2_adult_sum', score: r2_adult_sum + 53, whytext: '중년에 행복이 깃든 관상이오. 입술이 붉고 윤곽이 뚜렷하면 외조가 확실한 사람이 많습니다. 그런 상대면 좋겠습니다.' },
    { name: 'r2_love_sum', score: r2_love_sum + 41, whytext: '애정운이 충만한 관상이오. 나에 대한 애정과 관심을 늘 공유할 수 있는 다정하고 소통이 잘 되는 상대를 만나면 좋겠습니다.' },
    { name: 'r2_jeal_sum', score: r2_jeal_sum + 75, whytext: '질투심이 충만한 관상이오. 나만 바라보고 깊은 신뢰를 줄 수 있는 그런 상대를 만나면 좋겠습니다.' },
    { name: 'r3_work_sum', score: r3_work_sum + 35, whytext: '업무능력이 뛰어난 관상이오. 관직에 오르거나 일적으로 인정받을 수 있으니 이 또한 질투하지 않고 인정해주는 상대를 만나면 좋겠습니다.' },
    { name: 'r3_social_sum', score: r3_social_sum + 38, whytext: '사회성이 풍만한 관상이오. 바깥활동이 많으나 그 활동을 편하게 해주는 짝을 만나야 일이 잘 풀리고 높은 공을 세울것 입니다.' },
    { name: 'r3_someone_sum', score: r3_someone_sum + 93, whytext: '남의 시선을 다소 의식하는 관상이오. 나의 기운을 보완하거나 개선될 수 있도록 자신감이 넘치며 리드할 수 있는 상대가 좋습니다.' },
    { name: 'r3_money_sum', score: r3_money_sum + 45, whytext: '재물이 끊임없이 들어오는 관상이오. 밑빠진 독에 물붓지 않도록 소비가 현명하며 금전적인 문제가 없는 사람을 만나면 좋겠습니다.' },
    { name: 'r4_kind_sum', score: r4_kind_sum + 48, whytext: '순수한 영혼을 가진 착한 관상이오. 나의 순수함을 보완하여 우유부단함을 해결하고 옳고 그름을 잘 따지며 결단력있는 상대면 좋겠습니다.' },
    { name: 'r4_wind_sum', score: r4_wind_sum + 90, whytext: '호기심이 많아서 새로운사람을 궁금해하는 관상이오. 내가 쓸대없는 생각을 하지 못하도록 나를 휘어잡는 사람이 좋겠습니다.' },
    { name: 'r4_respon_sum', score: r4_respon_sum + 38, whytext: '책임감이 뛰어난 관상이오. 책임감도 남녀가 한쪽에 치우치면 기울어지는 법. 삶에 대한 책임감이 있으며 문제를 이성적으로 해결하는 사람이 좋겠습니다.' },
    { name: 'r4_since_sum', score: r4_since_sum + 51, whytext: '뼈속까지 성실한 관상이오. 성실함이 남녀 한쪽에 치우치면 넘어지는 법. 같이 성실하며 서로의 신뢰를 잘 지키는 사람이 좋겠습니다.' },
  ];

  // 가장 높은 점수의 카테고리 찾기
  const topCategory = categoryScores.reduce((max, curr) => curr.score > max.score ? curr : max, categoryScores[0]);
  const summary = topCategory.whytext;

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

  // r1, r2, r3, r4는 이미 normalizeCategory로 정규화됨 (lines 789-792)

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
      noseTypeRatio, // 코끝-코밑 높이차 / 코너비 (들창코/눌린코 판단용)
      noseTypeLabel, // 코 타입 라벨
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
      // 회전 보정 팩터
      rotationCompHorizontal: rotationComp.horizontal,
      rotationCompVertical: rotationComp.vertical,
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
