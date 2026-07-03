"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiPost } from "@/lib/api-client";
import { Send, CheckCircle, X } from "lucide-react";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleClick() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setOpen(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiPost("/applications", {
        jobId,
        coverLetter: coverLetter.trim() || undefined,
        resumeUrl: resumeUrl.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setCoverLetter("");
    setResumeUrl("");
    setError(null);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors"
      >
        Apply Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            {success ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />
                <h3 className="text-lg font-bold text-ink">Application Submitted</h3>
                <p className="text-sm text-muted mt-2">
                  Your application has been sent to the employer. You can track its status in your dashboard.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-bold text-ink">Apply for this job</h3>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-muted hover:text-ink transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {error && (
                    <div className="rounded-lg bg-redAccent/10 px-4 py-3 text-sm text-redAccent font-medium">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-ink">Cover Letter</label>
                    <p className="text-xs text-muted mb-1.5">Tell the employer why you&apos;re a great fit (optional, min 50 characters if provided).</p>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      placeholder="I am writing to express my interest in this position. I have over 5 years of experience..."
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-brandGreen resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink">Resume URL</label>
                    <p className="text-xs text-muted mb-1.5">Link to your CV/Resume (Google Drive, Dropbox, etc.)</p>
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-brandGreen"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
