import { NextRequest, NextResponse } from 'next/server';
import { runMatchingJobNow } from '@/lib/scheduler';

/**
 * 테스트용 매칭 작업 즉시 실행 API
 * 실제 운영에서는 삭제하거나 보안 키로 보호해야 함
 */
export async function POST(request: NextRequest) {
  try {
    await runMatchingJobNow();
    return NextResponse.json({ message: '매칭 작업이 완료되었습니다.' });
  } catch (error) {
    console.error('Run matching error:', error);
    return NextResponse.json({ error: '매칭 작업에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await runMatchingJobNow();
    return NextResponse.json({ message: '매칭 작업이 완료되었습니다.' });
  } catch (error) {
    console.error('Run matching error:', error);
    return NextResponse.json({ error: '매칭 작업에 실패했습니다.' }, { status: 500 });
  }
}
