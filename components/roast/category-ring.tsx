"use client";

import { motion } from "framer-motion";
import { scoreStroke } from "@/lib/utils";

/** Small animated progress ring used on category cards. */
export function CategoryRing({
  score,
  size = 64,
  delay = 0,
}: {
  score: number;
  size?: number;
  delay?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreStroke(score);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{
            strokeDashoffset: circumference * (1 - score / 100),
          }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
