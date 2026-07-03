import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import { getFreelanceJob, getFreelanceJobs } from "@/lib/api";
import BidForm from "@/components/BidForm";
import AcceptBidButton from "@/components/AcceptBidButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

function formatBudget(min: number, max: number, currency: string) {
  const formattedMin = new Intl.NumberFormat("en-US").format(min);
  const formattedMax = new Intl.NumberFormat("en-US").format(max);
  return `${currency} ${formattedMin} - ${formattedMax}`;
}

export default async function FreelanceDetailPage({ params }: { params: { id: string } }) {
  let job;

  try {
    job = await getFreelanceJob(params.id);
  } catch {
    notFound();
  }

  const relatedResponse = await getFreelanceJobs({ category: job.category.slug, limit: 6 });
  const related = relatedResponse.items.filter((item) => item.id !== job.id).slice(0, 3);

  return (
    <div className="container-page py-10">
      <Link href="/freelance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to freelance gigs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-brandGreen uppercase tracking-wide">{job.category.label}</p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug mt-2">{job.title}</h1>
                <p className="text-muted mt-2">Posted by {job.client.firstName} {job.client.lastName}</p>
              </div>
              <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-3 py-1.5 text-sm">
                {job.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.locationPreference || "Remote / Flexible"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {job.deadlineDays} day{job.deadlineDays === 1 ? "" : "s"} deadline
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {job._count?.bids ?? 0} bids
              </span>
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Project Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-pageBg border border-border p-4">
                <p className="text-muted text-xs uppercase tracking-wide">Budget</p>
                <p className="text-ink font-semibold mt-1">{formatBudget(job.budgetMin, job.budgetMax, job.currency)}</p>
              </div>
              <div className="rounded-xl bg-pageBg border border-border p-4">
                <p className="text-muted text-xs uppercase tracking-wide">Pricing Type</p>
                <p className="text-ink font-semibold mt-1">{job.pricingType}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span key={skill} className="text-xs font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Similar Gigs</h3>
              <div className="space-y-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/freelance/${item.id}`} className="block rounded-lg hover:bg-pageBg p-2 -mx-2 transition-colors">
                    <p className="text-sm font-semibold text-ink line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">{item.category.label} · {formatBudget(item.budgetMin, item.budgetMax, item.currency)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <BidForm gigId={job.id} />

          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Client</h3>
            <p className="text-sm text-muted">{job.client.firstName} {job.client.lastName}</p>
          </div>

          {job.bids.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Bids ({job.bids.length})</h3>
              <div className="space-y-4">
                {job.bids.map((bid) => (
                  <div key={bid.id} className="rounded-xl bg-pageBg border border-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{bid.freelancer.firstName} {bid.freelancer.lastName}</p>
                      <span className="text-xs font-semibold text-brandGreen">{formatBudget(bid.amount, bid.amount, job.currency)}</span>
                    </div>
                    <p className="text-xs text-muted mt-2">{bid.timelineDays} day delivery · {bid.status}</p>
                    <AcceptBidButton bid={bid} clientId={job.clientId} gigId={job.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
