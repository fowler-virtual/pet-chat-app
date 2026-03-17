import { fetchChatReply, ApiError } from './api';
import { createMockReply } from './petPersona';
import type { ChatRequest, ChatResponse } from '../types';

export async function sendPetChatMessage(request: ChatRequest, authToken?: string): Promise<ChatResponse> {
  try {
    return await fetchChatReply(request, authToken);
  } catch (error) {
    // Re-throw limit errors so the UI can show upgrade prompts
    if (error instanceof ApiError && (error.status === 429 || error.status === 403)) {
      throw error;
    }
    // Fall through to local mock reply when the server is offline.
  }

  return {
    provider: 'mock',
    text: createMockReply(request.pet, request.message),
    sessionKey: request.pet.sessionKey,
  };
}
