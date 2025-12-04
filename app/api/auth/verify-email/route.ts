import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 토큰 조회
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 만료 확인
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url));
    }

    // 이미 사용된 토큰
    if (verificationToken.used) {
      return NextResponse.redirect(new URL('/login?error=already_used', request.url));
    }

    // 이메일 인증 완료
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true },
    });

    // 토큰 사용 처리
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    });

    // 대시보드로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
  }
}
