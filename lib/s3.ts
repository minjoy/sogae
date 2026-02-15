import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET || ''
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || ''

/**
 * base64 데이터 URL을 S3에 업로드하고 S3 키를 반환
 */
export async function uploadImageToS3(
  base64DataUrl: string,
  key: string
): Promise<string> {
  // data:image/jpeg;base64,/9j/4AAQ... 형태에서 실제 데이터 추출
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data URL format')
  }

  const contentType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=259200', // 3일
    })
  )

  return key
}

/**
 * S3 키로부터 CDN URL 생성
 */
export function getCdnUrl(s3Key: string): string {
  if (!s3Key) return ''
  // 이미 URL인 경우 (하위 호환)
  if (s3Key.startsWith('http') || s3Key.startsWith('data:')) return s3Key
  return `${CDN_URL}/${s3Key}`
}

/**
 * S3 키가 S3에 저장된 이미지인지 확인
 */
export function isS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('face-analyses/') || value.startsWith('face-compatibilities/')
}

/**
 * S3에서 단일 객체 삭제
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!key || !isS3Key(key)) return

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

/**
 * S3에서 여러 객체 일괄 삭제
 */
export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  const s3Keys = keys.filter(isS3Key)
  if (s3Keys.length === 0) return

  // S3 DeleteObjects는 최대 1000개까지
  const chunks: string[][] = []
  for (let i = 0; i < s3Keys.length; i += 1000) {
    chunks.push(s3Keys.slice(i, i + 1000))
  }

  for (const chunk of chunks) {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    )
  }
}

/**
 * 관상 분석 이미지용 S3 키 생성
 */
export function getFaceAnalysisS3Key(shareCode: string): string {
  return `face-analyses/${shareCode}.jpg`
}
