"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";

type WalletData = {
  id: string;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  transactions: WalletTransaction[];
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

const TX_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  CREDIT_PENDING: { label: "Pending Credit", color: "text-orangeAccent", icon: Clock },
  CREDIT_AVAILABLE: { label: "Available Credit", color: "text-success", icon: CheckCircle },
  DEBIT_WITHDRAWAL: { label: "Withdrawal", color: "text-redAccent", icon: ArrowUpRight },
  DEBIT_FEE: { label: "Platform Fee", color: "text-muted", icon: ArrowDownRight },
};

export default function FreelancerWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"CHAPA" | "TELEBIRR" | "CBE_BIRR">("CHAPA");
  const [accountRef, setAccountRef] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    void loadWallet();
  }, []);

  async function loadWallet() {
    try {
      const data = await apiGet<WalletData>("/wallet");
      setWallet(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0 || !accountRef) return;

    setWithdrawing(true);
    try {
      await apiPost("/wallet/withdraw", {
        amount,
        method: withdrawMethod,
        accountRef,
      });
      setWithdrawSuccess(true);
      setShowWithdraw(false);
      setWithdrawAmount("");
      setAccountRef("");
      // Reload wallet
      await loadWallet();
      setTimeout(() => setWithdrawSuccess(false), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  const available = wallet?.availableBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const currency = wallet?.currency ?? "ETB";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">Wallet</h2>
        <p className="mt-1 text-sm text-muted">Manage your earnings and withdrawals.</p>
      </div>

      {/* Success message */}
      {withdrawSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          Withdrawal submitted successfully. Processing takes 1-2 business days.
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brandGreen">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {available.toLocaleString()} <span className="text-sm font-normal text-muted">{currency}</span>
              </p>
              <p className="text-sm text-muted">Available Balance</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orangeAccent">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {pending.toLocaleString()} <span className="text-sm font-normal text-muted">{currency}</span>
              </p>
              <p className="text-sm text-muted">Pending (3-day hold)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyanAccent">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {(available + pending).toLocaleString()} <span className="text-sm font-normal text-muted">{currency}</span>
              </p>
              <p className="text-sm text-muted">Total Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowWithdraw(!showWithdraw)}
          disabled={available <= 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          Withdraw Funds
        </button>
      </div>

      {/* Withdraw form */}
      {showWithdraw && (
        <div className="rounded-xl bg-white border border-border shadow-card p-6 space-y-4">
          <h3 className="text-cardH3 text-ink">Withdraw Funds</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Amount ({currency})
              </label>
              <input
                type="number"
                min={1}
                max={available}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
              />
              <p className="text-xs text-muted mt-1">
                Available: {available.toLocaleString()} {currency}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Payment Method
              </label>
              <select
                value={withdrawMethod}
                onChange={(e) =>
                  setWithdrawMethod(e.target.value as "CHAPA" | "TELEBIRR" | "CBE_BIRR")
                }
                className="w-full appearance-none rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
              >
                <option value="CHAPA">Chapa</option>
                <option value="TELEBIRR">TeleBirr</option>
                <option value="CBE_BIRR">CBE Birr</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Account Reference
            </label>
            <input
              type="text"
              value={accountRef}
              onChange={(e) => setAccountRef(e.target.value)}
              placeholder="Phone number or account number"
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowWithdraw(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleWithdraw()}
              disabled={withdrawing || !withdrawAmount || !accountRef}
              className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
            >
              {withdrawing ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-xl bg-white border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-cardH3 text-ink">Transaction History</h3>
        </div>
        <div className="divide-y divide-border">
          {(!wallet?.transactions || wallet.transactions.length === 0) ? (
            <div className="px-5 py-8 text-center text-muted">
              <Wallet className="mx-auto h-8 w-8 text-border mb-2" />
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            wallet.transactions.map((tx) => {
              const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.CREDIT_AVAILABLE;
              const TxIcon = cfg.icon;
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      tx.type.startsWith("CREDIT") ? "bg-success/10" : "bg-redAccent/10"
                    }`}>
                      <TxIcon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{cfg.label}</p>
                      {tx.note && (
                        <p className="text-xs text-muted truncate">{tx.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-sm font-semibold ${
                      tx.type.startsWith("CREDIT") ? "text-success" : "text-redAccent"
                    }`}>
                      {tx.type.startsWith("CREDIT") ? "+" : "-"}
                      {tx.amount.toLocaleString()} {currency}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
