"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getMyBids, type MyBid } from "@/lib/freelance";

export default function MyBidsPage() {
  const { status, session } = useAuth();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (status !== "authenticated" || !session) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMyBids(session);
        setBids(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load bids.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session, status]);

  return (
    <div className="container-page py-14 max-w-5xl">
      <h1 className="text-pageH1">My Bids</h1>
      <p className="text-muted mt-3">Track every bid you have submitted.</p>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-muted">Loading bids...</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-redAccent">{error}</div>
      ) : bids.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-muted">
          You have not submitted any bids yet. <Link href="/freelance" className="text-brandGreen font-semibold hover:underline">Browse gigs</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4">
          {bids.map((bid) => (
            <div key={bid.id} className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-brandGreen uppercase tracking-wide">{bid.freelanceJob.category.label}</p>
                  <h2 className="text-lg font-bold text-ink mt-1">{bid.freelanceJob.title}</h2>
                  <p className="text-sm text-muted mt-2">{bid.coverLetter}</p>
                </div>
                <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-3 py-1 text-sm">{bid.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-pageBg border border-border p-4">
                  <p className="text-xs text-muted uppercase tracking-wide">Amount</p>
                  <p className="text-ink font-semibold mt-1">{bid.freelanceJob.currency} {bid.amount}</p>
                </div>
                <div className="rounded-xl bg-pageBg border border-border p-4">
                  <p className="text-xs text-muted uppercase tracking-wide">Timeline</p>
                  <p className="text-ink font-semibold mt-1">{bid.timelineDays} days</p>
                </div>
                <div className="rounded-xl bg-pageBg border border-border p-4">
                  <p className="text-xs text-muted uppercase tracking-wide">Status</p>
                  <p className="text-ink font-semibold mt-1">{bid.freelanceJob.status}</p>
                </div>
              </div>

              <div className="mt-4">
                <Link href={`/freelance/${bid.freelanceJob.id}`} className="text-sm font-semibold text-brandGreen hover:underline">View gig</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
