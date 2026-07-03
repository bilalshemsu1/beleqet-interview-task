"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { acceptBid } from "@/lib/freelance";

type BidData = {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export default function AcceptBidButton({
  bid,
  clientId,
  gigId,
}: {
  bid: BidData;
  clientId: string;
  gigId: string;
}) {
  const router = useRouter();
  const { status, session, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show the accept button if:
  // 1. User is authenticated
  // 2. Current user is the gig owner (client)
  // 3. Bid is still pending
  if (
    status !== "authenticated" ||
    !session ||
    !user ||
    user.id !== clientId ||
    bid.status !== "PENDING"
  ) {
    return null;
  }

  async function handleAccept() {
    if (!session) return; // satisfies TS narrowing

    if (!confirm("Accept this bid? This will reject all other bids and create a contract.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await acceptBid(session, bid.id);
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Failed to accept bid."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="mt-3 w-full rounded-full bg-brandGreen text-white text-xs font-semibold py-2 hover:bg-darkGreen transition-colors disabled:opacity-60"
      >
        {loading ? "Accepting…" : "Accept Bid"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-redAccent font-medium">{error}</p>
      )}
    </div>
  );
}
