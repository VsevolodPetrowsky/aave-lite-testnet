interface IconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function DefaultTokenIcon({ symbol, size = 32, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#6B7280" />
      <text
        x="16"
        y="20"
        fill="white"
        fontSize="12"
        fontWeight="600"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        {symbol.slice(0, 2).toUpperCase()}
      </text>
    </svg>
  );
}
