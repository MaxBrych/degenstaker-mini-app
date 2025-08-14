"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function AnimatedChart({ isActive, returnValue, color = "purple" }: { isActive: boolean; returnValue: number; color?: string; }) {
  const [animating, setAnimating] = useState(false);
  useEffect(() => { setAnimating(isActive); }, [isActive]);

  const pathData = useMemo(() => {
    const baseHeight = 80;
    const maxCurve = Math.min((returnValue || 0) / 10000, 8);
    const exponentialFactor = 1 + maxCurve * 0.4;
    const p1 = baseHeight - 10 * exponentialFactor;
    const p2 = baseHeight - 25 * exponentialFactor;
    const p3 = baseHeight - 45 * exponentialFactor;
    const endY = Math.max(5, baseHeight - 65 * exponentialFactor);
    return `M0,${baseHeight} Q30,${p1} 60,${p2} T120,${p3} T200,${endY}`;
  }, [returnValue]);

  const fillPath = `${pathData} L200,100 L0,100 Z`;
  const colorMap: Record<string, string> = { purple: '#a855f7', green: '#22c55e', gray: '#9ca3af' };
  const stroke = colorMap[color] || colorMap.purple;

  return (
    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.6" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={fillPath} fill={`url(#gradient-${color})`} style={{ opacity: animating ? 1 : 0, transition: 'opacity 0.3s ease-out, d 0.5s ease-out' }} />
      <path d={pathData} fill="none" stroke={stroke} strokeWidth="0.5" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={animating ? 0 : 400} style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1), d 0.5s ease-out' }} />
    </svg>
  );
}
