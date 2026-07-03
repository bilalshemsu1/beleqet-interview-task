import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import type { FreelanceJobListItem } from "@/lib/api";

function formatBudget(job: FreelanceJobListItem) {
  const min = new Intl.NumberFormat("en-US").format(job.budgetMin);
  const max = new Intl.NumberFormat("en-US").format(job.budgetMax);
  return `${job.currency} ${min} - ${max}`;
}

function formatDeadline(days: number) {
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function FreelanceCard({ job }: { job: FreelanceJobListItem }) {
  return (
    <Link
      href={`/freelance/${job.id}`}
      className="group flex flex-col rounded-xl border border-border bg-white p-5 hover:border-brandGreen hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-brandGreen uppercase tracking-wide">{job.category.label}</p>
          <h3 className="text-cardH3 mt-2 text-ink leading-snug line-clamp-2">{job.title}</h3>
        </div>
        <span className="rounded-full bg-brandGreen/10 text-brandGreen text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
          {job.status}
        </span>
      </div>

      <p className="text-sm text-muted mt-3 line-clamp-3">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="text-[11px] font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.locationPreference || "Remote / Flexible"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          Deadline in {formatDeadline(job.deadlineDays)}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{formatBudget(job)}</span>
        <span className="text-[11px] text-muted">{job._count?.bids ?? 0} bids</span>
      </div>
    </Link>
  );
}
