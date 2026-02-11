'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={true} // 윈도우 포커스 시 세션 갱신
    >
      {children}
    </SessionProvider>
  );
}
