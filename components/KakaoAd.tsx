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

export default function KakaoAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let attempts = 0;
    const maxAttempts = 20;
    let timerId: ReturnType<typeof setTimeout>;

    const tryDisplay = () => {
      if (window.adfit) {
        window.adfit.display("DAN-O48mpzGHyoZjEhpR");
      } else if (attempts < maxAttempts) {
        attempts++;
        timerId = setTimeout(tryDisplay, 500);
      }
    };

    timerId = setTimeout(tryDisplay, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center py-3">
      <ins
        className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit="DAN-O48mpzGHyoZjEhpR"
        data-ad-width="320"
        data-ad-height="100"
      />
    </div>
  );
}
