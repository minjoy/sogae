import { NextRequest, NextResponse } from 'next/server';
import { analyzeFace, convertVisionLandmarks } from '@/lib/face-analysis';

// Google Cloud Vision API를 사용하는 경우
// import vision from '@google-cloud/vision';

// MediaPipe 랜드마크를 Google Vision 형식으로 변환
function convertMediaPipeLandmarks(landmarks: Array<{ x: number; y: number; z: number }>, imageWidth: number, imageHeight: number) {
  // MediaPipe 468 랜드마크를 Vision API 형식으로 매핑
  // 참고: MediaPipe 랜드마크는 미러링되어 있으므로 실제 왼쪽/오른쪽이 반대임
  const mappings: { [key: string]: number } = {
    'LEFT_EYE': 468, // 왼쪽 눈 중심점 (iris)
    'RIGHT_EYE': 473, // 오른쪽 눈 중심점 (iris)
    'LEFT_OF_LEFT_EYEBROW': 70, // 왼쪽 눈썹 왼쪽 끝
    'RIGHT_OF_LEFT_EYEBROW': 63, // 왼쪽 눈썹 오른쪽 끝
    'LEFT_OF_RIGHT_EYEBROW': 293, // 오른쪽 눈썹 왼쪽 끝
    'RIGHT_OF_RIGHT_EYEBROW': 300, // 오른쪽 눈썹 오른쪽 끝
    'NOSE_TIP': 1, // 코 끝
    'NOSE_BRIDGE': 6, // 코 브릿지 (눈 사이, 코 시작점)
    'UPPER_LIP': 0, // 윗입술 상단 경계선 (입술 가장 위)
    'LOWER_LIP': 17, // 아랫입술 하단 경계선
    'MOUTH_LEFT': 61, // 입 왼쪽 끝
    'MOUTH_RIGHT': 291, // 입 오른쪽 끝
    'MOUTH_CENTER': 13, // 입 중앙 (윗입술)
    'NOSE_BOTTOM_RIGHT': 358, // 코 아래 오른쪽 (콧볼 오른쪽)
    'NOSE_BOTTOM_LEFT': 129, // 코 아래 왼쪽 (콧볼 왼쪽)
    'NOSE_BOTTOM_CENTER': 2, // 코 아래 중앙
    'LEFT_EYE_TOP_BOUNDARY': 159, // 왼쪽 눈 위쪽 경계
    'LEFT_EYE_LEFT_CORNER': 33, // 왼쪽 눈 안쪽 모서리
    'LEFT_EYE_BOTTOM_BOUNDARY': 145, // 왼쪽 눈 아래쪽 경계
    'LEFT_EYE_RIGHT_CORNER': 133, // 왼쪽 눈 바깥쪽 모서리
    'RIGHT_EYE_TOP_BOUNDARY': 386, // 오른쪽 눈 위쪽 경계
    'RIGHT_EYE_RIGHT_CORNER': 263, // 오른쪽 눈 바깥쪽 모서리
    'RIGHT_EYE_BOTTOM_BOUNDARY': 374, // 오른쪽 눈 아래쪽 경계
    'RIGHT_EYE_LEFT_CORNER': 362, // 오른쪽 눈 안쪽 모서리
    'LEFT_EYEBROW_UPPER_MIDPOINT': 105, // 왼쪽 눈썹 위쪽 중간점
    'RIGHT_EYEBROW_UPPER_MIDPOINT': 334, // 오른쪽 눈썹 위쪽 중간점
    'LEFT_CHEEK_CENTER': 234, // 왼쪽 볼 중앙
    'RIGHT_CHEEK_CENTER': 454, // 오른쪽 볼 중앙
    'CHIN_GNATHION': 152, // 턱 끝
    'LEFT_EAR_TRAGION': 127, // 왼쪽 귀 앞 돌출부 (턱 각도)
    'RIGHT_EAR_TRAGION': 356, // 오른쪽 귀 앞 돌출부 (턱 각도)
    'FOREHEAD_GLABELLA': 10, // 미간
  };

  const result: Array<{ type: string; position: { x: number; y: number; z?: number } }> = [];

  for (const [type, idx] of Object.entries(mappings)) {
    if (landmarks[idx]) {
      result.push({
        type,
        position: {
          x: landmarks[idx].x * imageWidth,
          y: landmarks[idx].y * imageHeight,
          z: landmarks[idx].z,
        },
      });
    }
  }

  return result;
}

// 얼굴 각도 계산 (MediaPipe 랜드마크 기반)
function calculateFaceAngles(landmarks: Array<{ x: number; y: number; z: number }>) {
  const noseTip = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // 두 눈의 중심
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // 얼굴 너비 (두 눈 사이 거리)
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) +
    Math.pow(rightEye.y - leftEye.y, 2)
  ) || 0.1;

  // 1. Roll angle (얼굴 기울기): 두 눈을 연결한 선의 각도
  const rollAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;

  // 2. Pan angle (좌우 회전): 코끝이 두 눈 중심에서 수평으로 얼마나 벗어났는지
  // 미러링 감지: 일반적으로 rightEye.x > leftEye.x이지만, 셀카(미러링)에서는 반대
  const isMirrored = leftEye.x > rightEye.x;
  // 정면일 때 코끝 x ≈ 눈 중심 x
  // 미러링된 경우 부호 반전 필요
  const noseOffsetX = isMirrored
    ? (eyeCenterX - noseTip.x)  // 미러링된 경우
    : (noseTip.x - eyeCenterX); // 정상적인 경우
  // 눈 거리 대비 비율로 각도 추정 (최대 ±45도 범위로 매핑)
  const panRatio = Math.max(-1, Math.min(1, noseOffsetX / (eyeDistance * 0.5)));
  const panAngle = Math.asin(panRatio) * 180 / Math.PI;

  // 3. Tilt angle (상하 회전): 코끝의 y 위치가 예상 위치에서 벗어난 정도
  // 정면일 때 코끝은 눈과 턱 사이의 약 35% 지점에 위치
  const faceHeight = Math.abs(chin.y - eyeCenterY) || 0.1;
  const expectedNoseY = eyeCenterY + faceHeight * 0.35;
  const noseOffsetY = noseTip.y - expectedNoseY;
  // 위를 보면 코가 예상보다 위로 이동 (음수 offset), 아래를 보면 아래로 (양수 offset)
  const tiltRatio = Math.max(-1, Math.min(1, noseOffsetY / (faceHeight * 0.25)));
  const tiltAngle = Math.asin(tiltRatio) * 180 / Math.PI;

  return { panAngle, tiltAngle, rollAngle };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { landmarks, imageWidth, imageHeight, gender = 'male' } = body;

    if (!landmarks || !imageWidth || !imageHeight) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // MediaPipe 랜드마크를 Vision API 형식으로 변환
    const visionLandmarks = convertMediaPipeLandmarks(landmarks, imageWidth, imageHeight);

    // 얼굴 각도 계산
    const angles = calculateFaceAngles(landmarks);

    // FaceLandmarks 형식으로 변환
    const faceLandmarks = convertVisionLandmarks(visionLandmarks);

    // 얼굴 분석 수행
    const analysisResult = analyzeFace(
      faceLandmarks,
      gender as 'male' | 'female',
      angles.panAngle,
      angles.tiltAngle,
      angles.rollAngle
    );

    // 결과 저장 (선택적)
    // await saveFaceAnalysisResult(analysisResult);

    return NextResponse.json({
      success: true,
      result: analysisResult,
    });

  } catch (error) {
    console.error('Face analysis error:', error);
    return NextResponse.json(
      { success: false, error: '얼굴 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 결과 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facecode = searchParams.get('facecode');

    if (!facecode) {
      return NextResponse.json(
        { success: false, error: 'facecode가 필요합니다.' },
        { status: 400 }
      );
    }

    // TODO: 데이터베이스에서 결과 조회
    // const result = await prisma.faceAnalysis.findUnique({ where: { facecode } });

    return NextResponse.json({
      success: false,
      error: '결과를 찾을 수 없습니다.',
    }, { status: 404 });

  } catch (error) {
    console.error('Get face analysis error:', error);
    return NextResponse.json(
      { success: false, error: '결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
