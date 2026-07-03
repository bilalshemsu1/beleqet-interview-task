"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    void (async () => {
      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(response.message);
      } catch (verifyError) {
        setStatus("error");
        setMessage(verifyError instanceof Error ? verifyError.message : "Verification failed.");
      }
    })();
  }, [token]);

  return (
    <div className="container-page py-14 max-w-xl">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-cardHover">
        <h1 className="text-pageH1">Verify Email</h1>
        <p className={`mt-4 text-sm ${status === "success" ? "text-brandGreen" : status === "error" ? "text-redAccent" : "text-muted"}`}>
          {message}
        </p>

        <div className="mt-8">
          <Link href="/login" className="inline-flex items-center rounded-full bg-brandGreen px-5 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container-page py-14 max-w-xl"><div className="rounded-3xl border border-border bg-white p-8 text-muted">Loading…</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
