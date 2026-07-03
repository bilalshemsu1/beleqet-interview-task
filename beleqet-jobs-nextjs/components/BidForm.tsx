"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { submitBid } from "@/lib/freelance";

export default function BidForm({ gigId }: { gigId: string }) {
  const { status, session } = useAuth();
  const [amount, setAmount] = useState("");
  const [timelineDays, setTimelineDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!session || status !== "authenticated") {
      setError("Please log in to submit a bid.");
      setLoading(false);
      return;
    }

    try {
      await submitBid(session, gigId, {
        amount: Number(amount),
        timelineDays: Number(timelineDays),
        coverLetter,
      });
      setMessage("Your bid was submitted successfully.");
      setAmount("");
      setTimelineDays("");
      setCoverLetter("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-sm font-semibold text-ink">Submit Your Bid</h3>
      <p className="text-sm text-muted mt-2">Send a proposal directly to the client.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Amount</label>
            <input
              required
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Timeline (days)</label>
            <input
              required
              type="number"
              min="1"
              value={timelineDays}
              onChange={(event) => setTimelineDays(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Cover Letter</label>
          <textarea
            required
            rows={5}
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        {message && <p className="text-sm text-brandGreen font-medium">{message}</p>}
        {error && <p className="text-sm text-redAccent font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Bid"}
        </button>
      </form>
    </div>
  );
}
