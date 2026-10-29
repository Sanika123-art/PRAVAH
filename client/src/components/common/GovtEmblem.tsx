import React from 'react';

/**
 * Indian National Tricolor Flag Indicator (Restrained & Official)
 */
export const IndiaFlag: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = '',
  width = 24,
  height = 16,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-none border border-[#17202B] ${className}`}
      aria-label="Flag of India"
    >
      <rect width="24" height="5.33" fill="#E98232" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.33" fill="#18794E" />
      <circle cx="12" cy="8" r="2.2" stroke="#142B45" strokeWidth="0.6" fill="none" />
      <circle cx="12" cy="8" r="0.4" fill="#142B45" />
      {/* 24 spokes representation */}
      <line x1="12" y1="5.8" x2="12" y2="10.2" stroke="#142B45" strokeWidth="0.25" />
      <line x1="9.8" y1="8" x2="14.2" y2="8" stroke="#142B45" strokeWidth="0.25" />
      <line x1="10.44" y1="6.44" x2="13.56" y2="9.56" stroke="#142B45" strokeWidth="0.25" />
      <line x1="10.44" y1="9.56" x2="13.56" y2="6.44" stroke="#142B45" strokeWidth="0.25" />
    </svg>
  );
};

/**
 * AICTE Technical Education Statutory Seal & Workflow Authority Emblem
 */
export const CouncilEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 52,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="AICTE Technical Education Workflow Authority"
    >
      {/* Outer Square-Round Frame with Government Navy & Neo-Brutalist Border */}
      <rect x="2" y="2" width="60" height="60" rx="3" fill="#0A1B38" stroke="#17202B" strokeWidth="2.5" />
      
      {/* Inner Decorative Saffron Inset */}
      <rect x="6" y="6" width="52" height="52" rx="2" fill="#142B45" stroke="#E98232" strokeWidth="1.5" />

      {/* Hexagonal Shield */}
      <polygon
        points="32,10 50,20 50,44 32,54 14,44 14,20"
        fill="#0A1B38"
        stroke="#E98232"
        strokeWidth="1.5"
      />

      {/* Stylized Apex Torch / Knowledge Beacon */}
      <path d="M32 15L36 23H28L32 15Z" fill="#E98232" />
      <circle cx="32" cy="14" r="2" fill="#C5221F" />

      {/* Classical Institutional Verification Pillars */}
      <rect x="22" y="27" width="3.5" height="14" fill="#FAF9F6" />
      <rect x="30.25" y="27" width="3.5" height="14" fill="#FAF9F6" />
      <rect x="38.5" y="27" width="3.5" height="14" fill="#FAF9F6" />

      {/* Pedestal & Architrave */}
      <rect x="19" y="24" width="26" height="2.5" fill="#E98232" />
      <rect x="18" y="41" width="28" height="3" fill="#E98232" />

      {/* Central Compliant Verification Seal */}
      <rect x="30" y="32" width="4" height="4" fill="#18794E" />
    </svg>
  );
};
