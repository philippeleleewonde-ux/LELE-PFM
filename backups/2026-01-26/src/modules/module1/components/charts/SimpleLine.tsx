"use client";

import React, { useMemo, useState } from "react";

interface Series {
  label: string;
  color?: string;
  points: number[]; // y values, x are indices
}

interface SimpleLineProps {
  series: Series[];
  width?: number;
  height?: number;
  smooth?: boolean;
}

export const SimpleLine: React.FC<SimpleLineProps> = ({ series, width = 480, height = 180, smooth = false }) => {
  const [hover, setHover] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  const { minY, maxY, maxLen } = useMemo(() => {
    let min = Infinity, max = -Infinity, len = 0;
    for (const s of series) {
      for (const v of s.points) {
        if (!isFinite(v)) continue;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (s.points.length > len) len = s.points.length;
    }
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 1;
    if (min === max) { min = 0; max = max || 1; }
    return { minY: min, maxY: max, maxLen: len };
  }, [series]);

  const padding = { top: 10, right: 10, bottom: 18, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const colorPalette = ["#22c55e", "#3b82f6", "#f97316", "#eab308", "#a855f7", "#ef4444"];

  function sx(i: number) {
    return padding.left + (innerW * i) / Math.max(1, maxLen - 1);
  }
  function sy(v: number) {
    const t = (v - minY) / (maxY - minY);
    return padding.top + (1 - t) * innerH;
  }

  function toPath(points: number[]) {
    return points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  }

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#374151" />
        <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#374151" />

        {series.map((s, si) => (
          <g key={si}>
            <path d={toPath(s.points)} fill="none" stroke={s.color || colorPalette[si % colorPalette.length]} strokeWidth={2} />
            {s.points.map((v, i) => (
              <circle
                key={i}
                cx={sx(i)}
                cy={sy(v)}
                r={3}
                fill={s.color || colorPalette[si % colorPalette.length]}
                onMouseEnter={() => setHover({ x: sx(i), y: sy(v) - 10, value: v, label: `${s.label} • t${i + 1}` })}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        ))}
      </svg>
      {hover && (
        <div className="absolute px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded shadow" style={{ left: hover.x, top: hover.y }}>
          <div className="text-gray-300">{hover.label}</div>
          <div className="text-white font-semibold">{hover.value.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};
