import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

// 인증 미들웨어
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Request 객체에 사용자 정보 추가
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.userId = session.user.id;

    return handler(authenticatedRequest);
  };
}

// 세션에서 사용자 ID 추출
export async function getUserIdFromRequest(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}
