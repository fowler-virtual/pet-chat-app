import type { BootstrapResponse, ChatRequest, ChatResponse, PersonaPreview, PetProfile, SubscriptionPlan, UserSession } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://pet-chat-app.onrender.com';

export class ApiError extends Error {
  status: number;
  errorCode: string;
  detail: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const code = typeof body.error === 'string' ? body.error : 'unknown';
    super(`API error ${status}: ${code}`);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = code;
    this.detail = body;
  }
}

async function requestJson<T>(path: string, init?: RequestInit, authToken?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await response.json();
    } catch {
      // non-JSON error response
    }
    throw new ApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ ok: boolean }> {
  return requestJson('/health');
}

export async function fetchPersonaPreview(pet: PetProfile): Promise<PersonaPreview> {
  return requestJson('/api/persona/preview', {
    method: 'POST',
    body: JSON.stringify({ pet }),
  });
}

export async function registerAnonymous(): Promise<{ session: UserSession }> {
  return requestJson('/api/auth/register', { method: 'POST' });
}

export async function apiIssueTransferCode(authToken: string): Promise<{ transferCode: string; expiresAt: string }> {
  return requestJson('/api/auth/issue-transfer-code', { method: 'POST' }, authToken);
}

export async function apiRedeemTransferCode(code: string): Promise<{ session: UserSession }> {
  return requestJson('/api/auth/redeem-transfer-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function fetchAuthMe(authToken: string): Promise<{ session: UserSession }> {
  return requestJson('/api/auth/me', undefined, authToken);
}

export async function fetchBootstrap(authToken: string): Promise<BootstrapResponse> {
  return requestJson('/api/bootstrap', undefined, authToken);
}

export async function createPet(payload: { pet: PetProfile }, authToken: string): Promise<{ pet: PetProfile }> {
  return requestJson('/api/pets', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, authToken);
}

export async function updatePet(payload: { petId: string; pet: PetProfile }, authToken: string): Promise<{ pet: PetProfile }> {
  return requestJson(`/api/pets/${payload.petId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pet: payload.pet }),
  }, authToken);
}

export async function deletePet(petId: string, authToken: string): Promise<{ ok: boolean }> {
  return requestJson(`/api/pets/${petId}`, {
    method: 'DELETE',
  }, authToken);
}

export async function fetchChatReply(payload: ChatRequest, authToken?: string): Promise<ChatResponse> {
  if (authToken) {
    return requestJson('/api/chat/reply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, authToken);
  }
  return requestJson('/api/chat/reply-guest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(base64Image: string, mimeType: string, authToken: string): Promise<{ url: string }> {
  return requestJson('/api/upload/avatar', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image, mimeType }),
  }, authToken);
}

export async function syncUpload(
  payload: { pets: PetProfile[]; messagesByPetId: Record<string, { id: string; sender: string; text: string; time: string }[]> },
  authToken: string,
): Promise<{ ok: boolean; uploadedCount: number }> {
  return requestJson('/api/sync/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, authToken);
}

export async function subscribePlan(plan: SubscriptionPlan, authToken: string): Promise<{ session: UserSession; checkout: { plan: SubscriptionPlan; status: string } }> {
  return requestJson('/api/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }, authToken);
}

export async function verifyReceipt(
  productId: string,
  receipt: string,
  platform: string,
  authToken: string,
): Promise<{ session: UserSession; verified: boolean; plan: SubscriptionPlan }> {
  return requestJson('/api/billing/verify-receipt', {
    method: 'POST',
    body: JSON.stringify({ productId, receipt, platform }),
  }, authToken);
}
