import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeposit } from "../hooks/useDeposit";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useRefetchAll } from "../hooks/useRefetchAll";
import { showTransactionSuccess, showTransactionReverted, showTransactionError } from "../utils/transactionToast";
import { TRANSACTION_THRESHOLDS } from "../config/constants";
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
import { toast } from "sonner";

interface DepositFormProps {
  selectedToken?: string;
  onTokenChange?: (token: string) => void;
  disabled?: boolean;
}

interface PendingDeposit {
  amount: string;
  tokenAddress: string;
  tokenSymbol: string;
}

export const DepositForm = memo(function DepositForm({
  selectedToken: externalSelectedToken,
  onTokenChange,
  disabled = false,
}: DepositFormProps) {
  const { address } = useAccount();
  const {
    selectedTokenSymbol,
    selectedTokenData,
    handleTokenSelect: baseHandleTokenSelect,
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

  const [pendingDeposit, setPendingDeposit] = useState<PendingDeposit | null>(null);
  const { balances } = useTokenBalances();
  const { refetchAfterSupply } = useRefetchAll();

  const {
    allowance,
    refetchAllowance,
    handleApprove,
    handleDeposit,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isApproveReverted,
    approveHash,
    approveError,
    isSupplying,
    isSupplyConfirming,
    isSupplySuccess,
    isSupplyReverted,
    supplyHash,
    supplyError,
  } = useDeposit(
    selectedTokenData?.address ?? tokens[0]?.address ?? "0x0000000000000000000000000000000000000001",
    selectedTokenData?.decimals ?? tokens[0]?.decimals ?? 18
  );

  // Refs for approve success handler to avoid dependency bloat
  const handleDepositRef = useRef(handleDeposit);
  handleDepositRef.current = handleDeposit;
  const selectedTokenDataRef = useRef(selectedTokenData);
  selectedTokenDataRef.current = selectedTokenData;

  // Handle approve success - auto-trigger deposit with validation
  useEffect(() => {
    if (isApproveSuccess && approveHash && !hasShownToast(`approve-${approveHash}`)) {
      markToastShown(`approve-${approveHash}`);
      void refetchAllowance();

      // Validate context hasn't changed before depositing
      if (pendingDeposit && address && selectedTokenDataRef.current) {
        const isContextValid =
          pendingDeposit.tokenAddress === selectedTokenDataRef.current.address &&
          pendingDeposit.tokenSymbol === selectedTokenSymbol;

        if (isContextValid) {
          toast.success("Token approved! Starting deposit...");
          handleDepositRef.current(pendingDeposit.amount);
        } else {
          toast.warning("Token changed during approval. Please deposit manually.");
        }
        setPendingDeposit(null);
      } else {
        toast.success("Token approved!");
      }
    }
  }, [isApproveSuccess, approveHash, refetchAllowance, pendingDeposit, address, selectedTokenSymbol, hasShownToast, markToastShown]);

  // Handle approve reverted
  useEffect(() => {
    if (isApproveReverted && approveHash && !hasShownToast(`approve-reverted-${approveHash}`)) {
      markToastShown(`approve-reverted-${approveHash}`);
      setPendingDeposit(null);
      showTransactionReverted("Approve transaction reverted!", { explorerUrl, hash: approveHash });
    }
  }, [isApproveReverted, approveHash, explorerUrl, hasShownToast, markToastShown]);

  // Handle supply success
  useEffect(() => {
    if (isSupplySuccess && supplyHash && !hasShownToast(`supply-${supplyHash}`)) {
      markToastShown(`supply-${supplyHash}`);
      setAmount("");
      void refetchAfterSupply();
      showTransactionSuccess("Deposited successfully!", { explorerUrl, hash: supplyHash });
    }
  }, [isSupplySuccess, supplyHash, refetchAfterSupply, explorerUrl, hasShownToast, markToastShown, setAmount]);

  // Handle supply reverted
  useEffect(() => {
    if (isSupplyReverted && supplyHash && !hasShownToast(`supply-reverted-${supplyHash}`)) {
      markToastShown(`supply-reverted-${supplyHash}`);
      showTransactionReverted("Deposit transaction reverted!", { explorerUrl, hash: supplyHash });
    }
  }, [isSupplyReverted, supplyHash, explorerUrl, hasShownToast, markToastShown]);

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      setPendingDeposit(null);
      showTransactionError("Approve", approveError);
    }
  }, [approveError]);

  // Handle supply errors
  useEffect(() => {
    if (supplyError) {
      showTransactionError("Deposit", supplyError);
    }
  }, [supplyError]);

  const parsedAmount = useMemo(
    () =>
      amount && selectedTokenData
        ? parseUnits(amount || "0", selectedTokenData.decimals)
        : 0n,
    [amount, selectedTokenData]
  );

  const needsApproval = parsedAmount > allowance;

  const selectedBalance = balances.find((b) => b.symbol === selectedTokenSymbol);
  const balance = parseFloat(selectedBalance?.formatted || "0");

  // Validation
  useEffect(() => {
    validateAmount([
      { condition: !!amount && amountNum > balance, message: "Insufficient balance" },
      { condition: !!amount && amountNum <= 0, message: "Amount must be greater than zero" },
    ]);
  }, [amount, amountNum, balance, validateAmount]);

  const handleMaxClick = useCallback(() => {
    if (selectedBalance) {
      setAmount(selectedBalance.formatted);
    }
  }, [selectedBalance, setAmount]);

  const handleTokenSelect = useCallback(
    (value: string) => {
      setPendingDeposit(null);
      baseHandleTokenSelect(value);
    },
    [baseHandleTokenSelect]
  );

  const isLoading = isApproving || isApproveConfirming || isSupplying || isSupplyConfirming;

  const handlePrimaryAction = useCallback(() => {
    const parsedAmountNum = parseFloat(amount || "0");
    const currentBalance = parseFloat(selectedBalance?.formatted || "0");

    // Confirm large deposits
    const isLargeAmount = parsedAmountNum > TRANSACTION_THRESHOLDS.LARGE_AMOUNT ||
      (currentBalance > 0 && parsedAmountNum / currentBalance > TRANSACTION_THRESHOLDS.DEPOSIT_BALANCE_RATIO);
    if (isLargeAmount) {
      const confirmed = window.confirm(
        `You are about to deposit ${parsedAmountNum.toFixed(4)} ${selectedTokenSymbol} (${((parsedAmountNum / currentBalance) * 100).toFixed(1)}% of your balance). Continue?`
      );
      if (!confirmed) return;
    }

    if (needsApproval) {
      if (!amount || parsedAmountNum <= 0 || !selectedTokenData) return;
      setPendingDeposit({
        amount,
        tokenAddress: selectedTokenData.address,
        tokenSymbol: selectedTokenSymbol,
      });
      handleApprove(amount);
    } else {
      if (!amount || parsedAmountNum <= 0 || parsedAmountNum > currentBalance || error) return;
      handleDeposit(amount);
    }
  }, [amount, selectedBalance, selectedTokenSymbol, needsApproval, selectedTokenData, error, handleApprove, handleDeposit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit</CardTitle>
        <CardDescription>
          Deposit your tokens into Aave to start earning interest
        </CardDescription>
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
            Available: {Number(selectedBalance?.formatted ?? 0).toFixed(4)}{" "}
            {selectedTokenSymbol}
          </p>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={handlePrimaryAction}
          disabled={
            disabled ||
            isLoading ||
            !amount ||
            amountNum <= 0 ||
            (needsApproval ? false : !!error)
          }
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {disabled
            ? "Connect Wallet"
            : isApproving || isApproveConfirming
            ? "Approving..."
            : isSupplying || isSupplyConfirming
            ? "Depositing..."
            : needsApproval
            ? `Approve & Deposit ${selectedTokenSymbol}`
            : "Deposit"}
        </Button>
      </CardContent>
    </Card>
  );
});
