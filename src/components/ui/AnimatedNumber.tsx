"use client";

import { useState, useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  decimals?: number;
  style?: React.CSSProperties;
}

export default function AnimatedNumber({ value, className = "", duration = 800, decimals = 2, style }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value) || value === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime = 0;
    let startValue = displayValue;
    let raf = 0;

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
        startValue = displayValue;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (value - startValue) * easeOutCubic;

      setDisplayValue(currentValue);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formattedValue = Number.isFinite(displayValue) ? displayValue.toFixed(decimals) : (0).toFixed(decimals);

  return <span className={className} style={style}>{formattedValue}</span>;
}
