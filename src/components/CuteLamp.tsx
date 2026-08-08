import { useState } from 'react';

interface CuteLampProps {
  onToggle: (on: boolean) => void;
}

export function CuteLamp({ onToggle }: CuteLampProps) {
  const [isOn, setIsOn] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const handlePull = () => {
    // Prevent double-clicking while the cord is moving
    if (isPulling) return;

    setIsPulling(true);

    // Small delay makes the pull feel physical
    setTimeout(() => {
      const nextState = !isOn;

      setIsOn(nextState);
      onToggle(nextState);

      // Let the cord return to its original position
      setTimeout(() => {
        setIsPulling(false);
      }, 180);
    }, 180);
  };

  return (
    <div className="relative flex items-center justify-center w-[300px] h-[430px] select-none">
      {/* Ambient lamp glow */}
      <div
        className={`
          absolute
          top-[55px]
          left-1/2
          -translate-x-1/2
          w-[270px]
          h-[270px]
          rounded-full
          pointer-events-none
          transition-all
          duration-700
          ${
            isOn
              ? 'opacity-100 scale-100 bg-amber-200/30 blur-[70px]'
              : 'opacity-0 scale-75'
          }
        `}
      />

      <svg
        viewBox="0 0 200 330"
        className="relative z-10 w-full h-full overflow-visible"
        aria-label="Pull lamp"
      >
        <defs>
          {/* Warm lamp glow */}
          <radialGradient id="lampGlow">
            <stop
              offset="0%"
              stopColor="#fff7c7"
              stopOpacity="0.95"
            />
            <stop
              offset="45%"
              stopColor="#ffd86b"
              stopOpacity="0.45"
            />
            <stop
              offset="100%"
              stopColor="#ffd86b"
              stopOpacity="0"
            />
          </radialGradient>

          {/* Lamp shade gradient */}
          <linearGradient
            id="shadeGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={isOn ? '#fffef0' : '#817b73'}
            />
            <stop
              offset="100%"
              stopColor={isOn ? '#fff8d7' : '#625e58'}
            />
          </linearGradient>

          {/* Base gradient */}
          <linearGradient
            id="baseGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#77716a" />
            <stop offset="50%" stopColor="#aaa39a" />
            <stop offset="100%" stopColor="#77716a" />
          </linearGradient>

          {/* Strong glow */}
          <filter
            id="glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="12"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================================================= */}
        {/* LIGHT GLOW */}
        {/* ================================================= */}

        <ellipse
          cx="100"
          cy="105"
          rx="105"
          ry="100"
          fill="url(#lampGlow)"
          className={`
            transition-opacity duration-700
            ${isOn ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* ================================================= */}
        {/* LAMP SHADE */}
        {/* ================================================= */}

        <path
          d="
            M30 108
            C30 48 170 48 170 108
            C170 124 30 124 30 108
            Z
          "
          fill="url(#shadeGradient)"
          className={`
            transition-all duration-700
            ${isOn ? 'drop-shadow-[0_0_25px_rgba(255,220,120,0.9)]' : ''}
          `}
        />

        {/* Inner light */}
        <ellipse
          cx="100"
          cy="105"
          rx="67"
          ry="27"
          fill="#fff9d7"
          className={`
            transition-opacity duration-500
            ${isOn ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* ================================================= */}
        {/* LAMP STEM */}
        {/* ================================================= */}

        <rect
          x="91"
          y="112"
          width="18"
          height="170"
          rx="5"
          fill="url(#baseGradient)"
        />

        {/* ================================================= */}
        {/* LAMP BASE */}
        {/* ================================================= */}

        <rect
          x="62"
          y="278"
          width="76"
          height="14"
          rx="7"
          fill="url(#baseGradient)"
        />

        {/* ================================================= */}
        {/* PULL CORD */}
        {/* ================================================= */}

        <g>
          {/* Cord */}
          <line
            x1="128"
            y1="112"
            x2="128"
            y2={isPulling ? 205 : 178}
            stroke={isOn ? '#c9a52c' : '#69645e'}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-200"
          />

          {/* Small gold cord end */}
          <circle
            cx="128"
            cy={isPulling ? 205 : 178}
            r="5"
            fill="#d6ad2d"
            className="transition-all duration-200"
          />

          {/* ONLY THIS AREA IS CLICKABLE */}
          <circle
            cx="128"
            cy={isPulling ? 205 : 178}
            r="11"
            fill="transparent"
            className="cursor-pointer"
            onClick={handlePull}
          />
        </g>

        {/* ================================================= */}
        {/* LIGHT RAYS */}
        {/* ================================================= */}

        <g
          stroke="#ffd66b"
          strokeWidth="4"
          strokeLinecap="round"
          className={`
            transition-all
            duration-700
            ${isOn ? 'opacity-80' : 'opacity-0'}
          `}
        >
          <line x1="38" y1="132" x2="20" y2="150" />
          <line x1="52" y1="153" x2="38" y2="177" />

          <line x1="162" y1="132" x2="180" y2="150" />
          <line x1="148" y1="153" x2="162" y2="177" />
        </g>

        {/* ================================================= */}
        {/* LIGHT SWITCH INDICATOR */}
        {/* ================================================= */}

        <circle
          cx="100"
          cy="106"
          r="3"
          fill="#fff"
          filter="url(#glow)"
          className={`
            transition-opacity duration-500
            ${isOn ? 'opacity-100' : 'opacity-0'}
          `}
        />
      </svg>
    </div>
  );
}