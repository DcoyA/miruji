"use client";

import { useEffect, useRef, useState } from "react";

const MIN_TOTAL_MS = 2000;
const REVEAL_HOLD_MS = 600;

type SplashScreenProps = {
  ready: boolean;
  onFinish: () => void;
};

export default function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!ready || phase !== "spin") return;
    setPhase("reveal");
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(REVEAL_HOLD_MS, MIN_TOTAL_MS - elapsed);
    const timer = setTimeout(onFinish, waitMs);
    return () => clearTimeout(timer);
  }, [phase, onFinish]);

  return (
    <div className="sp-root">
      {phase === "spin" ? (
        <div className="sp-orbit">
          <div className="sp-arm sp-arm-a">
            <span className="sp-label">미루지</span>
          </div>
          <div className="sp-arm sp-arm-b">
            <span className="sp-label">말자</span>
          </div>
        </div>
      ) : (
        <div className="sp-reveal">
          <svg className="sp-character" viewBox="0 0 100 100" width="96" height="96">
            <path
              d="M10,50 C10,20 30,5 50,5 C70,5 90,20 90,50 L90,68 Q80,58 70,68 Q60,78 50,68 Q40,58 30,68 Q20,78 10,68 Z"
              fill="#E5E7F5"
            />
            <circle cx="36" cy="46" r="3.4" fill="#2E2E3A" />
            <circle cx="64" cy="46" r="3.4" fill="#2E2E3A" />
            <circle cx="32" cy="38" r="1.4" fill="#2E2E3A" />
            <circle cx="68" cy="38" r="1.4" fill="#2E2E3A" />
            <path
              d="M40,58 Q50,66 60,58"
              stroke="#2E2E3A"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div className="sp-logo">
            미루지<b>말자</b>
          </div>
        </div>
      )}

      <style>{`
        .sp-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #6C63FF;
        }
        .sp-orbit {
          position: relative;
          width: 1px;
          height: 1px;
        }
        .sp-arm {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 78px;
          height: 2px;
          transform-origin: 0 50%;
        }
        .sp-arm-a { animation: sp-spin-cw 2.2s linear infinite; }
        .sp-arm-b { animation: sp-spin-ccw 3.4s linear infinite; }
        .sp-label {
          position: absolute;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          white-space: nowrap;
        }
        @keyframes sp-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sp-spin-ccw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .sp-reveal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          animation: sp-fade-in 0.4s ease-out;
        }
        @keyframes sp-fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .sp-character {
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
        }
        .sp-logo {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
        }
        .sp-logo b { font-weight: 800; }
      `}</style>
    </div>
  );
}
