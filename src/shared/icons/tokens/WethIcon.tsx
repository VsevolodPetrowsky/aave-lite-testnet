interface IconProps {
  size?: number;
  className?: string;
}

export function WethIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g>
        <path
          d="M16.498 4V12.87L23.995 16.22L16.498 4Z"
          fill="white"
          fillOpacity="0.602"
        />
        <path d="M16.498 4L9 16.22L16.498 12.87V4Z" fill="white" />
        <path
          d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z"
          fill="white"
          fillOpacity="0.602"
        />
        <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white" />
        <path
          d="M16.498 20.573L23.995 16.22L16.498 12.872V20.573Z"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M9 16.22L16.498 20.573V12.872L9 16.22Z"
          fill="white"
          fillOpacity="0.602"
        />
      </g>
    </svg>
  );
}
