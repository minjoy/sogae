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

    const timer = setTimeout(() => {
      if (window.adfit) {
        window.adfit.display("DAN-O48mpzGHyoZjEhpR");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (window.adfit) {
        window.adfit.destroy("DAN-O48mpzGHyoZjEhpR");
      }
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
