import React from 'react';
import { Sun, Cloud, Wheat, Sparkles } from 'lucide-react';

export default function FarmLandscapeBackground() {
  return (
    <div className="farm-landscape-container" aria-hidden="true">
      {/* Sky Sun with gentle glow */}
      <div className="sun-element">
        <div className="sun-core">
          <Sun size={68} color="#f59e0b" strokeWidth={2.2} />
        </div>
        <div className="sun-aura" />
      </div>

      {/* Floating Gentle Clouds */}
      <div className="floating-cloud cloud-1">
        <Cloud size={54} color="#ffffff" fill="#ffffff" opacity={0.65} />
      </div>
      <div className="floating-cloud cloud-2">
        <Cloud size={40} color="#ffffff" fill="#ffffff" opacity={0.5} />
      </div>
      <div className="floating-cloud cloud-3">
        <Cloud size={62} color="#ffffff" fill="#ffffff" opacity={0.55} />
      </div>

      {/* Floating harvest sparks/pollen */}
      <div className="pollen-particle p1">
        <Sparkles size={16} color="#fbbf24" />
      </div>
      <div className="pollen-particle p2">
        <Wheat size={18} color="#f59e0b" />
      </div>
      <div className="pollen-particle p3">
        <Sparkles size={14} color="#34d399" />
      </div>

      {/* Rolling Hills bottom contour SVG */}
      <svg
        className="hills-svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,192L60,181.3C120,171,240,149,360,165.3C480,181,600,235,720,240C840,245,960,203,1080,181.3C1200,160,1320,160,1380,160L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          fill="#0f3d2a"
          opacity="0.35"
        />
        <path
          d="M0,224L80,213.3C160,203,320,181,480,192C640,203,800,245,960,245.3C1120,245,1280,203,1360,181.3L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          fill="#144d34"
          opacity="0.6"
        />
        <path
          d="M0,256L60,261.3C120,267,240,277,360,266.7C480,256,600,224,720,224C840,224,960,256,1080,261.3C1200,267,1320,245,1380,234.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          fill="#1a5c40"
          opacity="0.9"
        />
      </svg>

      <style jsx>{`
        .farm-landscape-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
          background: radial-gradient(circle at 18% 18%, rgba(254, 243, 199, 0.5) 0%, transparent 45%),
                      linear-gradient(175deg, #f0fdf4 0%, #e6f4ea 45%, #d1fae5 100%);
        }
        .sun-element {
          position: absolute;
          top: 36px;
          left: 6%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: sunPulse 6s ease-in-out infinite alternate;
        }
        .sun-aura {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0) 70%);
        }
        .floating-cloud {
          position: absolute;
          filter: drop-shadow(0 8px 12px rgba(16, 78, 52, 0.08));
        }
        .cloud-1 {
          top: 60px;
          left: 28%;
          animation: cloudDrift 42s linear infinite;
        }
        .cloud-2 {
          top: 130px;
          left: 68%;
          animation: cloudDrift 55s linear infinite reverse;
        }
        .cloud-3 {
          top: 40px;
          right: 8%;
          animation: cloudDrift 60s linear infinite;
        }
        .pollen-particle {
          position: absolute;
          opacity: 0.75;
        }
        .p1 {
          top: 30%;
          left: 15%;
          animation: floatFloat 7s ease-in-out infinite;
        }
        .p2 {
          top: 60%;
          right: 18%;
          animation: floatFloat 9s ease-in-out infinite 2s;
        }
        .p3 {
          top: 45%;
          right: 32%;
          animation: floatFloat 8s ease-in-out infinite 1s;
        }
        .hills-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 240px;
        }
        @keyframes sunPulse {
          0% {
            transform: scale(1) rotate(0deg);
          }
          100% {
            transform: scale(1.08) rotate(10deg);
          }
        }
        @keyframes cloudDrift {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(45px);
          }
          100% {
            transform: translateX(0);
          }
        }
        @keyframes floatFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
          }
        }
      `}</style>
    </div>
  );
}

