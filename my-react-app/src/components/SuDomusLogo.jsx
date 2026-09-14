import React from 'react';
import './SuDomusLogo.css';

export default function SuDomusLogo() {
  return (
    <svg
      className="sudomus-logo"
      width="160"
      height="50"
      viewBox="0 0 180 60"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sdGradient" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      <path
        d="M20 45 L20 25 Q30 15 40 25 L40 45 Z"
        fill="none"
        stroke="url(#sdGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80"
        strokeDashoffset="80"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="80"
          to="0"
          dur="1s"
          begin="0s"
          fill="freeze"
        />
      </path>

      <path
        d="M25 35 Q30 30 35 35"
        fill="none"
        stroke="url(#sdGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="30"
        strokeDashoffset="30"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="30"
          to="0"
          dur="0.8s"
          begin="0.5s"
          fill="freeze"
        />
      </path>

      <text
        x="60"
        y="40"
        fontFamily="Poppins, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill="url(#sdGradient)"
        opacity="0"
      >
        SuDomus
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="1s"
          begin="0.9s"
          fill="freeze"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 5"
          to="0 0"
          dur="1s"
          begin="0.9s"
          fill="freeze"
        />
      </text>
    </svg>
  );
}
