import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // NextAuth 관련 쿠키 삭제
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.csrf-token');
    cookieStore.delete('__Secure-next-auth.callback-url');

    // 카카오 로그아웃 URL 반환
    const kakaoLogoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.KAKAO_CLIENT_ID}&logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/login')}`;

    return NextResponse.json({
      success: true,
      kakaoLogoutUrl,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
