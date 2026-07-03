"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createFreelanceJob, getFreelanceCategories, type FreelanceCategory } from "@/lib/freelance";

export default function PostFreelanceJobPage() {
  const router = useRouter();
  const { status, session } = useAuth();
  const [categories, setCategories] = useState<FreelanceCategory[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [pricingType, setPricingType] = useState("FIXED");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [skills, setSkills] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFreelanceCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load categories."));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!session || status !== "authenticated") {
      setError("Please log in to post a freelance gig.");
      setLoading(false);
      return;
    }

    try {
      const response = await createFreelanceJob(session, {
        title,
        description,
        categoryId,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        pricingType,
        deadlineDays: Number(deadlineDays),
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        locationPreference: locationPreference || undefined,
        experienceLevel: experienceLevel || undefined,
      });

      setMessage("Your gig has been created successfully.");
      router.push(`/freelance/${response.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-14 max-w-3xl">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-cardHover">
        <h1 className="text-pageH1">Post a Freelance Gig</h1>
        <p className="text-muted mt-3">Create a project brief and receive bids from freelancers.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink">Title</label>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink">Description</label>
            <textarea required rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink">Category</label>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white">
                {categories.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Pricing Type</label>
              <select value={pricingType} onChange={(event) => setPricingType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white">
                <option value="FIXED">Fixed</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink">Minimum Budget</label>
              <input required type="number" min="1" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Maximum Budget</label>
              <input required type="number" min="1" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink">Deadline Days</label>
              <input required type="number" min="1" value={deadlineDays} onChange={(event) => setDeadlineDays(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Skills</label>
              <input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Figma, React, SEO" className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink">Location Preference</label>
              <input value={locationPreference} onChange={(event) => setLocationPreference(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Experience Level</label>
              <input value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen" />
            </div>
          </div>

          {message && <p className="text-sm text-brandGreen font-medium">{message}</p>}
          {error && <p className="text-sm text-redAccent font-medium">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60">
            {loading ? "Please wait..." : "Create Gig"}
          </button>
        </form>
      </div>
    </div>
  );
}
