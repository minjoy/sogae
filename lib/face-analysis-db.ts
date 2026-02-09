import { prisma } from './prisma'

// 타입 정의
export interface FaceAnalysisData {
  id: string
  shareCode: string
  score: number
  gender: string
  categories: {
    r1: number // 권력/운명
    r2: number // 정신/사랑
    r3: number // 일/재물/사교
    r4: number // 성실/책임
  }
  analysis: Record<string, unknown>
  landmarks?: number[][]
  imageWidth?: number
  imageHeight?: number
  imageData?: string
  panAngle?: number
  tiltAngle?: number
  rollAngle?: number
  expiresAt: Date
  viewCount: number
  createdAt: Date
}

export interface FaceCompatibilityData {
  id: string
  shareCode: string
  maleAnalysisId: string
  femaleAnalysisId: string
  compatibilityScore: number
  categoryScores: Record<string, number>
  analysis: Record<string, unknown>
  isPaid: boolean
  paymentId?: string
  expiresAt: Date
  createdAt: Date
}

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 공유 코드 생성 (8자리)
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 테이블 초기화 (존재하지 않으면 생성)
export async function initFaceAnalysisTables(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS face_analyses (
        id VARCHAR(36) PRIMARY KEY,
        share_code VARCHAR(255) UNIQUE NOT NULL,
        score INT NOT NULL,
        gender VARCHAR(50) NOT NULL,
        categories JSON NOT NULL,
        analysis JSON NOT NULL,
        landmarks MEDIUMTEXT,
        image_width INT,
        image_height INT,
        image_data MEDIUMTEXT,
        pan_angle FLOAT,
        tilt_angle FLOAT,
        roll_angle FLOAT,
        expires_at DATETIME NOT NULL,
        view_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_share_code (share_code),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS face_compatibilities (
        id VARCHAR(36) PRIMARY KEY,
        share_code VARCHAR(255) UNIQUE NOT NULL,
        male_analysis_id VARCHAR(36) NOT NULL,
        female_analysis_id VARCHAR(36) NOT NULL,
        compatibility_score INT NOT NULL,
        category_scores JSON NOT NULL,
        analysis JSON NOT NULL,
        is_paid BOOLEAN DEFAULT FALSE,
        payment_id VARCHAR(255),
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_share_code (share_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  } catch (error) {
    console.error('Error initializing face analysis tables:', error)
    throw error
  }
}

// 관상 분석 결과 저장
export async function saveFaceAnalysis(data: {
  score: number
  gender: string
  categories: { r1: number; r2: number; r3: number; r4: number }
  analysis: Record<string, unknown>
  landmarks?: number[][]
  imageWidth?: number
  imageHeight?: number
  imageData?: string
  panAngle?: number
  tiltAngle?: number
  rollAngle?: number
}): Promise<{ id: string; shareCode: string }> {
  await initFaceAnalysisTables()

  const id = generateUUID()
  const shareCode = generateShareCode()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1주일 후

  await prisma.$executeRawUnsafe(
    `INSERT INTO face_analyses (
      id, share_code, score, gender, categories, analysis,
      landmarks, image_width, image_height, image_data,
      pan_angle, tilt_angle, roll_angle, expires_at, view_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
    id,
    shareCode,
    data.score,
    data.gender,
    JSON.stringify(data.categories),
    JSON.stringify(data.analysis),
    data.landmarks ? JSON.stringify(data.landmarks) : null,
    data.imageWidth ?? null,
    data.imageHeight ?? null,
    data.imageData ?? null,
    data.panAngle ?? null,
    data.tiltAngle ?? null,
    data.rollAngle ?? null,
    expiresAt
  )

  return { id, shareCode }
}

// 공유 코드로 관상 분석 결과 조회
export async function getFaceAnalysisByShareCode(
  shareCode: string
): Promise<FaceAnalysisData | null> {
  await initFaceAnalysisTables()

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      share_code: string
      score: number
      gender: string
      categories: string
      analysis: string
      landmarks: string | null
      image_width: number | null
      image_height: number | null
      image_data: string | null
      pan_angle: number | null
      tilt_angle: number | null
      roll_angle: number | null
      expires_at: Date
      view_count: number
      created_at: Date
    }>
  >(
    `SELECT * FROM face_analyses WHERE share_code = ? LIMIT 1`,
    shareCode
  )

  if (results.length === 0) {
    return null
  }

  const row = results[0]

  // 조회수 증가
  await prisma.$executeRawUnsafe(
    `UPDATE face_analyses SET view_count = view_count + 1 WHERE share_code = ?`,
    shareCode
  )

  // 이미지 만료 확인
  const isExpired = new Date(row.expires_at) < new Date()

  return {
    id: row.id,
    shareCode: row.share_code,
    score: row.score,
    gender: row.gender,
    categories: typeof row.categories === 'string'
      ? JSON.parse(row.categories)
      : row.categories,
    analysis: typeof row.analysis === 'string'
      ? JSON.parse(row.analysis)
      : row.analysis,
    landmarks: row.landmarks
      ? (typeof row.landmarks === 'string' ? JSON.parse(row.landmarks) : row.landmarks)
      : undefined,
    imageWidth: row.image_width ?? undefined,
    imageHeight: row.image_height ?? undefined,
    imageData: isExpired ? undefined : (row.image_data ?? undefined),
    panAngle: row.pan_angle ?? undefined,
    tiltAngle: row.tilt_angle ?? undefined,
    rollAngle: row.roll_angle ?? undefined,
    expiresAt: new Date(row.expires_at),
    viewCount: row.view_count + 1,
    createdAt: new Date(row.created_at),
  }
}

// 만료된 이미지 삭제 (정리 작업)
export async function cleanupExpiredImages(): Promise<number> {
  await initFaceAnalysisTables()

  const result = await prisma.$executeRawUnsafe(`
    UPDATE face_analyses
    SET image_data = NULL, landmarks = NULL
    WHERE expires_at < NOW() AND image_data IS NOT NULL
  `)

  return typeof result === 'number' ? result : 0
}

// 얼굴 궁합 분석 저장
export async function saveFaceCompatibility(data: {
  maleAnalysisId: string
  femaleAnalysisId: string
  compatibilityScore: number
  categoryScores: Record<string, number>
  analysis: Record<string, unknown>
}): Promise<{ id: string; shareCode: string }> {
  await initFaceAnalysisTables()

  const id = generateUUID()
  const shareCode = generateShareCode()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일

  await prisma.$executeRawUnsafe(
    `INSERT INTO face_compatibilities (
      id, share_code, male_analysis_id, female_analysis_id,
      compatibility_score, category_scores, analysis,
      is_paid, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?, NOW())`,
    id,
    shareCode,
    data.maleAnalysisId,
    data.femaleAnalysisId,
    data.compatibilityScore,
    JSON.stringify(data.categoryScores),
    JSON.stringify(data.analysis),
    expiresAt
  )

  return { id, shareCode }
}

// 궁합 분석 결과 조회
export async function getFaceCompatibilityByShareCode(
  shareCode: string
): Promise<FaceCompatibilityData | null> {
  await initFaceAnalysisTables()

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      share_code: string
      male_analysis_id: string
      female_analysis_id: string
      compatibility_score: number
      category_scores: string
      analysis: string
      is_paid: boolean
      payment_id: string | null
      expires_at: Date
      created_at: Date
    }>
  >(
    `SELECT * FROM face_compatibilities WHERE share_code = ? LIMIT 1`,
    shareCode
  )

  if (results.length === 0) {
    return null
  }

  const row = results[0]

  return {
    id: row.id,
    shareCode: row.share_code,
    maleAnalysisId: row.male_analysis_id,
    femaleAnalysisId: row.female_analysis_id,
    compatibilityScore: row.compatibility_score,
    categoryScores: typeof row.category_scores === 'string'
      ? JSON.parse(row.category_scores)
      : row.category_scores,
    analysis: typeof row.analysis === 'string'
      ? JSON.parse(row.analysis)
      : row.analysis,
    isPaid: Boolean(row.is_paid),
    paymentId: row.payment_id ?? undefined,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  }
}

// 궁합 결제 완료 처리
export async function markCompatibilityAsPaid(
  shareCode: string,
  paymentId: string
): Promise<boolean> {
  await initFaceAnalysisTables()

  const result = await prisma.$executeRawUnsafe(
    `UPDATE face_compatibilities
     SET is_paid = TRUE, payment_id = ?
     WHERE share_code = ?`,
    paymentId,
    shareCode
  )

  return typeof result === 'number' && result > 0
}
