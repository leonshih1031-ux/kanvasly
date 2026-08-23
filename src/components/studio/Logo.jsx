import React from "react";

// Kanvasly brand mark — an aperture/lens fused with a canvas frame,
// rendered in the brand gradient. Clean, distinctive, scales crisply.
export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kanvasly logo"
    >
      <defs>
        <linearGradient id="kv-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B6FE0" />
          <stop offset="0.55" stopColor="#5B4FD0" />
          <stop offset="1" stopColor="#14A082" />
        </linearGradient>
        <linearGradient id="kv-grad-soft" x1="10" y1="6" x2="30" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Rounded canvas frame */}
      <rect x="3" y="3" width="34" height="34" rx="10" fill="url(#kv-grad)" />
      <rect x="3" y="3" width="34" height="34" rx="10" fill="black" fillOpacity="0.05" />
      {/* Aperture blades */}
      <g transform="translate(20 20)">
        <circle r="9.2" fill="none" stroke="url(#kv-grad-soft)" strokeWidth="1.6" opacity="0.55" />
        <g stroke="url(#kv-grad-soft)" strokeWidth="1.7" strokeLinecap="round">
          <path d="M0 -8.4 L4.2 1.6" />
          <path d="M7.3 -4.2 L-2.7 6.4" />
          <path d="M7.3 4.2 L-5.4 -6.4" />
          <path d="M0 8.4 L-1.4 -2.6" opacity="0.5" />
        </g>
        <circle r="2.1" fill="url(#kv-grad-soft)" />
      </g>
      {/* Corner accent — the "canvas" crop mark */}
      <path d="M8 8 L8 12 M8 8 L12 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}