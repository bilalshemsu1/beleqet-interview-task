"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import {
  User,
  Save,
  CheckCircle,
  MapPin,
  Globe,
  Phone,
  Mail,
  X,
  Plus,
  Briefcase,
} from "lucide-react";

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  defaultResumeUrl: string | null;
};

export default function FreelancerProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<UserProfile>("/users/profile");
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPhone(data.phone ?? "");
        setBio(data.bio ?? "");
        setHeadline(data.headline ?? "");
        setLocation(data.location ?? "");
        setSkills(data.skills ?? []);
        setLinkedinUrl(data.linkedinUrl ?? "");
        setGithubUrl(data.githubUrl ?? "");
        setPortfolioUrl(data.portfolioUrl ?? "");
        setResumeUrl(data.defaultResumeUrl ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await apiPatch("/users/profile", {
        firstName,
        lastName,
        phone: phone || null,
        bio: bio || null,
        headline: headline || null,
        location: location || null,
        skills,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        portfolioUrl: portfolioUrl || null,
        defaultResumeUrl: resumeUrl || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sectionH2 text-ink">Freelancer Profile</h2>
        <p className="mt-1 text-sm text-muted">
          Showcase your skills and experience to attract better opportunities.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          Profile updated successfully.
        </div>
      )}

      <div className="rounded-xl bg-white border border-border shadow-card p-6 space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={firstName} onChange={setFirstName} required />
          <Field label="Last Name" value={lastName} onChange={setLastName} required />
        </div>

        {/* Email (read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Email"
            value={user?.email ?? ""}
            onChange={() => {}}
            disabled
            icon={<Mail className="h-4 w-4" />}
          />
          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="+251 9XX XXX XXX"
            icon={<Phone className="h-4 w-4" />}
          />
        </div>

        {/* Headline */}
        <Field
          label="Headline"
          value={headline}
          onChange={setHeadline}
          placeholder="e.g. Full-Stack Developer | React & Node.js"
        />

        {/* Bio */}
        <Field
          label="Bio"
          value={bio}
          onChange={setBio}
          multiline
          placeholder="Tell clients about your expertise, approach, and what makes you unique..."
        />

        {/* Location */}
        <Field
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="Addis Ababa, Ethiopia"
          icon={<MapPin className="h-4 w-4" />}
        />

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">
            Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-brandGreen/10 px-3 py-1 text-xs font-medium text-brandGreen"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-redAccent transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill and press Enter"
              className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
            <button
              onClick={addSkill}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="LinkedIn"
            value={linkedinUrl}
            onChange={setLinkedinUrl}
            placeholder="https://linkedin.com/in/..."
            icon={<Globe className="h-4 w-4" />}
          />
          <Field
            label="GitHub"
            value={githubUrl}
            onChange={setGithubUrl}
            placeholder="https://github.com/..."
            icon={<Globe className="h-4 w-4" />}
          />
          <Field
            label="Portfolio"
            value={portfolioUrl}
            onChange={setPortfolioUrl}
            placeholder="https://..."
            icon={<Globe className="h-4 w-4" />}
          />
        </div>

        {/* Resume */}
        <Field
          label="Resume URL"
          value={resumeUrl}
          onChange={setResumeUrl}
          placeholder="https://..."
          icon={<Briefcase className="h-4 w-4" />}
        />

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable field ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  multiline,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink mb-1.5">
        {label}
        {required && <span className="text-redAccent ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            className={`w-full rounded-lg border border-border bg-white py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none ${
              icon ? "pl-10 pr-4" : "px-4"
            }`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full rounded-lg border border-border bg-white py-2.5 text-sm outline-none focus:border-brandGreen transition-colors ${
              icon ? "pl-10 pr-4" : "px-4"
            } ${disabled ? "bg-gray-50 text-muted cursor-not-allowed" : ""}`}
          />
        )}
      </div>
    </div>
  );
}
