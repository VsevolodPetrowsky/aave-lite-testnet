import {
  UsdcIcon,
  UsdtIcon,
  WethIcon,
  DaiIcon,
  LinkIcon,
  WbtcIcon,
  AaveIcon,
  DefaultTokenIcon,
} from "@/shared/icons/tokens";

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const TOKEN_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  USDC: UsdcIcon,
  USDT: UsdtIcon,
  WETH: WethIcon,
  DAI: DaiIcon,
  LINK: LinkIcon,
  WBTC: WbtcIcon,
  AAVE: AaveIcon,
};

export function TokenIcon({ symbol, size = 32, className = "" }: TokenIconProps) {
  const IconComponent = TOKEN_ICONS[symbol.toUpperCase()];

  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }

  return <DefaultTokenIcon symbol={symbol} size={size} className={className} />;
}
