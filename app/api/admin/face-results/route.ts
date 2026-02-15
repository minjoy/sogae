import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { initFaceAnalysisTables } from '@/lib/face-analysis-db'
import { getCdnUrl, isS3Key } from '@/lib/s3'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'care1234@'

interface FaceAnalysisRow {
  id: string
  share_code: string
  score: number
  gender: string
  categories: string
  analysis: string
  image_data: string | null
  pan_angle: number | null
  tilt_angle: number | null
  roll_angle: number | null
  client_ip: string | null
  client_fingerprint: string | null
  expires_at: Date
  view_count: number
  created_at: Date
}

interface FaceCompatibilityRow {
  id: string
  share_code: string
  male_analysis_id: string
  female_analysis_id: string
  compatibility_score: number
  category_scores: string
  analysis: string
  client_ip: string | null
  client_fingerprint: string | null
  expires_at: Date
  created_at: Date
}

interface DailyStatsRow {
  date: string
  count: bigint
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, type, page = 1, limit = 20 } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    await initFaceAnalysisTables()

    const offset = (page - 1) * limit

    if (type === 'single') {
      // 한 사람 관상 분석 결과
      const [results, countResult] = await Promise.all([
        prisma.$queryRawUnsafe<FaceAnalysisRow[]>(
          `SELECT id, share_code, score, gender, categories, analysis,
                  image_data, pan_angle, tilt_angle, roll_angle,
                  client_ip, client_fingerprint, expires_at, view_count, created_at
           FROM face_analyses
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
          limit,
          offset
        ),
        prisma.$queryRawUnsafe<[{ total: bigint }]>(
          `SELECT COUNT(*) as total FROM face_analyses`
        ),
      ])

      const total = Number(countResult[0]?.total || 0)

      const analyses = results.map((row) => ({
        id: row.id,
        shareCode: row.share_code,
        score: row.score,
        gender: row.gender,
        categories: typeof row.categories === 'string' ? JSON.parse(row.categories) : row.categories,
        analysis: typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis,
        hasImage: !!row.image_data,
        imageData: row.image_data ? (isS3Key(row.image_data) ? getCdnUrl(row.image_data) : row.image_data) : null,
        panAngle: row.pan_angle,
        tiltAngle: row.tilt_angle,
        rollAngle: row.roll_angle,
        clientIp: row.client_ip,
        clientFingerprint: row.client_fingerprint,
        expiresAt: row.expires_at,
        viewCount: row.view_count,
        createdAt: row.created_at,
      }))

      return NextResponse.json({
        success: true,
        analyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } else if (type === 'compatibility') {
      // 두 사람 궁합 분석 결과
      const [results, countResult] = await Promise.all([
        prisma.$queryRawUnsafe<FaceCompatibilityRow[]>(
          `SELECT id, share_code, male_analysis_id, female_analysis_id,
                  compatibility_score, category_scores, analysis,
                  client_ip, client_fingerprint, expires_at, created_at
           FROM face_compatibilities
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
          limit,
          offset
        ),
        prisma.$queryRawUnsafe<[{ total: bigint }]>(
          `SELECT COUNT(*) as total FROM face_compatibilities`
        ),
      ])

      const total = Number(countResult[0]?.total || 0)

      const compatibilities = results.map((row) => {
        const analysisData = typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis

        return {
          id: row.id,
          shareCode: row.share_code,
          maleAnalysisId: row.male_analysis_id,
          femaleAnalysisId: row.female_analysis_id,
          compatibilityScore: row.compatibility_score,
          categoryScores: typeof row.category_scores === 'string' ? JSON.parse(row.category_scores) : row.category_scores,
          maleImage: analysisData?.maleImage || null,
          femaleImage: analysisData?.femaleImage || null,
          maleAnalysis: analysisData?.maleAnalysis || null,
          femaleAnalysis: analysisData?.femaleAnalysis || null,
          clientIp: row.client_ip,
          clientFingerprint: row.client_fingerprint,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
        }
      })

      return NextResponse.json({
        success: true,
        compatibilities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } else if (type === 'daily-stats') {
      // 일별 통계
      const [singleStats, compatibilityStats] = await Promise.all([
        prisma.$queryRawUnsafe<DailyStatsRow[]>(
          `SELECT DATE(created_at) as date, COUNT(*) as count
           FROM face_analyses
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(created_at)
           ORDER BY date DESC`
        ),
        prisma.$queryRawUnsafe<DailyStatsRow[]>(
          `SELECT DATE(created_at) as date, COUNT(*) as count
           FROM face_compatibilities
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(created_at)
           ORDER BY date DESC`
        ),
      ])

      // 고유 IP/Fingerprint 수 (최근 30일)
      const [uniqueIpStats, uniqueFingerprintStats] = await Promise.all([
        prisma.$queryRawUnsafe<[{ single_ips: bigint; compatibility_ips: bigint }]>(
          `SELECT
             (SELECT COUNT(DISTINCT client_ip) FROM face_analyses WHERE client_ip IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as single_ips,
             (SELECT COUNT(DISTINCT client_ip) FROM face_compatibilities WHERE client_ip IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as compatibility_ips`
        ),
        prisma.$queryRawUnsafe<[{ single_fps: bigint; compatibility_fps: bigint }]>(
          `SELECT
             (SELECT COUNT(DISTINCT client_fingerprint) FROM face_analyses WHERE client_fingerprint IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as single_fps,
             (SELECT COUNT(DISTINCT client_fingerprint) FROM face_compatibilities WHERE client_fingerprint IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as compatibility_fps`
        ),
      ])

      // 총 개수
      const [totalCounts] = await Promise.all([
        prisma.$queryRawUnsafe<[{ single_total: bigint; compatibility_total: bigint }]>(
          `SELECT
             (SELECT COUNT(*) FROM face_analyses) as single_total,
             (SELECT COUNT(*) FROM face_compatibilities) as compatibility_total`
        ),
      ])

      return NextResponse.json({
        success: true,
        stats: {
          single: {
            daily: singleStats.map((row) => ({
              date: row.date,
              count: Number(row.count),
            })),
            total: Number(totalCounts[0]?.single_total || 0),
            uniqueIps: Number(uniqueIpStats[0]?.single_ips || 0),
            uniqueFingerprints: Number(uniqueFingerprintStats[0]?.single_fps || 0),
          },
          compatibility: {
            daily: compatibilityStats.map((row) => ({
              date: row.date,
              count: Number(row.count),
            })),
            total: Number(totalCounts[0]?.compatibility_total || 0),
            uniqueIps: Number(uniqueIpStats[0]?.compatibility_ips || 0),
            uniqueFingerprints: Number(uniqueFingerprintStats[0]?.compatibility_fps || 0),
          },
        },
      })
    } else if (type === 'user-history') {
      // 특정 IP 또는 fingerprint의 이용 내역
      const { ip, fingerprint } = body

      let singleResults: FaceAnalysisRow[] = []
      let compatibilityResults: FaceCompatibilityRow[] = []

      if (ip) {
        singleResults = await prisma.$queryRawUnsafe<FaceAnalysisRow[]>(
          `SELECT id, share_code, score, gender, categories, analysis,
                  image_data, pan_angle, tilt_angle, roll_angle,
                  client_ip, client_fingerprint, expires_at, view_count, created_at
           FROM face_analyses
           WHERE client_ip = ?
           ORDER BY created_at DESC
           LIMIT 50`,
          ip
        )

        compatibilityResults = await prisma.$queryRawUnsafe<FaceCompatibilityRow[]>(
          `SELECT id, share_code, male_analysis_id, female_analysis_id,
                  compatibility_score, category_scores, analysis,
                  client_ip, client_fingerprint, expires_at, created_at
           FROM face_compatibilities
           WHERE client_ip = ?
           ORDER BY created_at DESC
           LIMIT 50`,
          ip
        )
      } else if (fingerprint) {
        singleResults = await prisma.$queryRawUnsafe<FaceAnalysisRow[]>(
          `SELECT id, share_code, score, gender, categories, analysis,
                  image_data, pan_angle, tilt_angle, roll_angle,
                  client_ip, client_fingerprint, expires_at, view_count, created_at
           FROM face_analyses
           WHERE client_fingerprint = ?
           ORDER BY created_at DESC
           LIMIT 50`,
          fingerprint
        )

        compatibilityResults = await prisma.$queryRawUnsafe<FaceCompatibilityRow[]>(
          `SELECT id, share_code, male_analysis_id, female_analysis_id,
                  compatibility_score, category_scores, analysis,
                  client_ip, client_fingerprint, expires_at, created_at
           FROM face_compatibilities
           WHERE client_fingerprint = ?
           ORDER BY created_at DESC
           LIMIT 50`,
          fingerprint
        )
      }

      return NextResponse.json({
        success: true,
        history: {
          single: singleResults.map((row) => ({
            id: row.id,
            shareCode: row.share_code,
            score: row.score,
            gender: row.gender,
            createdAt: row.created_at,
          })),
          compatibility: compatibilityResults.map((row) => ({
            id: row.id,
            shareCode: row.share_code,
            compatibilityScore: row.compatibility_score,
            createdAt: row.created_at,
          })),
        },
      })
    }

    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  } catch (error) {
    console.error('Admin face results error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
