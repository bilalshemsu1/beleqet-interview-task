"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiDelete, apiPatch } from "@/lib/api-client";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  status: string;
  featured: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
  category?: { id: string; label: string };
};

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await apiGet<{ items: Job[]; total: number }>("/jobs/my");
      setJobs(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    setDeletingId(id);
    try {
      await apiDelete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const updated = await apiPatch<Job>(`/jobs/${id}`, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: updated.status } : j)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const filtered = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: jobs.length,
    PUBLISHED: jobs.filter((j) => j.status === "PUBLISHED").length,
    DRAFT: jobs.filter((j) => j.status === "DRAFT").length,
    CLOSED: jobs.filter((j) => j.status === "CLOSED").length,
  };

  function formatSalary(job: Job) {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = (n: number) => n.toLocaleString();
    if (job.salaryMin && job.salaryMax) {
      return `${job.currency ?? "ETB"} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    }
    if (job.salaryMin) return `From ${job.currency ?? "ETB"} ${fmt(job.salaryMin)}`;
    return `Up to ${job.currency ?? "ETB"} ${fmt(job.salaryMax!)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sectionH2 text-ink">My Jobs</h2>
          <p className="mt-1 text-sm text-muted">
            Manage your posted job listings.
          </p>
        </div>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg bg-white border border-border p-1">
          {(["ALL", "PUBLISHED", "DRAFT", "CLOSED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {status === "ALL" ? "All" : status} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {jobs.length === 0
              ? "You haven't posted any jobs yet."
              : "No jobs match your filters."}
          </p>
          {jobs.length === 0 && (
            <Link
              href="/post-job"
              className="mt-3 inline-block text-sm font-medium text-brandGreen hover:underline"
            >
              Post your first job
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="rounded-xl bg-white border border-border p-5 shadow-card hover:shadow-cardHover transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-cardH3 text-ink">{job.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.status === "PUBLISHED"
                          ? "bg-success/10 text-success"
                          : job.status === "DRAFT"
                          ? "bg-orangeAccent/10 text-orangeAccent"
                          : "bg-muted/10 text-muted"
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.featured && (
                      <span className="inline-flex items-center rounded-full bg-brandGreen/10 px-2 py-0.5 text-xs font-medium text-brandGreen">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span>{job.type}</span>
                    {job.category && <span>{job.category.label}</span>}
                    {formatSalary(job) && <span>{formatSalary(job)}</span>}
                  </div>

                  <p className="mt-2 text-sm text-muted line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job._count?.applications ?? 0} applicants
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
                    title={
                      job.status === "PUBLISHED"
                        ? "Unpublish (set to draft)"
                        : "Publish"
                    }
                  >
                    {job.status === "PUBLISHED" ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Publish
                      </>
                    )}
                  </button>

                  <Link
                    href={`/dashboard/employer/applications?jobId=${job.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Applicants
                  </Link>

                  <button
                    onClick={() => void handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-redAccent hover:bg-redAccent/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === job.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
