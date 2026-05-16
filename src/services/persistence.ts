import type { MockDataState } from '../data/mockData';
import { INITIAL_STATE } from '../data/mockData';

const STATE_KEY = 'maicontact_state';

// ── App state (localStorage cache — Supabase is the authoritative source) ────

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
