import type { MockDataState } from '../data/mockData';
import { INITIAL_STATE } from '../data/mockData';
import type { DemoSession } from '../infrastructure/auth/demoAuth';

const STATE_KEY = 'maicontact_state';
const SESSION_KEY = 'maicontact_session';

// ── App state ─────────────────────────────────────────────────────────────────

export function loadState(): MockDataState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return INITIAL_STATE;
    return JSON.parse(raw) as MockDataState;
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: MockDataState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage might be unavailable
  }
}

export function resetState(): void {
  localStorage.removeItem(STATE_KEY);
}

// ── Session ───────────────────────────────────────────────────────────────────

export function loadSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: DemoSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
