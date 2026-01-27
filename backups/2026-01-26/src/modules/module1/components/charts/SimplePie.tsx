"use client";

import React, { useMemo, useState, MouseEvent } from "react";

export interface PieDatum {
  label: string;
  value: number;
  color?: string;
}

interface SimplePieProps {
  data: PieDatum[];
  size?: number; // px
  innerRadius?: number; // px for donut
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export const SimplePie: React.FC<SimplePieProps> = ({ data, size = 220, innerRadius = 70 }) => {
  const [active, setActive] = useState<number | null>(null);
  const total = Math.max(0, data.reduce((s, d) => s + (d.value || 0), 0));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6; // padding

  const palette = [
    "#22c55e", // green
    "#3b82f6", // blue
    "#f97316", // orange
    "#eab308", // yellow
    "#a855f7", // purple
    "#ef4444", // red
    "#06b6d4", // cyan
    "#84cc16", // lime
  ];

  const arcs = useMemo(() => {
    let start = 0;
    return data.map((d, i) => {
      const angle = total ? (d.value / total) * 360 : 0;
      const end = start + angle;
      const path = describeArc(cx, cy, r, start, end);
      const mid = start + angle / 2;
      start = end;
      return { path, start, end, mid, color: d.color || palette[i % palette.length] };
    });
  }, [data, total, cx, cy, r]);

  const donutHole = innerRadius > 0 ? (
    <circle cx={cx} cy={cy} r={innerRadius} fill="#0b1220" stroke="#1f2937" />
  ) : null;

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g>
          {arcs.map((a, i) => (
            <g key={i}
               onMouseEnter={() => setActive(i)}
               onMouseLeave={() => setActive(null)}
               style={{ cursor: "pointer" }}>
              <path d={`${a.path} L ${cx} ${cy} Z`} fill={a.color} opacity={active === null || active === i ? 0.95 : 0.45} />
            </g>
          ))}
          {donutHole}
        </g>
        {active !== null && total > 0 && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-white" style={{ fontSize: 14 }}>
            {`${Math.round((data[active].value / total) * 100)}%`}
          </text>
        )}
      </svg>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: arcs[i]?.color }} />
            <span className={active === i ? "text-white" : ""}>
              {d.label}: {total ? ((d.value / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
