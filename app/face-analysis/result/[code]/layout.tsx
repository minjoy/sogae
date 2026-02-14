import { Metadata } from 'next'
import { getFaceAnalysisByShareCode } from '@/lib/face-analysis-db'

// 결정적 한줄평 생성 (page.tsx와 동일한 로직)
function generateDeterministicOneLiner(
  analysis: Record<string, unknown>
): string {
  const getLabel = (key: string): string => {
    const val = analysis[key];
    if (typeof val === 'object' && val !== null && 'label' in val) {
      return (val as { label: string }).label;
    }
    return '';
  };

  const features: string[] = [];

  // 눈꼬리
  const eyeLabel = getLabel('eyeAngle');
  if (eyeLabel.includes('많이 올라감')) {
    features.push("눈의 기상이 하늘을 찌르는");
  } else if (eyeLabel.includes('올라감')) {
    features.push("날카로운 눈매의");
  } else if (eyeLabel.includes('일자')) {
    features.push("의지가 담긴 눈빛의");
  } else if (eyeLabel.includes('내려감')) {
    features.push("부드러운 눈매의");
  }

  // 눈썹-눈 거리
  const eyebrowLabel = getLabel('eyebrowDistance');
  if (eyebrowLabel.includes('매우 넓음')) {
    features.push("재물이 넘치는 눈두덩이");
  } else if (eyebrowLabel.includes('넓은 편')) {
    features.push("복 많은 눈두덩이");
  }

  // 코
  const noseLabel = getLabel('noseLength');
  if (noseLabel.includes('긴')) {
    features.push("여럿 애간장 녹이는 코");
  } else if (noseLabel.includes('이상적')) {
    features.push("황금비율 코");
  }

  // 입
  const mouthLabel = getLabel('mouthWidth');
  if (mouthLabel.includes('매우 큰')) {
    features.push("모두를 현혹시키는 입");
  } else if (mouthLabel.includes('큰')) {
    features.push("복 부르는 입");
  } else if (mouthLabel.includes('이상적')) {
    features.push("예쁜 입매");
  }

  // 인중
  const philtrumLabel = getLabel('philtrumLength');
  if (philtrumLabel.includes('매우 긴') || philtrumLabel.includes('긴 편')) {
    features.push("강이 흐르는 인중");
  } else if (philtrumLabel.includes('이상적')) {
    features.push("반듯한 인중");
  }

  // 하관
  const jawLabel = getLabel('jawWidth');
  if (jawLabel.includes('매우 튼튼')) {
    features.push("최고의 복덩이 하관");
  } else if (jawLabel.includes('튼튼')) {
    features.push("든든한 하관");
  } else if (jawLabel.includes('이상적')) {
    features.push("균형 잡힌 하관");
  }

  const mainFeature = features.length > 0 ? features[0] : "매력적인 얼굴";
  const subFeature = features.length > 1 ? features[1] : "";

  if (subFeature) {
    return `${mainFeature}, ${subFeature}의 소유자`;
  }
  return `${mainFeature}의 소유자`;
}

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params

  try {
    const result = await getFaceAnalysisByShareCode(code)

    if (!result) {
      return {
        title: '관상 분석 결과',
        description: '관상 분석 결과를 확인하세요',
      }
    }

    const analysis = result.analysis as Record<string, unknown>
    const oneLiner = generateDeterministicOneLiner(analysis)

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr'

    return {
      title: '친구의 관상을 구경하세요',
      description: oneLiner,
      openGraph: {
        title: '친구의 관상을 구경하세요',
        description: oneLiner,
        type: 'website',
        url: `${baseUrl}/face-analysis/result/${code}`,
        images: [
          {
            url: `${baseUrl}/og-image-optimized.png?v=2`,
            width: 1200,
            height: 630,
            alt: '관상 분석 결과',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '친구의 관상을 구경하세요',
        description: oneLiner,
        images: [`${baseUrl}/og-image-optimized.png?v=2`],
      },
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: '관상 분석 결과',
      description: '관상 분석 결과를 확인하세요',
    }
  }
}

export default function FaceResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
