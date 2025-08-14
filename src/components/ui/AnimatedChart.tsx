"use client";

import React from "react";

export default function AnimatedChart({ isActive, returnValue, color = "purple" }: { isActive: boolean; returnValue: number; color?: "purple" | "gray"; }) {
  // Normalize scale 0.08 .. 1
  const normalized = Math.max(0.08, Math.min(1, (returnValue || 0) / 1000));
  const primary = color === "purple" ? "#8B5CF6" : "#9CA3AF";
  const secondary = color === "purple" ? "#A78BFA" : "#D1D5DB";

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 100 100" className="absolute right-[-20px] bottom-[-20px] h-56 w-56" style={{ opacity: isActive ? 0.9 : 0.5 }}>
        <defs>
          <linearGradient id="g-minimal-1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity={0.85} />
            <stop offset="100%" stopColor={secondary} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <g style={{ transform: `scaleY(${normalized})`, transformOrigin: "100% 100%", transition: "transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          <path d="M0,80 C20,60 40,90 60,70 C75,60 85,70 100,55 L100,100 L0,100 Z" fill="url(#g-minimal-1)" />
        </g>
      </svg>
    </div>
  );
}
