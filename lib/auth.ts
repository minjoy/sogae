import { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import { prisma } from '@/lib/prisma';

// 현재 연도 기준 성인 판별 (20세 이상)
function isAdult(birthYear: string | undefined): boolean {
  if (!birthYear) return false;
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(birthYear);
  return age >= 20;
}

// 임시 닉네임 생성
function generateTempNickname(kakaoId: string): string {
  const suffix = kakaoId.slice(-8);
  return `user_${suffix}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'account_email gender birthyear',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  pages: {
    signIn: '/login',
    error: '/auth-error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'kakao') {
        return false;
      }

      const kakaoProfile = profile as {
        id: number;
        kakao_account?: {
          email?: string;
          gender?: string;
          birthyear?: string;
        };
      };

      const kakaoId = String(kakaoProfile.id);
      const kakaoAccount = kakaoProfile.kakao_account;

      try {
        // 1. 영구정지 확인
        const bannedKakao = await prisma.bannedKakao.findUnique({
          where: { kakaoId },
        });

        if (bannedKakao) {
          return `/auth-error?error=permanently_banned&reason=${encodeURIComponent(bannedKakao.reason || '영구 정지된 계정입니다.')}`;
        }

        // 2. 기존 사용자 확인
        const existingUser = await prisma.user.findUnique({
          where: { kakaoId },
        });

        if (existingUser) {
          // 정지 여부 확인
          if (existingUser.isBanned) {
            if (existingUser.bannedUntil) {
              // 기간 정지
              if (new Date() < existingUser.bannedUntil) {
                const untilDate = existingUser.bannedUntil.toISOString().split('T')[0];
                return `/auth-error?error=temporarily_banned&until=${untilDate}&reason=${encodeURIComponent(existingUser.banReason || '')}`;
              } else {
                // 정지 기간 만료 - 정지 해제
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    isBanned: false,
                    bannedAt: null,
                    bannedUntil: null,
                    banReason: null,
                  },
                });
              }
            } else {
              // 영구 정지
              return `/auth-error?error=permanently_banned&reason=${encodeURIComponent(existingUser.banReason || '영구 정지된 계정입니다.')}`;
            }
          }

          // 로그인 시 정보 업데이트
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: kakaoAccount?.email || existingUser.email,
              profileImage: user.image || existingUser.profileImage,
            },
          });

          return true;
        }

        // 3. 신규 사용자 - 성인 인증
        const birthYear = kakaoAccount?.birthyear;
        if (!isAdult(birthYear)) {
          return `/auth-error?error=age_restriction`;
        }

        // 4. 신규 사용자 생성
        const tempNickname = generateTempNickname(kakaoId);

        // 닉네임 중복 체크 및 고유 닉네임 생성
        let uniqueNickname = tempNickname;
        let suffix = 1;
        while (await prisma.user.findUnique({ where: { nickname: uniqueNickname } })) {
          uniqueNickname = `${tempNickname}_${suffix}`;
          suffix++;
        }

        await prisma.user.create({
          data: {
            kakaoId,
            email: kakaoAccount?.email,
            nickname: uniqueNickname,
            profileImage: user.image,
            gender: kakaoAccount?.gender,
            birthYear: birthYear,
            region: '서울',
            isOnboarded: false,
          },
        });

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return `/auth-error?error=server_error`;
      }
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === 'kakao' && profile) {
        const kakaoProfile = profile as { id: number };
        token.kakaoId = String(kakaoProfile.id);
      }
      return token;
    },

    async session({ session, token }) {
      if (token.kakaoId) {
        try {
          const user = await prisma.user.findUnique({
            where: { kakaoId: token.kakaoId as string },
            select: {
              id: true,
              kakaoId: true,
              nickname: true,
              profileImage: true,
              region: true,
              level: true,
              isBanned: true,
              bannedUntil: true,
              isOnboarded: true,
              gender: true,
              birthYear: true,
            },
          });

          if (user) {
            session.user = {
              ...session.user,
              id: user.id,
              kakaoId: user.kakaoId,
              nickname: user.nickname,
              profileImage: user.profileImage,
              region: user.region,
              level: user.level,
              isBanned: user.isBanned,
              bannedUntil: user.bannedUntil,
              isOnboarded: user.isOnboarded,
              gender: user.gender,
              birthYear: user.birthYear,
            };
          }
        } catch (error) {
          console.error('Session callback error:', error);
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // 온보딩 완료 여부에 따라 리다이렉트
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },

  events: {
    async signOut() {
      // 로그아웃 이벤트 처리
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
