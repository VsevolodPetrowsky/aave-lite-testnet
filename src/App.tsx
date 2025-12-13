import { useState, useRef, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { Header } from "./components/Header";
import { TokenBalanceCard } from "./components/TokenBalanceCard";
import { DepositForm } from "./components/DepositForm";
import { PositionsTable } from "./components/PositionsTable";
import { WithdrawForm } from "./components/WithdrawForm";
import { BorrowForm } from "./components/BorrowForm";
import { RepayForm } from "./components/RepayForm";
import { BorrowingsTable } from "./components/BorrowingsTable";
import { AccountOverview } from "./components/AccountOverview";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { Card, CardContent } from "./components/ui/card";
import { useTokenBalances } from "./hooks/useTokenBalances";
import { usePositions } from "./hooks/usePositions";
import { useNetworkConfig } from "./hooks/useNetworkConfig";
import { UI_DELAYS } from "./config/constants";

function App() {
  const { isConnected } = useAccount();
  const { tokens } = useNetworkConfig();
  const { balances, isLoading: isBalancesLoading } = useTokenBalances();
  const { positions } = usePositions();

  const [selectedDepositToken, setSelectedDepositToken] = useState<string>(
    tokens[0]?.symbol || "DAI"
  );
  const [selectedWithdrawToken, setSelectedWithdrawToken] = useState<string>(
    tokens[0]?.symbol || "DAI"
  );
  const [selectedBorrowToken, setSelectedBorrowToken] = useState<string>(
    tokens[0]?.symbol || "USDC"
  );
  const [selectedRepayToken, setSelectedRepayToken] = useState<string>(
    tokens[0]?.symbol || "USDC"
  );

  const depositFormRef = useRef<HTMLDivElement>(null);
  const withdrawFormRef = useRef<HTMLDivElement>(null);
  const borrowFormRef = useRef<HTMLDivElement>(null);
  const repayFormRef = useRef<HTMLDivElement>(null);

  const handleTokenDeposit = useCallback((symbol: string) => {
    setSelectedDepositToken(symbol);
    setTimeout(() => {
      depositFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, UI_DELAYS.SCROLL_DELAY_MS);
  }, []);

  const handlePositionWithdraw = useCallback((asset: string) => {
    setSelectedWithdrawToken(asset);
    setTimeout(() => {
      withdrawFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, UI_DELAYS.SCROLL_DELAY_MS);
  }, []);

  const handleBorrowingRepay = useCallback((asset: string) => {
    setSelectedRepayToken(asset);
    setTimeout(() => {
      repayFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, UI_DELAYS.SCROLL_DELAY_MS);
  }, []);

  // Prepare positions data for the table
  const positionsData = useMemo(() => positions.map((pos) => ({
    asset: pos.symbol,
    aTokenAddress: pos.aTokenAddress,
    balance: Number(pos.formatted).toFixed(4),
  })), [positions]);

  const isDisabled = !isConnected;

  return (
    <ErrorBoundary>
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Header />

        {/* Main Content */}
        <div className="mx-auto px-4 md:px-20 py-4 md:py-8">
          {/* Account Overview */}
          {isConnected && (
            <div className="mb-4 md:mb-6">
              <ErrorBoundary>
                <AccountOverview />
              </ErrorBoundary>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Left Column - 60% */}
            <div className="lg:col-span-7 space-y-4 md:space-y-6">
              {/* Balances Section */}
              <div>
                <div className="mb-4">
                  <h2 className="mb-1">Your tokens (available to deposit)</h2>
                </div>

                {isConnected ? (
                  isBalancesLoading ? (
                    <div className="space-y-3">
                      {tokens.map((token) => (
                        <div
                          key={token.symbol}
                          className="p-3 md:p-4 rounded-xl border animate-pulse"
                          style={{ background: "var(--card)", borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full" style={{ background: "var(--border)" }} />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-20 rounded" style={{ background: "var(--border)" }} />
                              <div className="h-3 w-32 rounded" style={{ background: "var(--border)" }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tokens.map((token) => {
                        const tokenBalance = balances.find(
                          (b) => b.symbol === token.symbol
                        );
                        return (
                          <TokenBalanceCard
                            key={token.symbol}
                            symbol={token.symbol}
                            name={token.name}
                            balance={
                              tokenBalance
                                ? Number(tokenBalance.formatted).toFixed(4)
                                : "0.0000"
                            }
                            address={token.address}
                            onDeposit={() => handleTokenDeposit(token.symbol)}
                          />
                        );
                      })}
                    </div>
                  )
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p style={{ color: "var(--subtext)" }}>
                        Connect your wallet to view balances
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Deposit Form */}
              <div ref={depositFormRef}>
                <ErrorBoundary>
                  <DepositForm
                    selectedToken={selectedDepositToken}
                    onTokenChange={setSelectedDepositToken}
                    disabled={isDisabled}
                  />
                </ErrorBoundary>
              </div>

              {/* Borrow Form */}
              <div ref={borrowFormRef}>
                <ErrorBoundary>
                  <BorrowForm
                    selectedToken={selectedBorrowToken}
                    onTokenChange={setSelectedBorrowToken}
                    disabled={isDisabled}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* Right Column - 40% */}
            <div className="lg:col-span-5 space-y-4 md:space-y-6">
              {/* Positions Table (Supplies) */}
              <ErrorBoundary>
                <PositionsTable
                  positions={positionsData}
                  onWithdraw={handlePositionWithdraw}
                  disabled={isDisabled}
                />
              </ErrorBoundary>

              {/* Withdraw Form */}
              <div ref={withdrawFormRef}>
                <ErrorBoundary>
                  <WithdrawForm
                    selectedToken={selectedWithdrawToken}
                    onTokenChange={setSelectedWithdrawToken}
                    disabled={isDisabled}
                  />
                </ErrorBoundary>
              </div>

              {/* Borrowings Table */}
              <ErrorBoundary>
                <BorrowingsTable
                  onRepay={handleBorrowingRepay}
                  disabled={isDisabled}
                />
              </ErrorBoundary>

              {/* Repay Form */}
              <div ref={repayFormRef}>
                <ErrorBoundary>
                  <RepayForm
                    selectedToken={selectedRepayToken}
                    onTokenChange={setSelectedRepayToken}
                    disabled={isDisabled}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;
