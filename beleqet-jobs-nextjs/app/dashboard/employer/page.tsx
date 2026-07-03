"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import {
  Briefcase,
  FileText,
  Users,
  Bell,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type JobListItem = {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  featured: boolean;
  createdAt: string;
  _count?: { applications: number };
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
};

// ── Stat card component ────────────────────────────────────────────────────

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

// ── Main page ──────────────────────────────────────────────────────────────

export default function EmployerOverviewPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsData, notifData, profileData] = await Promise.allSettled([
          apiGet<{ items: JobListItem[]; total: number }>("/jobs/my"),
          apiGet<Notification[]>("/users/notifications"),
          apiGet<UserProfile>("/users/profile"),
        ]);

        if (jobsData.status === "fulfilled") {
          setJobs(jobsData.value.items ?? []);
        }
        if (notifData.status === "fulfilled") {
          setNotifications(notifData.value ?? []);
        }
        if (profileData.status === "fulfilled") {
          setProfile(profileData.value);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED").length;
  const draftJobs = jobs.filter((j) => j.status === "DRAFT").length;
  const totalApplications = jobs.reduce(
    (sum, j) => sum + (j._count?.applications ?? 0),
    0,
  );
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentNotifs = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-sectionH2 text-ink">
          Welcome back, {user?.firstName}
        </h2>
        <p className="mt-1 text-muted">
          Here&apos;s what&apos;s happening with your job listings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Published Jobs"
          value={publishedJobs}
          icon={Briefcase}
          color="bg-brandGreen"
        />
        <StatCard
          label="Total Applications"
          value={totalApplications}
          icon={FileText}
          color="bg-cyanAccent"
        />
        <StatCard
          label="Draft Jobs"
          value={draftJobs}
          icon={Clock}
          color="bg-orangeAccent"
        />
        <StatCard
          label="Unread Notifications"
          value={unreadNotifs}
          icon={Bell}
          color="bg-purpleAccent"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/employer/jobs"
          className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          Manage Jobs
        </Link>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
        <Link
          href="/dashboard/employer/profile"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <Users className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      {/* Two-column layout: Recent Jobs + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="rounded-xl bg-white border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-cardH3 text-ink">Recent Jobs</h3>
            <Link
              href="/dashboard/employer/jobs"
              className="text-sm font-medium text-brandGreen hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentJobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted">
                <Briefcase className="mx-auto h-8 w-8 text-border mb-2" />
                <p className="text-sm">No jobs posted yet.</p>
                <Link
                  href="/post-job"
                  className="mt-2 inline-block text-sm font-medium text-brandGreen hover:underline"
                >
                  Post your first job
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {job.location} · {job.type} · {job._count?.applications ?? 0} applicants
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === "PUBLISHED"
                        ? "bg-success/10 text-success"
                        : job.status === "DRAFT"
                        ? "bg-orangeAccent/10 text-orangeAccent"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="rounded-xl bg-white border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-cardH3 text-ink">Notifications</h3>
            <Link
              href="/dashboard/employer/notifications"
              className="text-sm font-medium text-brandGreen hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentNotifs.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted">
                <Bell className="mx-auto h-8 w-8 text-border mb-2" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              recentNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-3 hover:bg-gray-50 transition-colors ${
                    !notif.read ? "bg-brandGreen/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brandGreen" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{notif.title}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-xs text-muted/60 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
