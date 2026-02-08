import { NextRequest, NextResponse } from 'next/server';
import { analyzeFace, convertVisionLandmarks } from '@/lib/face-analysis';

// Google Cloud Vision API를 사용하는 경우
// import vision from '@google-cloud/vision';

// MediaPipe 랜드마크를 Google Vision 형식으로 변환
function convertMediaPipeLandmarks(landmarks: Array<{ x: number; y: number; z: number }>, imageWidth: number, imageHeight: number) {
  // MediaPipe 468 랜드마크를 Vision API 형식으로 매핑
  const mappings: { [key: string]: number } = {
    'LEFT_EYE': 468, // 대략적인 중심점
    'RIGHT_EYE': 473,
    'LEFT_OF_LEFT_EYEBROW': 70,
    'RIGHT_OF_LEFT_EYEBROW': 63,
    'LEFT_OF_RIGHT_EYEBROW': 293,
    'RIGHT_OF_RIGHT_EYEBROW': 300,
    'NOSE_TIP': 1,
    'UPPER_LIP': 13,
    'LOWER_LIP': 14,
    'MOUTH_LEFT': 61,
    'MOUTH_RIGHT': 291,
    'MOUTH_CENTER': 0,
    'NOSE_BOTTOM_RIGHT': 129,
    'NOSE_BOTTOM_LEFT': 358,
    'NOSE_BOTTOM_CENTER': 2,
    'LEFT_EYE_TOP_BOUNDARY': 159,
    'LEFT_EYE_LEFT_CORNER': 33,
    'LEFT_EYE_BOTTOM_BOUNDARY': 145,
    'LEFT_EYE_RIGHT_CORNER': 133,
    'RIGHT_EYE_TOP_BOUNDARY': 386,
    'RIGHT_EYE_RIGHT_CORNER': 263,
    'RIGHT_EYE_BOTTOM_BOUNDARY': 374,
    'RIGHT_EYE_LEFT_CORNER': 362,
    'LEFT_EYEBROW_UPPER_MIDPOINT': 66,
    'RIGHT_EYEBROW_UPPER_MIDPOINT': 296,
    'LEFT_CHEEK_CENTER': 234,
    'RIGHT_CHEEK_CENTER': 454,
    'CHIN_GNATHION': 152,
    'LEFT_EAR_TRAGION': 234,
    'RIGHT_EAR_TRAGION': 454,
    'FOREHEAD_GLABELLA': 10,
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
  // 코 끝과 눈 사이 중간점을 이용해 각도 계산
  const noseTip = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // 좌우 회전 각도 (pan)
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };
  const panAngle = Math.atan2(noseTip.z - eyeCenter.z, noseTip.x - eyeCenter.x) * 180 / Math.PI;

  // 상하 기울기 (tilt)
  const faceCenter = {
    y: (forehead.y + chin.y) / 2,
    z: (forehead.z + chin.z) / 2,
  };
  const tiltAngle = Math.atan2(noseTip.z - faceCenter.z, noseTip.y - faceCenter.y) * 180 / Math.PI;

  // 회전 (roll)
  const rollAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;

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
