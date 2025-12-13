import { useEffect, useCallback, useMemo, memo } from "react";
import { useWithdraw } from "../hooks/useWithdraw";
import { usePositions } from "../hooks/usePositions";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useRefetchAll } from "../hooks/useRefetchAll";
import { showTransactionSuccess, showTransactionReverted, showTransactionError } from "../utils/transactionToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";

interface WithdrawFormProps {
  selectedToken?: string;
  onTokenChange?: (token: string) => void;
  disabled?: boolean;
}

export const WithdrawForm = memo(function WithdrawForm({
  selectedToken: externalSelectedToken,
  onTokenChange,
  disabled = false,
}: WithdrawFormProps) {
  const {
    selectedTokenSymbol,
    selectedTokenData,
    handleTokenSelect,
    tokens,
    amount,
    setAmount,
    amountNum,
    error,
    validateAmount,
    hasShownToast,
    markToastShown,
    explorerUrl,
  } = useTransactionForm({
    externalSelectedToken,
    onTokenChange,
  });

  const { positions } = usePositions();
  const { refetchAfterWithdraw } = useRefetchAll();

  const {
    handleWithdraw,
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawSuccess,
    isWithdrawReverted,
    withdrawHash,
    withdrawError,
  } = useWithdraw(
    selectedTokenData?.address ?? tokens[0]?.address ?? "0x0000000000000000000000000000000000000001",
    selectedTokenData?.decimals ?? tokens[0]?.decimals ?? 18
  );

  const currentPosition = useMemo(
    () => positions.find((p) => p.symbol === selectedTokenSymbol),
    [positions, selectedTokenSymbol]
  );

  const balance = useMemo(
    () => parseFloat(currentPosition?.formatted || "0"),
    [currentPosition]
  );

  // Validation
  useEffect(() => {
    validateAmount([
      { condition: !!amount && amountNum > balance, message: "Amount exceeds balance" },
      { condition: !!amount && amountNum <= 0, message: "Amount must be greater than zero" },
    ]);
  }, [amount, amountNum, balance, validateAmount]);

  // Transaction effects
  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash && !hasShownToast(`withdraw-${withdrawHash}`)) {
      markToastShown(`withdraw-${withdrawHash}`);
      setAmount("");
      void refetchAfterWithdraw();
      showTransactionSuccess("Withdrawn successfully!", { explorerUrl, hash: withdrawHash });
    }
  }, [isWithdrawSuccess, withdrawHash, refetchAfterWithdraw, explorerUrl, hasShownToast, markToastShown, setAmount]);

  useEffect(() => {
    if (isWithdrawReverted && withdrawHash && !hasShownToast(`withdraw-reverted-${withdrawHash}`)) {
      markToastShown(`withdraw-reverted-${withdrawHash}`);
      showTransactionReverted("Withdraw transaction reverted!", { explorerUrl, hash: withdrawHash });
    }
  }, [isWithdrawReverted, withdrawHash, explorerUrl, hasShownToast, markToastShown]);

  useEffect(() => {
    if (withdrawError) {
      showTransactionError("Withdraw", withdrawError);
    }
  }, [withdrawError]);

  const handleMaxClick = useCallback(() => {
    if (currentPosition) {
      setAmount(currentPosition.formatted);
    }
  }, [currentPosition, setAmount]);

  const canWithdraw = useMemo(
    () => amountNum > 0 && amountNum <= balance && !error,
    [amountNum, balance, error]
  );

  const isLoading = useMemo(
    () => isWithdrawing || isWithdrawConfirming,
    [isWithdrawing, isWithdrawConfirming]
  );

  const handlePrimaryAction = useCallback(() => {
    if (!canWithdraw) return;
    handleWithdraw(amount, amount === currentPosition?.formatted);
  }, [canWithdraw, handleWithdraw, amount, currentPosition]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw</CardTitle>
        <CardDescription>Withdraw your tokens from Aave</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Select */}
        <div className="space-y-2">
          <Label>Token</Label>
          <Select
            value={selectedTokenSymbol}
            onValueChange={handleTokenSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={disabled}
                className={error ? "border-[var(--danger)]" : ""}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleMaxClick}
              disabled={disabled}
            >
              Max
            </Button>
          </div>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.875rem" }}>
              {error}
            </p>
          )}
          <p style={{ color: "var(--subtext)", fontSize: "0.875rem" }}>
            Available: {Number(currentPosition?.formatted ?? 0).toFixed(4)} a{selectedTokenSymbol}
          </p>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={handlePrimaryAction}
          disabled={disabled || isLoading || !amount || amountNum <= 0 || !!error}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {disabled
            ? "Connect Wallet"
            : isWithdrawing || isWithdrawConfirming
            ? "Withdrawing..."
            : "Withdraw"}
        </Button>
      </CardContent>
    </Card>
  );
});
