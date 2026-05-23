'use client'

import { useEffect, useState } from 'react'

interface ConfidenceGaugeProps {
  score: number // 0.0–1.0
}

function getGaugeConfig(score: number): { color: string; label: string } {
  if (score >= 0.85) return { color: '#16A34A', label: 'High Confidence' }
  if (score >= 0.70) return { color: '#D97706', label: 'Review Suggested' }
  return { color: '#DC2626', label: 'Low Confidence' }
}

export function ConfidenceGauge({ score }: ConfidenceGaugeProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const pct = Math.round(score * 100)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const dashoffset = animated ? circumference * (1 - score) : circumference
  const { color, label } = getGaugeConfig(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        aria-label={`AI Confidence: ${pct}% — ${label}`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        {/* Progress arc — starts at top via rotate -90deg */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Center percentage — 16px/600 per UI-SPEC */}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fontWeight="600"
          fill="currentColor"
          className="text-gray-900 dark:text-white"
        >
          {pct}%
        </text>
      </svg>
      {/* Label below gauge — 14px/400 muted */}
      <p className="text-[14px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}
