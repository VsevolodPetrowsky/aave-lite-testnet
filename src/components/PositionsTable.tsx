import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { formatAddress, copyToClipboard } from "../shared/utils";

interface Position {
  asset: string;
  aTokenAddress: string | null;
  balance: string;
}

interface PositionsTableProps {
  positions: Position[];
  onWithdraw: (asset: string) => void;
  disabled?: boolean;
}

export function PositionsTable({
  positions,
  onWithdraw,
  disabled = false,
}: PositionsTableProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your positions (aTokens)</CardTitle>
        <CardDescription>
          View your deposited assets and interest-bearing aTokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="hidden md:table-cell">
                  aToken Address
                </TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8"
                    style={{ color: "var(--subtext)" }}
                  >
                    No positions yet. Deposit tokens to start earning interest.
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position.asset}>
                    <TableCell>
                      <div>
                        <span
                          className="font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          a{position.asset}
                        </span>
                        {position.aTokenAddress && (
                          <div className="md:hidden flex items-center gap-1 mt-1">
                            <span
                              className="text-xs"
                              style={{ color: "var(--subtext)" }}
                            >
                              {formatAddress(position.aTokenAddress)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(position.aTokenAddress!)}
                              className="p-0.5 hover:opacity-70 transition-opacity"
                              style={{ color: "var(--subtext)" }}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {position.aTokenAddress ? (
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--subtext)" }}>
                            {formatAddress(position.aTokenAddress)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(position.aTokenAddress!)}
                            className="p-0.5 hover:opacity-70 transition-opacity"
                            style={{ color: "var(--subtext)" }}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--subtext)" }}>-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span style={{ color: "var(--text)" }}>
                        {position.balance}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onWithdraw(position.asset)}
                        disabled={
                          disabled || !(parseFloat(position.balance) > 0)
                        }
                      >
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
