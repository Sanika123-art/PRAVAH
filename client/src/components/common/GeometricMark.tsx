import React from 'react';

interface GeometricMarkProps {
  className?: string;
  size?: number;
}

/**
 * Neo-Brutalist Government Identity Mark for PRAVAH.
 * Represents precision statutory scrutiny, institutional governance, and workflow integrity.
 * Strictly original design avoiding state emblem copyright issues.
 */
export const GeometricMark: React.FC<GeometricMarkProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="PRAVAH Structural Mark"
    >
      {/* Outer crisp rectangular-shield outline with 2px stroke */}
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="2"
        fill="#142B45"
        stroke="#17202B"
        strokeWidth="2"
      />

      {/* Internal geometric diamond & grid */}
      <polygon
        points="20,7 33,20 20,33 7,20"
        fill="#0A1B38"
        stroke="#E98232"
        strokeWidth="1.5"
      />

      {/* Central India green statutory verification node */}
      <rect x="17" y="17" width="6" height="6" fill="#18794E" stroke="#FAF9F6" strokeWidth="1" />

      {/* Four directional precision crosshairs */}
      <line x1="20" y1="9" x2="20" y2="14" stroke="#FAF9F6" strokeWidth="1.5" />
      <line x1="20" y1="26" x2="20" y2="31" stroke="#FAF9F6" strokeWidth="1.5" />
      <line x1="9" y1="20" x2="14" y2="20" stroke="#FAF9F6" strokeWidth="1.5" />
      <line x1="26" y1="20" x2="31" y2="20" stroke="#FAF9F6" strokeWidth="1.5" />
    </svg>
  );
};
