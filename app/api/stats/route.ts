import { NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';

const BASE_COUNT = 12847;

export async function GET() {
  try {
    // 테스트 결과 수를 카운트
    const testCount = await prisma.testResult.count();

    // 기본 숫자 + 실제 테스트 수
    const totalParticipants = BASE_COUNT + testCount;

    return NextResponse.json({
      success: true,
      count: totalParticipants,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      success: true,
      count: BASE_COUNT, // 에러 시 기본값
    });
  }
}
