// app/components/TurnOneLogo.tsx
import React from "react";

type Props = {
  className?: string;
};

export default function TurnOneLogo({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 300 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TurnOne"
    >
      <defs>
        {/* Drop shadow filter */}
        <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="1" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Wordmark: "Turn" - white with black outline */}
      <g transform="translate(30, 60) skewX(-12)">
        <text
          x="0"
          y="0"
          fontFamily="Arial Black, sans-serif"
          fontSize="42"
          fontWeight="900"
          fontStyle="italic"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          paintOrder="stroke fill"
          letterSpacing="-2"
          filter="url(#dropshadow)"
        >
          Turn
        </text>
      </g>

      {/* Wordmark: "One" - red with black outline - moved closer to "Turn" */}
      <g transform="translate(145, 60) skewX(-12)">
        <text
          x="0"
          y="0"
          fontFamily="Arial Black, sans-serif"
          fontSize="42"
          fontWeight="900"
          fontStyle="italic"
          fill="#E10600"
          stroke="#000000"
          strokeWidth="2.5"
          paintOrder="stroke fill"
          letterSpacing="-2"
          filter="url(#dropshadow)"
        >
          One
        </text>
      </g>
    </svg>
  );
}
