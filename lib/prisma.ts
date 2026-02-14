import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Prisma 클라이언트 타입이 현재 스키마와 불일치할 수 있을 때 사용
// 네트워크가 복구되면 `npx prisma generate` 실행하여 해결
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prismaAny = prisma as any
