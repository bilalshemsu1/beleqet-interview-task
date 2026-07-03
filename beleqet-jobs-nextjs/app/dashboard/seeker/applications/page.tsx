"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Calendar,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

type ApplicationScore = {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  cultureFitScore: number | null;
  reasoning: string | null;
};

type ApplicationJob = {
  id: string;
  title: string;
  location: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  companyName: string | null;
  company: { id: string; name: string; logoUrl: string | null } | null;
};

type MyApplication = {
  id: string;
  jobId: string;
  status: string;
  interviewSlot: string | null;
  createdAt: string;
  job: ApplicationJob;
  score: ApplicationScore | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SUBMITTED: { label: "Submitted", color: "text-cyanAccent", bg: "bg-cyanAccent/10", icon: FileText },
  SCREENING: { label: "Screening", color: "text-orangeAccent", bg: "bg-orangeAccent/10", icon: Clock },
  SHORTLISTED: { label: "Shortlisted", color: "text-purpleAccent", bg: "bg-purpleAccent/10", icon: Star },
  INTERVIEW_SCHEDULED: { label: "Interview", color: "text-brandGreen", bg: "bg-brandGreen/10", icon: Calendar },
  OFFERED: { label: "Offered", color: "text-success", bg: "bg-success/10", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "text-redAccent", bg: "bg-redAccent/10", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", color: "text-muted", bg: "bg-muted/10", icon: XCircle },
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-20">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-ink w-10 text-right">{value.toFixed(0)}%</span>
    </div>
  );
}

export default function SeekerApplicationsPage() {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<MyApplication[]>("/applications/my");
        setApplications(data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.job.company?.name ?? app.job.companyName ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts: Record<string, number> = { ALL: applications.length };
  for (const app of applications) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
  }

  const filterOptions = ["ALL", "SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED", "REJECTED"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">My Applications</h2>
        <p className="mt-1 text-sm text-muted">Track all your job applications and AI screening scores.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-white border border-border p-1 overflow-x-auto">
          {filterOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {status === "ALL" ? "All" : status.replace(/_/g, " ")} ({statusCounts[status] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Application list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {applications.length === 0
              ? "You haven't submitted any applications yet."
              : "No applications match your filters."}
          </p>
          {applications.length === 0 && (
            <Link href="/jobs" className="mt-3 inline-block text-sm font-medium text-brandGreen hover:underline">
              Browse jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.SUBMITTED;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === app.id;
            const salaryRange =
              app.job.salaryMin && app.job.salaryMax
                ? `${app.job.salaryMin.toLocaleString()} – ${app.job.salaryMax.toLocaleString()} ${app.job.currency}`
                : app.job.salaryMin
                  ? `From ${app.job.salaryMin.toLocaleString()} ${app.job.currency}`
                  : null;

            return (
              <div
                key={app.id}
                className="rounded-xl bg-white border border-border p-5 shadow-card hover:shadow-cardHover transition-shadow"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-cardH3 text-ink">{app.job.title}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      {app.score && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brandGreen/10 px-2 py-0.5 text-xs font-medium text-brandGreen">
                          <TrendingUp className="h-3 w-3" />
                          {app.score.overallScore.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                      <span>{app.job.company?.name ?? app.job.companyName ?? "Unknown"}</span>
                      {app.job.location && <span>{app.job.location}</span>}
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{app.job.type}</span>
                      {salaryRange && <span>{salaryRange}</span>}
                    </div>

                    {app.interviewSlot && (
                      <p className="mt-2 text-xs text-brandGreen font-medium">
                        📅 Interview: {new Date(app.interviewSlot).toLocaleString()}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-muted">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/jobs/${app.job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Job
                  </Link>
                </div>

                {/* Expanded AI Score */}
                {isExpanded && app.score && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-ink mb-3">AI Screening Score</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <ScoreBar label="Overall" value={app.score.overallScore} color="bg-brandGreen" />
                        <ScoreBar label="Skills" value={app.score.skillScore} color="bg-cyanAccent" />
                        <ScoreBar label="Experience" value={app.score.experienceScore} color="bg-purpleAccent" />
                        {app.score.cultureFitScore !== null && (
                          <ScoreBar label="Culture Fit" value={app.score.cultureFitScore} color="bg-orangeAccent" />
                        )}
                      </div>
                      {app.score.reasoning && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-medium text-ink mb-1">Reasoning</p>
                          <p className="text-xs text-muted leading-relaxed">{app.score.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExpanded && !app.score && (
                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <p className="text-sm text-muted">AI screening score not yet available.</p>
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
