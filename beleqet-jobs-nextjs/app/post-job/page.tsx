"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiPost } from "@/lib/api-client";
import { CheckCircle } from "lucide-react";

type JobCategory = { id: string; slug: string; label: string };

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CONTRACT", label: "Contract" },
] as const;

export default function PostJobPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("FULL_TIME");
  const [categoryId, setCategoryId] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [tags, setTags] = useState("");

  // Redirect non-employers
  useEffect(() => {
    if (status === "anonymous") router.push("/login");
    if (user && user.role !== "EMPLOYER" && user.role !== "ADMIN") router.push("/dashboard/" + user.role.toLowerCase().replace("_", "-"));
  }, [status, user, router]);

  // Load categories
  useEffect(() => {
    apiGet<JobCategory[]>("/jobs/categories", { noAuth: true })
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!title.trim() || !description.trim() || !location.trim() || !categoryId) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        type,
        categoryId,
      };

      if (requirements.trim()) payload.requirements = requirements.trim();
      if (salaryMin) payload.salaryMin = Number(salaryMin);
      if (salaryMax) payload.salaryMax = Number(salaryMax);
      if (deadline) payload.deadline = deadline;
      if (vacancies) payload.vacancies = Number(vacancies);
      if (experienceLevel) payload.experienceLevel = experienceLevel;
      if (tags.trim()) {
        payload.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }

      const job = await apiPost<{ id: string }>("/jobs", payload);
      setSuccess(true);
      setTimeout(() => router.push(`/jobs/${job.id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-pageH1">Post a Job</h1>
      <p className="text-muted mt-4 leading-relaxed">
        Reach thousands of verified job seekers across Ethiopia. Fill out the form below to publish your listing.
      </p>

      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success font-medium">
          <CheckCircle className="h-4 w-4" />
          Job created successfully. Redirecting...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-redAccent/10 px-4 py-3 text-sm text-redAccent font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-5">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-ink">
            Job Title <span className="text-redAccent">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior React Developer"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-ink">
            Description <span className="text-redAccent">*</span>
          </label>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen resize-none"
          />
        </div>

        {/* Location + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">
              Location <span className="text-redAccent">*</span>
            </label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Addis Ababa"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">
              Job Type <span className="text-redAccent">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white"
            >
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>{jt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-ink">
            Category <span className="text-redAccent">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Salary range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Minimum Salary (ETB)</label>
            <input
              type="number"
              min="0"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 30000"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Maximum Salary (ETB)</label>
            <input
              type="number"
              min="0"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 60000"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        {/* Deadline + Vacancies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Application Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Vacancies</label>
            <input
              type="number"
              min="1"
              value={vacancies}
              onChange={(e) => setVacancies(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        {/* Experience + Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Experience Level</label>
            <input
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              placeholder="e.g. Senior, Mid-Level"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="text-xs font-semibold text-ink">Requirements</label>
          <textarea
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="List the required qualifications, skills, and experience..."
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60"
        >
          {loading ? "Publishing..." : success ? "Published!" : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}
