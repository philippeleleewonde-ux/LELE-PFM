"use client";

import React, { useMemo, useState } from "react";

export interface StackGroup {
  label: string; // e.g., N+1
  segments: { label: string; value: number; color?: string }[]; // e.g., [{label:'Cash-Flow', value: 67}, {label:'Bonus', value: 33}]
}

interface SimpleStackedBarProps {
  groups: StackGroup[];
  width?: number;
  height?: number;
  showLegend?: boolean;
}

const PALETTE = ["#22c55e", "#3b82f6", "#f97316", "#eab308", "#a855f7", "#ef4444", "#06b6d4", "#84cc16"];

export const SimpleStackedBar: React.FC<SimpleStackedBarProps> = ({ groups, width = 520, height = 200, showLegend = true }) => {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const padding = { top: 16, right: 12, bottom: 26, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxTotal = useMemo(() => Math.max(1, ...groups.map(g => g.segments.reduce((s, seg) => s + (seg.value || 0), 0))), [groups]);

  const barWidth = innerW / Math.max(1, groups.length) * 0.7;
  const gap = innerW / Math.max(1, groups.length) * 0.3;

  function gx(i: number) {
    return padding.left + i * (barWidth + gap) + gap / 2;
  }

  function gh(v: number) {
    return (v / maxTotal) * innerH;
  }

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* baseline */}
        <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#374151" />
        {groups.map((g, gi) => {
          const x = gx(gi);
          let acc = 0;
          const total = g.segments.reduce((s, seg) => s + (seg.value || 0), 0);
          return (
            <g key={gi}>
              {g.segments.map((seg, si) => {
                const h = gh(seg.value || 0);
                const y = padding.top + innerH - acc - h;
                acc += h;
                const color = seg.color || PALETTE[si % PALETTE.length];
                return (
                  <rect key={si}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        fill={color}
                        onMouseEnter={() => setHover({ x: x + barWidth / 2, y: y - 10, label: `${g.label} • ${seg.label}`, value: seg.value || 0 })}
                        onMouseLeave={() => setHover(null)}
                  />
                );
              })}
              {/* group label */}
              <text x={x + barWidth / 2} y={padding.top + innerH + 16} textAnchor="middle" className="fill-gray-400 text-xs">{g.label}</text>
              {/* total label */}
              <text x={x + barWidth / 2} y={padding.top + innerH - gh(total) - 6} textAnchor="middle" className="fill-gray-300 text-xs font-semibold">{total.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="absolute px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded shadow" style={{ left: hover.x, top: hover.y }}>
          <div className="text-gray-300">{hover.label}</div>
          <div className="text-white font-semibold">{hover.value.toFixed(2)}</div>
        </div>
      )}
      {showLegend && (
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-300">
          {Array.from(new Set(groups.flatMap(g => g.segments.map(s => s.label)))).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
