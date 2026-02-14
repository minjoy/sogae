// 간단한 브라우저 fingerprint 생성
// 완벽한 고유성을 보장하지 않지만, 대략적인 사용자 구분에 유용

export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return ''
  }

  const components: string[] = []

  // User Agent
  components.push(navigator.userAgent)

  // 언어
  components.push(navigator.language)

  // 화면 정보
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // 타임존
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // 플랫폼
  components.push(navigator.platform)

  // 하드웨어 동시성
  components.push(String(navigator.hardwareConcurrency || 0))

  // 캔버스 fingerprint
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 100, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('Hello, World!', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Hello, World!', 4, 17)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch {
    // Canvas fingerprint 실패 시 무시
  }

  // WebGL 정보
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '')
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      }
    }
  } catch {
    // WebGL fingerprint 실패 시 무시
  }

  // 해시 생성
  const data = components.join('|')
  const hash = await hashString(data)

  return hash
}

// 간단한 해시 함수 (SHA-256)
async function hashString(str: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // fallback: 간단한 해시
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(16, '0')
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

// 로컬 스토리지에 저장된 fingerprint 가져오기 또는 새로 생성
export async function getOrCreateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return ''
  }

  const STORAGE_KEY = 'client_fingerprint'

  // 저장된 fingerprint 확인
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return stored
  }

  // 새로 생성
  const fingerprint = await generateFingerprint()
  if (fingerprint) {
    localStorage.setItem(STORAGE_KEY, fingerprint)
  }

  return fingerprint
}
