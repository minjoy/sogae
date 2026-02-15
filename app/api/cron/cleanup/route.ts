import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredImages } from '@/lib/face-analysis-db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 크론잡 시크릿 검증
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'sogae-cron-2024'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleanedCount = await cleanupExpiredImages()

    return NextResponse.json({
      success: true,
      cleaned: cleanedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
