/**
 * Threads API 글 작성 테스트 스크립트
 *
 * 실행 방법:
 *   npx tsx scripts/test-threads-post.ts
 *
 * 사전 준비:
 *   .env 파일에 THREADS_ACCESS_TOKEN, THREADS_USER_ID 설정 필요
 *
 * 토큰 발급:
 *   1. https://developers.facebook.com/apps/ 에서 앱 생성
 *   2. Threads API 제품 추가
 *   3. 단기 토큰 발급 후 장기 토큰으로 교환
 *   4. 필요 권한: threads_basic, threads_content_publish
 */

import 'dotenv/config';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';
const ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const USER_ID = process.env.THREADS_USER_ID;

if (!ACCESS_TOKEN || !USER_ID) {
  console.error('❌ THREADS_ACCESS_TOKEN 또는 THREADS_USER_ID가 설정되지 않았습니다.');
  console.error('   .env 파일을 확인해주세요.');
  process.exit(1);
}

async function createContainer(text: string) {
  console.log('📦 미디어 컨테이너 생성 중...');
  const res = await fetch(`${THREADS_API_BASE}/${USER_ID}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      media_type: 'TEXT',
      text,
      access_token: ACCESS_TOKEN!,
    }),
  });

  const data = await res.json();
  console.log('Container 응답:', JSON.stringify(data, null, 2));

  if (!res.ok) throw new Error(data.error?.message ?? 'Container 생성 실패');
  return data.id as string;
}

async function publishContainer(containerId: string) {
  console.log(`\n🚀 게시 중... (containerId: ${containerId})`);
  const res = await fetch(`${THREADS_API_BASE}/${USER_ID}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: ACCESS_TOKEN!,
    }),
  });

  const data = await res.json();
  console.log('Publish 응답:', JSON.stringify(data, null, 2));

  if (!res.ok) throw new Error(data.error?.message ?? '게시 실패');
  return data.id as string;
}

async function main() {
  const testText = `[API 테스트] ${new Date().toLocaleString('ko-KR')} - Threads API 글 작성 테스트입니다. #테스트`;

  console.log('=== Threads API 글 작성 테스트 ===');
  console.log(`USER_ID: ${USER_ID}`);
  console.log(`글 내용: ${testText}\n`);

  try {
    const containerId = await createContainer(testText);
    const postId = await publishContainer(containerId);

    console.log('\n✅ 게시 성공!');
    console.log(`   Post ID: ${postId}`);
    console.log(`   URL: https://www.threads.net/post/${postId}`);
  } catch (err) {
    console.error('\n❌ 오류 발생:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
