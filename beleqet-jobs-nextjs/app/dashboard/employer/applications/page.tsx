"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import {
  Users,
  Search,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
} from "lucide-react";

type Application = {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  status: string;
  interviewSlot: string | null;
  notes: string | null;
  createdAt: string;
  expectedSalary: number | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
  };
  score: {
    overallScore: number;
    skillScore: number;
    experienceScore: number;
    cultureFitScore: number | null;
    reasoning: string | null;
  } | null;
};

type JobOption = {
  id: string;
  title: string;
  _count?: { applications: number };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  SUBMITTED: { label: "Submitted", color: "bg-cyanAccent/10 text-cyanAccent", icon: Clock },
  SCREENING: { label: "Screening", color: "bg-purpleAccent/10 text-purpleAccent", icon: Search },
  SHORTLISTED: { label: "Shortlisted", color: "bg-success/10 text-success", icon: Star },
  INTERVIEW_SCHEDULED: { label: "Interview", color: "bg-brandGreen/10 text-brandGreen", icon: Clock },
  OFFERED: { label: "Offered", color: "bg-brandGreen/10 text-brandGreen", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-redAccent/10 text-redAccent", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", color: "bg-muted/10 text-muted", icon: XCircle },
};

export default function EmployerApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" /></div>}>
      <ApplicationsContent />
    </Suspense>
  );
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId") ?? "";

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load employer's jobs for the dropdown
  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<{ items: JobOption[]; total: number }>("/jobs/my");
        setJobs(data.items ?? []);
      } catch {
        // Silent
      }
    })();
  }, []);

  // Load applications when job is selected
  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const data = await apiGet<Application[]>(`/applications/job/${selectedJobId}`);
        setApplications(data ?? []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedJobId]);

  async function handleStatusChange(applicationId: string, newStatus: string) {
    setUpdatingId(applicationId);
    try {
      await apiPatch(`/applications/${applicationId}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = applications.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.user.firstName.toLowerCase().includes(q) ||
      a.user.lastName.toLowerCase().includes(q) ||
      a.user.email.toLowerCase().includes(q)
    );
  });

  function getScoreColor(score: number) {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-brandGreen";
    if (score >= 40) return "text-orangeAccent";
    return "text-redAccent";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-sectionH2 text-ink">Applications</h2>
        <p className="mt-1 text-sm text-muted">
          Review applicants and manage their status.
        </p>
      </div>

      {/* Job selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-white pl-4 pr-10 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          >
            <option value="">Select a job to view applicants</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job._count?.applications ?? 0} applicants)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        {selectedJobId && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
        )}
      </div>

      {/* Applications list */}
      {!selectedJobId ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">Select a job to view applicants</p>
          <p className="text-sm text-muted mt-1">
            Choose from the dropdown above to see who&apos;s applied.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {applications.length === 0
              ? "No applications yet for this job."
              : "No applicants match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.SUBMITTED;
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={app.id}
                className="rounded-xl bg-white border border-border shadow-card overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brandGreen/10 text-brandGreen font-semibold text-sm">
                      {app.user.firstName[0]}
                      {app.user.lastName[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink">
                          {app.user.firstName} {app.user.lastName}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{app.user.email}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Score badge */}
                  {app.score && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted">AI Score</p>
                        <p className={`text-lg font-bold ${getScoreColor(app.score.overallScore)}`}>
                          {app.score.overallScore}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center"
                        style={{ borderColor: app.score.overallScore >= 60 ? "#22C55E" : app.score.overallScore >= 40 ? "#F97316" : "#EF4444" }}
                      >
                        <Star className={`h-5 w-5 ${getScoreColor(app.score.overallScore)}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4 bg-gray-50/30">
                    {/* Cover letter */}
                    {app.coverLetter && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                          Cover Letter
                        </p>
                        <p className="text-sm text-ink whitespace-pre-wrap">
                          {app.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* Score breakdown */}
                    {app.score && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                          Score Breakdown
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <ScoreBar label="Skills" score={app.score.skillScore} />
                          <ScoreBar label="Experience" score={app.score.experienceScore} />
                          <ScoreBar
                            label="Culture Fit"
                            score={app.score.cultureFitScore ?? 0}
                          />
                        </div>
                        {app.score.reasoning && (
                          <p className="mt-2 text-xs text-muted italic">
                            &ldquo;{app.score.reasoning}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Resume link */}
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brandGreen hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Resume
                      </a>
                    )}

                    {/* Status actions */}
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                        Update Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED", "REJECTED"] as const).map(
                          (status) => {
                            const cfg = STATUS_CONFIG[status];
                            const Icon = cfg.icon;
                            return (
                              <button
                                key={status}
                                onClick={() => void handleStatusChange(app.id, status)}
                                disabled={app.status === status || updatingId === app.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                                  app.status === status
                                    ? "border-brandGreen bg-brandGreen text-white"
                                    : "border-border bg-white text-ink hover:border-brandGreen hover:text-brandGreen"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {cfg.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
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

// ── Score bar sub-component ────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80
      ? "bg-success"
      : score >= 60
      ? "bg-brandGreen"
      : score >= 40
      ? "bg-orangeAccent"
      : "bg-redAccent";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-semibold text-ink">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
