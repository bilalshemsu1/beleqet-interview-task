"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
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
    category: {
      id: string;
      slug: string;
      label: string;
    };
  };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Pending", color: "bg-orangeAccent/10 text-orangeAccent", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "bg-success/10 text-success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-redAccent/10 text-redAccent", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", color: "bg-muted/10 text-muted", icon: XCircle },
};

export default function FreelancerBidsPage() {
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<MyBid[]>("/freelance/my-bids");
        setBids(data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = bids.filter((bid) => {
    const matchesSearch =
      !searchQuery ||
      bid.freelanceJob.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: bids.length,
    PENDING: bids.filter((b) => b.status === "PENDING").length,
    ACCEPTED: bids.filter((b) => b.status === "ACCEPTED").length,
    REJECTED: bids.filter((b) => b.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">My Bids</h2>
        <p className="mt-1 text-sm text-muted">Track all your submitted proposals.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by gig title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-white border border-border p-1">
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {status === "ALL" ? "All" : status} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Bid list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {bids.length === 0
              ? "You haven't submitted any bids yet."
              : "No bids match your filters."}
          </p>
          {bids.length === 0 && (
            <Link
              href="/freelance"
              className="mt-3 inline-block text-sm font-medium text-brandGreen hover:underline"
            >
              Browse gigs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bid) => {
            const cfg = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={bid.id}
                className="rounded-xl bg-white border border-border p-5 shadow-card hover:shadow-cardHover transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-cardH3 text-ink">
                        {bid.freelanceJob.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                      <span>
                        {bid.amount.toLocaleString()} {bid.freelanceJob.currency}
                      </span>
                      <span>{bid.timelineDays} days</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {bid.freelanceJob.category.label}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted line-clamp-2">
                      {bid.coverLetter}
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      Submitted {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/freelance/${bid.freelanceJob.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Gig
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
