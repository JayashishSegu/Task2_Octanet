"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { scoreStroke } from "@/lib/utils";

/** Large animated overall-score gauge (3/4 circle arc). */
export function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const size = 220;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const arcFraction = 0.75;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * arcFraction;

  const progress = useMotionValue(0);
  const spring = useSpring(progress, { stiffness: 50, damping: 16 });
  const dashOffset = useTransform(spring, (v) => arcLength * (1 - v / 100));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.set(score);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [score, progress, spring]);

  const color = scoreStroke(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`Overall score ${score} out of 100, grade ${grade}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-[135deg]"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          style={{ strokeDashoffset: dashOffset }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-extrabold tabular-nums" style={{ color }}>
          {display}
        </span>
        <span className="text-sm text-muted-foreground">out of 100</span>
        <span
          className="mt-1 rounded-full px-3 py-0.5 text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
