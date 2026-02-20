"use client";

import { useEffect, useRef } from "react";

export default function KakaoAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit", "DAN-O48mpzGHyoZjEhpR");
    ins.setAttribute("data-ad-width", "320");
    ins.setAttribute("data-ad-height", "100");
    containerRef.current.appendChild(ins);

    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.async = true;
    containerRef.current.appendChild(script);
  }, []);

  return <div ref={containerRef} className="flex justify-center py-3" />;
}
