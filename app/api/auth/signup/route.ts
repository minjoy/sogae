import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다'),
  gender: z.enum(['M', 'F'], { errorMap: () => ({ message: '성별을 선택해주세요' }) }),
  birthyear: z.number().min(1900, '올바른 출생연도를 입력해주세요'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(validatedData.password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        nickname: validatedData.nickname,
        gender: validatedData.gender,
        birthyear: validatedData.birthyear,
      },
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
