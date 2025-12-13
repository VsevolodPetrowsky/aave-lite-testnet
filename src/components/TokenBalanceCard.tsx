import { memo } from "react";
import { Button } from "./ui/button";
import { TokenIcon } from "./TokenIcon";
import { Copy } from "lucide-react";
import { formatAddress, copyToClipboard } from "../shared/utils";

interface TokenBalanceCardProps {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  onDeposit: () => void;
}

export const TokenBalanceCard = memo(function TokenBalanceCard({
  symbol,
  name,
  balance,
  address,
  onDeposit,
}: TokenBalanceCardProps) {
  const handleCopyAddress = () => copyToClipboard(address);

  return (
    <div
      className="p-3 md:p-4 rounded-xl border flex items-center justify-between gap-2"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <TokenIcon symbol={symbol} size={40} className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {symbol}
            </span>
            <span
              className="text-sm md:text-base"
              style={{ color: "var(--subtext)" }}
            >
              {name}
            </span>
          </div>
          <div className="text-sm md:text-base" style={{ color: "var(--text)" }}>
            Available: <span className="font-medium">{balance}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs md:text-sm truncate"
              style={{ color: "var(--subtext)" }}
            >
              Contract: {formatAddress(address)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
              style={{ color: "var(--subtext)" }}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={onDeposit} className="flex-shrink-0">
        Deposit
      </Button>
    </div>
  );
});
