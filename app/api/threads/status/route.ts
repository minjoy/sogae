import { NextRequest, NextResponse } from 'next/server';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

export async function GET(request: NextRequest) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get('containerId');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'THREADS_ACCESS_TOKEN 환경변수가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  if (!containerId) {
    return NextResponse.json({ error: 'containerId가 필요합니다' }, { status: 400 });
  }

  const res = await fetch(
    `${THREADS_API_BASE}/${containerId}?fields=id,status,error_message&access_token=${accessToken}`
  );
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? '상태 조회 실패' },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
