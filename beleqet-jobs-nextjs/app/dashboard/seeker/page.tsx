"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  TrendingUp,
  Star,
  Calendar,
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
  companyName: string | null;
  company: { id: string; name: string; logoUrl: string | null } | null;
  category?: { id: string; slug: string; label: string } | null;
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

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function SeekerOverviewPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  const totalApps = applications.length;
  const interviews = applications.filter(
    (a) => a.status === "INTERVIEW_SCHEDULED" || a.status === "SHORTLISTED",
  ).length;
  const offers = applications.filter((a) => a.status === "OFFERED").length;
  const avgScore =
    applications.filter((a) => a.score).reduce((sum, a) => sum + (a.score?.overallScore ?? 0), 0) /
      (applications.filter((a) => a.score).length || 1);

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sectionH2 text-ink">Welcome back, {user?.firstName}</h2>
        <p className="mt-1 text-muted">Track your job applications and interviews.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={totalApps} icon={FileText} color="bg-brandGreen" />
        <StatCard label="Interviews" value={interviews} icon={Calendar} color="bg-purpleAccent" />
        <StatCard label="Offers" value={offers} icon={CheckCircle} color="bg-success" />
        <StatCard
          label="Avg AI Score"
          value={totalApps > 0 ? `${avgScore.toFixed(1)}%` : "—"}
          icon={TrendingUp}
          color="bg-cyanAccent"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          Browse Jobs
        </Link>
        <Link
          href="/dashboard/seeker/applications"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <FileText className="h-4 w-4" />
          My Applications
        </Link>
        <Link
          href="/dashboard/seeker/profile"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="rounded-xl bg-white border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-cardH3 text-ink">Recent Applications</h3>
          <Link href="/dashboard/seeker/applications" className="text-sm font-medium text-brandGreen hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentApps.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted">
              <FileText className="mx-auto h-8 w-8 text-border mb-2" />
              <p className="text-sm">No applications yet.</p>
              <Link href="/jobs" className="mt-2 inline-block text-sm font-medium text-brandGreen hover:underline">
                Browse jobs
              </Link>
            </div>
          ) : (
            recentApps.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.SUBMITTED;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{app.job.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {app.job.company?.name ?? app.job.companyName ?? "Unknown company"}
                      {app.job.location ? ` · ${app.job.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
