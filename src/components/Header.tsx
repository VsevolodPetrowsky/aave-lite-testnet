import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { formatAddress } from "../shared/utils";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto px-4 md:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12L22 7M12 12L2 7M12 12V22"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="font-semibold text-sm md:text-base"
              style={{ color: "var(--text)" }}
            >
              Aave Lite{" "}
              <span
                className="hidden sm:inline"
                style={{ color: "var(--subtext)" }}
              >
                (Testnet)
              </span>
            </span>
          </div>

          {/* Right: Network Switcher + Wallet Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {isConnected && <NetworkSwitcher />}
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden sm:inline text-sm md:text-base"
                  style={{ color: "var(--text)" }}
                >
                  {formatAddress(address)}
                </span>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                size="sm"
                className="md:text-base"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
