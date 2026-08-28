import * as React from "react";
import { cn } from "@/lib/utils";

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** Fill the area under the line with a soft gradient. */
  area?: boolean;
  /** Colour class applied via currentColor, e.g. "text-emerald-500". */
  className?: string;
}

/**
 * Dependency-free SVG sparkline for KPI cards and table cells.
 * Colour with a text-* class; sizes via width/height props.
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  area = true,
  className,
  ...props
}: SparklineProps) {
  const id = React.useId();
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L${points[points.length - 1][0].toFixed(2)},${height} L${points[0][0].toFixed(2)},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible text-primary", className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {area && (
        <>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#spark-${id})`} stroke="none" />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={strokeWidth + 0.5}
        fill="currentColor"
      />
    </svg>
  );
}
