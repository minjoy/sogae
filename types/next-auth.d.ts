import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      kakaoId: string;
      nickname: string;
      profileImage: string | null;
      region: string;
      level: number;
      isBanned: boolean;
      bannedUntil: Date | null;
      isOnboarded: boolean;
      gender: string | null;
      birthYear: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    kakaoId: string;
    nickname: string;
    profileImage: string | null;
    region: string;
    level: number;
    isBanned: boolean;
    bannedUntil: Date | null;
    isOnboarded: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    kakaoId?: string;
  }
}
