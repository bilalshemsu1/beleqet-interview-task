import type { AuthSession } from "@/lib/auth";

const FREELANCE_API_BASE_URL = "/api/freelance";

type RequestOptions = RequestInit & {
  accessToken?: string;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${FREELANCE_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const error = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(error.message)) {
        message = error.message.join(", ");
      } else if (typeof error.message === "string") {
        message = error.message;
      }
    } catch {
      // fall back to the generic message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type SubmitBidPayload = {
  amount: number;
  timelineDays: number;
  coverLetter: string;
};

export type MyBid = {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  createdAt: string;
  freelanceJob: {
    id: string;
    title: string;
    status: string;
    currency: string;
    category: {
      id: string;
      slug: string;
      label: string;
    };
  };
};

export type CreateFreelanceJobPayload = {
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  pricingType?: string;
  deadlineDays: number;
  skills: string[];
  locationPreference?: string;
  experienceLevel?: string;
  attachments?: string[];
};

export type FreelanceJobCreateResponse = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  clientId: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  pricingType: string;
  deadlineDays: number;
  skills: string[];
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  experienceLevel?: string | null;
  locationPreference?: string | null;
  category: {
    id: string;
    slug: string;
    label: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type ContractDeliverable = {
  id: string;
  fileUrl?: string | null;
  notes?: string | null;
  submittedAt: string;
};

export type ContractMilestone = {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  deadline: string;
  status: string;
  approvedAt?: string | null;
  deliverables: ContractDeliverable[];
};

export type FreelanceContract = {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  freelanceJob: {
    id: string;
    title: string;
    status: string;
    currency: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  milestones: ContractMilestone[];
};

export async function submitBid(session: AuthSession, gigId: string, payload: SubmitBidPayload) {
  return request<{ id: string; amount: number; timelineDays: number; coverLetter: string; status: string }>(`/jobs/${gigId}/bids`, {
    method: "POST",
    accessToken: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export async function createFreelanceJob(session: AuthSession, payload: CreateFreelanceJobPayload) {
  return request<FreelanceJobCreateResponse>("/jobs", {
    method: "POST",
    accessToken: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getMyBids(session: AuthSession) {
  return request<MyBid[]>("/my-bids", {
    accessToken: session.accessToken,
  });
}

export async function acceptBid(session: AuthSession, bidId: string) {
  return request<{ id: string }>(`/bids/${bidId}/accept`, {
    method: "PATCH",
    accessToken: session.accessToken,
  });
}

export async function getContract(session: AuthSession, contractId: string) {
  return request<FreelanceContract>(`/contracts/${contractId}`, {
    accessToken: session.accessToken,
  });
}

export async function approveMilestone(session: AuthSession, milestoneId: string) {
  return request<{ id: string; status: string }>(`/milestones/${milestoneId}/approve`, {
    method: "PATCH",
    accessToken: session.accessToken,
  });
}

export type SubmitDeliverablePayload = {
  fileUrl?: string;
  notes?: string;
};

export async function submitDeliverable(session: AuthSession, milestoneId: string, payload: SubmitDeliverablePayload) {
  return request<{ id: string; milestoneId: string; fileUrl?: string | null; notes?: string | null; submittedAt: string }>(
    `/milestones/${milestoneId}/deliverables`,
    {
      method: "POST",
      accessToken: session.accessToken,
      body: JSON.stringify(payload),
    },
  );
}

export type CreateDisputePayload = {
  reason: string;
  evidenceUrls?: string[];
};

export async function createDispute(session: AuthSession, contractId: string, payload: CreateDisputePayload) {
  return request<{ id: string; contractId: string; reason: string; status: string }>(
    `/contracts/${contractId}/disputes`,
    {
      method: "POST",
      accessToken: session.accessToken,
      body: JSON.stringify(payload),
    },
  );
}

export type FreelanceCategory = {
  id: string;
  slug: string;
  label: string;
  icon?: string | null;
};

export async function getFreelanceCategories() {
  return request<FreelanceCategory[]>("/categories");
}
