"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
// Note: Backend only has POST /users/company (no PATCH). The Prisma upsert
// on the backend handles update-via-unique userId constraint.
import { useAuth } from "@/components/AuthProvider";
import {
  User,
  Building2,
  Save,
  CheckCircle,
  MapPin,
  Globe,
  Phone,
  Mail,
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
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  company?: CompanyProfile | null;
};

type CompanyProfile = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  foundedYear: number | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  benefits: string[];
};

export default function EmployerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "company">("personal");

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Company form state
  const [companyName, setCompanyName] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyFounded, setCompanyFounded] = useState("");
  const [companyLinkedin, setCompanyLinkedin] = useState("");
  const [companyFacebook, setCompanyFacebook] = useState("");
  const [companyTwitter, setCompanyTwitter] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiGet<UserProfile>("/users/profile");
      setProfile(data);

      // Populate personal form
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setPhone(data.phone ?? "");
      setBio(data.bio ?? "");
      setHeadline(data.headline ?? "");
      setLocation(data.location ?? "");
      setLinkedinUrl(data.linkedinUrl ?? "");
      setGithubUrl(data.githubUrl ?? "");
      setPortfolioUrl(data.portfolioUrl ?? "");

      // Populate company form
      if (data.company) {
        setCompanyName(data.company.name ?? "");
        setCompanyDesc(data.company.description ?? "");
        setCompanyWebsite(data.company.website ?? "");
        setCompanyIndustry(data.company.industry ?? "");
        setCompanySize(data.company.size ?? "");
        setCompanyLocation(data.company.location ?? "");
        setCompanyFounded(data.company.foundedYear?.toString() ?? "");
        setCompanyLinkedin(data.company.linkedinUrl ?? "");
        setCompanyFacebook(data.company.facebookUrl ?? "");
        setCompanyTwitter(data.company.twitterUrl ?? "");
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePersonal() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await apiPatch<UserProfile>("/users/profile", {
        firstName,
        lastName,
        phone: phone || null,
        bio: bio || null,
        headline: headline || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        portfolioUrl: portfolioUrl || null,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCompany() {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        name: companyName,
        description: companyDesc || null,
        website: companyWebsite || null,
        industry: companyIndustry || null,
        size: companySize || null,
        location: companyLocation || null,
        foundedYear: companyFounded ? parseInt(companyFounded, 10) : null,
        linkedinUrl: companyLinkedin || null,
        facebookUrl: companyFacebook || null,
        twitterUrl: companyTwitter || null,
      };

      let updated: CompanyProfile;
      if (profile?.company) {
        // Backend POST /users/company uses upsert keyed on userId —
        // posting again with the same userId updates the existing record.
        updated = await apiPost<CompanyProfile>("/users/company", payload);
      } else {
        updated = await apiPost<CompanyProfile>("/users/company", payload);
      }
      setProfile((prev) => (prev ? { ...prev, company: updated } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save company profile");
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
      {/* Header */}
      <div>
        <h2 className="text-sectionH2 text-ink">Profile & Company</h2>
        <p className="mt-1 text-sm text-muted">
          Manage your personal and company information.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white border border-border p-1 w-fit">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "personal"
              ? "bg-brandGreen text-white"
              : "text-muted hover:bg-gray-100"
          }`}
        >
          <User className="h-4 w-4" />
          Personal Info
        </button>
        <button
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "company"
              ? "bg-brandGreen text-white"
              : "text-muted hover:bg-gray-100"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Company Profile
        </button>
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          Changes saved successfully.
        </div>
      )}

      {/* Personal info form */}
      {activeTab === "personal" && (
        <div className="rounded-xl bg-white border border-border shadow-card p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" value={firstName} onChange={setFirstName} required />
            <Field label="Last Name" value={lastName} onChange={setLastName} required />
          </div>

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

          <Field
            label="Headline"
            value={headline}
            onChange={setHeadline}
            placeholder="e.g. Senior Software Engineer"
          />

          <Field
            label="Bio"
            value={bio}
            onChange={setBio}
            multiline
            placeholder="Tell employers about yourself..."
          />

          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="Addis Ababa, Ethiopia"
            icon={<MapPin className="h-4 w-4" />}
          />

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

          <div className="flex justify-end">
            <button
              onClick={() => void handleSavePersonal()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Company form */}
      {activeTab === "company" && (
        <div className="rounded-xl bg-white border border-border shadow-card p-6 space-y-6">
          <Field
            label="Company Name"
            value={companyName}
            onChange={setCompanyName}
            required
            placeholder="Your company name"
          />

          <Field
            label="Description"
            value={companyDesc}
            onChange={setCompanyDesc}
            multiline
            placeholder="What does your company do?"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Website"
              value={companyWebsite}
              onChange={setCompanyWebsite}
              placeholder="https://..."
              icon={<Globe className="h-4 w-4" />}
            />
            <Field
              label="Industry"
              value={companyIndustry}
              onChange={setCompanyIndustry}
              placeholder="Technology"
            />
            <Field
              label="Company Size"
              value={companySize}
              onChange={setCompanySize}
              placeholder="10-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Location"
              value={companyLocation}
              onChange={setCompanyLocation}
              placeholder="Addis Ababa, Ethiopia"
              icon={<MapPin className="h-4 w-4" />}
            />
            <Field
              label="Founded Year"
              value={companyFounded}
              onChange={setCompanyFounded}
              placeholder="2020"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="LinkedIn"
              value={companyLinkedin}
              onChange={setCompanyLinkedin}
              placeholder="https://linkedin.com/company/..."
              icon={<Globe className="h-4 w-4" />}
            />
            <Field
              label="Facebook"
              value={companyFacebook}
              onChange={setCompanyFacebook}
              placeholder="https://facebook.com/..."
              icon={<Globe className="h-4 w-4" />}
            />
            <Field
              label="Twitter"
              value={companyTwitter}
              onChange={setCompanyTwitter}
              placeholder="https://twitter.com/..."
              icon={<Globe className="h-4 w-4" />}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void handleSaveCompany()}
              disabled={saving || !companyName}
              className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : profile?.company ? "Update Company" : "Create Company"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable field component ───────────────────────────────────────────────

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
            rows={3}
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
