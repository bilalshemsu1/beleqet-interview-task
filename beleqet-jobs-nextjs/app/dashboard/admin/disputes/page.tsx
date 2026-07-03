"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import {
  Gavel,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type DisputeContract = {
  id: string;
  agreedAmount: number;
  currency: string;
  status: string;
  freelanceJob: { id: string; title: string };
  client: { id: string; firstName: string; lastName: string };
  freelancer: { id: string; firstName: string; lastName: string };
};

type Dispute = {
  id: string;
  contractId: string;
  raisedById: string;
  reason: string;
  evidenceUrls: string[];
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  contract: DisputeContract;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      const data = await apiGet<Dispute[]>("/admin/escrow/disputes");
      setDisputes(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(disputeId: string) {
    if (resolutionText.length < 10) return;
    setSubmitting(true);
    try {
      await apiPatch(`/admin/disputes/${disputeId}/resolve`, {
        resolution: resolutionText,
      });
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, resolution: resolutionText, resolvedAt: new Date().toISOString() }
            : d,
        ),
      );
      setResolvingId(null);
      setResolutionText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve dispute");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = disputes.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.contract.freelanceJob.title.toLowerCase().includes(q) ||
      d.contract.client.firstName.toLowerCase().includes(q) ||
      d.contract.client.lastName.toLowerCase().includes(q) ||
      d.contract.freelancer.firstName.toLowerCase().includes(q) ||
      d.contract.freelancer.lastName.toLowerCase().includes(q) ||
      d.reason.toLowerCase().includes(q)
    );
  });

  const openDisputes = disputes.filter((d) => !d.resolvedAt).length;
  const resolvedDisputes = disputes.filter((d) => d.resolvedAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">Dispute Resolution</h2>
        <p className="mt-1 text-sm text-muted">
          Review and resolve escrow disputes between clients and freelancers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orangeAccent">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{openDisputes}</p>
              <p className="text-sm text-muted">Open Disputes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{resolvedDisputes}</p>
              <p className="text-sm text-muted">Resolved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brandGreen">
              <Gavel className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{disputes.length}</p>
              <p className="text-sm text-muted">Total Disputes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search disputes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
        />
      </div>

      {/* Dispute list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <Gavel className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {disputes.length === 0 ? "No disputes filed yet." : "No disputes match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => {
            const isResolved = !!dispute.resolvedAt;
            const isExpanded = expandedId === dispute.id;
            const isResolving = resolvingId === dispute.id;

            return (
              <div
                key={dispute.id}
                className="rounded-xl bg-white border border-border shadow-card overflow-hidden"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-cardH3 text-ink">
                        {dispute.contract.freelanceJob.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isResolved
                            ? "bg-success/10 text-success"
                            : "bg-orangeAccent/10 text-orangeAccent"
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {isResolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                      <span>
                        Client: {dispute.contract.client.firstName} {dispute.contract.client.lastName}
                      </span>
                      <span>
                        Freelancer: {dispute.contract.freelancer.firstName} {dispute.contract.freelancer.lastName}
                      </span>
                      <span className="font-semibold text-ink">
                        {dispute.contract.agreedAmount.toLocaleString()} {dispute.contract.currency}
                      </span>
                      <span>
                        Filed {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4 bg-gray-50/30">
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                        Dispute Reason
                      </p>
                      <p className="text-sm text-ink">{dispute.reason}</p>
                    </div>

                    {dispute.evidenceUrls.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                          Evidence
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidenceUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brandGreen underline hover:text-darkGreen"
                            >
                              Evidence {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {isResolved ? (
                      <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                        <p className="text-xs font-semibold text-success mb-1">Resolution</p>
                        <p className="text-sm text-ink">{dispute.resolution}</p>
                        <p className="text-xs text-muted mt-1">
                          Resolved {new Date(dispute.resolvedAt!).toLocaleString()}
                        </p>
                      </div>
                    ) : isResolving ? (
                      <div className="rounded-lg bg-white border border-border p-4 space-y-3">
                        <label className="block text-xs font-semibold text-ink">
                          Resolution (min 10 characters)
                        </label>
                        <textarea
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          rows={3}
                          placeholder="Describe how this dispute was resolved..."
                          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setResolvingId(null);
                              setResolutionText("");
                            }}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void handleResolve(dispute.id)}
                            disabled={submitting || resolutionText.length < 10}
                            className="inline-flex items-center gap-1 rounded-lg bg-brandGreen px-4 py-2 text-xs font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
                          >
                            {submitting ? "Resolving..." : "Resolve Dispute"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingId(dispute.id);
                          setResolutionText("");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                      >
                        <Gavel className="h-4 w-4" />
                        Resolve Dispute
                      </button>
                    )}
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
