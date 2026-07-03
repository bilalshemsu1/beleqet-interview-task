import { Suspense } from "react";
import type { Metadata } from "next";
import FreelanceListing from "@/components/FreelanceListing";
import { getFreelanceJobs } from "@/lib/api";

export const metadata: Metadata = {
  title: "Freelance | Beleqet Jobs",
};

export default async function FreelancePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const { q, category } = searchParams;
  const response = await getFreelanceJobs({ q, category, limit: 24 });

  return (
    <Suspense
      fallback={
        <div className="container-page py-20 text-center text-muted">
          Loading gigs…
        </div>
      }
    >
      <FreelanceListing jobs={response.items} />
    </Suspense>
  );
}
