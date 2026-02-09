// 얼굴 분석 알고리즘 - Python draw.py에서 TypeScript로 포팅
// MediaPipe Face Mesh 랜드마크 기반 관상 분석

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
  let score = 0;
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0;

  // === 기준 비율 계산 ===
  // 코 너비 (콧볼 너비)
  const noseWidth = Math.abs(fp[13].x - fp[14].x) || 1;
  // 얼굴 너비 (볼 중앙 간 거리)
  const faceWidth = Math.abs(fp[27].x - fp[26].x) || 1;
  // 눈 너비 (왼쪽 눈)
  const leftEyeWidth = Math.abs(fp[17].x - fp[19].x) || 1;
  // 두 눈 사이 거리
  const eyeDistance = Math.abs(fp[0].x - fp[1].x) || 1;
  // 얼굴 세로 길이 (이마에서 턱까지)
  const faceHeight = Math.abs(fp[29].y - fp[32].y) || 1;

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

  // MediaPipe 기준 각도 임계값 조정 (실제 눈꼬리 각도 범위: -15 ~ +15도)
  if (eyeAngleDegrees > 5) {
    eyeAngleAnalysis = {
      label: "눈꼬리가 많이 올라감",
      description: "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 리더십과 독립적인 성향이 강하지만, 독불장군과 같은 고집스러움이 동반될 수 있습니다."
    };
    eyeAngleLevel = 5;
    r1 += WEIGHTS.r1_power * 5;
    r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
  } else if (eyeAngleDegrees > 2) {
    eyeAngleAnalysis = {
      label: "눈꼬리가 올라감",
      description: "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다."
    };
    eyeAngleLevel = 4;
    r1 += WEIGHTS.r1_power * 4;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
  } else if (eyeAngleDegrees > -2) {
    eyeAngleAnalysis = {
      label: "눈꼬리가 일자",
      description: "내면에 강한 의지와 결단력을 지니고 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있으며, 안정적인 성격의 소유자입니다."
    };
    eyeAngleLevel = 3;
    r1 += WEIGHTS.r1_power * 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
  } else if (eyeAngleDegrees > -5) {
    eyeAngleAnalysis = {
      label: "눈꼬리가 내려감",
      description: "마음이 부드러우며 타인에 대한 배려가 깊습니다. 주변 환경에 능동적으로 적응하는 능력이 뛰어나며, 친화력이 좋아 사람들에게 호감을 받습니다."
    };
    eyeAngleLevel = 2;
    r1 += WEIGHTS.r1_power * 2;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 1;
  } else {
    eyeAngleAnalysis = {
      label: "눈꼬리가 많이 내려감",
      description: "매우 부드럽고 온화한 성품의 소유자입니다. 어린이에 대한 애정이 많고, 상대방을 위해 자신을 희생할 줄 아는 따뜻한 마음을 가지고 있습니다."
    };
    eyeAngleLevel = 1;
    r1 += WEIGHTS.r1_power * 1;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 1;
  }
  score += eyeAngleLevel * 10;

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
  score += eyebrowLevel * 8;

  // === 3. 코 길이 분석 ===
  // 코 길이 = 코 브릿지(눈 사이, fp[7])에서 코끝(fp[6])까지
  // 얼굴 세로 길이 대비 비율로 측정
  const noseLength = Math.abs(fp[6].y - fp[7].y);
  const noseLengthRatio = noseLength / faceHeight;

  let noseLengthAnalysis: { label: string; description: string };
  let noseLevel: number;

  // 얼굴 세로 대비 코 길이 비율 (일반적으로 0.25~0.40)
  if (noseLengthRatio > 0.38) {
    noseLengthAnalysis = {
      label: "코가 매우 긴 편",
      description: "강한 책임감과 성실함을 바탕으로 일에 임합니다. 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다."
    };
    noseLevel = 5;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5;
    r3 += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
  } else if (noseLengthRatio > 0.34) {
    noseLengthAnalysis = {
      label: "코가 긴 편",
      description: "책임감이 강하고 맡은 일을 성실하게 완수합니다. 장기적인 계획을 세우는 데 능하며 신뢰받는 인물입니다."
    };
    noseLevel = 4;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
  } else if (noseLengthRatio > 0.30) {
    noseLengthAnalysis = {
      label: "코 길이가 이상적",
      description: "균형 잡힌 능력을 지니고 있어 다양한 사회적 상황에서 자신의 역할을 훌륭히 수행합니다. 평온하고 안정적인 성격입니다."
    };
    noseLevel = 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 3;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 3 + WEIGHTS.r4_sincere * 3;
  } else if (noseLengthRatio > 0.26) {
    noseLengthAnalysis = {
      label: "코가 짧은 편",
      description: "낙관적이고 긍정적인 성격입니다. 상대방의 기분을 잘 파악하며 사교성이 좋습니다."
    };
    noseLevel = 2;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 5;
    r4 += WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
  } else {
    noseLengthAnalysis = {
      label: "코가 매우 짧은 편",
      description: "타고난 낙관주의자로 긍정적인 에너지를 발산합니다. 순발력이 좋고 상황 적응 능력이 뛰어납니다."
    };
    noseLevel = 1;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 5;
    r4 += WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 2;
  }
  score += noseLevel * 8;

  // === 4. 인중 길이 분석 ===
  // 인중 = 코끝(fp[6])에서 윗입술 상단(fp[8])까지의 거리
  // 코 길이 대비 비율로 측정 (더 정확한 비율)
  const philtrumLength = Math.abs(fp[8].y - fp[6].y);
  const philtrumRatio = philtrumLength / noseLength;

  let philtrumAnalysis: { label: string; description: string };
  let philtrumLevel: number;

  // 코 길이 대비 인중 비율 (일반적으로 0.30~0.60)
  if (philtrumRatio > 0.55) {
    philtrumAnalysis = {
      label: "인중이 매우 긴 편",
      description: "인간성이 뛰어나고 장수하는 경향이 있습니다. 물질적인 풍요로움과는 별개로 인품 자체가 높은 평가를 받습니다."
    };
    philtrumLevel = 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (philtrumRatio > 0.47) {
    philtrumAnalysis = {
      label: "인중이 긴 편",
      description: "종종 자신의 노력으로 설명할 수 없는 힘을 발휘하며, 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼칩니다."
    };
    philtrumLevel = 4;
    r1 += WEIGHTS.r1_old * 4;
    r2 += WEIGHTS.r2_love * 4;
    r4 += WEIGHTS.r4_sincere * 4;
  } else if (philtrumRatio > 0.40) {
    philtrumAnalysis = {
      label: "인중이 이상적",
      description: "자녀운에 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 합니다."
    };
    philtrumLevel = 3;
    r1 += WEIGHTS.r1_old * 3;
    r2 += WEIGHTS.r2_love * 3;
    r4 += WEIGHTS.r4_sincere * 3;
  } else if (philtrumRatio > 0.33) {
    philtrumAnalysis = {
      label: "인중이 짧은 편",
      description: "다양한 관심사를 가지고 있으며 새로운 것에 대한 호기심이 강합니다. 많은 사람과 교류하면 좋은 기회가 찾아옵니다."
    };
    philtrumLevel = 2;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_sincere * 2;
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
  score += philtrumLevel * 8;

  // === 5. 입 너비 분석 ===
  // 입 양쪽 끝 사이 거리 / 코 너비 비율
  const mouthWidth = Math.abs(fp[11].x - fp[10].x);
  const mouthRatio = mouthWidth / noseWidth;

  let mouthAnalysis: { label: string; description: string };
  let mouthLevel: number;

  // MediaPipe 기준 임계값 (조정됨)
  if (mouthRatio > 2.2) {
    mouthAnalysis = {
      label: "입이 매우 큰 편",
      description: "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격입니다. 사회적으로도 큰 성공을 거두는 모습을 보여줍니다."
    };
    mouthLevel = 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (mouthRatio > 1.9) {
    mouthAnalysis = {
      label: "입이 큰 편",
      description: "주변에 운기와 생명력이 넘치는 에너지를 발산합니다. 업무 환경에서 동료들 사이에서 인기가 있습니다."
    };
    mouthLevel = 4;
    r1 += WEIGHTS.r1_power * 4;
    r3 += WEIGHTS.r3_work * 4;
  } else if (mouthRatio > 1.6) {
    mouthAnalysis = {
      label: "입 크기가 이상적",
      description: "진정성과 노력으로 어떤 분야에서든 성공의 정점을 찍을 수 있으며, 균형 잡힌 대인관계를 유지합니다."
    };
    mouthLevel = 3;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  } else if (mouthRatio > 1.3) {
    mouthAnalysis = {
      label: "입이 작은 편",
      description: "뛰어난 직관력과 빠른 판단력을 지니고 있습니다. 전략적인 조언자나 중요한 보조 역할에 적합합니다."
    };
    mouthLevel = 2;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_work * 2;
  } else {
    mouthAnalysis = {
      label: "입이 매우 작은 편",
      description: "성격이 매우 상냥하며, 세심한 배려로 주변 사람들을 서포트하는 데에 특별한 재능을 보입니다."
    };
    mouthLevel = 1;
    r1 += WEIGHTS.r1_power * 1;
    r3 += WEIGHTS.r3_work * 2;
  }
  score += mouthLevel * 10;

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
  score += jawLevel * 8;

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
  score += eyeSizeLevel * 8;

  // === 종합 점수 정규화 (100점 만점) ===
  // score는 각 레벨 * 가중치의 합
  // 최대: 5*(10+8+8+8+10+8+8) = 5*60 = 300
  // 최소: 1*(10+8+8+8+10+8+8) = 1*60 = 60
  // 평균 (레벨3 기준): 3*60 = 180
  const maxScore = 300;
  const minScore = 60;
  const baseScore = score;

  // 실제 분포 범위 (60~300)를 표시 범위 (30~85)로 매핑
  // 선형 변환: (score - min) / (max - min) * (targetMax - targetMin) + targetMin
  const targetMin = 30;
  const targetMax = 82;
  const normalizedScore = clamp(
    Math.round((baseScore - minScore) / (maxScore - minScore) * (targetMax - targetMin) + targetMin),
    targetMin,
    targetMax
  );

  // === 카테고리 점수 정규화 ===
  // 각 카테고리의 실제 min/max를 계산하여 더 정확한 분포 생성
  // 가중치 합계를 기준으로 실제 범위 계산
  const normalizeCategory = (val: number, minVal: number, maxVal: number): number => {
    if (maxVal === minVal) return 50; // 분모가 0인 경우 방지
    const ratio = (val - minVal) / (maxVal - minVal);
    // 20~80 범위로 매핑 (극단적 값 방지)
    return clamp(Math.round(ratio * 60 + 20), 20, 80);
  };

  // 실제 가중치 기반 min/max 계산
  // r1: 눈꼬리(1-5)*3 + 눈썹(1-5)*5 + 인중 r1_old(0-5)*5 또는 r1_power(0-5)*3 + 입(1-5)*5
  // 최소~최대 추정
  const r1_min = 15, r1_max = 70;
  const r2_min = 20, r2_max = 110;
  const r3_min = 15, r3_max = 95;
  const r4_min = 15, r4_max = 75;

  r1 = normalizeCategory(r1, r1_min, r1_max);
  r2 = normalizeCategory(r2, r2_min, r2_max);
  r3 = normalizeCategory(r3, r3_min, r3_max);
  r4 = normalizeCategory(r4, r4_min, r4_max);

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
