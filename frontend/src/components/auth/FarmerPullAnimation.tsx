import React from 'react';

interface FarmerPullAnimationProps {
  pulledPercent?: number; // 0 to 100
  isPulling?: boolean;
}

export default function FarmerPullAnimation({ pulledPercent = 100, isPulling = true }: FarmerPullAnimationProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '110px', overflow: 'hidden', margin: '0 auto 12px' }}>
      <svg
        viewBox="0 0 600 120"
        style={{ width: '100%', height: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e543e" />
            <stop offset="100%" stopColor="#0d2b1f" />
          </linearGradient>
          <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Rolling field hill in background */}
        <path
          d="M0,105 Q150,85 300,100 T600,95 L600,120 L0,120 Z"
          fill="url(#groundGrad)"
          opacity="0.25"
        />

        {/* Small sprouts along the ground */}
        <g stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M 60,102 Q 55,90 48,93 M 60,102 Q 65,88 72,92" />
          <path d="M 140,100 Q 135,88 128,91 M 140,100 Q 145,86 152,90" />
          <path d="M 230,104 Q 225,92 218,95 M 230,104 Q 235,90 242,94" />
          <path d="M 370,101 Q 365,89 358,92 M 370,101 Q 375,87 382,91" />
          <path d="M 460,103 Q 455,91 448,94 M 460,103 Q 465,89 472,93" />
          <path d="M 540,101 Q 535,89 528,92 M 540,101 Q 545,87 552,91" />
        </g>

        {/* Furrow / Soil line */}
        <line x1="0" y1="106" x2="600" y2="106" stroke="#2d6a4f" strokeWidth="3" strokeDasharray="6,4" />

        {/* Animated pulling group: Farmer on the left pulling rope attached to the card */}
        <g className="farmer-heave-group">
          {/* Taut Pulled Hemp Rope */}
          <line
            x1="135"
            y1="64"
            x2="310"
            y2="76"
            stroke="url(#ropeGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="8,2"
          />

          {/* Little tension particles */}
          <circle cx="210" cy="70" r="2.5" fill="#f59e0b" opacity="0.8" />
          <circle cx="250" cy="73" r="2" fill="#d97706" opacity="0.7" />

          {/* Farmer Figure (Pulling pose, leaning left at ~35 degrees) */}
          <g transform="translate(45, 12)">
            {/* Back leg planted forward (leftwards) for leverage */}
            <path d="M 55,75 L 35,98 L 22,100" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Front leg braced right */}
            <path d="M 62,75 L 75,94 L 88,98" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Boots (Heavy farming workboots) */}
            <path d="M 18,97 L 30,97 L 30,102 L 18,102 Z" fill="#78350f" />
            <path d="M 82,95 L 94,95 L 94,100 L 82,100 Z" fill="#78350f" />

            {/* Torso in farmer denim shirt leaning back */}
            <path
              d="M 50,45 L 68,52 L 62,76 L 45,74 Z"
              fill="#2563eb"
              stroke="#1d4ed8"
              strokeWidth="1.5"
            />
            {/* Overalls / Suspenders straps */}
            <path d="M 51,46 L 48,74" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 64,50 L 58,75" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

            {/* Farmer Head with Beard & Cheerful Expression */}
            <circle cx="56" cy="32" r="11" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
            {/* Friendly farmer smile and eyes */}
            <circle cx="60" cy="30" r="1.5" fill="#1e293b" />
            <path d="M 57,35 Q 61,39 65,35" stroke="#991b1b" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Wide-brim Traditional Straw Farmer Hat */}
            <ellipse cx="56" cy="24" rx="20" ry="5.5" fill="#d97706" />
            <path d="M 43,24 Q 56,10 69,24 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            {/* Green hat band */}
            <path d="M 46,23 Q 56,18 66,23" stroke="#059669" strokeWidth="2.5" fill="none" />

            {/* Farmer Straining Arms gripping the rope tightly */}
            {/* Left arm */}
            <path d="M 58,48 L 76,55 L 92,57" stroke="#fbcfe8" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            {/* Right arm gripping further on rope */}
            <path d="M 54,50 L 72,59 L 85,61" stroke="#fbcfe8" strokeWidth="5.5" strokeLinecap="round" fill="none" />

            {/* Farmer Gloves gripping rope */}
            <circle cx="92" cy="57" r="4.5" fill="#92400e" />
            <circle cx="85" cy="61" r="4.5" fill="#78350f" />

            {/* Sweat drops flying (effort animation) */}
            <path d="M 72,25 Q 75,20 78,25 Q 75,29 72,25 Z" fill="#60a5fa" className="sweat-drop" opacity="0.85" />
          </g>

          {/* Golden Wheat Stalk waving next to farmer */}
          <g transform="translate(15, 60)" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <path d="M 12,45 Q 8,25 14,8" fill="none" />
            <ellipse cx="14" cy="10" rx="3" ry="5" fill="#f59e0b" />
            <ellipse cx="10" cy="18" rx="2.8" ry="4.5" fill="#f59e0b" />
            <ellipse cx="17" cy="22" rx="2.8" ry="4.5" fill="#f59e0b" />
            <ellipse cx="9" cy="30" rx="2.5" ry="4" fill="#f59e0b" />
          </g>
        </g>

        {/* Pulley / Hook attached to login bar */}
        <g transform="translate(308, 65)">
          <circle cx="8" cy="11" r="6" fill="#475569" stroke="#1e293b" strokeWidth="2" />
          <path d="M 8,11 L 28,11" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <rect x="26" y="2" width="6" height="18" rx="2" fill="#047857" />
        </g>
      </svg>

      <style jsx>{`
        .farmer-heave-group {
          animation: farmerPull 1.8s ease-in-out infinite alternate;
          transform-origin: 90px 105px;
        }
        .sweat-drop {
          animation: sweatGlisten 1.8s ease-in-out infinite;
        }
        @keyframes farmerPull {
          0% {
            transform: translateX(0px) rotate(0deg);
          }
          40% {
            transform: translateX(-8px) rotate(-3deg);
          }
          100% {
            transform: translateX(6px) rotate(2deg);
          }
        }
        @keyframes sweatGlisten {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-4px);
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}

