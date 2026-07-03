"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiPost } from "@/lib/api-client";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Shield } from "lucide-react";

type GigInfo = {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  status: string;
  client: { id: string; firstName: string; lastName: string };
};

type EscrowResult = {
  escrowId: string;
  checkoutUrl: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
};

export default function EscrowPage({ params }: { params: { gigId: string } }) {
  const router = useRouter();
  const { status, session, user } = useAuth();

  // Redirect non-employers
  useEffect(() => {
    if (status === "anonymous") router.push("/login");
    if (user && user.role !== "EMPLOYER" && user.role !== "ADMIN") router.push("/freelance");
  }, [status, user, router]);
  const [gig, setGig] = useState<GigInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EscrowResult | null>(null);

  useEffect(() => {
    void (async () => {
      if (status !== "authenticated" || !session) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiGet<GigInfo>(`/freelance/jobs/${params.gigId}`);
        setGig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load gig details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.gigId, session, status]);

  async function handleInitiate() {
    if (!session) return;
    setInitiating(true);
    setError(null);
    try {
      const data = await apiPost<EscrowResult>(`/escrow/initiate/${params.gigId}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate escrow.");
    } finally {
      setInitiating(false);
    }
  }

  const isClient = user && gig && user.id === gig.client.id;
  const canInitiate = isClient && gig?.status === "IN_PROGRESS" && !result;

  return (
    <div className="container-page py-14 max-w-3xl">
      <Link
        href={`/freelance/${params.gigId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to gig
      </Link>

      <div className="rounded-3xl border border-border bg-white p-8 shadow-cardHover">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brandGreen/10">
            <Shield className="h-6 w-6 text-brandGreen" />
          </div>
          <div>
            <h1 className="text-pageH1">Escrow Payment</h1>
            <p className="text-muted text-sm mt-1">Fund the project to get started.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
          </div>
        ) : error && !gig ? (
          <div className="flex items-center gap-2 rounded-lg bg-redAccent/10 px-4 py-3 text-sm text-redAccent">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : gig ? (
          <div className="space-y-6">
            {/* Gig summary */}
            <div className="rounded-xl bg-pageBg border border-border p-5">
              <p className="text-xs font-semibold text-brandGreen uppercase tracking-wide">{gig.title}</p>
              <p className="text-sm text-muted mt-2">
                Client: {gig.client.firstName} {gig.client.lastName}
              </p>
              <p className="text-sm text-muted">
                Budget: {gig.currency} {gig.budgetMin.toLocaleString()} - {gig.budgetMax.toLocaleString()}
              </p>
              <p className="text-sm text-muted">Status: {gig.status}</p>
            </div>

            {/* Escrow info */}
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-ink">How Escrow Works</h3>
              <ul className="text-sm text-muted space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brandGreen shrink-0" />
                  Funds are held securely in escrow until milestones are approved
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brandGreen shrink-0" />
                  A 10% platform fee is deducted from the total amount
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brandGreen shrink-0" />
                  Freelancer receives payment after you approve each milestone
                </li>
              </ul>
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Escrow initiated successfully. Complete your payment to fund the project.
                </div>

                <div className="rounded-xl border border-border p-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Gross Amount</span>
                    <span className="font-semibold text-ink">{result.grossAmount.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Platform Fee (10%)</span>
                    <span className="text-ink">-{result.platformFee.toLocaleString()} ETB</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-ink">Net to Freelancer</span>
                    <span className="font-semibold text-brandGreen">{result.netAmount.toLocaleString()} ETB</span>
                  </div>
                </div>

                <a
                  href={result.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Proceed to Payment
                </a>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-redAccent/10 px-4 py-3 text-sm text-redAccent">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {!isClient ? (
                  <div className="rounded-lg bg-pageBg border border-border px-4 py-3 text-sm text-muted text-center">
                    Only the gig owner can initiate escrow.
                  </div>
                ) : gig.status !== "IN_PROGRESS" ? (
                  <div className="rounded-lg bg-pageBg border border-border px-4 py-3 text-sm text-muted text-center">
                    Escrow can only be initiated for gigs with an active contract (IN_PROGRESS status).
                  </div>
                ) : (
                  <button
                    onClick={() => void handleInitiate()}
                    disabled={initiating}
                    className="w-full rounded-full bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-60"
                  >
                    {initiating ? "Initiating..." : "Initiate Escrow"}
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
