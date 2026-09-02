import React, { useMemo } from "react";
import { generateBarcodeSvgData } from "../utils/barcodeGenerator";

interface BarcodeRendererProps {
  value: string;
  height?: number;
  barWidth?: number;
  showText?: boolean;
  className?: string;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  height = 40,
  barWidth = 1.5,
  showText = true,
  className = "",
  color = "#000000",
  backgroundColor = "transparent",
  label
}) => {
  const barcodeData = useMemo(() => {
    return generateBarcodeSvgData(value || "N/A", barWidth, height);
  }, [value, barWidth, height]);

  if (!barcodeData || barcodeData.rects.length === 0) {
    return (
      <div className={`text-[10px] font-mono text-slate-400 p-2 text-center border border-dashed rounded ${className}`}>
        [Barcode: {value || "N/A"}]
      </div>
    );
  }

  const svgHeight = showText ? height + 16 : height;

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={barcodeData.totalWidth}
        height={svgHeight}
        viewBox={`0 0 ${barcodeData.totalWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: "100%", height: "auto", display: "block" }}
      >
        {backgroundColor && backgroundColor !== "transparent" && (
          <rect width={barcodeData.totalWidth} height={svgHeight} fill={backgroundColor} />
        )}
        
        {/* Bars */}
        <g fill={color}>
          {barcodeData.rects.map((r, idx) => (
            <rect
              key={idx}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
            />
          ))}
        </g>

        {/* Human Readable Text Label */}
        {showText && (
          <text
            x={barcodeData.totalWidth / 2}
            y={height + 12}
            textAnchor="middle"
            fill={color}
            fontFamily="monospace"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1"
          >
            {label || value}
          </text>
        )}
      </svg>
    </div>
  );
};
