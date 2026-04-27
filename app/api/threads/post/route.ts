import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

const postSchema = z.object({
  text: z.string().min(1).max(500),
  mediaType: z.enum(['TEXT', 'IMAGE', 'VIDEO']).default('TEXT'),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

async function createMediaContainer(
  userId: string,
  accessToken: string,
  params: {
    text: string;
    mediaType: string;
    imageUrl?: string;
    videoUrl?: string;
  }
) {
  const body: Record<string, string> = {
    media_type: params.mediaType,
    text: params.text,
    access_token: accessToken,
  };

  if (params.mediaType === 'IMAGE' && params.imageUrl) {
    body.image_url = params.imageUrl;
  }
  if (params.mediaType === 'VIDEO' && params.videoUrl) {
    body.video_url = params.videoUrl;
  }

  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Container 생성 실패');
  return data as { id: string };
}

async function publishContainer(
  userId: string,
  accessToken: string,
  containerId: string
) {
  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? '게시 실패');
  return data as { id: string };
}

export async function POST(request: NextRequest) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  if (!accessToken || !userId) {
    return NextResponse.json(
      { error: 'THREADS_ACCESS_TOKEN 또는 THREADS_USER_ID 환경변수가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, mediaType, imageUrl, videoUrl } = postSchema.parse(body);

    // 1단계: 미디어 컨테이너 생성
    const container = await createMediaContainer(userId, accessToken, {
      text,
      mediaType,
      imageUrl,
      videoUrl,
    });

    // VIDEO의 경우 처리 완료까지 대기가 필요할 수 있음 (여기서는 TEXT/IMAGE만 즉시 게시)
    // 2단계: 게시
    const published = await publishContainer(userId, accessToken, container.id);

    return NextResponse.json({
      success: true,
      containerId: container.id,
      postId: published.id,
      postUrl: `https://www.threads.net/post/${published.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Threads posting error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
