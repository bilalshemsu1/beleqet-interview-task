"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  approveMilestone,
  submitDeliverable,
  createDispute,
  getContract,
  type FreelanceContract,
} from "@/lib/freelance";
import { CreditCard, Upload, AlertTriangle } from "lucide-react";

function formatCurrency(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { status, session, user } = useAuth();
  const [contract, setContract] = useState<FreelanceContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Deliverable form state
  const [deliverableFileUrl, setDeliverableFileUrl] = useState("");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [submittingDeliverable, setSubmittingDeliverable] = useState<string | null>(null);

  // Dispute form state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    void (async () => {
      if (status !== "authenticated" || !session) {
        setLoading(false);
        return;
      }

      try {
        const response = await getContract(session, params.id);
        setContract(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load contract.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, session, status]);

  async function handleApprove(milestoneId: string) {
    if (!session) return;
    try {
      const response = await approveMilestone(session, milestoneId);
      setActionMessage(`Milestone ${response.status.toLowerCase()} successfully.`);
      const refreshed = await getContract(session, params.id);
      setContract(refreshed);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve milestone.");
    }
  }

  async function handleSubmitDeliverable(milestoneId: string) {
    if (!session) return;
    setSubmittingDeliverable(milestoneId);
    try {
      await submitDeliverable(session, milestoneId, {
        fileUrl: deliverableFileUrl || undefined,
        notes: deliverableNotes || undefined,
      });
      setActionMessage("Deliverable submitted successfully.");
      setDeliverableFileUrl("");
      setDeliverableNotes("");
      const refreshed = await getContract(session, params.id);
      setContract(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit deliverable.");
    } finally {
      setSubmittingDeliverable(null);
    }
  }

  async function handleCreateDispute() {
    if (!session || !contract) return;
    setSubmittingDispute(true);
    try {
      await createDispute(session, contract.id, {
        reason: disputeReason,
        evidenceUrls: disputeEvidence ? disputeEvidence.split("\n").filter(Boolean) : [],
      });
      setActionMessage("Dispute submitted. Our team will review it shortly.");
      setShowDisputeForm(false);
      setDisputeReason("");
      setDisputeEvidence("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  }

  const isFreelancer = user && contract && user.id === contract.freelancerId;
  const isClient = user && contract && user.id === contract.clientId;

  return (
    <div className="container-page py-14 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-pageH1">Contract</h1>
          <p className="text-muted mt-3">Track milestones and project status.</p>
        </div>
        <Link href="/dashboard/freelancer/contracts" className="text-sm font-semibold text-brandGreen hover:underline">
          Back to contracts
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-muted">Loading contract...</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-redAccent">{error}</div>
      ) : contract ? (
        <div className="mt-8 space-y-6">
          {/* Contract summary */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-brandGreen uppercase tracking-wide">{contract.freelanceJob.title}</p>
                <h2 className="text-xl font-bold text-ink mt-1">{formatCurrency(contract.currency, contract.agreedAmount)}</h2>
                <p className="text-sm text-muted mt-2">
                  Client: {contract.client.firstName} {contract.client.lastName} · Freelancer: {contract.freelancer.firstName} {contract.freelancer.lastName}
                </p>
              </div>
              <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-3 py-1 text-sm">{contract.status}</span>
            </div>

            {actionMessage && <p className="mt-4 text-sm text-brandGreen font-medium">{actionMessage}</p>}

            {isClient && (
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/freelance/escrow/${contract.freelanceJobId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-brandGreen px-4 py-2 text-sm font-semibold text-brandGreen hover:bg-brandGreen hover:text-white transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Fund Contract
                </Link>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ink">Milestones</h3>
            {contract.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="text-lg font-semibold text-ink">{milestone.title}</h4>
                    <p className="text-sm text-muted mt-2">{milestone.description}</p>
                  </div>
                  <span className="rounded-full bg-pageBg text-ink font-semibold px-3 py-1 text-sm">{milestone.status}</span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-pageBg border border-border p-4">
                    <p className="text-xs text-muted uppercase tracking-wide">Amount</p>
                    <p className="text-ink font-semibold mt-1">{formatCurrency(contract.currency, milestone.amount)}</p>
                  </div>
                  <div className="rounded-xl bg-pageBg border border-border p-4">
                    <p className="text-xs text-muted uppercase tracking-wide">Deadline</p>
                    <p className="text-ink font-semibold mt-1">{new Date(milestone.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-xl bg-pageBg border border-border p-4">
                    <p className="text-xs text-muted uppercase tracking-wide">Deliverables</p>
                    <p className="text-ink font-semibold mt-1">{milestone.deliverables.length}</p>
                  </div>
                </div>

                {/* Existing deliverables */}
                {milestone.deliverables.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">Submitted Work</p>
                    {milestone.deliverables.map((d) => (
                      <div key={d.id} className="rounded-lg bg-pageBg border border-border p-3 text-sm">
                        {d.fileUrl && (
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brandGreen hover:underline">
                            View deliverable file
                          </a>
                        )}
                        {d.notes && <p className="text-muted mt-1">{d.notes}</p>}
                        <p className="text-xs text-muted/70 mt-1">Submitted {new Date(d.submittedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {/* Client: approve */}
                  {isClient && milestone.status !== "APPROVED" && milestone.status === "SUBMITTED" && (
                    <button
                      onClick={() => void handleApprove(milestone.id)}
                      className="inline-flex items-center rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                    >
                      Approve Milestone
                    </button>
                  )}

                  {/* Freelancer: submit deliverable */}
                  {isFreelancer && (milestone.status === "IN_PROGRESS" || milestone.status === "REVISION_REQUESTED") && (
                    <div className="w-full mt-3 p-4 rounded-xl bg-pageBg border border-border">
                      <p className="text-sm font-semibold text-ink mb-3">Submit Deliverable</p>
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={deliverableFileUrl}
                          onChange={(e) => setDeliverableFileUrl(e.target.value)}
                          placeholder="File URL (Google Drive, Dropbox, etc.)"
                          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen"
                        />
                        <textarea
                          value={deliverableNotes}
                          onChange={(e) => setDeliverableNotes(e.target.value)}
                          placeholder="Notes about this deliverable..."
                          rows={3}
                          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen resize-none"
                        />
                        <button
                          onClick={() => void handleSubmitDeliverable(milestone.id)}
                          disabled={submittingDeliverable === milestone.id}
                          className="inline-flex items-center gap-2 rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-60"
                        >
                          <Upload className="h-4 w-4" />
                          {submittingDeliverable === milestone.id ? "Submitting..." : "Submit Deliverable"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dispute section */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">Dispute</h3>
              {contract.status !== "COMPLETED" && (
                <button
                  onClick={() => setShowDisputeForm(!showDisputeForm)}
                  className="inline-flex items-center gap-2 rounded-lg border border-redAccent/30 px-3 py-2 text-sm font-medium text-redAccent hover:bg-redAccent/5 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Raise Dispute
                </button>
              )}
            </div>

            {showDisputeForm && (
              <div className="mt-4 space-y-4">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue in detail (minimum 20 characters)..."
                  rows={4}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-brandGreen resize-none"
                />
                <input
                  type="text"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Evidence URLs (one per line, optional)"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-brandGreen"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDisputeForm(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleCreateDispute()}
                    disabled={submittingDispute || disputeReason.length < 20}
                    className="rounded-lg bg-redAccent px-4 py-2 text-sm font-semibold text-white hover:bg-redAccent/90 transition-colors disabled:opacity-50"
                  >
                    {submittingDispute ? "Submitting..." : "Submit Dispute"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
