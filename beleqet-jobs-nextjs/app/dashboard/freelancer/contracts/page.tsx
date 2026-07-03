"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  FileText,
  Check,
  ExternalLink,
  Search,
} from "lucide-react";

type ContractMilestone = {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  deadline: string;
  status: string;
  approvedAt?: string | null;
  deliverables: { id: string; fileUrl?: string | null; notes?: string | null; submittedAt: string }[];
};

type FreelanceContract = {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  freelanceJob: {
    id: string;
    title: string;
    status: string;
    currency: string;
  };
  client: { id: string; firstName: string; lastName: string };
  freelancer: { id: string; firstName: string; lastName: string };
  milestones: ContractMilestone[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-success", bg: "bg-success/10" },
  COMPLETED: { label: "Completed", color: "text-brandGreen", bg: "bg-brandGreen/10" },
  DISPUTED: { label: "Disputed", color: "text-redAccent", bg: "bg-redAccent/10" },
  CANCELLED: { label: "Cancelled", color: "text-muted", bg: "bg-muted/10" },
};

const MILESTONE_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Pending", color: "text-muted", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-cyanAccent", icon: Briefcase },
  SUBMITTED: { label: "Submitted", color: "text-orangeAccent", icon: FileText },
  APPROVED: { label: "Approved", color: "text-success", icon: CheckCircle },
  REVISION_REQUESTED: { label: "Revision", color: "text-redAccent", icon: AlertCircle },
};

export default function FreelancerContractsPage() {
  const [contracts, setContracts] = useState<FreelanceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Contract lookup by ID
  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    void loadStoredContracts();
  }, []);

  async function loadStoredContracts() {
    // Contracts are stored in localStorage when bids are accepted
    const stored = localStorage.getItem("beleqet.contracts");
    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const contractIds: string[] = JSON.parse(stored);
      const results = await Promise.allSettled(
        contractIds.map((id) => apiGet<FreelanceContract>(`/freelance/contracts/${id}`)),
      );

      const fetched = results
        .filter((r): r is PromiseFulfilledResult<FreelanceContract> => r.status === "fulfilled")
        .map((r) => r.value);

      setContracts(fetched);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup() {
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    try {
      const contract = await apiGet<FreelanceContract>(`/freelance/contracts/${lookupId.trim()}`);

      // Save to localStorage for future loads
      const stored = localStorage.getItem("beleqet.contracts");
      const ids: string[] = stored ? JSON.parse(stored) : [];
      if (!ids.includes(contract.id)) {
        ids.push(contract.id);
        localStorage.setItem("beleqet.contracts", JSON.stringify(ids));
      }

      // Add to list if not already present
      setContracts((prev) => {
        if (prev.some((c) => c.id === contract.id)) return prev;
        return [...prev, contract];
      });
      setLookupId("");
    } catch {
      setLookupError("Contract not found. Please check the ID and try again.");
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">My Contracts</h2>
        <p className="mt-1 text-sm text-muted">
          View and manage your active contracts with clients.
        </p>
      </div>

      {/* Contract lookup */}
      <div className="rounded-xl bg-white border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Look up a contract</h3>
        <p className="text-xs text-muted mb-3">
          When a client accepts your bid, you&apos;ll receive a contract ID. Enter it here to track the contract.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleLookup()}
              placeholder="Enter contract ID"
              className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
          <button
            onClick={() => void handleLookup()}
            disabled={lookupLoading || !lookupId.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
          >
            {lookupLoading ? "Looking..." : "Find Contract"}
          </button>
        </div>
        {lookupError && (
          <p className="mt-2 text-xs text-redAccent">{lookupError}</p>
        )}
      </div>

      {/* Contract list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">No contracts yet.</p>
          <p className="text-sm text-muted mt-1">
            Contracts are created when a client accepts your bid on a gig.
          </p>
          <Link
            href="/freelance"
            className="mt-3 inline-block text-sm font-medium text-brandGreen hover:underline"
          >
            Browse gigs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const cfg = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.ACTIVE;
            const isExpanded = expandedId === contract.id;
            const completedMilestones = contract.milestones.filter(
              (m) => m.status === "APPROVED",
            ).length;
            const totalMilestones = contract.milestones.length;

            return (
              <div
                key={contract.id}
                className="rounded-xl bg-white border border-border shadow-card overflow-hidden"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-cardH3 text-ink">
                        {contract.freelanceJob.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                      <span className="font-semibold text-ink">
                        {contract.agreedAmount.toLocaleString()} {contract.currency}
                      </span>
                      <span>
                        Client: {contract.client.firstName} {contract.client.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Started {new Date(contract.startedAt).toLocaleDateString()}
                      </span>
                      {totalMilestones > 0 && (
                        <span>
                          {completedMilestones}/{totalMilestones} milestones
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/freelance/${contract.freelanceJob.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Gig
                    </Link>
                    <ChevronRight
                      className={`h-5 w-5 text-muted transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded milestones */}
                {isExpanded && contract.milestones.length > 0 && (
                  <div className="border-t border-border px-5 py-4 space-y-3 bg-gray-50/30">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                      Milestones
                    </p>
                    {contract.milestones.map((milestone) => {
                      const mCfg =
                        MILESTONE_STATUS[milestone.status] ??
                        MILESTONE_STATUS.PENDING;
                      const MIcon = mCfg.icon;

                      return (
                        <div
                          key={milestone.id}
                          className="rounded-lg border border-border bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-ink">
                                  {milestone.title}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${mCfg.color}`}
                                >
                                  <MIcon className="h-3 w-3" />
                                  {mCfg.label}
                                </span>
                              </div>
                              {milestone.description && (
                                <p className="text-xs text-muted mt-1">
                                  {milestone.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                <span>
                                  {milestone.amount.toLocaleString()}{" "}
                                  {contract.currency}
                                </span>
                                <span>
                                  Due{" "}
                                  {new Date(milestone.deadline).toLocaleDateString()}
                                </span>
                                {milestone.deliverables.length > 0 && (
                                  <span className="flex items-center gap-1 text-success">
                                    <Check className="h-3 w-3" />
                                    {milestone.deliverables.length} deliverable(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && contract.milestones.length === 0 && (
                  <div className="border-t border-border px-5 py-4 bg-gray-50/30">
                    <p className="text-sm text-muted text-center">
                      No milestones defined yet. The client will add milestones after contract creation.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
