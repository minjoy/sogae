"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adfit?: {
      display: (unit: string) => void;
      destroy: (unit: string) => void;
    };
  }
}

const DEFAULT_UNIT = "DAN-O48mpzGHyoZjEhpR";

export default function KakaoAd({ unitId = DEFAULT_UNIT }: { unitId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    let attempts = 0;
    const maxAttempts = 30;
    let timerId: ReturnType<typeof setTimeout>;

    const tryDisplay = () => {
      if (window.adfit) {
        initialized.current = true;
        window.adfit.display(unitId);
      } else if (attempts < maxAttempts) {
        attempts++;
        timerId = setTimeout(tryDisplay, 500);
      }
    };

    // 약간의 딜레이 후 시도 (DOM이 완전히 마운트된 후)
    timerId = setTimeout(tryDisplay, 100);

    return () => {
      clearTimeout(timerId);
    };
  }, [unitId]);

  return (
    <div ref={containerRef} className="flex justify-center py-3">
      <ins
        className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit={unitId}
        data-ad-width="320"
        data-ad-height="100"
      />
    </div>
  );
}
