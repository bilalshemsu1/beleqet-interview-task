"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import {
  Wallet,
  FileText,
  Briefcase,
  TrendingUp,
  Clock,
  Star,
  ExternalLink,
} from "lucide-react";

type MyBid = {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  createdAt: string;
  freelanceJob: {
    id: string;
    title: string;
    status: string;
    currency: string;
  };
};

type WalletData = {
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  transactions: { id: string; amount: number; type: string; createdAt: string }[];
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
          {sub && <p className="text-xs text-muted/70">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function FreelancerOverviewPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [bidsData, walletData] = await Promise.allSettled([
          apiGet<MyBid[]>("/freelance/my-bids"),
          apiGet<WalletData>("/wallet"),
        ]);
        if (bidsData.status === "fulfilled") setBids(bidsData.value ?? []);
        if (walletData.status === "fulfilled") setWallet(walletData.value);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  const pendingBids = bids.filter((b) => b.status === "PENDING").length;
  const acceptedBids = bids.filter((b) => b.status === "ACCEPTED").length;
  const totalEarnings = (wallet?.availableBalance ?? 0) + (wallet?.pendingBalance ?? 0);
  const recentBids = [...bids]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusColors: Record<string, string> = {
    PENDING: "bg-orangeAccent/10 text-orangeAccent",
    ACCEPTED: "bg-success/10 text-success",
    REJECTED: "bg-redAccent/10 text-redAccent",
    WITHDRAWN: "bg-muted/10 text-muted",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sectionH2 text-ink">Welcome back, {user?.firstName}</h2>
        <p className="mt-1 text-muted">Here&apos;s your freelance activity overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Balance"
          value={`${(wallet?.availableBalance ?? 0).toLocaleString()} ${wallet?.currency ?? "ETB"}`}
          icon={Wallet}
          color="bg-brandGreen"
        />
        <StatCard
          label="Pending Balance"
          value={`${(wallet?.pendingBalance ?? 0).toLocaleString()} ${wallet?.currency ?? "ETB"}`}
          sub="3-day hold"
          icon={Clock}
          color="bg-orangeAccent"
        />
        <StatCard label="Total Bids" value={bids.length} icon={FileText} color="bg-cyanAccent" />
        <StatCard label="Accepted Bids" value={acceptedBids} icon={Star} color="bg-purpleAccent" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/freelance"
          className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          Browse Gigs
        </Link>
        <Link
          href="/dashboard/freelancer/bids"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <FileText className="h-4 w-4" />
          My Bids
        </Link>
        <Link
          href="/dashboard/freelancer/wallet"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <Wallet className="h-4 w-4" />
          Wallet
        </Link>
      </div>

      {/* Recent Bids */}
      <div className="rounded-xl bg-white border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-cardH3 text-ink">Recent Bids</h3>
          <Link href="/dashboard/freelancer/bids" className="text-sm font-medium text-brandGreen hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentBids.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted">
              <FileText className="mx-auto h-8 w-8 text-border mb-2" />
              <p className="text-sm">No bids submitted yet.</p>
              <Link href="/freelance" className="mt-2 inline-block text-sm font-medium text-brandGreen hover:underline">
                Browse gigs
              </Link>
            </div>
          ) : (
            recentBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{bid.freelanceJob.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {bid.amount.toLocaleString()} {bid.freelanceJob.currency} · {bid.timelineDays} days
                  </p>
                </div>
                <span className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[bid.status] ?? "bg-muted/10 text-muted"}`}>
                  {bid.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
