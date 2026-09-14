import React from 'react';
import './Preloader.css';

const Preloader = () => {
    return (
        <div className="preloader-container">
            <svg
                width="120"
                height="120"
                viewBox="0 0 60 60"
                xmlns="http://www.w3.org/2000/svg"
                className="preloader-logo"
            >
                <defs>
                    <linearGradient id="loaderGradient" x1="0" y1="0" x2="100%" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <filter id="loaderGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Monogram (S + D shaped house) - Centered in new viewBox */}
                <path
                    d="M20 45 L20 25 Q30 15 40 25 L40 45 Z"
                    fill="none"
                    stroke="url(#loaderGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="80"
                    strokeDashoffset="80"
                    filter="url(#loaderGlow)"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="80"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                        fill="freeze"
                        values="80; 0; 80"
                        keyTimes="0; 0.5; 1"
                    />
                </path>

                <path
                    d="M25 35 Q30 30 35 35"
                    fill="none"
                    stroke="url(#loaderGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="30"
                    strokeDashoffset="30"
                    filter="url(#loaderGlow)"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="30"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                        fill="freeze"
                        values="30; 0; 30"
                        keyTimes="0; 0.5; 1"
                    />
                </path>
            </svg>
        </div>
    );
};

export default Preloader;
