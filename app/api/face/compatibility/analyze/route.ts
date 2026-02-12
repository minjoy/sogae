import { NextRequest, NextResponse } from 'next/server';
import { analyzeFace, convertVisionLandmarks } from '@/lib/face-analysis';
import { analyzeCompatibility } from '@/lib/compatibility-analysis';
import { prisma } from '@/lib/prisma';

// MediaPipe 랜드마크를 Google Vision 형식으로 변환
function convertMediaPipeLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>,
  imageWidth: number,
  imageHeight: number
) {
  const mappings: { [key: string]: number } = {
    'LEFT_EYE': 468,
    'RIGHT_EYE': 473,
    'LEFT_OF_LEFT_EYEBROW': 70,
    'RIGHT_OF_LEFT_EYEBROW': 63,
    'LEFT_OF_RIGHT_EYEBROW': 293,
    'RIGHT_OF_RIGHT_EYEBROW': 300,
    'NOSE_TIP': 1,
    'NOSE_BRIDGE': 6,
    'UPPER_LIP': 0,
    'LOWER_LIP': 17,
    'MOUTH_LEFT': 61,
    'MOUTH_RIGHT': 291,
    'MOUTH_CENTER': 13,
    'NOSE_BOTTOM_RIGHT': 358,
    'NOSE_BOTTOM_LEFT': 129,
    'NOSE_BOTTOM_CENTER': 2,
    'LEFT_EYE_TOP_BOUNDARY': 159,
    'LEFT_EYE_LEFT_CORNER': 33,
    'LEFT_EYE_BOTTOM_BOUNDARY': 145,
    'LEFT_EYE_RIGHT_CORNER': 133,
    'RIGHT_EYE_TOP_BOUNDARY': 386,
    'RIGHT_EYE_RIGHT_CORNER': 263,
    'RIGHT_EYE_BOTTOM_BOUNDARY': 374,
    'RIGHT_EYE_LEFT_CORNER': 362,
    'LEFT_EYEBROW_UPPER_MIDPOINT': 105,
    'RIGHT_EYEBROW_UPPER_MIDPOINT': 334,
    'LEFT_CHEEK_CENTER': 234,
    'RIGHT_CHEEK_CENTER': 454,
    'CHIN_GNATHION': 152,
    'LEFT_EAR_TRAGION': 127,
    'RIGHT_EAR_TRAGION': 356,
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

// 얼굴 각도 계산
function calculateFaceAngles(landmarks: Array<{ x: number; y: number; z: number }>) {
  const noseTip = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  const eyeDistance = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) +
    Math.pow(rightEye.y - leftEye.y, 2)
  ) || 0.1;

  const rollAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;

  const isMirrored = leftEye.x > rightEye.x;
  const noseOffsetX = isMirrored
    ? (eyeCenterX - noseTip.x)
    : (noseTip.x - eyeCenterX);
  const panRatio = Math.max(-1, Math.min(1, noseOffsetX / (eyeDistance * 0.5)));
  const panAngle = Math.asin(panRatio) * 180 / Math.PI;

  const faceHeight = Math.abs(chin.y - eyeCenterY) || 0.1;
  const expectedNoseY = eyeCenterY + faceHeight * 0.35;
  const noseOffsetY = noseTip.y - expectedNoseY;
  const tiltRatio = Math.max(-1, Math.min(1, noseOffsetY / (faceHeight * 0.2)));
  const tiltAngle = Math.asin(tiltRatio) * 180 / Math.PI;

  return { panAngle, tiltAngle, rollAngle };
}

// 공유 코드 생성
function generateShareCode(): string {
  const chars = '0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { male, female } = body;

    if (!male?.landmarks || !female?.landmarks) {
      return NextResponse.json(
        { error: '얼굴 랜드마크 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 남자 관상 분석
    const maleVisionLandmarks = convertMediaPipeLandmarks(
      male.landmarks,
      male.imageWidth,
      male.imageHeight
    );
    const maleFaceLandmarks = convertVisionLandmarks(maleVisionLandmarks);
    const maleAngles = calculateFaceAngles(male.landmarks);
    const maleAnalysis = analyzeFace(
      maleFaceLandmarks,
      maleAngles.panAngle,
      maleAngles.tiltAngle,
      maleAngles.rollAngle,
      'male'
    );

    // 여자 관상 분석
    const femaleVisionLandmarks = convertMediaPipeLandmarks(
      female.landmarks,
      female.imageWidth,
      female.imageHeight
    );
    const femaleFaceLandmarks = convertVisionLandmarks(femaleVisionLandmarks);
    const femaleAngles = calculateFaceAngles(female.landmarks);
    const femaleAnalysis = analyzeFace(
      femaleFaceLandmarks,
      femaleAngles.panAngle,
      femaleAngles.tiltAngle,
      femaleAngles.rollAngle,
      'female'
    );

    // 궁합 분석
    const compatibility = analyzeCompatibility(maleAnalysis, femaleAnalysis);

    // 공유 코드 생성 및 DB 저장
    let shareCode = generateShareCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await prisma.faceCompatibility.findUnique({
        where: { shareCode },
      });
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    // 7일 후 만료
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // DB에 저장
    await prisma.faceCompatibility.create({
      data: {
        shareCode,
        maleAnalysisId: '', // 개별 분석은 저장하지 않음
        femaleAnalysisId: '',
        compatibilityScore: compatibility.totalScore,
        categoryScores: compatibility.categoryScores,
        analysis: {
          ...compatibility,
          maleAnalysis: {
            score: maleAnalysis.score,
            categories: maleAnalysis.categories,
            traits: maleAnalysis.traits,
            gender: maleAnalysis.gender,
          },
          femaleAnalysis: {
            score: femaleAnalysis.score,
            categories: femaleAnalysis.categories,
            traits: femaleAnalysis.traits,
            gender: femaleAnalysis.gender,
          },
          maleImage: male.imageData,
          femaleImage: female.imageData,
        },
        isPaid: false,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      shareCode,
      shareUrl: `/face-analysis/compatibility/result/${shareCode}`,
      compatibility,
    });
  } catch (error) {
    console.error('Compatibility analysis error:', error);
    return NextResponse.json(
      { error: '궁합 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
