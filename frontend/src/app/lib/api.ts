const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.detail?.message ?? body?.detail ?? res.statusText;
    throw new Error(message);
  }

  return res.json();
}

// --- Sessions ---

export interface SessionResponse {
  id: string;
  user_id: string | null;
  title: string | null;
  assignment_name: string | null;
  course_context: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionPayload {
  project_spec_text: string;
  title?: string;
  assignment_name?: string;
  course_context?: string;
}

export function createSession(payload: CreateSessionPayload) {
  return request<SessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --- Teach ---

export interface ContextMessage {
  role: 'student' | 'assistant';
  content: string;
}

export interface TeachRequestPayload {
  session_id: string;
  student_message: string;
  recent_context?: ContextMessage[];
  student_understanding?: 'low' | 'medium' | 'high' | 'unknown';
  want_hint_only?: boolean;
}

export interface TeachResponse {
  assistant_message: string;
  guidance_level: string;
  follow_up_questions: string[];
  should_ask_student_to_explain: boolean;
}

export function teachRespond(payload: TeachRequestPayload) {
  return request<TeachResponse>('/teach/respond', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
