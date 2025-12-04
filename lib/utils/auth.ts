import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';

/**
 * 요청에서 현재 사용자 정보를 추출
 */
export function getCurrentUser(request: NextRequest): { userId: string; email: string } | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}

/**
 * 인증 필수 미들웨어
 */
export function requireAuth(request: NextRequest): { userId: string; email: string } {
  const user = getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
